export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/db';
import { Quiz } from '@/models/quiz';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import QuizListTable from './QuizListTable';

export default async function QuizzesPage() {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const isSuperAdmin = session.user.role === 'super-admin';
  const filter = isSuperAdmin ? {} : { createdBy: session.user.id };

  const quizzes = await Quiz.find(filter).sort({ createdAt: -1 }).lean();

  const serializedQuizzes = quizzes.map((q) => ({
    id: q._id.toString(),
    title: q.title,
    accessCode: q.accessCode,
    duration: q.duration,
    startDate: q.startDate.toISOString(),
    endDate: q.endDate.toISOString(),
    totalMarks: q.totalMarks,
    active: q.active,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Quizzes Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, edit, toggle active status, and manage questions for assessments.
          </p>
        </div>
        <Link
          href="/admin/quizzes/new"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:bg-primary/90 transition-all text-sm cursor-pointer w-fit"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Quiz
        </Link>
      </div>

      <QuizListTable initialQuizzes={serializedQuizzes} />
    </div>
  );
}
