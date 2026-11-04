import React from "react";
import type { Rubric, RubricCriterion, RubricLevel } from "../types";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface RubricCriteriaTableProps {
  rubric: Rubric;
  className?: string;
  compact?: boolean;
}

export const RubricCriteriaTable: React.FC<RubricCriteriaTableProps> = ({
  rubric,
  className,
  compact = false,
}) => {
  if (!rubric || !rubric.criteria || rubric.criteria.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs text-center">
        No grading criteria defined for this rubric.
      </div>
    );
  }

  const totalPossiblePoints = rubric.criteria.reduce(
    (sum, c) => sum + (c.maxPoints || 0),
    0
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs",
        className
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              {rubric.name}
            </h4>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border-slate-200"
            >
              {rubric.type || "RUBRIC"}
            </Badge>
          </div>
          {rubric.description && (
            <p className="text-xs text-slate-500 line-clamp-2 pl-9">
              {rubric.description}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Total Possible
          </span>
          <span className="text-sm font-extrabold text-blue-700">
            {totalPossiblePoints} pts
          </span>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="divide-y divide-slate-100">
        {rubric.criteria.map((criterion, cIdx) => (
          <div
            key={criterion.id || cIdx}
            className={cn("p-5 space-y-3", compact && "p-3.5 space-y-2")}
          >
            {/* Criterion Title and Max Points */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                    {cIdx + 1}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900">
                    {criterion.title}
                  </h5>
                </div>
                {criterion.description && (
                  <p className="text-[11px] text-slate-500 pl-7 leading-relaxed">
                    {criterion.description}
                  </p>
                )}
              </div>
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 font-bold text-[11px] px-2.5 py-0.5 shrink-0">
                Max {criterion.maxPoints} pts
              </Badge>
            </div>

            {/* Performance Levels Matrix Grid */}
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
              {criterion.levels.map((level, lIdx) => (
                <div
                  key={level.id || lIdx}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-between transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800">
                        {level.name}
                      </span>
                      <span className="text-[11px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                        {level.points} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-3">
                      {level.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
