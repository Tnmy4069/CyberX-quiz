'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  Database,
  FileText,
  Search,
  ShieldCheck,
  Users,
  Power,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  ImagePlus,
} from 'lucide-react';
import { EnvVarsPanel, type EnvVarRow } from '@/app/super-admin/EnvVarsPanel';
import { toggleQuizActive, updateAppBranding } from '@/app/actions';
import type { PublicBranding } from '@/lib/branding-constants';

export type ControlQuiz = {
  id: string;
  title: string;
  accessCode: string;
  active: boolean;
  duration: number;
  startDate: string;
  endDate: string;
  totalMarks: number;
};

export type ControlParticipant = {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  mobile: string;
  className: string;
  createdAt: string;
};

export type ControlSubmission = {
  id: string;
  submissionId: string;
  score: number;
  status: string;
  tabSwitchCount: number;
  submittedAt: string;
};

export type ControlAudit = {
  id: string;
  user: string;
  action: string;
  timestamp: string;
};

export type ControlStats = {
  totalAdmins: number;
  activeAdmins: number;
  totalQuizzes: number;
  activeQuizzes: number;
  totalSubmissions: number;
  inProgressSubmissions: number;
  totalParticipants: number;
};

export type SystemInfo = {
  nodeEnv: string;
  nodeVersion: string;
  mongoPingMs: number | null;
  mongoOk: boolean;
  dbName: string | null;
  serverTime: string;
};

type Tab = 'overview' | 'branding' | 'quizzes' | 'participants' | 'submissions' | 'audit' | 'env' | 'system';

export function ControlCenter({
  stats,
  envVars,
  quizzes,
  participants,
  submissions,
  auditLogs,
  system,
  branding,
}: {
  stats: ControlStats;
  envVars: EnvVarRow[];
  quizzes: ControlQuiz[];
  participants: ControlParticipant[];
  submissions: ControlSubmission[];
  auditLogs: ControlAudit[];
  system: SystemInfo;
  branding: PublicBranding;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [busyQuiz, setBusyQuiz] = useState<string | null>(null);
  const router = useRouter();

  const copyText = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1200);
  };

  const q = query.trim().toLowerCase();

  const filteredQuizzes = useMemo(
    () =>
      quizzes.filter(
        (item) => !q || item.title.toLowerCase().includes(q) || item.accessCode.toLowerCase().includes(q)
      ),
    [quizzes, q]
  );

  const filteredParticipants = useMemo(
    () =>
      participants.filter(
        (item) =>
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.rollNumber.toLowerCase().includes(q) ||
          item.mobile.includes(q)
      ),
    [participants, q]
  );

  const filteredSubmissions = useMemo(
    () =>
      submissions.filter(
        (item) => !q || item.submissionId.toLowerCase().includes(q) || item.status.toLowerCase().includes(q)
      ),
    [submissions, q]
  );

  const filteredAudit = useMemo(
    () =>
      auditLogs.filter(
        (item) => !q || item.user.toLowerCase().includes(q) || item.action.toLowerCase().includes(q)
      ),
    [auditLogs, q]
  );

  const requiredEnv = envVars.filter((v) => v.required);
  const envHealthy = requiredEnv.every((v) => v.value);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'branding', label: 'Branding' },
    { id: 'quizzes', label: 'Quizzes' },
    { id: 'participants', label: 'People' },
    { id: 'submissions', label: 'Attempts' },
    { id: 'audit', label: 'Audit' },
    { id: 'env', label: 'Env' },
    { id: 'system', label: 'System' },
  ];

  const onToggleQuiz = async (id: string) => {
    setBusyQuiz(id);
    try {
      await toggleQuizActive(id);
      router.refresh();
    } finally {
      setBusyQuiz(null);
    }
  };

  const showSearch = tab === 'quizzes' || tab === 'participants' || tab === 'submissions' || tab === 'audit';

  return (
    <div className="space-y-5 sm:space-y-6 text-foreground">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Super-admin tools — branding, quizzes, people, logs, and environment.
        </p>
      </div>

      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
        <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap pb-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setQuery('');
              }}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                tab === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this tab..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={ShieldCheck} label="Admins" value={stats.totalAdmins} hint={`${stats.activeAdmins} active`} />
            <StatCard icon={FileText} label="Quizzes" value={stats.totalQuizzes} hint={`${stats.activeQuizzes} live`} />
            <StatCard icon={ClipboardList} label="Attempts" value={stats.totalSubmissions} hint={`${stats.inProgressSubmissions} live`} />
            <StatCard icon={Users} label="People" value={stats.totalParticipants} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <HealthPill
              ok={system.mongoOk}
              label="MongoDB"
              detail={system.mongoOk ? `${system.mongoPingMs} ms · ${system.dbName ?? 'connected'}` : 'Unreachable'}
            />
            <HealthPill ok={envHealthy} label="Required env" detail={envHealthy ? 'All set' : 'Missing keys'} />
            <HealthPill ok={Boolean(system.nodeEnv)} label="Runtime" detail={system.nodeEnv} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickLink href="/super-admin/admins" label="Manage admins" />
            <QuickLink href="/admin/quizzes" label="All quizzes" />
            <QuickLink href="/admin/submissions" label="Submissions" />
            <QuickLink href="/admin/analytics" label="Analytics" />
          </div>
        </div>
      )}

      {tab === 'branding' && <BrandingForm branding={branding} />}

      {tab === 'quizzes' && (
        <Panel title="Quizzes" subtitle="Toggle live status and copy access codes.">
          <div className="space-y-3 md:hidden">
            {filteredQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No records.</p>
            ) : (
              filteredQuizzes.map((quiz) => (
                <div key={quiz.id} className="border border-border rounded-xl p-4 space-y-2">
                  <Link href={`/admin/quizzes/${quiz.id}`} className="font-semibold hover:text-primary">
                    {quiz.title}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">
                    {quiz.duration} min · {quiz.totalMarks} marks
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(quiz.startDate).toLocaleString()} → {new Date(quiz.endDate).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button type="button" className="font-mono text-xs inline-flex items-center gap-1" onClick={() => copyText(quiz.id, quiz.accessCode)}>
                      {quiz.accessCode}
                      {copied === quiz.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <span className={quiz.active ? 'text-emerald-600 text-xs font-semibold' : 'text-muted-foreground text-xs'}>
                      {quiz.active ? 'Live' : 'Off'}
                    </span>
                    <button
                      type="button"
                      disabled={busyQuiz === quiz.id}
                      onClick={() => onToggleQuiz(quiz.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-xs font-semibold cursor-pointer"
                    >
                      <Power className="h-3 w-3" />
                      {quiz.active ? 'Disable' : 'Enable'}
                    </button>
                    <Link href={`/quiz/${quiz.accessCode}`}><ExternalLink className="h-4 w-4" /></Link>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="hidden md:block">
            <Table>
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Window</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredQuizzes.length === 0 ? (
                  <EmptyRow cols={5} />
                ) : (
                  filteredQuizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-secondary/20">
                      <td className="px-4 py-3 font-semibold">
                        <Link href={`/admin/quizzes/${quiz.id}`} className="hover:text-primary">{quiz.title}</Link>
                        <div className="text-[11px] text-muted-foreground">{quiz.duration} min · {quiz.totalMarks} marks</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <button type="button" className="inline-flex items-center gap-1 cursor-pointer" onClick={() => copyText(quiz.id, quiz.accessCode)}>
                          {quiz.accessCode}
                          {copied === quiz.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(quiz.startDate).toLocaleString()} → {new Date(quiz.endDate).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={quiz.active ? 'text-emerald-600 text-xs font-semibold' : 'text-muted-foreground text-xs'}>
                          {quiz.active ? 'Live' : 'Off'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button type="button" disabled={busyQuiz === quiz.id} onClick={() => onToggleQuiz(quiz.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-xs font-semibold cursor-pointer hover:bg-secondary disabled:opacity-50">
                            <Power className="h-3 w-3" />
                            {quiz.active ? 'Disable' : 'Enable'}
                          </button>
                          <Link href={`/quiz/${quiz.accessCode}`} className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Panel>
      )}

      {tab === 'participants' && (
        <Panel title="Participants" subtitle="Latest registered candidates.">
          <div className="space-y-3 md:hidden">
            {filteredParticipants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No records.</p>
            ) : (
              filteredParticipants.map((p) => (
                <div key={p.id} className="border border-border rounded-xl p-4 space-y-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs break-all">{p.email}</div>
                  <div className="text-xs text-muted-foreground">{p.rollNumber} · {p.mobile} · {p.className}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
          <div className="hidden md:block">
            <Table>
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Roll</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredParticipants.length === 0 ? <EmptyRow cols={6} /> : filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3 text-xs">{p.email}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.rollNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.mobile}</td>
                    <td className="px-4 py-3 text-xs">{p.className}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(p.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Panel>
      )}

      {tab === 'submissions' && (
        <Panel title="Recent submissions" subtitle="Latest attempts across all quizzes.">
          <div className="space-y-3 md:hidden">
            {filteredSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No records.</p>
            ) : (
              filteredSubmissions.map((s) => (
                <div key={s.id} className="border border-border rounded-xl p-4 space-y-1">
                  <div className="font-mono text-xs break-all">{s.submissionId}</div>
                  <div className="text-sm">Score {s.score} · {s.status} · {s.tabSwitchCount} tab switches</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(s.submittedAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
          <div className="hidden md:block">
            <Table>
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tab switches</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubmissions.length === 0 ? <EmptyRow cols={5} /> : filteredSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3 font-mono text-xs">{s.submissionId}</td>
                    <td className="px-4 py-3 font-semibold">{s.score}</td>
                    <td className="px-4 py-3 text-xs">{s.status}</td>
                    <td className="px-4 py-3 text-xs">{s.tabSwitchCount}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(s.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Panel>
      )}

      {tab === 'audit' && (
        <Panel title="Audit log" subtitle="Last 50 operator actions.">
          <div className="space-y-3 md:hidden">
            {filteredAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No records.</p>
            ) : (
              filteredAudit.map((log) => (
                <div key={log.id} className="border border-border rounded-xl p-4 space-y-1">
                  <div className="font-semibold text-sm">{log.user}</div>
                  <div className="text-sm text-muted-foreground">{log.action}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
          <div className="hidden md:block">
            <Table>
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAudit.length === 0 ? <EmptyRow cols={3} /> : filteredAudit.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">{log.user}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Panel>
      )}

      {tab === 'env' && <EnvVarsPanel vars={envVars} />}

      {tab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel title="Runtime" subtitle="Process and database diagnostics.">
            <dl className="space-y-3 text-sm">
              <Row label="Node.js" value={system.nodeVersion} />
              <Row label="NODE_ENV" value={system.nodeEnv} />
              <Row label="Server time" value={new Date(system.serverTime).toLocaleString()} />
              <Row label="Mongo ping" value={system.mongoOk ? `${system.mongoPingMs} ms` : 'failed'} />
              <Row label="Database" value={system.dbName ?? '—'} />
            </dl>
          </Panel>
          <Panel title="Shortcuts" subtitle="Jump into admin surfaces.">
            <div className="space-y-2">
              <QuickLink href="/admin/quizzes/new" label="Create quiz" />
              <QuickLink href="/super-admin" label="Classic super-admin dashboard" />
              <QuickLink href="/login" label="Admin login page" />
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function BrandingForm({ branding }: { branding: PublicBranding }) {
  const router = useRouter();
  const [appName, setAppName] = useState(branding.appName);
  const [preview, setPreview] = useState<string | null>(null);
  const [resetLogo, setResetLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const displayLogo = resetLogo ? '/logo.png' : preview || branding.logoUrl;

  const onFile = (file?: File) => {
    if (!file) return;
    setResetLogo(false);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const form = new FormData(e.currentTarget);
      form.set('appName', appName);
      form.set('resetLogo', resetLogo ? 'true' : 'false');
      await updateAppBranding(form);
      setOk(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save branding.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="App name & logo" subtitle="This appears on the public site, login, quizzes, and admin navbar.">
      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">App name</label>
            <input
              name="appNameVisible"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              maxLength={80}
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Logo</label>
            <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-secondary/40">
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground text-center">PNG, JPG, WEBP, GIF, or SVG · max 2MB</span>
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                setResetLogo(true);
                setPreview(null);
              }}
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold cursor-pointer hover:bg-secondary"
            >
              Reset to default logo
            </button>
            <button
              type="submit"
              disabled={saving || !appName.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save branding
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {ok && <p className="text-sm text-emerald-600">Branding saved. Refresh other open tabs to see it.</p>}
        </div>
        <div className="bg-secondary/30 border border-border rounded-xl p-5 space-y-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Preview</p>
          <div className="bg-card rounded-xl p-4 flex items-center gap-3 min-h-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayLogo} alt={appName} className="h-14 sm:h-16 w-auto max-w-[200px] object-contain" />
            <div className="min-w-0">
              <div className="font-bold truncate">{appName || 'App name'}</div>
              <div className="text-xs text-muted-foreground">Header / navbar</div>
            </div>
          </div>
        </div>
      </form>
    </Panel>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: number; hint?: string }) {
  return (
    <div className="bg-card border border-border p-3 sm:p-5 rounded-2xl flex items-center gap-3 min-w-0">
      <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0">
        <span className="block text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase truncate">{label}</span>
        <span className="text-xl sm:text-2xl font-bold">{value}</span>
        {hint && <span className="block text-[10px] text-muted-foreground truncate">{hint}</span>}
      </div>
    </div>
  );
}

function HealthPill({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3 min-w-0">
      <Database className={`h-5 w-5 mt-0.5 shrink-0 ${ok ? 'text-emerald-500' : 'text-destructive'}`} />
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground break-all">{detail}</div>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold hover:bg-secondary transition-colors">
      {label}
    </Link>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
      <div>
        <h3 className="text-base font-bold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <table className="w-full text-left border-collapse text-sm">{children}</table>
    </div>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center text-sm text-muted-foreground">No records.</td>
    </tr>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 border-b border-border pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xs break-all">{value}</dd>
    </div>
  );
}
