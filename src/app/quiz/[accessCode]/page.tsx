'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { validateAccessCode, registerParticipant } from '@/app/actions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShieldCheck, UserCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function StudentRegistration() {
  const params = useParams();
  const router = useRouter();
  const accessCode = params.accessCode as string;

  const [quizInfo, setQuizInfo] = useState<any>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const info = await validateAccessCode(accessCode);
        setQuizInfo(info);
      } catch (err: any) {
        setQuizError(err.message || 'Failed to load quiz details.');
      } finally {
        setLoadingQuiz(false);
      }
    }
    loadQuiz();
  }, [accessCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rollNumber || !email || !mobile || !studentClass) {
      setRegisterError('Please fill in all fields.');
      return;
    }

    setRegistering(true);
    setRegisterError(null);

    try {
      const res = await registerParticipant(quizInfo.quizId, {
        name,
        rollNumber,
        email,
        mobile,
        class: studentClass,
      });

      // Save credentials in sessionStorage so the student session is cached
      sessionStorage.setItem('student_name', name);
      sessionStorage.setItem('student_roll', rollNumber);
      sessionStorage.setItem('student_submission_id', res.submissionId);

      // Redirect to the active quiz interface
      router.push(`/quiz/${accessCode}/start?sid=${res.submissionId}`);
    } catch (err: any) {
      setRegisterError(err.message || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  if (loadingQuiz) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading quiz details...</p>
      </div>
    );
  }

  if (quizError) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground justify-center items-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Verification Failed</h2>
          <p className="text-muted-foreground mb-6">{quizError}</p>
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
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.webp" alt="CyberX Logo" className="h-28 w-auto object-contain" />
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Form */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full">
        <div className="w-full bg-card text-card-foreground border border-border rounded-2xl shadow-xl p-8">
          <div className="border-b border-border pb-4 mb-6">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Registration Form
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">{quizInfo.title}</h1>
            {quizInfo.description && (
              <p className="text-sm text-muted-foreground mt-2">{quizInfo.description}</p>
            )}
            <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
              <div>
                Time Limit: <span className="font-semibold text-foreground">{quizInfo.duration} mins</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Roll Number / Student ID</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="CS-2026-001"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-foreground"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-foreground"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Class / Department</label>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="Computer Science & Engineering"
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                required
              />
            </div>

            {registerError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl text-center">
                {registerError}
              </div>
            )}

            <button
              type="submit"
              disabled={registering}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {registering ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Registering Session...
                </>
              ) : (
                <>
                  <UserCheck className="h-5 w-5" />
                  Register & Start Assessment
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
