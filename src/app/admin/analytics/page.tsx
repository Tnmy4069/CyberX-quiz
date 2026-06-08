export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/db';
import { Quiz } from '@/models/quiz';
import { Submission } from '@/models/submission';
import { Question } from '@/models/question';
import { redirect } from 'next/navigation';
import AnalyticsExplorer from './AnalyticsExplorer';

export default async function AdminAnalyticsPage() {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const isSuperAdmin = session.user.role === 'super-admin';
  const filter = isSuperAdmin ? {} : { createdBy: session.user.id };

  const quizzes = await Quiz.find(filter).lean();
  const quizIds = quizzes.map((q) => q._id);

  // Fetch all submissions for these quizzes
  const submissions = await Submission.find({ quizId: { $in: quizIds } }).lean();

  // Fetch all questions for these quizzes
  const questions = await Question.find({ quizId: { $in: quizIds } }).lean();

  const serializedQuizzes = quizzes.map((q) => {
    const qSubmissions = submissions.filter((s) => s.quizId.toString() === q._id.toString());
    const qQuestions = questions.filter((qu) => qu.quizId.toString() === q._id.toString());

    // Analytics calculations
    const totalSubmissions = qSubmissions.length;
    const scores = qSubmissions.map((s) => s.score);
    const avgScore = totalSubmissions > 0 ? scores.reduce((a, b) => a + b, 0) / totalSubmissions : 0;
    const maxScore = totalSubmissions > 0 ? Math.max(...scores) : 0;
    const minScore = totalSubmissions > 0 ? Math.min(...scores) : 0;

    // Completed status
    const completed = qSubmissions.filter((s) => s.status === 'submitted' || s.status === 'time-up').length;
    const completionRate = totalSubmissions > 0 ? Math.round((completed / totalSubmissions) * 100) : 0;

    // Question-wise response analysis
    const questionAnalysis = qQuestions.map((question) => {
      const qId = question._id.toString();
      let correctCount = 0;

      qSubmissions.forEach((s) => {
        const studentAnswers = s.answers?.[qId] || [];
        const correctAnswers = question.correctAnswer || [];

        let isCorrect = false;

        if (question.type === 'mcq' || question.type === 'true_false') {
          isCorrect =
            studentAnswers.length === 1 &&
            correctAnswers.length === 1 &&
            studentAnswers[0] === correctAnswers[0];
        } else if (question.type === 'msq') {
          isCorrect =
            studentAnswers.length === correctAnswers.length &&
            studentAnswers.every((val) => correctAnswers.includes(val)) &&
            correctAnswers.every((val) => studentAnswers.includes(val));
        } else if (question.type === 'short_text') {
          const studentText = studentAnswers[0]?.trim().toLowerCase() || '';
          isCorrect = correctAnswers.some(
            (correctOpt) => correctOpt.trim().toLowerCase() === studentText
          );
        }

        if (isCorrect) {
          correctCount++;
        }
      });

      const successRate = totalSubmissions > 0 ? Math.round((correctCount / totalSubmissions) * 100) : 0;

      return {
        id: qId,
        prompt: question.question,
        type: question.type,
        marks: question.marks,
        successRate,
      };
    });

    return {
      id: q._id.toString(),
      title: q.title,
      accessCode: q.accessCode,
      totalMarks: q.totalMarks,
      stats: {
        totalSubmissions,
        avgScore: Math.round(avgScore * 10) / 10,
        maxScore,
        minScore,
        completionRate,
      },
      questionAnalysis,
    };
  });

  return <AnalyticsExplorer quizzes={serializedQuizzes} />;
}
