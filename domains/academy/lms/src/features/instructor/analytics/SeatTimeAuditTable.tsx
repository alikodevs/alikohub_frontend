import React, { useState, useMemo } from "react";
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  Download,
  Search,
  Eye,
  CheckCircle2,
  Users,
  Activity,
  Layers,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useCohortSeatTimeReport } from "@/features/rubric/hooks/useSeatTime";
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
  cohortId = 1,
  courseId,
  className,
}) => {
  const { data: report, isLoading } = useCohortSeatTimeReport(cohortId, courseId);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "COMPLIANT" | "IN_PROGRESS" | "FLAGGED">("ALL");
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<StudentSeatTimeRecord | null>(null);

  const formatHours = (seconds: number) => {
    const hrs = seconds / 3600;
    return `${hrs.toFixed(1)} hrs`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const filteredRecords = useMemo(() => {
    if (!report?.records) return [];

    return report.records.filter((rec) => {
      const matchesSearch =
        rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.studentEmail || "").toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === "COMPLIANT") return rec.isCompliant;
      if (filterStatus === "IN_PROGRESS") return !rec.isCompliant && rec.tabBlurIncidents < 5;
      if (filterStatus === "FLAGGED") return rec.tabBlurIncidents >= 3;

      return true;
    });
  }, [report?.records, searchQuery, filterStatus]);

  const handleExportCSV = () => {
    if (!report?.records || report.records.length === 0) {
      toast.error("No seat-time records available to export.");
      return;
    }

    const headers = [
      "Student ID",
      "Student Name",
      "Email",
      "Course",
      "Cohort",
      "Active Hours",
      "Idle Hours",
      "Tab Blur Incidents",
      "Engagement Score (%)",
      "WABON 50h Status",
      "Last Heartbeat",
    ];

    const rows = report.records.map((r) => [
      r.studentId,
      `"${r.studentName}"`,
      r.studentEmail || "",
      `"${r.courseTitle || "CNA Theory"}"`,
      `"${r.cohortName || "Cohort 1"}"`,
      (r.activeSeconds / 3600).toFixed(2),
      (r.idleSeconds / 3600).toFixed(2),
      r.tabBlurIncidents,
      Math.round(r.engagementScore * 100),
      r.isCompliant ? "COMPLIANT (50+ hrs)" : "IN PROGRESS",
      r.lastHeartbeatAt || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `WABON_SeatTime_Audit_Cohort_${cohortId}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("WABON Seat-Time Audit CSV exported successfully.");
  };

  return (
    <div className={cn("space-y-6", className)}>
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
          <p className="text-[11px] text-slate-500 font-medium">Actively tracked cohort roster</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Avg. Active Theory</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {report?.averageActiveHours || 0} <span className="text-sm font-semibold text-slate-400">/ 50.0 hrs</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold">WAC 246-841A-440 mandate metric</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">50-Hr Clearance Rate</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {report?.compliantStudentsCount || 0} <span className="text-sm font-semibold text-slate-400">/ {report?.totalStudents || 0}</span>
          </div>
          <p className="text-[11px] text-blue-600 font-bold">Theory clearance certificates unlocked</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Avg. Engagement</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {report ? Math.round(report.averageEngagementScore * 100) : 100}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Based on 60s client heartbeats</p>
        </div>
      </div>

      {/* ── Main Audit Table Container ── */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Table Header Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Verified Student Participation &amp; Seat-Time Records
              </h3>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                WAC 246-841A-440(6)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated active-vs-idle ledger recorded via 60-second telemetry pulses with tab focus detection.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 text-xs font-bold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" /> Export WABON CSV
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
            {[
              { id: "ALL", label: "All Candidates" },
              { id: "COMPLIANT", label: "Compliant (50+ hrs)" },
              { id: "IN_PROGRESS", label: "In Progress (< 50 hrs)" },
              { id: "FLAGGED", label: "Flagged Incidents" },
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
              placeholder="Search candidate by name..."
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
                <th className="py-3 px-4">Idle / Inactive</th>
                <th className="py-3 px-4">Tab Blur Incidents</th>
                <th className="py-3 px-4">Engagement Rate</th>
                <th className="py-3 px-4">WABON 50h Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => {
                  const activeHours = rec.activeSeconds / 3600;
                  const progressPct = Math.min(100, Math.round((activeHours / 50) * 100));

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Candidate Name & Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {rec.studentName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {rec.studentName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {rec.studentEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Active Theory Time */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{formatHours(rec.activeSeconds)}</span>
                            <span className="text-[10px] text-slate-400">{progressPct}%</span>
                          </div>
                          <Progress value={progressPct} className="h-1.5 bg-slate-100" />
                        </div>
                      </td>

                      {/* Idle Time */}
                      <td className="py-3.5 px-4 text-slate-500 font-semibold">
                        {formatDuration(rec.idleSeconds)}
                      </td>

                      {/* Tab Blur Incidents */}
                      <td className="py-3.5 px-4">
                        {rec.tabBlurIncidents > 0 ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5",
                              rec.tabBlurIncidents >= 5
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                            )}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {rec.tabBlurIncidents} blur incident{rec.tabBlurIncidents > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-normal">None recorded</span>
                        )}
                      </td>

                      {/* Engagement Score */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[11px]",
                          rec.engagementScore >= 0.95
                            ? "bg-emerald-50 text-emerald-700"
                            : rec.engagementScore >= 0.85
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        )}>
                          {Math.round(rec.engagementScore * 100)}%
                        </span>
                      </td>

                      {/* WABON Status */}
                      <td className="py-3.5 px-4">
                        {rec.isCompliant ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-bold shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> 50h Mandate Cleared
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                            <Clock className="w-3 h-3 mr-1" /> {(50 - activeHours).toFixed(1)} hrs remaining
                          </Badge>
                        )}
                      </td>

                      {/* Last Heartbeat */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {rec.lastHeartbeatAt ? format(new Date(rec.lastHeartbeatAt), "MMM d, h:mm a") : "Recent"}
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
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
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
        <DialogContent className="sm:max-w-[650px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[85vh] flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                {selectedRecordForDetail?.studentName.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  {selectedRecordForDetail?.studentName}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Detailed Lesson Seat-Time Breakdown &bull; {selectedRecordForDetail?.courseTitle}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Active</span>
                <span className="text-base font-black text-slate-900">
                  {selectedRecordForDetail ? formatHours(selectedRecordForDetail.activeSeconds) : "0 hrs"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Idle / Paused</span>
                <span className="text-base font-black text-slate-600">
                  {selectedRecordForDetail ? formatDuration(selectedRecordForDetail.idleSeconds) : "0m"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Engagement</span>
                <span className="text-base font-black text-blue-600">
                  {selectedRecordForDetail ? Math.round(selectedRecordForDetail.engagementScore * 100) : 100}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Unit Module Breakdown:</span>
              <div className="space-y-2 divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedRecordForDetail?.lessonsBreakdown && selectedRecordForDetail.lessonsBreakdown.length > 0 ? (
                  selectedRecordForDetail.lessonsBreakdown.map((lb, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white hover:bg-slate-50/50">
                      <span className="font-medium text-slate-800 flex-1 pr-3">
                        {lb.title}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-slate-900">
                          {formatHours(lb.activeSeconds)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({formatDuration(lb.idleSeconds)} idle)
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No lesson breakdown data recorded for this candidate yet.
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
