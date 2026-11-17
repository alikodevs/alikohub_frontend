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
  Stethoscope,
  Award,
  CreditCard,
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
          courseTitle: e.course?.title || e.cohort?.name || "Course",
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
    return 0;
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
      !docUrls.backgroundCheckUrl?.trim() ||
      !docUrls.tbTestProofUrl?.trim() ||
      !docUrls.immunizationProofUrl?.trim() ||
      !docUrls.cprCertUrl?.trim() ||
      !docUrls.idDocUrl?.trim() ||
      !docUrls.highSchoolProofUrl?.trim()
    ) {
      toast.error("Please provide all 6 mandatory prerequisite documents.");
      return;
    }

    await submitDocsMutation.mutateAsync({
      cohortId: selectedCohortId,
      backgroundCheckUrl: docUrls.backgroundCheckUrl.trim(),
      tbTestProofUrl: docUrls.tbTestProofUrl.trim(),
      immunizationProofUrl: docUrls.immunizationProofUrl.trim(),
      cprCertUrl: docUrls.cprCertUrl.trim(),
      idDocUrl: docUrls.idDocUrl.trim(),
      highSchoolProofUrl: docUrls.highSchoolProofUrl.trim(),
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

    try {
      // Save current document URLs so application record is complete in database
      await submitDocsMutation.mutateAsync({
        cohortId: selectedCohortId,
        backgroundCheckUrl: docUrls.backgroundCheckUrl || application?.backgroundCheckUrl || "",
        tbTestProofUrl: docUrls.tbTestProofUrl || application?.tbTestProofUrl || "",
        immunizationProofUrl: docUrls.immunizationProofUrl || application?.immunizationProofUrl || "",
        cprCertUrl: docUrls.cprCertUrl || application?.cprCertUrl || "",
        idDocUrl: docUrls.idDocUrl || application?.idDocUrl || "",
        highSchoolProofUrl: docUrls.highSchoolProofUrl || application?.highSchoolProofUrl || "",
      });

      await signAgreementMutation.mutateAsync({
        cohortId: selectedCohortId,
        signatureUrl: signatureName.trim(),
        disclosuresAcknowledged: true,
      });
      setIsAgreementModalOpen(false);
    } catch {
      // Errors handled by mutation onError toasts
    }
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

  const isAgreementSigned = Boolean(
    application?.agreementSigned ||
    application?.agreementSignature ||
    application?.agreementSignatureUrl
  );
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
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ── Compact Cohort Selector Row (Separate, does not compete with title) ── */}
        {cohortOptions.length > 1 && (
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Cohort
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="cohort-select" className="text-xs text-slate-500 font-medium">
                Cohort:
              </label>
              <select
                id="cohort-select"
                aria-label="Select cohort"
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(Number(e.target.value))}
                className="text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {cohortOptions.map((opt) => (
                  <option key={opt.cohortId} value={opt.cohortId}>
                    {opt.name} ({opt.courseTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Hero Header: Light, elegant with subtle brand blue & orange curve ── */}
        <div className="rounded-3xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden relative">
          <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
            {/* Left Title & Subtitle */}
            <div className="relative z-10 max-w-lg">
              <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-[#081831] tracking-tight leading-[1.15]">
                Admissions<br />
                <span className="text-primary">Clearance</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-3 leading-relaxed font-normal">
                Complete prerequisites, enrollment agreement, and orientation to unlock coursework.
              </p>
            </div>

            {/* Right: Decorative brand wave & Graduation Cap artwork */}
            <div className="relative md:w-80 h-36 sm:h-40 shrink-0 flex items-center justify-end pointer-events-none overflow-hidden">
              <svg
                viewBox="0 0 320 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                {/* Subtle background soft blue glow */}
                <ellipse cx="220" cy="80" rx="90" ry="70" fill="#EAF3F9" opacity="0.7" />

                {/* Curved blue brand swoosh */}
                <path
                  d="M110 0 C150 70 170 160 320 160 L320 0 Z"
                  fill="url(#blue-brand-gradient)"
                />
                {/* Curved orange accent stroke */}
                <path
                  d="M106 0 C146 70 166 160 316 160"
                  stroke="#D77510"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Stacked books */}
                {/* Book 1 (bottom) */}
                <rect x="180" y="118" width="110" height="12" rx="2" fill="#ffffff" stroke="#E2E8F0" strokeWidth="1.5" />
                <rect x="176" y="117" width="8" height="14" rx="2" fill="#084B78" />
                {/* Book 2 (middle) */}
                <rect x="186" y="104" width="102" height="12" rx="2" fill="#ffffff" stroke="#E2E8F0" strokeWidth="1.5" />
                <rect x="182" y="103" width="8" height="14" rx="2" fill="#D77510" />
                {/* Book 3 (top) */}
                <rect x="192" y="90" width="94" height="12" rx="2" fill="#ffffff" stroke="#E2E8F0" strokeWidth="1.5" />
                <rect x="188" y="89" width="8" height="14" rx="2" fill="#0A65A0" />

                {/* Graduation cap skull cap */}
                <ellipse cx="238" cy="74" rx="28" ry="12" fill="#1e293b" />
                <path d="M210 74 L210 84 C210 92 266 92 266 84 L266 74 Z" fill="#0f172a" />

                {/* Graduation cap diamond top */}
                <polygon points="238,44 286,60 238,76 190,60" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                {/* Cap button */}
                <circle cx="238" cy="60" r="3" fill="#D77510" />
                {/* Tassel cord and gold tassel */}
                <path d="M238 60 Q265 65 268 76" stroke="#D77510" strokeWidth="1.5" fill="none" />
                <polygon points="266,76 270,76 272,96 264,96" fill="#D77510" />
                <line x1="264" y1="96" x2="272" y2="96" stroke="#AC5B0B" strokeWidth="2" />

                <defs>
                  <linearGradient id="blue-brand-gradient" x1="120" y1="0" x2="300" y2="160" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0A65A0" />
                    <stop offset="1" stopColor="#084B78" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Integrated Milestones Progress Row */}
          <div className="border-t border-slate-100 bg-[#F4F8FB] px-6 sm:px-8 py-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* 3 Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 flex-1">
                {/* Step 1 */}
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                    docsCompletedCount === 6
                      ? "bg-emerald-600 text-white"
                      : "bg-primary text-white"
                  )}>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800">Prerequisites</p>
                    <p className="text-[11px] text-slate-500 font-medium">{docsCompletedCount}/6 uploaded</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                    isAgreementSigned
                      ? "bg-emerald-600 text-white"
                      : "bg-primary text-white"
                  )}>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800">Agreement</p>
                    <p className="text-[11px] text-slate-500 font-medium">{isAgreementSigned ? "Signed" : "Pending"}</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                    isOrientationDone
                      ? "bg-emerald-600 text-white"
                      : "bg-primary text-white"
                  )}>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800">Orientation</p>
                    <p className="text-[11px] text-slate-500 font-medium">{isOrientationDone ? "Complete" : "Pending"}</p>
                  </div>
                </div>
              </div>

              {/* Overall percentage circle badge */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0",
                  overallProgress === 100 ? "bg-emerald-600" : "bg-primary"
                )}>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-900 block leading-none">
                    {overallProgress}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium leading-none">
                    Complete
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom slim progress line */}
            <div className="w-full h-1 bg-slate-200/70 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Rejection Remediation Banner ── */}
        {isRejected && application?.rejectionReason && (
          <div className="rounded-2xl p-5 bg-rose-50 border border-rose-200 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-semibold text-rose-900">Remediation Required</h3>
              <div className="p-3 bg-white rounded-xl border border-rose-200/80 text-xs font-medium text-rose-950 mt-1">
                "{application.rejectionReason}"
              </div>
              <p className="text-[11px] text-rose-600">Update the indicated files and re-submit.</p>
            </div>
          </div>
        )}

        {/* ── Four Summary Cards (White background, subtle borders, brand icons, consistent height) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Clearance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2 relative overflow-hidden transition-all hover:shadow-xs">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none mb-1">
                  CLEARANCE
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {isApproved ? "Cleared" : isRejected ? "Action Needed" : isPendingReview ? "Pending" : "Incomplete"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Documents */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2 relative overflow-hidden transition-all hover:shadow-xs">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EAF3F9] text-primary border border-[#E2E8F0] flex items-center justify-center shrink-0">
                <FileCheck2 className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block leading-none mb-1">
                  DOCUMENTS
                </span>
                <p className="text-sm sm:text-base font-semibold text-primary truncate">
                  {docsCompletedCount}/6
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Agreement */}
          <div
            onClick={!isAgreementSigned ? () => setIsAgreementModalOpen(true) : undefined}
            className={cn(
              "bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2 relative overflow-hidden transition-all hover:shadow-xs",
              !isAgreementSigned && "cursor-pointer hover:border-primary"
            )}
          >
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#084B78]" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EAF3F9] text-primary border border-[#E2E8F0] flex items-center justify-center shrink-0">
                <PenTool className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block leading-none mb-1">
                  AGREEMENT
                </span>
                <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                  {isAgreementSigned ? "Signed" : "Pending"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Orientation */}
          <Link
            to={!isOrientationDone ? `/orientation?cohortId=${selectedCohortId}` : "#"}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2 relative overflow-hidden transition-all hover:shadow-xs block"
          >
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#D77510]" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF2E3] text-[#D77510] border border-[#D77510]/30 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block leading-none mb-1">
                  ORIENTATION
                </span>
                <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                  {isOrientationDone ? "Complete" : "Required"}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── SECTION 1: 6 Prerequisite Documents (Clean 3-column layout matching reference) ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EAF3F9] text-primary border border-[#E2E8F0] flex items-center justify-center shrink-0">
                <FileCheck2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-[15px] font-heading font-semibold text-slate-900">
                  Prerequisite Documents
                </h2>
                <p className="text-xs text-slate-500">
                  Upload or paste a URL for each requirement
                </p>
              </div>
            </div>
            <div className="self-start sm:self-auto">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                docsCompletedCount === 6
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              )}>
                {docsCompletedCount === 6 && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                {docsCompletedCount}/6 Ready
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveDocuments} className="p-5 sm:p-6 space-y-6">
            {/* 3-Column Grid of 6 Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {([
                { field: "backgroundCheckUrl" as const, id: "bg-check", label: "Background Check" },
                { field: "tbTestProofUrl" as const, id: "tb-test", label: "TB Screening" },
                { field: "immunizationProofUrl" as const, id: "immunization", label: "Immunizations" },
                { field: "cprCertUrl" as const, id: "cpr-cert", label: "BLS / CPR Card" },
                { field: "idDocUrl" as const, id: "gov-id", label: "Government ID" },
                { field: "highSchoolProofUrl" as const, id: "diploma", label: "HS Diploma / GED" },
              ]).map((doc) => {
                const val = docUrls[doc.field] || "";
                const ready = Boolean(val.trim());
                const uploading = uploadingField === doc.field;

                return (
                  <div
                    key={doc.field}
                    className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-primary/50 transition-all space-y-2.5"
                  >
                    {/* Header: Status icon + Label */}
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                        ready ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                      )}>
                        {ready ? (
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-900 truncate flex-1">
                        {doc.label}
                      </span>
                    </div>

                    {/* Clean Input row with external link & upload button */}
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Input
                          id={`${doc.id}-input`}
                          aria-label={doc.label}
                          type="url"
                          placeholder="https://..."
                          value={val}
                          onChange={(e) => setDocUrls((prev) => ({ ...prev, [doc.field]: e.target.value }))}
                          className="text-xs h-8.5 rounded-xl bg-slate-50/70 border-slate-200 focus:bg-white focus:border-primary pr-7 transition-colors"
                        />
                        {val.trim() && (
                          <a
                            href={val}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-0.5"
                            title="Open link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      <label className="cursor-pointer shrink-0">
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(doc.field, file);
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={uploading}
                          className="rounded-xl h-8.5 px-2.5 text-xs font-medium pointer-events-none border-slate-200 hover:bg-[#EAF3F9] hover:text-primary"
                        >
                          {uploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </Button>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                All documents must be current, authentic, and legible.
              </span>
              <Button
                type="submit"
                disabled={submitDocsMutation.isPending || isApproved}
                className={cn(
                  "font-medium text-xs rounded-xl h-10 px-6 shadow-xs transition-all",
                  isApproved
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-primary hover:bg-[#084B78] text-white"
                )}
              >
                {submitDocsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : isApproved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-200" /> Documents Approved
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1.5" /> Submit for Clearance
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* ── SECTION 2 & 3: Digital Agreement & Orientation ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 2: Enrollment Agreement */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5 transition-all hover:border-primary/40">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF3F9] border border-[#E2E8F0] text-primary flex items-center justify-center shrink-0">
                  <PenTool className="w-5 h-5" />
                </div>
                {isAgreementSigned ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3 stroke-[2.5]" /> Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Pending Signature
                  </span>
                )}
              </div>
              <h3 className="text-base font-medium text-slate-900 font-heading">
                2. Digital Enrollment Agreement
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review statutory disclosures, programmatic expectations, student rights, and clinical compliance mandates.
              </p>
              {isAgreementSigned && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-0.5">
                  <div className="font-medium text-slate-800">
                    Signed by: {application?.agreementSignature || application?.agreementSignatureUrl || user?.firstname}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> On file &amp; acknowledged
                  </div>
                </div>
              )}
            </div>

            <div>
              {!isAgreementSigned ? (
                <Button
                  onClick={() => setIsAgreementModalOpen(true)}
                  className="w-full bg-primary hover:bg-[#084B78] text-white font-medium text-xs rounded-xl h-10 shadow-xs"
                >
                  <PenTool className="w-3.5 h-3.5 mr-2" /> Read &amp; Sign Agreement
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsAgreementModalOpen(true)}
                  className="w-full text-xs font-medium rounded-xl h-10 bg-white hover:bg-slate-50 border-slate-200"
                >
                  <FileText className="w-3.5 h-3.5 mr-2 text-slate-500" /> View Agreement
                </Button>
              )}
            </div>
          </div>

          {/* Section 3: Orientation Gate */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5 transition-all hover:border-[#D77510]/40">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF2E3] border border-[#E2E8F0] text-[#D77510] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                {isOrientationDone ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3 stroke-[2.5]" /> Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Required Gate
                  </span>
                )}
              </div>
              <h3 className="text-base font-medium text-slate-900 font-heading">
                3. Mandatory Orientation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete the student orientation session, LMS navigation tutorial, and online netiquette code of conduct.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-0.5">
                <div className="font-medium text-slate-800">
                  Status: {isOrientationDone ? "Completed" : "Pending"}
                </div>
                <div className="text-[11px] text-slate-500">
                  Required before accessing clinical theory lessons
                </div>
              </div>
            </div>

            <div>
              <Button
                asChild
                className={cn(
                  "w-full font-medium text-xs rounded-xl h-10 shadow-xs transition-all",
                  isOrientationDone
                    ? "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                    : "bg-[#D77510] hover:bg-[#AC5B0B] text-white shadow-xs"
                )}
              >
                <Link to={`/orientation?cohortId=${selectedCohortId}`}>
                  {isOrientationDone ? "Review Orientation" : "Complete Orientation Now"}
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ── CTA Footer ── */}
        <div className="p-5 rounded-2xl bg-[#F7F9FC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="font-semibold text-sm text-[#081831] font-heading">
              Ready to start theory lessons?
            </h4>
            <p className="text-xs text-slate-500">
              All 3 gates must be verified to unlock the curriculum.
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-[#084B78] text-white font-medium text-xs rounded-xl h-10 px-6 shrink-0 shadow-xs">
            <Link to="/learning">
              Go to My Learning <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Digital Enrollment Agreement Dialog ── */}
      <Dialog open={isAgreementModalOpen} onOpenChange={setIsAgreementModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 border border-border rounded-3xl overflow-hidden bg-white max-h-[90vh] flex flex-col shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-[#F4F8FB]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EAF3F9] border border-[#E2E8F0] text-primary flex items-center justify-center shrink-0">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-heading font-medium text-slate-900">
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
                1. Program Structure: Students must complete verified active theory hours, skills lab, and clinical externship according to curriculum requirements.
              </p>
              <p>
                2. Academic Engagement & Attendance: Active participation is verified via automated telemetry heartbeats. Tab switching or inactivity exceeding threshold pauses seat-time accrual. Week 1 attendance verification requires submission of designated gate exercise.
              </p>
              <p>
                3. Criminal Background & Disqualifications: Candidates acknowledge that clinical sites enforce strict background checks pursuant to DSHS and Department of Health standards.
              </p>
              <p>
                4. Non-Credit Orientation: Orientation is a non-credit prerequisite and does not count toward required theory hours.
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
                  I acknowledge the program's theory, skills lab, and clinical completion requirements.
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
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-xs text-slate-700">
                  I agree to adhere to the Student Code of Conduct, Patient Dignity Standards, and HIPAA clinical confidentiality rules.
                </span>
              </label>
            </div>

            {/* Signature Box */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label htmlFor="digital-signature-input" className="text-xs font-medium text-slate-800 block">
                Digital Signature (Type Full Legal Name) *
              </label>
              <Input
                id="digital-signature-input"
                aria-label="Digital Signature"
                disabled={isAgreementSigned}
                value={
                  isAgreementSigned
                    ? application?.agreementSignature ||
                      application?.agreementSignatureUrl ||
                      signatureName
                    : signatureName
                }
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
              className="rounded-xl text-xs font-medium"
            >
              Close
            </Button>
            {!isAgreementSigned && (
              <Button
                size="sm"
                onClick={handleSignAgreementSubmit}
                disabled={signAgreementMutation.isPending || !allDisclosuresAgreed || !signatureName.trim()}
                className="bg-primary hover:bg-[#084B78] text-white font-medium text-xs rounded-xl px-5 shadow-xs"
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

