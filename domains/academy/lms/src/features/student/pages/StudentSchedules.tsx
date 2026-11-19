import { useState, useMemo } from "react";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  Calendar,
  Clock,
  Video,
  PlayCircle,
  HelpCircle,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  MapPin,
  Gauge,
  Bell,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useEnrollments } from "@/hooks/useAcademy";
import { useMyTransactions } from "@/features/student/hooks/usePayment";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
} from "date-fns";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { academyService } from "@/services/academyService";
import { wabonComplianceService } from "@/features/rubric/services/wabonComplianceService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string | number;
  title: string;
  subtitle?: string;
  startTime: Date;
  endTime: Date;
  type: "LIVE" | "RECORDING" | "Q_AND_A" | "OFFICE_HOURS" | "WORKSHOP" | "CLINICAL_SHIFT";
  courseId?: number;
  courseTitle?: string;
  cohortName?: string;
  location?: string;
  description?: string;
  hoursCredited?: number;
  instructorName?: string;
}

const StudentSchedules = () => {
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: myTransactions } = useMyTransactions();

  // View state: Week timetable and full List/Agenda (aligned with backend schedule truth)
  const [viewMode, setViewMode] = useState<"week" | "list">("week");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Reminders state with localStorage persistence
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(() => {
    return localStorage.getItem("aliko_schedule_reminders") === "true";
  });

  // Get all enrolled course IDs
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
    const ids = new Set<number>();
    activeEnrollments.forEach((e: any) => {
      const cId = e.courseId ?? e.course?.id;
      if (cId) ids.add(Number(cId));
    });
    return Array.from(ids);
  }, [enrollments, completedTxCourseIds]);

  // Enrollment lookup table
  const enrollmentLookup = useMemo(() => {
    const lookup: Record<
      number,
      { title: string; thumbnail?: string; cohortName?: string; category?: string }
    > = {};
    if (!enrollments) return lookup;
    enrollments.forEach((e: any) => {
      const cId = Number(e.courseId ?? e.course?.id);
      if (cId && !lookup[cId]) {
        lookup[cId] = {
          title: e.course?.title || `Course #${cId}`,
          thumbnail: e.course?.thumbnail,
          cohortName: e.cohort?.name,
          category: e.course?.category,
        };
      }
    });
    return lookup;
  }, [enrollments]);

  // Enrolled cohort IDs for clinical shifts and pacing
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

  // Fetch teaching schedules for each enrolled course in parallel from backend
  const scheduleQueries = useQueries({
    queries: enrolledCourseIds.map((courseId) => ({
      queryKey: ["course-schedules", courseId],
      queryFn: () => academyService.getCourseSchedules(courseId),
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    })),
  });

  // Fetch clinical facility shifts for enrolled cohorts from backend
  const clinicalShiftQueries = useQueries({
    queries: enrolledCohortIds.map((cohortId) => ({
      queryKey: ["clinical-shifts", "cohort", cohortId],
      queryFn: () => wabonComplianceService.getCohortClinicalShifts(cohortId),
      enabled: !!cohortId,
      staleTime: 2 * 60 * 1000,
    })),
  });

  // Fetch cohort completion pacing reports for WABON compliance
  const gradeReportQueries = useQueries({
    queries: enrolledCohortIds.map((cohortId) => ({
      queryKey: ["cohort-pacing-schedule", cohortId],
      queryFn: () => wabonComplianceService.getStudentGradeReport(cohortId),
      enabled: !!cohortId,
      staleTime: 2 * 60 * 1000,
    })),
  });

  const isSchedulesLoading =
    enrollmentsLoading ||
    scheduleQueries.some((q) => q.isLoading) ||
    clinicalShiftQueries.some((q) => q.isLoading);

  // Flatten clinical shifts from backend
  const clinicalShifts = useMemo(() => {
    const list: any[] = [];
    clinicalShiftQueries.forEach((query) => {
      if (query.data && Array.isArray(query.data)) {
        list.push(...query.data);
      }
    });
    return list;
  }, [clinicalShiftQueries]);

  // Cohort pacing summaries from backend
  const cohortPacingSummaries = useMemo(() => {
    const list: any[] = [];
    gradeReportQueries.forEach((q) => {
      if (q.data && q.data.summary?.pacing) {
        list.push(q.data);
      }
    });
    return list;
  }, [gradeReportQueries]);

  // Deduplicate backend teaching schedules
  const allSchedules = useMemo(() => {
    const combined: any[] = [];
    scheduleQueries.forEach((query) => {
      if (query.data && Array.isArray(query.data)) {
        combined.push(...query.data);
      }
    });
    const seen = new Set<string>();
    const unique = combined.filter((s) => {
      const key = `${s.courseId}-${s.title}-${s.startTime}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    return unique;
  }, [scheduleQueries]);

  // Split into upcoming and past based on current time
  const now = new Date();
  const upcomingSchedules = useMemo(
    () => allSchedules.filter((s) => new Date(s.endTime || s.startTime) >= now),
    [allSchedules, now],
  );
  const pastSchedules = useMemo(
    () => allSchedules.filter((s) => new Date(s.endTime || s.startTime) < now),
    [allSchedules, now],
  );

  // Combined calendar events: Teaching schedules + Clinical shifts directly from backend
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    // Course schedules
    allSchedules.forEach((s) => {
      const courseInfo = enrollmentLookup[s.courseId];
      events.push({
        id: `schedule-${s.id}`,
        title: s.title,
        subtitle: s.description || courseInfo?.title,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime || s.startTime),
        type: (s.type as any) || "LIVE",
        courseId: s.courseId,
        courseTitle: courseInfo?.title || s.course?.title,
        cohortName: s.cohort?.name || courseInfo?.cohortName,
        location: s.meetingUrl || s.location || "Online Classroom",
        description: s.description,
        instructorName: s.instructor?.name || s.course?.instructor?.name,
      });
    });

    // Clinical facility shifts
    clinicalShifts.forEach((cs) => {
      let start = new Date(cs.shiftDate);
      let end = new Date(cs.shiftDate);
      if (cs.startTime) {
        const parsedStart = new Date(cs.startTime);
        if (!isNaN(parsedStart.getTime())) start = parsedStart;
      }
      if (cs.endTime) {
        const parsedEnd = new Date(cs.endTime);
        if (!isNaN(parsedEnd.getTime())) end = parsedEnd;
      } else {
        end = new Date(start.getTime() + (cs.hoursCredited || 4) * 3600000);
      }

      events.push({
        id: `clinical-${cs.id}`,
        title: `Clinical Shift`,
        subtitle: cs.facilityName || "Clinical Facility",
        startTime: start,
        endTime: end,
        type: "CLINICAL_SHIFT",
        cohortName: cs.cohort?.name,
        location: cs.facilityName || "Assigned Facility",
        description: `Hands-on clinical training shift at ${cs.facilityName || "facility"}. Hours credited: ${cs.hoursCredited || 4}h.`,
        hoursCredited: cs.hoursCredited,
        instructorName: cs.instructor
          ? `${cs.instructor.firstName || ""} ${cs.instructor.lastName || ""}`.trim()
          : undefined,
      });
    });

    return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [allSchedules, clinicalShifts, enrollmentLookup]);

  // Dynamic KPI computations (Directly from backend data)
  const thisWeekSessionsCount = useMemo(() => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return calendarEvents.filter(
      (e) => e.startTime >= weekStart && e.startTime <= weekEnd,
    ).length;
  }, [calendarEvents, now]);

  const nextClinicalShift = useMemo(() => {
    const futureShifts = clinicalShifts.filter(
      (s) => new Date(s.shiftDate || s.startTime) >= now,
    );
    return futureShifts.length > 0 ? futureShifts[0] : null;
  }, [clinicalShifts, now]);

  const dueSoonDeadlines = useMemo(() => {
    return cohortPacingSummaries.filter(
      (r) => r.summary?.pacing && r.summary.pacing.daysRemainingInCohort <= 14,
    );
  }, [cohortPacingSummaries]);

  // Week View Dates (Mon - Sun)
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  // Week Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => subWeeks(prev, 1));
  };

  const handleNext = () => {
    setCurrentDate((prev) => addWeeks(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Toggle Reminders
  const handleToggleReminders = async () => {
    if (!remindersEnabled) {
      if ("Notification" in window) {
        try {
          const perm = await Notification.requestPermission();
          if (perm === "granted") {
            setRemindersEnabled(true);
            localStorage.setItem("aliko_schedule_reminders", "true");
            toast.success("Schedule reminders enabled! You'll receive alerts before sessions.");
            return;
          }
        } catch (_) {}
      }
      setRemindersEnabled(true);
      localStorage.setItem("aliko_schedule_reminders", "true");
      toast.success("Schedule reminders preference saved.");
    } else {
      setRemindersEnabled(false);
      localStorage.setItem("aliko_schedule_reminders", "false");
      toast.info("Schedule reminders disabled.");
    }
  };

  // Event Styling Helper: Tinted events, not solid (V2 Spec)
  const getEventStyle = (type: string) => {
    switch (type) {
      case "LIVE":
        return {
          cardBg: "bg-rose-50/90 hover:bg-rose-100/90 text-rose-950 border-rose-200 border-l-4 border-l-rose-500",
          badgeBg: "bg-rose-100 text-rose-700",
          icon: Video,
        };
      case "CLINICAL_SHIFT":
        return {
          cardBg: "bg-purple-50/90 hover:bg-purple-100/90 text-purple-950 border-purple-200 border-l-4 border-l-purple-500",
          badgeBg: "bg-purple-100 text-purple-700",
          icon: Stethoscope,
        };
      case "WORKSHOP":
        return {
          cardBg: "bg-orange-50/90 hover:bg-orange-100/90 text-orange-950 border-orange-200 border-l-4 border-l-[#F16A1C]",
          badgeBg: "bg-orange-100 text-orange-700",
          icon: BookOpen,
        };
      case "Q_AND_A":
        return {
          cardBg: "bg-amber-50/90 hover:bg-amber-100/90 text-amber-950 border-amber-200 border-l-4 border-l-amber-500",
          badgeBg: "bg-amber-100 text-amber-700",
          icon: HelpCircle,
        };
      case "OFFICE_HOURS":
        return {
          cardBg: "bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-950 border-emerald-200 border-l-4 border-l-emerald-500",
          badgeBg: "bg-emerald-100 text-emerald-700",
          icon: Clock,
        };
      case "RECORDING":
        return {
          cardBg: "bg-sky-50/90 hover:bg-sky-100/90 text-sky-950 border-sky-200 border-l-4 border-l-sky-500",
          badgeBg: "bg-sky-100 text-sky-700",
          icon: PlayCircle,
        };
      default:
        return {
          cardBg: "bg-blue-50/90 hover:bg-blue-100/90 text-blue-950 border-blue-200 border-l-4 border-l-blue-500",
          badgeBg: "bg-blue-100 text-blue-700",
          icon: Calendar,
        };
    }
  };

  // Hourly slots for timetable: 8 AM to 5 PM
  const hoursList = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  // List view partitions: Upcoming vs Past
  const upcomingEvents = useMemo(
    () => calendarEvents.filter((ev) => ev.endTime >= now),
    [calendarEvents, now],
  );
  const pastEvents = useMemo(
    () => calendarEvents.filter((ev) => ev.endTime < now),
    [calendarEvents, now],
  );

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Top Header Bar (V2 Design) ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight m-0">
                My Schedule
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium m-0 mt-0.5">
                Live sessions, clinical shifts and deadlines for your enrolled courses
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* View Switcher: Week vs List (Agenda) */}
            <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex items-center shadow-2xs">
              {(["week", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                    viewMode === mode
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  {mode === "week" ? "Week View" : "Agenda / List"}
                </button>
              ))}
            </div>

            {/* Today button in Aliko Orange */}
            <Button
              size="sm"
              onClick={handleToday}
              className="h-9 px-4 rounded-xl bg-[#F16A1C] hover:bg-[#D75812] text-white text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              Today
            </Button>
          </div>
        </div>

        {/* ── Top 4 KPI Cards (V2 Spec: Calm white cards, real dynamic metrics) ─ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Upcoming sessions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/70 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Upcoming sessions
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold font-heading text-slate-900 leading-none block">
                  {isSchedulesLoading ? "—" : upcomingSchedules.length}
                </span>
                <span className="text-xs text-slate-400 font-medium mt-1 block">
                  {thisWeekSessionsCount} this week
                </span>
              </div>
              {/* Subtle sparkline */}
              <svg className="w-14 h-6 text-purple-400 opacity-60" viewBox="0 0 56 24" fill="none">
                <path
                  d="M2 18L14 14L26 19L38 9L54 5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* 2. Courses */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Courses
              </span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold font-heading text-slate-900 leading-none block">
                {enrollmentsLoading ? "—" : enrolledCourseIds.length}
              </span>
              <span className="text-xs text-slate-400 font-medium mt-1 block">
                With scheduled activity
              </span>
            </div>
          </div>

          {/* 3. Clinical shifts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Clinical shifts
              </span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold font-heading text-slate-900 leading-none block">
                {clinicalShifts.length}
              </span>
              <span className="text-xs text-slate-400 font-medium mt-1 block truncate">
                {nextClinicalShift
                  ? `${format(new Date(nextClinicalShift.shiftDate), "EEE")} · ${nextClinicalShift.facilityName || "Hospital"}`
                  : "No upcoming shifts"}
              </span>
            </div>
          </div>

          {/* 4. Due soon */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Due soon
              </span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold font-heading text-slate-900 leading-none block">
                {dueSoonDeadlines.length}
              </span>
              <span className="text-xs text-slate-400 font-medium mt-1 block truncate">
                {dueSoonDeadlines.length > 0
                  ? `${dueSoonDeadlines[0].summary?.pacing?.daysRemainingInCohort}d left in cohort`
                  : "All on track"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Main Layout: Calendar Grid (Left) + Sidebar (Right) ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Calendar View (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            {/* Calendar Sub-header with range & navigation */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                  <button
                    onClick={handlePrev}
                    aria-label="Previous week"
                    className="h-8 px-2.5 text-slate-600 hover:bg-slate-50 border-r border-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next week"
                    className="h-8 px-2.5 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <h2 className="text-base font-bold font-heading text-slate-900 m-0">
                  {viewMode === "week"
                    ? `${format(weekDays[0], "MMM d")} – ${format(weekDays[6], "MMM d, yyyy")}`
                    : "All Enrolled Sessions & Shifts"}
                </h2>
              </div>

              {isSchedulesLoading && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  Syncing backend...
                </div>
              )}
            </div>

            {/* ── Week View Timetable (V2 Design: Mon - Sun) ────────────────── */}
            {viewMode === "week" && (
              <div className="overflow-x-auto min-w-full">
                <div className="min-w-[640px]">
                  {/* Day header row */}
                  <div className="grid grid-cols-8 border-b border-slate-100 text-center bg-slate-50/50">
                    <div className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100">
                      Time
                    </div>
                    {weekDays.map((day) => {
                      const today = isToday(day);
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "p-3 border-r border-slate-100 last:border-r-0 transition-colors",
                            today && "bg-orange-50/40",
                          )}
                        >
                          <span
                            className={cn(
                              "text-xs font-bold block",
                              today ? "text-[#F16A1C]" : "text-slate-700",
                            )}
                          >
                            {format(day, "EEE d")}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hourly timetable rows */}
                  <div className="divide-y divide-slate-100">
                    {hoursList.map((hour) => {
                      const displayHour =
                        hour === 12
                          ? "12 PM"
                          : hour > 12
                            ? `${hour - 12} PM`
                            : `${hour} AM`;

                      return (
                        <div key={hour} className="grid grid-cols-8 min-h-[58px]">
                          {/* Time label */}
                          <div className="p-2.5 text-[11px] font-medium text-slate-400 text-right pr-3 border-r border-slate-100 select-none">
                            {displayHour}
                          </div>

                          {/* Day column slots */}
                          {weekDays.map((day) => {
                            const slotEvents = calendarEvents.filter((ev) => {
                              if (!isSameDay(ev.startTime, day)) return false;
                              const evHour = ev.startTime.getHours();
                              return evHour === hour;
                            });

                            const today = isToday(day);

                            return (
                              <div
                                key={day.toISOString()}
                                className={cn(
                                  "p-1 border-r border-slate-100 last:border-r-0 relative group hover:bg-slate-50/40 transition-colors",
                                  today && "bg-orange-50/10",
                                )}
                              >
                                {slotEvents.map((ev) => {
                                  const style = getEventStyle(ev.type);
                                  return (
                                    <button
                                      key={ev.id}
                                      onClick={() => setSelectedEvent(ev)}
                                      className={cn(
                                        "w-full text-left p-2 rounded-xl border mb-1 shadow-2xs transition-all cursor-pointer",
                                        style.cardBg,
                                      )}
                                    >
                                      <p className="text-[11px] font-bold leading-tight truncate m-0 font-heading">
                                        {ev.title}
                                      </p>
                                      <p className="text-[10px] opacity-80 truncate m-0 mt-0.5">
                                        {ev.subtitle || format(ev.startTime, "h:mm a")}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── List / Agenda View (Structured chronologically from backend) ── */}
            {viewMode === "list" && (
              <div className="p-5 space-y-6">
                {/* Section 1: Upcoming Sessions & Shifts */}
                <div>
                  <h3 className="text-xs font-bold font-heading text-slate-400 uppercase tracking-wider mb-3">
                    Upcoming Sessions ({upcomingEvents.length})
                  </h3>

                  {upcomingEvents.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-400 m-0">
                        No upcoming sessions or shifts on your schedule.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents.map((ev) => {
                        const style = getEventStyle(ev.type);
                        const isLiveNow = ev.startTime <= now && ev.endTime >= now;

                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className={cn(
                              "p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs cursor-pointer hover:shadow-xs transition-all",
                              style.cardBg,
                              isLiveNow && "ring-2 ring-rose-500/60",
                            )}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                    style.badgeBg,
                                  )}
                                >
                                  {ev.type.replace(/_/g, " ")}
                                </span>
                                {isLiveNow && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                    Live Now
                                  </span>
                                )}
                                {ev.courseTitle && (
                                  <span className="text-xs text-slate-500 font-medium truncate">
                                    {ev.courseTitle}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 font-heading m-0 truncate">
                                {ev.title}
                              </h4>
                              <p className="text-xs text-slate-600 m-0 line-clamp-1">
                                {ev.subtitle || ev.description}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-slate-900 block">
                                {format(ev.startTime, "EEE, MMM d, yyyy")}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {format(ev.startTime, "h:mm a")} — {format(ev.endTime, "h:mm a")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: Past Sessions & Shifts */}
                {pastEvents.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-bold font-heading text-slate-400 uppercase tracking-wider mb-3">
                      Past Sessions ({pastEvents.length})
                    </h3>
                    <div className="space-y-2.5 opacity-80 hover:opacity-100 transition-opacity">
                      {pastEvents.slice(0, 8).map((ev) => {
                        const style = getEventStyle(ev.type);
                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className={cn(
                              "p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs cursor-pointer hover:shadow-xs transition-all bg-slate-50/70 border-slate-200/60",
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                    style.badgeBg,
                                  )}
                                >
                                  {ev.type.replace(/_/g, " ")}
                                </span>
                                <h4 className="text-xs font-bold text-slate-800 font-heading m-0 truncate">
                                  {ev.title}
                                </h4>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] text-slate-500 block">
                                {format(ev.startTime, "MMM d, yyyy · h:mm a")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Sidebar Column (4 cols) ───────────────────────────────── */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. My courses (V2 Design) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="font-heading font-bold text-slate-900 text-base mb-3 m-0">
                My courses
              </h3>

              <div className="space-y-2">
                {enrollmentsLoading ? (
                  <>
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </>
                ) : enrolledCourseIds.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">
                    No enrolled courses yet.
                  </p>
                ) : (
                  enrolledCourseIds.map((cId) => {
                    const info = enrollmentLookup[cId];
                    const cat = (info?.category || info?.title || "").toLowerCase();
                    const isHealth = cat.includes("health") || cat.includes("nurs") || cat.includes("cna");
                    const isTech = cat.includes("tech") || cat.includes("cad") || cat.includes("stem");

                    return (
                      <Link
                        key={cId}
                        to={`/learn/${cId}`}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/70 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                              isHealth
                                ? "bg-rose-50 text-rose-600 border-rose-200"
                                : isTech
                                  ? "bg-blue-50 text-blue-600 border-blue-200"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-200",
                            )}
                          >
                            {isHealth ? (
                              <Stethoscope className="w-4 h-4" />
                            ) : isTech ? (
                              <BookOpen className="w-4 h-4" />
                            ) : (
                              <Gauge className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#0A65A0] transition-colors m-0">
                              {info?.title || `Course #${cId}`}
                            </p>
                            {info?.cohortName && (
                              <p className="text-[10px] text-slate-400 truncate m-0 mt-0.5">
                                {info.cohortName}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. Stay on track Reminders Card (V2 Spec) */}
            <div className="bg-[#F0FDF4]/90 border border-emerald-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h4 className="text-sm font-bold text-slate-900 font-heading m-0">
                  Stay on track
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0 font-medium">
                Turn on reminders to get a notification 30 minutes before every live class and clinical shift.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleReminders}
                className={cn(
                  "w-full h-9 rounded-xl text-xs font-semibold gap-1.5 transition-all",
                  remindersEnabled
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                    : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200",
                )}
              >
                <Bell className="w-3.5 h-3.5" />
                {remindersEnabled ? "Reminders Enabled ✓" : "Enable reminders"}
              </Button>
            </div>

            {/* 3. Cohort Completion Pacing Deadlines (WABON Compliance) */}
            {cohortPacingSummaries.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2 m-0">
                    <Gauge className="w-4 h-4 text-[#0A65A0] shrink-0" />
                    <span>Cohort Pacing Deadlines</span>
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  {cohortPacingSummaries.map((report) => {
                    const pacing = report.summary.pacing;
                    const badgeConfig =
                      pacing.status === "ON_TRACK"
                        ? {
                            label: "On Track",
                            className: "bg-emerald-50 text-emerald-700 border-emerald-200",
                          }
                        : pacing.status === "AT_RISK"
                          ? {
                              label: "At Risk",
                              className: "bg-amber-50 text-amber-700 border-amber-200",
                            }
                          : {
                              label: "Behind Schedule",
                              className: "bg-rose-50 text-rose-700 border-rose-200",
                            };

                    return (
                      <div
                        key={report.cohortId}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex flex-col gap-2.5"
                      >
                        {/* Course Title & Status Badge row with guaranteed non-overlapping spacing */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className="font-semibold text-slate-900 truncate min-w-0 flex-1 text-xs">
                            {report.courseTitle || `Cohort #${report.cohortId}`}
                          </span>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 whitespace-nowrap",
                              badgeConfig.className,
                            )}
                          >
                            {badgeConfig.label}
                          </span>
                        </div>

                        {/* Progress Bar & Days Remaining */}
                        <div className="space-y-1.5 pt-0.5">
                          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                pacing.status === "ON_TRACK"
                                  ? "bg-emerald-500"
                                  : pacing.status === "AT_RISK"
                                    ? "bg-amber-500"
                                    : "bg-rose-500",
                              )}
                              style={{
                                width: `${Math.min(100, Math.max(0, pacing.actualProgressPercent || 0))}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>
                              {pacing.actualProgressPercent}% / {pacing.expectedProgressPercent}% expected
                            </span>
                            <span className="font-bold text-slate-800 shrink-0">
                              {pacing.daysRemainingInCohort}d left
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Event Detail Modal (When student clicks any calendar event) ─────── */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-xl">
          {selectedEvent && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full",
                      getEventStyle(selectedEvent.type).badgeBg,
                    )}
                  >
                    {selectedEvent.type.replace(/_/g, " ")}
                  </span>
                  {selectedEvent.courseTitle && (
                    <span className="text-xs text-slate-500 font-medium truncate">
                      {selectedEvent.courseTitle}
                    </span>
                  )}
                </div>
                <DialogTitle className="text-lg font-bold font-heading text-slate-900 leading-snug">
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {selectedEvent.cohortName ? `Cohort: ${selectedEvent.cohortName}` : "Enrolled Course Event"}
                </DialogDescription>
              </DialogHeader>

              {/* Time & Location Details */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Calendar className="w-4 h-4 text-[#0A65A0] shrink-0" />
                  <span>{format(selectedEvent.startTime, "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Clock className="w-4 h-4 text-[#0A65A0] shrink-0" />
                  <span>
                    {format(selectedEvent.startTime, "h:mm a")} — {format(selectedEvent.endTime, "h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <MapPin className="w-4 h-4 text-[#0A65A0] shrink-0" />
                  <span className="truncate">{selectedEvent.location || "Online"}</span>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="text-xs text-slate-600 leading-relaxed font-medium">
                  {selectedEvent.description}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2.5 pt-2">
                {selectedEvent.location?.startsWith("http") ? (
                  <Button
                    onClick={() => window.open(selectedEvent.location, "_blank")}
                    className="flex-1 h-10 rounded-xl bg-[#F16A1C] hover:bg-[#D75812] text-white text-xs font-semibold gap-1.5 shadow-sm"
                  >
                    <ExternalLink size={14} /> Join Meeting
                  </Button>
                ) : selectedEvent.type === "CLINICAL_SHIFT" ? (
                  <Button
                    asChild
                    className="flex-1 h-10 rounded-xl bg-[#0A65A0] hover:bg-[#084B78] text-white text-xs font-semibold gap-1.5 shadow-sm"
                  >
                    <Link to="/clinical">
                      <Stethoscope size={14} /> View Clinical Roster
                    </Link>
                  </Button>
                ) : (
                  <Button
                    onClick={() => setSelectedEvent(null)}
                    className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    Close
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                  className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
};

export default StudentSchedules;
