export const dynamic = 'force-dynamic';

import { connectToDatabase } from '@/lib/db';
import { Quiz } from '@/models/quiz';
import { Submission } from '@/models/submission';
import { Participant } from '@/models/participant';
import { notFound } from 'next/navigation';
import LeaderboardClient from './LeaderboardClient';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

interface Params {
  quizId: string;
}

export default async function Page({ params }: { params: Promise<Params> }) {
  await connectToDatabase();
  const resolvedParams = await params;
  const quizId = resolvedParams.quizId;

  // Validate quiz ID
  if (!quizId || quizId.length !== 24) {
    return notFound();
  }

  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) {
    return notFound();
  }

  // Check if leaderboard is disabled
  if (quiz.showLeaderboard === false) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground justify-center items-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl text-center">
          <div className="h-16 w-16 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Leaderboard Disabled</h2>
          <p className="text-muted-foreground text-sm mb-6">
            The leaderboard for <strong>{quiz.title}</strong> has been disabled by the administrator.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow hover:bg-primary/90 transition-colors inline-block text-sm"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  // Fetch submissions that are completed (submitted or time-up)
  const submissions = await Submission.find({
    quizId: quiz._id,
    status: { $ne: 'in-progress' }
  })
    .populate({ path: 'participantId', model: Participant })
    .lean();

  const serializedSubmissions = submissions.map((sub: any) => {
    const participant = sub.participantId;
    const start = new Date(sub.createdAt).getTime();
    const end = new Date(sub.submittedAt || sub.updatedAt).getTime();
    const timeTaken = Math.max(0, Math.floor((end - start) / 1000));

    return {
      id: sub._id.toString(),
      name: participant?.name || 'Unknown Participant',
      rollNumber: participant?.rollNumber || 'N/A',
      standard: participant?.email || 'N/A', // representing standard
      division: participant?.mobile || 'N/A', // representing division
      score: sub.score || 0,
      timeTaken,
    };
  });

  // Sort: Highest score first, then lowest time taken
  serializedSubmissions.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.timeTaken - b.timeTaken;
  });

  const serializedQuiz = {
    id: quiz._id.toString(),
    title: quiz.title,
    description: quiz.description || '',
    totalMarks: quiz.totalMarks || 0,
  };

  return (
    <LeaderboardClient quiz={serializedQuiz} submissions={serializedSubmissions} />
  );
}
