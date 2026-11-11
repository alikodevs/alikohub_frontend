import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateCohort, useInstructorCourses } from "@/hooks/useAcademy";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, BookOpen } from "lucide-react";

export const CreateCohortModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    courseId: "",
    startDate: "",
    endDate: "",
    isHighSchoolTenMonth: false,
  });

  const { data: coursesData, isLoading: coursesLoading } = useInstructorCourses(
    { page: 1, pageSize: 100 },
  );
  const createCohortMutation = useCreateCohort();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.courseId ||
      !formData.startDate ||
      !formData.endDate
    ) {
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
        "Standard cohorts must complete within 90 days (3 months) unless flagged as a 10-month high school calendar."
      );
      return;
    }


    createCohortMutation.mutate(
      {
        courseId: Number(formData.courseId),
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxCapacity: 30,
        isHighSchoolTenMonth: formData.isHighSchoolTenMonth,
      },
      {
        onSuccess: () => {
          setFormData({
            name: "",
            courseId: "",
            startDate: "",
            endDate: "",
            isHighSchoolTenMonth: false,
          });
          onClose();
        },
      },
    );
  };

  const courses = coursesData?.courses || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold font-heading">
            <Users className="w-5 h-5 text-accent" />
            Create New Cohort
          </DialogTitle>
          <DialogDescription>
            Create a structured learning group for an existing course.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label
              htmlFor="course"
              className="text-sm font-bold text-slate-700 font-heading"
            >
              Select Course
            </Label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                id="course"
                value={formData.courseId}
                onChange={(e) =>
                  setFormData({ ...formData, courseId: e.target.value })
                }
                className="w-full pl-10 h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={coursesLoading}
              >
                <option value="" disabled>
                  Select a course
                </option>
                {courses.map((course: any) => (
                  // Only allow creating cohorts for non-rejected/non-pending courses, or maybe all of them
                  <option key={course.id} value={course.id}>
                    {course.title} {course.status === "DRAFT" ? "(Draft)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="cohortName"
              className="text-sm font-bold text-slate-700 font-heading"
            >
              Cohort Name
            </Label>
            <Input
              id="cohortName"
              placeholder="e.g., Spring 2024 Bootcamp"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-white border-slate-200 focus:ring-accent h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="startDate"
                className="text-sm font-bold text-slate-700 font-heading"
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
                className="bg-white border-slate-200 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="endDate"
                className="text-sm font-bold text-slate-700 font-heading"
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
                className="bg-white border-slate-200 h-10"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            Cohort Capacity: <strong className="text-slate-900">Fixed at 30 Students Max</strong> (WAC 246-841A-440 1:30 ratio cap; supervising instructor auto-assigned).
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isHighSchoolTenMonth}
              onChange={(e) =>
                setFormData({ ...formData, isHighSchoolTenMonth: e.target.checked })
              }
              className="rounded border-slate-300 text-accent focus:ring-accent"
            />
            <span>10-Month High School Calendar Program (Exempt from 90-day limit)</span>
          </label>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCohortMutation.isPending || !formData.courseId}
              className="bg-accent hover:bg-amber-light text-slate-900 font-bold"
            >
              {createCohortMutation.isPending ? "Creating..." : "Create Cohort"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
