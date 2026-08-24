export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { SuperAdminLogin } from './LoginForm';
import { AdminNavbar } from '@/components/AdminNavbar';
import { ControlCenter } from './ControlCenter';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/user';
import { Quiz } from '@/models/quiz';
import { Submission } from '@/models/submission';
import { Participant } from '@/models/participant';
import { AuditLog } from '@/models/auditLog';
import mongoose from 'mongoose';
import type { EnvVarRow } from '@/app/super-admin/EnvVarsPanel';
import { getPublicBranding } from '@/lib/branding';

export default async function Admin69Page() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'super-admin') {
    return <SuperAdminLogin />;
  }

  await connectToDatabase();

  const [
    totalAdmins,
    activeAdmins,
    totalQuizzes,
    activeQuizzes,
    totalSubmissions,
    inProgressSubmissions,
    totalParticipants,
    quizzes,
    participants,
    submissions,
    auditLogs,
  ] = await Promise.all([
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'admin', status: 'active' }),
    Quiz.countDocuments(),
    Quiz.countDocuments({ active: true }),
    Submission.countDocuments(),
    Submission.countDocuments({ status: 'in-progress' }),
    Participant.countDocuments(),
    Quiz.find().sort({ updatedAt: -1 }).limit(40).lean(),
    Participant.find().sort({ createdAt: -1 }).limit(80).lean(),
    Submission.find().sort({ submittedAt: -1 }).limit(40).lean(),
    AuditLog.find().sort({ timestamp: -1 }).limit(50).lean(),
  ]);

  let mongoPingMs: number | null = null;
  let mongoOk = false;
  let dbName: string | null = null;
  try {
    const start = Date.now();
    const ping = await mongoose.connection.db?.admin().ping();
    mongoPingMs = Date.now() - start;
    mongoOk = Boolean(ping);
    dbName = mongoose.connection.name || null;
  } catch {
    mongoOk = false;
  }

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

  const branding = await getPublicBranding();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <ControlCenter
          branding={branding}
          stats={{
            totalAdmins,
            activeAdmins,
            totalQuizzes,
            activeQuizzes,
            totalSubmissions,
            inProgressSubmissions,
            totalParticipants,
          }}
          envVars={envVars}
          quizzes={quizzes.map((q) => ({
            id: q._id.toString(),
            title: q.title,
            accessCode: q.accessCode,
            active: q.active,
            duration: q.duration,
            startDate: new Date(q.startDate).toISOString(),
            endDate: new Date(q.endDate).toISOString(),
            totalMarks: q.totalMarks,
          }))}
          participants={participants.map((p) => ({
            id: p._id.toString(),
            name: p.name,
            email: p.email,
            rollNumber: p.rollNumber,
            mobile: p.mobile,
            className: p.class,
            createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
          }))}
          submissions={submissions.map((s) => ({
            id: s._id.toString(),
            submissionId: s.submissionId,
            score: s.score,
            status: s.status,
            tabSwitchCount: s.tabSwitchCount,
            submittedAt: new Date(s.submittedAt).toISOString(),
          }))}
          auditLogs={auditLogs.map((log) => ({
            id: (log as { _id: { toString: () => string } })._id.toString(),
            user: log.user,
            action: log.action,
            timestamp: new Date(log.timestamp).toISOString(),
          }))}
          system={{
            nodeEnv: process.env.NODE_ENV || 'unknown',
            nodeVersion: process.version,
            mongoPingMs,
            mongoOk,
            dbName,
            serverTime: new Date().toISOString(),
          }}
        />
      </main>
    </div>
  );
}
