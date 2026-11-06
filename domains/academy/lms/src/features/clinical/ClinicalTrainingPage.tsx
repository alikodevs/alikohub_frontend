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
import { useUser } from "@/features/auth/hooks/useAuth";
import type { ClinicalShift, CreateClinicalShiftDto } from "@/features/rubric/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const ClinicalTrainingPage: React.FC = () => {
  const { data: user } = useUser();
  const role = (
    user?.academyUser?.role ||
    user?.globalRole ||
    ""
  ).toUpperCase();
  const isInstructorOrAuditor =
    role === "INSTRUCTOR" ||
    role === "ADMIN" ||
    role === "COURSE_MANAGER" ||
    role === "COMMISSION_AUDITOR";

  // Cohort list
  const { data: cohortsData } = useInstructorCohortsList();
  const cohorts = cohortsData || [];
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const activeCohortId =
    selectedCohortId || (cohorts.length > 0 ? String(cohorts[0].id) : "1");

  // Fetch shifts for selected cohort
  const {
    data: shiftsData,
    isLoading: isShiftsLoading,
  } = useCohortClinicalShifts(activeCohortId);
  const shifts: ClinicalShift[] = shiftsData || [];

  // Fetch cohort enrollments for instructor roster picker
  const { data: enrollmentsData } = useQuery({
    queryKey: ["cohort-enrollments", activeCohortId],
    queryFn: async () => {
      const res = await api.get(`/enrollments/cohort/${activeCohortId}`);
      return res.data;
    },
    enabled: Boolean(isInstructorOrAuditor && activeCohortId),
  });

  const studentList = useMemo(() => {
    const list = Array.isArray(enrollmentsData)
      ? enrollmentsData
      : enrollmentsData?.enrollments || [];
    return list.map((e: any) => ({
      userId: e.userId || e.profile?.userId || String(e.id),
      name:
        e.user
          ? `${e.user.firstname || ""} ${e.user.lastname || ""}`.trim() || e.user.email
          : e.profile
          ? `${e.profile.user?.firstname || ""} ${e.profile.user?.lastname || ""}`.trim() || e.userId
          : `Student ${e.userId?.slice?.(0, 8) || e.id}`,
    }));
  }, [enrollmentsData]);

  // Student specific hours
  const studentTargetUserId = isInstructorOrAuditor
    ? undefined
    : user?.firebaseId;
  const { data: studentHoursData } = useStudentClinicalHours(
    studentTargetUserId,
    activeCohortId
  );

  // Active selected shift for attendance review
  const [selectedShift, setSelectedShift] = useState<ClinicalShift | null>(
    null
  );

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
    if (!facilityName.trim() || !shiftDate || !startTime || !endTime) {
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
      hoursCredited: Number(hoursCredited) || 8,
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
    setAttendanceHours(shift.hoursCredited || 8);
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
        competencyNotes: attendanceNotes.trim() || "Demonstrated clinical competency in direct resident care.",
        passed: attendancePassed,
      });
      setIsAttendanceDialogOpen(false);
    } catch {
      // Handled by mutation toast
    }
  };

  // 40 Required Hours calculation
  const MIN_REQUIRED_HOURS = 40.0;
  const completedHours = studentHoursData?.totalHoursCompleted ?? 0;
  const progressPercent = Math.min(
    100,
    Math.round((completedHours / MIN_REQUIRED_HOURS) * 100)
  );

  const content = (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Clinical Training, Attendance & Supervision
              </h1>
              <p className="text-xs text-slate-500">
                WAC 246-841A Mandate: 40.0 In-Person Clinical Patient Care Hours | Strict 10:1 Student-to-Instructor Ratio.
              </p>
            </div>
          </div>
        </div>

        {/* 40 Clinical Hours Card */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Clinical Hours Minimum
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">
                  {isInstructorOrAuditor ? "40.0" : completedHours}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  / 40.0 hrs
                </span>
              </div>
            </div>
          </div>

          {isInstructorOrAuditor && (
            <Button
              onClick={() => setIsCreateShiftOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Schedule Clinical Shift
            </Button>
          )}
        </div>
      </div>

      {/* Statutory Regulatory Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-900">
          <p className="font-bold">
            WAC 246-841A Clinical Standards & Prerequisite Gate:
          </p>
          <p className="text-amber-800 leading-relaxed">
            1. All 22 Skills Lab checkoffs must be passed with RN sign-off prior to entering clinical direct patient care.
            <br />
            2. Faculty ratio is capped at a strict maximum of <strong>10 students per 1 RN clinical instructor</strong>.
            <br />
            3. Online seat-time does <strong>not</strong> count towards clinical training. All 40 hours must be completed in-person at an approved healthcare facility.
          </p>
        </div>
      </div>

      {/* Student Personal Hours Dashboard */}
      {!isInstructorOrAuditor && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Your Clinical Training Progress
              </h2>
              <p className="text-xs text-slate-500">
                Supervised direct resident care at contracted healthcare facilities.
              </p>
            </div>
            <Badge
              className={cn(
                "text-xs px-3 py-1 font-bold",
                completedHours >= MIN_REQUIRED_HOURS
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 text-white"
              )}
            >
              {completedHours >= MIN_REQUIRED_HOURS
                ? "40 HOURS COMPLETED"
                : `${(MIN_REQUIRED_HOURS - completedHours).toFixed(1)} Hours Needed`}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>{completedHours} verified hours completed</span>
              <span>{progressPercent}% of 40h standard</span>
            </div>
            <Progress value={progressPercent} className="h-2.5 bg-slate-100" />
          </div>

          {/* Student Shifts Table */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Verified Clinical Shifts
            </h3>
            {studentHoursData?.shifts && studentHoursData.shifts.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {studentHoursData.shifts.map((s, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white">
                    <div>
                      <span className="font-bold text-slate-900 block">{s.facilityName}</span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(s.shiftDate).toLocaleDateString()} • {s.hoursCompleted} hours verified
                      </span>
                      {s.competencyNotes && (
                        <p className="text-[11px] text-slate-600 mt-1 italic">
                          "{s.competencyNotes}"
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold text-[10px]">
                      PASSED / VERIFIED
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-500">
                No clinical attendance verified yet. Your clinical schedule will appear below once shifts are assigned.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cohort Selector (Instructor View) */}
      {isInstructorOrAuditor && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-72">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Select Cohort
            </label>
            <Select value={activeCohortId} onValueChange={setSelectedCohortId}>
              <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
                <SelectValue placeholder="Select Cohort" />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name || `Cohort #${c.id}`}
                  </SelectItem>
                ))}
                {cohorts.length === 0 && (
                  <SelectItem value="1">Cohort 1 (Default)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Building2 className="w-4 h-4 text-primary" />
            <span>Total Scheduled Shifts: <strong>{shifts.length}</strong></span>
          </div>
        </div>
      )}

      {/* Clinical Shifts Roster & Ratio Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Approved Healthcare Facility Shifts & Supervision Roster
          </h2>
          <span className="text-xs text-slate-500">
            Ratio Cap: Max 10 Students per Supervising RN
          </span>
        </div>

        {isShiftsLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading clinical shifts...</p>
          </div>
        ) : shifts.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Clinical Shifts Scheduled</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Schedule clinical shifts at contracted long-term care and healthcare facilities to begin tracking the required 40.0 clinical hours.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shifts.map((shift) => {
              const enrolledCount = shift.studentRoster?.length || shift._count?.studentRoster || 0;
              const isAtCapacity = enrolledCount >= 10;

              return (
                <div
                  key={shift.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {shift.hoursCredited} Hours Credited
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5",
                          isAtCapacity
                            ? "bg-rose-50 text-rose-700 border-rose-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-300"
                        )}
                      >
                        {enrolledCount}/10 Students ({isAtCapacity ? "AT CAPACITY" : "OPEN"})
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        {shift.facilityName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(shift.shiftDate).toLocaleDateString()}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{" "}
                        {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Roster Preview */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Attended Roster ({enrolledCount})
                      </span>
                      {shift.studentRoster && shift.studentRoster.length > 0 ? (
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {shift.studentRoster.map((att) => (
                            <div key={att.id} className="flex items-center justify-between text-[11px]">
                              <span className="truncate max-w-[140px] text-slate-700 font-medium">
                                {att.student?.userId || att.userId}
                              </span>
                              <Badge variant="outline" className="text-[9px] bg-white border-slate-200">
                                {att.hoursCompleted}h • {att.passed ? "Passed" : "Incomplete"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No attendance recorded yet</span>
                      )}
                    </div>
                  </div>

                  {/* Instructor Action */}
                  {isInstructorOrAuditor && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        RN Supervision Sign-off
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleOpenRecordAttendance(shift)}
                        className="h-8 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                        Verify Attendance
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Clinical Shift Dialog */}
      <Dialog open={isCreateShiftOpen} onOpenChange={setIsCreateShiftOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Schedule Clinical Training Shift
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Schedule a direct patient care rotation at an approved healthcare facility. Max 10 students per instructor.
          </DialogDescription>

          <form onSubmit={handleCreateShift} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Healthcare Facility Name
              </label>
              <Input
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="e.g., Cascade Valley Senior Living Center"
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Shift Date
              </label>
              <Input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Start Time
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  End Time
                </label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Credited Clinical Hours (Max 12.0)
              </label>
              <Input
                type="number"
                min={1}
                max={12}
                step={0.5}
                value={hoursCredited}
                onChange={(e) => setHoursCredited(Number(e.target.value))}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateShiftOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createShiftMutation.isPending}
                className="h-9 text-xs font-bold bg-primary text-white"
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
          <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Verify Clinical Attendance & Direct Care
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {selectedShift?.facilityName} • {selectedShift ? new Date(selectedShift.shiftDate).toLocaleDateString() : ""}
          </DialogDescription>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Student to Verify
              </label>
              <Select
                value={attendanceStudentUserId}
                onValueChange={setAttendanceStudentUserId}
              >
                <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {studentList.map((s: any) => (
                    <SelectItem key={s.userId} value={s.userId}>
                      {s.name}
                    </SelectItem>
                  ))}
                  {studentList.length === 0 && (
                    <SelectItem value="student-1">Default Student</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Hours Completed
                </label>
                <Input
                  type="number"
                  min={0}
                  max={12}
                  step={0.5}
                  value={attendanceHours}
                  onChange={(e) => setAttendanceHours(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Competency Evaluation
                </label>
                <Select
                  value={attendancePassed ? "true" : "false"}
                  onValueChange={(val) => setAttendancePassed(val === "true")}
                >
                  <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
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
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Clinical Observation & Resident Care Notes
              </label>
              <Textarea
                value={attendanceNotes}
                onChange={(e) => setAttendanceNotes(e.target.value)}
                placeholder="Observed resident transfers, vitals measurement, infection control compliance, communication with preceptors..."
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAttendanceDialogOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={recordAttendanceMutation.isPending}
                onClick={handleSubmitAttendance}
                className="h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {recordAttendanceMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                )}
                Verify & Save Attendance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isInstructorOrAuditor) {
    return <InstructorLayout>{content}</InstructorLayout>;
  }
  return <StudentLayout>{content}</StudentLayout>;
};

export default ClinicalTrainingPage;
