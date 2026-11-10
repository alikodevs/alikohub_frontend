import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import {
  ShieldCheck,
  Download,
  Building2,
  Award,
  BookOpen,
  Clock,
  Users,
  CheckCircle2,
  FileText,
  BadgeAlert,
  Loader2,
  Calendar,
  Layers,
  GraduationCap,
  ExternalLink,
  Shield,
  Search,
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
import { useComplianceDossier } from "@/features/rubric/hooks/useComplianceDossier";
import { useExportGradebookCsvMutation } from "@/features/rubric/hooks/useGradebook";
import { useInstructorCohortsList } from "@/features/rubric/hooks/useSeatTime";
import { usePortalMode } from "@/features/auth/hooks/useAuth";
import type { ComplianceDossier } from "@/features/rubric/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const ComplianceAuditPage: React.FC = () => {
  const { isAuditor, hasInstructorAccess, activeRole, isFetched } = usePortalMode();

  const { data: cohortsData, isLoading: isCohortsLoading } = useInstructorCohortsList();
  const cohorts = cohortsData || [];
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const activeCohort = cohorts.find(
    (c: any) => String(c.id) === selectedCohortId
  ) || cohorts[0];

  const courseId = activeCohort?.courseId;
  const cohortId = activeCohort?.id;

  const {
    data: dossier,
    isLoading: isDossierLoading,
  } = useComplianceDossier(courseId, cohortId);

  const exportCsvMutation = useExportGradebookCsvMutation();

  const [activeTab, setActiveTab] = useState<string>("OVERVIEW");

  const handleDownloadDossierJson = () => {
    if (!dossier) return;
    const jsonStr = JSON.stringify(dossier, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WABON_Compliance_Dossier_Course_${courseId}_Cohort_${cohortId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Regulatory compliance dossier downloaded");
  };

  if (isFetched && (!hasInstructorAccess || (activeRole === "STUDENT" && !isAuditor))) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <InstructorLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  WABON Regulatory Compliance Dossier
                </h1>
                <p className="text-xs text-slate-500">
                  Accreditation &amp; Program Compliance Audit Dossier.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => exportCsvMutation.mutate(cohortId)}
              disabled={exportCsvMutation.isPending}
              variant="outline"
              className="bg-white border-slate-200 text-xs font-bold h-10 rounded-xl"
            >
              <Download className="w-4 h-4 mr-1.5" /> Export Gradebook CSV
            </Button>

            <Button
              onClick={handleDownloadDossierJson}
              disabled={!dossier}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold h-10 rounded-xl shadow-xs"
            >
              <Download className="w-4 h-4 mr-1.5" /> Download Full Dossier JSON
            </Button>
          </div>
        </div>

        {/* Read-Only Auditor Notice */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-slate-100">
                State Regulatory Auditor Audit Trail (Immutable Evidence)
              </p>
              <p className="text-slate-400">
                All records, seat-time heartbeats, exam proctor events, and clinical signatures are cryptographic and read-only.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Immutable Audit Record
          </span>
        </div>

        {/* Cohort Selector */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-72">
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Select Audit Cohort
            </label>
            <Select
              value={cohortId ? String(cohortId) : undefined}
              onValueChange={setSelectedCohortId}
            >
              <SelectTrigger className="bg-slate-50 border-slate-200 text-xs font-semibold h-9">
                <SelectValue placeholder={cohorts.length > 0 ? "Select Cohort" : "No cohorts found"} />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name || `Cohort #${c.id}`} (Course #{c.courseId})
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

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Generated Timestamp</span>
              <span className="font-mono font-medium text-slate-700">
                {dossier ? new Date(dossier.generatedAt).toLocaleString() : "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Authority</span>
              <span className="font-bold text-slate-900">
                {dossier?.submissionAuthority || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {[
            { id: "OVERVIEW", label: "Standards & Ratios" },
            { id: "CURRICULUM", label: "Master Crosswalk Matrix" },
            { id: "SKILLS", label: "Skills Lab Checkoff Curriculum" },
            { id: "FACULTY", label: "Faculty Roster & RN Licenses" },
            { id: "QUALITY", label: "Quality Review & Pass Rates" },
            { id: "SECURITY", label: "Exam Security & Seat-Time Protocols" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0",
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isCohortsLoading || isDossierLoading ? (
          <div className="p-16 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-xs">Compiling audit dossier from backend...</p>
          </div>
        ) : !dossier ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
            No compliance dossier found for the selected cohort.
          </div>
        ) : (
          <div className="space-y-6">
            {/* OVERVIEW TAB */}
            {activeTab === "OVERVIEW" && (
              <div className="space-y-6">
                {/* Statutory Requirements Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Faculty Theory Ratio Standard
                    </span>
                    <span className="text-xl font-black text-slate-900 block">
                      {dossier.statutoryStandards?.maximumTheoryRatio ?? "—"}
                    </span>
                    <p className="text-xs text-slate-500">
                      Enrolled: {dossier.cohortVerification?.totalEnrolledStudents ?? 0} students
                      {dossier.cohortVerification?.statutoryTheoryRatioCompliant !== undefined
                        ? dossier.cohortVerification.statutoryTheoryRatioCompliant
                          ? " (Compliant)"
                          : " (Over Cap)"
                        : ""}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Clinical &amp; Skills Lab Ratio Standard
                    </span>
                    <span className="text-xl font-black text-slate-900 block">
                      {dossier.statutoryStandards?.maximumLabAndClinicalRatio ?? "—"}
                    </span>
                    <p className="text-xs text-slate-500">
                      {dossier.statutoryStandards?.statuteCitation || "Supervising RN ratio limit"}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Cohort Duration Cap
                    </span>
                    <span className="text-xl font-black text-slate-900 block">
                      {dossier.statutoryStandards?.maximumCohortDurationCalendarDays != null
                        ? `${dossier.statutoryStandards.maximumCohortDurationCalendarDays} Days Max`
                        : "—"}
                    </span>
                    <p className="text-xs text-slate-500">
                      {dossier.cohortVerification?.calendarDurationDays != null
                        ? `Cohort calendar duration: ${dossier.cohortVerification.calendarDurationDays} days${
                            dossier.cohortVerification.isWithinStatutory90DayCap !== undefined
                              ? dossier.cohortVerification.isWithinStatutory90DayCap
                                ? " (Compliant)"
                                : " (Exceeded)"
                              : ""
                          }`
                        : "Cohort duration reported by backend"}
                    </p>
                  </div>
                </div>

                {/* Tri-Track Program Structure from Backend */}
                {dossier.triTrackMasterCurriculum && (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                    <h3 className="text-base font-black text-slate-900">
                      Program Curriculum Structure
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      {dossier.triTrackMasterCurriculum.trackOneTheoryAsync && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="text-[11px] font-bold text-primary uppercase">
                            {dossier.triTrackMasterCurriculum.trackOneTheoryAsync.track}
                          </span>
                          <p className="text-xs text-slate-600">
                            Total Hours:{" "}
                            <strong>
                              {dossier.triTrackMasterCurriculum.trackOneTheoryAsync.totalRequiredHours} Hours
                            </strong>
                            <br />
                            {dossier.triTrackMasterCurriculum.trackOneTheoryAsync.seatTimeTracking && (
                              <>
                                Seat-Time: {dossier.triTrackMasterCurriculum.trackOneTheoryAsync.seatTimeTracking}
                                <br />
                              </>
                            )}
                            {dossier.triTrackMasterCurriculum.trackOneTheoryAsync.minimumPassingScorePercent != null && (
                              <>
                                Passing Score: Minimum{" "}
                                {dossier.triTrackMasterCurriculum.trackOneTheoryAsync.minimumPassingScorePercent}%
                              </>
                            )}
                          </p>
                        </div>
                      )}

                      {dossier.triTrackMasterCurriculum.trackTwoSkillsLab && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="text-[11px] font-bold text-emerald-700 uppercase">
                            {dossier.triTrackMasterCurriculum.trackTwoSkillsLab.track}
                          </span>
                          <p className="text-xs text-slate-600">
                            Total Hours:{" "}
                            <strong>
                              {dossier.triTrackMasterCurriculum.trackTwoSkillsLab.totalRequiredHours} Hours
                            </strong>
                            <br />
                            {dossier.triTrackMasterCurriculum.trackTwoSkillsLab.competencyRequirement && (
                              <>
                                Requirement: {dossier.triTrackMasterCurriculum.trackTwoSkillsLab.competencyRequirement}
                                <br />
                              </>
                            )}
                            {dossier.triTrackMasterCurriculum.trackTwoSkillsLab.ratioLimit && (
                              <>Ratio Limit: {dossier.triTrackMasterCurriculum.trackTwoSkillsLab.ratioLimit}</>
                            )}
                          </p>
                        </div>
                      )}

                      {dossier.triTrackMasterCurriculum.trackThreeClinical && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="text-[11px] font-bold text-blue-700 uppercase">
                            {dossier.triTrackMasterCurriculum.trackThreeClinical.track}
                          </span>
                          <p className="text-xs text-slate-600">
                            Total Hours:{" "}
                            <strong>
                              {dossier.triTrackMasterCurriculum.trackThreeClinical.totalRequiredHours} Hours
                            </strong>
                            <br />
                            {dossier.triTrackMasterCurriculum.trackThreeClinical.entryPrerequisite && (
                              <>
                                Prerequisite: {dossier.triTrackMasterCurriculum.trackThreeClinical.entryPrerequisite}
                                <br />
                              </>
                            )}
                            {dossier.triTrackMasterCurriculum.trackThreeClinical.ratioLimit && (
                              <>Ratio Limit: {dossier.triTrackMasterCurriculum.trackThreeClinical.ratioLimit}</>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CURRICULUM TAB */}
            {activeTab === "CURRICULUM" && (
              <div className="space-y-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Master Crosswalk Units &amp; Lessons</h3>
                    <p className="text-xs text-slate-500">
                      Total Modules: {dossier.curriculumCrosswalk?.totalModules ?? 0} • Total Lessons: {dossier.curriculumCrosswalk?.totalLessons ?? 0}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                    Certified Curriculum Syllabus
                  </Badge>
                </div>

                <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden divide-y divide-slate-100">
                  {dossier.curriculumCrosswalk?.matrix?.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.moduleTitle} — {item.lessonTitle}</span>
                          {item.hasAttendanceGate && (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-300 text-[10px]">
                              Week 1 Census Gate
                            </Badge>
                          )}
                          {item.isOrientationLesson && (
                            <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50">
                              Orientation
                            </Badge>
                          )}
                        </div>
                        {item.textbookReadings && item.textbookReadings.length > 0 && (
                          <span className="text-slate-500 block">
                            Readings: {item.textbookReadings.map((r: any) => `${r.chapters} (pp. ${r.pageRange})`).join("; ")}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[10px] self-start md:self-auto">
                        {item.curriculumTrack}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SKILLS LAB TAB */}
            {activeTab === "SKILLS" && (
              <div className="space-y-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Core Skills Curriculum ({dossier.skillsLabCurriculum?.totalCoreSkills ?? dossier.skillsLabCurriculum?.skillsChecklist?.length ?? 0} Skills)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluated on Satisfactory / Unsatisfactory in-person RN observation.
                    </p>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-xs">
                    {dossier.skillsLabCurriculum?.totalCoreSkills ?? dossier.skillsLabCurriculum?.skillsChecklist?.length ?? 0} Registered Skills
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dossier.skillsLabCurriculum?.skillsChecklist?.map((s: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                          {s.skillNumber}
                        </span>
                        <span className="font-bold text-slate-900">{s.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-slate-500">
                        {s.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FACULTY ROSTER TAB */}
            {activeTab === "FACULTY" && (
              <div className="space-y-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Approved Faculty Roster &amp; RN Licenses
                    </h3>
                    <p className="text-xs text-slate-500">
                      Registered instructor credentials from backend verification records.
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-bold">
                    {dossier.facultyRoster?.length || 0} Registered Faculty
                  </Badge>
                </div>

                <Table className="bg-white border border-slate-200 rounded-2xl">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Faculty User ID</TableHead>
                      <TableHead className="text-xs font-bold">RN License #</TableHead>
                      <TableHead className="text-xs font-bold">License Expiration</TableHead>
                      <TableHead className="text-xs font-bold">LTC Experience</TableHead>
                      <TableHead className="text-xs font-bold">Train-the-Trainer</TableHead>
                      <TableHead className="text-xs font-bold">Director Approved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dossier.facultyRoster?.map((fac: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{fac.userId}</TableCell>
                        <TableCell className="font-bold text-xs">{fac.rnLicenseNumber}</TableCell>
                        <TableCell className="text-xs">
                          {new Date(fac.rnLicenseExpiration).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs">{fac.yearsLongTermCareExp} Years</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                            {fac.isTrainTheTrainerCertified ? "CERTIFIED" : "PENDING"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-50 text-blue-700 border-blue-300 text-[10px]">
                            {fac.isDirectorApproved ? "APPROVED" : "REVIEW"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* QUALITY ASSURANCE TAB */}
            {activeTab === "QUALITY" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Quality Matters Review Score
                    </span>
                    <span className="text-2xl font-black text-slate-900 block">
                      {dossier.qualityAssuranceAndQM?.qmReviewScore ?? "—"}
                    </span>
                    <p className="text-xs text-emerald-700 font-bold">
                      {dossier.qualityAssuranceAndQM?.qmCertificationLevel ||
                        dossier.qualityAssuranceAndQM?.accreditationStatus ||
                        "—"}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      State Exam Historical Pass Rate
                    </span>
                    <span className="text-2xl font-black text-slate-900 block">
                      {dossier.qualityAssuranceAndQM?.historicalPassRates?.nnaapStateExamPassRatePercent != null
                        ? `${dossier.qualityAssuranceAndQM.historicalPassRates.nnaapStateExamPassRatePercent}%`
                        : "—"}
                    </span>
                    <p className="text-xs text-slate-500">
                      {dossier.qualityAssuranceAndQM?.historicalPassRates?.stateMinimumPassRateBenchmarkPercent != null
                        ? `Benchmark: ${dossier.qualityAssuranceAndQM.historicalPassRates.stateMinimumPassRateBenchmarkPercent}%`
                        : "Reported by backend"}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Cohort Completion Rate
                    </span>
                    <span className="text-2xl font-black text-slate-900 block">
                      {dossier.qualityAssuranceAndQM?.historicalPassRates?.cohortCompletionRatePercent != null
                        ? `${dossier.qualityAssuranceAndQM.historicalPassRates.cohortCompletionRatePercent}%`
                        : "—"}
                    </span>
                    <p className="text-xs text-slate-500">
                      {dossier.qualityAssuranceAndQM?.continuousQualityImprovement?.evaluationCadence ||
                        "Continuous Quality Improvement"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* EXAM SECURITY TAB */}
            {activeTab === "SECURITY" && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900">
                  Regulatory Protocols &amp; Security Framework
                </h3>

                {dossier.regulatoryProtocols ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                      <span className="font-bold text-slate-900 block">Exam Proctoring &amp; Identity Verification</span>
                      <p className="text-slate-600">
                        • Photo ID verification required:{" "}
                        <strong>{dossier.regulatoryProtocols.examSecurity?.photoIdVerificationRequired ? "Yes" : "No"}</strong>
                        <br />
                        • Webcam snapshot required:{" "}
                        <strong>{dossier.regulatoryProtocols.examSecurity?.webcamSnapshotRequired ? "Yes" : "No"}</strong>
                        <br />
                        • Honor code required:{" "}
                        <strong>{dossier.regulatoryProtocols.examSecurity?.studentHonorCodeRequired ? "Yes" : "No"}</strong>
                        <br />
                        • Window blur threshold:{" "}
                        <strong>{dossier.regulatoryProtocols.examSecurity?.windowBlurTrackingThreshold ?? "—"}</strong>
                        <br />
                        • Client IP logging:{" "}
                        <strong>{dossier.regulatoryProtocols.examSecurity?.ipLoggingEnabled ? "Enabled" : "Disabled"}</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                      <span className="font-bold text-slate-900 block">Active Seat-Time Verification Engine</span>
                      <p className="text-slate-600">
                        • Heartbeat interval:{" "}
                        <strong>
                          {dossier.regulatoryProtocols.activeSeatTime?.heartbeatIntervalSeconds != null
                            ? `${dossier.regulatoryProtocols.activeSeatTime.heartbeatIntervalSeconds}s`
                            : "—"}
                        </strong>
                        <br />
                        • Server idle timeout:{" "}
                        <strong>
                          {dossier.regulatoryProtocols.activeSeatTime?.idleTimeoutSeconds != null
                            ? `${dossier.regulatoryProtocols.activeSeatTime.idleTimeoutSeconds}s`
                            : "—"}
                        </strong>
                        <br />
                        • Active engagement enforcement:{" "}
                        <strong>{dossier.regulatoryProtocols.activeSeatTime?.enforceActiveEngagement ? "Enabled" : "Disabled"}</strong>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No regulatory protocol metadata returned by backend.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
};

export default ComplianceAuditPage;

