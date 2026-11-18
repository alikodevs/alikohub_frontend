import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  FileText,
  Upload,
  ArrowRight,
  ExternalLink,
  Loader2,
  FileCheck2,
  GraduationCap,
  PenTool,
  Check,
  Activity,
  HeartPulse,
  CreditCard,
  Download,
  Eye,
  Link as LinkIcon,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import DocumentPreviewModal from "@/components/shared/DocumentPreviewModal";

interface PrerequisiteDocConfig {
  field:
    | "backgroundCheckUrl"
    | "tbTestProofUrl"
    | "immunizationProofUrl"
    | "cprCertUrl"
    | "idDocUrl"
    | "highSchoolProofUrl";
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBadgeClass: string;
}

const PREREQUISITE_DOCS: PrerequisiteDocConfig[] = [
  {
    field: "backgroundCheckUrl",
    id: "bg-check",
    title: "Background Check",
    icon: ShieldCheck,
    iconBadgeClass: "bg-[#10B981] text-white", // Emerald Green
  },
  {
    field: "tbTestProofUrl",
    id: "tb-test",
    title: "TB Screening",
    icon: Activity,
    iconBadgeClass: "bg-[#0183C7] text-white", // Sky Blue
  },
  {
    field: "immunizationProofUrl",
    id: "immunization",
    title: "Immunizations",
    icon: ShieldAlert,
    iconBadgeClass: "bg-[#E11D48] text-white", // Rose Red
  },
  {
    field: "cprCertUrl",
    id: "cpr-cert",
    title: "BLS / CPR Card",
    icon: HeartPulse,
    iconBadgeClass: "bg-[#F43F5E] text-white", // Red
  },
  {
    field: "idDocUrl",
    id: "gov-id",
    title: "Government ID",
    icon: CreditCard,
    iconBadgeClass: "bg-[#EA8A00] text-white", // Amber
  },
  {
    field: "highSchoolProofUrl",
    id: "diploma",
    title: "HS Diploma / GED",
    icon: GraduationCap,
    iconBadgeClass: "bg-[#7C3AED] text-white", // Violet
  },
];

export const AdmissionsClearancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { data: user } = useUser();
  const { data: enrollments } = useEnrollments();

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
  const { data: application } = useMyAdmissionsApplication(selectedCohortId);
  const { data: orientationStatus } = useOrientationStatus(selectedCohortId);

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

  // Toggle state for pasting direct URL per doc
  const [activeUrlDocField, setActiveUrlDocField] = useState<string | null>(null);

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

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
      toast.error("File upload failed. You can paste the direct document URL.");
      setActiveUrlDocField(field);
    } finally {
      setUploadingField(null);
    }
  };

  // Submit all prerequisites
  const handleSaveDocuments = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCohortId) return;

    if (
      !docUrls.backgroundCheckUrl?.trim() ||
      !docUrls.tbTestProofUrl?.trim() ||
      !docUrls.immunizationProofUrl?.trim() ||
      !docUrls.cprCertUrl?.trim() ||
      !docUrls.idDocUrl?.trim() ||
      !docUrls.highSchoolProofUrl?.trim()
    ) {
      toast.error("Please provide all 6 mandatory prerequisite documents before submitting for clearance.");
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
      // Handled by mutation onError toasts
    }
  };

  // Checklist counts & completion progress
  const hasBackground = Boolean(docUrls.backgroundCheckUrl || application?.backgroundCheckUrl);
  const hasTb = Boolean(docUrls.tbTestProofUrl || application?.tbTestProofUrl);
  const hasImmunization = Boolean(docUrls.immunizationProofUrl || application?.immunizationProofUrl);
  const hasCpr = Boolean(docUrls.cprCertUrl || application?.cprCertUrl);
  const hasId = Boolean(docUrls.idDocUrl || application?.idDocUrl);
  const hasHighSchool = Boolean(docUrls.highSchoolProofUrl || application?.highSchoolProofUrl);

  const isApproved = application?.status === "APPROVED";
  const isRejected = application?.status === "REJECTED";

  const docsCompletedCount = isApproved
    ? 6
    : [
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
  const isPendingReview =
    application?.status === "PENDING_REVIEW" ||
    (docsCompletedCount === 6 && !isApproved && !isRejected);

  // Download checklist PDF
  const handleDownloadChecklist = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 27, 52); // #0F1B34
      doc.text("ALIKOHUB ACADEMY", 20, 22);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(43, 94, 156); // #2B5E9C
      doc.text("Admissions Clearance Checklist", 20, 30);

      doc.setFontSize(10);
      doc.setTextColor(90, 107, 140); // #5A6B8C
      doc.text(`Generated: ${format(new Date(), "PPP")}`, 20, 38);
      doc.text(
        `Student: ${user?.firstname || ""} ${user?.lastname || ""} (${user?.email || ""})`,
        20,
        44
      );
      const cohortName =
        cohortOptions.find((c) => c.cohortId === selectedCohortId)?.name ||
        application?.cohort?.name;
      if (cohortName) {
        doc.text(`Cohort: ${cohortName}`, 20, 50);
      }

      doc.setDrawColor(225, 231, 241); // #E1E7F1
      doc.line(20, 55, 190, 55);

      // 4 Gates Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 27, 52);
      doc.text("Four Regulatory Clearance Gates", 20, 65);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`1. Prerequisites: ${docsCompletedCount} of 6 uploaded`, 25, 74);
      doc.text(
        `2. Enrollment Agreement: ${isAgreementSigned ? "Signed & Acknowledged" : "Pending Signature"}`,
        25,
        82
      );
      doc.text(
        `3. Mandatory Orientation: ${isOrientationDone ? "Completed" : "Required"}`,
        25,
        90
      );
      doc.text(
        `4. Clearance Status: ${
          isApproved
            ? "Approved (Cleared)"
            : isPendingReview
            ? "Pending Review"
            : "Incomplete"
        }`,
        25,
        98
      );

      doc.line(20, 106, 190, 106);

      // Document Breakdown
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 27, 52);
      doc.text("Prerequisite Documents Breakdown", 20, 116);

      let y = 126;
      PREREQUISITE_DOCS.forEach((item, idx) => {
        const isReady = Boolean(docUrls[item.field]);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(15, 27, 52);
        doc.text(`${idx + 1}. ${item.title}`, 25, y);
        if (isReady) {
          doc.setTextColor(16, 185, 129); // #10B981
          doc.text("[READY / ON FILE]", 150, y);
        } else {
          doc.setTextColor(244, 63, 94); // #F43F5E
          doc.text("[MISSING / REQUIRED]", 150, y);
        }
        y += 8;
      });

      doc.line(20, y + 4, 190, y + 4);
      doc.setFontSize(9);
      doc.setTextColor(90, 107, 140);
      doc.text(
        "All clinical prerequisites must be current, authentic, and legible pursuant to WAC 246-841A.",
        20,
        y + 14
      );

      doc.save("Aliko-Admissions-Clearance-Checklist.pdf");
      toast.success("Checklist PDF downloaded successfully");
    } catch (err) {
      console.error("PDF generation error", err);
      toast.error("Could not generate checklist PDF.");
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#F2F5FB] py-6 sm:py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* ── Top Header Bar (Matching PDF & Orientation: Title + Subtitle + Action buttons) ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0 pr-0 sm:pr-4">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#0F1B34] tracking-tight">
                Admissions Clearance
              </h1>
              <p className="text-xs sm:text-sm text-[#5A6B8C] mt-1 font-normal">
                Complete prerequisites, enrollment agreement and orientation to unlock coursework
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Cohort Dropdown Button - Consistent styling and responsive width */}
              {cohortOptions.length > 1 && (
                <div className="relative inline-flex items-center w-full sm:w-auto">
                  <select
                    id="cohort-select"
                    aria-label="Select cohort"
                    value={selectedCohortId}
                    onChange={(e) => setSelectedCohortId(Number(e.target.value))}
                    className="h-10 pl-4 pr-9 rounded-xl text-xs font-semibold text-[#0F1B34] bg-white border border-[#E1E7F1] hover:bg-slate-50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F16A1C] cursor-pointer appearance-none transition-all w-full sm:w-auto sm:max-w-[200px] truncate"
                  >
                    {cohortOptions.map((opt) => (
                      <option key={opt.cohortId} value={opt.cohortId}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5A6B8C] absolute right-3 pointer-events-none" />
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadChecklist}
                className="h-10 px-3.5 sm:px-4 rounded-xl text-xs font-semibold text-[#0F1B34] bg-white border-[#E1E7F1] hover:bg-slate-50 shadow-2xs cursor-pointer flex-1 sm:flex-initial justify-center whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-[#5A6B8C] shrink-0" />
                <span className="truncate">Download checklist</span>
              </Button>

              {/* Orange only on Submit CTA per Design System V2 */}
              <Button
                type="button"
                onClick={() => handleSaveDocuments()}
                disabled={submitDocsMutation.isPending || isApproved}
                className={cn(
                  "h-10 px-4 sm:px-5 rounded-xl text-xs font-semibold shadow-2xs transition-all flex-1 sm:flex-initial justify-center whitespace-nowrap",
                  isApproved
                    ? "bg-[#F16A1C] text-white cursor-default opacity-100"
                    : "bg-[#F16A1C] hover:bg-[#D95507] text-white cursor-pointer"
                )}
              >
                {submitDocsMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin shrink-0" />
                    Submitting...
                  </>
                ) : isApproved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    Clearance Approved
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    Submit for clearance
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ── 4-Gate Stepper: "Stepper is the color moment" (Pure white card, 4 distinct circle colors) ── */}
          <div className="bg-white rounded-2xl border border-[#E1E7F1] p-5 sm:p-6 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
              {/* Step 1: Prerequisites (Amber/Orange #EA8A00) */}
              <div className="flex items-center gap-3.5 p-2 relative">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs text-white bg-[#EA8A00] z-10">
                  {docsCompletedCount === 6 ? (
                    <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  ) : (
                    "1"
                  )}
                </div>
                <div className="min-w-0 flex-1 z-10">
                  <span className="text-xs font-semibold text-[#0F1B34] block truncate font-heading">
                    Prerequisites
                  </span>
                  <span className="text-[11px] text-[#5A6B8C] font-medium block">
                    {docsCompletedCount} of 6 uploaded
                  </span>
                </div>

                {/* Sequence line to Step 2 */}
                <div className="hidden lg:flex items-center absolute -right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-0 text-slate-300">
                  <div className="w-5 h-[2px] bg-slate-200 rounded-full" />
                  <ArrowRight className="w-3.5 h-3.5 -ml-1 text-slate-300 stroke-[2.5]" />
                </div>
                {/* Mobile / Tablet sequence line */}
                <div className="hidden sm:flex lg:hidden items-center absolute -right-2 top-1/2 -translate-y-1/2 pointer-events-none z-0 text-slate-300">
                  <div className="w-4 h-[2px] bg-slate-200 rounded-full" />
                  <ArrowRight className="w-3.5 h-3.5 -ml-1 text-slate-300 stroke-[2.5]" />
                </div>
              </div>

              {/* Step 2: Enrollment agreement (Violet #7C3AED) */}
              <div className="flex items-center gap-3.5 p-2 relative">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs text-white bg-[#7C3AED] z-10">
                  {isAgreementSigned ? (
                    <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  ) : (
                    "2"
                  )}
                </div>
                <div className="min-w-0 flex-1 z-10">
                  <span className="text-xs font-semibold text-[#0F1B34] block truncate font-heading">
                    Enrollment agreement
                  </span>
                  <span className="text-[11px] text-[#5A6B8C] font-medium block">
                    {isAgreementSigned ? "Signed" : "Pending signature"}
                  </span>
                </div>

                {/* Sequence line to Step 3 */}
                <div className="hidden lg:flex items-center absolute -right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-0 text-slate-300">
                  <div className="w-5 h-[2px] bg-slate-200 rounded-full" />
                  <ArrowRight className="w-3.5 h-3.5 -ml-1 text-slate-300 stroke-[2.5]" />
                </div>
              </div>

              {/* Step 3: Orientation (Sky Blue #0183C7) */}
              <div className="flex items-center gap-3.5 p-2 relative">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs text-white bg-[#0183C7] z-10">
                  {isOrientationDone ? (
                    <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  ) : (
                    "3"
                  )}
                </div>
                <div className="min-w-0 flex-1 z-10">
                  <span className="text-xs font-semibold text-[#0F1B34] block truncate font-heading">
                    Orientation
                  </span>
                  <span className="text-[11px] text-[#5A6B8C] font-medium block">
                    {isOrientationDone ? "Completed" : "3 items required"}
                  </span>
                </div>

                {/* Sequence line to Step 4 */}
                <div className="hidden lg:flex items-center absolute -right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-0 text-slate-300">
                  <div className="w-5 h-[2px] bg-slate-200 rounded-full" />
                  <ArrowRight className="w-3.5 h-3.5 -ml-1 text-slate-300 stroke-[2.5]" />
                </div>
                {/* Mobile / Tablet sequence line */}
                <div className="hidden sm:flex lg:hidden items-center absolute -right-2 top-1/2 -translate-y-1/2 pointer-events-none z-0 text-slate-300">
                  <div className="w-4 h-[2px] bg-slate-200 rounded-full" />
                  <ArrowRight className="w-3.5 h-3.5 -ml-1 text-slate-300 stroke-[2.5]" />
                </div>
              </div>

              {/* Step 4: Clearance (Slate Gray #465469) */}
              <div className="flex items-center gap-3.5 p-2 relative">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs text-white bg-[#465469] z-10">
                  {isApproved ? (
                    <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  ) : (
                    "4"
                  )}
                </div>
                <div className="min-w-0 flex-1 z-10">
                  <span className="text-xs font-semibold text-[#0F1B34] block truncate font-heading">
                    Clearance
                  </span>
                  <span className="text-[11px] text-[#5A6B8C] font-medium block">
                    {isApproved
                      ? "Approved"
                      : isPendingReview
                      ? "In review"
                      : "Not yet submitted"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Remediation Required Alert (if rejected) ── */}
          {isRejected && application?.rejectionReason && (
            <div className="rounded-2xl p-4 bg-[#FEF4F6] border-2 border-dashed border-[#F43F5E] shadow-2xs flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#E11C48] text-white flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-semibold text-[#0F1B34] font-heading">
                  Remediation Required
                </h3>
                <div className="p-3 bg-white rounded-xl border border-[#E1E7F1] text-xs font-medium text-[#0F1B34] mt-1">
                  "{application.rejectionReason}"
                </div>
                <p className="text-[11px] text-[#F43F5E]">
                  Update the indicated documents and re-submit for review.
                </p>
              </div>
            </div>
          )}

          {/* ── 4 Vivid Status KPI Cards Row (V1 Layout: Distinct Gradient Fills + Decorative Background Shapes) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Clearance status (V1: Rose Red Gradient or Emerald Green when Approved) */}
            <div
              className={cn(
                "rounded-2xl p-4 shadow-2xs relative overflow-hidden text-white transition-all",
                isApproved
                  ? "bg-gradient-to-br from-[#049569] to-[#10B981]"
                  : "bg-gradient-to-br from-[#E11C48] to-[#F43F5E]"
              )}
            >
              {/* Decorative background circle shapes per V1 design */}
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/15 pointer-events-none blur-xs" />
              <div className="absolute right-5 -top-5 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center mb-2.5 shadow-2xs backdrop-blur-xs">
                  {isApproved ? (
                    <ShieldCheck className="w-4.5 h-4.5 stroke-[2.2]" />
                  ) : (
                    <AlertCircle className="w-4.5 h-4.5 stroke-[2.2]" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-white/85 block leading-tight">
                  Clearance status
                </span>
                <p className="text-base sm:text-lg font-bold font-heading text-white mt-1 truncate">
                  {isApproved
                    ? "Approved"
                    : isRejected
                    ? "Action needed"
                    : isPendingReview
                    ? "Pending review"
                    : "Incomplete"}
                </p>
                <p className="text-xs text-white/80 mt-1 truncate">
                  {isApproved
                    ? "Coursework unlocked"
                    : docsCompletedCount === 6
                    ? "Ready for review"
                    : `${6 - docsCompletedCount} documents missing`}
                </p>
              </div>
            </div>

            {/* Card 2: Documents (V1: Amber / Golden Orange Gradient) */}
            <div className="bg-gradient-to-br from-[#E98A00] to-[#F59E0B] rounded-2xl p-4 shadow-2xs relative overflow-hidden text-white transition-all">
              {/* Decorative background circle shapes */}
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/15 pointer-events-none blur-xs" />
              <div className="absolute right-5 -top-5 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center mb-2.5 shadow-2xs backdrop-blur-xs">
                  <FileCheck2 className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium text-white/85 block leading-tight">
                  Documents
                </span>
                <p className="text-base sm:text-lg font-bold font-heading text-white mt-1 truncate">
                  {docsCompletedCount} / 6
                </p>
                <p className="text-xs text-white/80 mt-1 truncate">
                  {docsCompletedCount === 6
                    ? "All uploaded"
                    : `${docsCompletedCount} uploaded · ${6 - docsCompletedCount} missing`}
                </p>
              </div>
            </div>

            {/* Card 3: Agreement (V1: Violet / Purple Gradient) */}
            <div
              onClick={!isAgreementSigned ? () => setIsAgreementModalOpen(true) : undefined}
              className={cn(
                "bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] rounded-2xl p-4 shadow-2xs relative overflow-hidden text-white transition-all",
                !isAgreementSigned && "cursor-pointer hover:brightness-105"
              )}
            >
              {/* Decorative background circle shapes */}
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/15 pointer-events-none blur-xs" />
              <div className="absolute right-5 -top-5 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center mb-2.5 shadow-2xs backdrop-blur-xs">
                  <PenTool className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium text-white/85 block leading-tight">
                  Agreement
                </span>
                <p className="text-base sm:text-lg font-bold font-heading text-white mt-1 truncate">
                  {isAgreementSigned ? "Signed" : "Pending"}
                </p>
                <p className="text-xs text-white/80 mt-1 truncate">
                  {isAgreementSigned ? "On file & acknowledged" : "Sign digitally in 2 minutes"}
                </p>
              </div>
            </div>

            {/* Card 4: Orientation (V1: Sky Blue Gradient) */}
            <Link
              to={`/orientation?cohortId=${selectedCohortId}`}
              className="bg-gradient-to-br from-[#0183C7] to-[#38BDF8] rounded-2xl p-4 shadow-2xs relative overflow-hidden text-white transition-all block hover:brightness-105"
            >
              {/* Decorative background circle shapes */}
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/15 pointer-events-none blur-xs" />
              <div className="absolute right-5 -top-5 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center mb-2.5 shadow-2xs backdrop-blur-xs">
                  <GraduationCap className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium text-white/85 block leading-tight">
                  Orientation
                </span>
                <p className="text-base sm:text-lg font-bold font-heading text-white mt-1 truncate">
                  {isOrientationDone ? "Complete" : "Required"}
                </p>
                <p className="text-xs text-white/80 mt-1 truncate">
                  {isOrientationDone ? "Orientation verified" : "Unlocks lessons"}
                </p>
              </div>
            </Link>
          </div>

          {/* ── Prerequisite Documents Container (Exact PDF: 6 Horizontal Compact Tiles) ── */}
          <div className="bg-white rounded-2xl border border-[#E1E7F1] p-5 sm:p-6 shadow-2xs">
            {/* Header: Title + Subtitle + 2/6 Ready Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-heading font-semibold text-[#0F1B34]">
                  Prerequisite documents
                </h2>
                <p className="text-xs text-[#5A6B8C] mt-0.5">
                  PDF, JPG or PNG · max 10 MB · must be current and legible
                </p>
              </div>

              <div className="self-start sm:self-auto">
                <span
                  className={cn(
                    "inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full text-white shadow-2xs",
                    isApproved
                      ? "bg-[#10B981]"
                      : docsCompletedCount === 6
                      ? "bg-[#10B981]"
                      : "bg-[#F59E0B]"
                  )}
                >
                  {isApproved
                    ? "6 / 6 approved"
                    : `${docsCompletedCount} / 6 ready`}
                </span>
              </div>
            </div>

            {/* Grid of 6 Clean White Document Cards with Distinct Colored Icons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {PREREQUISITE_DOCS.map((doc) => {
                const val = docUrls[doc.field] || "";
                const isReady = Boolean(val.trim());
                const isUploading = uploadingField === doc.field;
                const IconComponent = doc.icon;

                // Document status determination (Backend source of truth):
                const isDocApproved = isApproved;
                const isDocInReview = isPendingReview && isReady && !isApproved;
                const isDocUploaded = isReady && !isApproved && !isPendingReview;

                let chipBgClass = "";
                let chipLabel = "";

                if (isDocApproved) {
                  chipBgClass = "bg-[#10B981] text-white";
                  chipLabel = "Approved";
                } else if (isDocInReview) {
                  chipBgClass = "bg-[#F59E0B] text-white";
                  chipLabel = "In review";
                } else if (isDocUploaded) {
                  chipBgClass = "bg-[#3B82F6] text-white";
                  chipLabel = "Uploaded";
                } else {
                  chipBgClass = "bg-[#F43F5E] text-white";
                  chipLabel = "Missing";
                }

                return (
                  <div
                    key={doc.field}
                    className="bg-white rounded-2xl border border-[#E1E7F1] p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all"
                  >
                    {/* Left: Distinct colored icon badge per document */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                        doc.iconBadgeClass
                      )}
                    >
                      <IconComponent className="w-5 h-5 stroke-[2]" />
                    </div>

                    {/* Middle: Title & Status Chip */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-semibold text-[#0F1B34] font-heading truncate">
                        {doc.title}
                      </h3>
                      <div className="mt-1">
                        <span
                          className={cn(
                            "text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-block shadow-2xs",
                            chipBgClass
                          )}
                        >
                          {chipLabel}
                        </span>
                      </div>
                    </div>

                    {/* Right: Clean White Action Button */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {isReady ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ title: doc.title, url: val })}
                            className="inline-flex items-center text-xs font-semibold text-[#0F1B34] bg-white border border-[#E1E7F1] hover:bg-slate-50 px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5 text-[#5A6B8C]" />
                            View
                          </button>

                          {/* Upload/Replace is disabled and hidden once admission is complete/approved (backend source of truth) */}
                          {!isApproved && (
                            <label className="cursor-pointer" title="Replace file">
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(doc.field, file);
                                }}
                              />
                              <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#5A6B8C] border border-[#E1E7F1] transition-colors cursor-pointer">
                                {isUploading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2B5E9C]" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5" />
                                )}
                              </span>
                            </label>
                          )}
                        </>
                      ) : isApproved ? (
                        <span className="inline-flex items-center text-[11px] font-semibold text-[#10B981] bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                          <Check className="w-3 h-3 mr-1" /> Approved
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveUrlDocField(doc.field)}
                            className="text-[#5A6B8C] hover:text-[#0F1B34] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Paste URL"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                          </button>

                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(doc.field, file);
                              }}
                            />
                            <span className="inline-flex items-center text-xs font-semibold text-[#0F1B34] bg-white border border-[#E1E7F1] hover:bg-slate-50 px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer">
                              {isUploading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2B5E9C] mr-1" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5 text-[#5A6B8C] mr-1" />
                                  Upload
                                </>
                              )}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SECTION 2 & 3: Digital Agreement & Mandatory Orientation (Exact PDF layout & Aliko Blue Buttons) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Card: Digital Enrollment Agreement */}
            <div className="bg-white rounded-2xl border border-[#E1E7F1] p-6 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#0F1B34] font-heading">
                    Digital Enrollment Agreement
                  </h3>
                  {isAgreementSigned ? (
                    <span className="inline-flex items-center text-xs font-semibold text-white bg-[#10B981] px-2.5 py-0.5 rounded-full shadow-2xs">
                      Signed
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-white bg-[#8B5CF6] px-2.5 py-0.5 rounded-full shadow-2xs">
                      Pending signature
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5A6B8C] leading-relaxed">
                  Review tuition, attendance, conduct and refund policies, then sign.
                </p>

                {isAgreementSigned && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-[#E1E7F1] text-xs text-[#5A6B8C] space-y-0.5">
                    <div className="font-medium text-[#0F1B34]">
                      Signed by: {application?.agreementSignature || application?.agreementSignatureUrl || user?.firstname}
                    </div>
                    <div className="text-[11px] text-[#10B981] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> On file &amp; acknowledged
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Button
                  onClick={() => setIsAgreementModalOpen(true)}
                  className="bg-[#2B5E9C] hover:bg-[#204777] text-white font-semibold text-xs rounded-xl h-10 px-5 shadow-2xs cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5 mr-2" />
                  {isAgreementSigned ? "View agreement" : "Review & sign"}
                </Button>
              </div>
            </div>

            {/* Right Card: Mandatory Orientation */}
            <div className="bg-white rounded-2xl border border-[#E1E7F1] p-6 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#0F1B34] font-heading">
                    Mandatory Orientation
                  </h3>
                  {isOrientationDone ? (
                    <span className="inline-flex items-center text-xs font-semibold text-white bg-[#10B981] px-2.5 py-0.5 rounded-full shadow-2xs">
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-white bg-[#3B82F6] px-2.5 py-0.5 rounded-full shadow-2xs">
                      Required
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5A6B8C] leading-relaxed">
                  Complete 3 orientation items before your first lesson unlocks.
                </p>

                <div className="p-3 rounded-xl bg-slate-50 border border-[#E1E7F1] text-xs text-[#5A6B8C] space-y-0.5">
                  <div className="font-medium text-[#0F1B34]">
                    Status: {isOrientationDone ? "Completed" : "Required"}
                  </div>
                  <div className="text-[11px] text-[#5A6B8C]">
                    {isOrientationDone
                      ? "Orientation verified · Unlocks curriculum"
                      : "Required before accessing clinical theory lessons"}
                  </div>
                </div>
              </div>

              <div>
                <Button
                  asChild
                  className="bg-[#2B5E9C] hover:bg-[#204777] text-white font-semibold text-xs rounded-xl h-10 px-5 shadow-2xs cursor-pointer"
                >
                  <Link to={`/orientation?cohortId=${selectedCohortId}`}>
                    {isOrientationDone ? "Review orientation" : "Start orientation"}
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialog for Pasting Document URL (Clean, non-cluttering modal) ── */}
      <Dialog
        open={Boolean(activeUrlDocField)}
        onOpenChange={(open) => {
          if (!open) setActiveUrlDocField(null);
        }}
      >
        <DialogContent className="sm:max-w-[480px] p-6 border border-[#E1E7F1] rounded-3xl bg-white shadow-2xl">
          <DialogTitle className="text-base font-heading font-semibold text-[#0F1B34]">
            Provide Document Link
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5A6B8C]">
            Paste a publicly accessible direct document URL (e.g. Google Drive, Dropbox, or OneDrive link).
          </DialogDescription>

          <div className="space-y-4 pt-3">
            {activeUrlDocField && (
              <Input
                type="url"
                placeholder="https://..."
                value={docUrls[activeUrlDocField as keyof typeof docUrls]}
                onChange={(e) =>
                  setDocUrls((prev) => ({
                    ...prev,
                    [activeUrlDocField]: e.target.value,
                  }))
                }
                className="text-xs h-10 rounded-xl bg-white border-[#E1E7F1] focus:border-[#2B5E9C]"
              />
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveUrlDocField(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setActiveUrlDocField(null);
                  toast.success("Document link saved");
                }}
                className="bg-[#2B5E9C] hover:bg-[#204777] text-white font-semibold text-xs rounded-xl px-4 shadow-2xs"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Digital Enrollment Agreement Dialog ── */}
      <Dialog open={isAgreementModalOpen} onOpenChange={setIsAgreementModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 border border-[#E1E7F1] rounded-3xl overflow-hidden bg-white max-h-[90vh] flex flex-col shadow-2xl">
          <div className="px-6 py-5 border-b border-[#E1E7F1] flex items-center justify-between bg-[#F2F5FB]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-heading font-semibold text-[#0F1B34]">
                  Student Enrollment Agreement & Disclosures
                </DialogTitle>
                <DialogDescription className="text-xs text-[#5A6B8C]">
                  Statutory enrollment disclosure under Washington State WABON regulations
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#0F1B34] leading-relaxed">
            {/* Agreement Terms Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-[#E1E7F1] space-y-3 max-h-56 overflow-y-auto custom-scrollbar font-mono text-[11px]">
              <p className="font-bold text-[#0F1B34]">
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
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2B5E9C] focus:ring-[#2B5E9C]"
                />
                <span className="text-xs text-[#0F1B34]">
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
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2B5E9C] focus:ring-[#2B5E9C]"
                />
                <span className="text-xs text-[#0F1B34]">
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
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2B5E9C] focus:ring-[#2B5E9C]"
                />
                <span className="text-xs text-[#0F1B34]">
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
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2B5E9C] focus:ring-[#2B5E9C]"
                />
                <span className="text-xs text-[#0F1B34]">
                  I agree to adhere to the Student Code of Conduct, Patient Dignity Standards, and HIPAA clinical confidentiality rules.
                </span>
              </label>
            </div>

            {/* Signature Box */}
            <div className="pt-3 border-t border-[#E1E7F1] space-y-2">
              <label htmlFor="digital-signature-input" className="text-xs font-semibold text-[#0F1B34] block">
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
              <p className="text-[11px] text-[#5A6B8C]">
                By typing your legal name and submitting, you execute a legally binding digital signature under the Washington Uniform Electronic Transactions Act (RCW 1.80).
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-[#E1E7F1] bg-slate-50/50 flex items-center justify-end gap-3">
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
                className="bg-[#2B5E9C] hover:bg-[#204777] text-white font-semibold text-xs rounded-xl px-5 shadow-2xs cursor-pointer"
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

      {/* ── Document Preview Modal (In-Memory Blob + Native iFrame/Img per User Specification) ── */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        title={previewDoc?.title || ""}
        fileUrl={previewDoc?.url || null}
        onClose={() => setPreviewDoc(null)}
      />
    </StudentLayout>
  );
};

export default AdmissionsClearancePage;
