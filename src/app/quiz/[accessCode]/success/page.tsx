'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSubmissionSuccessDetails } from '@/app/actions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CheckCircle, ShieldCheck, Calendar, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const submissionId = searchParams.get('sid');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (!submissionId) {
      router.push('/');
      return;
    }

    async function loadDetails() {
      try {
        const data = await getSubmissionSuccessDetails(submissionId!);
        setDetails(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load submission details.');
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [submissionId, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Retrieving submission verification...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground justify-center items-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Verification Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow hover:bg-primary/90 transition-colors inline-block"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="flex justify-between items-center p-6 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="CyberX Logo" className="h-28 w-auto object-contain" />
        </div>
        <ThemeToggle />
      </header>

      {/* Main Success Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-xl mx-auto w-full -mt-16">
        <div className="w-full bg-card text-card-foreground border border-border rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden">
          
          {/* Confetti border decoration */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-yellow-400 via-primary to-yellow-600" />

          {/* Success Check Icon */}
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle className="h-12 w-12" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-foreground">Quiz Submitted Successfully!</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Thank you for completing the assessment. Your session has been safely closed and graded.
          </p>

          {/* Details list */}
          <div className="bg-secondary/40 border border-border rounded-xl p-5 text-left space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Assessment</span>
                <span className="text-sm font-bold text-foreground">{details.quizName}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Submission ID</span>
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {details.submissionId}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Submitted At</span>
                <span className="text-sm font-semibold text-foreground">
                  {new Date(details.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 py-3 bg-secondary hover:bg-accent border border-border text-foreground rounded-xl font-semibold transition-all duration-200 text-center"
            >
              Exit Room
            </Link>
            {details.showLeaderboard ? (
              <>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-secondary hover:bg-accent border border-border text-foreground rounded-xl font-semibold transition-all duration-200 cursor-pointer"
                >
                  Print Receipt
                </button>
                <Link
                  href={`/leaderboard/${details.quizId}`}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 transition-all duration-200 text-center flex items-center justify-center"
                >
                  View Leaderboard
                </Link>
              </>
            ) : (
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 transition-all duration-200 cursor-pointer"
              >
                Print Receipt
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} CyberX Assessments. All rights reserved.
      </footer>
    </div>
  );
}

export default function QuizSuccess() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background text-foreground justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Retrieving submission details...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
