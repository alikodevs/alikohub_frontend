import { useState } from "react";
import {
  Award,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  CalendarDays,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  useEnrollments,
  useStudentDashboard,
  useStudentAnalytics,
  useMyTransactions,
} from "@/hooks/useAcademy";
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

  // Cross-check: courses with COMPLETED transactions count as enrolled even if enrollment is still PENDING
  const completedTxCourseIds = new Set(
    myTransactions
      ?.filter((tx: any) => tx.status === "COMPLETED")
      .map((tx: any) => (tx.metadata as any)?.courseId)
      .filter(Boolean) || [],
  );

  const filteredEnrollments = enrollments?.filter((enrollment) => {
    const hasCompletedTx = completedTxCourseIds.has(
      enrollment.courseId ?? enrollment.course?.id,
    );
    // Check dashboard percentage for 100% completion
    const pData =
      dashboard && Array.isArray(dashboard)
        ? dashboard.find((d: any) => d.courseId === Number(enrollment.courseId))
        : null;
    const isFullyComplete =
      enrollment.status === "COMPLETED" || pData?.percentage === 100;

    if (activeTab === "In Progress")
      return (
        !isFullyComplete && (enrollment.status === "ACTIVE" || hasCompletedTx)
      );
    if (activeTab === "Completed") return isFullyComplete;
    return false;
  });

  const totalLessonsAll =
    enrollments?.reduce((acc, e) => acc + (e.course?.lessonsCount || 0), 0) ||
    1;
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

  const totalCourses =
    enrollments?.filter(
      (e: any) =>
        e.status === "ACTIVE" ||
        e.status === "COMPLETED" ||
        completedTxCourseIds.has(e.courseId ?? e.course?.id),
    ).length || 0;

  const completedCourses =
    enrollments?.filter((e: any) => e.status === "COMPLETED").length || 0;

  // Count for tab badges
  const inProgressCount =
    enrollments?.filter((enrollment) => {
      const hasCompletedTx = completedTxCourseIds.has(
        enrollment.courseId ?? enrollment.course?.id,
      );
      const pData =
        dashboard && Array.isArray(dashboard)
          ? dashboard.find(
              (d: any) => d.courseId === Number(enrollment.courseId),
            )
          : null;
      const isFullyComplete =
        enrollment.status === "COMPLETED" || pData?.percentage === 100;
      return (
        !isFullyComplete && (enrollment.status === "ACTIVE" || hasCompletedTx)
      );
    }).length || 0;

  const completedCount =
    enrollments?.filter((enrollment) => {
      const pData =
        dashboard && Array.isArray(dashboard)
          ? dashboard.find(
              (d: any) => d.courseId === Number(enrollment.courseId),
            )
          : null;
      return enrollment.status === "COMPLETED" || pData?.percentage === 100;
    }).length || 0;

  const tabCounts: Record<string, number> = {
    "In Progress": inProgressCount,
    Completed: completedCount,
  };

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
        {!isLoading && filteredEnrollments?.length === 0 && (
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
          filteredEnrollments &&
          filteredEnrollments.length > 0 && (
            <div className="space-y-4">
              {filteredEnrollments.map((enrollment, index) => {
                const pData =
                  dashboard && Array.isArray(dashboard)
                    ? dashboard.find(
                        (d) => d.courseId === Number(enrollment.courseId),
                      )
                    : null;

                const currentProgress = Math.round(
                  pData?.percentage || enrollment.progress || 0,
                );
                const isCompleted = enrollment.status === "COMPLETED";

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

                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Course {index + 1} of {filteredEnrollments.length}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span>{currentProgress}% complete</span>
                          </div>
                        </div>

                        {/* Progress bar + View details */}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-xs">
                              <Progress
                                value={currentProgress}
                                className="h-1.5 bg-slate-100"
                              />
                            </div>
                            <span className="text-xs text-slate-400 font-medium shrink-0">
                              {currentProgress}%
                            </span>
                          </div>

                          {isCompleted ? (
                            <button className="text-[13px] font-semibold text-primary hover:underline flex items-center gap-1 transition-colors">
                              View certificate{" "}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <Link
                              to={`/courses/${enrollment.courseId}`}
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
                            <Link to={`/learn/${enrollment.courseId}`}>
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
                            <Link to={`/learn/${enrollment.courseId}`}>
                              <CheckCircle2 className="w-4 h-4" />
                              Review
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
