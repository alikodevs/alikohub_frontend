import { useMemo } from "react";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  Calendar,
  Clock,
  Video,
  PlayCircle,
  HelpCircle,
  BookOpen,
  Users,
  CalendarDays,
  ChevronRight,
  Stethoscope,
  MapPin,
  Gauge,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnrollments, useCourseSchedules } from "@/hooks/useAcademy";
import { useMyTransactions } from "@/features/student/hooks/usePayment";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { academyService } from "@/services/academyService";
import { wabonComplianceService } from "@/features/rubric/services/wabonComplianceService";

const typeColors: Record<string, string> = {
  LIVE: "bg-rose-100 text-rose-700",
  RECORDING: "bg-indigo-100 text-indigo-700",
  Q_AND_A: "bg-amber-100 text-amber-700",
  OFFICE_HOURS: "bg-emerald-100 text-emerald-700",
  WORKSHOP: "bg-violet-100 text-violet-700",
};

const typeLabels: Record<string, string> = {
  LIVE: "Live Session",
  RECORDING: "Recording",
  Q_AND_A: "Q & A",
  OFFICE_HOURS: "Office Hours",
  WORKSHOP: "Workshop",
};

const getIcon = (type: string) => {
  switch (type) {
    case "LIVE":
      return <Video className="w-4 h-4" />;
    case "RECORDING":
      return <PlayCircle className="w-4 h-4" />;
    case "Q_AND_A":
      return <HelpCircle className="w-4 h-4" />;
    case "OFFICE_HOURS":
      return <Clock className="w-4 h-4" />;
    case "WORKSHOP":
      return <BookOpen className="w-4 h-4" />;
    default:
      return <Calendar className="w-4 h-4" />;
  }
};

const StudentSchedules = () => {
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: myTransactions } = useMyTransactions();

  // Get all enrolled course IDs (ACTIVE or COMPLETED, or has completed transaction)
  const completedTxCourseIds = useMemo(
    () =>
      new Set(
        myTransactions
          ?.filter((tx: any) => tx.status === "COMPLETED")
          .map((tx: any) => (tx.metadata as any)?.courseId)
          .filter(Boolean) || [],
      ),
    [myTransactions],
  );

  const enrolledCourseIds = useMemo(() => {
    if (!enrollments) return [];
    const activeEnrollments = enrollments.filter(
      (e: any) =>
        e.status === "ACTIVE" ||
        e.status === "COMPLETED" ||
        completedTxCourseIds.has(e.courseId ?? e.course?.id),
    );
    // Deduplicate course IDs
    const ids = new Set<number>();
    activeEnrollments.forEach((e: any) => {
      const cId = e.courseId ?? e.course?.id;
      if (cId) ids.add(Number(cId));
    });
    return Array.from(ids);
  }, [enrollments, completedTxCourseIds]);

  // Build a lookup for enrollment details (course title, cohort info, thumbnail)
  const enrollmentLookup = useMemo(() => {
    const lookup: Record<
      number,
      { title: string; thumbnail?: string; cohortName?: string }
    > = {};
    if (!enrollments) return lookup;
    enrollments.forEach((e: any) => {
      const cId = Number(e.courseId ?? e.course?.id);
      if (cId && !lookup[cId]) {
        lookup[cId] = {
          title: e.course?.title || `Course #${cId}`,
          thumbnail: e.course?.thumbnail,
          cohortName: e.cohort?.name,
        };
      }
    });
    return lookup;
  }, [enrollments]);

  // Deduplicate enrolled cohort IDs for clinical shifts and 90-day pacing
  const enrolledCohortIds = useMemo(() => {
    if (!enrollments) return [];
    const activeEnrollments = enrollments.filter(
      (e: any) =>
        e.status === "ACTIVE" ||
        e.status === "COMPLETED" ||
        completedTxCourseIds.has(e.courseId ?? e.course?.id),
    );
    const ids = new Set<number>();
    activeEnrollments.forEach((e: any) => {
      const chId = e.cohortId ?? e.cohort?.id;
      if (chId) ids.add(Number(chId));
    });
    return Array.from(ids);
  }, [enrollments, completedTxCourseIds]);

  // Fetch schedules for each enrolled course in parallel
  const scheduleQueries = useQueries({
    queries: enrolledCourseIds.map((courseId) => ({
      queryKey: ["course-schedules", courseId],
      queryFn: () => academyService.getCourseSchedules(courseId),
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    })),
  });

  // Fetch clinical facility shifts and cohort pacing for enrolled cohorts
  const clinicalShiftQueries = useQueries({
    queries: enrolledCohortIds.map((cohortId) => ({
      queryKey: ["clinical-shifts", "cohort", cohortId],
      queryFn: () => wabonComplianceService.getCohortClinicalShifts(cohortId),
      enabled: !!cohortId,
      staleTime: 2 * 60 * 1000,
    })),
  });

  const gradeReportQueries = useQueries({
    queries: enrolledCohortIds.map((cohortId) => ({
      queryKey: ["gradebook", "student", cohortId, undefined],
      queryFn: () => wabonComplianceService.getStudentGradeReport(cohortId),
      enabled: !!cohortId,
      staleTime: 2 * 60 * 1000,
    })),
  });

  const isSchedulesLoading =
    enrollmentsLoading || scheduleQueries.some((q) => q.isLoading);

  const clinicalShifts = useMemo(() => {
    const merged: any[] = [];
    clinicalShiftQueries.forEach((q) => {
      if (Array.isArray(q.data)) merged.push(...q.data);
    });
    const seen = new Set<number>();
    return merged
      .filter((shift) => {
        if (!shift?.id || seen.has(shift.id)) return false;
        seen.add(shift.id);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.shiftDate).getTime() - new Date(b.shiftDate).getTime(),
      );
  }, [clinicalShiftQueries]);

  const cohortPacingSummaries = useMemo(() => {
    return gradeReportQueries
      .map((q) => q.data)
      .filter((r): r is NonNullable<typeof r> => Boolean(r?.summary?.pacing));
  }, [gradeReportQueries]);

  // Merge all schedules from all courses, sort by startTime ascending
  const allSchedules = useMemo(() => {
    const merged: any[] = [];
    scheduleQueries.forEach((q) => {
      if (q.data && Array.isArray(q.data)) {
        merged.push(...q.data);
      }
    });
    // Deduplicate by id
    const seen = new Set<number>();
    const unique = merged.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
    // Sort by startTime ascending (upcoming first)
    unique.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    return unique;
  }, [scheduleQueries]);

  // Split into upcoming and past
  const now = new Date();
  const upcomingSchedules = allSchedules.filter(
    (s) => new Date(s.endTime) >= now,
  );
  const pastSchedules = allSchedules.filter((s) => new Date(s.endTime) < now);

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto px-5 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            My Schedule
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live workshops, Q&A sessions, and events for your enrolled courses.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Upcoming",
              value: upcomingSchedules.length,
              icon: CalendarDays,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
            },
            {
              label: "Courses",
              value: enrolledCourseIds.length,
              icon: BookOpen,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "This Week",
              value: upcomingSchedules.filter((s) => {
                const d = new Date(s.startTime);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return d <= weekFromNow;
              }).length,
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Past",
              value: pastSchedules.length,
              icon: Calendar,
              color: "text-slate-500",
              bg: "bg-slate-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center text-center p-4 rounded-xl border bg-card`}
            >
              <div className={`p-2 rounded-lg ${stat.bg} mb-2`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-heading font-bold text-foreground leading-none">
                {isSchedulesLoading ? "—" : stat.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Schedule list */}
          <div className="lg:col-span-2 space-y-5">
            {/* Upcoming schedules */}
            <div>
              <h2 className="text-base font-heading font-bold text-foreground flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4 text-primary" />
                Upcoming Sessions
              </h2>

              {isSchedulesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                  ))}
                </div>
              ) : upcomingSchedules.length === 0 ? (
                <div className="bg-card rounded-xl border p-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    No upcoming sessions
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    You don't have any scheduled sessions right now. Check back
                    later or explore new courses to enroll in.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSchedules.map((session: any) => {
                    const courseInfo =
                      session.course || enrollmentLookup[session.courseId];
                    let formattedDate = "";
                    let formattedTime = "";
                    let formattedEndTime = "";
                    try {
                      if (session.startTime) {
                        const start = new Date(session.startTime);
                        formattedDate = format(start, "EEEE, MMMM d, yyyy");
                        formattedTime = format(start, "h:mm a");
                      }
                      if (session.endTime) {
                        formattedEndTime = format(
                          new Date(session.endTime),
                          "h:mm a",
                        );
                      }
                    } catch (e) {
                      console.error("Date format error", e);
                    }

                    // Is session happening right now?
                    const isLive =
                      new Date(session.startTime) <= now &&
                      new Date(session.endTime) >= now;

                    return (
                      <div
                        key={session.id}
                        className={`bg-card rounded-xl border p-5 transition-all hover:shadow-md group ${
                          isLive
                            ? "ring-2 ring-rose-400/50 border-rose-200"
                            : "hover:border-primary/20"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2 flex-grow min-w-0">
                            {/* Tags row */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                  typeColors[session.type] ||
                                  "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {getIcon(session.type)}
                                {typeLabels[session.type] || session.type}
                              </span>
                              {isLive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500 text-white rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                  Live Now
                                </span>
                              )}
                              {session.isRecurring && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider">
                                  Recurring
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                              {session.title}
                            </h3>

                            {/* Description */}
                            {session.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {session.description}
                              </p>
                            )}

                            {/* Meta row */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-medium pt-1">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" />
                                {courseInfo?.title ||
                                  `Course #${session.courseId}`}
                              </span>
                              {(session.cohort || session.cohortId) && (
                                <span className="flex items-center gap-1 bg-primary/5 text-primary py-0.5 px-2 rounded-full">
                                  <Users className="w-3 h-3" />
                                  {session.cohort?.name ||
                                    `Cohort #${session.cohortId}`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Date block */}
                          <div className="shrink-0 sm:text-right sm:border-l sm:border-border sm:pl-5 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 sm:justify-end text-foreground font-bold text-xs">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                {formattedDate}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-medium">
                                {formattedTime}
                                {formattedEndTime && ` — ${formattedEndTime}`}
                              </div>
                            </div>
                            {isLive && (
                              <span className="text-xs text-rose-600 font-bold mt-1">
                                Happening now &rarr;
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past sessions */}
            {pastSchedules.length > 0 && (
              <div>
                <h2 className="text-base font-heading font-bold text-muted-foreground flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" />
                  Past Sessions
                </h2>
                <div className="space-y-2">
                  {pastSchedules.slice(0, 5).map((session: any) => {
                    const courseInfo =
                      session.course || enrollmentLookup[session.courseId];
                    let formattedDate = "";
                    try {
                      if (session.startTime) {
                        formattedDate = format(
                          new Date(session.startTime),
                          "MMM d, yyyy · h:mm a",
                        );
                      }
                    } catch (e) {
                      /* ignore */
                    }

                    return (
                      <div
                        key={session.id}
                        className="bg-card rounded-lg border p-4 opacity-70 hover:opacity-100 transition-opacity flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              typeColors[session.type] ||
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {getIcon(session.type)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {session.title}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              {courseInfo?.title ||
                                `Course #${session.courseId}`}
                              {session.cohort && ` · ${session.cohort.name}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
                          {formattedDate}
                        </span>
                      </div>
                    );
                  })}
                  {pastSchedules.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      + {pastSchedules.length - 5} more past sessions
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Scheduled Clinical Facility Shifts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  Clinical Facility Shifts
                </h2>
                <Link
                  to="/clinical"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Open Clinical Roster &rarr;
                </Link>
              </div>
              {clinicalShifts.length === 0 ? (
                <div className="bg-card rounded-xl border p-6 text-center text-xs text-muted-foreground">
                  No in-person clinical facility shifts scheduled for your cohort yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {clinicalShifts.map((shift: any) => (
                    <div
                      key={shift.id}
                      className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                            Clinical Shift · {shift.hoursCredited}h
                          </span>
                          {shift.cohort?.name && (
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {shift.cohort.name}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {shift.facilityName}
                        </h4>
                      </div>
                      <div className="text-xs sm:text-right">
                        <div className="font-bold text-foreground">
                          {shift.shiftDate
                            ? format(new Date(shift.shiftDate), "MMM d, yyyy")
                            : "—"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {shift.startTime && shift.endTime
                            ? `${format(new Date(shift.startTime), "p")} — ${format(new Date(shift.endTime), "p")}`
                            : "Shift times TBD"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Enrolled courses with schedules */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                My Courses
              </h3>
              <div className="space-y-2">
                {enrollmentsLoading ? (
                  <>
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </>
                ) : enrolledCourseIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No enrolled courses yet.
                  </p>
                ) : (
                  enrolledCourseIds.map((cId) => {
                    const info = enrollmentLookup[cId];
                    const scheduleCount = allSchedules.filter(
                      (s) => Number(s.courseId) === cId,
                    ).length;
                    return (
                      <Link
                        key={cId}
                        to={`/learn/${cId}`}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0 border border-border overflow-hidden">
                            {info?.thumbnail ? (
                              <img
                                src={info.thumbnail}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {info?.title || `Course #${cId}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {scheduleCount} session
                              {scheduleCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cohort Completion Pacing Deadlines */}
            {cohortPacingSummaries.length > 0 && (
              <div className="bg-card rounded-xl border p-5 space-y-3">
                <h3 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" />
                  Cohort Pacing Deadlines
                </h3>
                <div className="space-y-2.5">
                  {cohortPacingSummaries.map((report) => {
                    const pacing = report.summary.pacing;
                    const badgeColor =
                      pacing.status === "ON_TRACK"
                        ? "bg-emerald-100 text-emerald-700"
                        : pacing.status === "AT_RISK"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700";

                    return (
                      <div
                        key={report.cohortId}
                        className="p-3 rounded-lg bg-muted/50 border text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground truncate">
                            {report.courseTitle || `Cohort #${report.cohortId}`}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${badgeColor}`}
                          >
                            {pacing.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            Progress: {pacing.actualProgressPercent}% / {pacing.expectedProgressPercent}% expected
                          </span>
                          <span className="font-semibold text-foreground">
                            {pacing.daysRemainingInCohort}d left
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info card */}
            <div className="rounded-xl p-5 bg-white border border-[#e5e9f0] space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#e8f0fa] text-[#2b5f9e] flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-[#0f1b2d]">Stay on Track</span>
              </div>
              <div className="w-7 h-0.5 bg-[#f26b21] rounded-full" />
              <p className="text-slate-500 text-xs leading-relaxed">
                Your instructors schedule live workshops, Q&A sessions, and
                office hours through your enrolled cohorts. Check back regularly
                so you never miss a session!
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentSchedules;
