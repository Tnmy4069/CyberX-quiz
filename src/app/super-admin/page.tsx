export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/user';
import { Quiz } from '@/models/quiz';
import { Submission } from '@/models/submission';
import { AuditLog } from '@/models/auditLog';
import { redirect } from 'next/navigation';
import { ShieldCheck, FileText, ClipboardList, Clock } from 'lucide-react';
import { EnvVarsPanel, type EnvVarRow } from './EnvVarsPanel';

export default async function SuperAdminPage() {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'super-admin') {
    redirect('/login');
  }

  // Aggregate stats
  const totalAdmins = await User.countDocuments({ role: 'admin' });
  const activeAdmins = await User.countDocuments({ role: 'admin', status: 'active' });
  const totalQuizzes = await Quiz.countDocuments();
  const totalSubmissions = await Submission.countDocuments();

  // Fetch audit logs
  const auditLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(10).lean();

  const envKeys: { key: string; required: boolean }[] = [
    { key: 'MONGODB_URI', required: true },
    { key: 'NEXTAUTH_SECRET', required: true },
    { key: 'NEXTAUTH_URL', required: false },
    { key: 'SUPER_ADMIN_PASSWORD', required: true },
    { key: 'NODE_ENV', required: false },
  ];

  const envVars: EnvVarRow[] = envKeys.map(({ key, required }) => ({
    key,
    required,
    value: process.env[key] ?? null,
  }));

  return (
    <div className="space-y-8 text-foreground">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Super Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor system metrics, access control parameters, and administrative audit logs.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Admins */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-muted-foreground uppercase">Admins Registered</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">{totalAdmins}</span>
            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">{activeAdmins} active</span>
          </div>
        </div>

        {/* Total Quizzes */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-muted-foreground uppercase">Total Quizzes</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">{totalQuizzes}</span>
          </div>
        </div>

        {/* Total Submissions */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-muted-foreground uppercase">Total Submissions</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">{totalSubmissions}</span>
          </div>
        </div>

        {/* Server Time Indicator */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-muted-foreground uppercase">Server Time</span>
            <span className="text-sm font-semibold block mt-1 truncate text-foreground">
              {new Date().toLocaleTimeString()}
            </span>
            <span className="block text-[10px] text-muted-foreground">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <EnvVarsPanel vars={envVars} />

      {/* Audit Logs list */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold tracking-tight text-foreground">System Audit Log (Last 10 Actions)</h3>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No actions logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Action Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <tr key={(log as any)._id.toString()} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      {log.user}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
