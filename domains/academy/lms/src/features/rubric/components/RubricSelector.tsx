import React, { useState } from "react";
import { useRubricsList, useRubricDetail } from "../hooks/useRubrics";
import type { Rubric, RubricType } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Award, Plus, Eye, Check, Sparkles } from "lucide-react";
import { RubricCriteriaTable } from "./RubricCriteriaTable";
import { RubricBuilderModal } from "./RubricBuilderModal";
import { cn } from "@/lib/utils";

interface RubricSelectorProps {
  selectedRubricId?: string;
  onSelectRubric: (rubricId?: string, rubric?: Rubric) => void;
  typeFilter?: RubricType | string;
  label?: string;
  className?: string;
}

export const RubricSelector: React.FC<RubricSelectorProps> = ({
  selectedRubricId,
  onSelectRubric,
  typeFilter,
  label = "Standardized Rubric",
  className,
}) => {
  const { data: rubrics, isLoading } = useRubricsList({
    type: typeFilter,
    isActive: true,
  });

  const { data: selectedRubric } = useRubricDetail(selectedRubricId);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const activeRubric = selectedRubric || rubrics?.find((r) => r.id === selectedRubricId);

  const totalPoints = activeRubric?.criteria?.reduce(
    (sum, c) => sum + (c.maxPoints || 0),
    0
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-blue-600" />
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsBuilderOpen(true)}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Create New Rubric
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedRubricId || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) {
              onSelectRubric(undefined, undefined);
            } else {
              const r = rubrics?.find((item) => item.id === val);
              onSelectRubric(val, r);
            }
          }}
          className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">No rubric attached (Standard points)</option>
          {rubrics?.map((rubric) => {
            const pts = rubric.criteria?.reduce(
              (sum, c) => sum + (c.maxPoints || 0),
              0
            );
            return (
              <option key={rubric.id} value={rubric.id}>
                {rubric.name} ({pts} pts · {rubric.criteria?.length || 0} criteria)
              </option>
            );
          })}
        </select>

        {activeRubric && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="h-10 px-3 rounded-xl border-slate-200 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" /> Preview
          </Button>
        )}
      </div>

      {activeRubric && (
        <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5 min-w-0">
            <span className="font-bold text-blue-900 block truncate">
              {activeRubric.name}
            </span>
            <span className="text-[11px] text-blue-700">
              {activeRubric.criteria?.length || 0} criteria · {totalPoints} total possible points
            </span>
          </div>
          <Badge className="bg-blue-600 text-white text-[10px] font-bold shrink-0">
            Attached
          </Badge>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[85vh] flex flex-col">
          <div className="p-6 overflow-y-auto">
            {activeRubric && <RubricCriteriaTable rubric={activeRubric} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Builder Modal */}
      <RubricBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        defaultType={(typeFilter as RubricType) || "ASSIGNMENT"}
        onCreated={(created) => {
          onSelectRubric(created.id, created);
        }}
      />
    </div>
  );
};
