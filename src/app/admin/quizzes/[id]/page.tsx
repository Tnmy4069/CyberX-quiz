export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/db';
import { Quiz } from '@/models/quiz';
import { Question } from '@/models/question';
import { redirect } from 'next/navigation';
import QuizEditor from './QuizEditor';

export default async function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const quiz = await Quiz.findById(id).lean();
  if (!quiz) {
    redirect('/admin/quizzes');
  }

  // Verify ownership or super-admin role
  const isSuperAdmin = session.user.role === 'super-admin';
  if (!isSuperAdmin && quiz.createdBy && quiz.createdBy.toString() !== session.user.id) {
    redirect('/admin/quizzes');
  }

  const questions = await Question.find({ quizId: id }).sort({ createdAt: 1 }).lean();

  const serializedQuiz = {
    id: quiz._id.toString(),
    title: quiz.title,
    description: quiz.description || '',
    accessCode: quiz.accessCode,
    duration: quiz.duration,
    startDate: quiz.startDate.toISOString(),
    endDate: quiz.endDate.toISOString(),
    totalMarks: quiz.totalMarks,
    negativeMarking: quiz.negativeMarking,
    active: quiz.active,
    shuffleQuestions: quiz.shuffleQuestions || false,
    shuffleOptions: quiz.shuffleOptions || false,
  };

  const serializedQuestions = questions.map((q) => ({
    _id: q._id.toString(),
    type: q.type,
    question: q.question,
    options: q.options || [],
    correctAnswer: q.correctAnswer || [],
    marks: q.marks,
    difficulty: q.difficulty || 'medium',
    tags: q.tags || [],
  }));

  return (
    <QuizEditor quiz={serializedQuiz} initialQuestions={serializedQuestions} />
  );
}
