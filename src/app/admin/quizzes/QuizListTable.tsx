'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toggleQuizActive, deleteQuiz } from '@/app/actions';
import { Edit, Trash2, Calendar, Clock, Copy, Check, FileText } from 'lucide-react';

interface QuizItem {
  id: string;
  title: string;
  accessCode: string;
  duration: number;
  startDate: string;
  endDate: string;
  totalMarks: number;
  active: boolean;
}

export default function QuizListTable({ initialQuizzes }: { initialQuizzes: QuizItem[] }) {
  const [quizzes, setQuizzes] = useState<QuizItem[]>(initialQuizzes);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleActive = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await toggleQuizActive(id);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, active: res.active } : q))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle quiz status');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete quiz "${title}"? This will delete all questions and submissions.`)) {
      return;
    }

    try {
      await deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete quiz');
    }
  };

  const copyLink = (accessCode: string) => {
    if (typeof window === 'undefined') return;
    const path = `${window.location.origin}/quiz/${accessCode}`;
    navigator.clipboard.writeText(path);
    setCopiedId(accessCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (quizzes.length === 0) {
    return (
      <div className="bg-card text-card-foreground border border-border rounded-2xl p-12 text-center shadow-sm">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground">No Quizzes Found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto mb-6">
          Get started by creating your very first quiz assessment. Include details, timers, and question sheets.
        </p>
        <Link
          href="/admin/quizzes/new"
          className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow shadow-primary/20 hover:bg-primary/90 transition-colors inline-block text-sm text-center"
        >
          Create Quiz
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Access Code & Link</th>
              <th className="px-6 py-4">Schedule</th>
              <th className="px-6 py-4">Total Marks</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {quizzes.map((q) => (
              <tr key={q.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-6 py-4 font-semibold text-foreground max-w-xs truncate">
                  {q.title}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-secondary px-2.5 py-1 border border-border text-xs rounded-lg font-semibold uppercase text-foreground">
                      {q.accessCode}
                    </span>
                    <button
                      onClick={() => copyLink(q.accessCode)}
                      className="p-1.5 rounded-lg bg-secondary/80 border border-border hover:bg-accent hover:text-foreground text-muted-foreground transition-all cursor-pointer"
                      title="Copy student link"
                    >
                      {copiedId === q.accessCode ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Limit: {q.duration} mins</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(q.startDate).toLocaleDateString()} - {new Date(q.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono font-semibold text-foreground">
                  {q.totalMarks}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(q.id)}
                    disabled={loadingId === q.id}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                      q.active
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20'
                    }`}
                  >
                    {loadingId === q.id ? 'Updating...' : q.active ? 'Active' : 'Deactivated'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/quizzes/${q.id}`}
                      className="p-2 border border-border rounded-lg bg-secondary/80 hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                      title="Edit quiz & questions"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(q.id, q.title)}
                      className="p-2 border border-border rounded-lg bg-secondary/80 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all cursor-pointer"
                      title="Delete quiz"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
