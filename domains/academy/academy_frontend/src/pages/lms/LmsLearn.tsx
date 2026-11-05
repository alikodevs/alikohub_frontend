import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useCourseDetails,
  useMarkLessonComplete,
  useEnrollments,
  useStudentAnalytics,
  useStudentDashboard,
  useSubmitExercise,
  useCourseReport,
} from "@/hooks/useAcademy";
import { useQueries } from "@tanstack/react-query";
import { academyService } from "@/services/academyService";
import LmsNavbar from "@/components/LmsNavbar";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  FileText,
  HelpCircle,
  CheckCircle,
  PlayCircle,
  Lock,
  Menu,
  X,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
// import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LmsLearn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading } = useCourseDetails(id || "");
  const { data: enrollments } = useEnrollments();
  const { data: analytics } = useStudentAnalytics();
  const markCompleteMutation = useMarkLessonComplete();
  const submitExerciseMutation = useSubmitExercise();
  const { data: dashboardData } = useStudentDashboard();
  const { data: reportData, isLoading: isReportLoading } = useCourseReport(
    id || "",
  );

  const enrollment = enrollments?.find((e) => e.courseId === id);

  // Find progress from dashboard data
  const courseProgressData = dashboardData?.find(
    (d: any) => d.courseId === Number(id),
  );

  const progress = Math.round(
    courseProgressData?.percentage || enrollment?.progress || 0,
  );

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<
    "overview" | "materials" | "quizzes"
  >("overview");
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Find active data
  const flatLessons = course?.modules?.flatMap((m) => m.lessons || []) || [];
  const currentLessonIndex = flatLessons.findIndex(
    (l) => l.id === activeLessonId,
  );
  const activeLesson = flatLessons[currentLessonIndex];

  // Fetch individual exercises as source of truth for submissions
  const exercises = activeLesson?.exercises || [];
  const exerciseQueries = useQueries({
    queries: exercises.map((ex: any) => ({
      queryKey: ["exercise", ex.id],
      queryFn: () => academyService.getExerciseDetails(ex.id),
      enabled: !!ex.id && viewMode === "quizzes",
    })),
  });

  // Track the most recent data to avoid re-running the sync effect too often
  const lastSyncKey = JSON.stringify(
    exerciseQueries.map(
      (q) => q.data?.mySubmission?.updatedAt || q.dataUpdatedAt,
    ),
  );

  const detailedExercises = exercises.map((ex: any, idx) => {
    const detailed = exerciseQueries[idx]?.data;
    return detailed || ex;
  });

  // Auto-select first lesson on load
  useEffect(() => {
    if (course && course.modules?.[0]?.lessons?.[0] && !activeLessonId) {
      setActiveLessonId(course.modules[0].lessons[0].id);
    }
  }, [course, activeLessonId]);

  // 1. Reset everything only when the specific lesson changes
  useEffect(() => {
    setViewMode("overview");
    setCurrentExerciseIndex(0);
    setIsAnswered(false);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  }, [activeLessonId]);

  // 2. Sync with backend data (detailed fetch or report)
  useEffect(() => {
    if (detailedExercises.length) {
      const answers: Record<string, string> = {};
      let submittedCount = 0;
      let score = 0;

      // Find this lesson in report if available
      const reportLesson = reportData
        ?.flatMap((m: any) => m.lessons || [])
        .find((l: any) => l.lessonId === Number(activeLessonId));

      detailedExercises.forEach((ex: any) => {
        // Try to find exercise in report
        const reportExercise = reportLesson?.exercises?.find(
          (rex: any) => rex.exerciseId === Number(ex.id),
        );

        // Source of truth priorities:
        // 1. Specific detailed fetch (detailedEx.mySubmission)
        // 2. Report data (reportExercise.answer)
        // 3. Original lesson structure (ex.mySubmission)
        const storedAnswer =
          ex.mySubmission?.answer ||
          reportExercise?.answer ||
          ex.userAnswer ||
          ex.submission?.answer;

        if (storedAnswer) {
          answers[ex.id] = storedAnswer;
          submittedCount++;

          // Check if correct
          const isCorrect =
            ex.mySubmission?.isCorrect ||
            ex.mySubmission?.status === "GRADED" ||
            reportExercise?.isCorrect ||
            reportExercise?.status === "GRADED" ||
            storedAnswer === ex.correctAnswer;

          if (isCorrect) score++;
        }
      });

      if (submittedCount > 0) {
        setSelectedAnswers(answers);
        setQuizSubmitted(true);
        setQuizScore(score);
      } else {
        setQuizSubmitted(false);
        setQuizScore(0);
        setSelectedAnswers({});
      }
    } else {
      setQuizSubmitted(false);
      setQuizScore(0);
      setSelectedAnswers({});
    }
  }, [activeLessonId, lastSyncKey, reportData]);

  if (isLoading || isReportLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <LmsNavbar />
        <div className="flex h-[calc(100vh-64px)]">
          <div className="w-80 bg-white border-r hidden md:block p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-[400px] w-full rounded-2xl mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <h2 className="text-2xl font-bold font-heading text-slate-900 mb-2">
          Course not found
        </h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          We couldn't find the course you're looking for. It might have been
          removed or you don't have access.
        </p>
        <Button
          onClick={() => navigate("/lms/my-learning")}
          className="rounded-xl"
        >
          Return to My Learning
        </Button>
      </div>
    );
  }

  // Handlers
  const checkLessonCompleted = (lessonId: string | number) => {
    if (!reportData) return false;
    const allReportLessons = reportData.flatMap((m: any) => m.lessons || []);
    const lesson = allReportLessons.find(
      (l: any) => l.lessonId === Number(lessonId),
    );
    return lesson?.status === "COMPLETED";
  };

  const handleNext = (options?: { bypassCheck?: boolean }) => {
    const bypassCheck = options?.bypassCheck === true;
    if (!bypassCheck && activeLessonId) {
      if (!checkLessonCompleted(activeLessonId)) {
        toast.error(
          "Please complete this lesson before moving to the next one.",
        );
        return;
      }
    }
    if (currentLessonIndex < flatLessons.length - 1) {
      setActiveLessonId(flatLessons[currentLessonIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (currentLessonIndex > 0) {
      setActiveLessonId(flatLessons[currentLessonIndex - 1].id);
    }
  };

  const handleMarkComplete = () => {
    if (activeLessonId) {
      markCompleteMutation.mutate(
        {
          courseId: course.id,
          lessonId: activeLessonId,
        },
        {
          onSuccess: () => {
            toast.success("Lesson marked as complete!");
            handleNext({ bypassCheck: true });
          },
        },
      );
    }
  };

  const handleOptionSelect = (exerciseId: string, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [exerciseId]: option }));
  };

  const handleExerciseSubmit = (exerciseId: string) => {
    const answer = selectedAnswers[exerciseId];
    if (!answer) {
      toast.error("Please select an answer first.");
      return;
    }
    submitExerciseMutation.mutate(
      { exerciseId, answer },
      {
        onSuccess: () => {
          setIsAnswered(true);
        },
      },
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
    } catch (e) {
      console.error(e);
    }
    const origin = window.location.origin;
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&enablejsapi=1&origin=${origin}`;
  };

  const getFullUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const baseUrl = "https://api.consultancy.alikohub.com";
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

  const renderActiveContent = () => {
    if (viewMode === "quizzes") {
      const exercisesList = detailedExercises || [];
      return (
        <div className="mx-auto w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          <button
            onClick={() => setViewMode("overview")}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-400 transition-all hover:text-primary group"
          >
            <ChevronLeft
              size={16}
              className="transition-transform group-hover:-translate-x-1"
            />
            Back to Overview
          </button>

          <div className="space-y-8">
            <div className="rounded-[32px] bg-white p-8 sm:p-12 shadow-card border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shadow-sm border border-amber-100">
                    <HelpCircle size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                      {activeLesson?.title} Quiz
                    </h1>
                    {quizSubmitted ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-black text-emerald-600">
                          Score: {quizScore} / {exercisesList.length}
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">
                          {Math.round((quizScore / exercisesList.length) * 100)}
                          % Complete
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 font-medium mt-1">
                        {exercisesList.length} Questions • Answer all to
                        complete the assessment.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {exercisesList.map((exercise: any, index: number) => {
              const options = parseOptions(exercise.options);
              const isAnsweredLocal = !!selectedAnswers[exercise.id];

              return (
                <div
                  key={exercise.id}
                  className="rounded-[32px] bg-white p-8 sm:p-10 shadow-card border border-slate-100 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-8 flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100">
                      Question {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {exercise.points || 10} Points
                    </span>
                  </div>

                  <div className="mb-10">
                    <h2 className="text-xl font-bold text-slate-900 leading-snug tracking-tight">
                      {exercise.question}
                    </h2>
                    {exercise.description && (
                      <p className="mt-3 text-slate-500 font-medium text-sm border-l-2 border-slate-100 pl-4 py-1">
                        {exercise.description}
                      </p>
                    )}
                  </div>

                  <RadioGroup
                    value={selectedAnswers[exercise.id]}
                    onValueChange={(v) =>
                      !quizSubmitted && handleOptionSelect(exercise.id, v)
                    }
                    className="flex flex-col gap-3"
                    disabled={quizSubmitted}
                  >
                    {options.map((option, idx) => {
                      const isSelected =
                        selectedAnswers[exercise.id] === option;
                      const sub = exercise.mySubmission || exercise.submission;
                      const reportExercise = reportData
                        ?.flatMap((m: any) => m.lessons || [])
                        .find((l: any) => Number(l.lessonId) === Number(activeLessonId))
                        ?.exercises?.find((rex: any) => Number(rex.exerciseId) === Number(exercise.id));

                      const questionIsCorrect = Boolean(
                        sub?.isCorrect ??
                        reportExercise?.isCorrect ??
                        (sub?.score && sub.score > 0) ??
                        (reportExercise?.score && reportExercise.score > 0)
                      );

                      const knownCorrectAnswer = quizSubmitted
                        ? (sub?.correctAnswer || exercise.correctAnswer)
                        : undefined;

                      const isCorrect = quizSubmitted && (
                        knownCorrectAnswer
                          ? knownCorrectAnswer === option
                          : (questionIsCorrect && isSelected)
                      );

                      const isWrong = quizSubmitted && isSelected && !questionIsCorrect;

                      let bgClass =
                        "border-slate-100 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-200";
                      if (quizSubmitted) {
                        if (isCorrect)
                          bgClass =
                            "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/20";
                        else if (isWrong)
                          bgClass =
                            "border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500/20";
                        else if (isSelected)
                          bgClass =
                            "border-slate-200 bg-slate-100/50 opacity-60";
                        else
                          bgClass =
                            "border-slate-100 bg-slate-50/30 opacity-40";
                      } else if (isSelected) {
                        bgClass =
                          "border-amber-400 bg-amber-50/30 shadow-sm ring-1 ring-amber-400/20";
                      }

                      return (
                        <Label
                          key={idx}
                          htmlFor={`q${exercise.id}-o${idx}`}
                          className={cn(
                            "flex items-center gap-4 rounded-2xl border p-5 transition-all duration-300",
                            bgClass,
                            !quizSubmitted && "cursor-pointer",
                          )}
                        >
                          {!quizSubmitted ? (
                            <RadioGroupItem
                              value={option}
                              id={`q${exercise.id}-o${idx}`}
                              className="border-slate-300 data-[state=checked]:border-amber-500"
                            />
                          ) : isCorrect ? (
                            <CheckCircle
                              size={20}
                              className="text-emerald-500 shrink-0"
                            />
                          ) : isWrong ? (
                            <X size={20} className="text-red-500 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-200 shrink-0" />
                          )}
                          <span className="flex-1 text-base font-semibold">
                            {option}
                          </span>
                        </Label>
                      );
                    })}
                  </RadioGroup>

                  {/* Feedback Section - Show after submission */}
                  {exercise.mySubmission && (
                    <div className="mt-8 p-6 rounded-[24px] bg-slate-50 border border-slate-100 flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-800">
                            Instructor Feedback
                          </p>
                          {exercise.mySubmission.status === "GRADED" && (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] h-5">
                              GRADED
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                          {exercise.mySubmission.feedback}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex justify-center pt-8">
              {quizSubmitted ? (
                <Button
                  onClick={() => setViewMode("overview")}
                  className="rounded-2xl px-12 h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95 gap-2"
                >
                  <CheckCircle size={20} />
                  Quiz Completed - Back to Overview
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const allAnswered = exercisesList.every(
                      (ex: any) => selectedAnswers[ex.id],
                    );
                    if (!allAnswered) {
                      toast.error(
                        "Please answer all questions before submitting.",
                      );
                      return;
                    }

                    // Submit all
                    Promise.all(
                      exercisesList.map((ex: any) =>
                        submitExerciseMutation.mutateAsync({
                          exerciseId: ex.id,
                          answer: selectedAnswers[ex.id],
                        }),
                      ),
                    )
                      .then((results) => {
                        let correctCount = 0;
                        results.forEach((res: any, idx: number) => {
                          const ex = exercisesList[idx];
                          const isCorrect = Boolean(res?.isCorrect ?? (res?.score > 0));
                          if (isCorrect) correctCount++;
                          if (ex) {
                            ex.mySubmission = {
                              ...ex.mySubmission,
                              ...res,
                              isCorrect,
                            };
                          }
                        });
                        setQuizScore(correctCount);
                        setQuizSubmitted(true);
                        toast.success(
                          `Quiz completed! Score: ${correctCount}/${exercisesList.length}`,
                        );
                        // Mark lesson as complete automatically
                        if (activeLessonId) {
                          markCompleteMutation.mutate({
                            courseId: course.id,
                            lessonId: activeLessonId,
                          });
                        }
                      })
                      .catch(() => {
                        toast.error(
                          "Some answers failed to submit. Please try again.",
                        );
                      });
                  }}
                  disabled={submitExerciseMutation.isPending}
                  className="rounded-2xl px-12 h-16 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95"
                >
                  {submitExerciseMutation.isPending
                    ? "Submitting..."
                    : "Submit All Answers"}
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === "materials") {
      return (
        <div className="mx-auto w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => setViewMode("overview")}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-400 transition-all hover:text-primary group"
          >
            <ChevronLeft
              size={16}
              className="transition-transform group-hover:-translate-x-1"
            />
            Back to Overview
          </button>

          <div className="rounded-[32px] bg-white p-8 sm:p-12 shadow-card border border-slate-100">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                <PlayCircle size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                  Learning Materials
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Access all lesson videos and downloadable resources.
                </p>
              </div>
            </div>

            <div className="space-y-12">
              {activeLesson?.contents?.map((content, cIdx) => (
                <div
                  key={content.id}
                  className="pt-10 border-t border-slate-100 first:border-0 first:pt-0"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                      Material {cIdx + 1}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 leading-snug">
                      {content.title}
                    </h3>
                  </div>

                  {content.type === "VIDEO" ? (
                    <div className="space-y-4">
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-slate-200/50 relative">
                        {isYouTube(content.url) ? (
                          <iframe
                            className="w-full h-full border-0"
                            src={getYouTubeEmbedUrl(content.url || "")}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <video
                            src={getFullUrl(content.url)}
                            controls
                            controlsList="nodownload"
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                      {isYouTube(content.url) && (
                        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-50 border border-slate-200 border-dashed">
                          <p className="text-sm font-medium text-slate-500 text-center max-w-md">
                            If the video player doesn't load here, it may have
                            embedding restricted by the owner. You can watch it
                            directly on YouTube.
                          </p>
                          <Button
                            asChild
                            variant="outline"
                            className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-2 font-black rounded-xl h-12 px-8 shadow-sm"
                          >
                            <a
                              href={content.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Youtube size={18} />
                              Open on YouTube
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm group-hover:border-primary/20 group-hover:text-primary transition-all">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {content.title}
                          </p>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                            {content.type || "Document"} Resource
                          </p>
                        </div>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="bg-white rounded-xl px-5 h-10 font-bold border-slate-200 hover:border-primary hover:text-primary shadow-sm"
                      >
                        <a
                          href={getFullUrl(content.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Resource
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!activeLesson?.contents?.length && (
              <div className="text-center py-20 bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
                <Video className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                  No materials for this lesson
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default: Lesson Overview
    return (
      <div className="py-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="mx-auto w-full max-w-4xl rounded-[40px] bg-white p-10 sm:p-16 shadow-card border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

          <div className="flex flex-col items-center text-center relative z-10">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-slate-50 border border-slate-100 shadow-sm rotate-3 group-hover:rotate-0 transition-all">
              <PlayCircle className="w-10 h-10 text-primary" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-heading">
              {activeLesson?.title}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200">
                Lesson {currentLessonIndex + 1}
              </span>
              <div className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="text-sm font-bold text-primary uppercase tracking-wider">
                {activeLesson?.type} Content
              </span>
            </div>

            <p className="mt-8 max-w-2xl text-lg text-slate-500 font-medium leading-relaxed">
              Ready to dive in? Explore the rich learning materials and test
              your mastery with interactive assessments designed for this
              lesson.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                Learning Materials
              </h2>

              <div className="flex flex-col gap-4">
                {activeLesson?.contents?.map((content) => (
                  <button
                    key={content.id}
                    onClick={() => setViewMode("materials")}
                    className="flex items-center gap-4 rounded-3xl border border-slate-100 p-5 text-left bg-white shadow-inset hover:bg-slate-50 transition-all hover:shadow-card-hover group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                      <PlayCircle className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors" />
                    </div>

                    <div>
                      <span className="block text-base font-bold text-slate-800 group-hover:text-primary transition-colors truncate max-w-[180px]">
                        {content.title}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Click to View
                      </span>
                    </div>
                  </button>
                ))}

                {!activeLesson?.contents?.length && (
                  <div className="p-6 rounded-3xl border border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                    <Video className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                      No materials yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                Assessments
              </h2>

              <div className="flex flex-col gap-4">
                {activeLesson?.exercises?.length > 0 && (
                  <button
                    onClick={() => setViewMode("quizzes")}
                    className="flex items-center gap-4 rounded-3xl border border-slate-100 p-5 text-left bg-white shadow-inset hover:bg-slate-50 transition-all hover:shadow-card-hover relative overflow-hidden group"
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-amber-400 opacity-50 transition-opacity group-hover:opacity-100" />
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-amber-100">
                      <HelpCircle className="w-6 h-6 text-amber-600" />
                    </div>

                    <div>
                      <span className="block text-base font-bold text-slate-800 transition-colors truncate max-w-[180px]">
                        Lesson Assessment
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                        {activeLesson.exercises.length} Questions • Start Quiz
                      </span>
                    </div>
                  </button>
                )}

                {!activeLesson?.exercises?.length && (
                  <div className="p-6 rounded-3xl border border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                    <HelpCircle className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                      No quizzes yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-3 items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate("/lms/my-learning")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
          </div>

          {/* Center Title */}
          <div className="text-center text-sm sm:text-base font-semibold text-foreground truncate">
            {course.title}
          </div>

          {/* Right Controls */}
          <div className="flex items-center justify-end gap-4">
            {/* Progress */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-muted lg:w-40">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                {progress}%
              </span>
            </div>

            {/* Complete Button */}
            <Button
              onClick={handleMarkComplete}
              disabled={markCompleteMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Mark as Complete</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`
          fixed md:relative z-30 w-80 bg-white border-r border-slate-100 flex flex-col transition-all duration-300
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:w-0 md:opacity-0 md:invisible"}
        `}
        >
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Course Curriculum
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-slate-400"
            >
              <X />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            {course.modules?.map((module, mIdx) => (
              <div key={module.id} className="space-y-4">
                <h3 className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                    {mIdx + 1}
                  </span>
                  {module.title}
                </h3>

                <ul className="ml-3 flex flex-col gap-1 border-l border-slate-100 pl-5">
                  {module.lessons?.map((lesson) => {
                    const isActive = activeLessonId === lesson.id;
                    return (
                      <li key={lesson.id} className="relative">
                        <button
                          onClick={() => {
                            const targetIndex = flatLessons.findIndex(
                              (l) => l.id === lesson.id,
                            );
                            if (targetIndex > currentLessonIndex) {
                              // Check if all previous lessons are completed
                              for (let i = 0; i < targetIndex; i++) {
                                if (!checkLessonCompleted(flatLessons[i].id)) {
                                  toast.error(
                                    'Please complete this lesson before moving to the next one.',
                                  );
                                  return;
                                }
                              }
                            }
                            setActiveLessonId(lesson.id);
                            if (window.innerWidth < 768)
                              setIsSidebarOpen(false);
                          }}
                          className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors duration-200 ${
                            isActive
                              ? "text-primary"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span
                            className={`${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`}
                          >
                            {lesson.type === "VIDEO" ? (
                              <PlayCircle size={16} />
                            ) : (
                              <FileText size={16} />
                            )}
                          </span>
                          <span className="flex-1 truncate">
                            {lesson.title}
                          </span>
                          <span className="text-[10px] font-medium uppercase tracking-wider opacity-60">
                            {lesson.type}
                          </span>
                        </button>
                        {isActive && (
                          <div className="absolute inset-0 -z-10 rounded-md bg-primary/5" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8 relative flex flex-col items-center">
          <div className="max-w-6xl w-full flex-1">{renderActiveContent()}</div>

          <div className="mt-8 flex items-center justify-between w-full max-w-4xl border-t border-slate-100 pt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentLessonIndex === 0}
              className="rounded-lg h-10 px-4 text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => handleNext()}
              disabled={currentLessonIndex === flatLessons.length - 1}
              className="rounded-lg h-10 px-4 text-sm font-medium"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default LmsLearn;
