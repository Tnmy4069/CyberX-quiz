'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Trophy, Search, Clock, Award, Users, ChevronLeft } from 'lucide-react';

interface SubmissionData {
  id: string;
  name: string;
  rollNumber: string;
  standard: string;
  division: string;
  score: number;
  timeTaken: number;
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  totalMarks: number;
}

interface LeaderboardClientProps {
  quiz: QuizData;
  submissions: SubmissionData[];
}

export default function LeaderboardClient({ quiz, submissions }: LeaderboardClientProps) {
  const [search, setSearch] = useState('');

  // Format seconds to human readable form
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Filter submissions by name or roll number
  const filteredSubmissions = submissions.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  // Stats calculation
  const totalTakers = submissions.length;
  const highestScore = submissions.length > 0 ? submissions[0].score : 0;
  const averageScore =
    submissions.length > 0
      ? (submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length).toFixed(1)
      : '0.0';

  // Find the fastest completion time of participants (optional filter: who got positive score, or overall)
  const fastestTime =
    submissions.length > 0
      ? formatTime(Math.min(...submissions.map((s) => s.timeTaken)))
      : 'N/A';

  // Get Top 3 podium items (only from unfiltered/original submissions)
  const topThree = submissions.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Top Header */}
      <header className="flex justify-between items-center p-6 max-w-7xl w-full mx-auto border-b border-border/40 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Exit Room
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Leaderboard Panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Title HUD */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="h-16 w-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
            <Trophy className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            {quiz.title} Leaderboard
          </h1>
          {quiz.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {quiz.description}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm space-y-1.5 hover:border-primary/20 transition-all select-none">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-wider">
              <Users className="h-4 w-4 text-primary" />
              <span>Total Takers</span>
            </div>
            <p className="text-2xl font-black text-foreground font-mono">{totalTakers}</p>
          </div>

          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm space-y-1.5 hover:border-primary/20 transition-all select-none">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-wider">
              <Award className="h-4 w-4 text-emerald-500" />
              <span>Highest Score</span>
            </div>
            <p className="text-2xl font-black text-foreground font-mono">
              {highestScore} <span className="text-sm font-semibold text-muted-foreground">/ {quiz.totalMarks}</span>
            </p>
          </div>

          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm space-y-1.5 hover:border-primary/20 transition-all select-none">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-wider">
              <Award className="h-4 w-4 text-indigo-500" />
              <span>Average Score</span>
            </div>
            <p className="text-2xl font-black text-foreground font-mono">
              {averageScore} <span className="text-sm font-semibold text-muted-foreground">/ {quiz.totalMarks}</span>
            </p>
          </div>

          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm space-y-1.5 hover:border-primary/20 transition-all select-none">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-wider">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span>Best Time Taken</span>
            </div>
            <p className="text-2xl font-black text-foreground font-mono">{fastestTime}</p>
          </div>
        </div>

        {/* Podium section for Top 3 (Only show if at least 1 taker exists) */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-4">
            {/* Rank 2 (Silver) */}
            {topThree[1] && (
              <div className="order-2 md:order-1 bg-card/40 border border-border/60 hover:border-border rounded-2xl p-6 text-center space-y-4 flex flex-col justify-between shadow-sm transition-all md:mt-6 h-fit">
                <div className="space-y-2">
                  <div className="h-12 w-12 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                    2
                  </div>
                  <h3 className="font-extrabold text-foreground text-base line-clamp-1">{topThree[1].name}</h3>
                  <p className="text-xs font-mono text-muted-foreground">Roll: {topThree[1].rollNumber}</p>
                </div>
                <div className="bg-secondary/30 p-3 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Score & Time</div>
                  <div className="text-sm font-black font-mono text-foreground">{topThree[1].score} / {quiz.totalMarks}</div>
                  <div className="text-[10px] font-semibold text-zinc-400 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" /> {formatTime(topThree[1].timeTaken)}
                  </div>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold) */}
            {topThree[0] && (
              <div className="order-1 md:order-2 bg-gradient-to-b from-primary/10 to-card border-2 border-primary rounded-2xl p-6 md:p-8 text-center space-y-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-black font-extrabold text-[10px] px-3 py-1 uppercase rounded-bl-xl tracking-wider select-none">
                  Champion
                </div>
                <div className="space-y-2">
                  <div className="h-16 w-16 bg-primary/20 text-primary border border-primary/30 rounded-full flex items-center justify-center mx-auto text-2xl font-black shadow-md shadow-primary/10">
                    1
                  </div>
                  <h3 className="font-black text-foreground text-lg line-clamp-1">{topThree[0].name}</h3>
                  <p className="text-xs font-mono text-muted-foreground">Roll: {topThree[0].rollNumber}</p>
                </div>
                <div className="bg-primary/15 p-4 border border-primary/20 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary">Score & Time</div>
                  <div className="text-base font-black font-mono text-foreground">{topThree[0].score} / {quiz.totalMarks}</div>
                  <div className="text-xs font-semibold text-primary flex items-center justify-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {formatTime(topThree[0].timeTaken)}
                  </div>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {topThree[2] && (
              <div className="order-3 bg-card/40 border border-border/60 hover:border-border rounded-2xl p-6 text-center space-y-4 flex flex-col justify-between shadow-sm transition-all md:mt-8 h-fit">
                <div className="space-y-2">
                  <div className="h-12 w-12 bg-amber-700/10 text-amber-600 border border-amber-700/20 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                    3
                  </div>
                  <h3 className="font-extrabold text-foreground text-base line-clamp-1">{topThree[2].name}</h3>
                  <p className="text-xs font-mono text-muted-foreground">Roll: {topThree[2].rollNumber}</p>
                </div>
                <div className="bg-secondary/30 p-3 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Score & Time</div>
                  <div className="text-sm font-black font-mono text-foreground">{topThree[2].score} / {quiz.totalMarks}</div>
                  <div className="text-[10px] font-semibold text-amber-500 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" /> {formatTime(topThree[2].timeTaken)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Table Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/40 pb-4">
            <div>
              <h2 className="text-xl font-bold">Leaderboard Standings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete list of submissions ranked by accuracy and speed.
              </p>
            </div>

            {/* Search filter input */}
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or roll number..."
                className="w-full pl-9 pr-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-foreground"
              />
            </div>
          </div>

          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border text-xs font-bold text-muted-foreground uppercase">
                    <th className="px-6 py-4 w-20">Rank</th>
                    <th className="px-6 py-4">Participant</th>
                    <th className="px-6 py-4">Roll Number</th>
                    <th className="px-6 py-4">Score & Progress</th>
                    <th className="px-6 py-4">Time Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm italic">
                        No quiz submissions found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub, idx) => {
                      // Get true rank based on original position (idx relative to original list isn't correct if searching, so search by original ID)
                      const originalRank = submissions.findIndex((s) => s.id === sub.id) + 1;
                      const isTopThree = originalRank <= 3;
                      const percent = quiz.totalMarks > 0 ? (sub.score / quiz.totalMarks) * 100 : 0;

                      return (
                        <tr key={sub.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-6 py-4">
                            {originalRank === 1 ? (
                              <span className="h-7 w-7 rounded-full bg-yellow-500/15 text-yellow-500 border border-yellow-500/20 flex items-center justify-center font-black text-xs">
                                1st
                              </span>
                            ) : originalRank === 2 ? (
                              <span className="h-7 w-7 rounded-full bg-zinc-400/15 text-zinc-400 border border-zinc-400/20 flex items-center justify-center font-black text-xs">
                                2nd
                              </span>
                            ) : originalRank === 3 ? (
                              <span className="h-7 w-7 rounded-full bg-amber-700/15 text-amber-600 border border-amber-700/20 flex items-center justify-center font-black text-xs">
                                3rd
                              </span>
                            ) : (
                              <span className="h-7 w-7 rounded-full bg-secondary/40 border border-border text-muted-foreground flex items-center justify-center font-bold text-xs">
                                {originalRank}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-foreground block">{sub.name}</span>
                              <span className="text-xs text-muted-foreground block font-mono">
                                Std: {sub.standard} | Div: {sub.division}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-muted-foreground">
                            {sub.rollNumber}
                          </td>
                          <td className="px-6 py-4 space-y-1.5 w-64">
                            <div className="flex items-center justify-between text-xs font-bold font-mono">
                              <span className="text-foreground">{sub.score} / {quiz.totalMarks}</span>
                              <span className="text-muted-foreground">{percent.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  percent >= 80
                                    ? 'bg-emerald-500'
                                    : percent >= 50
                                    ? 'bg-primary'
                                    : 'bg-destructive'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-foreground">
                            {formatTime(sub.timeTaken)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border/40 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} CyberX Assessments. All rights reserved.
      </footer>
    </div>
  );
}
