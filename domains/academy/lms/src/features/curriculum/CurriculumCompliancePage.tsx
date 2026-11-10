import React, { useState, useMemo, useEffect } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  FileSpreadsheet,
  BookOpen,
  Layers,
  Plus,
  Search,
  BookMarked,
  Timer,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useCourseCrosswalk,
  useCourseTextbooks,
  useAddTextbookMutation,
} from "@/features/rubric/hooks/useCurriculumCrosswalk";
import { useInstructorCohortsList } from "@/features/rubric/hooks/useSeatTime";
import { usePortalMode } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";

export const CurriculumCompliancePage: React.FC = () => {
  const { isInstructorView, canManageStaffActions } = usePortalMode();
  const isInstructorOrAuditor = isInstructorView;

  // Cohorts query
  const { data: cohortsData, isLoading: isCohortsLoading } = useInstructorCohortsList(isInstructorView);
  const cohorts = cohortsData || [];
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const activeCohort = cohorts.find(
    (c: any) => String(c.id) === selectedCohortId
  ) || cohorts[0];

  const courseId = activeCohort?.courseId;

  // Crosswalk data query
  const {
    data: crosswalkData,
    isLoading: isCrosswalkLoading,
  } = useCourseCrosswalk(courseId);

  // Textbooks query
  const { data: textbooksData } = useCourseTextbooks(courseId);
  const textbooks = textbooksData || crosswalkData?.textbooks || [];

  // Filter and search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<string>("ALL");

  // Add Textbook Dialog state
  const [isAddTextbookOpen, setIsAddTextbookOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookEdition, setBookEdition] = useState("");
  const [bookIsbn, setBookIsbn] = useState("");
  const [bookPublisher, setBookPublisher] = useState("");

  const addTextbookMutation = useAddTextbookMutation();

  const handleAddTextbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) {
      toast.error("Please provide title and author.");
      return;
    }

    try {
      await addTextbookMutation.mutateAsync({
        courseId: Number(courseId),
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        edition: bookEdition.trim() || undefined,
        isbn: bookIsbn.trim() || undefined,
        publisher: bookPublisher.trim() || undefined,
      });
      setIsAddTextbookOpen(false);
      setBookTitle("");
      setBookAuthor("");
      setBookEdition("");
      setBookIsbn("");
      setBookPublisher("");
    } catch {
      // Handled by mutation toast
    }
  };

  // ── Cohort Schedule Window Calculations (only from real cohort dates) ──
  const cohortDates = useMemo(() => {
    if (!activeCohort?.startDate || !activeCohort?.endDate) return null;
    const start = new Date(activeCohort.startDate);
    const end = new Date(activeCohort.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const now = new Date();

    const totalDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const elapsedDays = Math.max(
      0,
      Math.min(
        totalDays,
        Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      )
    );
    const daysRemaining = Math.max(0, totalDays - elapsedDays);

    return {
      startDate: start.toLocaleDateString(),
      endDate: end.toLocaleDateString(),
      totalDays,
      elapsedDays,
      daysRemaining,
    };
  }, [activeCohort]);

  // Modules & API metrics
  const modules = crosswalkData?.curriculumMatrix || [];
  const totalUnitsCount = useMemo(
    () => modules.reduce((sum, m) => sum + (m.units?.length || 0), 0),
    [modules]
  );
  const linkedReadingsCount = useMemo(
    () =>
      modules.reduce(
        (sum, m) =>
          sum +
          (m.units?.filter(
            (u) => u.assignedTextbookReadings && u.assignedTextbookReadings.length > 0
          ).length || 0),
        0
      ),
    [modules]
  );

  const availableTracks = useMemo(
    () => Array.from(new Set(modules.map((m) => m.track).filter(Boolean))),
    [modules]
  );

  useEffect(() => {
    if (selectedTrack !== "ALL" && !availableTracks.includes(selectedTrack)) {
      setSelectedTrack("ALL");
    }
  }, [availableTracks, selectedTrack]);

  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      const matchTrack =
        selectedTrack === "ALL" || mod.track === selectedTrack;
      const matchSearch =
        mod.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.units.some((u) =>
          u.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchTrack && matchSearch;
    });
  }, [modules, selectedTrack, searchQuery]);

  const content = (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Curriculum Alignment & Program Crosswalk
              </h1>
              <p className="text-xs text-slate-500">
                {crosswalkData?.courseTitle || activeCohort?.name || "Course modules, textbook readings, and unit assessments."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {cohorts.length > 1 && (
            <Select value={String(activeCohort?.id || "")} onValueChange={setSelectedCohortId}>
              <SelectTrigger className="w-56 bg-white border-slate-200 text-xs font-semibold h-10">
                <SelectValue placeholder="Select Cohort" />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name || `Cohort #${c.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {canManageStaffActions && (
            <Button
              onClick={() => setIsAddTextbookOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Register Course Textbook
            </Button>
          )}
        </div>
      </div>

      {/* Live API Curriculum Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Curriculum Modules
            </span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-slate-900">{modules.length}</div>
          <p className="text-[11px] text-slate-500">Active course modules loaded from syllabus</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Units & Readings
            </span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalUnitsCount}</div>
          <p className="text-[11px] text-slate-500">
            {linkedReadingsCount} unit(s) with linked textbook readings
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Course Textbooks
            </span>
            <BookMarked className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{textbooks.length}</div>
          <p className="text-[11px] text-slate-500">Registered textbook references</p>
        </div>
      </div>

      {/* Real Cohort Schedule Window (only shown when cohort start/end dates exist) */}
      {cohortDates && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cohort Schedule Window
              </h3>
              <p className="text-xs text-slate-500">
                {activeCohort?.name || `Cohort #${activeCohort?.id}`}
              </p>
            </div>
            <Timer className="w-5 h-5 text-amber-600" />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Cohort Dates
              </span>
              <span className="font-bold text-slate-900">
                {cohortDates.startDate} — {cohortDates.endDate}
              </span>
            </div>
            <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 text-[10px] font-bold px-2 py-0.5">
              {cohortDates.totalDays} Days Total
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Elapsed Calendar Pacing</span>
              <span className="font-bold text-slate-900">
                {cohortDates.elapsedDays} / {cohortDates.totalDays} Days ({cohortDates.daysRemaining} days remaining)
              </span>
            </div>
            <Progress
              value={Math.min(100, (cohortDates.elapsedDays / cohortDates.totalDays) * 100)}
              className="h-2 bg-slate-100"
            />
          </div>
        </div>
      )}

      {/* Registered Course Textbooks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-primary" />
            Course Textbooks & Reading References
          </h2>
          <span className="text-xs text-slate-500">
            {textbooks.length} Books Registered
          </span>
        </div>

        {textbooks.length === 0 ? (
          <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
            No textbooks registered yet for this course.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {textbooks.map((book: any) => (
              <div
                key={book.id}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase">
                    {book.edition || "Primary Textbook"}
                  </span>
                  {book.isbn && (
                    <span className="text-[10px] font-mono text-slate-400">
                      ISBN: {book.isbn}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {book.title}
                </h3>
                <p className="text-xs text-slate-500">Author: {book.author}</p>
                {book.publisher && (
                  <p className="text-[11px] text-slate-400">Publisher: {book.publisher}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Curriculum Crosswalk Syllabus Matrix */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Interactive Curriculum Crosswalk (Units & Learning Objectives)
            </h2>
            <p className="text-xs text-slate-500">
              Correlating Modules, Textbook Readings, Skills Lab Alignment, and First-Week Attendance Gates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedTrack} onValueChange={setSelectedTrack}>
              <SelectTrigger className="w-44 bg-white border-slate-200 text-xs font-semibold h-9">
                <SelectValue placeholder="All Tracks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tracks</SelectItem>
                {availableTracks.map((track) => (
                  <SelectItem key={track} value={track}>
                    {track.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search units or lessons..."
                className="pl-9 h-9 text-xs bg-white border-slate-200"
              />
            </div>
          </div>
        </div>

        {isCohortsLoading || isCrosswalkLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading curriculum crosswalk...</p>
          </div>
        ) : !courseId ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
            No active cohort or course found.
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
            No modules found matching current filter.
          </div>
        ) : (
          <div className="space-y-5">
            {filteredModules.map((mod) => (
              <div
                key={mod.moduleId}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
              >
                {/* Module Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-slate-900">
                      Module {mod.moduleId}: {mod.moduleTitle}
                    </span>
                    {mod.track && (
                      <Badge variant="outline" className="text-[10px] font-bold uppercase bg-white border-slate-200 text-slate-600">
                        {mod.track.replace(/_/g, " ")}
                      </Badge>
                    )}
                    {mod.isOrientationModule && (
                      <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-bold">
                        Orientation Module (Non-Credit)
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {mod.units?.length || 0} Units / Lessons
                  </span>
                </div>

                {/* Units List */}
                <div className="divide-y divide-slate-100">
                  {mod.units?.map((unit) => (
                    <div
                      key={unit.lessonId}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Unit {unit.lessonId}: {unit.lessonTitle}
                          </span>
                          {unit.isWeekOneAttendanceGate && (
                            <Badge className="bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-bold">
                              Week-1 Attendance Gate
                            </Badge>
                          )}
                          {unit.isCreditHour && (
                            <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50 font-bold">
                              Credit Hour
                            </Badge>
                          )}
                        </div>

                        {/* Assigned Readings */}
                        {unit.assignedTextbookReadings && unit.assignedTextbookReadings.length > 0 ? (
                          <div className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap pt-0.5">
                            <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-medium text-slate-700">Reading:</span>
                            {unit.assignedTextbookReadings.map((r, i) => (
                              <span key={i} className="text-slate-500 text-[11px]">
                                {r.textbookTitle} ({r.assignedChapters}, pp. {r.pageRange})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            No textbook reading linked
                          </span>
                        )}
                      </div>

                      {/* Assessments & Type */}
                      <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                          {unit.lessonType}
                        </Badge>
                        {unit.assessments && unit.assessments.length > 0 && (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            {unit.assessments.length} Assessment(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register Textbook Dialog */}
      <Dialog open={isAddTextbookOpen} onOpenChange={setIsAddTextbookOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-primary" />
            Register Accredited Course Textbook
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Link an approved textbook to this course for syllabus crosswalk and lesson reading assignments.
          </DialogDescription>

          <form onSubmit={handleAddTextbook} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Textbook Title
              </label>
              <Input
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="e.g., Mosby's Textbook for Nursing Assistants"
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Author(s)
              </label>
              <Input
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="e.g., Sheila A. Sorrentino, Leighann Remmert"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Edition
                </label>
                <Input
                  value={bookEdition}
                  onChange={(e) => setBookEdition(e.target.value)}
                  placeholder="e.g., 10th Edition"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ISBN
                </label>
                <Input
                  value={bookIsbn}
                  onChange={(e) => setBookIsbn(e.target.value)}
                  placeholder="e.g., 978-0323655606"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Publisher
              </label>
              <Input
                value={bookPublisher}
                onChange={(e) => setBookPublisher(e.target.value)}
                placeholder="e.g., Elsevier"
                className="h-9 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddTextbookOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={addTextbookMutation.isPending}
                className="h-9 text-xs font-bold bg-primary text-white"
              >
                {addTextbookMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-1.5" />
                )}
                Register Textbook
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isInstructorOrAuditor) {
    return <InstructorLayout>{content}</InstructorLayout>;
  }
  return <StudentLayout>{content}</StudentLayout>;
};

export default CurriculumCompliancePage;

