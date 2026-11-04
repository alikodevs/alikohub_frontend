import React from "react";
import type { Rubric, RubricEvaluationResult } from "../types";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface RubricStudentResultViewProps {
  rubric?: Rubric;
  evaluation: RubricEvaluationResult;
  className?: string;
}

export const RubricStudentResultView: React.FC<RubricStudentResultViewProps> = ({
  rubric,
  evaluation,
  className,
}) => {
  if (!evaluation) return null;

  const totalPoints = evaluation.totalPoints ?? 0;
  const maxPoints =
    evaluation.maxPoints ??
    rubric?.criteria?.reduce((sum, c) => sum + (c.maxPoints || 0), 0) ??
    0;

  const percentage =
    evaluation.percentage ??
    (maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0);

  const passedBenchmark = percentage >= 80;

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs space-y-0",
        className
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/40 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              {rubric?.name || "Standardized Rubric Evaluation"}
            </h4>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold px-2 py-0.5",
                passedBenchmark
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-amber-50 text-amber-700 border-amber-300"
              )}
            >
              {passedBenchmark ? "WABON Pass (≥80%)" : "Under Benchmark (<80%)"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 pl-9">
            Detailed criterion breakdown and instructor evaluation
          </p>
        </div>

        <div className="flex items-baseline gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-2xl font-black text-slate-900">
            {totalPoints}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            /{maxPoints} pts
          </span>
          <span
            className={cn(
              "text-xs font-extrabold px-1.5 py-0.5 rounded ml-1",
              passedBenchmark
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            )}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="divide-y divide-slate-100 p-5 space-y-4">
        {evaluation.criteriaScores && evaluation.criteriaScores.length > 0 ? (
          evaluation.criteriaScores.map((scoreItem, idx) => (
            <div key={scoreItem.criterionId || idx} className="space-y-2 pt-3 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  {scoreItem.criterionTitle || `Criterion ${idx + 1}`}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {scoreItem.points} {scoreItem.maxPoints ? `/ ${scoreItem.maxPoints} pts` : "pts"}
                </span>
              </div>

              <div className="pl-7">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Level: {scoreItem.levelName}
                    </span>
                  </div>
                  {scoreItem.description && (
                    <p className="text-[11px] text-slate-500 pl-5 leading-relaxed">
                      {scoreItem.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : rubric?.criteria ? (
          // Fallback matching selectedLevelIds against rubric criteria
          rubric.criteria.map((crit, idx) => {
            const selectedLevel = crit.levels.find(
              (lvl) =>
                evaluation.selectedLevelIds?.includes(lvl.id || "") ||
                evaluation.selectedLevelIds?.includes(lvl.name)
            );
            return (
              <div key={crit.id || idx} className="space-y-2 pt-3 first:pt-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    {crit.title}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {selectedLevel ? selectedLevel.points : 0} / {crit.maxPoints} pts
                  </span>
                </div>
                {selectedLevel && (
                  <div className="pl-7">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800">
                          {selectedLevel.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 pl-5 leading-relaxed">
                        {selectedLevel.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : null}

        {/* Instructor Comments / Feedback */}
        {evaluation.customFeedback && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs">
              <MessageSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-blue-900 block">
                  Instructor Evaluator Feedback
                </span>
                <p className="text-blue-800 leading-relaxed">
                  {evaluation.customFeedback}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
