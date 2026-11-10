import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  Stethoscope,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Award,
  Search,
  Filter,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Send,
  Loader2,
  User,
  RotateCcw,
  BookOpen,
  Calendar,
  AlertCircle,
  HelpCircle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useSkillsList,
  useStudentSkillsMatrix,
  useRecordCheckoffMutation,
  useInstructorCredentials,
  useRegisterCredentialsMutation,
} from "../hooks/useSkillsLab";
import { useInstructorCohortsList } from "../hooks/useSeatTime";
import { useCohortStudents } from "../hooks/useCohortStudents";
import { usePortalMode } from "@/features/auth/hooks/useAuth";
import type { Skill } from "../types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const CNACompetencyMatrixPage: React.FC = () => {
  const { user, isInstructorView, canManageStaffActions } = usePortalMode();
  const isInstructorOrAuditor = isInstructorView;

  const [searchParams] = useSearchParams();
  const paramCohort = searchParams.get("cohortId") || searchParams.get("cohort");

  // Cohort & Enrollment queries
  const { data: cohortsData } = useInstructorCohortsList(isInstructorView);
  const cohorts = cohortsData || [];

  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const activeCohortId = useMemo(() => {
    if (selectedCohortId) return selectedCohortId;
    if (paramCohort && !isNaN(Number(paramCohort))) return String(paramCohort);
    if (cohorts.length > 0) return String(cohorts[0].id);
    return "";
  }, [selectedCohortId, paramCohort, cohorts]);

  const { studentList } = useCohortStudents(activeCohortId, isInstructorOrAuditor);

  const [selectedStudentUserId, setSelectedStudentUserId] =
    useState<string>("");
  const [checkoffStudentUserId, setCheckoffStudentUserId] =
    useState<string>("");

  const effectiveStudentUserId = useMemo(() => {
    if (!isInstructorOrAuditor) return user?.firebaseId || "";
    if (selectedStudentUserId && studentList.some((s) => s.userId === selectedStudentUserId)) {
      return selectedStudentUserId;
    }
    if (studentList.length > 0) return studentList[0].userId;
    return "";
  }, [isInstructorOrAuditor, user, selectedStudentUserId, studentList]);

  // Skills List from Backend
  const { data: apiSkills, isLoading: isSkillsLoading } = useSkillsList();
  const allSkills: Skill[] = useMemo(() => apiSkills || [], [apiSkills]);

  // Student Matrix from Backend
  const { data: matrixData } = useStudentSkillsMatrix(
    effectiveStudentUserId,
    activeCohortId
  );

  // Map backend matrix items
  const matrixMap = useMemo(() => {
    const map = new Map<number, any>();
    if (matrixData && Array.isArray(matrixData.skills)) {
      matrixData.skills.forEach((s: any) => {
        map.set(Number(s.skillId), s);
      });
    }
    return map;
  }, [matrixData]);

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Checkoff Modal State
  const [selectedSkillForCheckoff, setSelectedSkillForCheckoff] =
    useState<Skill | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [evaluatorNotes, setEvaluatorNotes] = useState<string>("");
  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [evaluatorSignature, setEvaluatorSignature] = useState<string>("");

  const recordCheckoffMutation = useRecordCheckoffMutation();

  // Instructor WABON RN Credential State
  const { data: instructorCredential, refetch: refetchCredential } = useInstructorCredentials(
    canManageStaffActions ? user?.firebaseId : undefined
  );
  const registerCredentialMutation = useRegisterCredentialsMutation();
  const [isRegisterCredentialOpen, setIsRegisterCredentialOpen] = useState(false);
  const [rnLicenseNumber, setRnLicenseNumber] = useState("");
  const [rnLicenseExpiration, setRnLicenseExpiration] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);

  const handleRegisterCredential = async () => {
    if (!rnLicenseNumber.trim() || !rnLicenseExpiration) {
      toast.error("Please enter your RN license number and expiration date.");
      return;
    }
    try {
      await registerCredentialMutation.mutateAsync({
        rnLicenseNumber: rnLicenseNumber.trim(),
        rnLicenseExpiration: new Date(rnLicenseExpiration).toISOString(),
        yearsLongTermCareExp: Number(yearsExperience) || 0,
      });
      await refetchCredential();
      setIsRegisterCredentialOpen(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleOpenCheckoff = (skill: Skill) => {
    const targetStudentId = selectedStudentUserId || effectiveStudentUserId || (studentList[0]?.userId || "");
    setCheckoffStudentUserId(targetStudentId);
    const existing = matrixMap.get(Number(skill.id));
    setSelectedSkillForCheckoff(skill);
    setCompletedSteps(skill.criticalSteps ? [...skill.criticalSteps] : []);
    setEvaluatorNotes(
      existing?.comments ||
      existing?.evaluatorNotes ||
      ""
    );
    setAttemptCount(existing ? (existing.attempts || existing.attemptNumber || 1) + 1 : 1);
  };

  const toggleStep = (stepText: string) => {
    setCompletedSteps((prev) =>
      prev.includes(stepText)
        ? prev.filter((s) => s !== stepText)
        : [...prev, stepText]
    );
  };

  const handleSelectAllSteps = () => {
    if (selectedSkillForCheckoff?.criticalSteps) {
      setCompletedSteps([...selectedSkillForCheckoff.criticalSteps]);
    }
  };

  const handleSubmitEvaluation = async (passed: boolean) => {
    if (!selectedSkillForCheckoff) return;
    const targetStudentId = checkoffStudentUserId || effectiveStudentUserId;
    if (!targetStudentId) {
      toast.error("Please select an enrolled student first.");
      return;
    }
    if (!activeCohortId) {
      toast.error("Please select an active cohort first.");
      return;
    }

    const notesText = evaluatorNotes.trim();

    try {
      await recordCheckoffMutation.mutateAsync({
        skillId: Number(selectedSkillForCheckoff.id),
        studentUserId: targetStudentId,
        cohortId: Number(activeCohortId),
        status: passed ? "PASSED" : "FAILED",
        attemptNumber: attemptCount,
        evaluatorNotes: notesText,
        passed,
        attempts: attemptCount,
        comments: notesText,
        criticalStepsCompleted: completedSteps,
        signatureUrl: evaluatorSignature.trim() || undefined,
      });
      setSelectedSkillForCheckoff(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "";
      if (msg.toLowerCase().includes("credential") || msg.toLowerCase().includes("rn license")) {
        setIsRegisterCredentialOpen(true);
      }
    }
  };

  // Filter skills
  const filteredSkills = useMemo(() => {
    return allSkills.filter((s) => {
      const matchCat =
        activeCategory === "ALL" || s.category === activeCategory;
      const matchSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.skillNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());

      const record = matrixMap.get(Number(s.id));
      const status = record?.status || "NOT_ATTEMPTED";

      let matchStatus = true;
      if (statusFilter === "PASSED") matchStatus = status === "PASSED";
      if (statusFilter === "FAILED")
        matchStatus = status === "FAILED" || status === "NEEDS_PRACTICE";
      if (statusFilter === "NOT_ATTEMPTED")
        matchStatus = status === "NOT_ATTEMPTED";
      if (statusFilter === "NEEDS_REASSESSMENT")
        matchStatus = status === "FAILED" || status === "NEEDS_PRACTICE";

      return matchCat && matchSearch && matchStatus;
    });
  }, [allSkills, activeCategory, searchQuery, statusFilter, matrixMap]);

  // Statistics directly from backend
  const totalCoreSkillsCount = matrixData?.totalSkills ?? allSkills.length;
  const passedSkillsCount = matrixData?.passedSkills ?? 0;
  const failedSkillsCount = useMemo(() => {
    let count = 0;
    matrixMap.forEach((v) => {
      if (v.status === "FAILED" || v.status === "NEEDS_PRACTICE") count++;
    });
    return count;
  }, [matrixMap]);

  const categoryTabs = useMemo(() => {
    const categories = Array.from(
      new Set(allSkills.map((s) => s.category).filter(Boolean))
    );
    return [
      { id: "ALL", label: `All Skills (${allSkills.length})` },
      ...categories.map((cat) => ({
        id: cat,
        label: cat
          .toLowerCase()
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      })),
    ];
  }, [allSkills]);

  const completionPercent =
    matrixData?.completionPercentage !== undefined
      ? Math.round(matrixData.completionPercentage)
      : totalCoreSkillsCount > 0
      ? Math.round((passedSkillsCount / totalCoreSkillsCount) * 100)
      : 0;

  // Selected student name display
  const currentStudentName = useMemo(() => {
    if (!isInstructorOrAuditor) {
      return `${user?.firstname || ""} ${user?.lastname || ""}`.trim() || "Student";
    }
    const found = studentList.find((s: any) => s.userId === effectiveStudentUserId);
    return found ? found.name : "Select a Student";
  }, [isInstructorOrAuditor, user, studentList, effectiveStudentUserId]);

  const checkoffStudentName = useMemo(() => {
    const targetId = checkoffStudentUserId || effectiveStudentUserId;
    const found = studentList.find((s: any) => s.userId === targetId);
    return found ? found.name : "Select a Student";
  }, [studentList, checkoffStudentUserId, effectiveStudentUserId]);

  const content = (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                In-Person Skills Lab & Competency Matrix
              </h1>
              <p className="text-xs text-slate-500">
                In-Person Lab Hours &amp; Mandatory RN-Observed Competencies.
              </p>
            </div>
          </div>
        </div>

        {/* Skills Competency Summary Cards */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Core Competencies
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">
                  {totalCoreSkillsCount}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  Skills
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Competencies Passed
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">
                  {passedSkillsCount}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  / {totalCoreSkillsCount} Skills ({completionPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort & Student Selector (Instructor View) */}
      {isInstructorOrAuditor && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="w-full sm:w-60">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Active Cohort
              </label>
              <Select
                value={activeCohortId || undefined}
                onValueChange={(val) => {
                  setSelectedCohortId(val);
                  setSelectedStudentUserId("");
                }}
              >
                <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
                  <SelectValue placeholder={cohorts.length > 0 ? "Select Cohort" : "No cohorts found"} />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name || `Cohort #${c.id}`}
                    </SelectItem>
                  ))}
                  {cohorts.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500 font-medium">
                      No cohorts available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-80">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Select Student for Checkoff Review ({studentList.length} Enrolled)
              </label>
              <Select
                value={effectiveStudentUserId || undefined}
                onValueChange={(val) => {
                  if (val && val !== "_no_students") {
                    setSelectedStudentUserId(val);
                    setCheckoffStudentUserId(val);
                  }
                }}
              >
                <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
                  <SelectValue placeholder={studentList.length > 0 ? "Select Student" : "No students enrolled"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {studentList.map((s: any) => (
                    <SelectItem key={s.userId} value={s.userId}>
                      <span className="font-semibold text-slate-900">{s.name}</span>
                    </SelectItem>
                  ))}
                  {studentList.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500 font-medium">
                      No enrolled students found{activeCohortId ? ` in Cohort #${activeCohortId}` : ""}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Roster Status */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200">
            <User className="w-4 h-4 text-primary shrink-0" />
            <span>Viewing: <strong className="text-slate-900">{currentStudentName}</strong></span>
            {failedSkillsCount > 0 && (
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 ml-2">
                {failedSkillsCount} Need Reassessment
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Student View Banner */}
      {!isInstructorOrAuditor && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Your Official Skills Lab Competency Record
              </h3>
              <p className="text-xs text-emerald-700">
                Skills must be observed and checked off in-person by an approved RN instructor. Online self-reporting is not permitted.
              </p>
            </div>
          </div>
          {totalCoreSkillsCount > 0 && (
            <Badge className="bg-emerald-600 text-white border-0 text-xs px-3 py-1 font-bold">
              {passedSkillsCount >= totalCoreSkillsCount
                ? `ALL ${totalCoreSkillsCount} PASSED`
                : `${Math.max(0, totalCoreSkillsCount - passedSkillsCount)} Remaining`}
            </Badge>
          )}
        </div>
      )}

      {/* Filters & Status Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0",
                  activeCategory === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-white border-slate-200 text-xs font-semibold h-10">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Evaluation States</SelectItem>
                <SelectItem value="PASSED">Satisfactory (Passed)</SelectItem>
                <SelectItem value="NEEDS_REASSESSMENT">
                  Reassessment Required
                </SelectItem>
                <SelectItem value="NOT_ATTEMPTED">Not Yet Attempted</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skill title or number..."
                className="pl-9 h-10 rounded-xl bg-white border-slate-200 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skills Cards Grid */}
      {isSkillsLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading skills lab competencies from backend...</p>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="p-10 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
          {allSkills.length === 0
            ? "No skills registered in the backend skills catalog yet."
            : "No skills matched the current filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSkills.map((skill) => {
          const checkoff = matrixMap.get(Number(skill.id));
          const isPassed = checkoff?.status === "PASSED";
          const isFailed =
            checkoff?.status === "FAILED" ||
            checkoff?.status === "NEEDS_PRACTICE";
          const attempts = checkoff?.attempts || 0;
          const comments = checkoff?.comments;
          const checkoffDate = checkoff?.checkoffDate;

          return (
            <div
              key={skill.id}
              className={cn(
                "rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4",
                isPassed
                  ? "border-emerald-200 bg-emerald-50/10"
                  : isFailed
                  ? "border-rose-200 bg-rose-50/10"
                  : "border-slate-200"
              )}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {skill.skillNumber}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500">
                      {skill.category.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5",
                      isPassed
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : isFailed
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    )}
                  >
                    {isPassed
                      ? "SATISFACTORY (PASSED)"
                      : isFailed
                      ? `UNSATISFACTORY (ATTEMPT #${attempts})`
                      : "NOT EVALUATED"}
                  </Badge>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {skill.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {skill.description}
                  </p>
                </div>

                {/* Feedback or Notes */}
                {comments && (
                  <div className={cn(
                    "p-2.5 rounded-xl border text-xs",
                    isPassed
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50/50 border-rose-200 text-rose-800"
                  )}>
                    <span className="font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                      Instructor Evaluation Notes:
                    </span>
                    <p className="text-xs">{comments}</p>
                    {checkoffDate && (
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Evaluated: {new Date(checkoffDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Critical Steps List Summary */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Critical Steps ({skill.criticalSteps?.length || 0})
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {skill.criticalSteps?.slice(0, 2).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <span className="line-clamp-1">{step}</span>
                      </li>
                    ))}
                    {(skill.criticalSteps?.length || 0) > 2 && (
                      <li className="text-[10px] font-semibold text-slate-400 pl-3">
                        + {(skill.criticalSteps?.length || 0) - 2} more critical steps in protocol
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isPassed ? "Criteria 100% Met" : "Mandatory 100% Pass Required"}
                </span>

                {canManageStaffActions && (
                  <Button
                    onClick={() => handleOpenCheckoff(skill)}
                    size="sm"
                    className="h-8 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {isPassed ? "Re-evaluate Skill" : "Record Checkoff"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Checkoff Evaluation Dialog (Instructor Mode) */}
      <Dialog
        open={Boolean(selectedSkillForCheckoff)}
        onOpenChange={(open) => {
          if (!open) setSelectedSkillForCheckoff(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            {selectedSkillForCheckoff?.skillNumber}: {selectedSkillForCheckoff?.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Evaluating student: <strong>{checkoffStudentName}</strong> for in-person skills lab competency.
          </DialogDescription>

          <div className="space-y-4 pt-2">
            {/* WABON RN Credential Notice */}
            {!instructorCredential && isInstructorOrAuditor && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Instructor WABON RN License not registered on file.</span>
                </div>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => setIsRegisterCredentialOpen(true)}
                  className="h-7 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Register RN License
                </Button>
              </div>
            )}

            {/* Student Selection for Checkoff */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Select Enrolled Student for Checkoff</span>
                </label>
                <Badge variant="outline" className="text-[10px] font-semibold bg-white border-slate-200 text-slate-600">
                  {studentList.length} Enrolled in Cohort #{activeCohortId}
                </Badge>
              </div>

              <Select
                value={checkoffStudentUserId || effectiveStudentUserId || undefined}
                onValueChange={(val) => {
                  if (val && val !== "_no_students") {
                    setCheckoffStudentUserId(val);
                    setSelectedStudentUserId(val);
                  }
                }}
              >
                <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
                  <SelectValue placeholder={studentList.length > 0 ? "Select enrolled student..." : "No enrolled students found"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {studentList.map((s) => (
                    <SelectItem key={s.userId} value={s.userId}>
                      <span className="font-semibold text-slate-900">{s.name}</span>
                    </SelectItem>
                  ))}
                  {studentList.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500 font-medium">
                      No enrolled students found in Cohort #{activeCohortId}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Protocol Steps Checklist */}
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Critical Steps Verification
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllSteps}
                  className="h-6 text-[11px] text-emerald-700 font-bold"
                >
                  Check All Steps
                </Button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedSkillForCheckoff?.criticalSteps.map((step, idx) => {
                  const isChecked = completedSteps.includes(step);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStep(step)}
                      className={cn(
                        "flex items-start gap-2.5 p-2 rounded-lg text-xs cursor-pointer transition-colors border",
                        isChecked
                          ? "bg-white border-emerald-300 text-slate-900"
                          : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                      )}
                    >
                      <button type="button" className="mt-0.5 shrink-0 text-emerald-600">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                      <span className="leading-snug">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evaluator Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Instructor Observation Feedback & Critical Notes
              </label>
              <Textarea
                value={evaluatorNotes}
                onChange={(e) => setEvaluatorNotes(e.target.value)}
                placeholder="Enter instructor observation feedback and critical notes..."
                rows={3}
                className="text-xs"
              />
            </div>

            {/* Attempt Count */}
            <div className="flex items-center gap-4">
              <div className="w-36">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Attempt Number
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={attemptCount}
                  onChange={(e) => setAttemptCount(Number(e.target.value) || 1)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  RN Evaluator Attestation
                </label>
                <Input
                  value={evaluatorSignature}
                  onChange={(e) => setEvaluatorSignature(e.target.value)}
                  placeholder="RN Evaluator Name / License"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSkillForCheckoff(null)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                variant="destructive"
                disabled={recordCheckoffMutation.isPending}
                onClick={() => handleSubmitEvaluation(false)}
                className="h-9 text-xs font-bold"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Unsatisfactory (Needs Reassessment)
              </Button>

              <Button
                size="sm"
                disabled={recordCheckoffMutation.isPending}
                onClick={() => handleSubmitEvaluation(true)}
                className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {recordCheckoffMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                )}
                Satisfactory (Competency Passed)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Instructor WABON RN Credential Dialog */}
      <Dialog
        open={isRegisterCredentialOpen}
        onOpenChange={setIsRegisterCredentialOpen}
      >
        <DialogContent className="max-w-md">
          <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Register Instructor WABON RN License
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            RN instructors must have verified credentials on file before evaluating skills lab competencies.
          </DialogDescription>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Washington RN License Number
              </label>
              <Input
                value={rnLicenseNumber}
                onChange={(e) => setRnLicenseNumber(e.target.value)}
                placeholder="Enter RN license number"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                License Expiration Date
              </label>
              <Input
                type="date"
                value={rnLicenseExpiration}
                onChange={(e) => setRnLicenseExpiration(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Years of Long-Term Care Experience
              </label>
              <Input
                type="number"
                min={0}
                max={50}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Number(e.target.value) || 0)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRegisterCredentialOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={registerCredentialMutation.isPending}
                onClick={handleRegisterCredential}
                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {registerCredentialMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                )}
                Register & Verify Credentials
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isInstructorOrAuditor) {
    return <InstructorLayout>{content}</InstructorLayout>;
  }
  return <StudentLayout>{content}</StudentLayout>;
};

export default CNACompetencyMatrixPage;
