import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useCourseDetails,
  useMarkLessonComplete,
  useUpdateContentProgress,
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
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
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
import { RubricCriteriaTable } from "@/features/rubric/components/RubricCriteriaTable";
import { DiscussionForumView } from "@/features/rubric/components/DiscussionForumView";
import { examSecurityService } from "@/features/rubric/services/examSecurityService";
import { wabonComplianceService } from "@/features/rubric/services/wabonComplianceService";
import { useSeatTimeSummary } from "@/features/rubric/hooks/useSeatTime";

interface CourseItem {
  id: string;
  title: string;
  lessonId: string;
  moduleId?: string | number;
  itemType: "video" | "reading" | "quiz" | "pdf" | "discussion";
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
  const { data: seatTimeSummary } = useSeatTimeSummary(course?.id || id);
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: analytics } = useStudentAnalytics();
  const markCompleteMutation = useMarkLessonComplete();
  const updateContentMutation = useUpdateContentProgress();
  const [completedContents, setCompletedContents] = useState<Set<string>>(
    new Set(),
  );
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
    "video" | "reading" | "quiz" | "pdf" | "discussion"
  >("video");
  const [activeModuleId, setActiveModuleId] = useState<string | number | null>(null);
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
  const [isExamAttested, setIsExamAttested] = useState(false);
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [tabSwitchViolations, setTabSwitchViolations] = useState(0);
  const [examSessionId, setExamSessionId] = useState<string | number | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [quizResults, setQuizResults] = useState<
    Record<string, { isCorrect: boolean; correctAnswer?: string }>
  >({});
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
              moduleId: m.id,
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
                  moduleId: m.id,
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

  // Hydrate completed contents from course report
  useEffect(() => {
    if (!reportData || !Array.isArray(reportData)) return;
    const cSet = new Set<string>();
    reportData.forEach((m: any) => {
      m.lessons?.forEach((l: any) => {
        l.contents?.forEach((c: any) => {
          if (c.status === "COMPLETED") {
            cSet.add(String(c.contentId || c.id));
          }
        });
      });
    });
    setCompletedContents((prev) => {
      const next = new Set(prev);
      cSet.forEach((cId) => next.add(cId));
      return next;
    });
  }, [reportData]);

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
        setActiveModuleId(course.modules[0].id);
      }
    }
  }, [course, activeItemId, allItems]);

  // Keep activeModuleId synchronized with activeLesson
  useEffect(() => {
    if (activeLessonId && course?.modules) {
      const parentModule = course.modules.find((m) =>
        m.lessons?.some((l) => String(l.id) === String(activeLessonId))
      );
      if (parentModule) {
        setActiveModuleId(parentModule.id);
      }
    }
  }, [activeLessonId, course?.modules]);

  const currentModule =
    course?.modules?.find(
      (m) => String(m.id) === String(activeModuleId)
    ) ||
    course?.modules?.find((m) =>
      m.lessons?.some((l) => String(l.id) === String(activeLessonId))
    ) ||
    course?.modules?.[0];

  const isInstructor =
    user?.academyRole === "INSTRUCTOR" ||
    user?.academyActiveRole === "INSTRUCTOR" ||
    user?.globalRole === "ADMIN";

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
        setIsExamAttested(false);
        setAttestationChecked(false);
        setTabSwitchViolations(0);
        setTimeRemainingSeconds(null);
        setQuizResults({});
      }
    }
  }, [activeItem]);

  const detailedExercisesLoaded = Object.keys(detailedExercisesMap).length;

  const currentReportLesson = useMemo(() => {
    return reportData
      ?.flatMap((m: any) => m.lessons || [])
      .find((l: any) => Number(l.lessonId) === Number(activeLessonId));
  }, [reportData, activeLessonId]);

  useEffect(() => {
    if (activeItemType === "quiz" && detailedExercises.length) {
      const answers: Record<string, string> = {};
      const results: Record<string, { isCorrect: boolean; correctAnswer?: string }> = {};
      let submittedCount = 0;
      let score = 0;

      detailedExercises.forEach((ex: any) => {
        const reportExercise = currentReportLesson?.exercises?.find(
          (rex: any) => Number(rex.exerciseId) === Number(ex.id),
        );
        const sub = ex.mySubmission || ex.submission;
        const storedAnswer =
          sub?.answer ||
          reportExercise?.answer ||
          ex.userAnswer;
        const isCompletedState =
          !!storedAnswer ||
          sub?.status === "GRADED" ||
          reportExercise?.status === "GRADED" ||
          reportExercise?.status === "COMPLETED";

        if (isCompletedState) {
          answers[ex.id] = storedAnswer || "SUBMITTED";
          submittedCount++;
          // Determine correctness from submission or reportExercise
          const isCorrect = Boolean(
            sub?.isCorrect ??
            reportExercise?.isCorrect ??
            (sub?.score && sub.score > 0) ??
            (reportExercise?.score && reportExercise.score > 0) ??
            (ex.correctAnswer && storedAnswer && ex.correctAnswer === storedAnswer)
          );
          if (isCorrect) score++;

          results[ex.id] = {
            isCorrect,
            correctAnswer: ex.correctAnswer || sub?.correctAnswer,
          };
        }
      });

      const isLoadingSubmissions = exercises.some(
        (ex: any) => !detailedExercisesMap[ex.id],
      );
      if (submittedCount > 0) {
        setSelectedAnswers(answers);
        setQuizResults(results);
        setQuizSubmitted(true);
        setQuizScore(score);
        setIsExamAttested(true);
      } else if (!isLoadingSubmissions) {
        setQuizSubmitted(false);
        setQuizScore(0);
        setSelectedAnswers({});
        setQuizResults({});
      }
    }
    // Don't reset quiz state when exercises are still loading — wait for them to arrive
  }, [
    activeLessonId,
    lastSyncKey,
    currentReportLesson,
    activeItemType,
    detailedExercisesLoaded,
  ]);

  // WAC 246-841A-440 Exam Security: Monitor tab switches / window blur during exam
  useEffect(() => {
    if (activeItemType !== "quiz" || quizSubmitted || !isExamAttested) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchViolations((prev) => {
          const updated = prev + 1;
          toast.error(
            `Security Notice: Window focus lost. Incident #${updated} recorded for faculty review (WAC 246-841A-440).`,
          );
          if (examSessionId) {
            examSecurityService
              .recordTabBlur({
                sessionId: examSessionId,
                blurDurationSeconds: 4,
              })
              .catch((err) => {
                console.warn("[ExamSecurity] Tab blur event logging failed:", err);
              });
          }
          return updated;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeItemType, quizSubmitted, isExamAttested, examSessionId]);

  // WAC 246-841A-440(6) Active Seat-Time Heartbeat Engine (60s interval / Active engagement rules)
  useEffect(() => {
    if (!activeLessonId || !course?.id) return;

    const pulseInterval = setInterval(() => {
      const isFocused = !document.hidden;
      wabonComplianceService
        .recordSeatTimeHeartbeat({
          lessonId: activeLessonId,
          courseId: course.id,
          cohortId: (course as any).cohortId || 1,
          activeSeconds: isFocused ? 60 : 0,
          idleSeconds: isFocused ? 0 : 60,
          tabFocused: isFocused,
          intervalSeconds: 60,
          engagementScore: isFocused ? 1.0 : 0.0,
          interactionType:
            activeItemType === "video"
              ? "VIDEO_PLAYBACK"
              : activeItemType === "quiz"
              ? "QUIZ_INTERACTION"
              : "READING",
        })
        .catch((err: any) => {
          console.warn("[SeatTime] Heartbeat sync failed:", err?.message || err);
        });
    }, 60000);

    return () => clearInterval(pulseInterval);
  }, [activeLessonId, course?.id, activeItemType]);

  // WAC 246-841A-440 Exam Security: Timed countdown session
  useEffect(() => {
    if (activeItemType !== "quiz" || quizSubmitted || !isExamAttested) return;

    if (timeRemainingSeconds === null && detailedExercises.length > 0) {
      setTimeRemainingSeconds(Math.max(detailedExercises.length * 120, 300));
      return;
    }

    if (timeRemainingSeconds === null || timeRemainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          toast.warning("Examination time has expired. Please submit your answers.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeItemType, quizSubmitted, isExamAttested, timeRemainingSeconds, detailedExercises.length]);

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

  const isContentCompleted = (contentId?: string | number) => {
    if (!contentId) return false;
    const key = String(contentId);
    if (completedContents.has(key)) return true;
    if (!reportData || !Array.isArray(reportData)) return false;
    for (const m of reportData) {
      for (const l of m.lessons || []) {
        const found = l.contents?.find(
          (c: any) => String(c.contentId || c.id) === key,
        );
        if (found && found.status === "COMPLETED") return true;
      }
    }
    return false;
  };

  const handleMarkContentComplete = async (contentItem?: any) => {
    const item = contentItem || activeItem;
    if (!item || !course?.id) return;
    if (item.itemType === "quiz" || item.itemType === "discussion") return;

    const contentId = Number(item.id);
    if (!contentId || isNaN(contentId)) return;

    const cKey = String(contentId);
    if (completedContents.has(cKey) || updateContentMutation.isPending) return;

    const currentModId = item.moduleId || activeModuleId || currentModule?.id;
    const lessonId = item.lessonId || activeLessonId;
    if (!currentModId || !lessonId) return;

    try {
      await updateContentMutation.mutateAsync({
        courseId: Number(course.id),
        moduleId: Number(currentModId),
        lessonId: Number(lessonId),
        contentId,
        status: "COMPLETED",
      });
      setCompletedContents((prev) => new Set(prev).add(cKey));
      toast.success("Progress saved: Content completed");

      // Verify bottom-up auto-completion of lesson
      try {
        const checkResult = await academyService.checkLessonComplete(
          course.id,
          lessonId,
        );
        if (
          checkResult?.completed ||
          checkResult?.isCompleted ||
          checkResult === true
        ) {
          setCompletedLessons((prev) => new Set(prev).add(String(lessonId)));
        }
      } catch (_) {}
    } catch (err: any) {
      console.warn("Failed to update content progress:", err);
    }
  };

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
      // Ignored non-critical URL parsing error, fallback to raw url
    }
    const origin = window.location.origin;
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&enablejsapi=1&origin=${origin}`;
  };

  const getFullUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const baseUrl =
      import.meta.env.VITE_API_URL || "https://api.consultancy.alikohub.com";
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
      // WAC 246-841A-440: Scrub correctAnswer before submission to prevent client inspection leak
      const rawExercises = detailedExercises || [];
      const exercisesList = quizSubmitted
        ? rawExercises
        : rawExercises.map((ex: any) => {
            const scrubbed = { ...ex };
            delete scrubbed.correctAnswer;
            return scrubbed;
          });
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
            <div className="rounded-lg bg-white border border-[var(--lovable-border)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--lovable-active-soft)] text-[var(--lovable-primary)] border border-[var(--lovable-border)] shrink-0">
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

              {/* Monitored Security Status indicators */}
              {!quizSubmitted && isExamAttested && (
                <div className="flex items-center flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Monitored</span>
                  </div>
                  {tabSwitchViolations > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{tabSwitchViolations} Warning(s)</span>
                    </div>
                  )}
                  {timeRemainingSeconds !== null && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {Math.floor(timeRemainingSeconds / 60)}:
                        {String(timeRemainingSeconds % 60).padStart(2, "0")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* WAC 246-841A-440: Student Identity Verification & Honor Pledge Gate */}
            {!quizSubmitted && !isExamAttested ? (
              <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 m-0">
                      Academic Integrity & Identity Verification
                    </h3>
                    <p className="text-xs text-slate-500 m-0">
                      WAC 246-841A-440 Examination Security Protocol
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-0.5">
                      Enrolled Student
                    </span>
                    <span className="font-bold text-slate-800 text-sm block">
                      {user ? `${user.firstname} ${user.lastname}` : "Candidate"}
                    </span>
                    <span className="text-slate-500 block">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-0.5">
                      Monitored Parameters
                    </span>
                    <span className="font-bold text-slate-800 text-sm block">
                      {exercisesList.length} Questions · Timed Assessment
                    </span>
                    <span className="text-slate-500 block">Tab navigation & window focus monitored</span>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Student Examination Attestation
                  </div>
                  <p className="leading-relaxed">
                    By beginning this assessment, I certify that I am the enrolled student listed above. I attest that I will complete this examination independently without unauthorized aids, browser extensions, secondary monitors, or external assistance, in compliance with Washington State nursing assistant training regulations (WAC 246-841A-440).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={attestationChecked}
                      onChange={(e) => setAttestationChecked(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>I confirm my identity and agree to the exam integrity pledge</span>
                  </label>

                  <Button
                    onClick={() => {
                      if (!attestationChecked) {
                        toast.error("Please confirm your identity and check the attestation pledge to begin.");
                        return;
                      }
                      setIsExamAttested(true);
                      toast.success("Identity verified. Monitored examination session started.");
                      examSecurityService
                        .startSession({
                          exerciseId: exercisesList[0]?.id || 1,
                          honorCodeAccepted: true,
                          userAgent: navigator.userAgent,
                        })
                        .then((session) => {
                          if (session?.id) setExamSessionId(session.id);
                        })
                        .catch((err) => {
                          console.warn("[ExamSecurity] Failed to register proctored exam session:", err);
                        });
                    }}
                    disabled={!attestationChecked}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 h-10 rounded-lg shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Begin Monitored Assessment
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* First-Week Attendance Gate Notice */}
                {exercisesList.some((ex: any) => ex.isWeekOneAttendanceGate) && (
                  <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200/90 text-emerald-900 text-xs flex items-center gap-3 shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-emerald-950">
                        First-Week Academic Attendance Verification Gate
                      </span>
                      <span className="text-[11px] text-emerald-800">
                        Submitting this designated exercise confirms your active academic engagement and automatically verifies your present attendance on the cohort enrollment census (WAC 246-841A-440).
                      </span>
                    </div>
                  </div>
                )}

                {/* Questions */}
                {exercisesList.map((exercise: any, index: number) => {
                  const options = parseOptions(exercise.options);
                  return (
                    <div
                      key={exercise.id}
                      className="rounded-lg bg-white border border-[var(--lovable-border)] shadow-xs p-5 font-manrope select-none"
                      onCopy={(e) => {
                        if (!quizSubmitted) {
                          e.preventDefault();
                          toast.error("Copying questions is disabled during secure examination sessions.");
                        }
                      }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-[var(--lovable-primary)] uppercase tracking-wider bg-[var(--lovable-active-soft)] px-2.5 py-0.5 rounded">
                            Question {index + 1}
                          </span>
                          {exercise.isWeekOneAttendanceGate && (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                              Week 1 Attendance Gate
                            </Badge>
                          )}
                        </div>
                        {exercise.rubric && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                            Rubric Assessed ({exercise.points} pts)
                          </Badge>
                        )}
                      </div>
                      <div className="mb-4 text-sm font-semibold text-[var(--lovable-fg)] leading-snug font-sora">
                        {exercise.question}
                      </div>

                      {/* Display Rubric Criteria Table if Rubric is Attached */}
                      {exercise.rubric && (
                        <div className="mb-4">
                          <RubricCriteriaTable rubric={exercise.rubric} compact />
                        </div>
                      )}

                      {options.length === 0 ? (
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Your Clinical Response
                          </label>
                          <textarea
                            value={selectedAnswers[exercise.id] || ""}
                            disabled={quizSubmitted}
                            onChange={(e) => handleOptionSelect(exercise.id, e.target.value)}
                            placeholder="Type your response with clinical rationales and evidence..."
                            className="w-full min-h-[90px] text-xs bg-white rounded-xl border border-slate-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
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
                          const optionResult = quizResults[exercise.id];
                          const sub = exercise.mySubmission || exercise.submission;
                          const reportEx = currentReportLesson?.exercises?.find(
                            (rex: any) => Number(rex.exerciseId) === Number(exercise.id),
                          );

                          // The submission for this exercise is correct if any server source confirms it
                          const questionIsCorrect = Boolean(
                            optionResult?.isCorrect ??
                            sub?.isCorrect ??
                            reportEx?.isCorrect ??
                            (sub?.score && sub.score > 0) ??
                            (reportEx?.score && reportEx.score > 0)
                          );

                          const knownCorrectAnswer = quizSubmitted
                            ? (optionResult?.correctAnswer || sub?.correctAnswer || exercise.correctAnswer)
                            : undefined;

                          // Option is marked correct if:
                          // 1) knownCorrectAnswer is provided and matches this option, OR
                          // 2) question was graded correct and this is the option the student selected
                          const isCorrect = quizSubmitted && (
                            knownCorrectAnswer
                              ? knownCorrectAnswer === option
                              : (questionIsCorrect && isSelected)
                          );

                          // Option is marked wrong if the student selected it but the question is wrong
                          const isWrong = quizSubmitted && isSelected && !questionIsCorrect;

                          let cls =
                            "border-[var(--lovable-border)] bg-white hover:bg-[var(--lovable-muted)]";
                          if (quizSubmitted) {
                            if (isCorrect)
                              cls =
                                "border-emerald-500 bg-emerald-50 text-emerald-900";
                            else if (isWrong)
                              cls = "border-red-400 bg-red-50 text-red-900";
                            else
                              cls =
                                "border-[var(--lovable-border)] bg-slate-50 opacity-60";
                          } else if (isSelected) {
                            cls =
                              "border-[var(--lovable-primary)] bg-[var(--lovable-active-soft)] text-[var(--lovable-primary)] font-semibold";
                          }

                          return (
                            <Label
                              key={idx}
                              htmlFor={`q${exercise.id}-o${idx}`}
                              className={cn(
                                "flex items-center gap-3 rounded-md border p-3 transition-all duration-150 text-sm font-medium",
                                !quizSubmitted
                                  ? "cursor-pointer"
                                  : "cursor-default",
                                cls,
                              )}
                            >
                              {!quizSubmitted ? (
                                <RadioGroupItem
                                  value={option}
                                  id={`q${exercise.id}-o${idx}`}
                                  className={cn(
                                    "transition-colors",
                                    isSelected
                                      ? "text-[var(--lovable-primary)] border-[var(--lovable-primary)]"
                                      : "",
                                  )}
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
                    )}
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
                              const isCorrect = Boolean(
                                result?.isCorrect ?? (result?.score > 0),
                              );
                              submitResults[ex.id] = {
                                isCorrect,
                                correctAnswer: result?.correctAnswer,
                              };
                              if (ex) {
                                ex.mySubmission = {
                                  ...ex.mySubmission,
                                  ...result,
                                  isCorrect,
                                };
                              }
                              if (Number(idx) < exercisesList.length - 1) {
                                await delay(500);
                              }
                            }
                            const serverScore = Object.values(submitResults).filter(
                              (r) => r.isCorrect,
                            ).length;
                            setQuizResults(submitResults);
                            setQuizScore(serverScore);
                            setQuizSubmitted(true);

                            if (examSessionId) {
                              examSecurityService
                                .endSession({ sessionId: examSessionId })
                                .catch((err) => {
                                  console.warn("[ExamSecurity] Failed to cleanly end session:", err);
                                });
                            }

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
                        toast.error("Failed to submit some answers properly.");
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
              </>
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
                onEnded={() => handleMarkContentComplete(activeItem)}
              />
            )}
          </div>

          {/* Video completion action bar */}
          <div className="flex items-center justify-between p-3.5 bg-white border border-[var(--lovable-border)] rounded-lg mb-6 max-w-4xl shadow-2xs">
            <div className="flex items-center gap-2">
              {isContentCompleted(activeItem?.id) ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Video completed</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-medium">
                  Watch video to complete or click to record completion
                </span>
              )}
            </div>
            {!isContentCompleted(activeItem?.id) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkContentComplete(activeItem)}
                disabled={updateContentMutation.isPending}
                className="h-8 text-xs font-semibold gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Mark as Completed
              </Button>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 border border-[var(--lovable-border)] shadow-sm max-w-4xl">
            <h3 className="text-sm font-semibold text-[var(--lovable-fg)] mb-2 font-sora m-0">
              About this lesson
            </h3>
            <div className="text-sm text-[var(--lovable-muted-fg)] leading-relaxed font-medium font-manrope prose max-w-none">
              {activeItem?.content ? (
                <div dangerouslySetInnerHTML={{ __html: activeItem.content }} />
              ) : (
                <p>
                  In this part of the course, we'll explore{" "}
                  <strong className="text-[var(--lovable-fg)] font-semibold">
                    {activeItem?.title}
                  </strong>
                  . Pay close attention to the key concepts presented in this
                  section.
                </p>
              )}
            </div>
          </div>

          {/* Unit Discussion Callout (WAC 246-841A-440) */}
          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/40 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-4xl shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-100/70 text-blue-700">
                  <MessageSquare className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Unit Discussion Forum &bull; {currentModule?.title || "This Unit"}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Participate in rubric-guided clinical dialogue with fellow nursing candidates.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setActiveItemType("discussion");
                if (currentModule?.id) setActiveModuleId(currentModule.id);
                setActiveItemId(`discussion-${currentModule?.id || "unit"}`);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl shrink-0 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Go to Unit Discussion
            </Button>
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
                <h3>
                  {activeItem?.title ||
                    "The Nursing Assistant in Long-Term Care"}
                </h3>
              </div>
            </div>
            <div className="chapter-art" aria-hidden="true">
              <span className="ring-shape" />
              <span className="paper-shape" />
              <div className="objective-card">
                <strong>Learning objective</strong>
                <p>
                  Understand key roles and responsibilities of nursing
                  assistants in long-term care settings.
                </p>
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
              <ChevronDown
                size={16}
                className="text-[#204a7c] group-hover:translate-y-0.5 transition-transform"
              />
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
                  if (current === total && total > 1) {
                    handleMarkContentComplete(activeItem);
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
                This reading is available off-platform as an external resource
                link.
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

          {/* Reading completion action bar */}
          <div className="flex items-center justify-between p-3.5 bg-white border border-[var(--lovable-border)] rounded-lg mb-6 shadow-2xs">
            <div className="flex items-center gap-2">
              {isContentCompleted(activeItem?.id) ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Reading completed</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-medium">
                  Review material to complete or click to record completion
                </span>
              )}
            </div>
            {!isContentCompleted(activeItem?.id) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkContentComplete(activeItem)}
                disabled={updateContentMutation.isPending}
                className="h-8 text-xs font-semibold gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Mark as Read
              </Button>
            )}
          </div>

          {/* Unit Discussion Callout (WAC 246-841A-440) */}
          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/40 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-100/70 text-blue-700">
                  <MessageSquare className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Unit Discussion Forum &bull; {currentModule?.title || "This Unit"}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Engage in substantive clinical discussions and review evaluation criteria.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setActiveItemType("discussion");
                if (currentModule?.id) setActiveModuleId(currentModule.id);
                setActiveItemId(`discussion-${currentModule?.id || "unit"}`);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl shrink-0 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Go to Unit Discussion
            </Button>
          </div>
        </main>
      );
    }

    // ── Unit Discussion Forum (WAC 246-841A-440) ───────────────────────────
    if (activeItemType === "discussion") {
      const activeMod =
        course?.modules?.find(
          (m) => String(m.id) === String(activeModuleId)
        ) ||
        course?.modules?.find((m) =>
          m.lessons?.some((l) => String(l.id) === String(activeLessonId))
        ) ||
        course?.modules?.[0];

      return (
        <main className="lesson-content w-full max-w-full">
          <div className="content-head">
            <span className="material-badge flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200">
              <MessageSquare size={13} /> Unit Asynchronous Discussion (WAC 246-841A-440)
            </span>
          </div>

          <p className="course-name">
            {course?.title || "Nursing Assistant Training"} &bull; {activeMod?.title || "Course Unit"}
          </p>

          <h2>{activeMod?.title || "Unit"}: Clinical Dialogue & Peer Responses</h2>

          <div className="mt-6 w-full max-w-full">
            <DiscussionForumView
              moduleId={activeMod?.id || 1}
              isInstructor={isInstructor}
              canCreateTopic={false}
              className="w-full"
            />
          </div>
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
                {user
                  ? `${user.firstname} ${user.lastname}`
                  : "Student account"}
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
          {(() => {
            const totalCourseLessons = flatLessons.length;
            const completedLessonsCount = flatLessons.filter((l) =>
              checkLessonCompleted(l.id),
            ).length;
            const dynamicCourseProgress =
              totalCourseLessons > 0
                ? Math.round((completedLessonsCount / totalCourseLessons) * 100)
                : 0;
            const effectiveProgress = Math.max(progress, dynamicCourseProgress);

            return (
              <div className="progress-block">
                <div className="progress-label">
                  <span>Course progress</span>
                  <strong>{effectiveProgress}%</strong>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${effectiveProgress}%` }} />
                </div>
              </div>
            );
          })()}

          {/* WABON Theory Seat-Time Progress Indicator */}
          <div className="px-4 py-3 mx-3 my-2 rounded-xl bg-blue-50/70 border border-blue-100/90 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-blue-600" /> Theory Seat-Time
              </span>
              <span>
                {((seatTimeSummary?.totalActiveTimeSeconds ?? 0) / 3600).toFixed(1)} hrs ({seatTimeSummary?.totalActiveTimeMinutes ?? Math.round((seatTimeSummary?.totalActiveTimeSeconds ?? 0) / 60)}m) / 50.0 hrs
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-blue-200/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((seatTimeSummary?.totalActiveTimeSeconds ?? 0) /
                        (50 * 3600)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-blue-700">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Heartbeat Active
              </span>
              <span className="text-[9px] text-blue-500">Auto-pauses on blur</span>
            </div>
          </div>

          <nav className="lesson-nav pb-10" aria-label="Course lessons">
            {course.modules?.map((module) => {
              const moduleLessons = module.lessons || [];
              const completedInMod = moduleLessons.filter((l) =>
                checkLessonCompleted(l.id),
              ).length;
              const totalInMod = moduleLessons.length;
              const moduleStatus =
                totalInMod > 0 && completedInMod === totalInMod
                  ? "COMPLETED"
                  : completedInMod > 0
                    ? "IN_PROGRESS"
                    : "NOT_STARTED";

              return (
              <div key={module.id} className="mb-4">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate m-0">
                    {module.title}
                  </p>
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                      moduleStatus === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : moduleStatus === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {moduleStatus === "COMPLETED"
                      ? "Completed"
                      : moduleStatus === "IN_PROGRESS"
                        ? `${completedInMod}/${totalInMod}`
                        : "Not Started"}
                  </span>
                </div>
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
                            const isContentDone = isContentCompleted(content.id);
                            return (
                              <button
                                key={content.id}
                                className={`chapter-button ${isActiveItem ? "chapter-button-active" : "chapter-button-inactive"}`}
                                onClick={() => {
                                  setActiveItemId(content.id);
                                  setActiveItemType(
                                    content.type === "VIDEO"
                                      ? "video"
                                      : "reading",
                                  );
                                  if (window.innerWidth < 900)
                                    setIsSidebarOpen(false);
                                }}
                              >
                                {isContentDone ? (
                                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                ) : (
                                  <FileText size={15} strokeWidth={1.7} />
                                )}
                                <span className="truncate">
                                  {content.title}
                                </span>
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
                              const isQuizDone =
                                checkLessonCompleted(lesson.id) ||
                                (quizItem.exercises &&
                                  quizItem.exercises.length > 0 &&
                                  quizItem.exercises.every(
                                    (ex: any) =>
                                      quizResults[ex.id] ||
                                      ex.mySubmission?.isCorrect !== undefined ||
                                      detailedExercisesMap[ex.id]?.mySubmission,
                                  ));
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
                                  {isQuizDone ? (
                                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                  ) : (
                                    <HelpCircle size={15} strokeWidth={1.7} />
                                  )}
                                  <span className="truncate">
                                    {quizItem.title}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unit Discussion Forum Button for this Module */}
                <div className="unit-discussion-wrap mt-1.5 pt-1.5 border-t border-slate-100">
                  <button
                    className={`chapter-button w-full flex items-center gap-2 py-2 px-2.5 rounded-lg transition-colors ${
                      activeItemType === "discussion" && String(activeModuleId) === String(module.id)
                        ? "chapter-button-active bg-blue-50 text-blue-700 font-bold border border-blue-200"
                        : "chapter-button-inactive hover:bg-slate-100/80 text-slate-600"
                    }`}
                    onClick={() => {
                      setActiveItemType("discussion");
                      setActiveModuleId(module.id);
                      setActiveLessonId(null);
                      setActiveItemId(`discussion-${module.id}`);
                      if (window.innerWidth < 900) setIsSidebarOpen(false);
                    }}
                  >
                    <MessageSquare size={14} className="text-blue-600 shrink-0" />
                    <span className="truncate text-xs font-semibold">Unit Discussion</span>
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100/60 text-blue-700 border border-blue-200/60">
                      WAC
                    </span>
                  </button>
                </div>
              </div>
              );
            })}
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
            <h2>
              {activeItemType === "discussion"
                ? `${currentModule?.title || "Unit"}: Discussion Forum`
                : (activeLesson?.title || "Lesson")}
            </h2>
            <div className="toolbar-actions">
              <div className="pager">
                <button
                  disabled={currentItemIndex <= 0 || activeItemType === "discussion"}
                  onClick={handlePrevItem}
                >
                  <ChevronLeft size={15} /> Prev
                </button>
                <button
                  disabled={
                    currentItemIndex === -1 ||
                    currentItemIndex === allItems.length - 1 ||
                    activeItemType === "discussion"
                  }
                  onClick={handleNextItem}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>

              {activeItemType !== "quiz" && activeItemType !== "discussion" && (
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
