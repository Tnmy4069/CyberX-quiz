export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/db';
import { Quiz } from '@/models/quiz';
import { Submission } from '@/models/submission';
import { Participant } from '@/models/participant';
import { redirect } from 'next/navigation';
import SubmissionsInspector from './SubmissionsInspector';

export default async function SubmissionsPage() {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const isSuperAdmin = session.user.role === 'super-admin';
  const filter = isSuperAdmin ? {} : { createdBy: session.user.id };

  // Fetch quizzes matching permissions
  const quizzes = await Quiz.find(filter).lean();
  const quizIds = quizzes.map((q) => q._id);

  // Fetch submissions and populate details
  const submissions = await Submission.find({ quizId: { $in: quizIds } })
    .populate({ path: 'participantId', model: Participant })
    .populate({ path: 'quizId', model: Quiz })
    .sort({ createdAt: -1 })
    .lean();

  const serializedSubmissions = submissions.map((s) => {
    const participant = s.participantId as any;
    const quiz = s.quizId as any;

    return {
      id: s._id.toString(),
      submissionId: s.submissionId,
      quizId: quiz?._id.toString() || '',
      quizName: quiz?.title || 'Deleted Quiz',
      totalMarks: quiz?.totalMarks || 0,
      participantName: participant?.name || 'Unknown',
      rollNumber: participant?.rollNumber || 'N/A',
      email: participant?.email || 'N/A',
      mobile: participant?.mobile || 'N/A',
      class: participant?.class || 'N/A',
      score: s.score,
      tabSwitchCount: s.tabSwitchCount || 0,
      fullscreenExitCount: s.fullscreenExitCount || 0,
      status: s.status,
      submittedAt: s.submittedAt ? s.submittedAt.toISOString() : new Date().toISOString(),
    };
  });

  const serializedQuizzes = quizzes.map((q) => ({
    id: q._id.toString(),
    title: q.title,
  }));

  return (
    <SubmissionsInspector
      submissions={serializedSubmissions}
      quizzes={serializedQuizzes}
    />
  );
}
