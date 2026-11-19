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
import { useUser, useLogout, usePortalMode } from "@/features/auth/hooks/useAuth";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  CheckCircle2,
  Check,
  LockKeyhole,
  Lock,
  Menu,
  X,
  Play,
  ArrowLeft,
  PlaySquare,
  Expand,
  BookOpen,
  ChevronDown,
  Clock,
  Link2,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import PdfViewer from "./components/PdfViewer";
import InlinePdfViewer from "./components/InlinePdfViewer";
import CelebrationModal from "./components/CelebrationModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { RubricCriteriaTable } from "@/features/rubric/components/RubricCriteriaTable";
import { DiscussionForumView } from "@/features/rubric/components/DiscussionForumView";
import { ExamIdentityVerificationCard } from "@/features/rubric/components/ExamIdentityVerificationCard";
import { examSecurityService } from "@/features/rubric/services/examSecurityService";
import { wabonComplianceService } from "@/features/rubric/services/wabonComplianceService";
import { useSeatTimeSummary } from "@/features/rubric/hooks/useSeatTime";
import { useLessonReadings } from "@/features/rubric/hooks/useCurriculumCrosswalk";

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
    currentItemIndex = allItems.findIndex(
      (item: CourseItem) =>
        item.itemType === "quiz" &&
        item.exercises?.some((ex: any) => ex.id === activeItemId),
    );
  }
  if (currentItemIndex === -1 && activeLessonId) {
    currentItemIndex = allItems.findIndex(
      (item: CourseItem) => item.lessonId === activeLessonId,
    );
  }
  const activeItem = allItems[currentItemIndex];

  const nextItem = useMemo(() => {
    let targetIndex = currentItemIndex;
    if (targetIndex === -1 && activeLessonId) {
      targetIndex = allItems.findIndex((item) => item.lessonId === activeLessonId);
    }
    if (targetIndex >= 0 && targetIndex < allItems.length - 1) {
      return allItems[targetIndex + 1];
    }
    if (currentLessonIndex >= 0 && currentLessonIndex < flatLessons.length - 1) {
      const nextLesson = flatLessons[currentLessonIndex + 1];
      const lessonItems = allItems.filter((i) => i.lessonId === nextLesson.id);
      if (lessonItems.length > 0) return lessonItems[0];
      return {
        id: `lesson-${nextLesson.id}`,
        title: nextLesson.title,
        lessonId: nextLesson.id,
        itemType: "reading" as const,
      };
    }
    return null;
  }, [currentItemIndex, activeLessonId, allItems, currentLessonIndex, flatLessons]);

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
    if (key === exerciseFetchKey) return;
    setExerciseFetchKey(key);

    let cancelled = false;
    (async () => {
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
      for (const ex of exercises) {
        if (cancelled) return;
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

  const detailedExercisesLoaded = exercises.every(
    (ex: any) => !!detailedExercisesMap[ex.id],
  );
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
          } catch (_) {}
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
        setActiveModuleId(course.modules[0].id);
      }
    }
  }, [course, activeItemId, allItems]);

  // Keep activeModuleId synchronized with activeLesson
  useEffect(() => {
    if (activeLessonId && course?.modules) {
      const parentModule = course.modules.find((m) =>
        m.lessons?.some((l) => String(l.id) === String(activeLessonId)),
      );
      if (parentModule) {
        setActiveModuleId(parentModule.id);
      }
    }
  }, [activeLessonId, course?.modules]);

  const currentModule =
    course?.modules?.find(
      (m) => String(m.id) === String(activeModuleId),
    ) ||
    course?.modules?.find((m) =>
      m.lessons?.some((l) => String(l.id) === String(activeLessonId)),
    ) ||
    course?.modules?.[0];

  const currentModuleIndex = course?.modules?.findIndex(
    (m) => String(m.id) === String(currentModule?.id),
  ) ?? 0;

  const isInstructor =
    user?.academyRole === "INSTRUCTOR" ||
    user?.academyActiveRole === "INSTRUCTOR" ||
    user?.globalRole === "ADMIN";
  const { isAuditor } = usePortalMode();
  const isPrivilegedReviewer =
    isAuditor ||
    isInstructor ||
    user?.academyRole === "COMMISSION_AUDITOR" ||
    user?.academyActiveRole === "COMMISSION_AUDITOR" ||
    user?.globalRole === "ADMIN";
  const isReadOnlyPreview = Boolean(isAuditor || (!isEnrolled && isPrivilegedReviewer));

  // WAC Crosswalk readings hook
  const { data: lessonReadings } = useLessonReadings(activeLessonId);

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
  }, [
    activeLessonId,
    lastSyncKey,
    currentReportLesson,
    activeItemType,
    detailedExercisesLoaded,
  ]);

  // Exam Security: Monitor tab switches / window blur during exam
  useEffect(() => {
    if (activeItemType !== "quiz" || quizSubmitted || !isExamAttested || isReadOnlyPreview) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchViolations((prev) => {
          const updated = prev + 1;
          toast.error(
            `Security Notice: Window focus lost. Incident #${updated} recorded for faculty review.`,
          );
          if (examSessionId) {
            examSecurityService
              .recordTabBlur({
                sessionId: examSessionId,
              })
              .catch((err: any) => {
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
  }, [activeItemType, quizSubmitted, isExamAttested, examSessionId, isReadOnlyPreview]);

  // Active Seat-Time Heartbeat Engine (60s interval, skipped in read-only inspection mode)
  useEffect(() => {
    if (!activeLessonId || !course?.id || isReadOnlyPreview) return;

    const pulseInterval = setInterval(() => {
      const isFocused = !document.hidden;
      wabonComplianceService
        .recordSeatTimeHeartbeat({
          lessonId: activeLessonId,
          courseId: course.id,
          ...(activeItem?.id && !isNaN(Number(activeItem.id))
            ? { contentId: Number(activeItem.id) }
            : {}),
          activeSeconds: isFocused ? 60 : 0,
          idleSeconds: isFocused ? 0 : 60,
        })
        .catch((err: any) => {
          console.warn("[SeatTime] Heartbeat sync failed:", err?.message || err);
        });
    }, 60000);

    return () => clearInterval(pulseInterval);
  }, [activeLessonId, course?.id, activeItem?.id, isReadOnlyPreview]);

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

  // Helpers
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
    if (isReadOnlyPreview) return;
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

  const handleMarkComplete = () => {
    if (isReadOnlyPreview || !course?.id) return;
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
                : `Chapter ${currentLessonIndex + 1 >= 0 ? currentLessonIndex + 1 : 1} complete!`,
              message: isModuleEnd
                ? "Excellent progress, keep up the momentum!"
                : `${activeLesson?.title || "Lesson"} · ${course?.title || "Course"}`,
              isLastItem: currentItemIndex === allItems.length - 1,
            });
          },
        },
      );
    }
  };

  const handleNextItem = () => {
    let targetIndex = currentItemIndex;
    if (targetIndex === -1 && activeLessonId) {
      targetIndex = allItems.findIndex((item) => item.lessonId === activeLessonId);
    }

    if (targetIndex >= 0 && targetIndex < allItems.length - 1) {
      const nItem = allItems[targetIndex + 1];
      if (nItem) {
        setActiveItemId(nItem.id);
        setActiveItemType(nItem.itemType);
        if (nItem.lessonId) {
          setActiveLessonId(nItem.lessonId);
        }
        if (nItem.moduleId) {
          setActiveModuleId(nItem.moduleId);
        }
        const contentContainer = document.querySelector(".flex-1.overflow-y-auto");
        contentContainer?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    // Advance to next lesson in current course
    if (currentLessonIndex >= 0 && currentLessonIndex < flatLessons.length - 1) {
      const nLesson = flatLessons[currentLessonIndex + 1];
      if (nLesson) {
        setActiveLessonId(nLesson.id);
        const lessonItems = allItems.filter((i) => i.lessonId === nLesson.id);
        if (lessonItems.length > 0) {
          setActiveItemId(lessonItems[0].id);
          setActiveItemType(lessonItems[0].itemType);
          if (lessonItems[0].moduleId) {
            setActiveModuleId(lessonItems[0].moduleId);
          }
        }
        const contentContainer = document.querySelector(".flex-1.overflow-y-auto");
        contentContainer?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    // At the end of the current course: advance to next enrolled course or dashboard
    const nextEnrolledCourse = enrollments?.find(
      (e: any) =>
        String(e.courseId || e.course?.id) !== String(id) &&
        (e.status === "ACTIVE" || e.status === "IN_PROGRESS"),
    );
    if (nextEnrolledCourse) {
      const nextCourseId = nextEnrolledCourse.courseId || nextEnrolledCourse.course?.id;
      navigate(`/learn/${nextCourseId}`);
    } else {
      navigate("/dashboard");
    }
  };

  const handlePrevItem = () => {
    let targetIndex = currentItemIndex;
    if (targetIndex === -1 && activeLessonId) {
      targetIndex = allItems.findIndex((item) => item.lessonId === activeLessonId);
    }

    if (targetIndex > 0) {
      const pItem = allItems[targetIndex - 1];
      if (pItem) {
        setActiveItemId(pItem.id);
        setActiveItemType(pItem.itemType);
        if (pItem.lessonId) {
          setActiveLessonId(pItem.lessonId);
        }
        if (pItem.moduleId) {
          setActiveModuleId(pItem.moduleId);
        }
        const contentContainer = document.querySelector(".flex-1.overflow-y-auto");
        contentContainer?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (currentLessonIndex > 0) {
      const pLesson = flatLessons[currentLessonIndex - 1];
      if (pLesson) {
        setActiveLessonId(pLesson.id);
        const lessonItems = allItems.filter((i) => i.lessonId === pLesson.id);
        if (lessonItems.length > 0) {
          const lastItem = lessonItems[lessonItems.length - 1];
          setActiveItemId(lastItem.id);
          setActiveItemType(lastItem.itemType);
          if (lastItem.moduleId) {
            setActiveModuleId(lastItem.moduleId);
          }
        }
        const contentContainer = document.querySelector(".flex-1.overflow-y-auto");
        contentContainer?.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleOptionSelect = (exerciseId: string, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [exerciseId]: option }));
  };

  const renderRequiredReadings = (
    wrapperClassName = "bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3",
  ) => {
    if (!Array.isArray(lessonReadings) || lessonReadings.length === 0) {
      return null;
    }
    return (
      <div className={wrapperClassName}>
        <h3 className="text-sm font-heading font-bold text-slate-900 flex items-center gap-2 m-0">
          <BookOpen className="w-4 h-4 text-[#0A65A0]" />
          Required Textbook Readings
        </h3>
        <div className="space-y-2">
          {lessonReadings.map((reading: any) => (
            <div
              key={reading.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <span className="font-semibold text-slate-900 block">
                  {reading.textbook?.title || "Course Textbook"}
                  {reading.textbook?.edition
                    ? ` (${reading.textbook.edition})`
                    : ""}
                </span>
                <span className="text-slate-600">{reading.chapters}</span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold bg-white shrink-0 text-slate-700"
              >
                {reading.pageRange}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
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
    } catch (e) {}
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

  // Discipline theme color helper (V1 & V2 colored badges)
  const disciplineTheme = useMemo(() => {
    const cat = (course?.category || "").toLowerCase();
    const title = (course?.title || "").toLowerCase();
    if (
      cat.includes("health") ||
      cat.includes("nurs") ||
      title.includes("nursing") ||
      title.includes("cna")
    ) {
      return {
        name: "Health",
        pillClass: "bg-rose-50 text-[#F43F5E] border-rose-200",
      };
    }
    if (
      cat.includes("tech") ||
      cat.includes("cad") ||
      cat.includes("stem") ||
      title.includes("autocad")
    ) {
      return {
        name: "Technology",
        pillClass: "bg-blue-50 text-[#0A65A0] border-blue-200",
      };
    }
    if (cat.includes("business") || cat.includes("manage")) {
      return {
        name: "Business",
        pillClass: "bg-emerald-50 text-[#10B981] border-emerald-200",
      };
    }
    return {
      name: "Health",
      pillClass: "bg-rose-50 text-[#F43F5E] border-rose-200",
    };
  }, [course?.category, course?.title]);

  // Reusable Split Hero Box (Navy media banner + light blue learning objective)
  const renderHeroObjectiveBox = (title?: string, description?: string) => {
    const isCompleted = isLessonCompleted || isContentCompleted(activeItem?.id);
    return (
      <div className="w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 bg-white grid grid-cols-1 lg:grid-cols-12 mb-6">
        {/* Left half: Deep navy media banner (7 cols) */}
        <div className="lg:col-span-7 bg-[#0B2545] p-6 sm:p-7 flex flex-col justify-between text-white min-h-[190px] relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-blue-500/10 pointer-events-none blur-2xl" />

          <div className="relative z-10 flex items-start justify-between">
            <button
              type="button"
              onClick={() => {
                if (activeItemType === "reading") {
                  const el = document.getElementById("reading-content-card");
                  el?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="w-12 h-12 rounded-full bg-[#F16A1C] hover:bg-[#D75812] flex items-center justify-center text-white shadow-lg transition-all cursor-pointer group"
              aria-label="Play lesson"
            >
              <Play className="w-5 h-5 fill-white ml-0.5 group-hover:scale-110 transition-transform" />
            </button>

            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            )}
          </div>

          <div className="relative z-10 mt-6">
            <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase block">
              LESSON {currentLessonIndex + 1 >= 0 ? currentLessonIndex + 1 : 1} · 12 MIN
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight mt-1 m-0">
              {title || activeItem?.title || activeLesson?.title || "Chapter 1"}
            </h2>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden flex">
              <div
                className="h-full bg-[#F16A1C] rounded-full transition-all duration-500"
                style={{
                  width: isLessonCompleted
                    ? "100%"
                    : isContentCompleted(activeItem?.id)
                      ? "75%"
                      : "25%",
                }}
              />
            </div>
          </div>
        </div>

        {/* Right half: Learning Objective banner (5 cols) */}
        <div className="lg:col-span-5 bg-[#EBF3FA] p-6 sm:p-7 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-blue-100/80">
          <span className="text-[11px] font-bold text-[#0A65A0] tracking-wider uppercase mb-2 flex items-center gap-1.5">
            LEARNING OBJECTIVE
          </span>
          <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed m-0">
            {description ||
              (activeLesson as any)?.description ||
              "Understand key roles and responsibilities of nursing assistants in long-term care settings, maintaining resident dignity and state compliance standards."}
          </p>
        </div>
      </div>
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || isReportLoading) {
    return (
      <div className="min-h-screen bg-[#F2F5FB] flex h-screen">
        <div className="w-72 sm:w-80 h-full bg-white border-r border-[#E1E7F1] p-5 flex flex-col gap-3">
          <Skeleton className="h-8 w-36 mb-2" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-[220px] w-full rounded-2xl" />
          <Skeleton className="h-8 w-2/3 rounded-xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F5FB] p-6">
        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">
          Course not found
        </h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          We couldn't find the course you're looking for.
        </p>
        <Button onClick={() => navigate("/dashboard")} className="rounded-xl bg-[#0A65A0] text-white">
          Return to My Learning
        </Button>
      </div>
    );
  }

  if (!enrollmentsLoading && !isEnrolled && !isPrivilegedReviewer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F5FB] p-6 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-200 shadow-xs">
          <Lock className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-2 tracking-tight">
          Access Restricted
        </h2>
        <p className="text-slate-500 mb-8 max-w-md leading-relaxed text-sm">
          {enrollment?.status === "PENDING"
            ? "Your enrollment is pending. Payment or approval may be required."
            : "You are not enrolled in this course. Enroll to get access."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate(`/courses/${id}`)}
            className="rounded-xl h-11 px-6 bg-[#0A65A0] hover:bg-[#084B78] text-white font-semibold text-sm"
          >
            {enrollment?.status === "PENDING"
              ? "View Enrollment Status"
              : "Go to Enrollment Page"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="rounded-xl h-11 px-6 font-semibold text-sm border-slate-200"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ── Content renderer ──────────────────────────────────────────────────────
  const renderActiveContent = () => {
    // ── Quiz ─────────────────────────────────────────────────────────────
    if (activeItemType === "quiz") {
      const rawExercises = detailedExercises || [];
      const exercisesList = quizSubmitted
        ? rawExercises
        : rawExercises.map((ex: any) => {
            const scrubbed = { ...ex };
            delete scrubbed.correctAnswer;
            return scrubbed;
          });

      return (
        <div className="space-y-6 pb-20">
          {/* Quiz summary card */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-[#8B5CF6] border border-purple-200/80 shrink-0">
                <HelpCircle size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#8B5CF6] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Assessment
                </span>
                <h3 className="text-base font-bold text-slate-900 font-heading m-0 mt-1">
                  {activeItem?.title || "Lesson Assessment"}
                </h3>
                {quizSubmitted ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-emerald-600">
                      Score: {quizScore} / {exercisesList.length}
                    </span>
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px] px-2 py-0.5">
                      {Math.round((quizScore / exercisesList.length) * 100)}%
                    </Badge>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium mt-1 m-0">
                    {exercisesList.length} Questions · Answer all questions to submit.
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

          {/* Student Identity Verification Gate */}
          {!quizSubmitted && !isExamAttested ? (
            <ExamIdentityVerificationCard
              user={user}
              questionsCount={exercisesList.length}
              attestationChecked={attestationChecked}
              onAttestationChange={setAttestationChecked}
              isReadOnlyPreview={isReadOnlyPreview}
              onBeginExam={({ idPhotoUrl, webcamSnapUrl }) => {
                setIsExamAttested(true);
                if (isReadOnlyPreview) return;
                toast.success("Identity verified. Monitored examination session started.");
                const targetExerciseId = exercisesList[0]?.id;
                if (!targetExerciseId) return;
                examSecurityService
                  .startSession({
                    exerciseId: targetExerciseId,
                    idPhotoUrl,
                    webcamSnapUrl,
                    honorCodeAccepted: true,
                    userAgent: navigator.userAgent,
                  })
                  .then((session) => {
                    const sid = session?.sessionId ?? session?.id;
                    if (sid) setExamSessionId(sid);
                  })
                  .catch((err) => {
                    console.warn("[ExamSecurity] Failed to register proctored exam session:", err);
                  });
              }}
            />
          ) : (
            <>
              {/* First-Week Attendance Gate Notice */}
              {exercisesList.some((ex: any) => ex.isWeekOneAttendanceGate) && (
                <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200/90 text-emerald-900 text-xs flex items-center gap-3 shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold block text-emerald-950">
                      First-Week Academic Attendance Verification Gate
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Submitting this designated exercise confirms your active academic engagement and automatically verifies your present attendance on the cohort enrollment census.
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
                    className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-6 select-none space-y-4"
                    onCopy={(e) => {
                      if (!quizSubmitted) {
                        e.preventDefault();
                        toast.error("Copying questions is disabled during secure examination sessions.");
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md">
                          Question {index + 1}
                        </span>
                        {exercise.isWeekOneAttendanceGate && (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-medium">
                            Week 1 Attendance Gate
                          </Badge>
                        )}
                      </div>
                      {exercise.rubric && (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-medium">
                          Rubric Assessed ({exercise.points} pts)
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900 leading-snug font-heading">
                      {exercise.question}
                    </div>

                    {exercise.rubric && (
                      <div className="mb-2">
                        <RubricCriteriaTable rubric={exercise.rubric} compact />
                      </div>
                    )}

                    {options.length === 0 ? (
                      <div className="space-y-2">
                        <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
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

                          const questionIsCorrect = Boolean(
                            optionResult?.isCorrect ??
                            sub?.isCorrect ??
                            reportEx?.isCorrect ??
                            (sub?.score && sub.score > 0) ??
                            (reportEx?.score && reportEx.score > 0),
                          );

                          const knownCorrectAnswer = quizSubmitted
                            ? (optionResult?.correctAnswer || sub?.correctAnswer || exercise.correctAnswer)
                            : undefined;

                          const isCorrect = quizSubmitted && (
                            knownCorrectAnswer
                              ? knownCorrectAnswer === option
                              : (questionIsCorrect && isSelected)
                          );

                          const isWrong = quizSubmitted && isSelected && !questionIsCorrect;

                          let cls =
                            "border-slate-200 bg-white hover:bg-slate-50 text-slate-800";
                          if (quizSubmitted) {
                            if (isCorrect)
                              cls =
                                "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                            else if (isWrong)
                              cls = "border-red-400 bg-red-50 text-red-900 font-semibold";
                            else
                              cls =
                                "border-slate-200 bg-slate-50 opacity-60";
                          } else if (isSelected) {
                            cls =
                              "border-[#0A65A0] bg-blue-50/70 text-[#0A65A0] font-semibold ring-1 ring-[#0A65A0]";
                          }

                          return (
                            <Label
                              key={idx}
                              htmlFor={`q${exercise.id}-o${idx}`}
                              className={cn(
                                "flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-150 text-xs sm:text-sm font-medium",
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
                                      ? "text-[#0A65A0] border-[#0A65A0]"
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

              {!quizSubmitted && !isReadOnlyPreview && (
                <div className="flex justify-center pt-3">
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
                            const percentScore =
                              exercisesList.length > 0
                                ? Math.round((serverScore / exercisesList.length) * 100)
                                : 0;
                            examSecurityService
                              .endSession({ sessionId: examSessionId, score: percentScore })
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
                    className="h-11 px-8 rounded-xl bg-[#F16A1C] hover:bg-[#D75812] text-white font-semibold text-xs sm:text-sm shadow-sm"
                  >
                    Submit Quiz
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    // ── Video ─────────────────────────────────────────────────────────────
    if (activeItemType === "video") {
      return (
        <div className="space-y-6 pb-20">
          {renderHeroObjectiveBox(activeItem?.title || activeLesson?.title, (activeLesson as any)?.description)}

          {/* Video Player Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden shadow-sm mb-6">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl mb-6">
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
                  onClick={() => handleMarkContentComplete(activeItem)}
                  disabled={updateContentMutation.isPending}
                  className="h-8 text-xs font-semibold gap-1.5 bg-[#F16A1C] hover:bg-[#D75812] text-white rounded-xl shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" /> Mark as Completed
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200/70 p-6 bg-white space-y-3">
              <h3 className="text-sm font-bold text-slate-900 font-heading m-0">
                About this lesson
              </h3>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium prose max-w-none">
                {activeItem?.content ? (
                  <div dangerouslySetInnerHTML={{ __html: activeItem.content }} />
                ) : (
                  <p>
                    In this part of the course, we'll explore{" "}
                    <strong className="text-slate-900 font-semibold">
                      {activeItem?.title}
                    </strong>
                    . Pay close attention to the key concepts presented in this section.
                  </p>
                )}
              </div>
            </div>
          </div>

          {renderRequiredReadings()}

          {/* Unit Discussion Callout */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/40 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-100 text-blue-700">
                  <MessageSquare className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 font-heading">
                  Unit Discussion Forum &bull; {currentModule?.title || "This Unit"}
                </span>
              </div>
              <p className="text-xs text-slate-600 m-0">
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
              className="bg-[#0A65A0] hover:bg-[#084B78] text-white font-medium text-xs h-9 px-4 rounded-xl shrink-0 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Go to Unit Discussion
            </Button>
          </div>
        </div>
      );
    }

    // ── Reading / Chapter Material ─────────────────────────────────────────
    if (activeItemType === "reading") {
      const url = getFullUrl((activeItem as any)?.url);

      return (
        <div className="space-y-6 pb-20">
          {renderHeroObjectiveBox(activeItem?.title || activeLesson?.title, (activeLesson as any)?.description)}

          {/* Reading Material Card */}
          <div id="reading-content-card" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading m-0">
                  Reading material
                </h3>
                <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                  {activeLesson?.title || "Chapter 1"}: {activeItem?.title || "Study Content"}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {isPdf && (
                  <span className="text-xs font-semibold text-[#0A65A0] bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-lg">
                    Page {pdfCurrentPage} of {pdfTotalPages || 35}
                  </span>
                )}
                {isPdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPdfViewerOpen(true)}
                    className="h-8 text-xs font-medium gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <Expand className="w-3.5 h-3.5" /> Expand
                  </Button>
                )}
              </div>
            </div>

            {/* Reading Content */}
            <div className="pt-6">
              {isPdf ? (
                <div className="relative w-full min-h-[500px] bg-white rounded-xl overflow-hidden border border-slate-200 flex flex-col mb-4">
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
                <div className="rounded-xl border border-slate-200/70 p-6 sm:p-8 bg-[#F8FAFC] space-y-4">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 font-heading m-0">
                    {activeItem?.title || "Clinical Study Material"}
                  </h4>
                  <div className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed prose max-w-none">
                    {activeItem?.content ? (
                      <div dangerouslySetInnerHTML={{ __html: activeItem.content }} />
                    ) : (
                      <p>
                        In this part of the course, we'll explore{" "}
                        <strong className="text-slate-900 font-semibold">{activeItem?.title}</strong>.
                        Pay close attention to the clinical principles, safety standards, and practical skills presented in this section.
                      </p>
                    )}
                  </div>
                  {/* Progress dots */}
                  <div className="flex items-center gap-1.5 pt-3">
                    <span className="w-6 h-1.5 rounded-full bg-[#F16A1C]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>
                </div>
              )}
            </div>

            {/* Reading Action Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t border-slate-100 mt-6">
              <div className="flex items-center gap-2">
                {isContentCompleted(activeItem?.id) ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Reading recorded as completed
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500">
                    Finish reading to record completion
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveItemType("discussion");
                    if (currentModule?.id) setActiveModuleId(currentModule.id);
                    setActiveItemId(`discussion-${currentModule?.id || "unit"}`);
                  }}
                  className="h-9 px-3.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#0A65A0]" /> Unit discussion
                </Button>

                {!isContentCompleted(activeItem?.id) && !isReadOnlyPreview ? (
                  <Button
                    size="sm"
                    onClick={() => handleMarkContentComplete(activeItem)}
                    disabled={updateContentMutation.isPending}
                    className="h-9 px-4 rounded-xl bg-[#0A65A0] hover:bg-[#084B78] text-white font-semibold text-xs gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark as read
                  </Button>
                ) : (
                  <span className="h-9 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </span>
                )}
              </div>
            </div>
          </div>

          {renderRequiredReadings()}

          {/* Unit Discussion Callout */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/40 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-100 text-blue-700">
                  <MessageSquare className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 font-heading">
                  Unit Discussion Forum &bull; {currentModule?.title || "This Unit"}
                </span>
              </div>
              <p className="text-xs text-slate-600 m-0">
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
              className="bg-[#0A65A0] hover:bg-[#084B78] text-white font-medium text-xs h-9 px-4 rounded-xl shrink-0 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Go to Unit Discussion
            </Button>
          </div>
        </div>
      );
    }

    // ── Unit Discussion Forum (WAC 246-841A-440) ───────────────────────────
    if (activeItemType === "discussion") {
      const activeMod =
        course?.modules?.find(
          (m) => String(m.id) === String(activeModuleId),
        ) ||
        course?.modules?.find((m) =>
          m.lessons?.some((l) => String(l.id) === String(activeLessonId)),
        ) ||
        course?.modules?.[0];

      return (
        <div className="space-y-6 pb-20 w-full">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded flex items-center gap-1.5">
                <MessageSquare size={13} /> Unit Asynchronous Discussion
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium m-0 mb-1">
              {course?.title || "Nursing Assistant Training"} &bull; {activeMod?.title || "Course Unit"}
            </p>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading m-0">
              {activeMod?.title || "Unit"}: Clinical Dialogue & Peer Responses
            </h3>

            <div className="mt-6 w-full">
              {activeMod?.id ? (
                <DiscussionForumView
                  moduleId={activeMod.id}
                  isInstructor={isInstructor}
                  canCreateTopic={false}
                  className="w-full"
                />
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  Select a module lesson to load its unit discussion forum.
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen h-screen overflow-hidden bg-[#F2F5FB] flex flex-col font-sans">
      <AnimatePresence>
        {isPdfViewerOpen && isPdf && (
          <PdfViewer
            url={getFullUrl((activeItem as any)?.url || activeItem?.content)}
            title={activeItem?.title || "Document"}
            onClose={() => setIsPdfViewerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Lovable/V2 Course Header ───────────────────────────────────────── */}
      <header className="h-16 px-4 sm:px-6 bg-white border-b border-[#E1E7F1] flex items-center justify-between shrink-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Toggle course menu"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>
          <button
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Return to dashboard"
            onClick={() =>
              navigate(isAuditor ? "/instructor/audit" : "/dashboard")
            }
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block mx-1" />

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs truncate">
            <Link
              to="/dashboard"
              className="text-slate-500 hover:text-slate-800 transition-colors font-medium hidden sm:inline"
            >
              My Learning
            </Link>
            <ChevronRight size={14} className="text-slate-400 hidden sm:inline shrink-0" />
            <span className="text-slate-500 font-medium truncate max-w-[140px] sm:max-w-[200px] lg:max-w-[280px]">
              {course.title}
            </span>
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
            <span className="text-slate-900 font-semibold truncate max-w-[120px] sm:max-w-[180px]">
              {activeLesson?.title || "Lesson"}
            </span>
          </div>

          {/* Discipline pill */}
          <span
            className={cn(
              "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border hidden md:inline-flex items-center shrink-0",
              disciplineTheme.pillClass,
            )}
          >
            {disciplineTheme.name}
          </span>

          {/* Unit pill */}
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hidden lg:inline-flex items-center shrink-0">
            Unit {currentModuleIndex + 1} · {currentModule?.title || "Module"}
          </span>

          {isReadOnlyPreview && (
            <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-medium shrink-0">
              Read-Only Inspection
            </Badge>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            aria-label="Open profile menu"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-[#0A65A0] text-white flex items-center justify-center font-bold text-xs font-heading">
              {userInitials}
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute top-12 right-0 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <strong className="block font-semibold text-slate-900 text-sm truncate">
                  {user ? `${user.firstname} ${user.lastname}` : "Student account"}
                </strong>
                <span className="text-slate-500 text-[11px] truncate block">
                  {user?.email || "Enrolled Candidate"}
                </span>
              </div>
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setProfileOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                View dashboard
              </button>
              <button
                onClick={() => {
                  navigate("/profile");
                  setProfileOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                View profile
              </button>
              <button
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold transition-colors mt-1"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Workspace Body ────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Outline Sidebar */}
        <aside
          className={cn(
            "w-72 lg:w-80 shrink-0 bg-white border-r border-[#E1E7F1] flex flex-col h-full transition-all duration-300 z-20",
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:overflow-hidden absolute lg:relative",
          )}
        >
          {/* Progress Header */}
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
            const remainingLessons = Math.max(0, totalCourseLessons - completedLessonsCount);
            const hoursLeft = Math.max(0.5, Math.round((remainingLessons * 25) / 6) / 10);

            const radius = 20;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset =
              circumference - (effectiveProgress / 100) * circumference;

            return (
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3.5 bg-white shrink-0">
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle
                      cx="24"
                      cy="24"
                      r={radius}
                      className="text-slate-100 stroke-current"
                      strokeWidth="4"
                      fill="transparent"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r={radius}
                      className="text-[#10B981] stroke-current transition-all duration-500 ease-out"
                      strokeWidth="4"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-bold font-heading text-slate-800">
                    {effectiveProgress}%
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold font-heading text-slate-900 block truncate">
                    Course progress
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium m-0 mt-0.5 truncate">
                    {completedLessonsCount} of {totalCourseLessons} lessons · {hoursLeft}h left
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Theory Seat-Time Indicator */}
          <div className="px-4 py-2.5 mx-3 my-2 rounded-xl bg-blue-50/70 border border-blue-100 text-xs space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-semibold text-blue-900">
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-blue-600" /> Theory Seat-Time
              </span>
              <span>
                {((seatTimeSummary?.totalActiveTimeSeconds ?? 0) / 3600).toFixed(1)} hrs ({seatTimeSummary?.totalActiveTimeMinutes ?? Math.round((seatTimeSummary?.totalActiveTimeSeconds ?? 0) / 60)}m)
                {(seatTimeSummary?.totalRequiredSeconds ?? 0) > 0 &&
                  ` / ${((seatTimeSummary!.totalRequiredSeconds!) / 3600).toFixed(1)} hrs`}
              </span>
            </div>
            {(seatTimeSummary?.totalRequiredSeconds ?? 0) > 0 && (
              <div className="h-1.5 rounded-full bg-blue-200/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((seatTimeSummary?.totalActiveTimeSeconds ?? 0) /
                          seatTimeSummary!.totalRequiredSeconds!) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] text-blue-700">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Heartbeat Active
              </span>
              <span className="text-[9px] text-blue-500">Auto-pauses on blur</span>
            </div>
          </div>

          {/* Module & Lesson Outline list */}
          <nav className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4" aria-label="Course lessons">
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
                <div key={module.id} className="space-y-1.5">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate m-0">
                      {module.title} · {completedInMod}/{totalInMod}
                    </p>
                    <span
                      className={cn(
                        "text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                        moduleStatus === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : moduleStatus === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {moduleStatus === "COMPLETED"
                        ? "Done"
                        : moduleStatus === "IN_PROGRESS"
                          ? `${completedInMod}/${totalInMod}`
                          : "Start"}
                    </span>
                  </div>

                  {module.lessons?.map((lesson) => {
                    const isActiveLesson = activeLessonId === lesson.id;
                    const isFinished = checkLessonCompleted(lesson.id);

                    return (
                      <div key={lesson.id} className="space-y-1">
                        <button
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
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all",
                            isActiveLesson
                              ? "bg-[#FFF7ED] border border-[#FDBA74]/80 text-[#9A3412] font-semibold shadow-2xs"
                              : isFinished
                                ? "text-slate-700 hover:bg-slate-50"
                                : "text-slate-500 hover:bg-slate-50",
                          )}
                        >
                          {isFinished ? (
                            <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
                          ) : isActiveLesson ? (
                            <span className="w-5 h-5 rounded-full bg-[#F16A1C] text-white flex items-center justify-center shrink-0">
                              <Play size={10} className="fill-white ml-0.5" />
                            </span>
                          ) : (
                            <LockKeyhole size={15} className="text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </button>

                        {/* Sub-items when lesson is active */}
                        {isActiveLesson && (
                          <div className="flex flex-col gap-1 pl-4 pr-1 py-1">
                            {lesson.contents?.map((content) => {
                              const isActiveItem = activeItemId === content.id;
                              const isContentDone = isContentCompleted(content.id);
                              return (
                                <button
                                  key={content.id}
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
                                  className={cn(
                                    "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors",
                                    isActiveItem
                                      ? "bg-blue-50 text-[#0A65A0] font-semibold border border-blue-200/80 shadow-2xs"
                                      : "text-slate-600 hover:bg-slate-50 border border-transparent",
                                  )}
                                >
                                  {isContentDone ? (
                                    <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
                                  ) : content.type === "VIDEO" ? (
                                    <PlaySquare size={14} className="text-slate-400 shrink-0" />
                                  ) : (
                                    <FileText size={14} className="text-slate-400 shrink-0" />
                                  )}
                                  <span className="truncate flex-1">{content.title}</span>
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
                                    onClick={() => {
                                      setActiveItemId(quizItem.id);
                                      setActiveItemType("quiz");
                                      if (window.innerWidth < 900)
                                        setIsSidebarOpen(false);
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors",
                                      isActiveQuiz
                                        ? "bg-purple-50 text-[#8B5CF6] font-semibold border border-purple-200/80 shadow-2xs"
                                        : "text-slate-600 hover:bg-slate-50 border border-transparent",
                                    )}
                                  >
                                    {isQuizDone ? (
                                      <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
                                    ) : (
                                      <HelpCircle size={14} className="text-[#8B5CF6] shrink-0" />
                                    )}
                                    <span className="truncate flex-1">{quizItem.title}</span>
                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-[#8B5CF6] border border-purple-200 shrink-0">
                                      Quiz
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Unit Discussion Forum Button */}
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setActiveItemType("discussion");
                        setActiveModuleId(module.id);
                        setActiveLessonId(null);
                        setActiveItemId(`discussion-${module.id}`);
                        if (window.innerWidth < 900) setIsSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors",
                        activeItemType === "discussion" && String(activeModuleId) === String(module.id)
                          ? "bg-sky-50 text-[#0284C7] font-semibold border border-sky-200 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-50 border border-transparent",
                      )}
                    >
                      <MessageSquare size={14} className="text-[#0284C7] shrink-0" />
                      <span className="truncate flex-1 font-medium">Unit Discussion</span>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-sky-100 text-[#0284C7] border border-sky-200/60 shrink-0">
                        WAC
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-10 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Learning Area */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#F2F5FB] overflow-hidden">
          {/* Subheader / Toolbar Action Bar */}
          <div className="px-4 sm:px-6 lg:px-8 py-3.5 bg-white border-b border-[#E1E7F1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-2xs">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold font-heading text-[#0F1B34] m-0 truncate">
                {activeItemType === "discussion"
                  ? `${currentModule?.title || "Unit"}: Discussion Forum`
                  : `Chapter ${currentLessonIndex + 1 >= 0 ? currentLessonIndex + 1 : 1} · ${activeLesson?.title || "Lesson"}`}
              </h2>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
              <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <button
                  disabled={currentItemIndex <= 0 || activeItemType === "discussion"}
                  onClick={handlePrevItem}
                  className="h-9 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 border-r border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  disabled={
                    currentItemIndex === -1 ||
                    currentItemIndex === allItems.length - 1 ||
                    activeItemType === "discussion"
                  }
                  onClick={handleNextItem}
                  className="h-9 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>

              {activeItemType !== "quiz" && activeItemType !== "discussion" && !isReadOnlyPreview && (
                <button
                  onClick={handleMarkComplete}
                  disabled={isLessonCompleted || markCompleteMutation.isPending}
                  className={cn(
                    "h-9 px-4 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs",
                    isLessonCompleted
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                      : "bg-[#F16A1C] hover:bg-[#D75812] text-white",
                  )}
                >
                  {isLessonCompleted ? (
                    <>
                      <Check size={15} /> Completed
                    </>
                  ) : markCompleteMutation.isPending ? (
                    "..."
                  ) : (
                    <>
                      <Check size={15} /> Mark complete
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Main content scroll container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              {renderActiveContent()}
            </div>
          </div>
        </section>
      </div>

      <CelebrationModal
        isOpen={celebration.isOpen}
        title={
          celebration.title ||
          `Chapter ${currentLessonIndex + 1 >= 0 ? currentLessonIndex + 1 : 1} complete!`
        }
        message={celebration.message}
        isLastItem={!nextItem}
        courseTitle={course?.title}
        lessonTitle={activeLesson?.title}
        nextItemTitle={nextItem?.title}
        nextItemType={nextItem?.itemType}
        progressPercent={Math.max(
          progress,
          flatLessons.length > 0
            ? Math.round(
                (flatLessons.filter((l) => checkLessonCompleted(l.id)).length /
                  flatLessons.length) *
                  100,
              )
            : 0,
        )}
        completedCount={flatLessons.filter((l) => checkLessonCompleted(l.id)).length}
        totalCount={flatLessons.length}
        seatTimeHours={((seatTimeSummary?.totalActiveTimeSeconds ?? 0) / 3600).toFixed(1)}
        onClose={() => setCelebration((prev) => ({ ...prev, isOpen: false }))}
        onContinue={() => {
          setCelebration((prev) => ({ ...prev, isOpen: false }));
          handleNextItem();
        }}
      />
    </div>
  );
};

export default LmsLearn;
