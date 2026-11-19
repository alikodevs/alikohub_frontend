import { useMemo, useState } from "react";
import {
  Award,
  PlayCircle,
  ArrowRight,
  CalendarDays,
  MessageCircle,
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle2,
  Search,
  Check,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { CourseThumbnail, detectDiscipline } from "@/components/shared/CourseThumbnail";

const tabs = ["In progress", "Completed"] as const;

export const StudentProgress = () => {
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>("In progress");
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

    const discipline = detectDiscipline(
      enrollment.course?.category,
      enrollment.course?.title
    );

    return {
      enrollment,
      courseId,
      pData,
      totalLessons,
      completedLessons,
      percentage,
      isCompleted,
      discipline,
    };
  });

  const completedCoursesList = enrolledCoursesProgress.filter(
    (c: any) => c.isCompleted,
  );
  const inProgressCoursesList = enrolledCoursesProgress.filter(
    (c: any) => !c.isCompleted || c.enrollment.status === "ACTIVE",
  );

  const tabCounts: Record<(typeof tabs)[number], number> = {
    "In progress": inProgressCoursesList.length,
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

  const studentFirstName =
    user?.firstname || user?.displayName?.split(" ")[0] || "Student";

  const getDisciplineBadge = (discipline: string) => {
    switch (discipline) {
      case "healthcare":
        return { label: "Health", className: "bg-rose-50 text-[#BE123C] border-rose-200" };
      case "stem":
        return { label: "STEM", className: "bg-sky-50 text-[#0369A1] border-sky-200" };
      case "technology":
        return { label: "Technology", className: "bg-emerald-50 text-[#047857] border-emerald-200" };
      case "nutrition":
        return { label: "Nutrition", className: "bg-emerald-50 text-[#047857] border-emerald-200" };
      case "safety":
        return { label: "Safety", className: "bg-amber-50 text-[#B45309] border-amber-200" };
      default:
        return { label: "General", className: "bg-blue-50 text-[#1D4ED8] border-blue-200" };
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-[#F2F5FB] py-6 sm:py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* ── Page Header Bar (V2 Design) ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#0F1B34] tracking-tight">
                My Learning
              </h1>
              <p className="text-xs sm:text-sm text-[#5A6B8C] mt-1 font-normal">
                Keep going, {studentFirstName}! Complete your courses to unlock certificates and career pathways
              </p>
            </div>

            {/* Resume Last Course Button (Aliko Orange #F16A1C) */}
            <div className="flex items-center gap-3 shrink-0">
              {resumeTarget ? (
                <Button
                  asChild
                  className="h-10 px-5 rounded-xl text-xs font-semibold text-white bg-[#F16A1C] hover:bg-[#D95507] shadow-2xs gap-2 shrink-0 transition-all cursor-pointer"
                >
                  <Link to={`/learn/${resumeTarget.courseId}`}>
                    <PlayCircle className="w-4 h-4" />
                    Resume last course
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  className="h-10 px-5 rounded-xl text-xs font-semibold text-white bg-[#0A65A0] hover:bg-[#084B78] shadow-2xs gap-2 shrink-0 transition-all cursor-pointer"
                >
                  <Link to="/courses">
                    <BookOpen className="w-4 h-4" />
                    Explore courses
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* ── 4-Card KPI Strip (Preserved and styled in modern V2 design system) ── */}
          <section
            aria-label="Summary"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Card 1: Overall progress */}
            <div className="bg-white border border-[#E1E7F1] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center gap-2.5 text-[#5A6B8C] font-medium text-xs">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#0A65A0] flex items-center justify-center shrink-0 shadow-2xs">
                  <Award className="w-4 h-4 stroke-[2.2]" />
                </span>
                <span className="font-medium text-[#0F1B34]">Overall progress</span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-heading text-[#0F1B34] tracking-tight">
                  {isLoading ? "—" : `${overallProgress}%`}
                </div>
                <div className="h-1.5 rounded-full bg-[#E1E7F1] overflow-hidden mt-3">
                  <div
                    className="h-full rounded-full bg-[#10B981] transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: In progress */}
            <div className="bg-white border border-[#E1E7F1] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center gap-2.5 text-[#5A6B8C] font-medium text-xs">
                <span className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                  <BookOpen className="w-4 h-4 stroke-[2.2]" />
                </span>
                <span className="font-medium text-[#0F1B34]">In progress</span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-heading text-[#0F1B34] tracking-tight">
                  {isLoading ? "—" : inProgressCoursesList.length}
                  <small className="text-xs font-normal text-[#5A6B8C] ml-1.5">
                    courses
                  </small>
                </div>
                <p className="text-xs text-[#5A6B8C] mt-1.5">
                  {notStartedCount > 0
                    ? `${notStartedCount} not started yet`
                    : "Active enrollment"}
                </p>
              </div>
            </div>

            {/* Card 3: Completed */}
            <div className="bg-white border border-[#E1E7F1] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center gap-2.5 text-[#5A6B8C] font-medium text-xs">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                </span>
                <span className="font-medium text-[#0F1B34]">Completed</span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-heading text-[#0F1B34] tracking-tight">
                  {isLoading ? "—" : completedCourses}
                  <small className="text-xs font-normal text-[#5A6B8C] ml-1.5">
                    of {totalCourses}
                  </small>
                </div>
                <p className="text-xs text-[#5A6B8C] mt-1.5">
                  Certificate unlocked on completion
                </p>
              </div>
            </div>

            {/* Card 4: Lessons done */}
            <div className="bg-white border border-[#E1E7F1] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center gap-2.5 text-[#5A6B8C] font-medium text-xs">
                <span className="w-8 h-8 rounded-xl bg-amber-50 text-[#D77510] flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-4 h-4 stroke-[2.2]" />
                </span>
                <span className="font-medium text-[#0F1B34]">Lessons done</span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-heading text-[#0F1B34] tracking-tight">
                  {isLoading ? "—" : totalCompletedLessons}
                  <small className="text-xs font-normal text-[#5A6B8C] ml-1.5">
                    of {totalLessonsAll}
                  </small>
                </div>
                <p className="text-xs text-[#5A6B8C] mt-1.5">Across active courses</p>
              </div>
            </div>
          </section>

          {/* ── Mandatory Orientation Prerequisite Banner (V2 Calm Alert) ── */}
          {!isOrientationLoading &&
            activeEnrollments.length > 0 &&
            !isOrientationComplete && (
              <div className="rounded-2xl p-4 sm:p-5 bg-[#FEFAF3] border border-[#EA8A00]/30 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF2E3] border border-[#EA8A00]/25 text-[#EA8A00] flex items-center justify-center shrink-0 shadow-2xs">
                    <GraduationCap className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold font-heading text-[#0F1B34]">
                      Mandatory student orientation required
                    </h4>
                    <p className="text-xs text-[#5A6B8C] mt-0.5 leading-relaxed">
                      Complete orientation, LMS tutorial and netiquette pledge to unlock your lessons.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 rounded-xl text-xs font-semibold text-[#0F1B34] bg-white border-[#E1E7F1] hover:bg-slate-50 shadow-2xs flex-1 sm:flex-initial"
                  >
                    <Link to={`/admissions?cohortId=${primaryCohortId}`}>
                      Admissions
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="h-9 px-5 rounded-xl text-xs font-semibold text-white bg-[#F16A1C] hover:bg-[#D95507] shadow-2xs border-0 flex-1 sm:flex-initial"
                  >
                    <Link to={`/orientation?cohortId=${primaryCohortId}`}>
                      Complete orientation
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}

          {/* ── Filter Toolbar: Tabs & Search ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E1E7F1] rounded-2xl shadow-2xs w-fit">
              {tabs.map((tab) => {
                const selected = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                      selected
                        ? "bg-[#0A65A0] text-white shadow-2xs"
                        : "text-[#5A6B8C] hover:text-[#0F1B34] hover:bg-slate-50"
                    )}
                  >
                    <span>{tab}</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                        selected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-[#5A6B8C]"
                      )}
                    >
                      {tabCounts[tab]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#5A6B8C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter courses..."
                aria-label="Filter courses"
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-[#E1E7F1] text-xs text-[#0F1B34] placeholder:text-[#5A6B8C] focus:outline-none focus:ring-2 focus:ring-[#0A65A0] shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* ── Courses Grid (V2 3-Column Subject-Colored Cards) ── */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#E1E7F1] p-5 space-y-4">
                  <Skeleton className="h-36 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : filteredCoursesProgress.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E1E7F1] text-center py-16 px-6 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0A65A0] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <BookOpen className="w-7 h-7 stroke-[2]" />
              </div>
              <h3 className="text-base font-semibold font-heading text-[#0F1B34]">
                {searchQuery.trim()
                  ? "No matching courses found"
                  : activeTab === "Completed"
                  ? "You haven't completed any courses yet."
                  : "You don't have any active courses yet."}
              </h3>
              <p className="text-xs text-[#5A6B8C] mt-1.5 mb-5 max-w-sm mx-auto">
                {searchQuery.trim()
                  ? "Try clearing your search query to see all enrolled courses."
                  : "Browse available programs to start your certified healthcare career path."}
              </p>
              {!searchQuery.trim() && (
                <Button
                  asChild
                  className="bg-[#0A65A0] hover:bg-[#084B78] text-white text-xs font-semibold rounded-xl h-9 px-5 shadow-2xs"
                >
                  <Link to="/courses">Browse Catalog</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCoursesProgress.map(
                  ({
                    enrollment,
                    courseId,
                    pData,
                    totalLessons,
                    completedLessons,
                    percentage,
                    isCompleted,
                    discipline,
                  }: any) => {
                    const disciplineBadge = getDisciplineBadge(discipline);

                    return (
                      <div
                        key={enrollment.id}
                        className="bg-white rounded-2xl border border-[#E1E7F1] hover:border-slate-300 shadow-2xs transition-all flex flex-col justify-between overflow-hidden group hover:shadow-sm"
                      >
                        {/* Top Thumbnail Image or Subject Gradient */}
                        <div className="h-36 sm:h-40 w-full relative overflow-hidden flex items-center justify-center bg-slate-100">
                          {enrollment.course?.thumbnail &&
                          !enrollment.course.thumbnail.includes("placeholder") ? (
                            <img
                              src={enrollment.course.thumbnail}
                              alt={enrollment.course?.title || "Course"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <CourseThumbnail
                              category={enrollment.course?.category}
                              title={enrollment.course?.title}
                              size="xl"
                              rounded="md"
                              className="w-full h-full rounded-none"
                              iconClassName="w-10 h-10"
                            />
                          )}
                        </div>

                        {/* Card Content Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            {/* Badges: Discipline & Status */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={cn(
                                  "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border",
                                  disciplineBadge.className
                                )}
                              >
                                {disciplineBadge.label}
                              </span>
                              <span
                                className={cn(
                                  "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1",
                                  isCompleted
                                    ? "bg-emerald-50 text-[#047857] border-emerald-200"
                                    : "bg-amber-50 text-[#B45309] border-amber-200"
                                )}
                              >
                                {isCompleted ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                    Completed
                                  </>
                                ) : (
                                  "In progress"
                                )}
                              </span>
                            </div>

                            {/* Course Title */}
                            <Link
                              to={`/courses/${courseId}`}
                              className="font-heading font-semibold text-base text-[#0F1B34] hover:text-[#0A65A0] transition-colors line-clamp-1 block"
                              title={enrollment.course?.title}
                            >
                              {enrollment.course?.title}
                            </Link>

                            {/* Lesson Info */}
                            <p className="text-xs text-[#5A6B8C] line-clamp-1">
                              {totalLessons > 0 ? (
                                <>
                                  {completedLessons} of {totalLessons} lessons
                                  {pData?.nextLessonTitle
                                    ? ` · Next: ${pData.nextLessonTitle}`
                                    : ""}
                                </>
                              ) : (
                                "Syllabus & coursework ready"
                              )}
                            </p>
                          </div>

                          {/* Progress Bar & Percentage */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-xs font-bold text-[#0F1B34]">
                              <span className="text-[11px] text-[#5A6B8C] font-normal">Course Progress</span>
                              <span>{percentage}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#E1E7F1] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#10B981] transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Action Buttons Row (Details = Outline, Resume = Aliko Orange #F16A1C) */}
                          <div className="pt-3 border-t border-[#E1E7F1] flex items-center gap-2.5">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="flex-1 h-9 rounded-xl text-xs font-semibold text-[#0F1B34] bg-white border-[#E1E7F1] hover:bg-slate-50 shadow-2xs cursor-pointer"
                            >
                              <Link to={`/courses/${courseId}`}>Details</Link>
                            </Button>
                            <Button
                              size="sm"
                              asChild
                              className="flex-1 h-9 rounded-xl text-xs font-semibold text-white bg-[#F16A1C] hover:bg-[#D95507] shadow-2xs gap-1.5 border-0 cursor-pointer"
                            >
                              <Link to={`/learn/${courseId}`}>
                                <PlayCircle className="w-3.5 h-3.5" />
                                {isCompleted ? "Review" : "Resume"}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Summary bar / Gradebook link */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1 text-xs text-[#5A6B8C]">
                <span>
                  Showing {filteredCoursesProgress.length}{" "}
                  {filteredCoursesProgress.length === 1 ? "course" : "courses"}
                </span>
                <Link
                  to="/grades"
                  className="font-medium text-[#0A65A0] hover:underline"
                >
                  Open Electronic Gradebook &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* ── Bottom Quick Action Tiles (V2 3-Column Layout) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-2">
            {/* Tile 1: My Schedule */}
            <Link
              to="/schedules"
              className="group flex items-center gap-4 bg-white rounded-2xl border border-[#E1E7F1] p-4 sm:p-5 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-[#E1E7F1] text-[#0A65A0] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#0A65A0] group-hover:text-white transition-all">
                <CalendarDays className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold font-heading text-[#0F1B34] group-hover:text-[#0A65A0] transition-colors">
                  My Schedule
                </h4>
                <p className="text-xs text-[#5A6B8C] mt-0.5 truncate">
                  Upcoming classes &amp; clinical shifts
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0A65A0] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            {/* Tile 2: Certifications */}
            <Link
              to="/certifications"
              className="group flex items-center gap-4 bg-white rounded-2xl border border-[#E1E7F1] p-4 sm:p-5 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-[#E1E7F1] text-[#0A65A0] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#0A65A0] group-hover:text-white transition-all">
                <Award className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold font-heading text-[#0F1B34] group-hover:text-[#0A65A0] transition-colors">
                  Certifications
                </h4>
                <p className="text-xs text-[#5A6B8C] mt-0.5 truncate">
                  Generate &amp; verify certificates
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0A65A0] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            {/* Tile 3: Need Help? */}
            <Link
              to="/support"
              className="group flex items-center gap-4 bg-white rounded-2xl border border-[#E1E7F1] p-4 sm:p-5 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-[#E1E7F1] text-[#0A65A0] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#0A65A0] group-hover:text-white transition-all">
                <HelpCircle className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold font-heading text-[#0F1B34] group-hover:text-[#0A65A0] transition-colors">
                  Need help?
                </h4>
                <p className="text-xs text-[#5A6B8C] mt-0.5 truncate">
                  Chat with your instructors
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0A65A0] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProgress;
