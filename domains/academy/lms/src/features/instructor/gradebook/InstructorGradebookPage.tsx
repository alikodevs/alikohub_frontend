import React, { useState, useMemo } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import {
  GraduationCap,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Award,
  Building2,
  Users,
  Layers,
  Loader2,
  UserCheck,
  TrendingUp,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCohortGradebook,
  useExportGradebookCsvMutation,
} from "@/features/rubric/hooks/useGradebook";
import { useInstructorCohortsList } from "@/features/rubric/hooks/useSeatTime";
import { useCohortStudents } from "@/features/rubric/hooks/useCohortStudents";
import { cn } from "@/lib/utils";

export const InstructorGradebookPage: React.FC = () => {
  const { data: cohortsData } = useInstructorCohortsList();
  const cohorts = cohortsData || [];

  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const activeCohortId =
    selectedCohortId || (cohorts.length > 0 ? String(cohorts[0].id) : "");

  // Resolve enrolled student full names across enrollments, admissions, and submissions
  const { studentNameMap } = useCohortStudents(activeCohortId, Boolean(activeCohortId));

  const getStudentDisplayName = (item: any) => {
    const uid = String(item.userId || "");
    const mapped = studentNameMap.get(uid);
    if (mapped) return mapped;
    const fromItem =
      item.studentName ||
      item.name ||
      `${item.user?.firstname || ""} ${item.user?.lastname || ""}`.trim() ||
      item.user?.email;
    return fromItem || "Enrolled Student";
  };

  // Fetch gradebook data
  const {
    data: gradebook,
    isLoading: isGradebookLoading,
  } = useCohortGradebook(activeCohortId);

  const exportCsvMutation = useExportGradebookCsvMutation();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const students = gradebook?.students || [];

  const isStudentPassingTheory = (summary: any) => {
    if (summary?.isTheoryPassed !== undefined) return Boolean(summary.isTheoryPassed);
    return (summary?.overallTheoryPercent ?? 0) >= 80;
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = getStudentDisplayName(s);
      const matchSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.userId.toLowerCase().includes(searchQuery.toLowerCase());

      const summary = s.summary || {};
      const passing = isStudentPassingTheory(summary);
      const pacing = summary.pacing?.status;

      let matchFilter = true;
      if (statusFilter === "PASSING") matchFilter = passing;
      if (statusFilter === "REMEDIATION") matchFilter = !passing;
      if (statusFilter === "BEHIND")
        matchFilter = pacing === "BEHIND_SCHEDULE" || pacing === "AT_RISK";
      if (statusFilter === "COMPLIANT")
        matchFilter =
          summary.complianceStatus ===
          "FULLY_COMPLIANT_READY_FOR_CERTIFICATION";

      return matchSearch && matchFilter;
    });
  }, [students, studentNameMap, searchQuery, statusFilter]);

  // Cohort Analytics
  const totalStudents = gradebook?.totalStudents ?? students.length;
  const passRate = gradebook?.passRatePercent ?? 0;
  const graduatingCount = gradebook?.graduatingCount ?? 0;

  const remediationNeededCount = useMemo(() => {
    return students.filter((s) => !isStudentPassingTheory(s.summary)).length;
  }, [students]);

  const atRiskCount = useMemo(() => {
    return students.filter(
      (s) =>
        s.summary?.pacing?.status === "AT_RISK" ||
        s.summary?.pacing?.status === "BEHIND_SCHEDULE"
    ).length;
  }, [students]);

  const handleExportCsv = () => {
    if (!activeCohortId) return;
    exportCsvMutation.mutate(activeCohortId);
  };

  return (
    <InstructorLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Instructor Master Gradebook &amp; Pacing
                </h1>
                <p className="text-xs text-slate-500">
                  Consolidated Theory Scores, Skills Lab Checkoffs, and Verified Clinical Hours.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportCsv}
              disabled={exportCsvMutation.isPending || !activeCohortId}
              variant="outline"
              className="bg-white border-slate-200 text-xs font-bold h-10 rounded-xl shadow-xs"
            >
              {exportCsvMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1.5" />
              )}
              Export Gradebook CSV
            </Button>
          </div>
        </div>

        {/* Cohort Selector & Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Cohort
            </span>
            <Select value={activeCohortId || undefined} onValueChange={setSelectedCohortId}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-xs font-semibold h-9">
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

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Enrolled
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {totalStudents}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                ({graduatingCount} fully certified)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Graduation Rate: {passRate}%
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Below 80% Theory (Remediation)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600">
                {remediationNeededCount}
              </span>
              <span className="text-xs text-rose-600 font-bold">Students</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Requires academic intervention
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pacing Alerts (At-Risk)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600">
                {atRiskCount}
              </span>
              <span className="text-xs text-amber-600 font-bold">Students</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Behind cohort pacing schedule
            </p>
          </div>
        </div>

        {/* Table Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
            {[
              { id: "ALL", label: `All Students (${totalStudents})` },
              { id: "PASSING", label: "Theory Passing" },
              { id: "REMEDIATION", label: `Remediation Required (${remediationNeededCount})` },
              { id: "BEHIND", label: `Pacing Alerts (${atRiskCount})` },
              { id: "COMPLIANT", label: "Fully Certified" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0",
                  statusFilter === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name..."
              className="pl-9 h-10 rounded-xl bg-white border-slate-200 text-xs"
            />
          </div>
        </div>

        {/* Master Gradebook Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {isGradebookLoading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading cohort gradebook from backend...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No students found for current filter criteria.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/75 border-b border-slate-200">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Student Name
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Overall Theory %
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Quiz / Exam Avg
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Discussion Avg
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Skills Lab
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Clinical Hours
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Pacing Status
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Compliance Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {filteredStudents.map((item) => {
                  const summary = item.summary || {};
                  const theoryScore = summary.overallTheoryPercent ?? 0;
                  const isPassing = isStudentPassingTheory(summary);
                  const letterGrade = summary.letterGrade || "N/A";
                  const studentName = getStudentDisplayName(item);
                  const initials = studentName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n: string) => n[0]?.toUpperCase() || "")
                    .join("") || "S";
                  const pacing = summary.pacing?.status || "ON_TRACK";
                  const skillsPassed = summary.skillsLab?.passedCount ?? 0;
                  const skillsTotalRequired = summary.skillsLab?.totalRequired ?? 0;
                  const clinicalHours =
                    summary.clinicalHours?.totalCompleted ?? 0;
                  const clinicalMinRequired =
                    summary.clinicalHours?.minimumRequired ?? 0;
                  const isClinicalMet =
                    summary.clinicalHours?.isClinicalHoursMet;
                  const isSkillsComplete =
                    summary.skillsLab?.isSkillsLabComplete;

                  return (
                    <TableRow key={item.userId} className="hover:bg-slate-50/50">
                      {/* Student Name */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <span className="font-bold text-slate-900 text-xs">
                            {studentName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Theory % & Letter Grade */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-black",
                              isPassing ? "text-slate-900" : "text-rose-600"
                            )}
                          >
                            {theoryScore}%
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0",
                              isPassing
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-300"
                            )}
                          >
                            Grade: {letterGrade}
                          </Badge>
                          {!isPassing && (
                            <Badge className="bg-rose-100 text-rose-800 text-[9px] font-bold border-0">
                              Remediation
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Quiz & Exam Avg */}
                      <TableCell className="text-xs text-slate-600">
                        <div>
                          <span>Quiz: <strong>{summary.quizAveragePercent ?? 0}%</strong></span>
                          <span className="block text-[11px] text-slate-400">
                            Exam: <strong>{summary.examAveragePercent ?? 0}%</strong>
                          </span>
                        </div>
                      </TableCell>

                      {/* Discussion Avg */}
                      <TableCell className="text-xs text-slate-600">
                        <strong>{summary.discussionAveragePercent ?? 0}%</strong>
                        <span className="text-[10px] text-slate-400 block">
                          {item.details?.discussionsGraded ?? 0} Graded
                        </span>
                      </TableCell>

                      {/* Skills Lab */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            {skillsTotalRequired > 0
                              ? `${skillsPassed}/${skillsTotalRequired}`
                              : skillsPassed}
                          </span>
                          {isSkillsComplete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : skillsTotalRequired > 0 ? (
                            <span className="text-[10px] text-slate-400 font-medium">
                              ({Math.max(0, skillsTotalRequired - skillsPassed)} left)
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Clinical Hours */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            {clinicalMinRequired > 0
                              ? `${clinicalHours}/${clinicalMinRequired}h`
                              : `${clinicalHours}h`}
                          </span>
                          {isClinicalMet ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : clinicalMinRequired > 0 ? (
                            <span className="text-[10px] text-slate-400 font-medium">
                              ({Math.max(0, clinicalMinRequired - clinicalHours).toFixed(1)}h left)
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Pacing Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold",
                            pacing === "ON_TRACK"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : pacing === "AT_RISK"
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "bg-rose-50 text-rose-700 border-rose-300"
                          )}
                        >
                          {pacing.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>

                      {/* WABON Compliance Status */}
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[10px] font-bold border-0",
                            summary.complianceStatus ===
                              "FULLY_COMPLIANT_READY_FOR_CERTIFICATION"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {summary.complianceStatus ===
                          "FULLY_COMPLIANT_READY_FOR_CERTIFICATION"
                            ? "CERTIFIED"
                            : "IN PROGRESS"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </InstructorLayout>
  );
};

export default InstructorGradebookPage;

