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
  ShieldCheck,
  Loader2,
  User,
  Plus,
  Play,
  ClipboardList,
  Calendar,
  Layers,
  Activity,
  Sparkles,
  ExternalLink,
  X,
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
  useCreateSkillMutation,
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

// ── Mastery Level Definition (Khan Academy Style - V2) ────────────────────────
type MasteryLevel = "NOT_STARTED" | "ATTEMPTED" | "PRACTICING" | "PROFICIENT" | "CHECKED_OFF";

// ── Skill Card Top Border Colors (V1 Style Accent) ───────────────────────────
const SKILL_CARD_BORDER_COLORS = [
  "border-t-[#F43F5E]",
  "border-t-[#0284C7]",
  "border-t-[#8B5CF6]",
  "border-t-[#10B981]",
  "border-t-[#F59E0B]",
  "border-t-[#06B6D4]",
  "border-t-[#EC4899]",
];

interface SkillMasteryInfo {
  level: MasteryLevel;
  label: string;
  pillClass: string;
  dotColor: string;
  stepCount: number; // 0 to 5
  percentage: number;
}

const getSkillMastery = (status?: string, attempts: number = 0): SkillMasteryInfo => {
  const s = (status || "").toUpperCase();

  if (s === "PASSED" || s === "COMPETENT" || s === "CHECKED_OFF") {
    return {
      level: "CHECKED_OFF",
      label: "Checked off",
      pillClass: "bg-[#DCFCE7] text-[#15803D] border border-emerald-200/80",
      dotColor: "bg-[#10B981]",
      stepCount: 5,
      percentage: 100,
    };
  }

  if (s === "PROFICIENT") {
    return {
      level: "PROFICIENT",
      label: "Proficient",
      pillClass: "bg-[#F3E8FF] text-[#7E22CE] border border-purple-200/80",
      dotColor: "bg-[#8B5CF6]",
      stepCount: 4,
      percentage: 80,
    };
  }

  if (s === "NEEDS_PRACTICE" || s === "FAILED" || (attempts > 1 && s !== "NOT_ATTEMPTED")) {
    return {
      level: "PRACTICING",
      label: "Practicing",
      pillClass: "bg-[#FEF3C7] text-[#D97706] border border-amber-200/80",
      dotColor: "bg-[#F59E0B]",
      stepCount: 3,
      percentage: 60,
    };
  }

  if (attempts === 1 || s === "ATTEMPTED") {
    return {
      level: "ATTEMPTED",
      label: "Attempted",
      pillClass: "bg-[#DBEAFE] text-[#1D4ED8] border border-blue-200/80",
      dotColor: "bg-[#0284C7]",
      stepCount: 2,
      percentage: 30,
    };
  }

  return {
    level: "NOT_STARTED",
    label: "Not started",
    pillClass: "bg-slate-100 text-slate-500 border border-slate-200",
    dotColor: "bg-slate-300",
    stepCount: 0,
    percentage: 0,
  };
};

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

  const [selectedStudentUserId, setSelectedStudentUserId] = useState<string>("");
  const [checkoffStudentUserId, setCheckoffStudentUserId] = useState<string>("");

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
        const id = s.skillId ?? s.skill?.id;
        if (id != null) {
          map.set(Number(id), s);
        }
      });
    }
    return map;
  }, [matrixData]);

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [previewSkillForChecklist, setPreviewSkillForChecklist] = useState<Skill | null>(null);
  const [previewSkillForDemo, setPreviewSkillForDemo] = useState<Skill | null>(null);
  const [selectedSkillForCheckoff, setSelectedSkillForCheckoff] = useState<Skill | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [evaluatorNotes, setEvaluatorNotes] = useState<string>("");
  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [evaluatorSignature, setEvaluatorSignature] = useState<string>("");

  const recordCheckoffMutation = useRecordCheckoffMutation();
  const createSkillMutation = useCreateSkillMutation();
  const [isRegisterSkillOpen, setIsRegisterSkillOpen] = useState(false);
  const [newSkillNumber, setNewSkillNumber] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Basic Nursing");
  const [newSkillStepsText, setNewSkillStepsText] = useState("");

  const handleCreateSkill = async () => {
    const steps = newSkillStepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!newSkillNumber.trim() || !newSkillName.trim() || !newSkillCategory.trim()) {
      toast.error("Skill number, name, and category are required.");
      return;
    }
    if (steps.length === 0) {
      toast.error("Enter at least one evaluation step (one per line).");
      return;
    }
    try {
      await createSkillMutation.mutateAsync({
        skillNumber: newSkillNumber.trim(),
        name: newSkillName.trim(),
        category: newSkillCategory.trim(),
        steps,
      });
      setNewSkillNumber("");
      setNewSkillName("");
      setNewSkillStepsText("");
      setIsRegisterSkillOpen(false);
    } catch {
      // Error toast handled by mutation
    }
  };

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
    setEvaluatorNotes(existing?.comments || existing?.evaluatorNotes || "");
    setAttemptCount(existing ? (existing.attempts || existing.attemptNumber || 1) + 1 : 1);
  };

  const toggleStep = (stepText: string) => {
    setCompletedSteps((prev) =>
      prev.includes(stepText) ? prev.filter((s) => s !== stepText) : [...prev, stepText]
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
      const matchCat = activeCategory === "ALL" || s.category === activeCategory;
      const matchSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.skillNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());

      const record = matrixMap.get(Number(s.id));
      const mastery = getSkillMastery(record?.status || record?.latestStatus, record?.attempts || record?.attemptNumber);

      let matchStatus = true;
      if (statusFilter === "PASSED") matchStatus = mastery.level === "CHECKED_OFF";
      if (statusFilter === "PRACTICING") matchStatus = mastery.level === "PRACTICING" || mastery.level === "PROFICIENT";
      if (statusFilter === "ATTEMPTED") matchStatus = mastery.level === "ATTEMPTED";
      if (statusFilter === "NOT_STARTED") matchStatus = mastery.level === "NOT_STARTED";

      return matchCat && matchSearch && matchStatus;
    });
  }, [allSkills, activeCategory, searchQuery, statusFilter, matrixMap]);

  // Dynamic statistics derived strictly from backend
  const totalCoreSkillsCount = matrixData?.totalSkills ?? allSkills.length;
  const passedSkillsCount = matrixData?.passedSkills ?? 0;

  const practicingSkillsCount = useMemo(() => {
    let count = 0;
    matrixMap.forEach((v) => {
      const mastery = getSkillMastery(v?.status || v?.latestStatus, v?.attempts || v?.attemptNumber);
      if (mastery.level === "PRACTICING" || mastery.level === "PROFICIENT") count++;
    });
    return count;
  }, [matrixMap]);

  const totalCriticalStepsCount = useMemo(() => {
    return allSkills.reduce((acc, s) => acc + (s.criticalSteps?.length || 0), 0);
  }, [allSkills]);

  const completionPercent =
    matrixData?.completionPercentage !== undefined
      ? Math.round(matrixData.completionPercentage)
      : totalCoreSkillsCount > 0
      ? Math.round((passedSkillsCount / totalCoreSkillsCount) * 100)
      : 0;

  const categoryTabs = useMemo(() => {
    const categories = Array.from(new Set(allSkills.map((s) => s.category).filter(Boolean)));
    return [
      { id: "ALL", label: `All skills · ${allSkills.length}` },
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
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Bar matching V1/V2 design */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-[#059669]" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-semibold tracking-tight text-slate-900">
                  Skills Lab &amp; Competency Matrix
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Mandatory hands-on competencies evaluated in person by an approved RN instructor
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => {
                toast.info("Skills check-off reservation window is open during scheduled lab hours.");
              }}
              className="bg-[#FF9147] hover:bg-[#F26B1D] text-white font-semibold text-xs h-9 rounded-xl shadow-xs px-4"
            >
              Book check-off
            </Button>

            {canManageStaffActions && (
              <Button
                onClick={() => setIsRegisterSkillOpen(true)}
                className="bg-primary hover:bg-[#084B78] text-white font-medium text-xs h-9 rounded-xl shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Register Core Skill
              </Button>
            )}
          </div>
        </div>

        {/* 4 Colored/Vivid KPI Stat Tiles (Blend of V1 Page 24/25 & V2 Page 26/27) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Competencies passed (Emerald theme) */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-[#049569] to-[#10B981] text-white transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-100">
                Competencies passed
              </span>
              <span className="text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                {completionPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="text-3xl font-heading font-semibold text-white tracking-tight">
                {passedSkillsCount} / {totalCoreSkillsCount}
              </div>
            </div>
            <p className="text-xs text-emerald-100/90 font-medium">
              Pass all to sit the state exam
            </p>
          </div>

          {/* Card 2: In practice (Amber / Orange theme) */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-[#E98A00] to-[#F59E0B] text-white transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-100">
                In practice
              </span>
              <Activity className="w-4 h-4 text-amber-100" />
            </div>
            <div className="text-3xl font-heading font-semibold text-white tracking-tight">
              {practicingSkillsCount}
            </div>
            <p className="text-xs text-amber-100/90 font-medium">
              Active lab clinical practice
            </p>
          </div>

          {/* Card 3: Next check-off (Sky / Blue theme) */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-[#0183C7] to-[#38BDF8] text-white transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-sky-100">
                Next check-off
              </span>
              <Calendar className="w-4 h-4 text-sky-100" />
            </div>
            <div className="text-2xl font-heading font-semibold text-white tracking-tight">
              In-Person Lab
            </div>
            <p className="text-xs text-sky-100/90 font-medium">
              Scheduled weekly demonstration
            </p>
          </div>

          {/* Card 4: Critical steps (Violet / Indigo theme) */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-violet-100">
                Critical steps
              </span>
              <Award className="w-4 h-4 text-violet-100" />
            </div>
            <div className="text-3xl font-heading font-semibold text-white tracking-tight">
              {totalCriticalStepsCount}
            </div>
            <p className="text-xs text-violet-100/90 font-medium">
              Across all competencies
            </p>
          </div>
        </div>

        {/* Mastery Levels Bar & Legend (V2 Page 27 Feature) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Mastery Levels
            </span>
            <div className="flex items-center gap-4 flex-wrap text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span>Not started</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                <span>Attempted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span>Practicing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                <span>Proficient</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Checked off</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {passedSkillsCount} / {totalCoreSkillsCount} Checked off
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {totalCriticalStepsCount} critical steps total
              </span>
            </div>
          </div>
        </div>

        {/* Instructor Cohort & Student Selector */}
        {isInstructorOrAuditor && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="w-full sm:w-56">
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Active Cohort
                </label>
                <Select
                  value={activeCohortId || undefined}
                  onValueChange={(val) => {
                    setSelectedCohortId(val);
                    setSelectedStudentUserId("");
                  }}
                >
                  <SelectTrigger className="bg-white border-slate-200 text-xs font-medium h-9 rounded-xl">
                    <SelectValue placeholder={cohorts.length > 0 ? "Select Cohort" : "No cohorts found"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cohorts.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name || `Cohort #${c.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-72">
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Select Student for Checkoff ({studentList.length} Enrolled)
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
                  <SelectTrigger className="bg-white border-slate-200 text-xs font-medium h-9 rounded-xl">
                    <SelectValue placeholder={studentList.length > 0 ? "Select Student" : "No students enrolled"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {studentList.map((s: any) => (
                      <SelectItem key={s.userId} value={s.userId}>
                        <span className="font-medium text-slate-900">{s.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <User className="w-4 h-4 text-primary shrink-0" />
              <span>Viewing: <strong className="font-semibold text-slate-900">{currentStudentName}</strong></span>
            </div>
          </div>
        )}

        {/* Filters & Search Row matching V2 Neutral Filter Pills */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Neutral Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categoryTabs.map((tab) => {
                const isSelected = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0",
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Status Dropdown & Search Bar */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 sm:w-40 bg-white border-slate-200 text-xs font-medium h-9 rounded-xl">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="PASSED">Checked off</SelectItem>
                  <SelectItem value="PRACTICING">In Practice / Proficient</SelectItem>
                  <SelectItem value="ATTEMPTED">Attempted</SelectItem>
                  <SelectItem value="NOT_STARTED">Not started</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-48 sm:w-56">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search skills or codes…"
                  className="pl-9 h-9 text-xs bg-white border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills Cards Grid (3 Columns on large screens matching V1/V2) */}
        {isSkillsLoading ? (
          <div className="p-16 text-center text-slate-400 bg-white border border-slate-200/80 rounded-2xl">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-xs font-medium">Loading skills lab competencies…</p>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl space-y-2">
            <p className="text-xs text-slate-600 font-medium">
              No skills found matching your filter.
            </p>
            {(searchQuery || activeCategory !== "ALL" || statusFilter !== "ALL") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("ALL");
                  setStatusFilter("ALL");
                }}
                className="text-xs font-medium h-8 rounded-xl"
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill, idx) => {
              const checkoff = matrixMap.get(Number(skill.id));
              const attempts = checkoff?.attempts || checkoff?.attemptNumber || 0;
              const mastery = getSkillMastery(checkoff?.status || checkoff?.latestStatus, attempts);
              const isCheckedOff = mastery.level === "CHECKED_OFF";
              const borderColor = SKILL_CARD_BORDER_COLORS[idx % SKILL_CARD_BORDER_COLORS.length];

              return (
                <div
                  key={skill.id}
                  className={cn(
                    "rounded-2xl border border-slate-200/80 border-t-4 bg-white p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4",
                    borderColor
                  )}
                >
                  <div className="space-y-3">
                    {/* Top Row: Skill ID & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        SKILL-{skill.skillNumber || skill.id}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium",
                          mastery.pillClass
                        )}
                      >
                        ● {mastery.label}
                      </span>
                    </div>

                    {/* Skill Title & Subtitle */}
                    <div>
                      <h3 className="text-sm font-heading font-semibold text-slate-900 leading-snug">
                        {skill.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {skill.category.replace(/_/g, " ")} · {skill.criticalSteps?.length || 0} critical steps
                      </p>
                    </div>

                    {/* 5-Step Mastery Segmented Bar (V2 Design) */}
                    <div className="space-y-1 pt-1">
                      <div className="grid grid-cols-5 gap-1 h-1.5">
                        {[1, 2, 3, 4, 5].map((step) => {
                          const isFilled = step <= mastery.stepCount;
                          return (
                            <div
                              key={step}
                              className={cn(
                                "rounded-full transition-colors",
                                isFilled ? mastery.dotColor : "bg-slate-100"
                              )}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Attempted</span>
                        <span>Checked off</span>
                      </div>
                    </div>

                    {/* Instructor Observation Note if present */}
                    {checkoff?.comments && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                        <span className="text-[10px] font-semibold uppercase text-slate-500 block mb-0.5">
                          RN Evaluator Feedback:
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {checkoff.comments}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewSkillForDemo(skill)}
                        className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium rounded-lg"
                      >
                        <Play className="w-3 h-3 mr-1 text-primary" /> Demo
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewSkillForChecklist(skill)}
                        className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium rounded-lg"
                      >
                        <ClipboardList className="w-3 h-3 mr-1 text-slate-500" /> Checklist
                      </Button>
                    </div>

                    {canManageStaffActions ? (
                      <Button
                        onClick={() => handleOpenCheckoff(skill)}
                        size="sm"
                        className="h-7 px-2.5 text-xs font-semibold rounded-lg bg-primary hover:bg-[#084B78] text-white shrink-0"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {isCheckedOff ? "Re-evaluate" : "Checkoff"}
                      </Button>
                    ) : (
                      !isCheckedOff && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast.success(`Check-off request submitted for SKILL-${skill.skillNumber}.`);
                          }}
                          className="h-7 px-2 text-[11px] font-medium rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0 whitespace-nowrap"
                        >
                          Request check-off
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Official Skills Lab Competency Record Banner (Bottom of Page) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-heading font-semibold text-slate-900">
                Official Skills Lab Competency Record
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Skills are evaluated in person by approved RN instructors; self-reporting is not permitted.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
              Evaluator: {instructorCredential ? `RN ${user?.firstname || "Instructor"}` : "Approved RN Instructor"}
            </span>
          </div>
        </div>

        {/* Demo / Protocol Dialog */}
        <Dialog
          open={Boolean(previewSkillForDemo)}
          onOpenChange={(open) => !open && setPreviewSkillForDemo(null)}
        >
          <DialogContent className="max-w-md">
            <DialogTitle className="text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" />
              Demo: {previewSkillForDemo?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              SKILL-{previewSkillForDemo?.skillNumber} · Protocol and Demonstration Guidance
            </DialogDescription>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="text-xs text-slate-700 leading-relaxed">
                  {previewSkillForDemo?.description || "In-person lab video demonstration and live RN instruction guide."}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-900 block">
                  Mandatory Execution Steps:
                </span>
                <ol className="space-y-1.5 text-xs text-slate-600 list-decimal pl-4">
                  {previewSkillForDemo?.criticalSteps?.map((step, i) => (
                    <li key={i} className="leading-snug">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewSkillForDemo(null)}
                  className="h-8 text-xs font-medium rounded-xl"
                >
                  Close Demo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Checklist Dialog */}
        <Dialog
          open={Boolean(previewSkillForChecklist)}
          onOpenChange={(open) => !open && setPreviewSkillForChecklist(null)}
        >
          <DialogContent className="max-w-md">
            <DialogTitle className="text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Checklist: {previewSkillForChecklist?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Review critical steps for SKILL-{previewSkillForChecklist?.skillNumber}
            </DialogDescription>

            <div className="space-y-4 pt-2">
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {previewSkillForChecklist?.criticalSteps?.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 leading-snug">{step}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewSkillForChecklist(null)}
                  className="h-8 text-xs font-medium rounded-xl"
                >
                  Close Checklist
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Checkoff Evaluation Dialog (Instructor Mode) */}
        <Dialog
          open={Boolean(selectedSkillForCheckoff)}
          onOpenChange={(open) => {
            if (!open) setSelectedSkillForCheckoff(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              {selectedSkillForCheckoff?.skillNumber}: {selectedSkillForCheckoff?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Evaluating student: <strong className="font-semibold text-slate-800">{checkoffStudentName}</strong> for in-person skills competency.
            </DialogDescription>

            <div className="space-y-4 pt-2">
              {/* WABON RN Credential Notice */}
              {!instructorCredential && isInstructorOrAuditor && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF2E3] border border-[#D77510]/30 text-[#AC5B0B] text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#D77510] shrink-0" />
                    <span>Instructor RN license not registered on file.</span>
                  </div>
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => setIsRegisterCredentialOpen(true)}
                    className="h-7 text-xs font-medium bg-[#D77510] hover:bg-[#AC5B0B] text-white border-0"
                  >
                    Register RN License
                  </Button>
                </div>
              )}

              {/* Student Selection for Checkoff */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary" />
                    <span>Student for Checkoff</span>
                  </label>
                  <Badge variant="outline" className="text-[10px] font-medium bg-white border-slate-200 text-slate-600">
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
                  <SelectTrigger className="bg-white border-slate-200 text-xs font-medium h-9 rounded-xl">
                    <SelectValue placeholder={studentList.length > 0 ? "Select enrolled student..." : "No enrolled students found"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {studentList.map((s) => (
                      <SelectItem key={s.userId} value={s.userId}>
                        <span className="font-medium text-slate-900">{s.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Protocol Steps Checklist */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    Critical Steps Verification
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllSteps}
                    className="h-6 text-[11px] text-primary hover:bg-[#EAF3F9] font-medium"
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
                            ? "bg-white border-primary/40 text-[#1E293B]"
                            : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                        )}
                      >
                        <button type="button" className="mt-0.5 shrink-0 text-primary">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
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
                <label className="text-xs font-medium text-slate-700">
                  Instructor Observation Feedback &amp; Notes
                </label>
                <Textarea
                  value={evaluatorNotes}
                  onChange={(e) => setEvaluatorNotes(e.target.value)}
                  placeholder="Enter observation notes or remediation guidance..."
                  rows={3}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Attempt Count & Attestation */}
              <div className="flex items-center gap-4">
                <div className="w-36">
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Attempt Number
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={attemptCount}
                    onChange={(e) => setAttemptCount(Number(e.target.value) || 1)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    RN Evaluator Attestation
                  </label>
                  <Input
                    value={evaluatorSignature}
                    onChange={(e) => setEvaluatorSignature(e.target.value)}
                    placeholder="RN Evaluator Name / License"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSkillForCheckoff(null)}
                  className="h-9 text-xs font-medium rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  size="sm"
                  disabled={recordCheckoffMutation.isPending}
                  onClick={() => handleSubmitEvaluation(false)}
                  className="h-9 text-xs font-medium bg-[#D77510] hover:bg-[#AC5B0B] text-white border-0 rounded-xl"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Unsatisfactory (Needs Practice)
                </Button>

                <Button
                  size="sm"
                  disabled={recordCheckoffMutation.isPending}
                  onClick={() => handleSubmitEvaluation(true)}
                  className="h-9 text-xs font-semibold bg-primary hover:bg-[#084B78] text-white border-0 rounded-xl"
                >
                  {recordCheckoffMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  )}
                  Satisfactory (Checked off)
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
            <DialogTitle className="text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Register Instructor RN License
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Credentials must be on file before recording skills lab evaluations.
            </DialogDescription>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Washington RN License Number
                </label>
                <Input
                  value={rnLicenseNumber}
                  onChange={(e) => setRnLicenseNumber(e.target.value)}
                  placeholder="Enter RN license number"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  License Expiration Date
                </label>
                <Input
                  type="date"
                  value={rnLicenseExpiration}
                  onChange={(e) => setRnLicenseExpiration(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Years of Long-Term Care Experience
                </label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(Number(e.target.value) || 0)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRegisterCredentialOpen(false)}
                  className="h-8 text-xs font-medium rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={registerCredentialMutation.isPending}
                  onClick={handleRegisterCredential}
                  className="h-8 text-xs font-semibold bg-primary hover:bg-[#084B78] text-white border-0 rounded-xl"
                >
                  {registerCredentialMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Register &amp; Verify Credentials
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Register Core Skill Modal (Instructors) */}
        <Dialog
          open={isRegisterSkillOpen}
          onOpenChange={(open) => !open && setIsRegisterSkillOpen(false)}
        >
          <DialogContent className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md space-y-4">
            <div className="space-y-1">
              <DialogTitle className="text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Register Core Competency Skill
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Add a state-aligned CNA lab skill and its critical evaluation steps.
              </DialogDescription>
            </div>

            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Skill Number *
                  </label>
                  <Input
                    value={newSkillNumber}
                    onChange={(e) => setNewSkillNumber(e.target.value)}
                    placeholder="e.g. SK-23"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Category *
                  </label>
                  <Input
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value)}
                    placeholder="e.g. Infection Control"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Skill Title *
                </label>
                <Input
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. Donning and Removing PPE Gown and Gloves"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Critical Steps * (one step per line)
                </label>
                <Textarea
                  rows={5}
                  value={newSkillStepsText}
                  onChange={(e) => setNewSkillStepsText(e.target.value)}
                  placeholder={"Perform hand hygiene before putting on PPE\nPut on gown and tie both neck and waist ties\nPut on gloves extending over gown cuffs"}
                  className="text-xs resize-none rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRegisterSkillOpen(false)}
                  className="h-8 text-xs font-medium rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={createSkillMutation.isPending}
                  onClick={handleCreateSkill}
                  className="h-8 text-xs font-semibold bg-primary hover:bg-[#084B78] text-white border-0 rounded-xl"
                >
                  {createSkillMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Register Skill
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  if (isInstructorOrAuditor) {
    return <InstructorLayout>{content}</InstructorLayout>;
  }
  return <StudentLayout>{content}</StudentLayout>;
};

export default CNACompetencyMatrixPage;
