'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Search, Download, ShieldAlert, Award, FileSpreadsheet, Eye, User } from 'lucide-react';

interface SubmissionItem {
  id: string;
  submissionId: string;
  quizId: string;
  quizName: string;
  totalMarks: number;
  participantName: string;
  rollNumber: string;
  email: string;
  mobile: string;
  class: string;
  score: number;
  tabSwitchCount: number;
  fullscreenExitCount: number;
  status: string;
  submittedAt: string;
}

interface QuizOption {
  id: string;
  title: string;
}

interface SubmissionsInspectorProps {
  submissions: SubmissionItem[];
  quizzes: QuizOption[];
}

export default function SubmissionsInspector({ submissions, quizzes }: SubmissionsInspectorProps) {
  const [search, setSearch] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  // Filter submissions
  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.participantName.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());

    const matchesQuiz = selectedQuiz === 'all' || s.quizId === selectedQuiz;

    return matchesSearch && matchesQuiz;
  });

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = [
      'Submission ID',
      'Quiz Name',
      'Student Name',
      'Roll Number',
      'Email',
      'Mobile',
      'Class/Department',
      'Score',
      'Total Marks',
      'Tab Switch Count',
      'Fullscreen Exit Count',
      'Status',
      'Submitted At',
    ];

    const rows = filteredSubmissions.map((s) => [
      s.submissionId,
      s.quizName,
      s.participantName,
      s.rollNumber,
      s.email,
      s.mobile,
      s.class,
      s.score,
      s.totalMarks,
      s.tabSwitchCount,
      s.fullscreenExitCount,
      s.status,
      new Date(s.submittedAt).toLocaleString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Submissions_Export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel helper using 'xlsx'
  const handleExportExcel = () => {
    const formattedData = filteredSubmissions.map((s) => ({
      'Submission ID': s.submissionId,
      'Quiz Name': s.quizName,
      'Student Name': s.participantName,
      'Roll Number': s.rollNumber,
      Email: s.email,
      Mobile: s.mobile,
      'Class/Department': s.class,
      Score: s.score,
      'Total Marks': s.totalMarks,
      'Tab Switch Count': s.tabSwitchCount,
      'Fullscreen Exit Count': s.fullscreenExitCount,
      Status: s.status,
      'Submitted At': new Date(s.submittedAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

    XLSX.writeFile(workbook, `Submissions_Export_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Submission Inspector</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit student performance, examine cheat indicators, and compile records.
          </p>
        </div>

        {/* Exports dropdown/buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredSubmissions.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 border border-border bg-card hover:bg-secondary rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            CSV Export
          </button>
          <button
            onClick={handleExportExcel}
            disabled={filteredSubmissions.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 cursor-pointer transition-colors disabled:opacity-40"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel Export
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by student, email, roll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none text-xs"
          />
        </div>

        {/* Quiz selector */}
        <div>
          <select
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value)}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none text-xs text-foreground"
          >
            <option value="all">Filter by Quiz (All)</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>

        {/* Counter readout */}
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          Showing {filteredSubmissions.length} of {submissions.length} submissions
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Assessment</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Cheat Logs</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No submissions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-foreground block">{s.participantName}</span>
                        <span className="text-xs text-muted-foreground block font-mono">
                          Roll: {s.rollNumber} | {s.class}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground max-w-[180px] truncate block">
                        {s.quizName}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono uppercase">ID: {s.submissionId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Award className="h-4.5 w-4.5 text-primary shrink-0" />
                        <span className="font-mono font-bold text-foreground">
                          {s.score} / {s.totalMarks}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className={`flex items-center gap-1 font-semibold ${
                          s.tabSwitchCount > 0 ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Tab Switches: {s.tabSwitchCount}
                        </span>
                        <span className={`flex items-center gap-1 font-semibold ${
                          s.fullscreenExitCount > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'
                        }`}>
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Fullscreen Exits: {s.fullscreenExitCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        s.status === 'submitted'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : s.status === 'time-up'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-secondary border-border text-muted-foreground'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                      {new Date(s.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedSubmission(s)}
                        className="p-2 border border-border rounded-lg bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Inspector Detail */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="max-w-lg w-full bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Participant Metadata</h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-muted-foreground hover:text-foreground font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Full Name</span>
                <span className="font-bold text-base">{selectedSubmission.participantName}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Roll / ID</span>
                <span className="font-semibold">{selectedSubmission.rollNumber}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Class / Dept</span>
                <span className="font-semibold">{selectedSubmission.class}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Email Address</span>
                <span className="font-semibold break-all">{selectedSubmission.email}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Mobile Number</span>
                <span className="font-semibold font-mono">{selectedSubmission.mobile}</span>
              </div>
              <div className="col-span-2 bg-secondary/40 border border-border p-3.5 rounded-xl space-y-2">
                <span className="block text-xs font-bold text-muted-foreground uppercase mb-1">Session Summary</span>
                <div className="flex justify-between text-xs">
                  <span>Graded Score:</span>
                  <span className="font-bold text-primary">{selectedSubmission.score} / {selectedSubmission.totalMarks}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Tab Violations:</span>
                  <span className="font-semibold text-destructive">{selectedSubmission.tabSwitchCount} switches</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Fullscreen Violations:</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">{selectedSubmission.fullscreenExitCount} exits</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-5 py-2 bg-secondary hover:bg-accent border border-border rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
