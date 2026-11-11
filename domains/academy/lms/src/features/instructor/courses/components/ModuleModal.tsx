import React from "react";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  isCreating: boolean;
}

export const ModuleModal = ({
  isOpen,
  onClose,
  onCreate,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  isCreating,
}: ModuleModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Module</DialogTitle>
          <DialogDescription>
            Add a new section to organize your course lessons.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Module Title *
            </label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g., Section 1: Introduction"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Brief description of this module..."
              className="resize-none min-h-[100px]"
            />
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
            {isCreating ? "Creating..." : "Create Module"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
