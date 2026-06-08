export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/db';
import { Quiz } from '@/models/quiz';
import { Submission } from '@/models/submission';
import { Participant } from '@/models/participant';
import { redirect } from 'next/navigation';
import DashboardCharts from './DashboardCharts';
import { FileText, Award, Users, CheckSquare } from 'lucide-react';

export default async function AdminDashboardPage() {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const isSuperAdmin = session.user.role === 'super-admin';
  const filter = isSuperAdmin ? {} : { createdBy: session.user.id };

  // Quizzes list
  const quizzes = await Quiz.find(filter).lean();
  const quizIds = quizzes.map((q) => q._id);

  // Submissions for these quizzes
  const submissions = await Submission.find({ quizId: { $in: quizIds } }).lean();

  // Participants count
  const participantIds = submissions.map((s) => s.participantId);
  // Get unique participants count
  const uniqueParticipantIds = Array.from(new Set(participantIds.map((id) => id.toString())));
  const totalParticipants = uniqueParticipantIds.length;

  const totalQuizzes = quizzes.length;
  const activeQuizzesCount = quizzes.filter((q) => q.active).length;
  const totalSubmissions = submissions.length;

  // Group submissions by date for trend chart (last 7 days)
  const submissionTrend: Record<string, number> = {};
  submissions.forEach((s) => {
    const dateStr = new Date((s as any).createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    submissionTrend[dateStr] = (submissionTrend[dateStr] || 0) + 1;
  });

  // Last 7 unique dates
  const trendData = Object.entries(submissionTrend)
    .map(([date, count]) => ({ date, count }))
    .slice(-7);

  // Quiz Performance (average score per quiz)
  const performanceData = quizzes.map((q) => {
    const qSubmissions = submissions.filter((s) => s.quizId.toString() === q._id.toString());
    const avgScore =
      qSubmissions.length > 0
        ? qSubmissions.reduce((sum, s) => sum + s.score, 0) / qSubmissions.length
        : 0;

    // Completion rate
    const completed = qSubmissions.filter((s) => s.status === 'submitted' || s.status === 'time-up').length;
    const total = qSubmissions.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      quizName: q.title,
      avgScore: Math.round(avgScore * 10) / 10,
      totalMarks: q.totalMarks,
      completionRate,
    };
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Admin Console</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isSuperAdmin
            ? 'Global system stats and operations control.'
            : 'Track quiz engagement, submission records, and assessment performance.'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Quizzes */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-muted-foreground uppercase">Total Quizzes</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">{totalQuizzes}</span>
          </div>
        </div>

        {/* Active Quizzes */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-muted-foreground uppercase">Active Quizzes</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">{activeQuizzesCount}</span>
          </div>
        </div>

        {/* Total Participants */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-muted-foreground uppercase">Participants</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">{totalParticipants}</span>
          </div>
        </div>

        {/* Total Submissions */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-muted-foreground uppercase">Submissions</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">{totalSubmissions}</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <DashboardCharts trendData={trendData} performanceData={performanceData} />
    </div>
  );
}
