import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Trash2, List, CheckSquare, X, FileText, BookOpen, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RubricSelector } from "@/features/rubric/components/RubricSelector";

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBulk: (data: { dtos: any[] }) => void;
  moduleId: string;
  lessonId: string;
  isAdding: boolean;
  initialTitle?: string;
  existingExercisesCount?: number;
  initialData?: any;
  onUpdate?: (exerciseId: string, data: any) => void;
}

const parseOptions = (options: any): string[] => {
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return options
        .split(",")
        .map((o: string) => o.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const normalizeExerciseType = (rawType?: string) => {
  if (rawType === "SHORT_ANSWER" || rawType === "ESSAY") return "SHORT_TEXT";
  if (
    rawType === "MULTIPLE_CHOICE" ||
    rawType === "TRUE_FALSE" ||
    rawType === "MATCHING" ||
    rawType === "SHORT_TEXT"
  ) {
    return rawType;
  }
  return "MULTIPLE_CHOICE";
};

export const ExerciseModal = ({
  isOpen,
  onClose,
  onAddBulk,
  moduleId,
  lessonId,
  isAdding,
  initialTitle,
  existingExercisesCount = 0,
  initialData,
  onUpdate,
}: ExerciseModalProps) => {
  const [bulkExercises, setBulkExercises] = useState<any[]>([]);

  // Extract batch ID from initialTitle if present, otherwise generate new
  const [activeBatchId, setActiveBatchId] = useState(() => {
    if (initialTitle?.includes(" ||| ")) {
      return initialTitle.split(" ||| ")[1];
    }
    if (initialData?.title?.includes(" ||| ")) {
      return initialData.title.split(" ||| ")[1];
    }
    return Math.random().toString(36).substring(2, 9);
  });

  const [formData, setFormData] = useState<any>({
    title:
      initialData?.title?.split(" ||| ")[0] ||
      initialTitle?.split(" ||| ")[0] ||
      "",
    type: normalizeExerciseType(initialData?.type),
    question: initialData?.question || "",
    description: initialData?.description || "",
    options: initialData?.options
      ? parseOptions(initialData.options)
      : ["", ""],
    correctAnswer: initialData?.correctAnswer || "",
    points: initialData?.points || 1,
    rubricId: initialData?.rubricId || "",
  });

  // Update form if initialData or initialTitle changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title?.split(" ||| ")[0] || "",
          type: normalizeExerciseType(initialData.type),
          question: initialData.question || "",
          description: initialData.description || "",
          options: parseOptions(initialData.options),
          correctAnswer: initialData.correctAnswer || "",
          points: initialData.points || 1,
          rubricId: initialData.rubricId || "",
        });
        const [, batchId] = initialData.title?.split(" ||| ") || [];
        if (batchId) setActiveBatchId(batchId);
      } else if (initialTitle && !bulkExercises.length) {
        const [, batchId] = initialTitle.split(" ||| ");
        setFormData((prev: any) => ({
          ...prev,
          title: "", // Always clear title for new entry
          question: "",
          description: "",
          options: ["", ""],
          correctAnswer: "",
          points: 1,
          rubricId: "",
        }));
        if (batchId) setActiveBatchId(batchId);
      } else if (!initialTitle && !bulkExercises.length) {
        // Regenerate batch ID for fresh assessments
        setActiveBatchId(Math.random().toString(36).substring(2, 9));
        resetForm();
      }
    }
  }, [initialData, initialTitle, isOpen]);

  const resetForm = (keepTitle = false) => {
    setFormData({
      title: "",
      type: "MULTIPLE_CHOICE",
      question: "",
      description: "",
      options: ["", ""],
      correctAnswer: "",
      points: 1,
      rubricId: "",
    });
  };

  const clearAll = () => {
    resetForm();
    setBulkExercises([]);
  };

  const handleTypeChange = (newType: string) => {
    if (newType === "TRUE_FALSE") {
      setFormData({
        ...formData,
        type: newType,
        options: ["True", "False"],
        correctAnswer: "",
      });
    } else if (newType === "SHORT_TEXT") {
      setFormData({
        ...formData,
        type: newType,
        options: [],
        correctAnswer: "",
      });
    } else {
      setFormData({
        ...formData,
        type: newType,
        options: ["", ""],
        correctAnswer: "",
      });
    }
  };

  const handleAddOption = () => {
    setFormData({ ...formData, options: [...formData.options, ""] });
  };

  const handleRemoveOption = (index: number) => {
    const optionToRemove = formData.options[index];
    const newOptions = formData.options.filter(
      (_: any, i: number) => i !== index,
    );
    let newCorrectAnswer = formData.correctAnswer;
    if (formData.correctAnswer === optionToRemove) newCorrectAnswer = "";

    setFormData({
      ...formData,
      options: newOptions,
      correctAnswer: newCorrectAnswer,
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const oldOption = formData.options[index];
    const newOptions = [...formData.options];
    newOptions[index] = value;
    let newCorrectAnswer = formData.correctAnswer;
    if (formData.correctAnswer === oldOption) newCorrectAnswer = value;

    setFormData({
      ...formData,
      options: newOptions,
      correctAnswer: newCorrectAnswer,
    });
  };

  const validateForm = () => {
    if (!formData.title) return false;
    if (formData.type === "SHORT_TEXT") {
      return true;
    }
    return formData.correctAnswer !== "";
  };

  const prepareExerciseData = (data: any) => {
    // Suffix with the active batch ID to ensure grouping
    const fullTitle = `${data.title} ||| ${activeBatchId}`;
    const validType = normalizeExerciseType(data.type);

    return {
      title: fullTitle,
      description: data.title,
      question: data.title,
      type: validType,
      options: validType === "SHORT_TEXT" ? [] : data.options,
      correctAnswer: data.correctAnswer,
      points: Number(data.points) || 1,
    };
  };

  const handleNext = () => {
    if (!validateForm()) return;
    setBulkExercises([
      ...bulkExercises,
      {
        ...prepareExerciseData(formData),
        moduleId: Number(moduleId),
        lessonId: Number(lessonId),
        order: existingExercisesCount + bulkExercises.length + 1,
      },
    ]);
    resetForm(true);
  };

  const handleFinalSubmit = () => {
    if (initialData && onUpdate) {
      if (!validateForm()) return;
      onUpdate(initialData.id, prepareExerciseData(formData));
      onClose();
      return;
    }

    let finalDtos = [...bulkExercises];
    if (validateForm()) {
      finalDtos.push({
        ...prepareExerciseData(formData),
        moduleId: Number(moduleId),
        lessonId: Number(lessonId),
        order: existingExercisesCount + finalDtos.length + 1,
      });
    }
    if (finalDtos.length === 0) return;
    onAddBulk({ dtos: finalDtos });
    clearAll();
  };

  const handleClose = () => {
    if (!initialData) clearAll();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[95vh] flex flex-col">
        <div className="p-6 pb-2 flex justify-between items-start">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
              {initialData ? "Edit Question" : "Add Exercise"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {initialData
                ? "Update the details for this question."
                : "Create a multiple-choice question for this lesson."}
            </DialogDescription>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6">
          {bulkExercises.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <span className="text-[10px] font-black uppercase text-slate-400 w-full mb-1">
                Queue ({bulkExercises.length})
              </span>
              {bulkExercises.map((ex, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-white border-slate-200 text-slate-600 flex gap-1 items-center py-1"
                >
                  #{idx + 1} {ex.title.substring(0, 10)}...
                  <Trash2
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() =>
                      setBulkExercises(
                        bulkExercises.filter((_, i) => i !== idx),
                      )
                    }
                  />
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {[
              { id: "MULTIPLE_CHOICE", icon: List, label: "Multiple Choice" },
              { id: "TRUE_FALSE", icon: CheckSquare, label: "True / False" },
              { id: "SHORT_TEXT", icon: FileText, label: "Short Answer / Clinical Response" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border transition-all text-xs font-bold ${
                  formData.type === t.id
                    ? "bg-[#F5C07A]/15 border-[#F5C07A] text-[#d98e32]"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-bold text-slate-800">
                {formData.type === "SHORT_TEXT" ? "Prompt / Question" : "Question"}
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder={
                  formData.type === "SHORT_TEXT"
                    ? "e.g. Analyze the patient scenario and outline immediate interventions..."
                    : "e.g. What is the standard duration for medical asepsis hand hygiene?"
                }
                className="bg-white border-slate-200 h-12 rounded-xl focus-visible:ring-[#F5C07A]"
              />
            </div>
            <div className="w-24 space-y-2">
              <label className="text-sm font-bold text-slate-800 text-right block">
                Points
              </label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) =>
                  setFormData({ ...formData, points: parseInt(e.target.value) || 0 })
                }
                className="bg-white border-slate-200 h-12 rounded-xl text-center focus-visible:ring-[#F5C07A]"
              />
            </div>
          </div>

          {formData.type === "SHORT_TEXT" ? (
            <div className="space-y-4 pb-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Sample Answer / Clinical Benchmark Guidelines (Optional)
                </label>
                <Input
                  value={formData.correctAnswer}
                  onChange={(e) =>
                    setFormData({ ...formData, correctAnswer: e.target.value })
                  }
                  placeholder="Key concepts or rationales expected in student responses..."
                  className="bg-white border-slate-200 h-11 rounded-xl text-xs"
                />
              </div>

              {/* Standardized Rubric Selector */}
              <div className="pt-2 border-t border-slate-100">
                <RubricSelector
                  selectedRubricId={formData.rubricId}
                  onSelectRubric={(rubricId, rubric) => {
                    setFormData({
                      ...formData,
                      rubricId: rubricId || "",
                      points: rubric
                        ? rubric.criteria.reduce((s, c) => s + (c.maxPoints || 0), 0)
                        : formData.points,
                    });
                  }}
                  typeFilter="ASSIGNMENT"
                  label="Attach Standardized Evaluation Rubric"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              <label className="text-sm font-bold text-slate-800 block">
                Options —{" "}
                <span className="font-normal text-slate-500">
                  select the correct answer
                </span>
              </label>

              <div className="space-y-3">
                {formData.options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 group">
                    <div
                      onClick={() =>
                        setFormData({ ...formData, correctAnswer: option })
                      }
                      className={`w-5 h-5 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all flex-shrink-0 ${
                        formData.correctAnswer === option && option !== ""
                          ? "border-[#F59E0B] bg-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {formData.correctAnswer === option && option !== "" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-400 w-4">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div className="flex-1 relative">
                      <Input
                        value={option}
                        disabled={formData.type === "TRUE_FALSE"}
                        onChange={(e) =>
                          handleOptionChange(index, e.target.value)
                        }
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="bg-white border-slate-200 h-12 rounded-xl focus-visible:ring-[#F5C07A] pr-10"
                      />
                      {formData.type === "MULTIPLE_CHOICE" &&
                        formData.options.length > 2 && (
                          <button
                            onClick={() => handleRemoveOption(index)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>

              {formData.type === "MULTIPLE_CHOICE" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOption}
                  className="mt-2 border-slate-200 text-slate-900 font-bold rounded-xl h-12 px-6 flex items-center gap-2 hover:bg-slate-50 hover:text-primary"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </Button>
              )}

              {/* Optional Rubric Selector for objective quizzes */}
              <div className="pt-4 border-t border-slate-100">
                <RubricSelector
                  selectedRubricId={formData.rubricId}
                  onSelectRubric={(rubricId, rubric) => {
                    setFormData({
                      ...formData,
                      rubricId: rubricId || "",
                    });
                  }}
                  label="Attach Optional Rubric Criteria (Optional)"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex justify-between items-center bg-white border-t border-slate-50">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="font-bold text-slate-400 hover:text-slate-600 rounded-xl"
          >
            Cancel
          </Button>
          <div className="flex gap-3">
            {!initialData && (
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={!validateForm()}
                className="font-bold border-slate-200 text-slate-700 rounded-xl h-12 px-6 hover:bg-slate-50 hover:text-primary"
              >
                Save & Next Question
              </Button>
            )}
            <Button
              onClick={handleFinalSubmit}
              disabled={
                isAdding ||
                (!initialData && bulkExercises.length === 0 && !validateForm())
              }
              className="bg-[#F5C07A] hover:bg-[#f0b05d] text-white font-bold rounded-xl h-12 px-8 shadow-sm transition-all border-none min-w-[140px]"
            >
              {isAdding
                ? "Saving..."
                : initialData
                  ? "Update Question"
                  : bulkExercises.length > 0
                    ? `Finish Assessment (${bulkExercises.length + (validateForm() ? 1 : 0)})`
                    : "Finish Assessment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
