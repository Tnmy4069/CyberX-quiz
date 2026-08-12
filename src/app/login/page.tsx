'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShieldCheck, Lock, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (email.toLowerCase().trim() === 'superadmin@platform.com') {
      setError('Super Admin must authenticate via their dedicated secure portal.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Fetch session to determine redirect destination
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        if (session?.user?.role === 'super-admin') {
          router.push('/super-admin');
        } else if (session?.user?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setError('An error occurred during authentication.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="flex justify-between items-center p-6 max-w-7xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="CyberX Logo" width={180} height={112} className="h-28 w-auto object-contain" priority />
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-md mx-auto w-full -mt-16">
        <div className="w-full bg-card text-card-foreground border border-border rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Gate</h1>
            <p className="text-sm text-muted-foreground mt-1 text-balance">
              Sign in to manage quizzes, questions, and students.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-foreground">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-foreground">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying Identity...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} CyberX Assessments. All rights reserved.
      </footer>
    </div>
  );
}
