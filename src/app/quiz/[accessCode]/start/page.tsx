'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getQuizForTaker, saveAnswers } from '@/app/actions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShieldAlert, AlertTriangle, Clock, ChevronLeft, ChevronRight, Save, CheckCircle, Loader2 } from 'lucide-react';

function QuizTakerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const accessCode = params.accessCode as string;
  const submissionId = searchParams.get('sid');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz details
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  
  // Student progress
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Anti-cheat stats
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Ref to hold current state values for event listeners and interval loops
  const stateRef = useRef({ answers, tabSwitchCount, fullscreenExitCount, isSubmitting });
  useEffect(() => {
    stateRef.current = { answers, tabSwitchCount, fullscreenExitCount, isSubmitting };
  }, [answers, tabSwitchCount, fullscreenExitCount, isSubmitting]);

  // Load Quiz & Questions
  useEffect(() => {
    if (!submissionId) {
      router.push(`/quiz/${accessCode}`);
      return;
    }

    async function initQuiz() {
      try {
        const data = await getQuizForTaker(accessCode, submissionId!);
        setQuiz(data.quiz);
        setQuestions(data.questions);
        setAnswers(data.savedAnswers || {});
        setTabSwitchCount(data.tabSwitchCount || 0);
        setFullscreenExitCount(data.fullscreenExitCount || 0);
        setTimeLeft(data.timeLeftSeconds);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize quiz taker.');
        setLoading(false);
      }
    }
    initQuiz();
  }, [accessCode, submissionId, router]);

  // Handle Fullscreen state change
  useEffect(() => {
    if (loading || error || isSubmitting) return;

    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);

      if (!isFs && !stateRef.current.isSubmitting) {
        // Exited fullscreen!
        const nextFsCount = stateRef.current.fullscreenExitCount + 1;
        setFullscreenExitCount(nextFsCount);
        // Trigger saving stats to DB
        triggerAutoSave(stateRef.current.answers, stateRef.current.tabSwitchCount, nextFsCount);
        setWarningMessage('Fullscreen Mode is REQUIRED. Exiting fullscreen is logged as a violation.');
        setShowWarningModal(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [loading, error, isSubmitting]);

  // Handle Tab Switch and Window Blur
  useEffect(() => {
    if (loading || error || isSubmitting) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !stateRef.current.isSubmitting) {
        // Tab switched!
        const nextTabCount = stateRef.current.tabSwitchCount + 1;
        setTabSwitchCount(nextTabCount);
        triggerAutoSave(stateRef.current.answers, nextTabCount, stateRef.current.fullscreenExitCount);
        setWarningMessage('Tab Switch Detected! Moving away from the quiz page is logged as a violation.');
        setShowWarningModal(true);
      }
    };

    const handleWindowBlur = () => {
      if (!stateRef.current.isSubmitting) {
        // Window blurred (clicked outside browser or on secondary display)
        const nextTabCount = stateRef.current.tabSwitchCount + 1;
        setTabSwitchCount(nextTabCount);
        triggerAutoSave(stateRef.current.answers, nextTabCount, stateRef.current.fullscreenExitCount);
        setWarningMessage('Window Focus Lost! Navigating outside the browser window is logged as a violation.');
        setShowWarningModal(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [loading, error, isSubmitting]);

  // Countdown timer effect
  useEffect(() => {
    if (loading || error || isSubmitting || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, timeLeft, isSubmitting]);

  // Auto-save Answers every 15 seconds
  useEffect(() => {
    if (loading || error || isSubmitting) return;

    const interval = setInterval(() => {
      triggerAutoSave(
        stateRef.current.answers,
        stateRef.current.tabSwitchCount,
        stateRef.current.fullscreenExitCount
      );
    }, 15000);

    return () => clearInterval(interval);
  }, [loading, error, isSubmitting]);

  // Helper to trigger saveAnswers
  const triggerAutoSave = async (
    currAnswers: Record<string, string[]>,
    currTabCount: number,
    currFsCount: number
  ) => {
    if (stateRef.current.isSubmitting) return;
    setAutoSaveStatus('saving');
    try {
      await saveAnswers(
        submissionId!,
        currAnswers,
        { tabSwitchCount: currTabCount, fullscreenExitCount: currFsCount },
        false
      );
      setAutoSaveStatus('saved');
    } catch (err) {
      console.error('Auto-save failed:', err);
      setAutoSaveStatus('error');
    }
  };

  // Enter Fullscreen request
  const enterFullscreen = async () => {
    const element = document.documentElement;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowWarningModal(false);
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  };

  // Student answer updates
  const handleSelectOption = (questionId: string, optionValue: string, isMultiple: boolean) => {
    const currentSelected = answers[questionId] || [];
    let nextSelected: string[] = [];

    if (isMultiple) {
      // Toggle selected option
      if (currentSelected.includes(optionValue)) {
        nextSelected = currentSelected.filter((opt) => opt !== optionValue);
      } else {
        nextSelected = [...currentSelected, optionValue];
      }
    } else {
      // Single selection
      nextSelected = [optionValue];
    }

    const updatedAnswers = { ...answers, [questionId]: nextSelected };
    setAnswers(updatedAnswers);
    // Save changes immediately on student input
    triggerAutoSave(updatedAnswers, stateRef.current.tabSwitchCount, stateRef.current.fullscreenExitCount);
  };

  const handleShortTextChange = (questionId: string, val: string) => {
    const updatedAnswers = { ...answers, [questionId]: [val] };
    setAnswers(updatedAnswers);
    // Save input
    triggerAutoSave(updatedAnswers, stateRef.current.tabSwitchCount, stateRef.current.fullscreenExitCount);
  };

  // Submit test
  const handleFinalSubmit = async (timeExpired = false) => {
    if (stateRef.current.isSubmitting) return;

    if (!timeExpired && !confirm('Are you sure you want to submit the quiz? This action is permanent.')) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Exit fullscreen if browser is in fullscreen
      if (typeof window !== 'undefined' && document.fullscreenElement) {
        await document.exitFullscreen();
      }

      await saveAnswers(
        submissionId!,
        stateRef.current.answers,
        {
          tabSwitchCount: stateRef.current.tabSwitchCount,
          fullscreenExitCount: stateRef.current.fullscreenExitCount,
        },
        true // isFinal
      );

      // Redirect to success screen
      router.push(`/quiz/${accessCode}/success?sid=${submissionId}`);
    } catch (err: any) {
      alert(err.message || 'Submission failed. Please try again.');
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // Helper format seconds -> mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading && !isSubmitting) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading quiz questions & anti-cheat systems...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground justify-center items-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Quiz Room Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.push(`/quiz/${accessCode}`)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow hover:bg-primary/90 transition-colors"
          >
            Go to Registration
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isQuestionAnswered = (qId: string) => {
    const ans = answers[qId];
    return ans && ans.length > 0 && ans[0].trim() !== '';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Active Quiz Header / HUD */}
      <header className="flex justify-between items-center py-4 px-6 border-b border-border bg-card shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight md:text-lg">{quiz.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>Duration: {quiz.duration} mins</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>Remaining time: </span>
              <span className={`font-mono font-semibold ${timeLeft < 60 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Cheat Sheet HUD */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              <ShieldAlert className="h-4 w-4" />
              <span>Tab Switches: <span className="font-bold">{tabSwitchCount}</span></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span>Exits Fullscreen: <span className="font-bold">{fullscreenExitCount}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Save className="h-3 w-3" />
              {autoSaveStatus === 'saving' && 'Saving...'}
              {autoSaveStatus === 'saved' && 'Draft saved'}
              {autoSaveStatus === 'error' && 'Save Error!'}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Screen blocker to force fullscreen mode */}
      {!isFullscreen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md flex flex-col justify-center items-center p-6 text-center z-50 transition-all duration-300">
          <div className="max-w-md bg-card border border-border p-8 rounded-2xl shadow-2xl flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
              <ShieldAlert className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Fullscreen Locked</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This assessment platform enforces Strict Fullscreen Mode. Exiting this mode, opening new tabs, or swapping applications is recorded as a violation.
            </p>
            <button
              onClick={enterFullscreen}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 cursor-pointer flex items-center gap-2"
            >
              Enter Fullscreen & Resume
            </button>
          </div>
        </div>
      )}

      {/* Warnings Popup modal */}
      {showWarningModal && isFullscreen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="max-w-md w-full bg-card border border-destructive/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold">Anti-Cheat Alert</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-6">{warningMessage}</p>
            <div className="grid grid-cols-2 gap-4 text-center text-xs mb-6">
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <p className="text-muted-foreground mb-1">Tab Switches</p>
                <p className="text-lg font-bold text-destructive">{tabSwitchCount}</p>
              </div>
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <p className="text-muted-foreground mb-1">Fullscreen Exits</p>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{fullscreenExitCount}</p>
              </div>
            </div>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl cursor-pointer hover:bg-primary/90 transition-colors text-foreground"
            >
              I Understand, Resume Test
            </button>
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 items-stretch overflow-hidden">
        
        {/* Left Sidebar: Questions list navigator */}
        <aside className="w-full md:w-64 bg-card border border-border rounded-xl p-4 flex flex-col h-auto md:h-fit shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Questions Index
          </span>
          <div className="grid grid-cols-5 md:grid-cols-4 gap-2.5">
            {questions.map((q, idx) => (
              <button
                key={q._id}
                onClick={() => setCurrentIndex(idx)}
                className={`py-2 px-1 text-center text-sm font-semibold font-mono rounded-lg transition-all border cursor-pointer ${
                  idx === currentIndex
                    ? 'bg-primary border-primary text-primary-foreground shadow'
                    : isQuestionAnswered(q._id)
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-secondary border-border hover:bg-accent text-secondary-foreground'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </button>
            ))}
          </div>

          <div className="border-t border-border mt-6 pt-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-primary" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-emerald-500/20 border border-emerald-500/30" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-secondary border border-border" />
              <span>Unanswered</span>
            </div>
          </div>
        </aside>

        {/* Center Panel: Active Question details */}
        {questions.length > 0 && (
          <main className="flex-1 bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm min-h-[400px]">
            
            {/* Question Header */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  Marks: <span className="font-semibold text-foreground">{currentQuestion.marks}</span>
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-xl font-bold tracking-tight mb-6 mt-2 whitespace-pre-wrap text-foreground">
                {currentQuestion.question}
              </h2>

              {/* Question Answers Input Area */}
              <div className="space-y-3">
                {/* 1. MCQ (Single Correct) */}
                {currentQuestion.type === 'mcq' &&
                  currentQuestion.options.map((opt: string, idx: number) => (
                    <label
                      key={idx}
                      onClick={() => handleSelectOption(currentQuestion._id, opt, false)}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-accent transition-all duration-200 ${
                        (answers[currentQuestion._id] || []).includes(opt)
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border bg-secondary/35 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name={currentQuestion._id}
                        checked={(answers[currentQuestion._id] || []).includes(opt)}
                        onChange={() => {}} // handled by click on wrapper
                        className="h-4.5 w-4.5 text-primary focus:ring-primary accent-primary"
                      />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}

                {/* 2. MSQ (Multiple Correct) */}
                {currentQuestion.type === 'msq' &&
                  currentQuestion.options.map((opt: string, idx: number) => (
                    <label
                      key={idx}
                      onClick={() => handleSelectOption(currentQuestion._id, opt, true)}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-accent transition-all duration-200 ${
                        (answers[currentQuestion._id] || []).includes(opt)
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border bg-secondary/35 text-foreground'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(answers[currentQuestion._id] || []).includes(opt)}
                        onChange={() => {}} // handled by click wrapper
                        className="h-4.5 w-4.5 text-primary rounded focus:ring-primary accent-primary"
                      />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}

                {/* 3. True / False */}
                {currentQuestion.type === 'true_false' &&
                  ['True', 'False'].map((opt) => (
                    <label
                      key={opt}
                      onClick={() => handleSelectOption(currentQuestion._id, opt, false)}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-accent transition-all duration-200 ${
                        (answers[currentQuestion._id] || []).includes(opt)
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border bg-secondary/35 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name={currentQuestion._id}
                        checked={(answers[currentQuestion._id] || []).includes(opt)}
                        onChange={() => {}}
                        className="h-4.5 w-4.5 text-primary focus:ring-primary accent-primary"
                      />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}

                {/* 4. Short Text */}
                {currentQuestion.type === 'short_text' && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Your Answer
                    </label>
                    <textarea
                      value={answers[currentQuestion._id]?.[0] || ''}
                      onChange={(e) => handleShortTextChange(currentQuestion._id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Navigator */}
            <div className="flex justify-between items-center border-t border-border pt-6 mt-8 gap-4">
              <button
                onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2 border border-border hover:bg-accent rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={() => handleFinalSubmit(false)}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex((idx) => Math.min(questions.length - 1, idx + 1))}
                  className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

          </main>
        )}
      </div>
    </div>
  );
}

export default function QuizTaker() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background text-foreground justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Initializing assessment taker environment...</p>
      </div>
    }>
      <QuizTakerContent />
    </Suspense>
  );
}
