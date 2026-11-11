import React, { useState } from "react";
import { BookOpen, Plus, Library, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useCourseTextbooks,
  useAddTextbookMutation,
  useLessonReadings,
  useAssignReadingMutation,
} from "@/features/rubric/hooks/useCurriculumCrosswalk";
import { toast } from "sonner";

interface LessonReadingsTabProps {
  courseId?: number | string;
  lessonId: number | string;
  lessonTitle?: string;
}

export const LessonReadingsTab: React.FC<LessonReadingsTabProps> = ({
  courseId,
  lessonId,
  lessonTitle,
}) => {
  const { data: textbooks = [], isLoading: isTextbooksLoading } =
    useCourseTextbooks(courseId);
  const { data: readings = [], isLoading: isReadingsLoading } =
    useLessonReadings(lessonId);

  const addTextbookMutation = useAddTextbookMutation();
  const assignReadingMutation = useAssignReadingMutation();

  const [showAddTextbook, setShowAddTextbook] = useState(false);
  const [tbForm, setTbForm] = useState({
    title: "",
    author: "",
    edition: "",
    isbn: "",
    publisher: "",
  });

  const [readingForm, setReadingForm] = useState({
    textbookId: "",
    chapters: "",
    pageRange: "",
  });

  const selectedTextbookId =
    readingForm.textbookId || (textbooks[0]?.id ? String(textbooks[0].id) : "");

  const handleRegisterTextbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    if (!tbForm.title.trim() || !tbForm.author.trim()) {
      toast.error("Textbook title and author are required.");
      return;
    }

    try {
      const created = await addTextbookMutation.mutateAsync({
        courseId: Number(courseId),
        title: tbForm.title.trim(),
        author: tbForm.author.trim(),
        ...(tbForm.edition.trim() ? { edition: tbForm.edition.trim() } : {}),
        ...(tbForm.isbn.trim() ? { isbn: tbForm.isbn.trim() } : {}),
        ...(tbForm.publisher.trim() ? { publisher: tbForm.publisher.trim() } : {}),
      });
      setTbForm({ title: "", author: "", edition: "", isbn: "", publisher: "" });
      setShowAddTextbook(false);
      if (created?.id) {
        setReadingForm((prev) => ({ ...prev, textbookId: String(created.id) }));
      }
    } catch {
      // handled by mutation onError toast
    }
  };

  const handleAssignReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTextbookId) {
      toast.error("Select or register a course textbook first.");
      return;
    }
    if (!readingForm.chapters.trim() || !readingForm.pageRange.trim()) {
      toast.error("Please enter assigned chapters and page range.");
      return;
    }

    try {
      await assignReadingMutation.mutateAsync({
        lessonId: Number(lessonId),
        textbookId: Number(selectedTextbookId),
        chapters: readingForm.chapters.trim(),
        pageRange: readingForm.pageRange.trim(),
        courseId: courseId ? Number(courseId) : undefined,
      });
      setReadingForm((prev) => ({ ...prev, chapters: "", pageRange: "" }));
    } catch {
      // handled by mutation onError toast
    }
  };

  return (
    <div className="space-y-6">
      {/* Assigned Lesson Readings */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#7c6ef0]" />
              Linked Textbook Readings
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Required reading crosswalk for{" "}
              <span className="font-medium text-slate-700">
                {lessonTitle || "this unit"}
              </span>{" "}
              (WAC 246-841A-440 syllabus correlation).
            </p>
          </div>
          <Badge variant="outline" className="text-[11px] font-semibold w-fit">
            {readings.length} Assigned
          </Badge>
        </div>

        {isReadingsLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1.5" />
            Loading lesson readings...
          </div>
        ) : readings.length > 0 ? (
          <div className="space-y-2.5">
            {readings.map((r: any, idx: number) => (
              <div
                key={r.id ?? idx}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">
                      {r.textbook?.title || `Textbook #${r.textbookId}`}
                    </span>
                    {r.textbook?.edition && (
                      <Badge className="bg-slate-200/70 text-slate-700 border-0 text-[10px]">
                        {r.textbook.edition}
                      </Badge>
                    )}
                  </div>
                  {r.textbook?.author && (
                    <p className="text-[11px] text-slate-500 pl-5">
                      Author: {r.textbook.author}
                      {r.textbook?.isbn ? ` · ISBN: ${r.textbook.isbn}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pl-5 sm:pl-0">
                  <Badge className="bg-[#7c6ef0]/10 text-[#7c6ef0] border border-[#7c6ef0]/20 text-[11px] font-semibold">
                    {r.chapters}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    {r.pageRange}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center text-xs text-slate-500">
            No textbook chapters assigned to this lesson yet.
          </div>
        )}

        {/* Assign Reading Form */}
        <form
          onSubmit={handleAssignReading}
          className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
        >
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px] font-semibold text-slate-600">
              Course Textbook
            </Label>
            <select
              value={selectedTextbookId}
              onChange={(e) =>
                setReadingForm((prev) => ({
                  ...prev,
                  textbookId: e.target.value,
                }))
              }
              disabled={isTextbooksLoading || textbooks.length === 0}
              className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#7c6ef0]/30"
            >
              {textbooks.length === 0 ? (
                <option value="">Register a textbook below first...</option>
              ) : (
                textbooks.map((tb) => (
                  <option key={tb.id} value={tb.id}>
                    {tb.title} ({tb.author})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-slate-600">
              Chapters
            </Label>
            <Input
              value={readingForm.chapters}
              onChange={(e) =>
                setReadingForm((prev) => ({ ...prev, chapters: e.target.value }))
              }
              placeholder="e.g. Ch. 4 - Infection Control"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-slate-600">
              Page Range
            </Label>
            <Input
              value={readingForm.pageRange}
              onChange={(e) =>
                setReadingForm((prev) => ({ ...prev, pageRange: e.target.value }))
              }
              placeholder="e.g. pp. 52-74"
              className="h-9 text-xs"
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={
                assignReadingMutation.isPending || textbooks.length === 0
              }
              className="h-9 px-4 bg-[#7c6ef0] hover:bg-[#6a5be2] text-white text-xs font-semibold rounded-lg"
            >
              {assignReadingMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5 mr-1.5" />
              )}
              Link Reading to Lesson
            </Button>
          </div>
        </form>
      </div>

      {/* Course Textbooks Catalog */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Library className="w-4 h-4 text-slate-600" />
              Registered Course Textbooks ({textbooks.length})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Textbooks available across all units in this course.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddTextbook((v) => !v)}
            className="h-8 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {showAddTextbook ? "Close Form" : "Register Textbook"}
          </Button>
        </div>

        {showAddTextbook && (
          <form
            onSubmit={handleRegisterTextbook}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">
                  Textbook Title *
                </Label>
                <Input
                  value={tbForm.title}
                  onChange={(e) =>
                    setTbForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g. Hartman's Nursing Assistant Care"
                  className="h-9 text-xs bg-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Author *</Label>
                <Input
                  value={tbForm.author}
                  onChange={(e) =>
                    setTbForm((p) => ({ ...p, author: e.target.value }))
                  }
                  placeholder="e.g. Jetta Fuzy, RN, MS"
                  className="h-9 text-xs bg-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Edition</Label>
                <Input
                  value={tbForm.edition}
                  onChange={(e) =>
                    setTbForm((p) => ({ ...p, edition: e.target.value }))
                  }
                  placeholder="e.g. 5th Edition"
                  className="h-9 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">ISBN</Label>
                <Input
                  value={tbForm.isbn}
                  onChange={(e) =>
                    setTbForm((p) => ({ ...p, isbn: e.target.value }))
                  }
                  placeholder="e.g. 978-1604251401"
                  className="h-9 text-xs bg-white"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-[11px] font-semibold">Publisher</Label>
                <Input
                  value={tbForm.publisher}
                  onChange={(e) =>
                    setTbForm((p) => ({ ...p, publisher: e.target.value }))
                  }
                  placeholder="e.g. Hartman Publishing"
                  className="h-9 text-xs bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={addTextbookMutation.isPending}
                className="h-8 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                {addTextbookMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : null}
                Save Course Textbook
              </Button>
            </div>
          </form>
        )}

        {textbooks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {textbooks.map((tb) => (
              <div
                key={tb.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs space-y-0.5"
              >
                <div className="font-bold text-slate-800">{tb.title}</div>
                <div className="text-slate-500">
                  {tb.author}
                  {tb.edition ? ` · ${tb.edition}` : ""}
                  {tb.publisher ? ` · ${tb.publisher}` : ""}
                </div>
                {tb.isbn && (
                  <div className="text-[10px] font-mono text-slate-400">
                    ISBN: {tb.isbn}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

