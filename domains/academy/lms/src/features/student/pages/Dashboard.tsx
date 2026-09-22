import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  Video,
  Radio,
  PlayCircle,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Megaphone,
  X,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/features/auth/hooks/useAuth";
import {
  useEnrollments,
  useStudentAnalytics,
  useStudentDashboard,
  useMyTransactions,
  useAnnouncements,
} from "@/hooks/useAcademy";
import { Link } from "react-router-dom";
import StudentLayout from "@/features/student/components/StudentLayout";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// ── Announcement helpers ──────────────────────────────────────────────────

const DISMISSED_KEY = "lms_dismissed_announcement_id";

const getDismissedId = (): string | null => localStorage.getItem(DISMISSED_KEY);

const setDismissedId = (id: string) => localStorage.setItem(DISMISSED_KEY, id);

// ── Announcement Banner ───────────────────────────────────────────────────

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
  const [isDismissed, setIsDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Get the latest announcement by createdAt descending
  const latest: AnnouncementItem | null = useMemo(() => {
    if (!data?.items || data.items.length === 0) return null;
    return [...data.items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  }, [data]);

  // On mount, check if this announcement was already dismissed
  useEffect(() => {
    if (latest && getDismissedId() === latest.id) {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }
  }, [latest]);

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (latest) {
        setDismissedId(latest.id);
        setIsDismissed(true);
      }
    },
    [latest],
  );

  // Don't render anything while loading, on error, or when empty/dismissed
  if (isLoading || isError || !latest || isDismissed) return null;

  const publishedDate = format(new Date(latest.createdAt), "MMM d, yyyy");
  const timeAgo = formatDistanceToNow(new Date(latest.createdAt), {
    addSuffix: true,
  });

  return (
    <>
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="group relative bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/60 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:border-amber-300/60 transition-all"
        onClick={() => setShowModal(true)}
        id="latest-announcement-banner"
      >
        {/* Decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />

        <div className="p-4 sm:p-5 flex items-start gap-3.5">
          {/* Icon */}
          <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/40 mt-0.5">
            <Megaphone className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-2.5 h-2.5" />
                New
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                {timeAgo}
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-amber-800 transition-colors">
              {latest.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {latest.content}
            </p>
            <button
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
            >
              Read more <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors mt-0.5"
            title="Dismiss"
            id="dismiss-announcement-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
              onClick={() => setShowModal(false)}
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white rounded-2xl shadow-2xl border border-amber-100/60 max-w-lg w-full max-h-[85vh] overflow-hidden"
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100/60 p-5 flex items-start gap-3.5 z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/40 shrink-0">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-heading font-bold text-slate-900 leading-snug">
                    {latest.title}
                  </h2>
                  <div className="flex items-center gap-2.5 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {publishedDate}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>{timeAgo}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {latest.content}
                </p>
              </div>

              {/* Modal footer */}
              <div className="border-t border-slate-100 p-4 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-xs font-semibold"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(e);
                    setShowModal(false);
                  }}
                  className="text-xs font-semibold gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                  id="dismiss-and-close-btn"
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

// ── Dashboard ─────────────────────────────────────────────────────────────

const getGreeting = () => {
  // Use Africa/Nairobi timezone (UTC+3, same as Ethiopian time)
  const nairobiHour = new Date().toLocaleString("en-US", {
    timeZone: "Africa/Nairobi",
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(nairobiHour, 10);
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const StudentDashboard = () => {
  const { data: user } = useUser();
  const { data: enrollments, isLoading: isEnrollmentsLoading } =
    useEnrollments();
  const { data: myTransactions } = useMyTransactions();
  const { data: analytics, isLoading: isAnalyticsLoading } =
    useStudentAnalytics();
  const { data: dashboard, isLoading: isDashboardLoading } =
    useStudentDashboard();

  const isLoading =
    isEnrollmentsLoading || isAnalyticsLoading || isDashboardLoading;

  // Cross-check: courses with COMPLETED transactions count as enrolled even if enrollment is still PENDING
  const completedTxCourseIds = new Set(
    myTransactions
      ?.filter((tx: any) => tx.status === "COMPLETED")
      .map((tx: any) => (tx.metadata as any)?.courseId)
      .filter(Boolean) || [],
  );

  // Only show enrollments that are ACTIVE, COMPLETED, or have a completed transaction
  const activeEnrollments = enrollments?.filter(
    (e: any) =>
      e.status === "ACTIVE" ||
      e.status === "COMPLETED" ||
      completedTxCourseIds.has(e.courseId ?? e.course?.id),
  );

  const totalLessonsAll =
    activeEnrollments?.reduce(
      (acc, e) => acc + (e.course?.lessonsCount || 0),
      0,
    ) || 1;
  const calculatedProgress = analytics
    ? Math.min(
        Math.round((analytics.lessonsViewed / totalLessonsAll) * 100),
        100,
      )
    : 0;

  let sumPercentage = 0;
  if (dashboard && Array.isArray(dashboard) && dashboard.length > 0) {
    const validProgresses = dashboard.filter(
      (d: any) => typeof d.percentage === "number",
    );
    if (validProgresses.length > 0) {
      sumPercentage = validProgresses.reduce(
        (sum: number, d: any) => sum + d.percentage,
        0,
      );
      sumPercentage = Math.round(sumPercentage / validProgresses.length);
    }
  }

  const overallProgress =
    dashboard && Array.isArray(dashboard) && dashboard.length > 0
      ? sumPercentage
      : calculatedProgress || 0;

  const completedCount =
    activeEnrollments?.filter((e) => e.status === "COMPLETED").length || 0;

  const instructorStatus = user?.instructorStatus?.toUpperCase();
  const isInstructor =
    user?.globalRole === "ADMIN" ||
    user?.academyUser?.role === "INSTRUCTOR" ||
    instructorStatus === "ACCEPTED" ||
    instructorStatus === "APPROVED" ||
    instructorStatus === "ACTIVE" ||
    user?.roleStatus?.instructor === "ACTIVE" ||
    user?.roleStatus?.instructor?.toUpperCase() === "ACTIVE";

  const isPending =
    user?.hasTeacherApplication ||
    instructorStatus === "PENDING" ||
    user?.roleStatus?.instructor === "pending" ||
    user?.roleStatus?.instructor?.toUpperCase() === "PENDING";

  return (
    <StudentLayout>
      <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6">
        {/* ── Hero / Welcome Banner ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-blue-100/80 shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, #eef5ff 0%, #f4f8ff 55%, #fff7ed 100%)",
          }}
        >
          {/* Soft warm glow top-right */}
          <div
            className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at top right, rgba(254,215,170,0.45) 0%, rgba(253,230,138,0.2) 35%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <p className="text-[#5a6e8c] text-[11px] font-bold uppercase tracking-widest">
                Welcome back
              </p>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#0b1a40] leading-tight">
                {getGreeting()}, {user?.firstname || "Learner"} 👋
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                Continue learning with{" "}
                <span className="font-semibold text-primary">Aliko Academy</span>
              </p>

              {/* Progress bar */}
              <div className="max-w-xs pt-1">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-medium">
                    Overall progress
                  </span>
                  <span className="font-bold text-primary">
                    {overallProgress}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-primary"
                    style={{
                      width: `${overallProgress}%`,
                    }}
                  />
                </div>
                <p className="text-slate-600 text-xs font-medium mt-2">
                  {activeEnrollments?.length || 0} active enrollments ·{" "}
                  {completedCount} completed
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                asChild
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-full px-6 py-2.5 shadow-md shadow-primary/20 border-0 transition-all"
              >
                <Link to="/learning">
                  <PlayCircle className="w-4 h-4" />
                  Continue learning
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="gap-2 bg-white/90 hover:bg-white text-slate-800 hover:text-slate-900 border border-slate-300/80 font-semibold text-sm rounded-full px-5 py-2.5 shadow-sm transition-all"
              >
                <Link to="/courses">
                  Browse new courses <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Announcement Banner ── */}
        <AnnouncementBanner />

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Active Courses ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-heading font-bold text-foreground">
                My active courses
              </h2>
              <Link
                to="/learning"
                className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))
              ) : activeEnrollments?.length === 0 ? (
                <div className="bg-card rounded-xl border p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    You're not enrolled in any courses yet.
                  </p>
                  <Button asChild size="sm">
                    <Link to="/courses">Browse Courses</Link>
                  </Button>
                </div>
              ) : (
                activeEnrollments?.map((enrollment) => {
                  const pData =
                    dashboard && Array.isArray(dashboard)
                      ? dashboard.find(
                          (d: any) =>
                            d.courseId === Number(enrollment.courseId),
                        )
                      : null;
                  const currentProgress = Math.round(
                    pData?.percentage || enrollment.progress || 0,
                  );

                  return (
                    <div
                      key={enrollment.id}
                      className="bg-card rounded-xl border hover:shadow-md transition-shadow duration-200 p-4 flex gap-4"
                    >
                      {/* Course thumbnail placeholder */}
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0 border border-border overflow-hidden">
                        {enrollment.course?.thumbnail ? (
                          <img
                            src={enrollment.course.thumbnail}
                            alt={enrollment.course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="w-6 h-6 text-indigo-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Category badge */}
                        {enrollment.course?.category && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                              {enrollment.course.category}
                            </span>
                          </div>
                        )}

                        <h3 className="text-sm font-heading font-semibold text-foreground leading-snug truncate">
                          {enrollment.course?.title}
                        </h3>

                        {/* Progress */}
                        <div className="mt-2 max-w-xs">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-semibold text-foreground">
                              {currentProgress}%
                            </span>
                          </div>
                          <Progress value={currentProgress} className="h-1.5" />
                        </div>
                      </div>

                      <Button
                        size="sm"
                        asChild
                        className="gap-1 self-center shrink-0 text-xs"
                      >
                        <Link to={`/learn/${enrollment.courseId}`}>
                          Continue <ArrowRight className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: Summary & CTA ── */}
          <div className="space-y-4">
            {/* Learning Summary */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Learning summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: BookOpen,
                    label: "Courses active",
                    value: activeEnrollments?.length || 0,
                    color: "text-indigo-600",
                    bg: "bg-indigo-50",
                  },
                  {
                    icon: Award,
                    label: "Courses done",
                    value: analytics?.programsCompleted || 0,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                  },
                  {
                    icon: Clock,
                    label: "Lessons viewed",
                    value: analytics?.lessonsViewed || 0,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                  },
                  {
                    icon: TrendingUp,
                    label: "Quizzes done",
                    value: analytics?.quizzesCompleted || 0,
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`flex flex-col items-center text-center p-3 rounded-xl ${stat.bg}`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color} mb-1.5`} />
                    <p className="text-xl font-heading font-bold text-foreground leading-none">
                      {isLoading ? "—" : stat.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Progress card */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3 text-sm">
                Overall Progress
              </h3>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">Completion rate</span>
                <span className="font-bold text-foreground">
                  {overallProgress}%
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {activeEnrollments?.length || 0} enrollments · {completedCount}{" "}
                completed
              </p>
            </div>

            {/* Instructor CTA */}
            {!isInstructor && (
              <div
                className="rounded-xl p-5 text-white text-center"
                style={{
                  backgroundColor: "#081830",
                }}
              >
                <Sparkles className="w-7 h-7 text-white/80 mx-auto mb-3" />
                <h3 className="text-sm font-heading font-bold mb-1.5">
                  {isPending ? "Application Pending" : "Share your Knowledge"}
                </h3>
                <p className="text-white/60 text-xs mb-4 leading-relaxed">
                  {isPending
                    ? "Our team is reviewing your instructor profile. We'll be in touch soon!"
                    : "Become an instructor and share your expertise with thousands of students globally."}
                </p>
                <Button
                  asChild
                  className="w-full bg-white text-slate-900 hover:bg-white/90 font-bold text-xs"
                  size="sm"
                >
                  <Link to="/instructor/apply">
                    {isPending ? "View Application" : "Apply as Instructor"}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;

