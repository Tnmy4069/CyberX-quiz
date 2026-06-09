'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createQuiz } from '@/app/actions';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [duration, setDuration] = useState(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !accessCode || !duration || !startDate || !endDate) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createQuiz({
        title,
        description,
        accessCode: accessCode.toUpperCase().trim(),
        duration: Number(duration),
        startDate,
        endDate,
        totalMarks: 0, // calculated from questions sum later
        negativeMarking,
        shuffleQuestions,
        shuffleOptions,
        showLeaderboard,
      });

      router.push(`/admin/quizzes/${res.quizId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create quiz.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/quizzes"
          className="p-2 border border-border bg-card hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Create Quiz</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define basic metadata, schedule boundaries, and security parameters.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2">Quiz Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midterm Examination in Algorithms"
                className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description / Instructions</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Guidelines or instructions shown to student takers before starting."
                className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm min-h-[100px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2">Access Code *</label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="e.g. CS101-MID"
                className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-mono uppercase"
                required
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Unique code students use to access the exam room.
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Duration (Minutes) *</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2">Start Date & Time *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">End Date & Time *</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                required
              />
            </div>
          </div>

          {/* Settings checkboxes */}
          <div className="border-t border-border pt-6 space-y-4">
            <h3 className="text-sm font-bold tracking-tight mb-2">Security & Layout Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 border border-border bg-secondary/20 rounded-xl cursor-pointer hover:bg-secondary/40 select-none">
                <input
                  type="checkbox"
                  checked={negativeMarking}
                  onChange={(e) => setNegativeMarking(e.target.checked)}
                  className="h-4.5 w-4.5 text-primary rounded accent-primary"
                />
                <div className="text-xs">
                  <p className="font-bold">Negative Marking</p>
                  <p className="text-muted-foreground mt-0.5">Subtracts 25% of marks for wrong answers.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-border bg-secondary/20 rounded-xl cursor-pointer hover:bg-secondary/40 select-none">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="h-4.5 w-4.5 text-primary rounded accent-primary"
                />
                <div className="text-xs">
                  <p className="font-bold">Shuffle Questions</p>
                  <p className="text-muted-foreground mt-0.5">Randomizes question sequence for each taker.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-border bg-secondary/20 rounded-xl cursor-pointer hover:bg-secondary/40 select-none">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="h-4.5 w-4.5 text-primary rounded accent-primary"
                />
                <div className="text-xs">
                  <p className="font-bold">Shuffle Options</p>
                  <p className="text-muted-foreground mt-0.5">Randomizes options for MCQs and MSQs.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-border bg-secondary/20 rounded-xl cursor-pointer hover:bg-secondary/40 select-none">
                <input
                  type="checkbox"
                  checked={showLeaderboard}
                  onChange={(e) => setShowLeaderboard(e.target.checked)}
                  className="h-4.5 w-4.5 text-primary rounded accent-primary"
                />
                <div className="text-xs">
                  <p className="font-bold">Show Leaderboard</p>
                  <p className="text-muted-foreground mt-0.5">Display a public leaderboard for participants.</p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-6 mt-6">
            <Link
              href="/admin/quizzes"
              className="px-5 py-2.5 bg-secondary text-foreground hover:bg-accent border border-border rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 cursor-pointer text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin animate-infinite" />
                  Creating Quiz...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create & Continue
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
