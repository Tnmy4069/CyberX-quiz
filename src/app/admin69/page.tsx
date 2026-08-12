'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Key, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function SuperAdminLoginPage() {
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: 'superadmin@platform.com',
        password: accessKey,
      });

      if (res?.error) {
        setError('Invalid Super Admin Access Key.');
        setLoading(false);
      } else {
        router.push('/super-admin');
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
        <div className="w-full bg-card text-card-foreground border border-border rounded-2xl shadow-xl p-8 relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-yellow-500" />

          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Key className="h-6 w-6 animate-pulse text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Super Admin Entry</h1>
            <p className="text-sm text-muted-foreground mt-1 text-balance">
              Enter the master access key to unlock the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-foreground">Access Key</label>
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Enter master key"
                className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-center font-mono tracking-widest"
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
              disabled={loading || !accessKey.trim()}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying Key...
                </>
              ) : (
                'Unlock Dashboard'
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
