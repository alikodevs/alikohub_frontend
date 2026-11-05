import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import StudentLayout from "@/features/student/components/StudentLayout";
import { useEnrollments } from "@/hooks/useAcademy";
import { useUser } from "@/features/auth/hooks/useAuth";
import {
  useMyAdmissionsApplication,
  useSubmitPrerequisitesMutation,
  useSignAgreementMutation,
} from "../hooks/useAdmissions";
import { admissionsService } from "../services/admissionsService";
import { useOrientationStatus } from "@/features/orientation/hooks/useOrientation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  FileText,
  Upload,
  ArrowRight,
  ExternalLink,
  Loader2,
  FileCheck2,
  BookOpen,
  GraduationCap,
  PenTool,
  Info,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

export const AdmissionsClearancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();

  // Cohort Selection
  const cohortOptions = React.useMemo(() => {
    if (!enrollments) return [];
    const map = new Map<number, { cohortId: number; name: string; courseTitle: string }>();
    enrollments.forEach((e: any) => {
      const cId = Number(e.cohortId || e.cohort?.id);
      if (cId && !map.has(cId)) {
        map.set(cId, {
          cohortId: cId,
          name: e.cohort?.name || `Cohort #${cId}`,
          courseTitle: e.course?.title || "CNA Training Program",
        });
      }
    });
    return Array.from(map.values());
  }, [enrollments]);

  const paramCohort = searchParams.get("cohortId");
  const [selectedCohortId, setSelectedCohortId] = useState<number>(() => {
    if (paramCohort && !isNaN(Number(paramCohort))) {
      return Number(paramCohort);
    }
    return 1;
  });

  useEffect(() => {
    if (cohortOptions.length > 0 && (!paramCohort || isNaN(Number(paramCohort)))) {
      setSelectedCohortId(cohortOptions[0].cohortId);
    }
  }, [cohortOptions, paramCohort]);

  // Data fetching
  const {
    data: application,
    isLoading: applicationLoading,
    refetch: refetchApp,
  } = useMyAdmissionsApplication(selectedCohortId);

  const {
    data: orientationStatus,
    isLoading: orientationLoading,
  } = useOrientationStatus(selectedCohortId);

  const submitDocsMutation = useSubmitPrerequisitesMutation();
  const signAgreementMutation = useSignAgreementMutation();

  // Documents state
  const [docUrls, setDocUrls] = useState({
    backgroundCheckUrl: "",
    tbTestProofUrl: "",
    immunizationProofUrl: "",
    cprCertUrl: "",
    idDocUrl: "",
    highSchoolProofUrl: "",
  });

  // Populate existing URLs from application
  useEffect(() => {
    if (application) {
      setDocUrls({
        backgroundCheckUrl: application.backgroundCheckUrl || "",
        tbTestProofUrl: application.tbTestProofUrl || "",
        immunizationProofUrl: application.immunizationProofUrl || "",
        cprCertUrl: application.cprCertUrl || "",
        idDocUrl: application.idDocUrl || "",
        highSchoolProofUrl: application.highSchoolProofUrl || "",
      });
    }
  }, [application]);

  // Uploading state tracking per field
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Digital Agreement Modal
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [agreedDisclosures, setAgreedDisclosures] = useState({
    wabonMandate: false,
    attendancePolicy: false,
    tuitionDisclosure: false,
    codeOfConduct: false,
  });

  const allDisclosuresAgreed =
    agreedDisclosures.wabonMandate &&
    agreedDisclosures.attendancePolicy &&
    agreedDisclosures.tuitionDisclosure &&
    agreedDisclosures.codeOfConduct;

  // Handle local file upload helper
  const handleFileUpload = async (field: keyof typeof docUrls, file: File) => {
    try {
      setUploadingField(field);
      const url = await admissionsService.uploadDocumentFile(file);
      setDocUrls((prev) => ({ ...prev, [field]: url }));
      toast.success("Document uploaded successfully");
    } catch {
      toast.error("File upload failed. You can paste the direct document URL below.");
    } finally {
      setUploadingField(null);
    }
  };

  // Submit all prerequisites
  const handleSaveDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohortId) return;

    if (
      !docUrls.backgroundCheckUrl ||
      !docUrls.tbTestProofUrl ||
      !docUrls.immunizationProofUrl ||
      !docUrls.cprCertUrl ||
      !docUrls.idDocUrl ||
      !docUrls.highSchoolProofUrl
    ) {
      toast.error("Please provide all 6 mandatory prerequisite documents.");
      return;
    }

    await submitDocsMutation.mutateAsync({
      cohortId: selectedCohortId,
      ...docUrls,
    });
  };

  // Digital Agreement submit
  const handleSignAgreementSubmit = async () => {
    if (!signatureName.trim()) {
      toast.error("Please type your legal name as digital signature.");
      return;
    }
    if (!allDisclosuresAgreed) {
      toast.error("Please acknowledge all statutory disclosures.");
      return;
    }

    await signAgreementMutation.mutateAsync({
      cohortId: selectedCohortId,
      signature: signatureName.trim(),
      acknowledgments: agreedDisclosures,
      agreedToStatutoryDisclosures: true,
      signedAt: new Date().toISOString(),
    });
    setIsAgreementModalOpen(false);
  };

  // Checklist counts & completion progress
  const hasBackground = Boolean(docUrls.backgroundCheckUrl || application?.backgroundCheckUrl);
  const hasTb = Boolean(docUrls.tbTestProofUrl || application?.tbTestProofUrl);
  const hasImmunization = Boolean(docUrls.immunizationProofUrl || application?.immunizationProofUrl);
  const hasCpr = Boolean(docUrls.cprCertUrl || application?.cprCertUrl);
  const hasId = Boolean(docUrls.idDocUrl || application?.idDocUrl);
  const hasHighSchool = Boolean(docUrls.highSchoolProofUrl || application?.highSchoolProofUrl);

  const docsCompletedCount = [
    hasBackground,
    hasTb,
    hasImmunization,
    hasCpr,
    hasId,
    hasHighSchool,
  ].filter(Boolean).length;

  const isAgreementSigned = Boolean(application?.agreementSigned || application?.agreementSignature);
  const isOrientationDone = Boolean(orientationStatus?.orientationCompleted);
  const isApproved = application?.status === "APPROVED";
  const isRejected = application?.status === "REJECTED";
  const isPendingReview = application?.status === "PENDING_REVIEW" || (docsCompletedCount === 6 && !isApproved && !isRejected);

  // Overall Clearance Progress
  // 1: Docs (6 items, 40%) + 2: Agreement (30%) + 3: Orientation (30%)
  const overallProgress = Math.round(
    (docsCompletedCount / 6) * 40 +
    (isAgreementSigned ? 30 : 0) +
    (isOrientationDone ? 30 : 0)
  );

  return (
    <StudentLayout>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Top Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-bold">
                WABON WAC 246-841A-440 Compliance
              </Badge>
              <Badge variant="outline" className="text-xs text-slate-500">
                Non-Credit Entry Gate
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
              Admissions Clearance & Onboarding Checklist
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Complete prerequisite documentation, digital enrollment agreement, and mandatory orientation before beginning theory coursework.
            </p>
          </div>

          {/* Cohort Selector */}
          {cohortOptions.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="cohort-select" className="text-xs font-bold text-slate-600">
                Cohort:
              </label>
              <select
                id="cohort-select"
                aria-label="Select cohort"
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(Number(e.target.value))}
                className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {cohortOptions.map((opt) => (
                  <option key={opt.cohortId} value={opt.cohortId}>
                    {opt.name} ({opt.courseTitle})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Rejection Remediation Banner ── */}
        {isRejected && application?.rejectionReason && (
          <div className="rounded-2xl p-5 bg-rose-50 border border-rose-200 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-rose-900">
                Admissions Clearance Requires Remediation
              </h3>
              <p className="text-xs text-rose-700">
                An instructor or admissions officer reviewed your documents and requested corrections:
              </p>
              <div className="p-3 bg-white/80 rounded-xl border border-rose-200/80 text-xs font-semibold text-rose-950 mt-2">
                "{application.rejectionReason}"
              </div>
              <p className="text-[11px] text-rose-600 mt-1">
                Please update the indicated prerequisite files or document links below and re-submit for review.
              </p>
            </div>
          </div>
        )}

        {/* ── Clearance Status Summary Strip ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status KPI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Clearance Status
            </span>
            <div className="flex items-center gap-2">
              {isApproved ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold py-1 px-3">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Cleared (Approved)
                </Badge>
              ) : isRejected ? (
                <Badge className="bg-rose-50 text-rose-700 border-rose-300 text-xs font-bold py-1 px-3">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Action Required
                </Badge>
              ) : isPendingReview ? (
                <Badge className="bg-blue-50 text-blue-700 border-blue-300 text-xs font-bold py-1 px-3">
                  <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" /> Pending Review
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs font-bold py-1 px-3 text-slate-500">
                  Documents Incomplete
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {isApproved
                ? "All entry gates satisfied. Theory courses active."
                : isRejected
                ? "Review instructor remediation notes above."
                : "Awaiting final faculty verification."}
            </p>
          </div>

          {/* Prerequisite Documents KPI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Prerequisite Files
            </span>
            <div className="text-xl font-black text-slate-900">
              {docsCompletedCount} / 6 <span className="text-xs font-semibold text-slate-400">Submitted</span>
            </div>
            <Progress value={(docsCompletedCount / 6) * 100} className="h-2 bg-slate-100" />
          </div>

          {/* Enrollment Agreement KPI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Enrollment Agreement
            </span>
            <div className="flex items-center gap-2">
              {isAgreementSigned ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Digitally Signed
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAgreementModalOpen(true)}
                  className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50 rounded-xl"
                >
                  <PenTool className="w-3.5 h-3.5 mr-1.5" /> Sign Agreement
                </Button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {isAgreementSigned && application?.agreementSignedAt
                ? `Signed on ${format(new Date(application.agreementSignedAt), "MMM d, yyyy")}`
                : "Statutory disclosure required"}
            </p>
          </div>

          {/* Orientation Gate KPI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Mandatory Orientation
            </span>
            <div className="flex items-center gap-2">
              {isOrientationDone ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                </span>
              ) : (
                <Button
                  size="sm"
                  asChild
                  className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-2xs"
                >
                  <Link to={`/orientation?cohortId=${selectedCohortId}`}>
                    Go to Orientation <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              WAC 246-841A-440(2) Mandatory
            </p>
          </div>
        </div>

        {/* ── SECTION 1: Prerequisite Documents Upload & Verification ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                1. Prerequisite Document Clearance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload scanned PDF/image copies or enter verified storage URLs for each mandatory statutory requirement.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-bold self-start sm:self-auto">
              {docsCompletedCount} of 6 Complete
            </Badge>
          </div>

          <form onSubmit={handleSaveDocuments} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document 1: Background Check */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label htmlFor="bg-check-input" className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    State/Federal Background Check *
                  </label>
                  {hasBackground ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600">Required</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Criminal history background check within the past 12 months.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="bg-check-input"
                    aria-label="State/Federal Background Check URL"
                    type="url"
                    placeholder="https://storage.example.com/docs/bg-check.pdf"
                    value={docUrls.backgroundCheckUrl}
                    onChange={(e) =>
                      setDocUrls((prev) => ({ ...prev, backgroundCheckUrl: e.target.value }))
                    }
                    className="text-xs rounded-xl bg-white"
                  />
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("backgroundCheckUrl", file);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={uploadingField === "backgroundCheckUrl"}
                      className="rounded-xl h-9 text-xs gap-1.5 pointer-events-none"
                    >
                      {uploadingField === "backgroundCheckUrl" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Upload
                    </Button>
                  </label>
                </div>
              </div>

              {/* Document 2: TB Skin Test */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label htmlFor="tb-test-input" className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    TB Test / QuantiFERON Gold Proof *
                  </label>
                  {hasTb ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600">Required</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Negative 2-step PPD, IGRA blood test, or negative chest X-ray proof.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="tb-test-input"
                    aria-label="TB Test / QuantiFERON Gold Proof URL"
                    type="url"
                    placeholder="https://storage.example.com/docs/tb-test.pdf"
                    value={docUrls.tbTestProofUrl}
                    onChange={(e) =>
                      setDocUrls((prev) => ({ ...prev, tbTestProofUrl: e.target.value }))
                    }
                    className="text-xs rounded-xl bg-white"
                  />
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("tbTestProofUrl", file);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={uploadingField === "tbTestProofUrl"}
                      className="rounded-xl h-9 text-xs gap-1.5 pointer-events-none"
                    >
                      {uploadingField === "tbTestProofUrl" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Upload
                    </Button>
                  </label>
                </div>
              </div>

              {/* Document 3: Immunization Records */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label htmlFor="immunization-input" className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Immunization Proof (Hepatitis B, MMR, Varicella) *
                  </label>
                  {hasImmunization ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600">Required</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Proof of vaccination series or positive antibody titers.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="immunization-input"
                    aria-label="Immunization Proof URL"
                    type="url"
                    placeholder="https://storage.example.com/docs/immunizations.pdf"
                    value={docUrls.immunizationProofUrl}
                    onChange={(e) =>
                      setDocUrls((prev) => ({ ...prev, immunizationProofUrl: e.target.value }))
                    }
                    className="text-xs rounded-xl bg-white"
                  />
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("immunizationProofUrl", file);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={uploadingField === "immunizationProofUrl"}
                      className="rounded-xl h-9 text-xs gap-1.5 pointer-events-none"
                    >
                      {uploadingField === "immunizationProofUrl" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Upload
                    </Button>
                  </label>
                </div>
              </div>

              {/* Document 4: CPR Certification */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label htmlFor="cpr-cert-input" className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    BLS / CPR Certification (AHA or ARC) *
                  </label>
                  {hasCpr ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600">Required</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Basic Life Support for Healthcare Providers valid through cohort clinicals.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="cpr-cert-input"
                    aria-label="BLS / CPR Certification URL"
                    type="url"
                    placeholder="https://storage.example.com/docs/cpr-card.pdf"
                    value={docUrls.cprCertUrl}
                    onChange={(e) =>
                      setDocUrls((prev) => ({ ...prev, cprCertUrl: e.target.value }))
                    }
                    className="text-xs rounded-xl bg-white"
                  />
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("cprCertUrl", file);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={uploadingField === "cprCertUrl"}
                      className="rounded-xl h-9 text-xs gap-1.5 pointer-events-none"
                    >
                      {uploadingField === "cprCertUrl" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Upload
                    </Button>
                  </label>
                </div>
              </div>

              {/* Document 5: Government ID */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label htmlFor="gov-id-input" className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Government Photo Identification *
                  </label>
                  {hasId ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600">Required</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Unexpired Driver's License, State ID Card, or Passport.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="gov-id-input"
                    aria-label="Government Photo Identification URL"
                    type="url"
                    placeholder="https://storage.example.com/docs/government-id.jpg"
                    value={docUrls.idDocUrl}
                    onChange={(e) =>
                      setDocUrls((prev) => ({ ...prev, idDocUrl: e.target.value }))
                    }
                    className="text-xs rounded-xl bg-white"
                  />
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("idDocUrl", file);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={uploadingField === "idDocUrl"}
                      className="rounded-xl h-9 text-xs gap-1.5 pointer-events-none"
                    >
                      {uploadingField === "idDocUrl" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Upload
                    </Button>
                  </label>
                </div>
              </div>

              {/* Document 6: High School Diploma / GED */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label htmlFor="diploma-input" className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    High School Diploma or GED Transcript *
                  </label>
                  {hasHighSchool ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600">Required</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Proof of secondary education completion or certified equivalency.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="diploma-input"
                    aria-label="High School Diploma or GED Transcript URL"
                    type="url"
                    placeholder="https://storage.example.com/docs/diploma.pdf"
                    value={docUrls.highSchoolProofUrl}
                    onChange={(e) =>
                      setDocUrls((prev) => ({ ...prev, highSchoolProofUrl: e.target.value }))
                    }
                    className="text-xs rounded-xl bg-white"
                  />
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("highSchoolProofUrl", file);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={uploadingField === "highSchoolProofUrl"}
                      className="rounded-xl h-9 text-xs gap-1.5 pointer-events-none"
                    >
                      {uploadingField === "highSchoolProofUrl" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Upload
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                Payload destination: <code className="font-mono text-slate-600">POST /admissions/submit</code>
              </span>
              <Button
                type="submit"
                disabled={submitDocsMutation.isPending || isApproved}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6 shadow-xs"
              >
                {submitDocsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : isApproved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-300" /> Documents Approved
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1.5" /> Submit Documents for Clearance
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* ── SECTION 2 & 3: Digital Agreement & Mandatory Orientation Gate ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 2: Enrollment Agreement */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                  <PenTool className="w-5 h-5" />
                </div>
                {isAgreementSigned ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold py-1 px-2.5">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Complete
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-bold py-1 px-2.5">
                    Pending Signature
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                2. Digital Enrollment Agreement & Statutory Disclosures
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review Washington State nursing assistant training disclosures, programmatic expectations, student rights, and clinical compliance mandates.
              </p>
              {isAgreementSigned && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-0.5">
                  <div className="font-semibold text-slate-800">
                    Digitally signed by: {application?.agreementSignature || user?.firstname}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Verified through <code className="font-mono">POST /admissions/sign-agreement</code>
                  </div>
                </div>
              )}
            </div>

            <div>
              {!isAgreementSigned ? (
                <Button
                  onClick={() => setIsAgreementModalOpen(true)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl h-10 shadow-xs"
                >
                  <PenTool className="w-3.5 h-3.5 mr-2" /> Read & Digitally Sign Agreement
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsAgreementModalOpen(true)}
                  className="w-full text-xs font-bold rounded-xl h-10"
                >
                  <FileText className="w-3.5 h-3.5 mr-2 text-slate-500" /> View Signed Agreement
                </Button>
              )}
            </div>
          </div>

          {/* Section 3: Orientation Gate */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                {isOrientationDone ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold py-1 px-2.5">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Complete
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-bold py-1 px-2.5">
                    Required Gate
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                3. Mandatory Student Orientation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete the WAC 246-841A-440(2) non-credit student orientation session, LMS digital literacy tutorial, and online netiquette code of conduct.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-0.5">
                <div className="font-semibold text-slate-800">
                  Orientation Gate: {isOrientationDone ? "Satisfied (Pass)" : "Enforced on Theory Lessons"}
                </div>
                <div className="text-[11px] text-slate-400">
                  Verified through <code className="font-mono">POST /orientation/complete</code>
                </div>
              </div>
            </div>

            <div>
              <Button
                asChild
                className={cn(
                  "w-full font-bold text-xs rounded-xl h-10 shadow-xs",
                  isOrientationDone
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                )}
              >
                <Link to={`/orientation?cohortId=${selectedCohortId}`}>
                  {isOrientationDone ? "Review Orientation Checklist" : "Complete Orientation Now"}
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Return to Course CTA ── */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h4 className="font-bold text-base font-heading">
              Ready to begin theory lessons?
            </h4>
            <p className="text-xs text-blue-200 max-w-xl">
              Once documents, enrollment agreement, and orientation are verified, the theory learning curriculum unlocks automatically.
            </p>
          </div>
          <Button
            asChild
            className="bg-white hover:bg-blue-50 text-slate-900 font-bold text-xs rounded-xl h-10 px-6 shrink-0 shadow-md"
          >
            <Link to="/learning">
              Go to My Learning <ArrowRight className="w-4 h-4 ml-1.5 text-blue-600" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Digital Enrollment Agreement Dialog ── */}
      <Dialog open={isAgreementModalOpen} onOpenChange={setIsAgreementModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[90vh] flex flex-col shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Student Enrollment Agreement & Disclosures
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Statutory enrollment disclosure under Washington State WABON regulations
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
            {/* Agreement Terms Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 max-h-56 overflow-y-auto custom-scrollbar font-mono text-[11px]">
              <p className="font-bold text-slate-900">
                ALIKOHUB ACADEMY — NURSING ASSISTANT CERTIFIED (CNA) PROGRAM
              </p>
              <p>
                1. Program Structure: Students must complete a minimum of 50 verified active theory hours, skills lab, and clinical externship in compliance with WAC 246-841A-440.
              </p>
              <p>
                2. Academic Engagement & Attendance: Active participation is verified via automated telemetry heartbeats. Tab switching or inactivity exceeding threshold pauses seat-time accrual. Week 1 attendance verification requires submission of designated gate exercise.
              </p>
              <p>
                3. Criminal Background & Disqualifications: Candidates acknowledge that clinical sites enforce strict background checks pursuant to DSHS and Department of Health standards.
              </p>
              <p>
                4. Non-Credit Orientation: Orientation is a non-credit prerequisite and does not count toward the 50 theory hours mandate.
              </p>
            </div>

            {/* Statutory Acknowledgments Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isAgreementSigned}
                  checked={isAgreementSigned || agreedDisclosures.wabonMandate}
                  onChange={(e) =>
                    setAgreedDisclosures((prev) => ({
                      ...prev,
                      wabonMandate: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700">
                  I acknowledge the Washington State Board of Nursing (WABON) 50-hour theory and clinical completion mandates.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isAgreementSigned}
                  checked={isAgreementSigned || agreedDisclosures.attendancePolicy}
                  onChange={(e) =>
                    setAgreedDisclosures((prev) => ({
                      ...prev,
                      attendancePolicy: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700">
                  I understand the first-week attendance verification census policy and the requirement to complete designated academic attendance gates.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isAgreementSigned}
                  checked={isAgreementSigned || agreedDisclosures.tuitionDisclosure}
                  onChange={(e) =>
                    setAgreedDisclosures((prev) => ({
                      ...prev,
                      tuitionDisclosure: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700">
                  I have received and reviewed the tuition schedule, refund policy, and programmatic supply disclosures.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isAgreementSigned}
                  checked={isAgreementSigned || agreedDisclosures.codeOfConduct}
                  onChange={(e) =>
                    setAgreedDisclosures((prev) => ({
                      ...prev,
                      codeOfConduct: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700">
                  I agree to adhere to the Student Code of Conduct, Patient Dignity Standards, and HIPAA clinical confidentiality rules.
                </span>
              </label>
            </div>

            {/* Signature Box */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label htmlFor="digital-signature-input" className="text-xs font-bold text-slate-800 block">
                Digital Signature (Type Full Legal Name) *
              </label>
              <Input
                id="digital-signature-input"
                aria-label="Digital Signature"
                disabled={isAgreementSigned}
                value={isAgreementSigned ? application?.agreementSignature || "" : signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="e.g. Jane Marie Doe"
                className="font-serif text-sm tracking-wide bg-slate-50/50"
              />
              <p className="text-[11px] text-slate-400">
                By typing your legal name and submitting, you execute a legally binding digital signature under the Washington Uniform Electronic Transactions Act (RCW 1.80).
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAgreementModalOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
            {!isAgreementSigned && (
              <Button
                size="sm"
                onClick={handleSignAgreementSubmit}
                disabled={signAgreementMutation.isPending || !allDisclosuresAgreed || !signatureName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-5 shadow-xs"
              >
                {signAgreementMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Recording Signature...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Sign & Acknowledge
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
};

export default AdmissionsClearancePage;

