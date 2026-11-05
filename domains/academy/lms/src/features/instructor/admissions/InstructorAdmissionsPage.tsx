import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import {
  useCohortAdmissions,
  useReviewApplicationMutation,
} from "@/features/admissions/hooks/useAdmissions";
import { useInstructorCohortsList } from "@/features/rubric/hooks/useSeatTime";
import type { AdmissionsApplication } from "@/features/admissions/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  ExternalLink,
  Search,
  Users,
  Eye,
  AlertCircle,
  FileText,
  Loader2,
  Check,
  X,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

const getPrerequisiteDocuments = (app?: AdmissionsApplication | null) => {
  if (!app) {
    return {
      docs: [
        { label: "Background Check", url: "" },
        { label: "TB Test Proof", url: "" },
        { label: "Immunizations (HepB, MMR, Varicella)", url: "" },
        { label: "BLS / CPR Card", url: "" },
        { label: "Government Photo ID", url: "" },
        { label: "High School Diploma / GED", url: "" },
      ],
      count: 0,
      hasAll: false,
    };
  }

  const raw = app as any;
  const docsObj =
    raw.documents && typeof raw.documents === "object" && !Array.isArray(raw.documents)
      ? raw.documents
      : {};
  const docsArr: any[] = Array.isArray(raw.documents)
    ? raw.documents
    : Array.isArray(raw.files)
    ? raw.files
    : [];

  const findInArray = (matchers: string[]) => {
    const item = docsArr.find((d) => {
      const tag = String(d?.type || d?.name || d?.category || d?.key || d?.label || "").toLowerCase();
      return matchers.some((m) => tag.includes(m.toLowerCase()));
    });
    return item?.url || item?.fileUrl || item?.path || item?.filePath || "";
  };

  const clean = (val: any) => (typeof val === "string" ? val.trim() : "");

  const bg = clean(
    raw.backgroundCheckUrl ||
      raw.background_check_url ||
      docsObj.backgroundCheckUrl ||
      docsObj.background_check_url ||
      findInArray(["background", "bg_check", "bgcheck"])
  );

  const tb = clean(
    raw.tbTestProofUrl ||
      raw.tb_test_proof_url ||
      docsObj.tbTestProofUrl ||
      docsObj.tb_test_proof_url ||
      findInArray(["tb", "tuberculosis", "tb_test"])
  );

  const immun = clean(
    raw.immunizationProofUrl ||
      raw.immunization_proof_url ||
      docsObj.immunizationProofUrl ||
      docsObj.immunization_proof_url ||
      findInArray(["immunization", "vaccine", "hepb", "mmr"])
  );

  const cpr = clean(
    raw.cprCertUrl ||
      raw.cpr_cert_url ||
      docsObj.cprCertUrl ||
      docsObj.cpr_cert_url ||
      findInArray(["cpr", "bls"])
  );

  const id = clean(
    raw.idDocUrl ||
      raw.id_doc_url ||
      docsObj.idDocUrl ||
      docsObj.id_doc_url ||
      findInArray(["id", "identification", "photo_id", "license", "government"])
  );

  const hs = clean(
    raw.highSchoolProofUrl ||
      raw.high_school_proof_url ||
      docsObj.highSchoolProofUrl ||
      docsObj.high_school_proof_url ||
      findInArray(["highschool", "high_school", "diploma", "ged"])
  );

  const docs = [
    { label: "Background Check", url: bg },
    { label: "TB Test Proof", url: tb },
    { label: "Immunizations (HepB, MMR, Varicella)", url: immun },
    { label: "BLS / CPR Card", url: cpr },
    { label: "Government Photo ID", url: id },
    { label: "High School Diploma / GED", url: hs },
  ];

  const count = docs.filter((d) => d.url.length > 0).length;

  return { docs, count, hasAll: count === 6 };
};

export const InstructorAdmissionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramCohort = searchParams.get("cohortId");
  const { data: cohorts, isLoading: cohortsLoading } = useInstructorCohortsList();

  const [selectedCohortId, setSelectedCohortId] = useState<number | undefined>(() => {
    if (paramCohort && !isNaN(Number(paramCohort))) {
      return Number(paramCohort);
    }
    return undefined;
  });

  // Auto-select cohort from param, selection, or first cohort in list
  const effectiveCohortId = useMemo(() => {
    if (selectedCohortId) return selectedCohortId;
    if (paramCohort && !isNaN(Number(paramCohort))) return Number(paramCohort);
    if (cohorts && cohorts.length > 0) return Number(cohorts[0].id);
    return 1;
  }, [selectedCohortId, paramCohort, cohorts]);

  const {
    data: applications,
    isLoading: applicationsLoading,
    refetch,
  } = useCohortAdmissions(effectiveCohortId);

  const reviewMutation = useReviewApplicationMutation();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Review & Rejection Dialog state
  const [inspectingApp, setInspectingApp] = useState<AdmissionsApplication | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    return applications.filter((app) => {
      const studentName = `${app.user?.firstname || ""} ${app.user?.lastname || ""}`.toLowerCase();
      const email = (app.user?.email || "").toLowerCase();
      const matchesSearch =
        studentName.includes(searchQuery.toLowerCase()) ||
        email.includes(searchQuery.toLowerCase()) ||
        String(app.id).includes(searchQuery);

      const matchesStatus =
        statusFilter === "ALL" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  // Metric counts
  const totalCount = applications?.length || 0;
  const pendingCount = applications?.filter((a) => a.status === "PENDING_REVIEW" || a.status === "SUBMITTED").length || 0;
  const approvedCount = applications?.filter((a) => a.status === "APPROVED").length || 0;
  const rejectedCount = applications?.filter((a) => a.status === "REJECTED").length || 0;

  // Approve action
  const handleApprove = async (applicationId: number) => {
    try {
      await reviewMutation.mutateAsync({
        applicationId,
        status: "APPROVED",
      });
      if (inspectingApp?.id === applicationId) {
        setInspectingApp(null);
      }
    } catch {
      // Error handled by mutation
    }
  };

  // Open Rejection Dialog
  const handleOpenRejectDialog = (app: AdmissionsApplication) => {
    setInspectingApp(app);
    setRejectionReason(app.rejectionReason || "");
    setIsRejectModalOpen(true);
  };

  // Submit Rejection
  const handleSubmitRejection = async () => {
    if (!inspectingApp) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a remediation explanation for the student.");
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        applicationId: inspectingApp.id,
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
      });
      setIsRejectModalOpen(false);
      setInspectingApp(null);
      setRejectionReason("");
    } catch {
      // Handled by mutation
    }
  };

  return (
    <InstructorLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ── Header Bar ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold">
                Admissions Clearance Portal
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                Live Enrollment Activation
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
              Cohort Admissions Clearance & Document Review
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify incoming student prerequisite documents, digital enrollment agreements, and approve/reject statutory compliance gates.
            </p>
          </div>

          {/* Cohort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-600">Cohort:</span>
            <select
              value={effectiveCohortId}
              onChange={(e) => setSelectedCohortId(Number(e.target.value))}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cohorts && cohorts.length > 0 ? (
                cohorts.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name || `Cohort #${c.id}`} ({c.course?.title || "CNA Program"})
                  </option>
                ))
              ) : (
                <option value={1}>Cohort #1</option>
              )}
            </select>
          </div>
        </div>

        {/* ── KPI Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Applicants
            </span>
            <div className="text-2xl font-black text-slate-900">{totalCount}</div>
            <span className="text-[11px] text-slate-500">Cohort {effectiveCohortId}</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
              Pending Review
            </span>
            <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
            <span className="text-[11px] text-slate-500">Awaiting faculty review</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Approved (Cleared)
            </span>
            <div className="text-2xl font-black text-emerald-600">{approvedCount}</div>
            <span className="text-[11px] text-slate-500">Enrollment activated</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
              Remediation / Rejected
            </span>
            <div className="text-2xl font-black text-rose-600">{rejectedCount}</div>
            <span className="text-[11px] text-slate-500">Notice sent to student</span>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search candidate name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {["ALL", "PENDING_REVIEW", "APPROVED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {st === "ALL"
                  ? "All Applicants"
                  : st === "PENDING_REVIEW"
                  ? `Pending (${pendingCount})`
                  : st === "APPROVED"
                  ? `Approved (${approvedCount})`
                  : `Remediation (${rejectedCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Admissions Roster Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4 text-center">Prerequisite Docs</th>
                  <th className="py-3.5 px-4 text-center">Agreement</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Clearance Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicationsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="py-6 px-4">
                        <div className="h-4 bg-slate-100 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">No student admissions records found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Applicants for Cohort #{effectiveCohortId} will appear here upon document submission.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => {
                    const studentName = `${app.user?.firstname || ""} ${app.user?.lastname || ""}`.trim() || `Candidate #${app.userId.slice(0, 8)}`;
                    const { count: docsCount, hasAll: hasAllDocs } = getPrerequisiteDocuments(app);

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">
                                {studentName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {app.user?.email || app.userId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full border",
                              docsCount === 6
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : docsCount > 0
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            )}
                          >
                            {docsCount === 6 ? <Check className="w-3 h-3" /> : null}
                            {docsCount} / 6 Uploaded
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {app.agreementSigned || app.agreementSignature || app.agreementSignatureUrl ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Signed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-400">
                              Pending
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {app.createdAt ? format(new Date(app.createdAt), "MMM d, yyyy") : "Recent"}
                        </td>

                        <td className="py-3.5 px-4">
                          {app.status === "APPROVED" ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold py-0.5 px-2.5">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Approved
                            </Badge>
                          ) : app.status === "REJECTED" ? (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-300 text-xs font-bold py-0.5 px-2.5">
                              <XCircle className="w-3 h-3 mr-1 text-rose-600" /> Rejected
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-bold py-0.5 px-2.5">
                              <Clock className="w-3 h-3 mr-1 text-amber-600" /> Review Required
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setInspectingApp(app)}
                              className="h-8 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                            </Button>

                            {app.status !== "APPROVED" && (
                              <Button
                                size="sm"
                                onClick={() => handleApprove(app.id)}
                                disabled={reviewMutation.isPending}
                                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs"
                              >
                                Approve
                              </Button>
                            )}

                            {app.status !== "REJECTED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenRejectDialog(app)}
                                disabled={reviewMutation.isPending}
                                className="h-8 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-lg"
                              >
                                Reject
                              </Button>
                            )}
                          </div>
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

      {/* ── Document Inspection Modal ── */}
      <Dialog open={Boolean(inspectingApp) && !isRejectModalOpen} onOpenChange={(open) => !open && setInspectingApp(null)}>
        <DialogContent className="sm:max-w-[750px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[90vh] flex flex-col shadow-2xl">
          {inspectingApp && (
            <>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {inspectingApp.user?.firstname?.charAt(0) || "C"}
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900">
                      Admissions Dossier: {inspectingApp.user?.firstname} {inspectingApp.user?.lastname}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      {inspectingApp.user?.email || inspectingApp.userId} &bull; Application ID #{inspectingApp.id}
                    </DialogDescription>
                  </div>
                </div>

                <Badge
                  className={cn(
                    "text-xs font-bold py-1 px-3",
                    inspectingApp.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : inspectingApp.status === "REJECTED"
                      ? "bg-rose-50 text-rose-700 border-rose-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  )}
                >
                  {inspectingApp.status}
                </Badge>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
                {/* Rejection Notice if any */}
                {inspectingApp.status === "REJECTED" && inspectingApp.rejectionReason && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                    <span className="font-bold block">Current Rejection Reason:</span>
                    <p className="italic">"{inspectingApp.rejectionReason}"</p>
                  </div>
                )}

                {/* Submitted Documents Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Mandatory Prerequisite Files (6 Required)
                    </h4>
                    <span className="text-xs font-bold text-slate-700">
                      {getPrerequisiteDocuments(inspectingApp).count} of 6 Uploaded
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getPrerequisiteDocuments(inspectingApp).docs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 block truncate text-xs">
                            {doc.label}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {doc.url || "Not submitted"}
                          </span>
                        </div>

                        {doc.url ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                              Uploaded
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50 rounded-lg shrink-0 gap-1"
                            >
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" /> View
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 shrink-0">
                            Missing
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agreement & Signature Info */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Digital Enrollment Agreement
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Signature: {inspectingApp.agreementSignature || inspectingApp.agreementSignatureUrl || "Not signed"}
                      </span>
                      {inspectingApp.agreementSignedAt && (
                        <span className="text-[11px] text-slate-500">
                          Executed on {format(new Date(inspectingApp.agreementSignedAt), "MMM d, yyyy h:mm a")}
                        </span>
                      )}
                    </div>
                    {inspectingApp.agreementSigned || inspectingApp.agreementSignature || inspectingApp.agreementSignatureUrl ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                        <Check className="w-3 h-3 mr-1" /> Compliant
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-amber-600">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Admissions Clearance Review
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRejectDialog(inspectingApp)}
                    disabled={reviewMutation.isPending}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl"
                  >
                    Reject with Reason
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(inspectingApp.id)}
                    disabled={reviewMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-5 shadow-xs"
                  >
                    {reviewMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Approve Clearance
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Rejection Reason Modal ── */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 border-none rounded-3xl overflow-hidden bg-white shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/60">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
              <DialogTitle className="text-base font-bold text-slate-900">
                Reject Admissions Application
              </DialogTitle>
            </div>
          </div>

          <div className="p-6 space-y-4 text-xs">
            <p className="text-slate-600">
              Provide specific remediation instructions so the student knows which document or requirement to correct.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="rejection-reason-textarea" className="font-bold text-slate-800">
                Rejection Reason / Remediation Instructions *
              </label>
              <Textarea
                id="rejection-reason-textarea"
                aria-label="Rejection Reason / Remediation Instructions"
                rows={4}
                placeholder="e.g. TB skin test expired. Please re-submit within 48 hours."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="rounded-xl resize-none text-xs"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              The student will receive this remediation notice and be required to re-upload required items before full clearance.
            </p>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitRejection}
              disabled={reviewMutation.isPending || !rejectionReason.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl px-5 shadow-xs"
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </InstructorLayout>
  );
};

export default InstructorAdmissionsPage;

