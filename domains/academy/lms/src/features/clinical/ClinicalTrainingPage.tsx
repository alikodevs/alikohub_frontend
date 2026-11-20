import React, { useState, useMemo } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  Building2,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  FileText,
  BadgeAlert,
  Loader2,
  ChevronRight,
  Info,
  Stethoscope,
  Activity,
  Award,
  MapPin,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useCohortClinicalShifts,
  useStudentClinicalHours,
  useCreateClinicalShiftMutation,
  useRecordClinicalAttendanceMutation,
} from "@/features/rubric/hooks/useClinical";
import { useInstructorCohortsList } from "@/features/rubric/hooks/useSeatTime";
import { useCohortStudents } from "@/features/rubric/hooks/useCohortStudents";
import { usePortalMode } from "@/features/auth/hooks/useAuth";
import type { ClinicalShift, CreateClinicalShiftDto } from "@/features/rubric/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Shift Card Top Border Accent Colors (V1/V2 Design System) ────────────────
const SHIFT_BORDER_COLORS = [
  "border-t-[#0284C7]", // Sky Blue
  "border-t-[#10B981]", // Emerald
  "border-t-[#8B5CF6]", // Violet
  "border-t-[#F59E0B]", // Amber
  "border-t-[#F43F5E]", // Rose
  "border-t-[#06B6D4]", // Cyan
  "border-t-[#EC4899]", // Pink
];

export const ClinicalTrainingPage: React.FC = () => {
  const { user, isInstructorView, canManageStaffActions } = usePortalMode();
  const isInstructorOrAuditor = isInstructorView;

  // Cohort list
  const { data: cohortsData } = useInstructorCohortsList(isInstructorView);
  const cohorts = cohortsData || [];
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const activeCohortId =
    selectedCohortId || (cohorts.length > 0 ? String(cohorts[0].id) : "");

  // Fetch shifts for selected cohort
  const {
    data: shiftsData,
    isLoading: isShiftsLoading,
  } = useCohortClinicalShifts(activeCohortId);
  const shifts: ClinicalShift[] = shiftsData || [];

  const { studentList, studentNameMap } = useCohortStudents(
    activeCohortId,
    isInstructorOrAuditor
  );

  // Student specific hours
  const studentTargetUserId = isInstructorOrAuditor
    ? undefined
    : user?.firebaseId;
  const { data: studentHoursData } = useStudentClinicalHours(
    studentTargetUserId,
    activeCohortId
  );

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");

  // Active selected shift for attendance review
  const [selectedShift, setSelectedShift] = useState<ClinicalShift | null>(null);

  // Create shift dialog state
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hoursCredited, setHoursCredited] = useState<number>(8);

  const createShiftMutation = useCreateClinicalShiftMutation();

  // Record attendance dialog state
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [attendanceStudentUserId, setAttendanceStudentUserId] = useState("");
  const [attendanceHours, setAttendanceHours] = useState<number>(8);
  const [attendancePassed, setAttendancePassed] = useState<boolean>(true);
  const [attendanceNotes, setAttendanceNotes] = useState("");

  const recordAttendanceMutation = useRecordClinicalAttendanceMutation();

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityName.trim() || !shiftDate || !startTime || !endTime || !activeCohortId) {
      toast.error("Please fill in all clinical shift schedule fields.");
      return;
    }

    // Build ISO timestamps
    const startIso = new Date(`${shiftDate}T${startTime}:00`).toISOString();
    const endIso = new Date(`${shiftDate}T${endTime}:00`).toISOString();

    const dto: CreateClinicalShiftDto = {
      cohortId: Number(activeCohortId),
      facilityName: facilityName.trim(),
      shiftDate: new Date(shiftDate).toISOString(),
      startTime: startIso,
      endTime: endIso,
      hoursCredited: Number(hoursCredited) || 0,
    };

    try {
      await createShiftMutation.mutateAsync(dto);
      setIsCreateShiftOpen(false);
      setFacilityName("");
      setShiftDate("");
      setStartTime("");
      setEndTime("");
    } catch {
      // Handled by mutation toast
    }
  };

  const handleOpenRecordAttendance = (shift: ClinicalShift, studentId?: string) => {
    setSelectedShift(shift);
    setAttendanceStudentUserId(studentId || (studentList[0]?.userId ?? ""));
    setAttendanceHours(shift.hoursCredited || 0);
    setAttendancePassed(true);
    setAttendanceNotes("");
    setIsAttendanceDialogOpen(true);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedShift) return;
    if (!attendanceStudentUserId) {
      toast.error("Please select a student for attendance.");
      return;
    }

    try {
      await recordAttendanceMutation.mutateAsync({
        shiftId: selectedShift.id,
        studentUserId: attendanceStudentUserId,
        hoursCompleted: Number(attendanceHours) || 0,
        competencyNotes: attendanceNotes.trim() || undefined,
        passed: attendancePassed,
      });
      setIsAttendanceDialogOpen(false);
    } catch {
      // Handled by mutation toast
    }
  };

  // Calculations from dynamic data
  const minRequiredHours = studentHoursData?.minimumRequired ?? 40;
  const completedHours = studentHoursData?.totalHoursCompleted ?? 0;
  const totalScheduledShiftHours = useMemo(() => {
    return shifts.reduce((sum, sh) => sum + (Number(sh.hoursCredited) || 0), 0);
  }, [shifts]);

  // Aggregate facility statistics
  const facilitiesStats = useMemo(() => {
    const map = new Map<string, { shiftCount: number; totalHours: number }>();
    shifts.forEach((s) => {
      const name = s.facilityName?.trim() || "Unspecified Facility";
      const existing = map.get(name) || { shiftCount: 0, totalHours: 0 };
      map.set(name, {
        shiftCount: existing.shiftCount + 1,
        totalHours: existing.totalHours + (Number(s.hoursCredited) || 0),
      });
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [shifts]);

  const uniqueFacilitiesCount = facilitiesStats.length;

  const progressPercent =
    studentHoursData?.completionPercent !== undefined
      ? Math.min(100, Math.round(studentHoursData.completionPercent))
      : minRequiredHours > 0
      ? Math.min(100, Math.round((completedHours / minRequiredHours) * 100))
      : 0;

  // Filtered shifts based on search and tab
  const filteredShifts = useMemo(() => {
    const now = new Date();
    return shifts.filter((shift) => {
      // Search matching
      const matchesSearch =
        !searchQuery.trim() ||
        shift.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        new Date(shift.shiftDate).toLocaleDateString().includes(searchQuery);

      if (!matchesSearch) return false;

      // Tab filter
      if (activeFilterTab === "UPCOMING") {
        return new Date(shift.shiftDate) >= now;
      }
      if (activeFilterTab === "PAST") {
        return new Date(shift.shiftDate) < now;
      }
      return true;
    });
  }, [shifts, searchQuery, activeFilterTab]);

  const content = (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Bar matching V1/V2 design */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#0284C7] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#0284C7]" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-semibold tracking-tight text-slate-900">
                  Clinical Training &amp; Rotations
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Direct resident care, partner facility rotations, and RN supervision under WAC 246-841A-440
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => {
                toast.info("Clinical rotation hours are scheduled directly with your RN instructor.");
              }}
              variant="outline"
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium text-xs h-9 rounded-xl shadow-xs px-4"
            >
              <Info className="w-4 h-4 mr-1.5 text-slate-500" /> Clinical Policy
            </Button>

            {canManageStaffActions && (
              <Button
                onClick={() => setIsCreateShiftOpen(true)}
                className="bg-primary hover:bg-[#084B78] text-white font-medium text-xs h-9 rounded-xl shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Schedule Shift
              </Button>
            )}
          </div>
        </div>

        {/* 4 Colored/Vivid KPI Stat Tiles (Admissions Consistency) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Verified Clinical Hours (Emerald theme) */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-[#049569] to-[#10B981] text-white transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-100">
                {isInstructorOrAuditor ? "Scheduled Hours" : "Verified Clinical Hours"}
              </span>
              <span className="text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                {isInstructorOrAuditor ? `${shifts.length} shifts` : `${progressPercent}%`}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="text-3xl font-heading font-semibold text-white tracking-tight">
                {isInstructorOrAuditor ? totalScheduledShiftHours : completedHours}
              </div>
              <span className="text-xs text-emerald-100/90 font-medium">
                {isInstructorOrAuditor
                  ? "total hrs"
                  : `/ ${minRequiredHours} hrs required`}
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 font-medium">
              {isInstructorOrAuditor
                ? "Total clinical time in cohort"
                : studentHoursData?.meetsMinimum
                ? "State 40-hour requirement completed"
                : `${Math.max(0, minRequiredHours - completedHours).toFixed(1)} hrs left to complete`}
            </p>
          </div>

          {/* Card 2: Clinical Shifts / Rotations (Amber theme) */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-[#E98A00] to-[#F59E0B] text-white transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-100">
                {isInstructorOrAuditor ? "Clinical Shifts" : "Completed Shifts"}
              </span>
              <Calendar className="w-4 h-4 text-amber-100" />
            </div>
            <div className="text-3xl font-heading font-semibold text-white tracking-tight">
              {isInstructorOrAuditor
                ? shifts.length
                : studentHoursData?.passedShifts ?? studentHoursData?.shifts?.length ?? 0}
            </div>
            <p className="text-xs text-amber-100/90 font-medium">
              {isInstructorOrAuditor
                ? "Scheduled facility rotations"
                : `${studentHoursData?.totalShifts ?? shifts.length} total shifts scheduled`}
            </p>
          </div>

          {/* Card 3: Partner Facilities (Sky Blue theme) */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-[#0183C7] to-[#38BDF8] text-white transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-sky-100">
                Partner Facilities
              </span>
              <Building2 className="w-4 h-4 text-sky-100" />
            </div>
            <div className="text-3xl font-heading font-semibold text-white tracking-tight">
              {uniqueFacilitiesCount}
            </div>
            <p className="text-xs text-sky-100/90 font-medium">
              Contracted healthcare facilities
            </p>
          </div>

          {/* Card 4: Status / Enrolled Students (Violet theme) */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-violet-100">
                {isInstructorOrAuditor ? "Enrolled Students" : "WABON Compliance"}
              </span>
              <Award className="w-4 h-4 text-violet-100" />
            </div>
            <div className="text-2xl font-heading font-semibold text-white tracking-tight">
              {isInstructorOrAuditor
                ? `${studentList.length} Students`
                : studentHoursData?.meetsMinimum
                ? "Requirement Met"
                : "In Progress"}
            </div>
            <p className="text-xs text-violet-100/90 font-medium">
              {isInstructorOrAuditor
                ? "Active cohort roster"
                : "10:1 Student-to-RN Ratio Max"}
            </p>
          </div>
        </div>

        {/* ── Main V2 Split Layout: Content (8 Cols) + Sidebar (4 Cols) ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Left Column: Shifts Roster & Verified Hours (8 cols) ─────────── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Instructor Cohort Selector */}
            {isInstructorOrAuditor && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="w-full sm:w-64">
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Active Cohort
                    </label>
                    <Select value={activeCohortId || undefined} onValueChange={setSelectedCohortId}>
                      <SelectTrigger className="bg-white border-slate-200 text-xs font-medium h-9 rounded-xl">
                        <SelectValue placeholder={cohorts.length > 0 ? "Select Cohort" : "No cohorts found"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cohorts.map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name || `Cohort #${c.id}`}
                          </SelectItem>
                        ))}
                        {cohorts.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-500">
                            No cohorts found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-xs font-medium text-slate-500 self-end pb-2">
                    Enrolled: <strong className="text-slate-900">{studentList.length}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <Building2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Total Scheduled: <strong className="font-semibold text-slate-900">{shifts.length} Shifts</strong></span>
                </div>
              </div>
            )}

            {/* Filter Pills & Search */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Neutral Filter Pills (V2 Pattern) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {(
                    [
                      { id: "ALL", label: "All Shifts" },
                      { id: "UPCOMING", label: "Upcoming" },
                      { id: "PAST", label: "Completed / Past" },
                    ] as const
                  ).map((tab) => {
                    const isSelected = activeFilterTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveFilterTab(tab.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0",
                          isSelected
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                        )}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search facility or date…"
                    className="pl-9 h-9 text-xs bg-white border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Shifts Cards Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-heading font-semibold text-slate-900">
                  Healthcare Facility Rotations &amp; Shifts
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {filteredShifts.length} of {shifts.length} Shift(s)
                </span>
              </div>

              {isShiftsLoading ? (
                <div className="p-16 text-center text-slate-400 bg-white border border-slate-200/80 rounded-2xl">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">Loading clinical shifts…</p>
                </div>
              ) : filteredShifts.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl space-y-2">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-700">No Clinical Shifts Found</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {searchQuery || activeFilterTab !== "ALL"
                      ? "No shifts matched your search filters."
                      : "Clinical shifts will be scheduled here at contracted healthcare facilities."}
                  </p>
                  {(searchQuery || activeFilterTab !== "ALL") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveFilterTab("ALL");
                      }}
                      className="text-xs font-medium h-8 rounded-xl mt-2"
                    >
                      Reset Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredShifts.map((shift, idx) => {
                    const enrolledCount = shift.studentRoster?.length || shift._count?.studentRoster || 0;
                    const borderColor = SHIFT_BORDER_COLORS[idx % SHIFT_BORDER_COLORS.length];

                    return (
                      <div
                        key={shift.id}
                        className={cn(
                          "rounded-2xl border border-slate-200/80 border-t-4 bg-white p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4",
                          borderColor
                        )}
                      >
                        <div className="space-y-3">
                          {/* Top Row: Hours Credited & Enrolled count */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1E40AF] border border-blue-200/80">
                              {shift.hoursCredited} Hours Credited
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {enrolledCount} Enrolled
                            </span>
                          </div>

                          {/* Facility Name & Details */}
                          <div>
                            <h3 className="text-sm font-heading font-semibold text-slate-900 flex items-center gap-1.5 leading-snug">
                              <Building2 className="w-4 h-4 text-primary shrink-0" />
                              {shift.facilityName}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {new Date(shift.shiftDate).toLocaleDateString(undefined, {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {new Date(shift.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                              {new Date(shift.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>

                          {/* Attended Roster Preview */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 space-y-1.5">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                              Attended Roster ({enrolledCount})
                            </span>
                            {shift.studentRoster && shift.studentRoster.length > 0 ? (
                              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                {shift.studentRoster.map((att) => {
                                  const uid = String(att.student?.userId || att.userId || "");
                                  const displayName = studentNameMap.get(uid) || "Enrolled Student";
                                  return (
                                    <div key={att.id} className="flex items-center justify-between text-[11px]">
                                      <span className="truncate max-w-[140px] text-slate-700 font-medium">
                                        {displayName}
                                      </span>
                                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        {att.hoursCompleted}h • {att.passed ? "Passed" : "Incomplete"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No attendance recorded yet</span>
                            )}
                          </div>
                        </div>

                        {/* Action Row */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-medium">
                            RN Supervision Sign-off
                          </span>
                          {canManageStaffActions ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenRecordAttendance(shift)}
                              className="h-8 text-xs font-semibold rounded-lg bg-primary hover:bg-[#084B78] text-white shrink-0 shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                              Verify Attendance
                            </Button>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                              Supervised Rotation
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Student Verified Shifts Table */}
            {!isInstructorOrAuditor && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-heading font-semibold text-slate-900">
                      Verified Clinical Attendance History
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Direct patient care signed by your RN clinical evaluator
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200">
                    {completedHours} / {minRequiredHours} hrs
                  </Badge>
                </div>

                {studentHoursData?.shifts && studentHoursData.shifts.length > 0 ? (
                  <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {studentHoursData.shifts.map((s, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white hover:bg-slate-50/50 transition-colors">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-900 block">{s.facilityName}</span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {new Date(s.shiftDate).toLocaleDateString()} • {s.hoursCompleted} hours verified
                            {s.signedBy ? ` • Evaluated by ${s.signedBy}` : ""}
                          </span>
                          {s.competencyNotes && (
                            <p className="text-[11px] text-slate-600 mt-1 italic">
                              "{s.competencyNotes}"
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-[#DCFCE7] text-[#15803D] border-emerald-200/80 font-semibold text-[10px] px-2.5 py-0.5 rounded-full shrink-0">
                          {s.passed ? "Verified / Passed" : "Incomplete"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-500 font-medium">
                    No clinical attendance verified yet. Your clinical shifts will appear here once recorded by your RN evaluator.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Column: V2 Companion Sidebar (4 cols) ───────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Clinical Progress & WABON 40h Clearance */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 font-heading">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Clinical Clearance
                </span>
                <Badge
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    studentHoursData?.meetsMinimum
                      ? "bg-[#DCFCE7] text-[#15803D] border border-emerald-200/80"
                      : "bg-[#EFF6FF] text-[#1E40AF] border border-blue-200/80"
                  )}
                >
                  {studentHoursData?.meetsMinimum ? "Requirement Met" : "In Progress"}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>{completedHours} verified hours</span>
                  <span>{progressPercent}% of {minRequiredHours}h</span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-slate-100" />
              </div>

              {/* Clearance Checkpoints */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className={cn("w-3.5 h-3.5", completedHours >= 40 ? "text-emerald-600" : "text-slate-300")} />
                    40h Direct Care
                  </span>
                  <span className="font-semibold text-slate-900">
                    {completedHours >= 40 ? "Complete" : `${Math.max(0, 40 - completedHours).toFixed(1)}h left`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Skills Lab Prerequisite
                  </span>
                  <span className="font-semibold text-emerald-700">Verified</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className={cn("w-3.5 h-3.5", (studentHoursData?.passedShifts || 0) > 0 ? "text-emerald-600" : "text-slate-300")} />
                    RN Supervised Shifts
                  </span>
                  <span className="font-semibold text-slate-900">
                    {studentHoursData?.passedShifts ?? studentHoursData?.shifts?.length ?? 0} signed
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Contracted Healthcare Partner Facilities */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 font-heading">
                  <Building2 className="w-4 h-4 text-primary" />
                  Contracted Facilities
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {facilitiesStats.length} Partner(s)
                </span>
              </div>

              {facilitiesStats.length > 0 ? (
                <div className="space-y-2">
                  {facilitiesStats.map((fac, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-slate-900 block truncate">
                          {fac.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {fac.shiftCount} scheduled shift{fac.shiftCount > 1 ? "s" : ""}
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 shrink-0 text-[10px]">
                        {fac.totalHours} hrs total
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-500">
                  No contracted facilities assigned to current cohort.
                </div>
              )}
            </div>

            {/* Card 3: Official WABON Direct Resident Care Standard Notice */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-heading font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                WABON WAC 246-841A-440 Standard
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Direct resident care must be supervised in person by an approved RN clinical instructor at a maximum <strong>10:1 student-to-instructor ratio</strong>. Self-reported or unsupervised hours are strictly void.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  ● 10:1 Max Ratio
                </span>
                <span className="text-[10px] font-medium text-blue-800 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                  ● 40 Hours Required
                </span>
                <span className="text-[10px] font-medium text-purple-800 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full">
                  ● RN Supervision
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Clinical Shift Dialog */}
        <Dialog open={isCreateShiftOpen} onOpenChange={setIsCreateShiftOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle className="text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Schedule Clinical Training Shift
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Schedule a direct patient care rotation at an approved healthcare facility.
            </DialogDescription>

            <form onSubmit={handleCreateShift} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Healthcare Facility Name
                </label>
                <Input
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="e.g., Cascade Valley Senior Living Center"
                  className="h-9 text-xs bg-white border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Shift Date
                </label>
                <Input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="h-9 text-xs bg-white border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Start Time
                  </label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-9 text-xs bg-white border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    End Time
                  </label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-9 text-xs bg-white border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Credited Clinical Hours (Max 12.0)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  step={0.5}
                  value={hoursCredited}
                  onChange={(e) => setHoursCredited(Number(e.target.value))}
                  className="h-9 text-xs bg-white border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateShiftOpen(false)}
                  className="h-9 text-xs font-medium rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createShiftMutation.isPending}
                  className="h-9 text-xs font-semibold bg-primary hover:bg-[#084B78] text-white rounded-xl shadow-xs"
                >
                  {createShiftMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-1.5" />
                  )}
                  Create Shift
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Record Attendance Dialog */}
        <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle className="text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Verify Clinical Attendance &amp; Direct Care
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              {selectedShift?.facilityName} • {selectedShift ? new Date(selectedShift.shiftDate).toLocaleDateString() : ""}
            </DialogDescription>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Student to Verify
                </label>
                <Select
                  value={attendanceStudentUserId || undefined}
                  onValueChange={setAttendanceStudentUserId}
                >
                  <SelectTrigger className="bg-white border-slate-200 text-xs font-medium h-9 rounded-xl">
                    <SelectValue placeholder={studentList.length > 0 ? "Select Student" : "No enrolled students found"} />
                  </SelectTrigger>
                  <SelectContent>
                    {studentList.map((s: any) => (
                      <SelectItem key={s.userId} value={s.userId}>
                        {s.name}
                      </SelectItem>
                    ))}
                    {studentList.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-500">
                        No enrolled students found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Hours Completed
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={12}
                    step={0.5}
                    value={attendanceHours}
                    onChange={(e) => setAttendanceHours(Number(e.target.value))}
                    className="h-9 text-xs bg-white border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Competency Evaluation
                  </label>
                  <Select
                    value={attendancePassed ? "true" : "false"}
                    onValueChange={(val) => setAttendancePassed(val === "true")}
                  >
                    <SelectTrigger className="bg-white border-slate-200 text-xs font-medium h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Satisfactory (Passed)</SelectItem>
                      <SelectItem value="false">Unsatisfactory (Incomplete)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Clinical Observation &amp; Care Notes
                </label>
                <Textarea
                  value={attendanceNotes}
                  onChange={(e) => setAttendanceNotes(e.target.value)}
                  placeholder="Observed resident transfers, vitals measurement, infection control..."
                  rows={3}
                  className="text-xs bg-white border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAttendanceDialogOpen(false)}
                  className="h-9 text-xs font-medium rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={recordAttendanceMutation.isPending}
                  onClick={handleSubmitAttendance}
                  className="h-9 text-xs font-semibold bg-primary hover:bg-[#084B78] text-white rounded-xl shadow-xs"
                >
                  {recordAttendanceMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  )}
                  Verify &amp; Save Attendance
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  if (isInstructorOrAuditor) {
    return <InstructorLayout>{content}</InstructorLayout>;
  }
  return <StudentLayout>{content}</StudentLayout>;
};

export default ClinicalTrainingPage;
