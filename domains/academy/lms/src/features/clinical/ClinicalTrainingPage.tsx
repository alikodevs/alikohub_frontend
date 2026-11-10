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
import { useCohortStudents } from "@/features/rubric/hooks/useCohortStudents";
import { usePortalMode } from "@/features/auth/hooks/useAuth";
import type { ClinicalShift, CreateClinicalShiftDto } from "@/features/rubric/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

  const minRequiredHours = studentHoursData?.minimumRequired ?? 0;
  const completedHours = studentHoursData?.totalHoursCompleted ?? 0;
  const totalScheduledShiftHours = shifts.reduce(
    (sum, sh) => sum + (Number(sh.hoursCredited) || 0),
    0
  );
  const progressPercent =
    studentHoursData?.completionPercent !== undefined
      ? Math.min(100, Math.round(studentHoursData.completionPercent))
      : minRequiredHours > 0
      ? Math.min(100, Math.round((completedHours / minRequiredHours) * 100))
      : 0;

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
                Clinical Training, Attendance &amp; Supervision
              </h1>
              <p className="text-xs text-slate-500">
                In-Person Clinical Patient Care Attendance, Site Assignments &amp; Supervision.
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Hours Summary Card */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {isInstructorOrAuditor ? "Scheduled Shift Hours" : "Verified Clinical Hours"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">
                  {isInstructorOrAuditor ? totalScheduledShiftHours : completedHours}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {isInstructorOrAuditor
                    ? `hrs (${shifts.length} shifts)`
                    : minRequiredHours > 0
                    ? `/ ${minRequiredHours} hrs`
                    : "hrs"}
                </span>
              </div>
            </div>
          </div>

          {canManageStaffActions && (
            <Button
              onClick={() => setIsCreateShiftOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Schedule Clinical Shift
            </Button>
          )}
        </div>
      </div>

      {/* Prerequisite Gate Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-900">
          <p className="font-bold">
            Clinical Standards &amp; Prerequisite Gate:
          </p>
          <p className="text-amber-800 leading-relaxed">
            In-person clinical shifts require skills lab clearance and supervising RN verification at approved healthcare facilities.
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
                studentHoursData?.meetsMinimum
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 text-white"
              )}
            >
              {studentHoursData?.meetsMinimum
                ? "REQUIREMENT COMPLETED"
                : minRequiredHours > 0
                ? `${Math.max(0, minRequiredHours - completedHours).toFixed(1)} Hours Remaining`
                : `${completedHours} Hours Logged`}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>{completedHours} verified hours completed</span>
              {minRequiredHours > 0 && (
                <span>{progressPercent}% of {minRequiredHours}h required</span>
              )}
            </div>
            {minRequiredHours > 0 && (
              <Progress value={progressPercent} className="h-2.5 bg-slate-100" />
            )}
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
            <Select value={activeCohortId || undefined} onValueChange={setSelectedCohortId}>
              <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
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

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Building2 className="w-4 h-4 text-primary" />
            <span>Total Scheduled Shifts: <strong>{shifts.length}</strong></span>
          </div>
        </div>
      )}

      {/* Clinical Shifts Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Approved Healthcare Facility Shifts &amp; Supervision Roster
          </h2>
          <span className="text-xs text-slate-500">
            {shifts.length} Shift(s) Scheduled
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
              Schedule clinical shifts at contracted long-term care and healthcare facilities to begin tracking verified clinical hours.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shifts.map((shift) => {
              const enrolledCount = shift.studentRoster?.length || shift._count?.studentRoster || 0;

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
                        className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 text-slate-700 border-slate-200"
                      >
                        {enrolledCount} Enrolled
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
                          {shift.studentRoster.map((att) => {
                            const uid = String(att.student?.userId || att.userId || "");
                            const displayName = studentNameMap.get(uid) || "Enrolled Student";
                            return (
                              <div key={att.id} className="flex items-center justify-between text-[11px]">
                                <span className="truncate max-w-[140px] text-slate-700 font-medium">
                                  {displayName}
                                </span>
                                <Badge variant="outline" className="text-[9px] bg-white border-slate-200">
                                  {att.hoursCompleted}h • {att.passed ? "Passed" : "Incomplete"}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No attendance recorded yet</span>
                      )}
                    </div>
                  </div>

                  {/* Instructor Action */}
                  {canManageStaffActions && (
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
            Schedule a direct patient care rotation at an approved healthcare facility.
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
                value={attendanceStudentUserId || undefined}
                onValueChange={setAttendanceStudentUserId}
              >
                <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
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
