'use client';

import React, { useState } from 'react';
import { Award, Users, Percent, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

interface QuizAnalytics {
  id: string;
  title: string;
  accessCode: string;
  totalMarks: number;
  stats: {
    totalSubmissions: number;
    avgScore: number;
    maxScore: number;
    minScore: number;
    completionRate: number;
  };
  questionAnalysis: Array<{
    id: string;
    prompt: string;
    type: string;
    marks: number;
    successRate: number;
  }>;
}

export default function AnalyticsExplorer({ quizzes }: { quizzes: QuizAnalytics[] }) {
  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id || '');

  const activeQuiz = quizzes.find((q) => q.id === selectedQuizId);

  if (quizzes.length === 0) {
    return (
      <div className="bg-card text-card-foreground border border-border rounded-2xl p-12 text-center shadow-sm text-foreground">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold">No Data Available</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Create assessments and collect student submissions to view deep question response analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quiz Analytics Explorer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Identify difficult questions, track completion grades, and examine response success rates.
          </p>
        </div>

        {/* Selector */}
        <div>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-semibold focus:outline-none text-foreground"
          >
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.accessCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeQuiz && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Submissions */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Takers</span>
                <span className="text-2xl font-bold tracking-tight text-foreground">{activeQuiz.stats.totalSubmissions}</span>
              </div>
            </div>

            {/* Average Score */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Average Score</span>
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {activeQuiz.stats.avgScore} <span className="text-sm text-muted-foreground">/ {activeQuiz.totalMarks}</span>
                </span>
              </div>
            </div>

            {/* Highest Score */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Highest Score</span>
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {activeQuiz.stats.maxScore} <span className="text-sm text-muted-foreground">/ {activeQuiz.totalMarks}</span>
                </span>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Percent className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Completion</span>
                <span className="text-2xl font-bold tracking-tight text-foreground">{activeQuiz.stats.completionRate}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Question Response Success Rates */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold tracking-tight text-foreground">Question Success Analysis</h3>
              </div>

              {activeQuiz.questionAnalysis.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  This quiz does not have any questions.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeQuiz.questionAnalysis.map((q, idx) => (
                    <div key={q.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-xs font-semibold bg-secondary text-secondary-foreground border border-border px-2 py-0.5 rounded-md">
                            Q{idx + 1}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2 capitalize">Type: {q.type.replace('_', ' ')} | Marks: {q.marks}</span>
                          <p className="text-sm font-semibold text-foreground mt-2 line-clamp-2">{q.prompt}</p>
                        </div>
                        <span className={`text-sm font-bold ${
                          q.successRate >= 70
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : q.successRate >= 40
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-destructive'
                        }`}>
                          {q.successRate}% Correct
                        </span>
                      </div>

                      {/* Visual progress bar */}
                      <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden border border-border">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            q.successRate >= 70
                              ? 'bg-emerald-500'
                              : q.successRate >= 40
                              ? 'bg-yellow-500'
                              : 'bg-destructive'
                          }`}
                          style={{ width: `${q.successRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 1 Col: Info Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight mb-2 text-foreground">Analysis Summary</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The success rate indicates the percentage of students who answered the question correctly. 
                </p>
                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="h-3.5 w-3.5 rounded bg-emerald-500 shrink-0" />
                    <span>70% or more: Excellent understanding</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="h-3.5 w-3.5 rounded bg-yellow-500 shrink-0" />
                    <span>40% - 69%: Needs revision / Average</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="h-3.5 w-3.5 rounded bg-destructive shrink-0" />
                    <span>Below 40%: High difficulty / Review concept</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-6">
                <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lowest Registered Score</span>
                <span className="text-lg font-bold text-foreground font-mono">{activeQuiz.stats.minScore} / {activeQuiz.totalMarks}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
