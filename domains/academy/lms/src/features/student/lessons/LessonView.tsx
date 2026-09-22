import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useCourseDetails,
  useMarkLessonComplete,
  useEnrollments,
  useStudentAnalytics,
  useStudentDashboard,
  useSubmitExercise,
  useCourseReport,
} from "@/hooks/useAcademy";
import { useMyTransactions } from "@/features/student/hooks/usePayment";

import { academyService } from "@/services/academyService";
import { useUser, useLogout } from "@/features/auth/hooks/useAuth";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  CheckCircle2,
  Check,
  LockKeyhole,
  Circle,
  Lock,
  Menu,
  X,
  Play,
  ArrowLeft,
  PlaySquare,
  Maximize2,
  Expand,
  BookOpen,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  Clock,
  Link2,
  Unlock,
} from "lucide-react";
import PdfViewer from "./components/PdfViewer";
import InlinePdfViewer from "./components/InlinePdfViewer";
import CelebrationModal from "./components/CelebrationModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CourseItem {
  id: string;
  title: string;
  lessonId: string;
  itemType: "video" | "reading" | "quiz" | "pdf";
  type?: string;
  url?: string;
  exercises?: any[];
  fullTitle?: string;
  content?: string;
}

const sentenceCase = (str?: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const LmsLearn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading } = useCourseDetails(id || "");
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: analytics } = useStudentAnalytics();
  const markCompleteMutation = useMarkLessonComplete();
  const submitExerciseMutation = useSubmitExercise();
  const { data: dashboardData } = useStudentDashboard();
  const { data: reportData, isLoading: isReportLoading } = useCourseReport(
    id || "",
  );
  const { data: user } = useUser();
  const logout = useLogout();

  const profileRef = useRef<HTMLDivElement>(null);
  const markedLessonsRef = useRef<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(),
  );
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup: Clear legacy assessment localStorage keys on mount to ensure fresh state
  useEffect(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("academy_ex_")) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const userInitials = user
    ? `${user.firstname?.charAt(0) || ""}${user.lastname?.charAt(0) || ""}`.toUpperCase()
    : "U";

  const { data: myTransactions } = useMyTransactions();

  const enrollment = enrollments?.find(
    (e) =>
      String(e.courseId) === String(id) || String(e.course?.id) === String(id),
  );

  // Cross-check: a COMPLETED transaction for this course means the admin approved payment
  const hasCompletedTransaction = myTransactions?.some(
    (tx: any) =>
      tx.status === "COMPLETED" &&
      (tx.metadata as any)?.courseId === Number(id),
  );

  const isEnrolled =
    (enrollment &&
      (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED")) ||
    hasCompletedTransaction;

  const courseProgressData = dashboardData?.find(
    (d: any) => d.courseId === Number(id),
  );
  const progress = Math.round(
    courseProgressData?.percentage || enrollment?.progress || 0,
  );

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [activeItemType, setActiveItemType] = useState<
    "video" | "reading" | "quiz" | "pdf"
  >("video");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});
  const [celebration, setCelebration] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isLastItem?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    isLastItem: false,
  });

  const isLastItemInModule = () => {
    const currentModule = course?.modules?.find((m: any) =>
      m.lessons?.some((l: any) => l.id === activeLessonId),
    );
    if (
      !currentModule ||
      !currentModule.lessons ||
      currentModule.lessons.length === 0
    )
      return false;
    const lastLessonInModule =
      currentModule.lessons[currentModule.lessons.length - 1];

    const itemsInLastLesson = allItems.filter(
      (i) => i.lessonId === lastLessonInModule.id,
    );
    if (!itemsInLastLesson.length) return false;

    return activeItemId === itemsInLastLesson[itemsInLastLesson.length - 1].id;
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const flatLessons = course?.modules?.flatMap((m) => m.lessons || []) || [];
  const currentLessonIndex = flatLessons.findIndex(
    (l) => l.id === activeLessonId,
  );
  const activeLesson = flatLessons[currentLessonIndex];

  const allItems: CourseItem[] =
    course?.modules?.flatMap(
      (m) =>
        m.lessons?.flatMap((l) => {
          const items: CourseItem[] =
            l.contents?.map((c) => ({
              ...c,
              lessonId: l.id,
              itemType: (c.type === "VIDEO" ? "video" : "reading") as
                | "video"
                | "reading"
                | "quiz"
                | "pdf",
            })) || [];

          if (l.exercises && l.exercises.length > 0) {
            const groupedAssessments = l.exercises.reduce(
              (acc: any, ex: any) => {
                const title = ex.title || `Practice: ${l.title}`;
                const groupKey = title.includes(" ||| ")
                  ? title.split(" ||| ")[1]
                  : title;
                if (!acc[groupKey])
                  acc[groupKey] = { fullTitle: title, exercises: [] };
                acc[groupKey].exercises.push(ex);
                return acc;
              },
              {} as Record<string, any>,
            );
            Object.entries(groupedAssessments).forEach(
              ([groupKey, group]: [string, any]) => {
                const { fullTitle, exercises } = group;
                const displayTitle = fullTitle.split(" ||| ")[0];
                items.push({
                  id: `quiz-${l.id}-${groupKey.replace(/\s+/g, "-").toLowerCase()}`,
                  title: displayTitle,
                  fullTitle,
                  lessonId: l.id,
                  itemType: "quiz",
                  exercises,
                });
              },
            );
          }
          return items;
        }) || [],
    ) || [];

  // Prioritize exact item.id match; only fall back to exercise-id lookup
  let currentItemIndex = allItems.findIndex(
    (item: CourseItem) => item.id === activeItemId,
  );
  if (currentItemIndex === -1) {
    // Fallback: check inside quiz exercises (for legacy quiz navigation)
    currentItemIndex = allItems.findIndex(
      (item: CourseItem) =>
        item.itemType === "quiz" &&
        item.exercises?.some((ex: any) => ex.id === activeItemId),
    );
  }
  const activeItem = allItems[currentItemIndex];
  const isPdf =
    (activeItem as any)?.type === "PDF" ||
    (activeItem as any)?.url?.toLowerCase().endsWith(".pdf");

  const exercises =
    (activeItem as any)?.exercises || activeLesson?.exercises || [];

  const [detailedExercisesMap, setDetailedExercisesMap] = useState<
    Record<string, any>
  >({});
  const [exerciseFetchKey, setExerciseFetchKey] = useState("");

  // Fetch exercise details sequentially to avoid 429 rate limiting
  useEffect(() => {
    if (activeItemType !== "quiz" || exercises.length === 0) return;

    const key = exercises.map((ex: any) => ex.id).join(",");
    if (key === exerciseFetchKey) return; // Already fetched this set
    setExerciseFetchKey(key);

    let cancelled = false;
    (async () => {
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
      for (const ex of exercises) {
        if (cancelled) return;
        // Skip if already cached
        if (detailedExercisesMap[ex.id]) continue;
        try {
          const data = await academyService.getExerciseDetails(ex.id);
          if (!cancelled) {
            setDetailedExercisesMap((prev) => ({ ...prev, [ex.id]: data }));
          }
        } catch (e) {
          console.warn(`Failed to fetch exercise ${ex.id}`, e);
        }
        await delay(300);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeItemType, exercises.map((e: any) => e.id).join(",")]);

  const detailedExercises = exercises.map((ex: any) => {
    return detailedExercisesMap[ex.id] || ex;
  });
  const lastSyncKey = JSON.stringify(
    detailedExercises.map((ex: any) => ex?.mySubmission?.updatedAt || ex?.id),
  );

  // Hydrate completed lessons from backend on mount
  useEffect(() => {
    if (!course?.modules) return;
    let cancelled = false;
    (async () => {
      const completed = new Set<string>();
      const lessons =
        course.modules?.flatMap((m: any) => m.lessons || []) || [];
      await Promise.all(
        lessons.map(async (lesson: any) => {
          try {
            const data = await academyService.checkLessonComplete(
              course.id,
              lesson.id,
            );
            if (data?.completed || data?.isCompleted || data === true) {
              completed.add(String(lesson.id));
            }
          } catch (_) {
            // silently skip failed checks
          }
        }),
      );
      if (!cancelled) setCompletedLessons(completed);
    })();
    return () => {
      cancelled = true;
    };
  }, [course?.id]);

  // Auto-select first item
  useEffect(() => {
    if (course && allItems.length > 0 && !activeItemId) {
      const firstItem = allItems[0];
      setActiveItemId(firstItem.id);
      setActiveLessonId(firstItem.lessonId);
      setActiveItemType(
        firstItem.itemType as "video" | "reading" | "quiz" | "pdf",
      );
      if (course.modules?.[0]) {
        setExpandedModules({ [course.modules[0].id]: true });
      }
    }
  }, [course, activeItemId, allItems]);

  const prevQuizLessonRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeItem) {
      setActiveLessonId(activeItem.lessonId);
      setActiveItemType(
        activeItem.itemType as "video" | "reading" | "quiz" | "pdf",
      );
      setIsAnswered(false);
      // Only reset quiz state when switching to a DIFFERENT quiz lesson
      if (
        activeItem.itemType === "quiz" &&
        activeItem.lessonId !== prevQuizLessonRef.current
      ) {
        prevQuizLessonRef.current = activeItem.lessonId;
        setQuizSubmitted(false);
        setQuizScore(0);
        setSelectedAnswers({});
      }
    }
  }, [activeItem]);

  const detailedExercisesLoaded = Object.keys(detailedExercisesMap).length;

  useEffect(() => {
    if (activeItemType === "quiz" && detailedExercises.length) {
      const answers: Record<string, string> = {};
      let submittedCount = 0;
      let score = 0;
      const reportLesson = reportData
        ?.flatMap((m: any) => m.lessons || [])
        .find((l: any) => Number(l.lessonId) === Number(activeLessonId));

      detailedExercises.forEach((ex: any) => {
        const reportExercise = reportLesson?.exercises?.find(
          (rex: any) => Number(rex.exerciseId) === Number(ex.id),
        );
        const storedAnswer =
          ex.mySubmission?.answer ||
          reportExercise?.answer ||
          ex.userAnswer ||
          ex.submission?.answer;
        const isCompletedState =
          !!storedAnswer ||
          reportExercise?.status === "GRADED" ||
          reportExercise?.status === "COMPLETED";

        if (isCompletedState) {
          answers[ex.id] = storedAnswer || ex.correctAnswer || "SUBMITTED";
          submittedCount++;
          // Use server/report data for scoring
          const isCorrect =
            reportExercise?.status === "GRADED" &&
            (reportExercise?.isCorrect || reportExercise?.score > 0);
          if (isCorrect) score++;
        }
      });

      const isLoadingSubmissions = exercises.some(
        (ex: any) => !detailedExercisesMap[ex.id],
      );
      if (submittedCount > 0) {
        setSelectedAnswers(answers);
        setQuizSubmitted(true);
        setQuizScore(score);
      } else if (!isLoadingSubmissions) {
        setQuizSubmitted(false);
        setQuizScore(0);
        setSelectedAnswers({});
      }
    }
    // Don't reset quiz state when exercises are still loading — wait for them to arrive
  }, [
    activeLessonId,
    lastSyncKey,
    reportData,
    activeItemType,
    detailedExercisesLoaded,
  ]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || isReportLoading) {
    return (
      <div className="min-h-screen bg-[var(--lms-bg)] flex h-screen">
        <div className="w-72 h-full bg-[var(--lms-surface)] border-r border-[var(--lms-border)] p-4 flex flex-col gap-3">
          <Skeleton className="h-8 w-36 mb-2" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-[360px] w-full rounded-lg" />
          <Skeleton className="h-8 w-2/3 rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--lms-bg)] p-6">
        <h2 className="text-2xl font-bold text-[var(--lms-ink)] mb-2">
          Course not found
        </h2>
        <p className="text-[var(--lms-muted)] mb-6 text-center max-w-md">
          We couldn't find the course you're looking for.
        </p>
        <Button onClick={() => navigate("/dashboard")} className="rounded-lg">
          Return to My Learning
        </Button>
      </div>
    );
  }

  if (!enrollmentsLoading && !isEnrolled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--lms-bg)] p-6 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-lg flex items-center justify-center mb-6 border border-amber-100 shadow-[var(--lms-shadow-sm)]">
          <Lock className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-3xl font-bold text-[var(--lms-ink)] mb-3 tracking-normal">
          Access Restricted
        </h2>
        <p className="text-[var(--lms-muted)] mb-8 max-w-md leading-relaxed">
          {enrollment?.status === "PENDING"
            ? "Your enrollment is pending. Payment or approval may be required."
            : "You are not enrolled in this course. Enroll to get access."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => navigate(`/courses/${id}`)}
            className="rounded-lg h-12 px-8 bg-[var(--lms-ink)] hover:bg-[var(--lms-navy)] font-bold"
          >
            {enrollment?.status === "PENDING"
              ? "View Enrollment Status"
              : "Go to Enrollment Page"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg h-12 px-8 font-bold"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const checkLessonCompleted = (lessonId: string | number) => {
    const key = String(lessonId);
    if (completedLessons.has(key)) return true;
    if (!reportData) return false;
    // Flatten report to find the lesson
    for (const moduleObj of reportData) {
      if (moduleObj.lessons) {
        const found = moduleObj.lessons.find(
          (l: any) => Number(l.lessonId) === Number(lessonId),
        );
        if (found && found.status === "COMPLETED") return true;
      }
    }
    return false;
  };

  const isLessonCompleted = activeLessonId
    ? checkLessonCompleted(activeLessonId)
    : false;

  const isLessonLocked = (lessonId: string | number) => {
    return false; // Unlock all lessons as per user request
  };

  const handleMarkComplete = () => {
    if (activeLessonId) {
      const lessonKey = String(activeLessonId);
      if (
        markedLessonsRef.current.has(lessonKey) ||
        markCompleteMutation.isPending
      )
        return;

      markedLessonsRef.current.add(lessonKey);
      markCompleteMutation.mutate(
        { courseId: course.id, lessonId: activeLessonId },
        {
          onSuccess: () => {
            setCompletedLessons((prev) =>
              new Set(prev).add(String(activeLessonId)),
            );
            const isModuleEnd = isLastItemInModule();
            setCelebration({
              isOpen: true,
              title: isModuleEnd
                ? "Module Mastered!"
                : "Skill lesson completed",
              message: isModuleEnd
                ? "Excellent progress, keep up the momentum!"
                : "You're one step closer to your goal.",
              isLastItem: currentItemIndex === allItems.length - 1,
            });
          },
        },
      );
    }
  };

  const handleNextItem = () => {
    if (currentItemIndex < allItems.length - 1) {
      const nextItem = allItems[currentItemIndex + 1];
      setActiveItemId(nextItem.id);
      setActiveItemType(nextItem.itemType);
    }
  };

  const handlePrevItem = () => {
    if (currentItemIndex > 0) {
      const prevItem = allItems[currentItemIndex - 1];
      setActiveItemId(prevItem.id);
      setActiveItemType(prevItem.itemType);
    }
  };

  const handleOptionSelect = (exerciseId: string, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [exerciseId]: option }));
  };

  const isYouTube = (url?: string) => {
    if (!url) return false;
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = "";
    try {
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
      } else if (url.includes("youtube.com/watch")) {
        videoId = new URL(url).searchParams.get("v") || "";
      } else if (url.includes("youtube.com/embed/")) {
        videoId = url.split("youtube.com/embed/")[1].split("?")[0];
      }
    } catch (e) {
      console.error(e);
    }
    const origin = window.location.origin;
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&enablejsapi=1&origin=${origin}`;
  };

  const getFullUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const baseUrl = import.meta.env.VITE_API_URL || "https://api.consultancy.alikohub.com";
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
  };

  const parseOptions = (options: any): string[] => {
    if (Array.isArray(options)) return options;
    if (typeof options === "string") {
      try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return options
          .split(",")
          .map((o: string) => o.trim())
          .filter(Boolean);
      }
    }
    return [];
  };

  // ── Content renderer ──────────────────────────────────────────────────────
  const renderActiveContent = () => {
    // ── Quiz ─────────────────────────────────────────────────────────────
    if (activeItemType === "quiz") {
      const exercisesList = detailedExercises || [];
      const isFinished = isLessonCompleted;

      return (
        <main className="lesson-content">
          <div className="content-head">
            <span className="material-badge">Lesson Assessment</span>
          </div>
          <p className="course-name">{course?.title}</p>
          <h2>{activeItem?.title || "Assessment"}</h2>

          <div className="space-y-6 pb-32 max-w-4xl">
            {/* Quiz summary card */}
            <div className="rounded-lg bg-white border border-[var(--lovable-border)] p-6 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--lovable-active-soft)] text-[var(--lovable-primary)] border border-[var(--lovable-border)]">
                  <HelpCircle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--lovable-fg)] font-sora m-0">
                    {activeItem?.title || "Lesson Assessment"}
                  </h3>
                  {quizSubmitted ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-emerald-600 font-manrope">
                        Score: {quizScore} / {exercisesList.length}
                      </span>
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs px-2 py-0.5">
                        {Math.round((quizScore / exercisesList.length) * 100)}%
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--lovable-muted-fg)] font-medium mt-1 m-0">
                      {exercisesList.length} Questions · Answer all to submit.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Questions */}
            {exercisesList.map((exercise: any, index: number) => {
              const options = parseOptions(exercise.options);
              return (
                <div
                  key={exercise.id}
                  className="rounded-lg bg-white border border-[var(--lovable-border)] shadow-xs p-5 font-manrope"
                >
                  <div className="mb-2">
                    <span className="text-[10px] font-semibold text-[var(--lovable-primary)] uppercase tracking-wider bg-[var(--lovable-active-soft)] px-2.5 py-0.5 rounded">
                      Question {index + 1}
                    </span>
                  </div>
                  <div className="mb-4 text-sm font-semibold text-[var(--lovable-fg)] leading-snug font-sora">
                    {exercise.question}
                  </div>
                  <RadioGroup
                    value={selectedAnswers[exercise.id] || ""}
                    onValueChange={(v) =>
                      !quizSubmitted && handleOptionSelect(exercise.id, v)
                    }
                    className="flex flex-col gap-2.5"
                    disabled={quizSubmitted}
                  >
                    {options.map((option, idx) => {
                      const isSelected =
                        selectedAnswers[exercise.id] === option;
                      const knownCorrectAnswer = exercise.correctAnswer;
                      const isCorrect = knownCorrectAnswer
                        ? knownCorrectAnswer === option
                        : false;
                      const isWrong =
                        isSelected && knownCorrectAnswer && !isCorrect;

                      let cls = "border-[var(--lovable-border)] bg-white hover:bg-[var(--lovable-muted)]";
                      if (quizSubmitted) {
                        if (isCorrect)
                          cls = "border-emerald-500 bg-emerald-50 text-emerald-900";
                        else if (isWrong) cls = "border-red-400 bg-red-50 text-red-900";
                        else cls = "border-[var(--lovable-border)] bg-slate-50 opacity-60";
                      } else if (isSelected) {
                        cls = "border-[var(--lovable-primary)] bg-[var(--lovable-active-soft)] text-[var(--lovable-primary)] font-semibold";
                      }

                      return (
                        <Label
                          key={idx}
                          htmlFor={`q${exercise.id}-o${idx}`}
                          className={cn(
                            "flex items-center gap-3 rounded-md border p-3 transition-all duration-150 text-sm font-medium",
                            !quizSubmitted ? "cursor-pointer" : "cursor-default",
                            cls,
                          )}
                        >
                          {!quizSubmitted ? (
                            <RadioGroupItem
                              value={option}
                              id={`q${exercise.id}-o${idx}`}
                              className={cn("transition-colors", isSelected ? "text-[var(--lovable-primary)] border-[var(--lovable-primary)]" : "")}
                            />
                          ) : isCorrect ? (
                            <CheckCircle2
                              size={18}
                              className="text-emerald-600 shrink-0"
                            />
                          ) : isWrong ? (
                            <X size={18} className="text-red-500 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span>{option}</span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </div>
              );
            })}

            {!quizSubmitted && (
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => {
                    const allAnswered = exercisesList.every(
                      (ex: any) => selectedAnswers[ex.id],
                    );
                    if (!allAnswered) {
                      toast.error("Please answer all questions.");
                      return;
                    }
                    (async () => {
                      try {
                        const delay = (ms: number) =>
                          new Promise((res) => setTimeout(res, ms));
                        const submitResults: Record<
                          string,
                          { isCorrect: boolean; correctAnswer?: string }
                        > = {};
                        for (const idx in exercisesList) {
                          const ex = exercisesList[idx];
                          const result =
                            await submitExerciseMutation.mutateAsync({
                              exerciseId: ex.id,
                              answer: selectedAnswers[ex.id],
                            });
                          submitResults[ex.id] = {
                            isCorrect:
                              result?.isCorrect ??
                              selectedAnswers[ex.id] === ex.correctAnswer,
                            correctAnswer:
                              result?.correctAnswer || ex.correctAnswer,
                          };
                          if (Number(idx) < exercisesList.length - 1) {
                            await delay(500);
                          }
                        }
                        const serverScore = Object.values(
                          submitResults,
                        ).filter((r) => r.isCorrect).length;
                        setQuizScore(serverScore);
                        setQuizSubmitted(true);

                        const showCelebration = () => {
                          const isModuleEnd = isLastItemInModule();
                          setCelebration({
                            isOpen: true,
                            title: isModuleEnd
                              ? "Module Mastered!"
                              : "Quiz submitted",
                            message: isModuleEnd
                              ? "Excellent progress, keep up the momentum!"
                              : "Your answers have been recorded.",
                            isLastItem:
                              currentItemIndex === allItems.length - 1,
                          });
                        };

                        if (!isLessonCompleted && activeLessonId) {
                          const lessonKey = String(activeLessonId);
                          if (!markedLessonsRef.current.has(lessonKey)) {
                            markedLessonsRef.current.add(lessonKey);
                            markCompleteMutation.mutate(
                              {
                                courseId: course.id,
                                lessonId: activeLessonId,
                              },
                              {
                                onSuccess: () => {
                                  setCompletedLessons((prev) =>
                                    new Set(prev).add(String(activeLessonId)),
                                  );
                                  showCelebration();
                                },
                              },
                            );
                          } else {
                            showCelebration();
                          }
                        } else {
                          showCelebration();
                        }
                      } catch (e) {
                        toast.error(
                          "Failed to submit some answers properly.",
                        );
                      }
                    })();
                  }}
                  disabled={submitExerciseMutation.isPending}
                  className="complete-button"
                  style={{ width: "200px" }}
                >
                  Submit Quiz
                </Button>
              </div>
            )}
          </div>
        </main>
      );
    }

    // ── Video ─────────────────────────────────────────────────────────────
    if (activeItemType === "video") {
      const isFinished = isLessonCompleted;

      return (
        <main className="lesson-content">
          <div className="content-head">
            <span className="material-badge">Video lesson</span>
          </div>
          <p className="course-name">{course?.title}</p>
          <h2>{activeItem?.title || activeLesson?.title}</h2>

          <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden shadow-sm mb-8">
            {isYouTube((activeItem as any)?.url) ? (
              <iframe
                className="absolute inset-0 w-full h-full border-0 z-10"
                src={getYouTubeEmbedUrl((activeItem as any)?.url || "")}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={getFullUrl((activeItem as any)?.url) || undefined}
                controls
                controlsList="nodownload"
                className="absolute inset-0 w-full h-full object-contain z-10 bg-slate-950"
              />
            )}
          </div>

          <div className="bg-white rounded-lg p-6 border border-[var(--lovable-border)] shadow-sm max-w-4xl">
            <h3 className="text-sm font-semibold text-[var(--lovable-fg)] mb-2 font-sora m-0">
              About this lesson
            </h3>
            <div className="text-sm text-[var(--lovable-muted-fg)] leading-relaxed font-medium font-manrope prose max-w-none">
              {activeItem?.content ? (
                <div
                  dangerouslySetInnerHTML={{ __html: activeItem.content }}
                />
              ) : (
                <p>
                  In this part of the course, we'll explore{" "}
                  <strong className="text-[var(--lovable-fg)] font-semibold">{activeItem?.title}</strong>. Pay close attention to the key concepts presented in this section.
                </p>
              )}
            </div>
          </div>
        </main>
      );
    }

    // ── Reading / Chapter Material ─────────────────────────────────────────
    if (activeItemType === "reading") {
      const url = getFullUrl((activeItem as any)?.url);
      const isFinished = isLessonCompleted;

      return (
        <main className="lesson-content">
          <div className="content-head">
            <span className="material-badge">
              {isPdf ? "Reading material" : "External resource"}
            </span>
            {isPdf && (
              <button
                className="expand-button"
                onClick={() => setIsPdfViewerOpen(true)}
              >
                <Expand size={16} /> Expand
              </button>
            )}
          </div>

          <p className="course-name">
            {course?.title || "Introduction to Certified Nursing Assistance"}
          </p>

          <h2>{activeItem?.title || activeLesson?.title || "Chapter 1"}</h2>

          {/* Lovable Visual Chapter Hero Box */}
          <div className="chapter-visual mb-4">
            <div className="chapter-copy">
              <button className="play-button" aria-label="Play chapter">
                <Play size={22} fill="currentColor" />
              </button>
              <div>
                <p>{activeLesson?.title?.toUpperCase() || "CHAPTER 1"}</p>
                <h3>{activeItem?.title || "The Nursing Assistant in Long-Term Care"}</h3>
              </div>
            </div>
            <div className="chapter-art" aria-hidden="true">
              <span className="ring-shape" />
              <span className="paper-shape" />
              <div className="objective-card">
                <strong>Learning objective</strong>
                <p>Understand key roles and responsibilities of nursing assistants in long-term care settings.</p>
              </div>
            </div>
          </div>

          {/* Scroll Down Cue for Content Below */}
          <div className="flex items-center justify-center mb-6">
            <button
              type="button"
              aria-label="Scroll down for content"
              onClick={() => {
                const contentEl = document.querySelector(".lesson-content");
                if (contentEl) {
                  contentEl.scrollBy({ top: 340, behavior: "smooth" });
                }
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-[#e2e8f0] text-[#204a7c] shadow-xs hover:bg-[#f1f5f9] hover:border-[#bfdbfe] hover:scale-105 transition-all cursor-pointer group"
            >
              <ChevronDown size={16} className="text-[#204a7c] group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* PDF Viewer or Resource Link */}
          {isPdf ? (
            <div className="relative w-full min-h-[500px] bg-white rounded-lg overflow-hidden shadow-sm border border-[var(--lovable-border)] flex flex-col mb-8">
              <InlinePdfViewer
                fileUrl={url}
                onPageChange={(current, total) => {
                  setPdfCurrentPage(current);
                  setPdfTotalPages(total);
                  if (current === total && total > 1 && !isLessonCompleted) {
                    handleMarkComplete();
                  }
                }}
                onDocumentLoad={(total) => setPdfTotalPages(total)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg border border-[var(--lovable-border)] text-center mb-8">
              <div className="w-14 h-14 bg-[var(--lovable-active-soft)] rounded-full flex items-center justify-center mb-4 text-[var(--lovable-primary)]">
                <Link2 size={24} />
              </div>
              <h4 className="text-base font-semibold text-[var(--lovable-fg)] font-sora mb-2 m-0">
                External Resource
              </h4>
              <p className="text-xs text-[var(--lovable-muted-fg)] max-w-sm mb-5 font-manrope">
                This reading is available off-platform as an external resource link.
              </p>
              <button
                onClick={() => window.open(url, "_blank")}
                className="complete-button"
                style={{ width: "220px" }}
              >
                Open Resource in New Tab
              </button>
            </div>
          )}
        </main>
      );
    }

    return null;
  };

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="course-shell">
      <AnimatePresence>
        {isPdfViewerOpen && isPdf && (
          <PdfViewer
            url={getFullUrl((activeItem as any)?.url || activeItem?.content)}
            title={activeItem?.title || "Document"}
            onClose={() => setIsPdfViewerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Lovable Course Header ─────────────────────────────────────────── */}
      <header className="course-header">
        <div className="header-left">
          <button
            className="icon-button"
            aria-label="Toggle course menu"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu size={21} strokeWidth={1.7} />
          </button>
          <button
            className="icon-button"
            aria-label="Return to dashboard"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </button>
          <span className="header-divider" />
          <h1>{course.title}</h1>
        </div>

        {/* Profile Dropdown */}
        <div className="profile-wrap" ref={profileRef}>
          <button
            className="profile-button"
            aria-label="Open profile menu"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <span className="avatar">{userInitials}</span>
            <ChevronDown size={14} />
          </button>

          {profileOpen && (
            <div className="profile-menu">
              <strong style={{ display: "block", marginBottom: "4px" }}>
                {user ? `${user.firstname} ${user.lastname}` : "Student account"}
              </strong>
              <span
                onClick={() => {
                  navigate("/dashboard");
                  setProfileOpen(false);
                }}
              >
                View dashboard
              </span>
              <span
                onClick={() => {
                  navigate("/profile");
                  setProfileOpen(false);
                }}
              >
                View profile
              </span>
              <span
                style={{ color: "#ef4444" }}
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
              >
                Sign out
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Course Body ───────────────────────────────────────────────────── */}
      <div className="course-body">
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? "sidebar-open" : ""}`}>
          <div className="progress-block">
            <div className="progress-label">
              <span>Course progress</span>
              <strong>{progress}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <nav className="lesson-nav pb-10" aria-label="Course lessons">
            {course.modules?.map((module) => (
              <div key={module.id} className="mb-4">
                <p>{module.title}</p>
                {module.lessons?.map((lesson) => {
                  const isActiveLesson = activeLessonId === lesson.id;
                  const isFinished = checkLessonCompleted(lesson.id);

                  return (
                    <div className="lesson-group" key={lesson.id}>
                      <button
                        className={`lesson-button ${isActiveLesson ? "lesson-active" : ""}`}
                        onClick={() => {
                          setActiveLessonId(lesson.id);
                          const items = allItems.filter(
                            (i) => i.lessonId === lesson.id,
                          );
                          if (items.length > 0) {
                            setActiveItemId(items[0].id);
                            setActiveItemType(items[0].itemType);
                          }
                        }}
                      >
                        {isFinished ? (
                          <Check size={17} />
                        ) : (
                          <LockKeyhole size={17} strokeWidth={1.7} />
                        )}
                        <span>{lesson.title}</span>
                      </button>

                      {/* Sub-items (Chapters / Content / Quiz) */}
                      {isActiveLesson && (
                        <div className="flex flex-col gap-1 mt-1">
                          {lesson.contents?.map((content) => {
                            const isActiveItem = activeItemId === content.id;
                            return (
                              <button
                                key={content.id}
                                className={`chapter-button ${isActiveItem ? "chapter-button-active" : "chapter-button-inactive"}`}
                                onClick={() => {
                                  setActiveItemId(content.id);
                                  setActiveItemType(
                                    content.type === "VIDEO" ? "video" : "reading",
                                  );
                                  if (window.innerWidth < 900) setIsSidebarOpen(false);
                                }}
                              >
                                <FileText size={15} strokeWidth={1.7} />
                                <span className="truncate">{content.title}</span>
                              </button>
                            );
                          })}

                          {allItems
                            .filter(
                              (i) =>
                                i.lessonId === lesson.id &&
                                i.itemType === "quiz",
                            )
                            .map((quizItem) => {
                              const isActiveQuiz = activeItemId === quizItem.id;
                              return (
                                <button
                                  key={quizItem.id}
                                  className={`chapter-button ${isActiveQuiz ? "chapter-button-active" : "chapter-button-inactive"}`}
                                  onClick={() => {
                                    setActiveItemId(quizItem.id);
                                    setActiveItemType("quiz");
                                    if (window.innerWidth < 900)
                                      setIsSidebarOpen(false);
                                  }}
                                >
                                  <HelpCircle size={15} strokeWidth={1.7} />
                                  <span className="truncate">{quizItem.title}</span>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Scroll Cue */}
          <div className="absolute bottom-3 left-0 right-0 pointer-events-none flex justify-center z-20">
            <button
              type="button"
              aria-label="Scroll down sidebar"
              onClick={() => {
                const navEl = document.querySelector(".lesson-nav");
                if (navEl) navEl.scrollBy({ top: 180, behavior: "smooth" });
              }}
              className="pointer-events-auto w-7 h-7 rounded-full bg-[#204a7c] text-white shadow-md flex items-center justify-center hover:bg-[#173a63] hover:scale-105 transition-all cursor-pointer opacity-90 hover:opacity-100"
            >
              <ChevronDown size={15} />
            </button>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* ── Learning Area ─────────────────────────────────────────────────── */}
        <section className="learning-area">
          <div className="lesson-toolbar">
            <h2>{activeLesson?.title || "Lesson"}</h2>
            <div className="toolbar-actions">
              <div className="pager">
                <button
                  disabled={currentItemIndex === 0}
                  onClick={handlePrevItem}
                >
                  <ChevronLeft size={15} /> Prev
                </button>
                <button
                  disabled={currentItemIndex === allItems.length - 1}
                  onClick={handleNextItem}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>

              {activeItemType !== "quiz" && (
                <button
                  className={`complete-button ${isLessonCompleted ? "completed" : ""}`}
                  onClick={handleMarkComplete}
                  disabled={isLessonCompleted || markCompleteMutation.isPending}
                >
                  {isLessonCompleted ? (
                    <>
                      <Check size={16} /> Completed
                    </>
                  ) : markCompleteMutation.isPending ? (
                    "..."
                  ) : (
                    "Mark complete"
                  )}
                </button>
              )}
            </div>
          </div>

          {renderActiveContent()}
        </section>
      </div>

      <CelebrationModal
        isOpen={celebration.isOpen}
        title={celebration.title}
        message={celebration.message}
        isLastItem={celebration.isLastItem}
        onClose={() => setCelebration((prev) => ({ ...prev, isOpen: false }))}
        onContinue={() => {
          setCelebration((prev) => ({ ...prev, isOpen: false }));
          if (celebration.isLastItem) {
            navigate("/dashboard");
          } else {
            handleNextItem();
          }
        }}
      />
    </div>
  );
};

export default LmsLearn;
