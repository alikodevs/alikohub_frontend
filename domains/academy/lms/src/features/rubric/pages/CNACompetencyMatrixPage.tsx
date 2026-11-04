import React, { useState } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSkillsList, useRecordCheckoffMutation } from "../hooks/useSkillsLab";
import type { Skill, SkillCheckoff } from "../types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Default standard WABON skills if backend initial state is empty
const DEFAULT_WABON_SKILLS: Skill[] = [
  {
    id: 1,
    skillNumber: "SKILL-01",
    title: "Hand Hygiene (Medical Asepsis)",
    category: "INFECTION_CONTROL",
    description: "Decontaminates hands using soap and warm water with proper friction, wrist coverage, and clean paper towel technique.",
    criticalSteps: [
      "Wet hands and wrists thoroughly under running water, keeping hands lower than elbows.",
      "Apply soap and lather all surfaces including wrists, backs of hands, and between fingers for at least 20 seconds.",
      "Clean under fingernails against palm of opposite hand.",
      "Rinse hands thoroughly with fingertips pointing downward.",
      "Dry hands with clean paper towel and discard.",
      "Turn off faucet with a separate clean, dry paper towel without touching clean hands to faucet handle.",
    ],
    passingScore: 100,
  },
  {
    id: 2,
    skillNumber: "SKILL-02",
    title: "Donning & Doffing Full PPE (Gown & Gloves)",
    category: "INFECTION_CONTROL",
    description: "Properly sequences PPE donning and doffing to prevent self-contamination and environmental transmission.",
    criticalSteps: [
      "Select correct size gown and unroll completely.",
      "Fasten ties at neck securely and overlap back of gown completely.",
      "Fasten waist ties at back or side.",
      "Put on clean gloves and pull cuffs over the gown wrists.",
      "Doff gloves first by turning inside out without touching outer contaminated surface.",
      "Unfasten neck and waist ties, peel gown downward and outward away from body.",
      "Dispose in biohazard/linen receptacle and perform immediate hand hygiene.",
    ],
    passingScore: 100,
  },
  {
    id: 3,
    skillNumber: "SKILL-03",
    title: "Measuring & Recording Radial Pulse and Respirations",
    category: "VITAL_SIGNS",
    description: "Accurately counts radial pulse for 60 seconds and covertly measures respiration rate.",
    criticalSteps: [
      "Locate radial pulse using tips of first two or three fingers (never thumb).",
      "Count pulse for 60 seconds or 30 seconds x 2 if regular.",
      "Count respirations immediately without letting resident know.",
      "Record pulse rate within +/- 4 beats of RN evaluator.",
      "Record respiration rate within +/- 2 breaths of RN evaluator.",
    ],
    passingScore: 100,
  },
  {
    id: 4,
    skillNumber: "SKILL-04",
    title: "Transfer Resident from Bed to Wheelchair Using Gait Belt",
    category: "MOBILITY",
    description: "Safely transfers a partially weight-bearing resident using a transfer belt with locked bed and wheelchair wheels.",
    criticalSteps: [
      "Explain procedure and position wheelchair at head or foot of bed with brakes locked.",
      "Ensure bed is in lowest position and bed brakes are locked.",
      "Assist resident to seated position on edge of bed with non-skid footwear on flat floor.",
      "Apply gait belt securely around natural waistline over clothing (two fingers fit).",
      "Grasp belt with upward underhand grip on both sides.",
      "On count of three, brace resident's knees and assist to standing position.",
      "Pivot toward wheelchair and back resident until legs touch seat.",
      "Lower resident gently into wheelchair, remove belt, and position footrests.",
    ],
    passingScore: 100,
  },
];

export const CNACompetencyMatrixPage: React.FC = () => {
  const { data: skillsFromApi, isLoading } = useSkillsList();
  const skills: Skill[] = skillsFromApi && skillsFromApi.length > 0 ? skillsFromApi : DEFAULT_WABON_SKILLS;

  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSkillForCheckoff, setSelectedSkillForCheckoff] = useState<Skill | null>(null);

  // Checkoff modal state
  const [studentUserId, setStudentUserId] = useState<string>("");
  const [cohortId, setCohortId] = useState<string>("1");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [evaluatorNotes, setEvaluatorNotes] = useState<string>("");
  const [evaluatorSignature, setEvaluatorSignature] = useState<string>("RN Evaluator Verified");

  // Track checked-off skills in local session
  const [checkoffsHistory, setCheckoffsHistory] = useState<Record<string, SkillCheckoff>>({});

  const recordCheckoffMutation = useRecordCheckoffMutation();

  const handleOpenCheckoff = (skill: Skill) => {
    setSelectedSkillForCheckoff(skill);
    setCompletedSteps([]);
    setEvaluatorNotes("");
  };

  const toggleStep = (stepText: string) => {
    setCompletedSteps((prev) =>
      prev.includes(stepText)
        ? prev.filter((s) => s !== stepText)
        : [...prev, stepText]
    );
  };

  const handleSelectAllSteps = () => {
    if (selectedSkillForCheckoff) {
      setCompletedSteps([...selectedSkillForCheckoff.criticalSteps]);
    }
  };

  const handleSubmitCheckoff = async (status: "PASSED" | "NEEDS_PRACTICE") => {
    if (!selectedSkillForCheckoff) return;
    if (!studentUserId.trim()) {
      toast.error("Please enter the student's name or ID.");
      return;
    }

    const notesText =
      evaluatorNotes.trim() ||
      (status === "PASSED"
        ? "Demonstrated clinical competency."
        : "Needs practice on sequential steps.");

    const payload: Partial<SkillCheckoff> = {
      skillId: selectedSkillForCheckoff.id,
      studentUserId: studentUserId.trim(),
      cohortId: Number(cohortId) || 1,
      status,
      attemptNumber: 1,
      criticalStepsCompleted: completedSteps,
      evaluatorNotes: notesText,
      notes: notesText,
      signatureUrl: evaluatorSignature,
    };

    try {
      await recordCheckoffMutation.mutateAsync(payload);
      setCheckoffsHistory((prev) => ({
        ...prev,
        [String(selectedSkillForCheckoff.id)]: {
          ...payload,
          id: Date.now(),
          evaluatedAt: new Date().toISOString(),
        } as SkillCheckoff,
      }));
      setSelectedSkillForCheckoff(null);
    } catch {
      // Handled by mutation toast
    }
  };

  const filteredSkills = skills.filter((s) => {
    const matchCat = activeCategory === "ALL" || s.category === activeCategory;
    const matchSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.skillNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const passedCount = Object.values(checkoffsHistory).filter(
    (c) => c.status === "PASSED"
  ).length;
  const progressPct = skills.length > 0 ? Math.round((passedCount / skills.length) * 100) : 0;

  return (
    <InstructorLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Skills Lab Competency Matrix
              </h1>
            </div>
            <p className="text-sm text-slate-500 pl-12.5">
              Washington State WAC 246-841A-440(7) Nursing Assistant Practical Skills Checkoff Engine.
            </p>
          </div>

          {/* Overall Pass Counter */}
          <div className="flex items-center gap-4 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Competency Progress
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900">
                  {passedCount}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  / {skills.length} Skills
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-700">
              {progressPct}%
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
            {[
              { id: "ALL", label: "All Skills" },
              { id: "INFECTION_CONTROL", label: "Infection Control" },
              { id: "VITAL_SIGNS", label: "Vital Signs" },
              { id: "MOBILITY", label: "Mobility & Transfers" },
              { id: "PERSONAL_CARE", label: "Personal Care" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0",
                  activeCategory === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skill title or number..."
              className="pl-9 h-10 rounded-xl bg-white border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        {/* Skills Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSkills.map((skill) => {
            const history = checkoffsHistory[String(skill.id)];
            const isPassed = history?.status === "PASSED";
            const isNeedsPractice = history?.status === "NEEDS_PRACTICE";

            return (
              <div
                key={skill.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {skill.skillNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5",
                        isPassed
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : isNeedsPractice
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      )}
                    >
                      {isPassed
                        ? "PASSED (COMPETENT)"
                        : isNeedsPractice
                        ? "NEEDS PRACTICE"
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

                  {/* Critical Steps Accordion Summary */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Critical Steps Checklist ({skill.criticalSteps.length})
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {skill.criticalSteps.slice(0, 3).map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                          <span className="line-clamp-1">{step}</span>
                        </li>
                      ))}
                      {skill.criticalSteps.length > 3 && (
                        <li className="text-[10px] font-semibold text-slate-400 pl-3.5">
                          + {skill.criticalSteps.length - 3} more critical steps
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    WABON Benchmark: 100% Pass
                  </span>
                  <Button
                    onClick={() => handleOpenCheckoff(skill)}
                    size="sm"
                    className="h-8 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Evaluate Checkoff
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkoff Interactive Modal */}
        <Dialog
          open={Boolean(selectedSkillForCheckoff)}
          onOpenChange={(open) => {
            if (!open) setSelectedSkillForCheckoff(null);
          }}
        >
          <DialogContent className="sm:max-w-[700px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-white flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                    {selectedSkillForCheckoff?.skillNumber}
                  </span>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    {selectedSkillForCheckoff?.title}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  WAC 246-841A-440(7) Clinical Checkoff — Verify each critical step before sign-off
                </DialogDescription>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Student Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Candidate / Student Name *
                  </label>
                  <Input
                    value={studentUserId}
                    onChange={(e) => setStudentUserId(e.target.value)}
                    placeholder="e.g. Sarah Jenkins (STU-042)"
                    className="h-9 bg-white text-xs rounded-lg border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Cohort ID
                  </label>
                  <Input
                    value={cohortId}
                    onChange={(e) => setCohortId(e.target.value)}
                    placeholder="Cohort 1"
                    className="h-9 bg-white text-xs rounded-lg border-slate-200"
                  />
                </div>
              </div>

              {/* Critical Steps Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Sequential Critical Steps ({completedSteps.length} of {selectedSkillForCheckoff?.criticalSteps.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllSteps}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Mark All Completed
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedSkillForCheckoff?.criticalSteps.map((step, idx) => {
                    const isChecked = completedSteps.includes(step);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleStep(step)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all",
                          isChecked
                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <span className="leading-relaxed flex-1">
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Evaluator Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  RN Evaluator Clinical Observation Notes
                </label>
                <Textarea
                  value={evaluatorNotes}
                  onChange={(e) => setEvaluatorNotes(e.target.value)}
                  placeholder="Notes on technique, asepsis, resident interaction, or areas requiring remediation..."
                  className="min-h-[70px] text-xs rounded-xl border-slate-200 resize-none"
                />
              </div>

              {/* Digital Signature */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Evaluator Digital Attestation
                </label>
                <Input
                  value={evaluatorSignature}
                  onChange={(e) => setEvaluatorSignature(e.target.value)}
                  className="h-9 bg-white text-xs rounded-lg border-slate-200"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedSkillForCheckoff(null)}
                className="text-xs font-semibold text-slate-500"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmitCheckoff("NEEDS_PRACTICE")}
                  disabled={recordCheckoffMutation.isPending}
                  className="text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  Mark Needs Practice
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmitCheckoff("PASSED")}
                  disabled={recordCheckoffMutation.isPending}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {recordCheckoffMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Certify Competency (PASS)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </InstructorLayout>
  );
};

export default CNACompetencyMatrixPage;
