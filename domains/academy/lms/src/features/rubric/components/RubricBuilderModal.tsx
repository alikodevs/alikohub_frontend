import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Award,
  Sparkles,
  Layers,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import type { CreateRubricDto, RubricType, Rubric } from "../types";
import { useCreateRubricMutation } from "../hooks/useRubrics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RubricBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newRubric: Rubric) => void;
  defaultType?: RubricType;
}

const TEMPLATES: Record<
  string,
  { name: string; description: string; type: RubricType; criteria: CreateRubricDto["criteria"] }
> = {
  infectionControl: {
    name: "Clinical Judgment & Infection Control Rubric",
    description:
      "Assesses critical thinking, communication, and adherence to CDC/OSHA infection control protocols (WABON WAC 246-841A-440).",
    type: "DISCUSSION",
    criteria: [
      {
        title: "Subject Mastery & WABON Core Knowledge",
        description:
          "Demonstrates deep comprehension of standard precautions, safety protocols, and resident dignity.",
        maxPoints: 10,
        order: 1,
        levels: [
          {
            name: "Exemplary",
            description:
              "Flawlessly articulates all infection control principles with direct textbook citations.",
            points: 10,
            order: 1,
          },
          {
            name: "Competent",
            description:
              "Identifies core safety precautions; minor gaps in technical rationales.",
            points: 7,
            order: 2,
          },
          {
            name: "Developing",
            description:
              "Basic awareness with noticeable omissions in critical safety protocols.",
            points: 4,
            order: 3,
          },
          {
            name: "Unacceptable",
            description:
              "Fails to identify essential standard precautions or violates safety norms.",
            points: 0,
            order: 4,
          },
        ],
      },
      {
        title: "Peer Engagement & Substantive Dialogue",
        description:
          "Critically responds to at least two classmates with constructive clinical feedback.",
        maxPoints: 5,
        order: 2,
        levels: [
          {
            name: "Substantive",
            description:
              "Engaged 2+ peers with insightful clinical inquiries and supportive dialogue.",
            points: 5,
            order: 1,
          },
          {
            name: "Minimal",
            description:
              "Posted brief confirmation without substantive clinical reasoning.",
            points: 2.5,
            order: 2,
          },
          {
            name: "None",
            description: "Did not interact with peer cohort.",
            points: 0,
            order: 3,
          },
        ],
      },
    ],
  },
  assignmentPractice: {
    name: "CNA Clinical Case Assignment Rubric",
    description:
      "Evaluates written assignment submissions, patient safety protocols, clinical documentation, and critical thinking.",
    type: "ASSIGNMENT",
    criteria: [
      {
        title: "Procedural Accuracy & Safety Standards",
        description: "Addresses mandatory care steps and infection prevention without breaches or contamination.",
        maxPoints: 10,
        order: 1,
        levels: [
          { name: "Mastery", description: "All steps and rationales thoroughly articulated.", points: 10, order: 1 },
          { name: "Proficient", description: "Key principles explained safely with minor non-critical gaps.", points: 8, order: 2 },
          { name: "Needs Practice", description: "Missed 1-2 non-critical points; safety principles preserved.", points: 5, order: 3 },
          { name: "Unsafe", description: "Critical safety or infection control violation identified.", points: 0, order: 4 },
        ],
      },
      {
        title: "Resident Communication & Dignity",
        description: "Demonstrates resident rights, privacy protection, and empathetic bedside communication.",
        maxPoints: 5,
        order: 2,
        levels: [
          { name: "Exemplary", description: "Compassionate, professional care considerations throughout.", points: 5, order: 1 },
          { name: "Adequate", description: "Addresses resident privacy and basic dignity.", points: 3.5, order: 2 },
          { name: "Deficient", description: "Failed to address resident rights or preserve dignity/privacy.", points: 0, order: 3 },
        ],
      },
    ],
  },
};

export const RubricBuilderModal: React.FC<RubricBuilderModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultType = "DISCUSSION",
}) => {
  const [formData, setFormData] = useState<CreateRubricDto>({
    name: "",
    description: "",
    type: defaultType,
    isActive: true,
    criteria: [
      {
        title: "Core Subject Knowledge & Analysis",
        description: "Demonstrates thorough understanding and relevant evidence.",
        maxPoints: 10,
        order: 1,
        levels: [
          { name: "Exemplary", description: "Exceptional analysis with comprehensive citations.", points: 10, order: 1 },
          { name: "Competent", description: "Solid comprehension with clear explanations.", points: 7, order: 2 },
          { name: "Developing", description: "Basic understanding; lacks depth.", points: 4, order: 3 },
          { name: "Unacceptable", description: "Inaccurate or missing key principles.", points: 0, order: 4 },
        ],
      },
    ],
  });

  const createMutation = useCreateRubricMutation();

  const handleLoadTemplate = (templateKey: string) => {
    const tmpl = TEMPLATES[templateKey];
    if (tmpl) {
      setFormData({
        name: tmpl.name,
        description: tmpl.description,
        type: tmpl.type,
        isActive: true,
        criteria: JSON.parse(JSON.stringify(tmpl.criteria)),
      });
      toast.info(`Loaded template: ${tmpl.name}`);
    }
  };

  const handleAddCriterion = () => {
    setFormData((prev) => ({
      ...prev,
      criteria: [
        ...prev.criteria,
        {
          title: `Criterion ${prev.criteria.length + 1}`,
          description: "",
          maxPoints: 10,
          order: prev.criteria.length + 1,
          levels: [
            { name: "Exemplary", description: "Meets highest standard.", points: 10, order: 1 },
            { name: "Competent", description: "Meets standard satisfactorily.", points: 7, order: 2 },
            { name: "Developing", description: "Partially meets standard.", points: 4, order: 3 },
            { name: "Unacceptable", description: "Does not meet standard.", points: 0, order: 4 },
          ],
        },
      ],
    }));
  };

  const handleRemoveCriterion = (idx: number) => {
    if (formData.criteria.length <= 1) {
      toast.warning("A rubric must have at least one criterion.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== idx),
    }));
  };

  const handleCriterionChange = (idx: number, field: string, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.criteria];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, criteria: updated };
    });
  };

  const handleAddLevel = (criterionIdx: number) => {
    setFormData((prev) => {
      const updated = [...prev.criteria];
      const crit = updated[criterionIdx];
      crit.levels = [
        ...crit.levels,
        {
          name: "Level",
          description: "Description of performance.",
          points: 0,
          order: crit.levels.length + 1,
        },
      ];
      return { ...prev, criteria: updated };
    });
  };

  const handleRemoveLevel = (criterionIdx: number, levelIdx: number) => {
    setFormData((prev) => {
      const updated = [...prev.criteria];
      const crit = updated[criterionIdx];
      if (crit.levels.length <= 1) {
        toast.warning("Each criterion must have at least one level.");
        return prev;
      }
      crit.levels = crit.levels.filter((_, i) => i !== levelIdx);
      return { ...prev, criteria: updated };
    });
  };

  const handleLevelChange = (
    criterionIdx: number,
    levelIdx: number,
    field: string,
    value: any
  ) => {
    setFormData((prev) => {
      const updated = [...prev.criteria];
      const crit = updated[criterionIdx];
      crit.levels[levelIdx] = { ...crit.levels[levelIdx], [field]: value };
      return { ...prev, criteria: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a rubric name.");
      return;
    }

    const totalMax = formData.criteria.reduce(
      (sum, c) => sum + (Number(c.maxPoints) || 0),
      0
    );

    const rawType = formData.type === "DISCUSSION" ? "DISCUSSION" : "ASSIGNMENT";
    const payload: CreateRubricDto = {
      name: formData.name.trim(),
      description: formData.description?.trim() || "",
      type: rawType,
      isActive: true,
      criteria: formData.criteria.map((c, cIdx) => ({
        title: c.title.trim() || `Criterion ${cIdx + 1}`,
        description: c.description?.trim() || "",
        maxPoints: Math.max(1, Number(c.maxPoints) || 10),
        order: cIdx + 1,
        levels: c.levels.map((l, lIdx) => ({
          name: l.name.trim() || `Level ${lIdx + 1}`,
          points: Math.max(0, Number(l.points) || 0),
          description: l.description?.trim() || "Demonstrates required standard.",
          order: lIdx + 1,
        })),
      })),
    };

    try {
      const created = await createMutation.mutateAsync(payload);
      if (onCreated) {
        onCreated(created);
      }
      onClose();
    } catch {
      // Handled by mutation onError toast
    }
  };

  const totalMaxPoints = formData.criteria.reduce(
    (sum, c) => sum + (Number(c.maxPoints) || 0),
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Create Standardized Rubric
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Configure criteria, performance tiers, and points for transparent WABON compliance grading
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-extrabold text-xs px-3 py-1">
              Total {totalMaxPoints} pts
            </Badge>
          </div>
        </div>

        {/* Template Quick-Select Bar */}
        <div className="px-7 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Quick Templates:
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate("infectionControl")}
              className="text-[11px] h-7 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 border-slate-200"
            >
              Discussion Rubric
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate("assignmentPractice")}
              className="text-[11px] h-7 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 border-slate-200"
            >
              Assignment Rubric
            </Button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Rubric Title *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Clinical Judgment & Resident Safety Rubric"
                className="bg-white border-slate-200 h-10 rounded-xl focus-visible:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Assessment Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as RubricType,
                  })
                }
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DISCUSSION">DISCUSSION (Module Discussion Topics)</option>
                <option value="ASSIGNMENT">ASSIGNMENT (Written Submissions &amp; Exercises)</option>
              </select>
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Description / Purpose
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Explain the learning outcomes and standards assessed by this rubric..."
                className="bg-white border-slate-200 min-h-[60px] rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          {/* Criteria List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                Grading Criteria & Performance Levels ({formData.criteria.length})
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCriterion}
                className="h-8 text-xs font-bold rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Criterion
              </Button>
            </div>

            {formData.criteria.map((criterion, cIdx) => (
              <div
                key={cIdx}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 relative"
              >
                {/* Criterion Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <Input
                        value={criterion.title}
                        onChange={(e) =>
                          handleCriterionChange(cIdx, "title", e.target.value)
                        }
                        placeholder={`Criterion ${cIdx + 1} Title`}
                        className="bg-white font-bold text-xs h-9 rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-semibold">
                          Max:
                        </span>
                        <Input
                          type="number"
                          value={criterion.maxPoints}
                          onChange={(e) =>
                            handleCriterionChange(
                              cIdx,
                              "maxPoints",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="bg-white font-bold text-xs h-9 rounded-lg text-center"
                        />
                        <span className="text-xs text-slate-400 font-semibold">
                          pts
                        </span>
                      </div>
                    </div>
                    <div className="sm:col-span-4">
                      <Input
                        value={criterion.description}
                        onChange={(e) =>
                          handleCriterionChange(
                            cIdx,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Criterion guidelines or instructions for student..."
                        className="bg-white text-xs h-8 rounded-lg"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCriterion(cIdx)}
                    className="text-slate-400 hover:text-red-500 h-8 w-8 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Levels Grid */}
                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Performance Levels
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddLevel(cIdx)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Level
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {criterion.levels.map((level, lIdx) => (
                      <div
                        key={lIdx}
                        className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 relative group shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <Input
                            value={level.name}
                            onChange={(e) =>
                              handleLevelChange(
                                cIdx,
                                lIdx,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Level (e.g. Exemplary)"
                            className="h-7 text-xs font-bold border-none p-0 focus-visible:ring-0"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <Input
                              type="number"
                              value={level.points}
                              onChange={(e) =>
                                handleLevelChange(
                                  cIdx,
                                  lIdx,
                                  "points",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-12 h-6 text-[11px] font-bold text-center p-0.5 rounded border-slate-200"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">
                              pt
                            </span>
                            {criterion.levels.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLevel(cIdx, lIdx)}
                                className="text-slate-300 hover:text-red-500 ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <Textarea
                          value={level.description}
                          onChange={(e) =>
                            handleLevelChange(
                              cIdx,
                              lIdx,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Descriptors of mastery at this level..."
                          className="min-h-[55px] text-[11px] p-2 rounded-lg border-slate-200 bg-slate-50/50 resize-none leading-tight"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dialog Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-10 px-5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Rubric...
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 mr-2" /> Save & Publish Rubric
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
