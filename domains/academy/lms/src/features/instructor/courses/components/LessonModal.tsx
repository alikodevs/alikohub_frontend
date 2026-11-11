import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  title: string;
  lessonType: string;
  onTitleChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  isCreating: boolean;
}

export const LessonModal = ({
  isOpen,
  onClose,
  onCreate,
  title,
  lessonType,
  onTitleChange,
  onTypeChange,
  isCreating,
}: LessonModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Lesson</DialogTitle>
          <DialogDescription>
            Add a new lesson with video or text content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Lesson Title *
            </label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g., Intro to DSA"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Lesson Type
            </label>
            <select
              value={lessonType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#2b5f9e] outline-none appearance-none cursor-pointer"
            >
              <option value="VIDEO">Video Lesson</option>
              <option value="WEBINAR">Live Webinar</option>
              <option value="QUIZ">Quiz</option>
              <option value="ASSIGNMENT">Assignment</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            disabled={isCreating}
            className="bg-[#2b5f9e] hover:bg-[#234e83] text-white border-0"
          >
            {isCreating ? "Creating..." : "Create Lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
