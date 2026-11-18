import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  ChevronRight,
  Sparkles,
  Play,
  X,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/features/auth/hooks/useAuth";
import {
  useEnrollments,
  useStudentAnalytics,
  useStudentDashboard,
  useMyTransactions,
  useAnnouncements,
} from "@/hooks/useAcademy";
import StudentLayout from "@/features/student/components/StudentLayout";
import CourseThumbnail, { detectDiscipline } from "@/components/shared/CourseThumbnail";
import ProgressRing from "@/components/shared/ProgressRing";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// ── Announcement helpers ──────────────────────────────────────────────────

const DISMISSED_KEY = "lms_dismissed_announcement_id";
const getDismissedId = (): string | null => localStorage.getItem(DISMISSED_KEY);
const setDismissedId = (id: string) => localStorage.setItem(DISMISSED_KEY, id);

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const AnnouncementBanner = () => {
  const { data, isLoading, isError } = useAnnouncements({
    page: 1,
    pageSize: 20,
  });
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);

  const latest: AnnouncementItem | null = useMemo(() => {
    if (!data?.items || data.items.length === 0) return null;
    return [...data.items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [data]);

  React.useEffect(() => {
    if (latest && getDismissedId() === latest.id) {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }
  }, [latest]);

  const handleDismiss = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (latest) {
        setDismissedId(latest.id);
        setIsDismissed(true);
      }
    },
    [latest]
  );

  if (isLoading || isError || !latest || isDismissed) return null;

  const publishedDate = format(new Date(latest.createdAt), "MMM d, yyyy");
  const timeAgo = formatDistanceToNow(new Date(latest.createdAt), {
    addSuffix: true,
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative bg-[#F4F8FB] border border-[#0A65A0]/20 rounded-2xl overflow-hidden cursor-pointer hover:shadow-sm transition-all"
        onClick={() => setShowModal(true)}
      >
        <div className="p-3.5 sm:p-4 flex items-start gap-3.5">
          <div className="shrink-0 w-8 h-8 rounded-xl bg-[#0A65A0]/10 text-[#0A65A0] flex items-center justify-center mt-0.5">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EAF3F9] text-[#0A65A0] rounded-full text-[10px] font-medium uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> Announcement
              </span>
              <span className="text-[11px] text-slate-500 font-normal">{timeAgo}</span>
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug group-hover:text-[#0A65A0] transition-colors">
              {latest.title}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-1 leading-relaxed">
              {latest.content}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[85vh] overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-start gap-3 bg-slate-50">
                <div className="w-8 h-8 rounded-xl bg-[#0A65A0]/10 text-[#0A65A0] flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug font-heading">
                    {latest.title}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">{publishedDate} · {timeAgo}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh] text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {latest.content}
              </div>
              <div className="border-t border-slate-100 p-3 flex justify-end gap-2 bg-slate-50">
                <Button
                  size="sm"
                  onClick={(e) => {
                    handleDismiss(e);
                    setShowModal(false);
                  }}
                  className="bg-[#0A65A0] hover:bg-[#084B78] text-white text-xs font-medium h-8"
                >
                  Got it
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// ── Medical Stethoscope SVG matching V2 ─────────────────────────────────────

const StethoscopeSvg = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

// ── Time & Greeting Helper ────────────────────────────────────────────────

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const StudentDashboard: React.FC = () => {
  const { data: user } = useUser();
  const { data: enrollments, isLoading: isEnrollmentsLoading } = useEnrollments();
  const { data: myTransactions } = useMyTransactions();
  const { data: analytics, isLoading: isAnalyticsLoading } = useStudentAnalytics();
  const { data: dashboard, isLoading: isDashboardLoading } = useStudentDashboard();

  const isLoading = isEnrollmentsLoading || isAnalyticsLoading || isDashboardLoading;

  const completedTxCourseIds = new Set(
    myTransactions
      ?.filter((tx: any) => tx.status === "COMPLETED")
      .map((tx: any) => (tx.metadata as any)?.courseId)
      .filter(Boolean) || []
  );

  const activeEnrollments = useMemo(() => {
    return (
      enrollments?.filter((e: any) => {
        const cId = Number(e.courseId ?? e.course?.id);
        return (
          e.status === "ACTIVE" ||
          e.status === "COMPLETED" ||
          completedTxCourseIds.has(cId)
        );
      }) || []
    );
  }, [enrollments, myTransactions]);

  const enrolledCoursesProgress = useMemo(() => {
    return activeEnrollments.map((enrollment: any) => {
      const courseId = Number(enrollment.courseId ?? enrollment.course?.id);
      const pData =
        dashboard && Array.isArray(dashboard)
          ? dashboard.find((d: any) => Number(d.courseId) === courseId)
          : null;
      const totalLessons =
        pData?.totalLessons ?? (enrollment.course?.lessonsCount || 0);
      const completedLessons = pData?.completed ?? 0;

      const backendCalcPercent =
        pData && pData.totalLessons > 0
          ? Math.round((pData.completed / pData.totalLessons) * 100)
          : 0;
      const dashboardPercent = Math.round(pData?.percentage ?? 0);
      const enrollmentPercent = Math.round(enrollment?.progress ?? 0);

      const percentage = Math.min(
        100,
        Math.max(backendCalcPercent, dashboardPercent, enrollmentPercent)
      );

      const isCompleted =
        enrollment.status === "COMPLETED" ||
        percentage >= 100 ||
        (totalLessons > 0 && completedLessons >= totalLessons);

      let nextLessonTitle = "Chapter 2 · Infection Control";
      if (completedLessons > 1) {
        nextLessonTitle = `Chapter ${completedLessons + 1} · Vital Signs`;
      } else if (completedLessons === 0) {
        nextLessonTitle = "Chapter 1 · Role of the Nursing Assistant";
      }
      if (pData?.nextLessonTitle) {
        nextLessonTitle = pData.nextLessonTitle;
      }

      return {
        enrollment,
        courseId,
        title: enrollment.course?.title || "Certified Nursing Assistant (CNA)",
        category: enrollment.course?.category || "Health",
        totalLessons: totalLessons > 0 ? totalLessons : 15,
        completedLessons,
        percentage,
        isCompleted,
        nextLessonTitle,
        lessonSubtitle: `Lesson ${completedLessons + 1} of ${totalLessons > 0 ? totalLessons : 15}`,
      };
    });
  }, [activeEnrollments, dashboard]);

  const displayCourses = useMemo(() => {
    if (enrolledCoursesProgress.length > 0) {
      return enrolledCoursesProgress;
    }
    return [
      {
        enrollment: null,
        courseId: 1,
        title: "Certified Nursing Assistant (CNA)",
        category: "Health",
        totalLessons: 15,
        completedLessons: 2,
        percentage: 13,
        isCompleted: false,
        nextLessonTitle: "Chapter 2 · Infection Control",
        lessonSubtitle: "Lesson 3 of 15",
      },
      {
        enrollment: null,
        courseId: 2,
        title: "AutoCAD Civil 3D",
        category: "STEM",
        totalLessons: 5,
        completedLessons: 0,
        percentage: 0,
        isCompleted: false,
        nextLessonTitle: "Lesson 1 · Interface & Workspaces",
        lessonSubtitle: "Lesson 1 of 5",
      },
      {
        enrollment: null,
        courseId: 3,
        title: "Mastering Nutrition and Hydration",
        category: "Health",
        totalLessons: 1,
        completedLessons: 0,
        percentage: 0,
        isCompleted: false,
        nextLessonTitle: "Unit 1 · Foundations of Nutrition",
        lessonSubtitle: "Lesson 1 of 1",
      },
    ];
  }, [enrolledCoursesProgress]);

  const primaryCourse = displayCourses[0];

  const theoryPercent = primaryCourse?.percentage ?? 13;
  const theoryDone = primaryCourse?.completedLessons ?? 2;
  const theoryTotal = primaryCourse?.totalLessons ?? 15;

  const skillsPassed = 1;
  const skillsTotal = 6;
  const skillsPercent = Math.round((skillsPassed / skillsTotal) * 100);

  const clinicalHours = 0;
  const clinicalRequired = 40;
  const clinicalPercent = Math.round((clinicalHours / clinicalRequired) * 100);

  const studyDays = [
    { day: "M", minutes: 23, heightPct: 33 },
    { day: "T", minutes: 46, heightPct: 66 },
    { day: "W", minutes: 35, heightPct: 50 },
    { day: "T", minutes: 69, heightPct: 100 },
    { day: "F", minutes: 18, heightPct: 26 },
    { day: "S", minutes: 0, heightPct: 4 },
    { day: "S", minutes: 30, heightPct: 43 },
  ];

  const todayFormatted = format(new Date(), "EEEE, MMMM d");

  return (
    <StudentLayout>
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 bg-[#F7F9FC]">
        {/* ── Greeting & Top Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-semibold text-slate-900 leading-tight">
              {getGreeting()}, {user?.firstname || "Boni"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{todayFormatted}</span>
              <span className="text-slate-300">·</span>
              <span>CNA Cohort 12</span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-[#D77510]">
                🔥 4-day learning streak
              </span>
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs h-9 px-3.5 gap-2 self-start sm:self-auto shadow-sm"
          >
            <Link to="/courses">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              Browse courses
            </Link>
          </Button>
        </div>

        {/* ── Optional Announcement Banner ── */}
        <AnnouncementBanner />

        {/* ── COMPACT TOP HERO CONTAINER: V2 Up Next Hero (Navy #0F2444) + Your Progress (White) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* 1. UP NEXT HERO CARD (Slim & Compact) */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#0F2444] rounded-2xl p-4 sm:p-5 text-white shadow-sm relative overflow-hidden">
            <div className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-300 uppercase mb-2.5">
              UP NEXT · 12 MIN
            </div>

            <div className="flex items-start gap-3.5 sm:gap-4">
              {/* Thumbnail with exact stethoscope icon */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#F43F5E] to-[#E11D48] flex items-center justify-center shrink-0 shadow-md text-white">
                <StethoscopeSvg className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[2.2]" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-heading font-semibold text-white leading-tight truncate">
                  {primaryCourse.nextLessonTitle}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 truncate">
                  {primaryCourse.title} · {primaryCourse.lessonSubtitle}
                </p>

                <div className="flex items-center gap-2.5 mt-2 max-w-xs">
                  <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#38BDF8] transition-all duration-500"
                      style={{ width: `${primaryCourse.percentage}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-white font-medium shrink-0">
                    {primaryCourse.percentage}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-3.5 pt-1">
              <Button
                asChild
                className="bg-[#D77510] hover:bg-[#AC5B0B] text-white font-medium text-xs rounded-xl px-4 h-8 gap-1.5 shadow-sm border-0 transition-colors"
              >
                <Link to={`/learn/${primaryCourse.courseId}`}>
                  <Play className="w-3 h-3 fill-current" />
                  Resume lesson
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white font-medium text-xs rounded-xl px-3.5 h-8 transition-colors"
              >
                <Link to={`/learn/${primaryCourse.courseId}`}>
                  Course outline
                </Link>
              </Button>
            </div>
          </div>

          {/* 2. YOUR PROGRESS TRIPLE RING CARD (Compact height matching Up Next) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-heading font-semibold text-slate-900 leading-tight">
                    Your progress
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    CNA program completion
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 items-center justify-items-center">
                <ProgressRing
                  percentage={theoryPercent}
                  value={`${theoryPercent}%`}
                  label="Theory"
                  sublabel={`${theoryDone}/${theoryTotal} lessons`}
                  color="#0A65A0"
                  size={58}
                  strokeWidth={5}
                />
                <ProgressRing
                  percentage={skillsPercent}
                  value={`${skillsPercent}%`}
                  label="Skills"
                  sublabel={`${skillsPassed}/${skillsTotal} passed`}
                  color="#10B981"
                  size={58}
                  strokeWidth={5}
                />
                <ProgressRing
                  percentage={clinicalPercent}
                  value={`${clinicalPercent}%`}
                  label="Clinical"
                  sublabel={`${clinicalHours}/${clinicalRequired} hrs`}
                  color="#8B5CF6"
                  size={58}
                  strokeWidth={5}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── MAIN LOWER SECTION: My Active Courses (V1 layout) + Right Sidebar (Study Activity + Share) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ── LEFT: My Active Courses (Outer Container Card with Inner Course Cards per V1) ── */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
            {/* Header inside the container */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-heading font-semibold text-slate-900">
                  My active courses
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick up where you left off
                </p>
              </div>
              <Link
                to="/learning"
                className="text-xs font-medium text-[#0A65A0] hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* List of inner course containers */}
            <div className="space-y-3 pt-1">
              {isLoading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))
              ) : (
                displayCourses.map((course) => {
                  const discipline = detectDiscipline(course.category, course.title);
                  const isStarted = course.percentage > 0;
                  const categoryBadgeStyle =
                    discipline === "healthcare"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : discipline === "stem"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200";

                  return (
                    <div
                      key={course.courseId}
                      className="bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all p-3.5 sm:p-4 flex items-center justify-between gap-3.5"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <CourseThumbnail
                          category={course.category}
                          title={course.title}
                          size="md"
                          rounded="xl"
                          className="shadow-sm shrink-0"
                        />

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${categoryBadgeStyle}`}
                            >
                              {course.category}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {course.completedLessons} of {course.totalLessons} lessons
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-heading font-semibold text-slate-900 truncate">
                            {course.title}
                          </h4>

                          <p className="text-[11px] text-slate-500 truncate">
                            Next: {course.nextLessonTitle}
                          </p>

                          <div className="flex items-center gap-2 pt-0.5 max-w-xs">
                            <div className="w-20 sm:w-28 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#0A65A0]"
                                style={{ width: `${course.percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {course.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        asChild
                        className="bg-[#D77510] hover:bg-[#AC5B0B] text-white font-medium text-xs rounded-xl px-3.5 h-8 sm:h-9 shrink-0 gap-1.5 shadow-sm border-0 transition-colors"
                      >
                        <Link to={`/learn/${course.courseId}`}>
                          <Play className="w-3 h-3 fill-current" />
                          {isStarted ? "Resume" : "Start"}
                        </Link>
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: Study Activity Chart & Share Knowledge (V1 Layout) ── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            {/* Study Activity Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-heading font-semibold text-slate-900">
                    Study activity
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Minutes learned · this week
                  </p>
                </div>
                <span className="text-base font-heading font-semibold text-slate-900">
                  {analytics?.totalHours ? `${analytics.totalHours}h` : "3h 25m"}
                </span>
              </div>

              <div className="pt-2 pb-1">
                <div className="h-24 flex items-end justify-between gap-1.5 border-b border-slate-100 pb-2 px-1">
                  {studyDays.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        className="w-full max-w-[18px] rounded-t-md bg-[#D77510] transition-all duration-500 hover:opacity-90"
                        style={{ height: `${item.heightPct}%` }}
                        title={`${item.day}: ${item.minutes} minutes`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-medium text-slate-400 pt-1.5 px-1">
                  {studyDays.map((item, idx) => (
                    <span key={idx} className="flex-1 text-center">
                      {item.day}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Share Your Knowledge Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                    Share your knowledge
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Become an instructor and teach students globally.
                  </p>
                </div>
              </div>

              <Button
                asChild
                size="sm"
                className="shrink-0 text-xs font-medium bg-[#0A65A0] hover:bg-[#084B78] text-white rounded-xl h-8 px-3 border-0"
              >
                <Link to="/instructor/apply">Apply</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
