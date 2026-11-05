import { useState } from "react";
import {
  Award,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  CalendarDays,
  MessageCircle,
  BookOpen,
  GraduationCap,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  useEnrollments,
  useStudentDashboard,
  useStudentAnalytics,
  useMyTransactions,
} from "@/hooks/useAcademy";
import { useOrientationStatus } from "@/features/orientation/hooks/useOrientation";
import { useSeatTimeSummary } from "@/features/rubric/hooks/useSeatTime";
import { useUser } from "@/features/auth/hooks/useAuth";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const tabs = ["In Progress", "Completed"];

const LmsMyLearning = () => {
  const [activeTab, setActiveTab] = useState("In Progress");
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

  const primaryCohortId = Number(
    enrollments?.find((e: any) => e.cohortId || e.cohort?.id)?.cohortId ||
    enrollments?.find((e: any) => e.cohortId || e.cohort?.id)?.cohort?.id ||
    1
  );
  const { data: orientationStatus, isLoading: isOrientationLoading } =
    useOrientationStatus(primaryCohortId);
  const isOrientationComplete = Boolean(orientationStatus?.orientationCompleted);



  // Cross-check: courses with COMPLETED transactions count as enrolled even if enrollment is still PENDING
  const completedTxCourseIds = new Set(
    myTransactions
      ?.filter((tx: any) => tx.status === "COMPLETED")
      .map((tx: any) => (tx.metadata as any)?.courseId)
      .filter(Boolean) || [],
  );

  // Active/Enrolled courses
  const activeEnrollments =
    enrollments?.filter((enrollment: any) => {
      const courseId = Number(enrollment.courseId ?? enrollment.course?.id);
      const hasCompletedTx = completedTxCourseIds.has(courseId);
      return (
        enrollment.status === "ACTIVE" ||
        enrollment.status === "COMPLETED" ||
        hasCompletedTx
      );
    }) || [];

  // Map each enrolled course with backend dashboard progress as source of truth
  const enrolledCoursesProgress = activeEnrollments.map((enrollment: any) => {
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
      Math.max(backendCalcPercent, dashboardPercent, enrollmentPercent),
    );

    const isCompleted =
      enrollment.status === "COMPLETED" ||
      percentage >= 100 ||
      (totalLessons > 0 && completedLessons >= totalLessons);
    return {
      enrollment,
      courseId,
      pData,
      totalLessons,
      completedLessons,
      percentage,
      isCompleted,
    };
  });

  const completedCoursesList = enrolledCoursesProgress.filter(
    (c: any) => c.isCompleted,
  );
  const inProgressCoursesList = enrolledCoursesProgress.filter(
    (c: any) => !c.isCompleted || c.enrollment.status === "ACTIVE",
  );

  const tabCounts: Record<string, number> = {
    "In Progress": inProgressCoursesList.length,
    Completed: completedCoursesList.length,
  };

  const filteredCoursesProgress =
    activeTab === "Completed" ? completedCoursesList : inProgressCoursesList;

  const totalCompletedLessons = enrolledCoursesProgress.reduce(
    (sum: number, c: any) => sum + c.completedLessons,
    0,
  );
  const totalLessonsAll = enrolledCoursesProgress.reduce(
    (sum: number, c: any) => sum + c.totalLessons,
    0,
  );

  const coursesWithLessons = enrolledCoursesProgress.filter(
    (c: any) => c.totalLessons > 0,
  );
  const overallProgress =
    coursesWithLessons.length > 0
      ? Math.round(
          coursesWithLessons.reduce((sum: number, c: any) => sum + c.percentage, 0) /
            coursesWithLessons.length,
        )
      : 0;

  const totalCourses = activeEnrollments.length;
  const completedCourses = completedCoursesList.length;

  // Primary WABON CNA cohort enrollment for seat time
  const primaryEnrollment =
    enrollments?.find(
      (e: any) =>
        (e.cohortId || e.cohort?.id) &&
        (e.status === "ACTIVE" ||
          completedTxCourseIds.has(Number(e.courseId ?? e.course?.id))),
    ) ||
    enrollments?.find(
      (e: any) =>
        e.status === "ACTIVE" ||
        completedTxCourseIds.has(Number(e.courseId ?? e.course?.id)),
    ) ||
    enrollments?.[0];
  const primaryCourseId =
    primaryEnrollment?.courseId ?? primaryEnrollment?.course?.id;
  const { data: seatTimeSummary } = useSeatTimeSummary(primaryCourseId);

  const actualActiveSeconds =
    seatTimeSummary?.totalActiveTimeSeconds ??
    seatTimeSummary?.totalActiveSeconds ??
    0;
  const actualActiveMinutes =
    seatTimeSummary?.totalActiveTimeMinutes ??
    Math.round(actualActiveSeconds / 60);
  const theoryHoursCompleted = Number((actualActiveSeconds / 3600).toFixed(1));
  const theoryHoursPercentage = Math.min(
    100,
    Math.round((actualActiveSeconds / (50 * 3600)) * 100),
  );
  const remainingHours = Number(
    Math.max(0, 50 - actualActiveSeconds / 3600).toFixed(1),
  );

  // SVG circular progress
  const circleSize = 100;
  const strokeWidth = 8;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset =
    circumference - (overallProgress / 100) * circumference;

  return (
    <StudentLayout>
      <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6">
        {/* ── Hero Banner ── */}
        <div
          className="relative overflow-hidden rounded-2xl border border-blue-100/80 shadow-sm"
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

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 p-6 sm:p-8">
            {/* Left: text */}
            <div className="flex-1 space-y-3">
              <p className="text-[#5a6e8c] text-[11px] font-bold uppercase tracking-widest">
                Learning Journey
              </p>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#0b1a40] leading-tight">
                Keep going, {user?.firstname || "Bezawit"}!
              </h1>
              <p className="text-slate-600 text-sm max-w-md leading-relaxed">
                You're making great progress. Complete your current courses to
                unlock your certificate and next learning path.
              </p>
            </div>

            {/* Vertical Divider */}
            <div className="hidden lg:block w-[1px] h-20 bg-blue-100 shrink-0 mx-2" />

            {/* Right: circular progress + stats + 3D Graduation Cap illustration */}
            <div className="flex items-center gap-6 lg:gap-8 shrink-0">
              {/* Circular progress */}
              <div className="relative">
                <svg
                  width={circleSize}
                  height={circleSize}
                  className="transform -rotate-90"
                >
                  {/* Background circle */}
                  <circle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    fill="none"
                    stroke="#dbeafe"
                    strokeWidth={strokeWidth}
                  />
                  {/* Progress arc */}
                  <circle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[#0f172a] font-heading font-bold text-lg">
                    {overallProgress}%
                  </span>
                </div>
              </div>

              {/* Stats text */}
              <div className="space-y-2">
                <div>
                  <p className="text-[#0f172a] font-heading font-bold text-sm">
                    Overall Progress
                  </p>
                  <p className="text-slate-500 text-xs">
                    {completedCourses} of {totalCourses} courses completed
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32">
                    <Progress
                      value={overallProgress}
                      className="h-1.5 bg-[#e2e8f0]"
                    />
                  </div>
                  <span className="text-slate-500 text-xs font-semibold">
                    {overallProgress}%
                  </span>
                </div>
              </div>

              {/* 3D Graduation Cap + Stacked Books Illustration */}
              <div className="relative w-32 h-28 shrink-0 hidden md:flex items-center justify-center pointer-events-none">
                {/* Warm radial background glow */}
                <div
                  className="absolute inset-0 rounded-full blur-md transform scale-110"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(253,186,116,0.5) 0%, rgba(254,215,170,0.2) 50%, transparent 75%)",
                  }}
                />

                <svg
                  viewBox="0 0 160 140"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full relative z-10"
                >
                  {/* Bottom Book */}
                  <path
                    d="M20 100 L135 100 L145 112 L30 112 Z"
                    fill="#1e3a8a"
                  />
                  <path
                    d="M30 112 L145 112 L140 120 L25 120 Z"
                    fill="#2563eb"
                  />
                  <path d="M20 100 L25 120 L30 112 Z" fill="#1d4ed8" />
                  <rect
                    x="35"
                    y="112"
                    width="105"
                    height="4"
                    fill="#ffffff"
                    opacity="0.9"
                  />

                  {/* Middle Book */}
                  <path d="M25 85 L130 85 L140 96 L35 96 Z" fill="#2563eb" />
                  <path d="M35 96 L140 96 L135 104 L20 104 Z" fill="#3b82f6" />
                  <path d="M25 85 L20 104 L35 96 Z" fill="#1d4ed8" />
                  <rect
                    x="38"
                    y="96"
                    width="97"
                    height="4"
                    fill="#ffffff"
                    opacity="0.9"
                  />

                  {/* Top Book */}
                  <path d="M30 70 L125 70 L135 80 L40 80 Z" fill="#1d4ed8" />
                  <path d="M40 80 L135 80 L130 88 L15 88 Z" fill="#60a5fa" />
                  <rect
                    x="42"
                    y="80"
                    width="88"
                    height="4"
                    fill="#ffffff"
                    opacity="0.9"
                  />

                  {/* Graduation Cap Base */}
                  <path
                    d="M50 48 C50 42, 100 42, 100 48 L100 62 C100 68, 50 68, 50 62 Z"
                    fill="#0f172a"
                  />
                  <path
                    d="M52 50 C52 56, 98 56, 98 50 L98 60 C98 66, 52 66, 52 60 Z"
                    fill="#1e293b"
                  />

                  {/* Graduation Cap Diamond Top */}
                  <polygon points="75,20 135,38 75,56 15,38" fill="#0f172a" />
                  <polygon points="75,22 131,38 75,54 19,38" fill="#1e293b" />
                  <polygon points="75,25 125,38 75,51 25,38" fill="#334155" />

                  {/* Tassel Button */}
                  <circle cx="75" cy="38" r="4" fill="#ff5e14" />

                  {/* Tassel String */}
                  <path
                    d="M75 38 Q105 40 115 58 Q118 68 116 80"
                    stroke="#ff5e14"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <polygon points="113,80 119,80 116,92" fill="#ff5e14" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mandatory Orientation Prerequisite Banner ── */}
        {!isOrientationLoading && !isOrientationComplete && (
          <div className="rounded-2xl p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-white border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-800 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900">
                    Mandatory Student Orientation Required
                  </h4>
                  <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold">
                    WABON WAC 246-841A-440(2)
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Complete the orientation checklist, LMS tutorial, and netiquette pledge to unlock your lessons.
                  Orientation hours are non-credited (0 theory hours) per Req 11.
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-9 px-5 shrink-0 shadow-xs"
            >
              <Link to={`/orientation?cohortId=${primaryCohortId}`}>
                Complete Orientation <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        )}

        {/* ── WABON Mandated Theory Hours & Seat-Time Compliance Widget ── */}
        <div className="rounded-2xl p-6 bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Mandatory Theory Seat-Time Progress
                  </h3>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                    WAC 246-841A-440(6) Mandate
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Active engagement tracked with 60-second telemetry heartbeats. Auto-pauses during inactivity or tab switching.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-bold py-1 px-3",
                  theoryHoursCompleted >= 50
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                )}
              >
                {theoryHoursCompleted >= 50 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 inline" />
                    50h Mandate Met
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600 inline" />
                    {remainingHours} hrs remaining
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Metric Bar & Numerical Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Verified Active Theory: <strong className="text-blue-700 font-bold">{theoryHoursCompleted} hrs ({actualActiveMinutes}m)</strong> of <strong>50.0 hrs</strong> required
              </span>
              <span className="font-bold text-slate-900">
                {theoryHoursPercentage}%
              </span>
            </div>
            <Progress value={theoryHoursPercentage} className="h-2.5 bg-slate-100" />
          </div>

          {/* Sub-metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Seat-Time</span>
              <span className="font-bold text-slate-900 text-sm">{theoryHoursCompleted} hrs ({actualActiveMinutes}m)</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Required Hours</span>
              <span className="font-bold text-slate-900 text-sm">50.0 hrs</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telemetry Status</span>
              <span className="font-bold text-emerald-600 text-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Pulse (60s)
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auto-Pause Guard</span>
              <span className="font-semibold text-slate-600 text-sm">Enabled on Tab Switch</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {tab}
              <span
                className={`text-[11px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5 leading-none ${
                  activeTab === tab
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && filteredCoursesProgress.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4">
              {activeTab === "In Progress" &&
                "You don't have any active courses yet."}
              {activeTab === "Completed" &&
                "You haven't completed any courses yet."}
            </p>
            <Button asChild variant="outline">
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        )}

        {/* ── Course Cards ── */}
        {!isLoading &&
          filteredCoursesProgress &&
          filteredCoursesProgress.length > 0 && (
            <div className="space-y-4">
              {filteredCoursesProgress.map(
                (
                  {
                    enrollment,
                    courseId,
                    totalLessons,
                    completedLessons,
                    percentage,
                    isCompleted,
                  }: any,
                  index: number,
                ) => {
                  const isCnaCourse =
                    Boolean(enrollment.cohortId || enrollment.cohort?.id) ||
                    enrollment.course?.category?.toUpperCase() === "HEALTH" ||
                    enrollment.course?.title?.toLowerCase().includes("nursing") ||
                    enrollment.course?.title?.toLowerCase().includes("patient care");

                  return (
                    <div
                      key={enrollment.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Thumbnail */}
                        <div className="w-full sm:w-36 h-28 sm:h-24 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                          {enrollment.course?.thumbnail ? (
                            <img
                              src={enrollment.course.thumbnail}
                              alt={enrollment.course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-8 h-8 text-primary/40" />
                          )}
                        </div>

                        {/* Course info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            {/* Status badge */}
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                  : "bg-primary/10 text-primary border border-primary/20"
                              }`}
                            >
                              {isCompleted ? "Completed" : "In Progress"}
                            </span>

                            <h3 className="text-[15px] font-heading font-bold text-slate-900 leading-snug group-hover:text-primary transition-colors">
                              {enrollment.course?.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                Course {index + 1} of {filteredCoursesProgress.length}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span>
                                {percentage >= 100
                                  ? "All lessons completed · 100% complete"
                                  : totalLessons > 0
                                    ? `${completedLessons} of ${totalLessons} lessons · ${percentage}% complete`
                                    : `${percentage}% complete`}
                              </span>
                              {isCnaCourse && (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                    <Clock className="w-3 h-3 text-blue-600" />
                                    Theory: {theoryHoursCompleted}h / 50.0h
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Progress bar + View details */}
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-xs">
                                <Progress
                                  value={percentage}
                                  className="h-1.5 bg-slate-100"
                                />
                              </div>
                              <span className="text-xs text-slate-400 font-medium shrink-0">
                                {percentage}%
                              </span>
                            </div>

                            {isCompleted ? (
                              <button className="text-[13px] font-semibold text-primary hover:underline flex items-center gap-1 transition-colors">
                                View certificate{" "}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <Link
                                to={`/courses/${courseId}`}
                                className="text-[13px] font-semibold text-primary hover:underline flex items-center gap-1 transition-colors"
                              >
                                View details{" "}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Right actions */}
                        <div className="flex sm:flex-col items-center gap-2 sm:justify-center shrink-0">
                          {!isCompleted ? (
                            <Button
                              size="sm"
                              asChild
                              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 rounded-xl font-bold text-sm shadow-md shadow-primary/15 transition-all border-0"
                            >
                              <Link to={`/learn/${courseId}`}>
                                <PlayCircle className="w-4 h-4" />
                                Resume
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              asChild
                              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-xl font-bold text-sm border-0"
                            >
                              <Link to={`/learn/${courseId}`}>
                                <CheckCircle2 className="w-4 h-4" />
                                Review
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}

        {/* ── Quick Action Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <Link
            to="/schedules"
            className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">My Schedule</p>
              <p className="text-xs text-slate-500">
                View upcoming classes & events
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
          </Link>

          <Link
            to="/certifications"
            className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg hover:border-blue-200/60 transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Certifications</p>
              <p className="text-xs text-slate-500">Track your achievements</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors shrink-0" />
          </Link>

          <Link
            to="/chat"
            className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg hover:border-blue-200/60 transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
              <MessageCircle className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Need Help?</p>
              <p className="text-xs text-slate-500">Chat with support</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors shrink-0" />
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
};

export default LmsMyLearning;
