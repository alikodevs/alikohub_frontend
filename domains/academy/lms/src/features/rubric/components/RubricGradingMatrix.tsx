import React, { useState, useMemo } from "react";
import type {
  Rubric,
  RubricCriterion,
  RubricLevel,
  RubricEvaluationResult,
  EvaluateRubricDto,
} from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { rubricService } from "../services/rubricService";
import { toast } from "sonner";

interface RubricGradingMatrixProps {
  rubric: Rubric;
  initialSelectedLevelIds?: string[];
  initialFeedback?: string;
  onApplyScore?: (
    totalScore: number,
    feedback: string,
    evaluation: RubricEvaluationResult
  ) => void;
  className?: string;
  showSaveButton?: boolean;
}

export const RubricGradingMatrix: React.FC<RubricGradingMatrixProps> = ({
  rubric,
  initialSelectedLevelIds = [],
  initialFeedback = "",
  onApplyScore,
  className,
  showSaveButton = true,
}) => {
  // Map criterionId -> selected levelId
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (initialSelectedLevelIds.length > 0 && rubric?.criteria) {
      rubric.criteria.forEach((criterion) => {
        const found = criterion.levels.find(
          (lvl) => lvl.id && initialSelectedLevelIds.includes(lvl.id)
        );
        if (found && (criterion.id || criterion.title)) {
          const key = criterion.id || criterion.title;
          init[key] = found.id || found.name;
        }
      });
    }
    return init;
  });

  const [customFeedback, setCustomFeedback] = useState<string>(initialFeedback);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Compute total possible points
  const maxPossiblePoints = useMemo(() => {
    return rubric?.criteria?.reduce((sum, c) => sum + (c.maxPoints || 0), 0) || 0;
  }, [rubric]);

  // Compute current scored points based on selections
  const { currentScore, scoredCriteriaCount, criteriaResults } = useMemo(() => {
    let score = 0;
    let count = 0;
    const results: Array<{
      criterionId: string;
      criterionTitle: string;
      selectedLevelId: string;
      levelName: string;
      points: number;
      maxPoints: number;
    }> = [];

    rubric?.criteria?.forEach((crit) => {
      const key = crit.id || crit.title;
      const selectedId = selections[key];
      if (selectedId) {
        const level = crit.levels.find(
          (l) => (l.id && l.id === selectedId) || l.name === selectedId
        );
        if (level) {
          score += level.points;
          count += 1;
          results.push({
            criterionId: String(crit.id || crit.title),
            criterionTitle: crit.title,
            selectedLevelId: String(level.id || level.name),
            levelName: level.name,
            points: level.points,
            maxPoints: crit.maxPoints,
          });
        }
      }
    });

    return {
      currentScore: score,
      scoredCriteriaCount: count,
      criteriaResults: results,
    };
  }, [rubric, selections]);

  const totalCriteriaCount = rubric?.criteria?.length || 0;
  const isComplete = scoredCriteriaCount === totalCriteriaCount && totalCriteriaCount > 0;
  const percentage = maxPossiblePoints > 0 ? Math.round((currentScore / maxPossiblePoints) * 100) : 0;
  const meetsWabonBenchmark = percentage >= 80;

  const handleLevelSelect = (criterionKey: string, levelIdentifier: string) => {
    setSelections((prev) => ({
      ...prev,
      [criterionKey]: levelIdentifier,
    }));
  };

  const handleReset = () => {
    setSelections({});
    setCustomFeedback("");
  };

  const handleEvaluateAndApply = async () => {
    if (!isComplete) {
      toast.warning(`Please score all ${totalCriteriaCount} criteria before saving.`);
      return;
    }

    const selectedLevelIds = Object.values(selections);
    const ratings = criteriaResults.map((cr) => ({
      criterionId: cr.criterionId,
      points: cr.points,
      feedback: cr.levelName,
    }));
    const evaluationPayload: EvaluateRubricDto = {
      rubricId: rubric.id,
      ratings,
      selectedLevelIds,
      customFeedback,
    };

    setIsEvaluating(true);
    try {
      let serverResult: RubricEvaluationResult | null = null;
      try {
        serverResult = await rubricService.evaluateRubric(evaluationPayload);
      } catch (err) {
        // Fallback to client-side calculation if backend evaluate endpoint is mocked or offline
        serverResult = {
          rubricId: rubric.id,
          totalPoints: currentScore,
          maxPoints: maxPossiblePoints,
          percentage,
          selectedLevelIds,
          criteriaScores: criteriaResults,
          customFeedback,
        };
      }

      const finalEvaluation: RubricEvaluationResult = {
        rubricId: rubric.id,
        totalPoints: serverResult?.totalPoints ?? currentScore,
        maxPoints: maxPossiblePoints,
        percentage: serverResult?.percentage ?? percentage,
        selectedLevelIds,
        criteriaScores: criteriaResults,
        customFeedback,
      };

      if (onApplyScore) {
        onApplyScore(finalEvaluation.totalPoints, customFeedback, finalEvaluation);
      }
      toast.success("Rubric evaluation applied successfully");
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!rubric || !rubric.criteria) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs text-center">
        No rubric loaded.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col",
        className
      )}
    >
      {/* Header Bar */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-white/10 text-blue-300">
              <Award className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold tracking-tight text-white">
              {rubric.name}
            </h4>
            <Badge className="bg-white/15 hover:bg-white/20 text-white text-[10px] font-semibold border-none">
              {rubric.type}
            </Badge>
          </div>
          <p className="text-xs text-slate-300 line-clamp-1">
            {rubric.description || "Standardized multi-criteria scoring matrix"}
          </p>
        </div>

        {/* Live Score Summary */}
        <div className="flex items-center gap-4 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
              Evaluated Score
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-white">
                {currentScore}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                /{maxPossiblePoints} pts
              </span>
              <span
                className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded ml-1.5",
                  meetsWabonBenchmark
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                )}
              >
                {percentage}%
              </span>
            </div>
          </div>
          <div className="border-l border-white/20 pl-3 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
              Progress
            </span>
            <span className="text-xs font-bold text-white">
              {scoredCriteriaCount} of {totalCriteriaCount} criteria
            </span>
          </div>
        </div>
      </div>

      {/* Benchmark Banner */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>
            Washington State (WABON) Standard: <strong>80% Benchmark</strong> to demonstrate clinical competency.
          </span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium transition-colors text-[11px]"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Criteria Scoring Grid */}
      <div className="p-5 space-y-6 flex-1 overflow-y-auto max-h-[60vh] divide-y divide-slate-100">
        {rubric.criteria.map((criterion, cIdx) => {
          const criterionKey = String(criterion.id || criterion.title);
          const selectedLevelId = selections[criterionKey];

          return (
            <div key={criterionKey} className={cn("space-y-3", cIdx > 0 && "pt-6")}>
              {/* Criterion Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {cIdx + 1}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">
                      {criterion.title}
                    </h5>
                    {selectedLevelId && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Scored
                      </span>
                    )}
                  </div>
                  {criterion.description && (
                    <p className="text-[11px] text-slate-500 pl-7 leading-relaxed">
                      {criterion.description}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="font-bold text-[11px] text-slate-600 bg-white shrink-0"
                >
                  Max {criterion.maxPoints} pts
                </Badge>
              </div>

              {/* Selectable Performance Level Cards */}
              <div
                className={cn(
                  "grid gap-2.5 pl-7",
                  criterion.levels.length === 1 && "grid-cols-1",
                  criterion.levels.length === 2 && "grid-cols-1 sm:grid-cols-2",
                  criterion.levels.length === 3 &&
                    "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
                  criterion.levels.length >= 4 &&
                    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                )}
              >
                {criterion.levels.map((level, lIdx) => {
                  const levelId = String(level.id || level.name);
                  const isSelected = selectedLevelId === levelId;

                  return (
                    <button
                      key={levelId || lIdx}
                      type="button"
                      onClick={() => handleLevelSelect(criterionKey, levelId)}
                      className={cn(
                        "rounded-xl border p-3.5 text-left transition-all relative flex flex-col justify-between group",
                        isSelected
                          ? "border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600/30"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={cn(
                              "text-xs font-bold",
                              isSelected ? "text-blue-900" : "text-slate-800"
                            )}
                          >
                            {level.name}
                          </span>
                          <span
                            className={cn(
                              "text-[11px] font-extrabold px-2 py-0.5 rounded-md border",
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            )}
                          >
                            {level.points} pts
                          </span>
                        </div>
                        <p
                          className={cn(
                            "text-[11px] leading-snug",
                            isSelected ? "text-blue-800 font-medium" : "text-slate-500"
                          )}
                        >
                          {level.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selected Level
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Custom Feedback Section */}
        <div className="pt-6 space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            Custom Rubric Feedback / Clinical Notes
          </label>
          <Textarea
            value={customFeedback}
            onChange={(e) => setCustomFeedback(e.target.value)}
            placeholder="Add detailed qualitative feedback, commendations, or specific areas for clinical improvement..."
            className="min-h-[90px] rounded-xl border-slate-200 bg-white p-3 text-xs leading-relaxed resize-none focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
          />
        </div>
      </div>

      {/* Footer / Apply Action */}
      {showSaveButton && (
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {isComplete ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> All criteria evaluated
              </span>
            ) : (
              <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Select a performance level for each criterion
              </span>
            )}
          </div>
          <Button
            type="button"
            onClick={handleEvaluateAndApply}
            disabled={!isComplete || isEvaluating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Evaluating...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-2" /> Apply Rubric Score ({currentScore} pts)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
