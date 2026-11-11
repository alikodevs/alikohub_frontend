import React, { useState, useMemo } from "react";
import { useAdminCohorts } from "@/hooks/useAcademy";
import { useCohortSeatTimeReport } from "@/features/rubric/hooks/useSeatTime";
import { useExportGradebookCsvMutation } from "@/features/rubric/hooks/useGradebook";
import {
  useComplianceDossier,
  useExerciseExamSessions,
  useAuditExamSessionMutation,
} from "@/features/rubric/hooks/useComplianceDossier";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  Download,
  Clock,
  Users,
  Search,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

export const AdminComplianceTab: React.FC = () => {
  const { data: cohortsRaw } = useAdminCohorts();
  const cohorts: any[] = useMemo(() => {
    if (Array.isArray(cohortsRaw)) return cohortsRaw;
    return (
      (cohortsRaw as any)?.cohorts ||
      (cohortsRaw as any)?.items ||
      (cohortsRaw as any)?.data ||
      []
    );
  }, [cohortsRaw]);

  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const activeCohort =
    cohorts.find((c) => String(c.id) === selectedCohortId) || cohorts[0];
  const cohortId = activeCohort?.id;
  const courseId = activeCohort?.courseId;

  // 4.16 Cohort Seat-Time Report
  const { data: seatReport, isLoading: seatReportLoading } =
    useCohortSeatTimeReport(cohortId, courseId);

  // 4.17 Export Cohort Gradebook CSV
  const exportCsvMutation = useExportGradebookCsvMutation();

  // 4.19 Generate Compliance Dossier
  const { data: dossier, isLoading: dossierLoading } = useComplianceDossier(
    courseId,
    cohortId,
  );

  // 4.15 Exam Session Audit (lookup by exerciseId + audit session)
  const [exerciseIdInput, setExerciseIdInput] = useState("");
  const [lookupExerciseId, setLookupExerciseId] = useState("");
  const { data: examSessions, isLoading: sessionsLoading } =
    useExerciseExamSessions(lookupExerciseId || undefined);
  const [directSessionId, setDirectSessionId] = useState("");
  const auditSessionMutation = useAuditExamSessionMutation();

  const handleDownloadDossierJson = () => {
    if (!dossier) return;
    const blob = new Blob([JSON.stringify(dossier, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `compliance_dossier_course_${courseId}_cohort_${cohortId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLookupExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (exerciseIdInput.trim()) {
      setLookupExerciseId(exerciseIdInput.trim());
    }
  };

  const handleAuditSession = async (sessionId: string | number) => {
    await auditSessionMutation.mutateAsync({
      sessionId: Number(sessionId) || sessionId,
      isAudited: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cohort Selector & Export Controls (Postman 4.17 & 4.19) */}
      <div className="bg-white border border-[#E1EAF2] rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold text-slate-900">
              Compliance &amp; Audit Oversight
            </span>
          </div>
          <select
            value={cohortId ? String(cohortId) : ""}
            onChange={(e) => setSelectedCohortId(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E1EAF2] bg-slate-50 text-xs font-semibold text-slate-800"
          >
            {cohorts.length === 0 ? (
              <option value="">No cohorts found</option>
            ) : (
              cohorts.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name || `Cohort #${c.id}`} (Course #{c.courseId})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            disabled={!cohortId || exportCsvMutation.isPending}
            onClick={() => cohortId && exportCsvMutation.mutate(cohortId)}
            className="h-9 text-xs font-bold border-[#E1EAF2]"
          >
            {exportCsvMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            )}
            Export Gradebook CSV
          </Button>

          <Button
            size="sm"
            disabled={!dossier || dossierLoading}
            onClick={handleDownloadDossierJson}
            className="h-9 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Dossier JSON
          </Button>
        </div>
      </div>

      {/* Compliance Dossier Snapshot (Postman 4.19) */}
      <div className="bg-white border border-[#E1EAF2] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Compliance Dossier Snapshot
            </h3>
            <p className="text-xs text-slate-500">
              {dossier?.dossierTitle ||
                "Live curriculum, faculty, and cohort compliance package from backend."}
            </p>
          </div>
          {dossier && (
            <Badge
              variant="outline"
              className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              {dossier.submissionAuthority || "VERIFIED"}
            </Badge>
          )}
        </div>

        {dossierLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1.5" />
            Generating dossier...
          </div>
        ) : !dossier ? (
          <p className="text-xs text-slate-500">
            Select a cohort to inspect its compliance dossier.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Modules / Lessons
              </span>
              <span className="text-base font-bold text-slate-900">
                {dossier.curriculumCrosswalk?.totalModules ?? 0} /{" "}
                {dossier.curriculumCrosswalk?.totalLessons ?? 0}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Core Skills
              </span>
              <span className="text-base font-bold text-slate-900">
                {dossier.skillsLabCurriculum?.totalCoreSkills ?? 0}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Faculty Roster
              </span>
              <span className="text-base font-bold text-slate-900">
                {dossier.facultyRoster?.length ?? 0} Approved
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Cohort Students
              </span>
              <span className="text-base font-bold text-slate-900">
                {dossier.cohortVerification?.totalEnrolledStudents ??
                  seatReport?.totalStudents ??
                  0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Seat-Time Regulatory Report (Postman 4.16) */}
      <div className="bg-white border border-[#E1EAF2] rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#E1EAF2] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0095DA]" />
              Cohort Seat-Time Regulatory Report
            </h3>
            <p className="text-xs text-slate-500">
              Avg: {seatReport?.averageActiveHours ?? 0} hrs • Total:{" "}
              {seatReport?.totalActiveHours ?? 0} hrs • Compliant:{" "}
              {seatReport?.compliantStudentsCount ?? 0}/
              {seatReport?.totalStudents ?? 0}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold">
            <Users className="w-3 h-3 mr-1" />
            {seatReport?.totalStudents ?? 0} Students
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 uppercase text-xs font-bold border-b border-[#E1EAF2]">
              <tr>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Active Hours</th>
                <th className="px-6 py-3">Progress</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1EAF2]">
              {seatReportLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs text-slate-400">
                    Loading seat-time report...
                  </td>
                </tr>
              ) : !seatReport?.students || seatReport.students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs text-slate-500">
                    No seat-time records found for this cohort.
                  </td>
                </tr>
              ) : (
                seatReport.students.map((st) => (
                  <tr key={st.userId} className="hover:bg-[#EAF4FB]">
                    <td className="px-6 py-3 text-xs font-semibold text-slate-900">
                      {st.studentName}
                      {st.studentEmail && (
                        <span className="block text-[11px] font-normal text-slate-500">
                          {st.studentEmail}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs font-bold text-slate-800">
                      {(st.totalActiveTimeSeconds / 3600).toFixed(1)} hrs (
                      {st.totalActiveTimeMinutes}m)
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {st.progressPct}%
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant="outline"
                        className={
                          st.isCompliant
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                            : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                        }
                      >
                        {st.isCompliant ? "COMPLIANT" : "IN PROGRESS"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exam Session Security Audit (Postman 4.15) */}
      <div className="bg-white border border-[#E1EAF2] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Exam Session Integrity Audit
            </h3>
            <p className="text-xs text-slate-500">
              Load proctoring sessions by Exercise ID or audit a specific Session ID directly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleLookupExercise} className="flex items-center gap-2">
              <Input
                value={exerciseIdInput}
                onChange={(e) => setExerciseIdInput(e.target.value)}
                placeholder="Exercise ID..."
                className="w-32 h-9 text-xs bg-slate-50 border-[#E1EAF2]"
              />
              <Button type="submit" size="sm" variant="outline" className="h-9 text-xs font-bold">
                <Search className="w-3.5 h-3.5 mr-1" /> Load Sessions
              </Button>
            </form>

            <div className="flex items-center gap-2">
              <Input
                value={directSessionId}
                onChange={(e) => setDirectSessionId(e.target.value)}
                placeholder="Session ID..."
                className="w-28 h-9 text-xs bg-slate-50 border-[#E1EAF2]"
              />
              <Button
                size="sm"
                disabled={!directSessionId.trim() || auditSessionMutation.isPending}
                onClick={() => handleAuditSession(directSessionId.trim())}
                className="h-9 text-xs font-bold bg-[#0095DA] hover:bg-[#007BB8] text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Audit Session
              </Button>
            </div>
          </div>
        </div>

        {lookupExerciseId && (
          <div className="border border-[#E1EAF2] rounded-lg overflow-hidden">
            {sessionsLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading sessions for Exercise #{lookupExerciseId}...
              </div>
            ) : !examSessions || examSessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No exam sessions found for Exercise #{lookupExerciseId}.
              </div>
            ) : (
              <div className="divide-y divide-[#E1EAF2]">
                {examSessions.map((sess: any) => (
                  <div
                    key={sess.id}
                    className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        Session #{sess.id}
                      </span>{" "}
                      <span className="text-slate-500">
                        &bull; User: {sess.userId || sess.studentUserId || "Candidate"} &bull; Tab Blurs: {sess.tabBlurCount ?? 0}
                      </span>
                      {(sess.tabBlurCount ?? 0) >= 3 && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                        >
                          FLAGGED (3+ BLURS)
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {sess.isAudited ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                        >
                          AUDITED
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={auditSessionMutation.isPending}
                          onClick={() => handleAuditSession(sess.id)}
                          className="h-7 px-3 text-[11px] font-bold bg-[#0095DA] hover:bg-[#007BB8] text-white"
                        >
                          Mark Audited
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

