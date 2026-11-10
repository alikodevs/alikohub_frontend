import React, { useState, useMemo } from "react";
import {
  Clock,
  ShieldCheck,
  Download,
  Search,
  Eye,
  CheckCircle2,
  Users,
  Layers,
  Loader2,
  BookOpen,
  Activity,
  PauseCircle,
  Info,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  useCohortSeatTimeReport,
  useInstructorCohortsList,
  useStudentCourseSeatTime,
} from "@/features/rubric/hooks/useSeatTime";
import type { StudentSeatTimeRecord } from "@/features/rubric/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface SeatTimeAuditTableProps {
  cohortId?: string | number;
  courseId?: string | number;
  className?: string;
}

export const SeatTimeAuditTable: React.FC<SeatTimeAuditTableProps> = ({
  cohortId: propCohortId,
  courseId: propCourseId,
  className,
}) => {
  const { data: instructorCohorts, isLoading: isCohortsLoading } = useInstructorCohortsList();

  const [selectedCohortId, setSelectedCohortId] = useState<string | number | undefined>(propCohortId);

  // Automatically select first cohort if not provided via props
  const effectiveCohortId = useMemo(() => {
    if (propCohortId) return propCohortId;
    if (selectedCohortId) return selectedCohortId;
    if (instructorCohorts && instructorCohorts.length > 0) {
      return instructorCohorts[0].id;
    }
    return undefined;
  }, [propCohortId, selectedCohortId, instructorCohorts]);

  const effectiveCourseId = useMemo(() => {
    if (propCourseId) return propCourseId;
    if (instructorCohorts && instructorCohorts.length > 0) {
      const match = instructorCohorts.find((c: any) => c.id === effectiveCohortId);
      return match ? match.courseId : instructorCohorts[0].courseId;
    }
    return undefined;
  }, [propCourseId, effectiveCohortId, instructorCohorts]);

  const { data: report, isLoading: isReportLoading } = useCohortSeatTimeReport(
    effectiveCohortId,
    effectiveCourseId
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "COMPLIANT" | "IN_PROGRESS">("ALL");
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<StudentSeatTimeRecord | null>(null);

  const { data: studentBreakdown, isLoading: isBreakdownLoading } = useStudentCourseSeatTime(
    effectiveCourseId || selectedRecordForDetail?.courseId,
    selectedRecordForDetail?.userId
  );

  const formatHours = (seconds: number) => {
    const hrs = seconds / 3600;
    return `${hrs.toFixed(1)} hrs`;
  };

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const filteredRecords = useMemo(() => {
    if (!report?.students) return [];

    return report.students.filter((rec) => {
      const matchesSearch =
        rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.studentEmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.userId.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === "COMPLIANT") return rec.isCompliant;
      if (filterStatus === "IN_PROGRESS") return !rec.isCompliant;

      return true;
    });
  }, [report?.students, searchQuery, filterStatus]);

  const latestActivity = useMemo(() => {
    if (!studentBreakdown?.lessons || studentBreakdown.lessons.length === 0) return null;
    const timestamps = studentBreakdown.lessons
      .filter((l: any) => l.lastActivity)
      .map((l: any) => new Date(l.lastActivity).getTime());
    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps));
  }, [studentBreakdown?.lessons]);

  const handleExportCSV = () => {
    if (!report?.students || report.students.length === 0) {
      toast.error("No seat-time records available to export.");
      return;
    }

    const headers = [
      "User ID",
      "Student Name",
      "Email",
      "Course",
      "Cohort",
      "Active Theory Hours",
      "Active Theory Minutes",
      "WABON 50h Status",
      "Enrollment Status",
      "Enrolled Date",
    ];

    const rows = report.students.map((r) => [
      `"${r.userId}"`,
      `"${r.studentName}"`,
      r.studentEmail || "",
      `"${r.courseTitle || "NA-C Theory"}"`,
      `"${r.cohortName || "Cohort"}"`,
      (r.totalActiveTimeSeconds / 3600).toFixed(2),
      r.totalActiveTimeMinutes,
      r.isCompliant ? "COMPLIANT" : "IN_PROGRESS",
      r.enrollmentStatus || "ACTIVE",
      r.enrolledAt ? `"${new Date(r.enrolledAt).toLocaleDateString()}"` : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `seat_time_report_cohort_${effectiveCohortId}_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Seat-time audit ledger exported to CSV.");
  };

  if (isReportLoading || isCohortsLoading) {
    return (
      <div className={cn("p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading seat-time compliance audit records...</p>
        <p className="text-xs text-slate-400">Verifying real cohort seat-time heartbeats</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* ── Cohort Selector (if multiple cohorts exist) ── */}
      {instructorCohorts && instructorCohorts.length > 1 && (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Active Cohort Roster:</span>
          </div>
          <select
            value={effectiveCohortId}
            onChange={(e) => setSelectedCohortId(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {instructorCohorts.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} (Course #{c.courseId})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Enrolled Candidates</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {report?.totalStudents || 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Actively enrolled in cohort</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Avg. Active Theory</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {report?.averageActiveHours || 0}{" "}
            <span className="text-sm font-semibold text-slate-400">
              {(report?.students?.[0]?.requiredSeconds ?? 0) > 0
                ? `/ ${(report!.students[0].requiredSeconds / 3600).toFixed(1)} hrs`
                : "hrs"}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold">Required theory hours metric</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Theory Clearance Rate</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {report?.compliantStudentsCount || 0} <span className="text-sm font-semibold text-slate-400">/ {report?.totalStudents || 0}</span>
          </div>
          <p className="text-[11px] text-blue-600 font-bold">Theory clearance unlocked</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Cohort Total Hours</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {report?.totalActiveHours || 0} <span className="text-sm font-semibold text-slate-400">hrs</span>
          </div>
          <p className="text-[11px] text-purple-600 font-bold">Total accumulated theory</p>
        </div>
      </div>

      {/* ── Main Audit Table Container ── */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Table Header Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Verified Student Participation &amp; Seat-Time Records
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live telemetry ledger recorded per student from backend heartbeat records.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 text-xs font-bold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" /> Export Seat-Time CSV
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
            {[
              { id: "ALL", label: "All Candidates" },
              { id: "COMPLIANT", label: "Compliant" },
              { id: "IN_PROGRESS", label: "In Progress" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                  filterStatus === tab.id
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name or ID..."
              className="pl-8 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Student / Candidate</th>
                <th className="py-3 px-4">Active Theory Seat-Time</th>
                <th className="py-3 px-4">Mandate Progress</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4">Enrollment Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => {
                  const activeHours = rec.totalActiveTimeSeconds / 3600;
                  const requiredHours = rec.requiredSeconds > 0 ? rec.requiredSeconds / 3600 : 0;
                  const progressPct = rec.progressPct;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Candidate Name & Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {rec.studentName ? rec.studentName.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {rec.studentName}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {rec.studentEmail || rec.userId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Active Theory Time */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">
                            {formatHours(rec.totalActiveTimeSeconds)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatMinutes(rec.totalActiveTimeMinutes)} recorded
                          </span>
                        </div>
                      </td>

                      {/* Progress towards Mandate */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span className="text-[11px]">{progressPct}%</span>
                            {requiredHours > 0 && (
                              <span className="text-[10px] text-slate-400">
                                of {requiredHours.toFixed(1)} hrs
                              </span>
                            )}
                          </div>
                          <Progress value={progressPct} className="h-1.5 bg-slate-100" />
                        </div>
                      </td>

                      {/* Compliance Status */}
                      <td className="py-3.5 px-4">
                        {rec.isCompliant ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-bold shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Cleared
                          </Badge>
                        ) : requiredHours > 0 ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                            <Clock className="w-3 h-3 mr-1" /> {Math.max(0, requiredHours - activeHours).toFixed(1)} hrs remaining
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                            <Clock className="w-3 h-3 mr-1" /> In Progress
                          </Badge>
                        )}
                      </td>

                      {/* Enrollment Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase bg-slate-50 text-slate-700">
                            {rec.enrollmentStatus || "ACTIVE"}
                          </Badge>
                          {rec.enrolledAt && (
                            <span className="text-[10px] text-slate-400 block">
                              Enrolled {format(new Date(rec.enrolledAt), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecordForDetail(rec)}
                          className="h-7 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 rounded-lg"
                        >
                          <Eye className="w-3 h-3 mr-1" /> View Breakdown
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No student seat-time records found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Student Lesson Breakdown Modal ── */}
      <Dialog
        open={Boolean(selectedRecordForDetail)}
        onOpenChange={(open) => !open && setSelectedRecordForDetail(null)}
      >
        <DialogContent className="sm:max-w-[720px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shadow-2xs">
                {selectedRecordForDetail?.studentName ? selectedRecordForDetail.studentName.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-slate-900">
                    {selectedRecordForDetail?.studentName}
                  </DialogTitle>
                  <Badge className="bg-blue-100 text-blue-800 border-none text-[10px] font-bold">
                    {selectedRecordForDetail?.enrollmentStatus || "ACTIVE"}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  {selectedRecordForDetail?.studentEmail || selectedRecordForDetail?.userId} &bull; {selectedRecordForDetail?.courseTitle || "Course"} &bull; {selectedRecordForDetail?.cohortName || "Active Cohort"}
                </DialogDescription>
              </div>
            </div>
            {selectedRecordForDetail?.isCompliant ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold py-1 px-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Certified
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-bold py-1 px-2.5">
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> In Progress
              </Badge>
            )}
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {/* 1. Required vs Earned Theory Hours */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Theory Hours Clearance
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {selectedRecordForDetail?.progressPct || 0}% Cleared
                </span>
              </div>

              {(() => {
                const reqSecs = selectedRecordForDetail?.requiredSeconds ?? 0;
                const reqHrs = reqSecs / 3600;
                const earnedSecs = selectedRecordForDetail?.totalActiveTimeSeconds ?? 0;
                const remainingHrs = Math.max(0, reqHrs - earnedSecs / 3600);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <div className="p-2 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Required Standard</span>
                      <span className="text-lg font-black text-slate-900 block">
                        {reqSecs > 0 ? `${reqHrs.toFixed(1)} hrs` : "—"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {reqSecs > 0 ? `${Math.round(reqSecs / 60).toLocaleString()} minutes target` : "From backend target"}
                      </span>
                    </div>
                    <div className="p-2 space-y-0.5 border-y sm:border-y-0 sm:border-x border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Earned Theory Hours</span>
                      <span className="text-lg font-black text-emerald-600 block">
                        {selectedRecordForDetail ? formatHours(earnedSecs) : "0.0 hrs"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {selectedRecordForDetail?.totalActiveTimeMinutes || 0} min verified
                      </span>
                    </div>
                    <div className="p-2 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Deficit</span>
                      <span className="text-lg font-black text-amber-600 block">
                        {reqSecs > 0 ? `${remainingHrs.toFixed(1)} hrs` : "—"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {selectedRecordForDetail?.isCompliant ? "Requirement satisfied" : "Seat-time pending"}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <Progress value={selectedRecordForDetail?.progressPct || 0} className="h-2 bg-slate-100" />
            </div>

            {/* 2. Session Monitoring & Inactivity Telemetry Card */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Real-Time Heartbeat &amp; Inactivity Telemetry
                </span>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                  Continuous Heartbeat
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-blue-100">
                  <PauseCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">Tab Blur &amp; Inactivity Guard</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Client halts seat-time pulse on window blur or 60s idle. Inactive seconds are deducted before heartbeat submission.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-blue-100">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">Latest Heartbeat Pulse</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      {latestActivity ? (
                        <>Active on {format(latestActivity, "MMM d, yyyy 'at' h:mm a")}</>
                      ) : (
                        "No session telemetry pulses recorded yet"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-white/70 p-2.5 rounded-xl border border-slate-100">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-semibold text-slate-700">Audit Traceability Note:</span> Telemetry heartbeats atomically update cumulative active seat-time in <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">Progress.activeTimeSeconds</code>. Raw individual heartbeat pulse logs and tab blur incidents are not persisted in the database schema.
                </p>
              </div>
            </div>

            {/* 3. Detailed Lesson Seat-Time Breakdown Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  Lesson &amp; Module Seat-Time Ledger
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {studentBreakdown?.lessons?.length || 0} lessons logged
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                {isBreakdownLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                    <p className="font-medium text-slate-600">Retrieving lesson telemetry pulse history...</p>
                  </div>
                ) : studentBreakdown?.lessons && studentBreakdown.lessons.length > 0 ? (
                  studentBreakdown.lessons.map((lb: any, idx: number) => {
                    const lessonMinutes = lb.activeTimeMinutes || Math.round((lb.activeTimeSeconds || 0) / 60);
                    const lessonHours = ((lb.activeTimeSeconds || 0) / 3600).toFixed(2);
                    return (
                      <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {lb.lessonTitle || lb.title || `Lesson #${lb.lessonId}`}
                            </span>
                            {lb.isCreditHour ? (
                              <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] font-bold px-1.5 py-0">
                                Theory Credit
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-200 px-1.5 py-0">
                                Non-Credit
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span>Status: <strong className="text-slate-600 uppercase font-semibold">{lb.status || "IN_PROGRESS"}</strong></span>
                            {lb.lastActivity && (
                              <span>&bull; Last pulse: {format(new Date(lb.lastActivity), "MMM d, h:mm a")}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 block">
                            {formatMinutes(lessonMinutes)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {lessonHours} hrs logged
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                    <AlertCircle className="w-5 h-5 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">No individual lesson telemetry recorded yet.</p>
                    <p className="text-[11px] text-slate-400">Seat-time pulses will appear here once the student launches course theory lessons.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
