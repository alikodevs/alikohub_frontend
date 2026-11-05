import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import { useCohortCensus } from "@/features/admissions/hooks/useAdmissions";
import { useInstructorCohortsList } from "@/features/rubric/hooks/useSeatTime";
import { wabonComplianceService } from "@/features/rubric/services/wabonComplianceService";
import type { CohortCensusEnrollment, AttendanceVerificationStatus } from "@/features/admissions/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserX,
  Download,
  Search,
  Users,
  ShieldCheck,
  CalendarCheck,
  Loader2,
  FileSpreadsheet,
  Check,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

const formatCohortOption = (c: any) => {
  const name = c.name || `Cohort #${c.id}`;
  const courseTitle = c.course?.title || "";
  if (!courseTitle) return name;
  const words = courseTitle.trim().split(/\s+/);
  const trimmed = words.slice(0, 3).join(" ");
  const suffix = words.length > 3 ? "..." : "";
  return `${name} (${trimmed}${suffix})`;
};

export const CohortCensusPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramCohort = searchParams.get("cohortId");
  const { data: cohorts, isLoading: cohortsLoading } = useInstructorCohortsList();

  const [selectedCohortId, setSelectedCohortId] = useState<number | undefined>(() => {
    if (paramCohort && !isNaN(Number(paramCohort))) {
      return Number(paramCohort);
    }
    return undefined;
  });

  const effectiveCohortId = useMemo(() => {
    if (selectedCohortId) return selectedCohortId;
    if (paramCohort && !isNaN(Number(paramCohort))) return Number(paramCohort);
    if (cohorts && cohorts.length > 0) return Number(cohorts[0].id);
    return 1;
  }, [selectedCohortId, paramCohort, cohorts]);

  const {
    data: censusList,
    isLoading: censusLoading,
    refetch,
  } = useCohortCensus(effectiveCohortId);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("ALL");
  const [isExportingDossier, setIsExportingDossier] = useState(false);

  // Active Cohort object
  const activeCohort = useMemo(() => {
    return cohorts?.find((c: any) => Number(c.id) === effectiveCohortId);
  }, [cohorts, effectiveCohortId]);

  // Filtered List
  const filteredCensus = useMemo(() => {
    if (!censusList) return [];
    return censusList.filter((item) => {
      const studentName = `${item.user?.firstname || ""} ${item.user?.lastname || ""}`.toLowerCase();
      const email = (item.user?.email || "").toLowerCase();
      const matchesSearch =
        studentName.includes(searchQuery.toLowerCase()) ||
        email.includes(searchQuery.toLowerCase()) ||
        String(item.userId).includes(searchQuery);

      const matchesStatus =
        attendanceFilter === "ALL" || item.attendanceStatus === attendanceFilter;

      return matchesSearch && matchesStatus;
    });
  }, [censusList, searchQuery, attendanceFilter]);

  // Census KPIs
  const totalEnrolled = censusList?.length || 0;
  const verifiedCount =
    censusList?.filter((c) => c.attendanceStatus === "VERIFIED_PRESENT").length || 0;
  const pendingCount =
    censusList?.filter(
      (c) =>
        c.attendanceStatus === "PENDING_VERIFICATION" ||
        !c.attendanceStatus
    ).length || 0;
  const atRiskCount =
    censusList?.filter((c) => c.attendanceStatus === "NO_SHOW_AT_RISK").length || 0;
  const droppedCount =
    censusList?.filter((c) => c.attendanceStatus === "ADMINISTRATIVE_DROP").length || 0;

  // Dossier Export Action
  const handleExportDossier = async () => {
    try {
      setIsExportingDossier(true);
      await wabonComplianceService.generateDossier({
        cohortId: effectiveCohortId,
        courseId: activeCohort?.courseId || activeCohort?.course?.id,
        includeFullLogs: true,
      });
      toast.success("Regulatory compliance dossier generated and dispatched.");
    } catch {
      toast.error("Failed to generate compliance dossier. Please try again.");
    } finally {
      setIsExportingDossier(false);
    }
  };

  const getAttendanceBadge = (status?: AttendanceVerificationStatus) => {
    switch (status) {
      case "VERIFIED_PRESENT":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold py-0.5 px-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Verified Present
          </Badge>
        );
      case "NO_SHOW_AT_RISK":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-300 text-xs font-bold py-0.5 px-2.5">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" /> No-Show At-Risk
          </Badge>
        );
      case "ADMINISTRATIVE_DROP":
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-bold py-0.5 px-2.5">
            <UserX className="w-3.5 h-3.5 mr-1 text-slate-500" /> Administrative Drop
          </Badge>
        );
      case "PENDING_VERIFICATION":
      default:
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-bold py-0.5 px-2.5">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Pending Verification
          </Badge>
        );
    }
  };

  return (
    <InstructorLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ── Top Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px] font-bold py-0.5 px-2">
                First-Week Attendance
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-heading tracking-tight">
              Attendance & Enrollment Census
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              First-week academic attendance verification and cohort census roster.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Cohort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Cohort:</span>
              <select
                aria-label="Select cohort"
                value={effectiveCohortId}
                onChange={(e) => setSelectedCohortId(Number(e.target.value))}
                className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[190px] sm:max-w-[240px] truncate"
              >
                {cohorts && cohorts.length > 0 ? (
                  cohorts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {formatCohortOption(c)}
                    </option>
                  ))
                ) : (
                  <option value={1}>Cohort #1</option>
                )}
              </select>
            </div>

            {/* Dossier Generator Button */}
            <Button
              onClick={handleExportDossier}
              disabled={isExportingDossier}
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl h-9 px-3.5 shadow-xs"
            >
              {isExportingDossier ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Exporting...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export Dossier
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Enrolled
            </span>
            <div className="text-2xl font-black text-slate-900">{totalEnrolled}</div>
            <span className="text-[11px] text-slate-500">Cohort Census</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Verified Present
            </span>
            <div className="text-2xl font-black text-emerald-600">{verifiedCount}</div>
            <span className="text-[11px] text-slate-500">
              {totalEnrolled > 0 ? Math.round((verifiedCount / totalEnrolled) * 100) : 0}% of roster
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
              Pending Verification
            </span>
            <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
            <span className="text-[11px] text-slate-500">Awaiting gate exercise</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
              No-Show At-Risk
            </span>
            <div className="text-2xl font-black text-rose-600">{atRiskCount}</div>
            <span className="text-[11px] text-slate-500">Unverified &gt; 5 days</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Administrative Drop
            </span>
            <div className="text-2xl font-black text-slate-600">{droppedCount}</div>
            <span className="text-[11px] text-slate-500">Census attrition</span>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search student name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {[
              { id: "ALL", label: `All (${totalEnrolled})` },
              { id: "VERIFIED_PRESENT", label: `Verified (${verifiedCount})` },
              { id: "PENDING_VERIFICATION", label: `Pending (${pendingCount})` },
              { id: "NO_SHOW_AT_RISK", label: `At-Risk (${atRiskCount})` },
              { id: "ADMINISTRATIVE_DROP", label: `Dropped (${droppedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAttendanceFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                  attendanceFilter === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Census Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4 text-center">Enrollment Status</th>
                  <th className="py-3.5 px-4 text-center">Admissions Clearance</th>
                  <th className="py-3.5 px-4">Week 1 Attendance</th>
                  <th className="py-3.5 px-4">Verification Timestamp</th>
                  <th className="py-3.5 px-4">Enrollment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {censusLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="py-6 px-4">
                        <div className="h-4 bg-slate-100 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredCensus.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">No census enrollment records match your filter</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Students enrolled in Cohort #{effectiveCohortId} will reflect here automatically.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCensus.map((item) => {
                    const studentName =
                      `${item.user?.firstname || ""} ${item.user?.lastname || ""}`.trim() ||
                      (item.user?.email && item.user.email.includes("@")
                        ? item.user.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                        : "Enrolled Student");
                    const studentEmail = item.user?.email || "Enrolled Student";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">
                                {studentName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {studentEmail}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold py-0.5 px-2",
                              item.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "text-slate-500 border-slate-200"
                            )}
                          >
                            {item.status || "ACTIVE"}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {item.approvalStatus === "APPROVED" ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                              <Check className="w-3 h-3 mr-1" /> Approved
                            </Badge>
                          ) : item.approvalStatus === "REJECTED" ? (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
                              Remediation
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-200">
                              Pending
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {getAttendanceBadge(item.attendanceStatus)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {item.attendanceVerifiedAt ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 block">
                                {format(new Date(item.attendanceVerifiedAt), "MMM d, yyyy")}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {format(new Date(item.attendanceVerifiedAt), "h:mm a")} (Gate Exercise)
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              Awaiting gate submission
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {item.enrolledAt
                            ? format(new Date(item.enrolledAt), "MMM d, yyyy")
                            : item.createdAt
                            ? format(new Date(item.createdAt), "MMM d, yyyy")
                            : "Recent"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
};

export default CohortCensusPage;

