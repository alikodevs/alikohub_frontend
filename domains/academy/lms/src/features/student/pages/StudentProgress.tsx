import { useMemo, useState } from "react";
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
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  useEnrollments,
  useStudentDashboard,
  useMyTransactions,
} from "@/hooks/useAcademy";
import { useOrientationStatus } from "@/features/orientation/hooks/useOrientation";
import { useUser } from "@/features/auth/hooks/useAuth";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const tabs = ["In Progress", "Completed"] as const;

const LmsMyLearning = () => {
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>("In Progress");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: user } = useUser();
  const { data: enrollments, isLoading: isEnrollmentsLoading } =
    useEnrollments();
  const { data: myTransactions } = useMyTransactions();
  const { data: dashboard, isLoading: isDashboardLoading } =
    useStudentDashboard();

  const isLoading = isEnrollmentsLoading || isDashboardLoading;

  const primaryCohortId = Number(
    enrollments?.find((e: any) => e.cohortId || e.cohort?.id)?.cohortId ||
      enrollments?.find((e: any) => e.cohortId || e.cohort?.id)?.cohort?.id ||
      1,
  );
  const { data: orientationStatus, isLoading: isOrientationLoading } =
    useOrientationStatus(primaryCohortId);
  const isOrientationComplete = Boolean(
    orientationStatus?.orientationCompleted,
  );

  // Courses with COMPLETED transactions count as enrolled even while status catches up
  const completedTxCourseIds = new Set(
    myTransactions
      ?.filter((tx: any) => tx.status === "COMPLETED")
      .map((tx: any) => (tx.metadata as any)?.courseId)
      .filter(Boolean) || [],
  );

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

  const tabCounts: Record<(typeof tabs)[number], number> = {
    "In Progress": inProgressCoursesList.length,
    Completed: completedCoursesList.length,
  };

  const tabCourses =
    activeTab === "Completed" ? completedCoursesList : inProgressCoursesList;

  const filteredCoursesProgress = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tabCourses;
    return tabCourses.filter((c: any) =>
      (c.enrollment?.course?.title || "").toLowerCase().includes(q),
    );
  }, [tabCourses, searchQuery]);

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
          coursesWithLessons.reduce(
            (sum: number, c: any) => sum + c.percentage,
            0,
          ) / coursesWithLessons.length,
        )
      : 0;

  const totalCourses = activeEnrollments.length;
  const completedCourses = completedCoursesList.length;
  const notStartedCount = inProgressCoursesList.filter(
    (c: any) => c.percentage === 0,
  ).length;
  const resumeTarget =
    inProgressCoursesList[0] ?? enrolledCoursesProgress[0] ?? null;

  return (
    <StudentLayout>
      <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-5">
        {/* ── Page Header (matches inspo .head) ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-[#0f1b2d] tracking-tight">
              My Learning
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Keep going, {user?.firstname || "Student"}. Complete your current
              courses to unlock your certificate and next learning path.
            </p>
          </div>
          {resumeTarget ? (
            <Button
              asChild
              className="gap-2 bg-[#2b5f9e] hover:bg-[#234e83] text-white font-semibold h-9 px-4 rounded-lg border-0 shrink-0"
            >
              <Link to={`/learn/${resumeTarget.courseId}`}>
                <PlayCircle className="w-4 h-4" />
                Resume last course
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              className="gap-2 bg-[#2b5f9e] hover:bg-[#234e83] text-white font-semibold h-9 px-4 rounded-lg border-0 shrink-0"
            >
              <Link to="/courses">
                <BookOpen className="w-4 h-4" />
                Explore courses
              </Link>
            </Button>
          )}
        </div>

        {/* ── 4-Card KPI Strip (matches inspo .kpis) ── */}
        <section
          aria-label="Summary"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-white border border-[#e5e9f0] rounded-xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-[13px]">
              <span className="w-7 h-7 rounded-lg bg-[#e8f0fa] text-[#2b5f9e] flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </span>
              Overall progress
            </div>
            <div className="text-[28px] font-heading font-extrabold text-[#0f1b2d] leading-tight tracking-tight">
              {isLoading ? "—" : `${overallProgress}%`}
            </div>
            <div className="h-1.5 rounded-full bg-[#e5e9f0] overflow-hidden mt-1">
              <div
                className="h-full rounded-full bg-[#2b5f9e] transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-[#e5e9f0] rounded-xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-[13px]">
              <span className="w-7 h-7 rounded-lg bg-[#e8f0fa] text-[#2b5f9e] flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </span>
              In progress
            </div>
            <div className="text-[28px] font-heading font-extrabold text-[#0f1b2d] leading-tight tracking-tight">
              {isLoading ? "—" : inProgressCoursesList.length}
              <small className="text-sm font-semibold text-slate-500 ml-1.5">
                courses
              </small>
            </div>
            <p className="text-xs text-slate-500">
              {notStartedCount > 0
                ? `${notStartedCount} not started yet`
                : "Active enrollment"}
            </p>
          </div>

          <div className="bg-white border border-[#e5e9f0] rounded-xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-[13px]">
              <span className="w-7 h-7 rounded-lg bg-[#e3f5ea] text-[#15803d] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              Completed
            </div>
            <div className="text-[28px] font-heading font-extrabold text-[#0f1b2d] leading-tight tracking-tight">
              {isLoading ? "—" : completedCourses}
              <small className="text-sm font-semibold text-slate-500 ml-1.5">
                of {totalCourses}
              </small>
            </div>
            <p className="text-xs text-slate-500">
              Certificate unlocked on completion
            </p>
          </div>

          <div className="bg-white border border-[#e5e9f0] rounded-xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-[13px]">
              <span className="w-7 h-7 rounded-lg bg-[#fff1e6] text-[#f26b21] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </span>
              Lessons done
            </div>
            <div className="text-[28px] font-heading font-extrabold text-[#0f1b2d] leading-tight tracking-tight">
              {isLoading ? "—" : totalCompletedLessons}
              <small className="text-sm font-semibold text-slate-500 ml-1.5">
                of {totalLessonsAll}
              </small>
            </div>
            <p className="text-xs text-slate-500">Across active courses</p>
          </div>
        </section>

        {/* ── Mandatory Orientation Prerequisite Banner ── */}
        {!isOrientationLoading &&
          activeEnrollments.length > 0 &&
          !isOrientationComplete && (
            <div className="rounded-xl p-4 bg-[#fff8f3] border border-[#f26b21]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#fff1e6] border border-[#f26b21]/25 text-[#c2540a] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0f1b2d]">
                    Mandatory Student Orientation Required
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Complete the orientation checklist, LMS tutorial, and
                    netiquette pledge to unlock your lessons. Orientation is a
                    non-credited onboarding step.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="bg-white border-[#e5e9f0] text-[#0f1b2d] hover:bg-[#f8fafc] font-semibold text-xs rounded-lg h-9 px-4 shrink-0"
                >
                  <Link to={`/admissions?cohortId=${primaryCohortId}`}>
                    Admissions Clearance
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-[#f26b21] hover:bg-[#d95812] text-white font-semibold text-xs rounded-lg h-9 px-5 shrink-0 border-0"
                >
                  <Link to={`/orientation?cohortId=${primaryCohortId}`}>
                    Complete Orientation{" "}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

        {/* ── Courses Table Panel (matches inspo .card.panel) ── */}
        <section className="bg-white border border-[#e5e9f0] rounded-xl overflow-hidden">
          {/* Toolbar: Tabs + Inline Filter Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 border-b border-[#e5e9f0]">
            <div className="flex items-center gap-1" role="tablist">
              {tabs.map((tab) => {
                const selected = activeTab === tab;
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tab)}
                    className={`inline-flex items-center gap-2 px-3 py-3.5 text-sm font-bold border-b-2 transition-colors -mb-px ${
                      selected
                        ? "border-[#2b5f9e] text-[#2b5f9e]"
                        : "border-transparent text-slate-500 hover:text-[#0f1b2d]"
                    }`}
                  >
                    {tab}
                    <span
                      className={`text-xs font-bold min-w-[22px] h-5 flex items-center justify-center rounded-full px-2 leading-none ${
                        selected
                          ? "bg-[#e8f0fa] text-[#2b5f9e]"
                          : "bg-[#f8fafc] border border-[#e5e9f0] text-slate-500"
                      }`}
                    >
                      {tabCounts[tab]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64 py-2 sm:py-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter courses..."
                aria-label="Filter courses"
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#f8fafc] border border-[#e5e9f0] text-xs text-[#0f1b2d] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2b5f9e]"
              />
            </div>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredCoursesProgress.length === 0 ? (
            <div className="text-center py-14 px-4">
              <div className="w-12 h-12 rounded-xl bg-[#e8f0fa] text-[#2b5f9e] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#0f1b2d]">
                {searchQuery.trim()
                  ? "No matching courses found"
                  : activeTab === "Completed"
                    ? "You haven't completed any courses yet."
                    : "You don't have any active courses yet."}
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {searchQuery.trim()
                  ? "Try clearing your filter query."
                  : "Browse available programs to start your learning journey."}
              </p>
              {!searchQuery.trim() && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[780px]">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e5e9f0]">
                    <th className="text-left text-xs font-bold text-slate-500 px-5 py-2.5 whitespace-nowrap">
                      Course
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 px-4 py-2.5 whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 px-4 py-2.5 whitespace-nowrap">
                      Lessons
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 px-4 py-2.5 whitespace-nowrap">
                      Progress
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 px-4 py-2.5 whitespace-nowrap">
                      Updated
                    </th>
                    <th className="text-right text-xs font-bold text-slate-500 px-5 py-2.5 whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e9f0]">
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
                      const updatedAtLabel = enrollment?.updatedAt
                        ? (() => {
                            try {
                              return format(
                                new Date(enrollment.updatedAt),
                                "MMM d, yyyy",
                              );
                            } catch {
                              return "—";
                            }
                          })()
                        : completedLessons === 0
                          ? "Not started"
                          : "Active";

                      return (
                        <tr
                          key={enrollment.id}
                          className="hover:bg-[#f8fafc] transition-colors"
                        >
                          {/* Course Thumbnail + Title */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3 min-w-[240px]">
                              <div className="w-11 h-11 rounded-[10px] bg-[#e8f0fa] border border-[#e5e9f0] flex items-center justify-center shrink-0 overflow-hidden">
                                {enrollment.course?.thumbnail ? (
                                  <img
                                    src={enrollment.course.thumbnail}
                                    alt={enrollment.course.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <BookOpen className="w-5 h-5 text-[#2b5f9e]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  to={`/courses/${courseId}`}
                                  className="font-bold text-sm text-[#0f1b2d] hover:text-[#2b5f9e] transition-colors line-clamp-1 block"
                                >
                                  {enrollment.course?.title}
                                </Link>
                                <span className="text-xs text-slate-500 block">
                                  Course {index + 1} of{" "}
                                  {filteredCoursesProgress.length}
                                  {enrollment.cohort?.name
                                    ? ` · ${enrollment.cohort.name}`
                                    : ""}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isCompleted
                                  ? "bg-[#e3f5ea] text-[#15803d]"
                                  : "bg-[#fff1e6] text-[#c2540a]"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {isCompleted ? "Completed" : "In progress"}
                            </span>
                          </td>

                          {/* Lessons Count */}
                          <td className="px-4 py-3.5 text-sm text-[#0f1b2d] font-medium whitespace-nowrap">
                            {completedLessons} / {totalLessons}
                          </td>

                          {/* Progress Bar + Percent */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2.5 min-w-[140px]">
                              <Progress
                                value={percentage}
                                className="h-1.5 flex-1 bg-[#e5e9f0]"
                              />
                              <span className="text-xs font-bold text-[#0f1b2d] w-9 text-right">
                                {percentage}%
                              </span>
                            </div>
                          </td>

                          {/* Updated / Activity */}
                          <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                            {updatedAtLabel}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              {isCompleted ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    asChild
                                    className="h-8 px-3 rounded-lg border-[#e5e9f0] bg-white hover:bg-[#f8fafc] text-[#0f1b2d] font-semibold text-xs"
                                  >
                                    <Link to="/certifications">
                                      View certificate
                                    </Link>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className="h-8 px-2.5 rounded-lg text-[#2b5f9e] hover:bg-[#e8f0fa] font-semibold text-xs"
                                  >
                                    <Link to={`/learn/${courseId}`}>Review</Link>
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Link
                                    to={`/courses/${courseId}`}
                                    className="text-xs font-semibold text-[#2b5f9e] hover:underline px-2 py-1"
                                  >
                                    Details
                                  </Link>
                                  <Button
                                    size="sm"
                                    asChild
                                    className="h-8 px-3.5 rounded-lg bg-[#2b5f9e] hover:bg-[#234e83] text-white font-semibold text-xs gap-1.5 border-0"
                                  >
                                    <Link to={`/learn/${courseId}`}>
                                      <PlayCircle className="w-3.5 h-3.5" />
                                      Resume
                                    </Link>
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-[#e5e9f0] text-xs text-slate-500">
            <span>
              Showing {filteredCoursesProgress.length}{" "}
              {filteredCoursesProgress.length === 1 ? "course" : "courses"}
            </span>
            <Link
              to="/grades"
              className="font-semibold text-[#2b5f9e] hover:underline"
            >
              Open Electronic Gradebook &rarr;
            </Link>
          </div>
        </section>

        {/* ── Quick Action Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/schedules"
            className="group flex items-center gap-4 bg-white rounded-xl border border-[#e5e9f0] p-4 hover:border-[#2b5f9e]/30 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#e8f0fa] flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-[#2b5f9e]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0f1b2d]">My Schedule</p>
              <p className="text-xs text-slate-500">
                View upcoming classes &amp; clinical shifts
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#2b5f9e] transition-colors shrink-0" />
          </Link>

          <Link
            to="/certifications"
            className="group flex items-center gap-4 bg-white rounded-xl border border-[#e5e9f0] p-4 hover:border-[#f26b21]/30 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#fff1e6] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-[#f26b21]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0f1b2d]">Certifications</p>
              <p className="text-xs text-slate-500">
                Generate &amp; verify achievements
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#f26b21] transition-colors shrink-0" />
          </Link>

          <Link
            to="/chat"
            className="group flex items-center gap-4 bg-white rounded-xl border border-[#e5e9f0] p-4 hover:border-[#2b5f9e]/30 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#e3f5ea] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-[#15803d]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0f1b2d]">Need Help?</p>
              <p className="text-xs text-slate-500">Chat with instructors</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#15803d] transition-colors shrink-0" />
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
};

export default LmsMyLearning;
