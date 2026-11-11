import React, { useMemo, useState } from "react";
import StudentLayout from "@/features/student/components/StudentLayout";
import { useEnrollments } from "@/hooks/useAcademy";
import {
  useGenerateCertificateMutation,
  useVerifyCertificateMutation,
} from "@/features/rubric/hooks/useCertification";
import { Link } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  Loader2,
  Printer,
  Search,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type {
  GeneratedCertificate,
  VerifiedCertificate,
} from "@/features/rubric/types";

const Certifications = () => {
  const { data: enrollments = [] } = useEnrollments();
  const cohortEnrollments = useMemo(
    () =>
      enrollments.filter((e: any) => Boolean(e.cohortId || e.cohort?.id)),
    [enrollments],
  );

  const [selectedCohortId, setSelectedCohortId] = useState("");
  const activeCohortId = useMemo(() => {
    if (selectedCohortId) return selectedCohortId;
    const first = cohortEnrollments[0];
    return first ? String(first.cohortId || first.cohort?.id) : "";
  }, [selectedCohortId, cohortEnrollments]);

  const [directorName, setDirectorName] = useState("");
  const [directorRnLicense, setDirectorRnLicense] = useState("");
  const [generatedCert, setGeneratedCert] =
    useState<GeneratedCertificate | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  const [lookupCertNumber, setLookupCertNumber] = useState("");
  const [verifiedCert, setVerifiedCert] = useState<VerifiedCertificate | null>(
    null,
  );

  const generateMutation = useGenerateCertificateMutation();
  const verifyMutation = useVerifyCertificateMutation();

  const handleGenerate = async () => {
    if (!activeCohortId) return;
    setEligibilityError(null);
    try {
      const cert = await generateMutation.mutateAsync({
        cohortId: Number(activeCohortId),
        ...(directorName.trim() ? { directorName: directorName.trim() } : {}),
        ...(directorRnLicense.trim()
          ? { directorRnLicense: directorRnLicense.trim() }
          : {}),
      });
      setGeneratedCert(cert);
    } catch (err: any) {
      setEligibilityError(
        err?.response?.data?.message ||
          "Completion prerequisites (Orientation, >= 80% Theory, 22/22 Skills Lab, 40h Clinical) are not yet met.",
      );
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCertNumber.trim()) return;
    const res = await verifyMutation.mutateAsync(lookupCertNumber.trim());
    setVerifiedCert(res);
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                State Completion Certificates
              </h1>
              <p className="text-xs text-slate-500">
                Generate and verify official WABON NA completion certificates after completing all program gates.
              </p>
            </div>
          </div>
          <Link
            to="/verify-certificate"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Public Verification Portal <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Certificate Generation Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 print:border-0 print:shadow-none">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Program Cohort
                </Label>
                <select
                  value={activeCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold"
                >
                  {cohortEnrollments.length === 0 ? (
                    <option value="">No enrolled cohorts</option>
                  ) : (
                    cohortEnrollments.map((e: any) => {
                      const cId = String(e.cohortId || e.cohort?.id);
                      return (
                        <option key={e.id || cId} value={cId}>
                          {e.course?.title || `Course #${e.courseId}`} ·{" "}
                          {e.cohort?.name || `Cohort #${cId}`}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Program Director (Optional)
                </Label>
                <Input
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  placeholder="Director Name"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Director RN License (Optional)
                </Label>
                <Input
                  value={directorRnLicense}
                  onChange={(e) => setDirectorRnLicense(e.target.value)}
                  placeholder="e.g. RN60123456"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!activeCohortId || generateMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold h-9 text-xs"
            >
              {generateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Award className="w-4 h-4 mr-1.5" />
              )}
              Generate Certificate
            </Button>
          </div>

          {eligibilityError && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2 print:hidden">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Certificate Issuance Gate Not Met
              </div>
              <p>{eligibilityError}</p>
              <div className="flex flex-wrap gap-3 pt-1 font-semibold text-amber-800 underline">
                <Link to="/orientation">Check Orientation</Link>
                <Link to="/grades">Check Theory Grade (&ge; 80%)</Link>
                <Link to="/skills-lab">Check Skills Lab</Link>
                <Link to="/clinical">Check 40h Clinical Hours</Link>
              </div>
            </div>
          )}

          {generatedCert && (
            <div className="border-2 border-slate-800 rounded-2xl p-6 md:p-8 bg-slate-50/40 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">
                    {generatedCert.stateStandard}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {generatedCert.programTitle}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {generatedCert.courseTitle} · Approval Code:{" "}
                    <strong>{generatedCert.wabonApprovalCode}</strong>
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <Badge className="bg-emerald-600 text-white border-0 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {generatedCert.verification.status}
                  </Badge>
                  <div className="text-xs font-mono font-bold text-slate-800">
                    {generatedCert.certificateNumber}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">
                    Classroom Theory
                  </span>
                  <strong className="text-base text-slate-900">
                    {generatedCert.hoursBreakdown.classroomTheoryHours}h
                  </strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">
                    Skills Lab
                  </span>
                  <strong className="text-base text-slate-900">
                    {generatedCert.hoursBreakdown.skillsLabHours}h
                  </strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">
                    Clinical Practicum
                  </span>
                  <strong className="text-base text-slate-900">
                    {generatedCert.hoursBreakdown.clinicalHours}h
                  </strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">
                    Theory Score
                  </span>
                  <strong className="text-base text-slate-900">
                    {generatedCert.academicRecord.overallTheoryScorePercent}% (
                    {generatedCert.academicRecord.letterGrade})
                  </strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Program Director:</span>{" "}
                  <strong className="text-slate-900">
                    {generatedCert.signatures.programDirector}
                  </strong>{" "}
                  ({generatedCert.signatures.directorRnLicense})
                  <div className="text-[11px] text-slate-400">
                    Issued:{" "}
                    {generatedCert.signatures.issuedAt
                      ? format(
                          new Date(generatedCert.signatures.issuedAt),
                          "PPP",
                        )
                      : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <Link
                    to={`/verify/credential/${generatedCert.certificateNumber}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold hover:bg-slate-50"
                  >
                    Verify Link
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Certificate
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Verification Lookup */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 print:hidden">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verify a Certificate Number
          </h2>
          <form onSubmit={handleVerify} className="flex gap-2">
            <Input
              value={lookupCertNumber}
              onChange={(e) => setLookupCertNumber(e.target.value)}
              placeholder="Enter Certificate Number (e.g. ALIKO-WABON-...)"
              className="h-9 text-xs"
            />
            <Button
              type="submit"
              size="sm"
              disabled={verifyMutation.isPending}
              className="h-9 text-xs gap-1.5"
            >
              {verifyMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              Verify
            </Button>
          </form>

          {verifiedCert && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {verifiedCert.status} · {verifiedCert.certificateNumber}
              </div>
              <p className="text-emerald-800">
                {verifiedCert.institution} · {verifiedCert.programName} (
                {verifiedCert.wabonApprovalCode})
              </p>
              <p className="text-[11px] text-emerald-700">
                {verifiedCert.stateBoard} · {verifiedCert.regulatoryCompliance}
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default Certifications;
