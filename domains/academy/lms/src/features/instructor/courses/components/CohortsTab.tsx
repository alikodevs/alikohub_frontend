import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateCohort, useCohorts } from "@/hooks/useAcademy";
import { Users, Plus, Calendar, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface CohortsTabProps {
  courseId: string;
}

export const CohortsTab = ({ courseId }: CohortsTabProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isHighSchoolTenMonth: false,
  });

  const { data: cohortsData, isLoading } = useCohorts(courseId);
  const createCohortMutation = useCreateCohort();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all fields");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end <= start) {
      toast.error("End date must be after start date");
      return;
    }
    const durationDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    if (!formData.isHighSchoolTenMonth && durationDays > 90) {
      toast.error(
        "Standard cohorts must be completed within 90 days (3 months) unless marked as a 10-month high school calendar."
      );
      return;
    }


    createCohortMutation.mutate(
      {
        courseId: Number(courseId),
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxCapacity: 30,
        isHighSchoolTenMonth: formData.isHighSchoolTenMonth,
      },
      {
        onSuccess: () => {
          setIsAdding(false);
          setFormData({
            name: "",
            startDate: "",
            endDate: "",
            isHighSchoolTenMonth: false,
          });
        },
      },
    );
  };

  const cohorts = (cohortsData as any)?.cohorts || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 border-none">
            Course Cohorts
          </h2>
          <p className="text-slate-500 text-sm">
            Create structured learning groups with specific start and end dates.
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#2b5f9e] hover:bg-[#234e83] text-white font-semibold gap-2 border-0"
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add Cohort
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-none shadow-xl bg-slate-50 ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center gap-2">
            <Users className="w-5 h-5 text-[#2b5f9e]" />
            <CardTitle className="text-lg font-bold">
              New Cohort Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form
              onSubmit={handleCreate}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-bold text-slate-700"
                >
                  Cohort Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Spring 2024 Bootcamp"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-white border-slate-200 focus:ring-[#2b5f9e] h-11"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="startDate"
                  className="text-sm font-bold text-slate-700"
                >
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="bg-white border-slate-200 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="endDate"
                  className="text-sm font-bold text-slate-700"
                >
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="bg-white border-slate-200 h-11"
                />
              </div>

              <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600">
                <span>
                  Cohort Capacity: <strong className="text-slate-900">Fixed at 30 Students Max</strong> (1:30 instructor ratio cap; supervising instructor auto-assigned).
                </span>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isHighSchoolTenMonth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isHighSchoolTenMonth: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300 text-[#2b5f9e] focus:ring-[#2b5f9e]"
                  />
                  <span>10-Month High School Calendar Program (90-day exception)</span>
                </label>
              </div>

              <div className="md:col-span-2 pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={createCohortMutation.isPending}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-8 rounded-lg transition-all shadow-md active:scale-95"
                >
                  {createCohortMutation.isPending
                    ? "Creating..."
                    : "Create Cohort"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#2b5f9e]" />
          Active & Upcoming Cohorts
        </h3>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : cohorts.length === 0 ? (
          <Card className="border-dashed border-2 bg-slate-50/50 flex flex-col items-center justify-center p-12">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <Users className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-500 font-medium">
              No cohorts created yet.
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Add a cohort above to organize your students into groups.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cohorts.map((cohort: any) => {
              let formattedStartDate = "Invalid date";
              let formattedEndDate = "Invalid date";
              let statusBadge = {
                label: "Enrollment Open",
                color: "bg-emerald-100 text-emerald-800 border-emerald-200",
              };
              const now = new Date();
              const start = cohort.startDate
                ? new Date(cohort.startDate)
                : null;
              const end = cohort.endDate ? new Date(cohort.endDate) : null;

              if (start && end) {
                if (now < start) {
                  statusBadge = {
                    label: "Enrollment Open",
                    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
                  };
                } else if (now >= start && now <= end) {
                  statusBadge = {
                    label: "Class In Session",
                    color: "bg-blue-100 text-blue-800 border-blue-200",
                  };
                } else {
                  statusBadge = {
                    label: "Past Cohort",
                    color: "bg-slate-100 text-slate-600 border-slate-200",
                  };
                }
              }

              try {
                if (cohort.startDate) {
                  formattedStartDate = format(
                    new Date(cohort.startDate),
                    "PPP",
                  );
                }
                if (cohort.endDate) {
                  formattedEndDate = format(new Date(cohort.endDate), "PPP");
                }
              } catch (e) {
                console.error("Date formatting error", e);
              }

              return (
                <Card
                  key={cohort.id}
                  className="border-none shadow-sm h-full group hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-[#e8f0fa] text-[#2b5f9e]">
                            COHORT #{cohort.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge.color}`}
                          >
                            {statusBadge.label}
                          </span>
                          {cohort.maxCapacity != null && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              Cap: {cohort.maxCapacity}
                            </span>
                          )}
                          {cohort.isHighSchoolTenMonth && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              10-Month HS
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 line-clamp-1 mt-1">
                          {cohort.name}
                        </h4>
                      </div>
                    </div>

                    <div className="mt-auto space-y-3">
                      <div className="flex flex-col gap-1 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-700 text-xs">
                            Starts: {formattedStartDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-700 text-xs">
                            Ends: {formattedEndDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
