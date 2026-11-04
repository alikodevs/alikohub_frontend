import React, { useState, useMemo } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import {
  Award,
  Plus,
  Copy,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRubricsList, useCloneRubricMutation } from "../hooks/useRubrics";
import { RubricCriteriaTable } from "../components/RubricCriteriaTable";
import { RubricBuilderModal } from "../components/RubricBuilderModal";
import type { Rubric, RubricType } from "../types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const RubricsManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRubricForPreview, setSelectedRubricForPreview] =
    useState<Rubric | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [cloningRubricId, setCloningRubricId] = useState<string | null>(null);

  const { data: rubrics, isLoading, refetch } = useRubricsList(
    activeTab === "ALL" ? undefined : { type: activeTab }
  );

  const cloneMutation = useCloneRubricMutation();

  const handleClone = async (rubric: Rubric) => {
    const newName = `${rubric.name} (Clone - Term ${new Date().getFullYear()})`;
    setCloningRubricId(rubric.id);
    try {
      await cloneMutation.mutateAsync({
        rubricId: rubric.id,
        newName,
      });
    } finally {
      setCloningRubricId(null);
    }
  };

  const filteredRubrics = useMemo(() => {
    if (!rubrics) return [];
    return rubrics.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description &&
          r.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchTab = activeTab === "ALL" || r.type === activeTab;
      return matchSearch && matchTab;
    });
  }, [rubrics, searchQuery, activeTab]);

  return (
    <InstructorLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Page Title & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Rubric Management
              </h1>
            </div>
            <p className="text-sm text-slate-500 pl-12.5">
              Standardized multi-criteria evaluation matrices for assignments, discussion substantive engagement, and WABON skills checkoffs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsBuilderOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Rubric
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
            {[
              { id: "ALL", label: "All Rubrics" },
              { id: "ASSIGNMENT", label: "Assignments" },
              { id: "DISCUSSION", label: "Discussions" },
              { id: "SKILLS_LAB", label: "Skills Lab" },
              { id: "PEER_REVIEW", label: "Peer Review" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0",
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rubrics..."
              className="pl-9 h-10 rounded-xl bg-white border-slate-200 text-xs focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* Content List / Cards */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">
              Loading standardized rubrics...
            </p>
          </div>
        ) : filteredRubrics.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">
                No rubrics found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? "No rubrics match your search query. Try clearing the filter."
                  : "You haven't created any standardized rubrics in this category yet."}
              </p>
            </div>
            <Button
              onClick={() => setIsBuilderOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create First Rubric
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRubrics.map((rubric) => {
              const totalPoints = rubric.criteria?.reduce(
                (sum, c) => sum + (c.maxPoints || 0),
                0
              );
              const isCloningThis = cloningRubricId === rubric.id;

              return (
                <div
                  key={rubric.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border-slate-200 text-slate-700"
                      >
                        {rubric.type}
                      </Badge>
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                        {totalPoints} pts
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {rubric.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {rubric.description || "No description provided."}
                      </p>
                    </div>

                    {/* Criteria Preview Count */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {rubric.criteria?.length || 0} Criteria
                      </span>
                      {rubric.createdAt && (
                        <span>
                          {format(new Date(rubric.createdAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRubricForPreview(rubric)}
                      className="text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 h-8 px-3 rounded-lg flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview Matrix
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleClone(rubric)}
                      disabled={isCloningThis}
                      className="text-xs font-bold text-slate-600 hover:bg-slate-50 h-8 px-3 rounded-lg border-slate-200 flex items-center gap-1.5"
                    >
                      {isCloningThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Clone
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog
          open={Boolean(selectedRubricForPreview)}
          onOpenChange={(open) => {
            if (!open) setSelectedRubricForPreview(null);
          }}
        >
          <DialogContent className="sm:max-w-[750px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[88vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
              {selectedRubricForPreview && (
                <RubricCriteriaTable rubric={selectedRubricForPreview} />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Builder Modal */}
        <RubricBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          defaultType={
            activeTab === "ALL" ? "ASSIGNMENT" : (activeTab as RubricType)
          }
          onCreated={() => {
            refetch();
          }}
        />
      </div>
    </InstructorLayout>
  );
};

export default RubricsManagementPage;
