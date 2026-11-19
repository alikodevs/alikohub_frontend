import { useState, useMemo } from "react";
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
  ChevronLeft,
  Stethoscope,
  MapPin,
  Gauge,
  Bell,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Download,
  AlertCircle,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
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
}

const StudentSchedules = () => {
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: myTransactions } = useMyTransactions();

  // View state
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "list">("week");
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

  // Fetch course schedules
  const scheduleQueries = useQueries({
    queries: enrolledCourseIds.map((courseId) => ({
      queryKey: ["course-schedules", courseId],
      queryFn: () => academyService.getCourseSchedules(courseId),
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    })),
  });

  // Fetch clinical facility shifts
  const clinicalShiftQueries = useQueries({
    queries: enrolledCohortIds.map((cohortId) => ({
      queryKey: ["clinical-shifts", "cohort", cohortId],
      queryFn: () => wabonComplianceService.getCohortClinicalShifts(cohortId),
      enabled: !!cohortId,
      staleTime: 2 * 60 * 1000,
    })),
  });

  // Fetch student grade reports for pacing deadlines
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

  // Clinical shifts parsed
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

  // Cohort pacing summaries
  const cohortPacingSummaries = useMemo(() => {
    return gradeReportQueries
      .map((q) => q.data)
      .filter((r): r is NonNullable<typeof r> => Boolean(r?.summary?.pacing));
  }, [gradeReportQueries]);

  // Merge and deduplicate all course schedules
  const allSchedules = useMemo(() => {
    const merged: any[] = [];
    scheduleQueries.forEach((q) => {
      if (q.data && Array.isArray(q.data)) {
        merged.push(...q.data);
      }
    });
    const seen = new Set<number>();
    const unique = merged.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
    unique.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    return unique;
  }, [scheduleQueries]);

  // Split into upcoming and past
  const now = new Date();
  const upcomingSchedules = useMemo(
    () => allSchedules.filter((s) => new Date(s.endTime || s.startTime) >= now),
    [allSchedules, now],
  );
  const pastSchedules = useMemo(
    () => allSchedules.filter((s) => new Date(s.endTime || s.startTime) < now),
    [allSchedules, now],
  );

  // Combined calendar events (Live sessions, workshops, Q&A, AND clinical shifts)
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
      });
    });

    return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [allSchedules, clinicalShifts, enrollmentLookup]);

  // Dynamic KPI computations (No static/mock data)
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

  // Month View Days
  const monthDays = useMemo(() => {
    const startMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(currentDate);
    const start = startOfWeek(startMonth, { weekStartsOn: 1 });
    const end = endOfWeek(endMonth, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Handlers for Navigation
  const handlePrev = () => {
    if (viewMode === "day") setCurrentDate((prev) => addDays(prev, -1));
    else if (viewMode === "week") setCurrentDate((prev) => subWeeks(prev, 1));
    else if (viewMode === "month") setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNext = () => {
    if (viewMode === "day") setCurrentDate((prev) => addDays(prev, 1));
    else if (viewMode === "week") setCurrentDate((prev) => addWeeks(prev, 1));
    else if (viewMode === "month") setCurrentDate((prev) => addMonths(prev, 1));
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

  // Sync to calendar (.ics download)
  const handleSyncToCalendar = () => {
    if (calendarEvents.length === 0) {
      toast.info("No schedule events to export yet.");
      return;
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatIcs = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Aliko Academy//LMS Student Schedule//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    calendarEvents.forEach((ev) => {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${ev.id}-${Date.now()}@alikohub.com`,
        `DTSTAMP:${formatIcs(new Date())}`,
        `DTSTART:${formatIcs(ev.startTime)}`,
        `DTEND:${formatIcs(ev.endTime)}`,
        `SUMMARY:${ev.title.replace(/[,;]/g, " ")}`,
        `DESCRIPTION:${(ev.description || ev.subtitle || "Aliko Academy scheduled event").replace(/[,;]/g, " ")}`,
        ...(ev.location ? [`LOCATION:${ev.location.replace(/[,;]/g, " ")}`] : []),
        "END:VEVENT",
      );
    });

    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Aliko_Academy_Schedule_${format(new Date(), "yyyyMMdd")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Schedule exported (.ics downloaded) to sync with your calendar!");
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
      default:
        return {
          cardBg: "bg-blue-50/90 hover:bg-blue-100/90 text-blue-950 border-blue-200 border-l-4 border-l-blue-500",
          badgeBg: "bg-blue-100 text-blue-700",
          icon: Calendar,
        };
    }
  };

  const hoursList = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Page Header & Controls ────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/80 flex items-center justify-center shrink-0 shadow-2xs">
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
            {/* View Switcher: Day, Week, Month, List */}
            <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex items-center shadow-2xs">
              {(["day", "week", "month", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                    viewMode === mode
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Sync to calendar */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncToCalendar}
              className="h-9 px-3.5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Sync to calendar
            </Button>

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
                    aria-label="Previous period"
                    className="h-8 px-2.5 text-slate-600 hover:bg-slate-50 border-r border-slate-200 transition-colors flex items-center justify-center"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next period"
                    className="h-8 px-2.5 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <h2 className="text-base font-bold font-heading text-slate-900 m-0">
                  {viewMode === "day" && format(currentDate, "EEEE, MMMM d, yyyy")}
                  {viewMode === "week" &&
                    `${format(weekDays[0], "MMM d")} – ${format(weekDays[6], "MMM d, yyyy")}`}
                  {viewMode === "month" && format(currentDate, "MMMM yyyy")}
                  {viewMode === "list" && "All Upcoming & Scheduled Sessions"}
                </h2>
              </div>

              {isSchedulesLoading && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  Updating...
                </div>
              )}
            </div>

            {/* ── Week View Calendar (V2 Design) ────────────────────────────── */}
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

            {/* ── Day View Agenda ───────────────────────────────────────────── */}
            {viewMode === "day" && (
              <div className="p-5 space-y-3">
                {(() => {
                  const dayEvents = calendarEvents.filter((ev) =>
                    isSameDay(ev.startTime, currentDate),
                  );

                  if (dayEvents.length === 0) {
                    return (
                      <div className="py-16 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 font-heading m-0">
                          No sessions scheduled for this day
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                          You're free on {format(currentDate, "EEEE, MMMM d")}. Check other days or your course outline.
                        </p>
                      </div>
                    );
                  }

                  return dayEvents.map((ev) => {
                    const style = getEventStyle(ev.type);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={cn(
                          "p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs cursor-pointer hover:shadow-xs transition-all",
                          style.cardBg,
                        )}
                      >
                        <div className="space-y-1">
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block",
                              style.badgeBg,
                            )}
                          >
                            {ev.type.replace(/_/g, " ")}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 font-heading m-0">
                            {ev.title}
                          </h4>
                          <p className="text-xs text-slate-600 m-0">
                            {ev.subtitle || ev.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-slate-800 block">
                            {format(ev.startTime, "h:mm a")} — {format(ev.endTime, "h:mm a")}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {ev.location}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* ── Month View ────────────────────────────────────────────────── */}
            {viewMode === "month" && (
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-7 border-b border-slate-100 pb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
                <div className="grid grid-cols-7 border-t border-l border-slate-100">
                  {monthDays.map((day) => {
                    const isCurMonth = isSameMonth(day, currentDate);
                    const today = isToday(day);
                    const dayEvents = calendarEvents.filter((ev) =>
                      isSameDay(ev.startTime, day),
                    );

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => {
                          setCurrentDate(day);
                          setViewMode("day");
                        }}
                        className={cn(
                          "min-h-[75px] sm:min-h-[90px] p-1.5 border-r border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer flex flex-col justify-between",
                          !isCurMonth && "bg-slate-50/40 text-slate-300",
                          today && "bg-orange-50/30",
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center",
                            today
                              ? "bg-[#F16A1C] text-white"
                              : isCurMonth
                                ? "text-slate-700"
                                : "text-slate-400",
                          )}
                        >
                          {format(day, "d")}
                        </span>

                        <div className="space-y-1 mt-1">
                          {dayEvents.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60 truncate"
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-semibold block text-center">
                              +{dayEvents.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── List View (Fallback for full accessibility) ────────────────── */}
            {viewMode === "list" && (
              <div className="p-5 space-y-4">
                {calendarEvents.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    No sessions or shifts on your schedule.
                  </div>
                ) : (
                  calendarEvents.map((ev) => {
                    const style = getEventStyle(ev.type);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={cn(
                          "p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs cursor-pointer hover:shadow-xs transition-all",
                          style.cardBg,
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
                            {format(ev.startTime, "MMM d, yyyy")}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {format(ev.startTime, "h:mm a")} — {format(ev.endTime, "h:mm a")}
                          </span>
                        </div>
                      </div>
                    );
                  })
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
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <h3 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2 m-0">
                  <Gauge className="w-4 h-4 text-[#0A65A0]" />
                  Cohort Pacing Deadlines
                </h3>
                <div className="space-y-2.5">
                  {cohortPacingSummaries.map((report) => {
                    const pacing = report.summary.pacing;
                    const badgeColor =
                      pacing.status === "ON_TRACK"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : pacing.status === "AT_RISK"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200";

                    return (
                      <div
                        key={report.cohortId}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 truncate">
                            {report.courseTitle || `Cohort #${report.cohortId}`}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              badgeColor,
                            )}
                          >
                            {pacing.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            Progress: {pacing.actualProgressPercent}% / {pacing.expectedProgressPercent}%
                          </span>
                          <span className="font-bold text-slate-800">
                            {pacing.daysRemainingInCohort}d left
                          </span>
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
