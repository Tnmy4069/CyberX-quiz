'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/user';
import { Quiz } from '@/models/quiz';
import { Question } from '@/models/question';
import { Participant } from '@/models/participant';
import { Submission } from '@/models/submission';
import { AuditLog } from '@/models/auditLog';
import { AppSettings } from '@/models/settings';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

// --- AUTH HELPER ---
async function checkAuth(requiredRole?: 'admin' | 'super-admin') {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  if (requiredRole && session.user.role !== requiredRole && session.user.role !== 'super-admin') {
    throw new Error('Forbidden');
  }
  return session;
}

// --- AUDIT LOGGER ---
export async function logAction(action: string, user: string) {
  try {
    await connectToDatabase();
    await AuditLog.create({ action, user });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

// ==========================================
// SUPER ADMIN: ADMINS MANAGEMENT (CRUD)
// ==========================================

export async function createAdmin(data: { name: string; email: string; passwordHash: string }) {
  const session = await checkAuth('super-admin');
  await connectToDatabase();

  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    throw new Error('An admin with this email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.passwordHash, salt);

  const newAdmin = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role: 'admin',
    status: 'active',
  });

  await logAction(`Created admin ${data.email}`, session.user.email!);
  revalidatePath('/super-admin/admins');

  return { success: true, adminId: newAdmin._id.toString() };
}

export async function updateAdmin(
  id: string,
  data: { name: string; email: string; status: 'active' | 'disabled'; password?: string }
) {
  const session = await checkAuth('super-admin');
  await connectToDatabase();

  const adminUser = await User.findById(id);
  if (!adminUser) {
    throw new Error('Admin not found.');
  }

  adminUser.name = data.name;
  adminUser.email = data.email.toLowerCase();
  adminUser.status = data.status;

  if (data.password && data.password.trim() !== '') {
    const salt = await bcrypt.genSalt(10);
    adminUser.passwordHash = await bcrypt.hash(data.password, salt);
  }

  await adminUser.save();
  await logAction(`Updated admin ${data.email} (Status: ${data.status})`, session.user.email!);
  revalidatePath('/super-admin/admins');

  return { success: true };
}

export async function toggleAdminStatus(id: string) {
  const session = await checkAuth('super-admin');
  await connectToDatabase();

  const adminUser = await User.findById(id);
  if (!adminUser) {
    throw new Error('Admin not found.');
  }

  adminUser.status = adminUser.status === 'active' ? 'disabled' : 'active';
  await adminUser.save();

  await logAction(`Toggled status of admin ${adminUser.email} to ${adminUser.status}`, session.user.email!);
  revalidatePath('/super-admin/admins');

  return { success: true, status: adminUser.status };
}

export async function deleteAdmin(id: string) {
  const session = await checkAuth('super-admin');
  await connectToDatabase();

  const adminUser = await User.findById(id);
  if (!adminUser) {
    throw new Error('Admin not found.');
  }

  await User.findByIdAndDelete(id);
  await logAction(`Deleted admin ${adminUser.email}`, session.user.email!);
  revalidatePath('/super-admin/admins');

  return { success: true };
}

// ==========================================
// ADMIN: QUIZ MANAGEMENT (CRUD)
// ==========================================

export async function createQuiz(data: {
  title: string;
  description: string;
  accessCode: string;
  duration: number;
  startDate: string;
  endDate: string;
  totalMarks: number;
  negativeMarking: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showLeaderboard?: boolean;
}) {
  const session = await checkAuth('admin');
  await connectToDatabase();

  const existingQuiz = await Quiz.findOne({ accessCode: data.accessCode.toUpperCase() });
  if (existingQuiz) {
    throw new Error('Access code already in use. Please choose a unique code.');
  }

  const newQuiz = await Quiz.create({
    ...data,
    accessCode: data.accessCode.toUpperCase(),
    active: false,
    createdBy: session.user.role === 'super-admin' ? 'super-admin' : session.user.id,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
  });

  await logAction(`Created quiz "${data.title}" (${data.accessCode})`, session.user.email!);
  revalidatePath('/admin/quizzes');

  return { success: true, quizId: newQuiz._id.toString() };
}

export async function updateQuiz(
  id: string,
  data: {
    title: string;
    description: string;
    accessCode: string;
    duration: number;
    startDate: string;
    endDate: string;
    totalMarks: number;
    negativeMarking: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showLeaderboard?: boolean;
  }
) {
  const session = await checkAuth('admin');
  await connectToDatabase();

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    throw new Error('Quiz not found.');
  }

  const existingQuiz = await Quiz.findOne({
    accessCode: data.accessCode.toUpperCase(),
    _id: { $ne: id },
  });
  if (existingQuiz) {
    throw new Error('Access code already in use by another quiz.');
  }

  quiz.title = data.title;
  quiz.description = data.description;
  quiz.accessCode = data.accessCode.toUpperCase();
  quiz.duration = data.duration;
  quiz.startDate = new Date(data.startDate);
  quiz.endDate = new Date(data.endDate);
  quiz.totalMarks = data.totalMarks;
  quiz.negativeMarking = data.negativeMarking;
  quiz.shuffleQuestions = data.shuffleQuestions;
  quiz.shuffleOptions = data.shuffleOptions;
  quiz.showLeaderboard = data.showLeaderboard ?? true;

  await quiz.save();
  await logAction(`Updated quiz "${data.title}"`, session.user.email!);
  revalidatePath(`/admin/quizzes/${id}`);
  revalidatePath('/admin/quizzes');

  return { success: true };
}

export async function toggleQuizActive(id: string) {
  const session = await checkAuth('admin');
  await connectToDatabase();

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    throw new Error('Quiz not found.');
  }

  quiz.active = !quiz.active;
  await quiz.save();

  await logAction(`Toggled status of quiz "${quiz.title}" to ${quiz.active ? 'active' : 'inactive'}`, session.user.email!);
  revalidatePath(`/admin/quizzes/${id}`);
  revalidatePath('/admin/quizzes');
  revalidatePath('/admin69');

  return { success: true, active: quiz.active };
}

export async function deleteQuiz(id: string) {
  const session = await checkAuth('admin');
  await connectToDatabase();

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    throw new Error('Quiz not found.');
  }

  await Quiz.findByIdAndDelete(id);
  // Delete all associated questions and submissions
  await Question.deleteMany({ quizId: id });
  await Submission.deleteMany({ quizId: id });

  await logAction(`Deleted quiz "${quiz.title}" and its questions/submissions`, session.user.email!);
  revalidatePath('/admin/quizzes');

  return { success: true };
}

// ==========================================
// ADMIN: QUESTION MANAGEMENT
// ==========================================

export async function saveQuestions(
  quizId: string,
  questionsData: Array<{
    _id?: string;
    type: 'mcq' | 'msq' | 'true_false' | 'short_text';
    question: string;
    options: string[];
    correctAnswer: string[];
    marks: number;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
  }>
) {
  const session = await checkAuth('admin');
  await connectToDatabase();

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw new Error('Quiz not found.');
  }

  // 1. Delete questions that are no longer in the list
  const incomingIds = questionsData
    .filter((q) => q._id && mongoose.Types.ObjectId.isValid(q._id))
    .map((q) => new mongoose.Types.ObjectId(q._id));

  await Question.deleteMany({ quizId, _id: { $nin: incomingIds } });

  let totalMarks = 0;

  // 2. Insert or update the questions
  for (const q of questionsData) {
    totalMarks += q.marks;

    if (q._id && mongoose.Types.ObjectId.isValid(q._id)) {
      // Update existing
      await Question.findByIdAndUpdate(q._id, {
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        difficulty: q.difficulty,
        tags: q.tags,
      });
    } else {
      // Create new
      await Question.create({
        quizId,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        difficulty: q.difficulty,
        tags: q.tags,
      });
    }
  }

  // 3. Update the Quiz's totalMarks automatically based on questions sum
  quiz.totalMarks = totalMarks;
  await quiz.save();

  await logAction(`Saved questions for quiz "${quiz.title}" (Total Marks: ${totalMarks})`, session.user.email!);
  revalidatePath(`/admin/quizzes/${quizId}`);
  revalidatePath('/admin/quizzes');

  return { success: true };
}

// ==========================================
// STUDENT FLOW ACTIONS
// ==========================================

// Validate access code entered by student
export async function validateAccessCode(accessCode: string) {
  await connectToDatabase();
  const quiz = await Quiz.findOne({ accessCode: accessCode.toUpperCase().trim() });

  if (!quiz) {
    throw new Error('Invalid quiz access code.');
  }

  if (!quiz.active) {
    throw new Error('This quiz is not active currently.');
  }

  const now = new Date();
  if (now < quiz.startDate) {
    throw new Error(`This quiz has not started yet. Starts at: ${quiz.startDate.toLocaleString()}`);
  }

  if (now > quiz.endDate) {
    throw new Error(`This quiz has ended. Ended at: ${quiz.endDate.toLocaleString()}`);
  }

  return {
    quizId: quiz._id.toString(),
    title: quiz.title,
    description: quiz.description,
    duration: quiz.duration,
  };
}

// Helper to generate Submission ID: QZ-YYYYMMDD-XXXXXX
async function generateUniqueSubmissionId(): Promise<string> {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  let attempts = 0;
  while (attempts < 10) {
    const randomNum = String(Math.floor(100000 + Math.random() * 900000));
    const candidateId = `QZ-${dateStr}-${randomNum}`;
    const exists = await Submission.findOne({ submissionId: candidateId });
    if (!exists) {
      return candidateId;
    }
    attempts++;
  }
  return `QZ-${dateStr}-${Date.now().toString().slice(-6)}`;
}

// Register student, create participant & generate submission
export async function registerParticipant(
  quizId: string,
  studentDetails: {
    name: string;
    rollNumber: string;
    email: string;
    mobile: string;
    class: string;
  }
) {
  await connectToDatabase();

  const quiz = await Quiz.findById(quizId);
  if (!quiz || !quiz.active) {
    throw new Error('Quiz not available.');
  }

  // 1. Create or find participant
  // We can locate by email and rollNumber to group them or create new entries
  let participant = await Participant.findOne({
    email: studentDetails.email.toLowerCase().trim(),
    rollNumber: studentDetails.rollNumber.trim(),
  });

  if (!participant) {
    participant = await Participant.create({
      name: studentDetails.name.trim(),
      rollNumber: studentDetails.rollNumber.trim(),
      email: studentDetails.email.toLowerCase().trim(),
      mobile: studentDetails.mobile.trim(),
      class: studentDetails.class.trim(),
    });
  }

  // 2. Check if a submission already exists for this participant and quiz
  const existingSubmission = await Submission.findOne({
    quizId,
    participantId: participant._id,
  });

  if (existingSubmission) {
    if (existingSubmission.status === 'submitted' || existingSubmission.status === 'time-up') {
      throw new Error('You have already submitted this quiz.');
    }
    // If it's in-progress, allow resuming it!
    return {
      submissionId: existingSubmission.submissionId,
      participantId: participant._id.toString(),
      status: existingSubmission.status,
    };
  }

  // 3. Create a new submission
  const submissionId = await generateUniqueSubmissionId();
  await Submission.create({
    submissionId,
    quizId,
    participantId: participant._id,
    score: 0,
    answers: {},
    tabSwitchCount: 0,
    fullscreenExitCount: 0,
    submittedAt: new Date(),
    status: 'in-progress',
  });

  return {
    submissionId,
    participantId: participant._id.toString(),
    status: 'in-progress',
  };
}

// Fetch Quiz & Questions details for starting
export async function getQuizForTaker(accessCode: string, submissionId: string) {
  await connectToDatabase();

  const quiz = await Quiz.findOne({ accessCode: accessCode.toUpperCase().trim() }).lean();
  if (!quiz || !quiz.active) {
    throw new Error('Quiz is not active or does not exist.');
  }

  // Verify submission is valid and matches quiz
  const submission = await Submission.findOne({ submissionId });
  if (!submission || submission.quizId.toString() !== (quiz._id as any).toString()) {
    throw new Error('Invalid quiz session details.');
  }

  if (submission.status !== 'in-progress') {
    throw new Error('This quiz session has already been submitted.');
  }

  // Fetch questions (hide correctAnswer from client)
  const questions = await Question.find({ quizId: quiz._id }).lean();

  const sanitizedQuestions = questions.map((q) => {
    return {
      _id: (q._id as any).toString(),
      type: q.type,
      question: q.question,
      options: q.options,
      marks: q.marks,
    };
  });

  // Shuffle questions if requested
  if (quiz.shuffleQuestions) {
    sanitizedQuestions.sort(() => Math.random() - 0.5);
  }

  // Shuffle options for MCQ/MSQ if requested
  if (quiz.shuffleOptions) {
    sanitizedQuestions.forEach((q) => {
      if (q.options && q.options.length > 0) {
        q.options = [...q.options].sort(() => Math.random() - 0.5);
      }
    });
  }

  if (!submission) {
    throw new Error('Submission details not found.');
  }
  const elapsedSeconds = Math.floor((Date.now() - (submission as any).createdAt.getTime()) / 1000);
  const timeLeftSeconds = Math.max(0, quiz.duration * 60 - elapsedSeconds);

  return {
    quiz: {
      _id: (quiz._id as any).toString(),
      title: quiz.title,
      description: quiz.description,
      duration: quiz.duration,
      startDate: quiz.startDate.toISOString(),
      endDate: quiz.endDate.toISOString(),
    },
    questions: sanitizedQuestions,
    savedAnswers: submission.answers || {},
    tabSwitchCount: submission.tabSwitchCount || 0,
    fullscreenExitCount: submission.fullscreenExitCount || 0,
    timeLeftSeconds,
  };
}

// Auto-save and Final Submission grading action
export async function saveAnswers(
  submissionId: string,
  answers: Record<string, string[]>,
  cheatStats: { tabSwitchCount: number; fullscreenExitCount: number },
  isFinal: boolean
) {
  await connectToDatabase();

  const submission = await Submission.findOne({ submissionId });
  if (!submission) {
    throw new Error('Submission details not found.');
  }

  if (submission.status !== 'in-progress') {
    return {
      success: true,
      status: submission.status,
      submissionId: submission.submissionId,
      score: submission.score,
    };
  }

  // Update in-progress states
  submission.answers = answers;
  submission.tabSwitchCount = cheatStats.tabSwitchCount;
  submission.fullscreenExitCount = cheatStats.fullscreenExitCount;

  if (isFinal) {
    // Grade the quiz submission
    const questions = await Question.find({ quizId: submission.quizId });
    const quiz = await Quiz.findById(submission.quizId);
    let finalScore = 0;

    for (const q of questions) {
      const qId = q._id.toString();
      const studentAnswers = answers[qId] || []; // String[]
      const correctAnswers = q.correctAnswer || []; // String[]

      let isCorrect = false;

      if (q.type === 'mcq' || q.type === 'true_false') {
        // Single option check
        isCorrect =
          studentAnswers.length === 1 &&
          correctAnswers.length === 1 &&
          studentAnswers[0] === correctAnswers[0];
      } else if (q.type === 'msq') {
        // Multiple choice check (sets must match exactly)
        isCorrect =
          studentAnswers.length === correctAnswers.length &&
          studentAnswers.every((val) => correctAnswers.includes(val)) &&
          correctAnswers.every((val) => studentAnswers.includes(val));
      } else if (q.type === 'short_text') {
        // Short text comparison - case insensitive, trimmed comparison with any correct answer option
        const studentText = studentAnswers[0]?.trim().toLowerCase() || '';
        isCorrect = correctAnswers.some(
          (correctOpt) => correctOpt.trim().toLowerCase() === studentText
        );
      }

      if (isCorrect) {
        finalScore += q.marks;
      } else {
        // Apply negative marking if configured on quiz
        if (quiz?.negativeMarking) {
          // Standard penalty is 25% of the question marks
          finalScore -= q.marks * 0.25;
        }
      }
    }

    // Cap minimum score to 0
    submission.score = Math.max(0, finalScore);
    submission.status = 'submitted';
    submission.submittedAt = new Date();
  }

  await submission.save();

  return {
    success: true,
    status: submission.status,
    submissionId: submission.submissionId,
    score: submission.score,
  };
}

// Fetch success page details
export async function getSubmissionSuccessDetails(submissionId: string) {
  await connectToDatabase();

  const submission = await Submission.findOne({ submissionId })
    .populate({ path: 'quizId', model: Quiz })
    .lean();

  if (!submission) {
    throw new Error('Submission not found.');
  }

  const quiz = submission.quizId as any;

  return {
    submissionId: submission.submissionId,
    quizId: quiz?._id.toString() || '',
    quizName: quiz?.title || 'Unknown Quiz',
    submittedAt: submission.submittedAt.toISOString(),
    showLeaderboard: quiz?.showLeaderboard !== false,
  };
}

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export async function updateAppBranding(formData: FormData) {
  const session = await checkAuth('super-admin');
  await connectToDatabase();

  const appName = String(formData.get('appName') || '').trim();
  if (!appName) {
    throw new Error('App name is required.');
  }
  if (appName.length > 80) {
    throw new Error('App name must be 80 characters or less.');
  }

  const resetLogo = String(formData.get('resetLogo') || '') === 'true';
  const file = formData.get('logo');

  let settings = await AppSettings.findOne({ key: 'app' });
  if (!settings) {
    settings = new AppSettings({ key: 'app', appName });
  }

  settings.appName = appName;

  if (resetLogo) {
    await settings.save();
    await AppSettings.updateOne({ key: 'app' }, { $unset: { logoData: 1, logoContentType: 1 }, $set: { appName } });
  } else if (file instanceof File && file.size > 0) {
    if (file.size > MAX_LOGO_BYTES) {
      throw new Error('Logo must be 2MB or smaller.');
    }
    if (!LOGO_TYPES.includes(file.type)) {
      throw new Error('Logo must be PNG, JPG, WEBP, GIF, or SVG.');
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    settings.logoData = bytes;
    settings.logoContentType = file.type;
    await settings.save();
  } else {
    await settings.save();
  }
  await logAction(`Updated app branding to "${appName}"`, session.user.email!);
  revalidatePath('/', 'layout');
  revalidatePath('/admin69');

  return { success: true };
}
