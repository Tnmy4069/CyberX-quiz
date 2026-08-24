'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateAccessCode } from '@/app/actions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { BrandMark, SiteFooter } from '@/components/BrandMark';

export default function LandingPage() {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const quizInfo = await validateAccessCode(accessCode);
      router.push(`/quiz/${accessCode.toUpperCase().trim()}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while validating the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="flex justify-between items-center p-4 sm:p-6 max-w-7xl w-full mx-auto gap-3">
        <BrandMark size="lg" href={null} />
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground"
          >
            Admin Panel
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Hero and Input */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-xl mx-auto w-full -mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-3 text-balance">
            Secure, Instant Assessments
          </h1>
          <p className="text-muted-foreground text-lg">
            Enter your assessment credentials below to register and start your exam session.
          </p>
        </div>

        <div className="w-full bg-card text-card-foreground border border-border rounded-2xl shadow-xl p-8 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-semibold mb-2">
                Quiz Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="e.g. QZ-2026-MATH"
                className="w-full px-4 py-3 bg-secondary text-secondary-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center font-mono text-lg tracking-wider placeholder:font-sans placeholder:text-sm uppercase"
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !accessCode.trim()}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying Code...
                </>
              ) : (
                'Access Quiz Room'
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex justify-center items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full border border-border">
          <HelpCircle className="h-4 w-4" />
          <span>Requires fullscreen permission & tab-switch tracker.</span>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
