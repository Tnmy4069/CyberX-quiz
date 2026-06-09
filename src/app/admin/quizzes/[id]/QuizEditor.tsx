'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateQuiz, saveQuestions, toggleQuizActive } from '@/app/actions';
import { ChevronLeft, Save, Plus, Trash2, HelpCircle, Layers, CheckCircle2, Loader2, Tag, Trophy } from 'lucide-react';
import Link from 'next/link';

interface QuizDetails {
  id: string;
  title: string;
  description: string;
  accessCode: string;
  duration: number;
  startDate: string;
  endDate: string;
  totalMarks: number;
  negativeMarking: boolean;
  active: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showLeaderboard: boolean;
}

interface QuestionDetails {
  _id?: string;
  type: 'mcq' | 'msq' | 'true_false' | 'short_text';
  question: string;
  options: string[];
  correctAnswer: string[];
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

interface QuizEditorProps {
  quiz: QuizDetails;
  initialQuestions: QuestionDetails[];
}

export default function QuizEditor({ quiz, initialQuestions }: QuizEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'questions' | 'settings'>('questions');

  // Quiz Settings State
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description);
  const [accessCode, setAccessCode] = useState(quiz.accessCode);
  const [duration, setDuration] = useState(quiz.duration);
  const [startDate, setStartDate] = useState(quiz.startDate.substring(0, 16)); // format for datetime-local
  const [endDate, setEndDate] = useState(quiz.endDate.substring(0, 16));
  const [negativeMarking, setNegativeMarking] = useState(quiz.negativeMarking);
  const [shuffleQuestions, setShuffleQuestions] = useState(quiz.shuffleQuestions);
  const [shuffleOptions, setShuffleOptions] = useState(quiz.shuffleOptions);
  const [showLeaderboard, setShowLeaderboard] = useState(quiz.showLeaderboard);
  const [isQuizActive, setIsQuizActive] = useState(quiz.active);

  // Questions State
  const [questions, setQuestions] = useState<QuestionDetails[]>(initialQuestions);

  // Status Loaders
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quiz settings save handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await updateQuiz(quiz.id, {
        title,
        description,
        accessCode: accessCode.toUpperCase().trim(),
        duration: Number(duration),
        startDate,
        endDate,
        totalMarks: quiz.totalMarks,
        negativeMarking,
        shuffleQuestions,
        shuffleOptions,
        showLeaderboard,
      });
      setSuccessMsg('Quiz settings updated successfully.');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle quiz status (Active / Inactive)
  const handleToggleStatus = async () => {
    setTogglingActive(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await toggleQuizActive(quiz.id);
      setIsQuizActive(res.active);
      setSuccessMsg(`Quiz is now ${res.active ? 'Active' : 'Deactivated'}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle status.');
    } finally {
      setTogglingActive(false);
    }
  };

  // Questions handlers
  const handleAddQuestion = () => {
    const newQ: QuestionDetails = {
      type: 'mcq',
      question: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: [],
      marks: 5,
      difficulty: 'medium',
      tags: [],
    };
    setQuestions([...questions, newQ]);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleQuestionChange = (index: number, updatedField: Partial<QuestionDetails>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== index) return q;

        const next = { ...q, ...updatedField };

        // Handle structural options if changing type
        if (updatedField.type) {
          if (updatedField.type === 'true_false') {
            next.options = ['True', 'False'];
            next.correctAnswer = [];
          } else if (updatedField.type === 'short_text') {
            next.options = [];
            next.correctAnswer = [];
          } else {
            next.options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
            next.correctAnswer = [];
          }
        }

        return next;
      })
    );
  };

  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const newOptionName = `Option ${q.options.length + 1}`;
    handleQuestionChange(qIndex, { options: [...q.options, newOptionName] });
  };

  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    const optValue = q.options[optIndex];
    const nextOptions = q.options.filter((_, idx) => idx !== optIndex);
    const nextAnswers = q.correctAnswer.filter((val) => val !== optValue);
    handleQuestionChange(qIndex, { options: nextOptions, correctAnswer: nextAnswers });
  };

  const handleOptionTextChange = (qIndex: number, optIndex: number, newText: string) => {
    const q = questions[qIndex];
    const oldText = q.options[optIndex];
    const nextOptions = q.options.map((opt, idx) => (idx === optIndex ? newText : opt));
    // If the renamed option was marked as correct answer, rename it in answers list too
    const nextAnswers = q.correctAnswer.map((ans) => (ans === oldText ? newText : ans));
    handleQuestionChange(qIndex, { options: nextOptions, correctAnswer: nextAnswers });
  };

  const handleToggleCorrectOption = (qIndex: number, optionValue: string, isMultiple: boolean) => {
    const q = questions[qIndex];
    const currentCorrect = q.correctAnswer;
    let nextCorrect: string[] = [];

    if (isMultiple) {
      if (currentCorrect.includes(optionValue)) {
        nextCorrect = currentCorrect.filter((v) => v !== optionValue);
      } else {
        nextCorrect = [...currentCorrect, optionValue];
      }
    } else {
      nextCorrect = [optionValue];
    }

    handleQuestionChange(qIndex, { correctAnswer: nextCorrect });
  };

  const handleSaveQuestionsSheet = async () => {
    // Basic validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} has no question prompt.`);
        return;
      }
      if (q.type !== 'short_text' && q.options.length < 2) {
        setError(`Question ${i + 1} must have at least 2 options.`);
        return;
      }
      if (q.correctAnswer.length === 0) {
        setError(`Question ${i + 1} does not have any correct answer specified.`);
        return;
      }
    }

    setSavingQuestions(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await saveQuestions(quiz.id, questions);
      setSuccessMsg('Questions saved and quiz total marks updated.');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save questions.');
    } finally {
      setSavingQuestions(false);
    }
  };

  const totalMarksSum = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-foreground">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/quizzes"
            className="p-2 border border-border bg-card hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isQuizActive
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
              }`}>
                {isQuizActive ? 'Live' : 'Draft'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Access Code: <span className="font-mono font-semibold text-foreground uppercase">{accessCode}</span>
              <span className="mx-2">|</span>
              Total Marks: <span className="font-semibold text-foreground">{totalMarksSum}</span>
            </p>
          </div>
        </div>

        {/* HUD control buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href={`/leaderboard/${quiz.id}`}
            target="_blank"
            className="px-4 py-2 bg-secondary hover:bg-accent border border-border text-foreground rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <Trophy className="h-4 w-4 text-amber-500" />
            Leaderboard
          </Link>
          <button
            onClick={handleToggleStatus}
            disabled={togglingActive}
            className={`px-4 py-2 border rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isQuizActive
                ? 'bg-secondary hover:bg-accent text-foreground'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent'
            }`}
          >
            {togglingActive ? 'Updating...' : isQuizActive ? 'Deactivate Quiz' : 'Activate Quiz'}
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          Question Sheet ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Quiz Settings
        </button>
      </div>

      {/* Status Toasts notifications */}
      {error && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl">
          {successMsg}
        </div>
      )}

      {/* TABS CONTENT */}

      {/* Tab 1: Questions Panel */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl shadow-sm">
            <span className="text-xs text-muted-foreground font-semibold">
              Total questions: <span className="text-foreground">{questions.length}</span> | Cumulative Marks: <span className="text-foreground">{totalMarksSum}</span>
            </span>
            <button
              onClick={handleAddQuestion}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-xs cursor-pointer shadow transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm space-y-4 relative">
              <button
                onClick={() => handleDeleteQuestion(qIdx)}
                className="absolute top-6 right-6 p-2 rounded-lg bg-secondary/80 border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                title="Delete question"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {qIdx + 1}
                </span>

                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  {/* Question Type */}
                  <select
                    value={q.type}
                    onChange={(e) => handleQuestionChange(qIdx, { type: e.target.value as any })}
                    className="px-3 py-1.5 bg-secondary text-sm rounded-lg border border-border focus:outline-none"
                  >
                    <option value="mcq">MCQ (Single Choice)</option>
                    <option value="msq">MSQ (Multiple Choice)</option>
                    <option value="true_false">True / False</option>
                    <option value="short_text">Short Text Answer</option>
                  </select>

                  {/* Marks */}
                  <div className="flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-2 py-1">
                    <span className="text-xs text-muted-foreground">Marks:</span>
                    <input
                      type="number"
                      value={q.marks}
                      onChange={(e) => handleQuestionChange(qIdx, { marks: Number(e.target.value) })}
                      min={0}
                      className="w-12 bg-transparent text-sm border-none focus:outline-none font-bold"
                    />
                  </div>

                  {/* Difficulty */}
                  <select
                    value={q.difficulty}
                    onChange={(e) => handleQuestionChange(qIdx, { difficulty: e.target.value as any })}
                    className="px-3 py-1.5 bg-secondary text-sm rounded-lg border border-border focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Question Input prompt */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Question Prompt *</label>
                <textarea
                  value={q.question}
                  onChange={(e) => handleQuestionChange(qIdx, { question: e.target.value })}
                  placeholder="e.g. What is the complexity of binary search?"
                  className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm min-h-[80px]"
                  required
                />
              </div>

              {/* Options Input (Only for mcq, msq, true_false) */}
              {q.type !== 'short_text' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Options & Correct Answers *
                  </label>

                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correctAnswer.includes(opt);
                    const isMultiple = q.type === 'msq';
                    return (
                      <div key={optIdx} className="flex items-center gap-3 w-full">
                        {/* Selector indicator */}
                        <button
                          onClick={() => handleToggleCorrectOption(qIdx, opt, isMultiple)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              : 'bg-secondary border-border text-muted-foreground hover:bg-accent'
                          }`}
                          title={isCorrect ? 'Correct option' : 'Mark as correct'}
                          type="button"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>

                        {/* Option text */}
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                          className="flex-1 px-3 py-2 bg-secondary border border-border rounded-xl focus:outline-none text-sm"
                          disabled={q.type === 'true_false'} // True/False has rigid options
                        />

                        {/* Delete option */}
                        {q.type !== 'true_false' && q.options.length > 2 && (
                          <button
                            onClick={() => handleDeleteOption(qIdx, optIdx)}
                            className="p-2 border border-border bg-secondary hover:bg-destructive/15 hover:text-destructive rounded-xl transition-all cursor-pointer"
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add option button */}
                  {q.type !== 'true_false' && (
                    <button
                      onClick={() => handleAddOption(qIdx)}
                      className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:text-primary/80 transition-colors mt-2 cursor-pointer"
                      type="button"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Short Text Input description */}
              {q.type === 'short_text' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Correct Answer(s) *
                  </label>
                  <input
                    type="text"
                    value={q.correctAnswer.join(', ')}
                    onChange={(e) =>
                      handleQuestionChange(qIdx, {
                        correctAnswer: e.target.value.split(',').map((val) => val.trim()),
                      })
                    }
                    placeholder="e.g. O(log n), log n (comma separate acceptable alternatives)"
                    className="w-full px-3 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none text-sm"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Acceptable answers are case-insensitive and trimmed. Enter multiple alternatives split by commas.
                  </p>
                </div>
              )}

              {/* Tags & Metadata */}
              <div className="flex items-center gap-2 border-t border-border pt-4">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tags (split with commas, e.g. recursion, arrays)"
                  value={q.tags.join(', ')}
                  onChange={(e) =>
                    handleQuestionChange(qIdx, {
                      tags: e.target.value.split(',').map((val) => val.trim()).filter((t) => t !== ''),
                    })
                  }
                  className="bg-transparent border-none focus:outline-none text-xs w-full text-foreground"
                />
              </div>
            </div>
          ))}

          {/* Bottom actions */}
          <div className="flex justify-end gap-3 bg-card border border-border p-4 rounded-xl shadow-sm">
            <button
              onClick={handleSaveQuestionsSheet}
              disabled={savingQuestions}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow cursor-pointer text-sm disabled:opacity-50"
            >
              {savingQuestions ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Questions...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Question Sheet
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Settings Panel */}
      {activeTab === 'settings' && (
        <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 md:p-8">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Quiz Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description / Instructions</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-mono uppercase"
                  required
                />
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
                  className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">End Date & Time *</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Checkboxes */}
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

            <div className="flex justify-end gap-3 border-t border-border pt-6 mt-6">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 cursor-pointer text-sm disabled:opacity-50"
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Settings...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Quiz Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
