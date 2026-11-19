import React, { useState, useMemo, useEffect } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  Layers,
  Plus,
  Search,
  BookMarked,
  Loader2,
  Download,
  ShieldCheck,
  Target,
  ExternalLink,
  BookOpen,
  Link2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  useAssignReadingMutation,
} from "@/features/rubric/hooks/useCurriculumCrosswalk";
import { useInstructorCohortsList } from "@/features/rubric/hooks/useSeatTime";
import { usePortalMode } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import type { CurriculumCrosswalkUnit, CourseTextbook } from "@/features/rubric/types";

// Design System V2 Palette constants for Module Edge Colors and Book Covers
const MODULE_EDGE_COLORS = [
  "bg-[#F43F5E]", // Module 1 - Coral / Red
  "bg-[#0284C7]", // Module 2 - Sky Blue
  "bg-[#8B5CF6]", // Module 3 - Violet
  "bg-[#10B981]", // Module 4 - Emerald
  "bg-[#F59E0B]", // Module 5 - Amber
  "bg-[#06B6D4]", // Module 6 - Cyan
  "bg-[#EC4899]", // Module 7 - Pink
];

const BOOK_COVER_COLORS = [
  "bg-[#F43F5E]", // Book 1 - Coral / Red
  "bg-[#0284C7]", // Book 2 - Sky Blue
  "bg-[#8B5CF6]", // Book 3 - Violet
  "bg-[#10B981]", // Book 4 - Emerald
  "bg-[#F59E0B]", // Book 5 - Amber
];

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
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("ALL");
  const [selectedTrack, setSelectedTrack] = useState<string>("ALL");

  // Add Textbook Dialog state
  const [isAddTextbookOpen, setIsAddTextbookOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookEdition, setBookEdition] = useState("");
  const [bookIsbn, setBookIsbn] = useState("");
  const [bookPublisher, setBookPublisher] = useState("");

  const addTextbookMutation = useAddTextbookMutation();

  // Link Reading Dialog state (for instructors)
  const [isLinkReadingOpen, setIsLinkReadingOpen] = useState(false);
  const [selectedUnitForReading, setSelectedUnitForReading] = useState<CurriculumCrosswalkUnit | null>(null);
  const [selectedTextbookId, setSelectedTextbookId] = useState<string>("");
  const [readingChapters, setReadingChapters] = useState("");
  const [readingPageRange, setReadingPageRange] = useState("");

  const assignReadingMutation = useAssignReadingMutation();

  // Textbook Details Modal state (when user clicks "Open")
  const [activePreviewTextbook, setActivePreviewTextbook] = useState<CourseTextbook | null>(null);

  const handleOpenLinkReading = (unit: CurriculumCrosswalkUnit) => {
    setSelectedUnitForReading(unit);
    setSelectedTextbookId(textbooks[0]?.id ? String(textbooks[0].id) : "");
    setReadingChapters("");
    setReadingPageRange("");
    setIsLinkReadingOpen(true);
  };

  const handleAssignReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitForReading || !selectedTextbookId || !readingChapters.trim() || !readingPageRange.trim()) {
      toast.error("Please fill in all required reading fields.");
      return;
    }

    try {
      await assignReadingMutation.mutateAsync({
        lessonId: Number(selectedUnitForReading.lessonId),
        textbookId: Number(selectedTextbookId),
        chapters: readingChapters.trim(),
        pageRange: readingPageRange.trim(),
        courseId: Number(courseId),
      });
      setIsLinkReadingOpen(false);
      setSelectedUnitForReading(null);
      setReadingChapters("");
      setReadingPageRange("");
    } catch {
      // Handled by mutation toast
    }
  };

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

  // Flatten and filter rows for the crosswalk table
  const crosswalkRows = useMemo(() => {
    const rows: Array<{
      modIndex: number;
      moduleId: number;
      moduleTitle: string;
      track: string;
      unit: CurriculumCrosswalkUnit;
    }> = [];

    modules.forEach((mod, modIdx) => {
      if (selectedModuleFilter !== "ALL" && String(mod.moduleId) !== selectedModuleFilter) {
        return;
      }
      if (selectedTrack !== "ALL" && mod.track !== selectedTrack) {
        return;
      }

      (mod.units || []).forEach((u) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            u.lessonTitle.toLowerCase().includes(q) ||
            mod.moduleTitle.toLowerCase().includes(q) ||
            u.lessonType.toLowerCase().includes(q) ||
            (u.assignedTextbookReadings || []).some(
              (r) =>
                r.textbookTitle.toLowerCase().includes(q) ||
                r.assignedChapters.toLowerCase().includes(q)
            ) ||
            (u.assessments || []).some((a) => a.title.toLowerCase().includes(q));

          if (!matches) return;
        }

        rows.push({
          modIndex: modIdx,
          moduleId: mod.moduleId,
          moduleTitle: mod.moduleTitle,
          track: mod.track,
          unit: u,
        });
      });
    });

    return rows;
  }, [modules, selectedModuleFilter, selectedTrack, searchQuery]);

  // Assessment color utility matching V1/V2 design pills
  const getAssessmentPill = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("quiz")) {
      return "bg-[#F3E8FF] text-[#7E22CE]";
    }
    if (t.includes("skill")) {
      return "bg-[#DCFCE7] text-[#15803D]";
    }
    if (t.includes("clinical")) {
      return "bg-[#FFEDD5] text-[#C2410C]";
    }
    if (t.includes("exam") || t.includes("final") || t.includes("test")) {
      return "bg-[#DBEAFE] text-[#1D4ED8]";
    }
    return "bg-slate-100 text-slate-700";
  };

  // CSV Export functionality
  const handleExportCsv = () => {
    if (!modules.length) {
      toast.error("No curriculum crosswalk data to export.");
      return;
    }

    const headers = [
      "Module ID",
      "Module Title",
      "Track",
      "Lesson ID",
      "Lesson Title",
      "Type",
      "Attendance Gate",
      "Credit Hour",
      "Assigned Textbook",
      "Chapters",
      "Page Range",
      "State Standard",
      "Assessments",
    ];

    const rows: string[][] = [headers];

    modules.forEach((mod) => {
      (mod.units || []).forEach((u) => {
        const readings = u.assignedTextbookReadings || [];
        const textbookTitles = readings.map((r) => r.textbookTitle).join("; ") || "None";
        const chapters = readings.map((r) => r.assignedChapters).join("; ") || "None";
        const pages = readings.map((r) => r.pageRange).join("; ") || "None";
        const assessments =
          (u.assessments || []).map((a) => `${a.title} (${a.points} pts)`).join("; ") || "None";

        rows.push([
          String(mod.moduleId),
          mod.moduleTitle,
          mod.track || "N/A",
          String(u.lessonId),
          u.lessonTitle,
          u.lessonType,
          u.isWeekOneAttendanceGate ? "Yes" : "No",
          u.isCreditHour ? "Yes" : "No",
          textbookTitles,
          chapters,
          pages,
          crosswalkData?.accreditationStandard || "WAC 246-841A-440",
          assessments,
        ]);
      });
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `Curriculum_Crosswalk_${
      crosswalkData?.courseTitle
        ? crosswalkData.courseTitle.replace(/[^a-zA-Z0-9]/g, "_")
        : "Course"
    }.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Crosswalk exported to CSV");
  };

  const hasActiveFilters = searchQuery !== "" || selectedModuleFilter !== "ALL" || selectedTrack !== "ALL";

  const content = (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Bar matching Page 24/25 of V2 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] text-[#6366F1] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-semibold tracking-tight text-slate-900">
                  Curriculum Alignment &amp; Crosswalk
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  How each lesson maps to textbook readings, objectives and Washington state standards
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {cohorts.length > 0 && (
              <Select value={String(activeCohort?.id || "")} onValueChange={setSelectedCohortId}>
                <SelectTrigger className="w-48 sm:w-56 truncate bg-white border-slate-200 text-xs font-medium h-9 rounded-xl shadow-xs">
                  <SelectValue placeholder="Select Course / Cohort" />
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

            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={modules.length === 0}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs h-9 rounded-xl shadow-xs"
            >
              <Download className="w-4 h-4 mr-1.5 text-slate-500" />
              Export crosswalk
            </Button>

            {canManageStaffActions && (
              <Button
                onClick={() => setIsAddTextbookOpen(true)}
                className="bg-primary hover:bg-[#084B78] text-white font-medium text-xs h-9 rounded-xl shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Register Textbook
              </Button>
            )}
          </div>
        </div>

        {/* 4 Calm KPI Stat Tiles matching V2 Page 25 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Modules */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div>
              <div className="text-2xl font-heading font-semibold text-slate-900 leading-none">
                {modules.length}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Modules</div>
            </div>
          </div>

          {/* Tile 2: Learning objectives */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-[#0284C7]" />
            </div>
            <div>
              <div className="text-2xl font-heading font-semibold text-slate-900 leading-none">
                {totalUnitsCount}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Learning objectives</div>
            </div>
          </div>

          {/* Tile 3: WAC 246-841 aligned */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#059669]" />
            </div>
            <div>
              <div className="text-2xl font-heading font-semibold text-slate-900 leading-none">
                100%
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                {crosswalkData?.accreditationStandard ? `${crosswalkData.accreditationStandard} aligned` : "WAC 246-841 aligned"}
              </div>
            </div>
          </div>

          {/* Tile 4: Required textbooks */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <BookMarked className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <div className="text-2xl font-heading font-semibold text-slate-900 leading-none">
                {textbooks.length}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Required textbooks</div>
            </div>
          </div>
        </div>

        {/* Textbook Cards with small covers matching V2 Page 25 */}
        {textbooks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {textbooks.map((book: any, idx: number) => {
              const coverBg = BOOK_COVER_COLORS[idx % BOOK_COVER_COLORS.length];
              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-14 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs ${coverBg}`}
                    >
                      <BookOpen className="w-5 h-5 opacity-90" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-heading font-semibold text-slate-900 truncate leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {book.edition ? `${book.edition} · ` : ""}
                        {book.author ? `Author: ${book.author}` : "Selected chapters"}
                      </p>
                      <span className="inline-block bg-rose-50 text-rose-600 border border-rose-200/80 text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1">
                        Required
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivePreviewTextbook(book)}
                    className="border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-xl h-8 px-3 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    Open
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Search, Filter & Crosswalk Matrix */}
        <div className="space-y-4">
          {/* Search bar and Dropdowns matching Page 25 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search objectives, lessons or chapters…"
                className="pl-9 h-10 text-xs bg-white border-slate-200/90 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <Select value={selectedModuleFilter} onValueChange={setSelectedModuleFilter}>
                <SelectTrigger className="w-36 sm:w-40 bg-white border-slate-200 text-xs font-medium h-10 rounded-xl">
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All modules</SelectItem>
                  {modules.map((m) => (
                    <SelectItem key={m.moduleId} value={String(m.moduleId)}>
                      Module {m.moduleId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {availableTracks.length > 0 && (
                <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                  <SelectTrigger className="w-32 sm:w-36 bg-white border-slate-200 text-xs font-medium h-10 rounded-xl">
                    <SelectValue placeholder="All tracks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All tracks</SelectItem>
                    {availableTracks.map((track) => (
                      <SelectItem key={track} value={track}>
                        {track.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedModuleFilter("ALL");
                    setSelectedTrack("ALL");
                  }}
                  className="h-10 px-2.5 text-xs text-slate-500 hover:text-slate-900 rounded-xl"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>

          {/* Table Container */}
          {isCohortsLoading || isCrosswalkLoading ? (
            <div className="p-16 text-center text-slate-400 bg-white border border-slate-200/80 rounded-2xl">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6366F1]" />
              <p className="text-xs font-medium">Loading curriculum crosswalk…</p>
            </div>
          ) : !courseId ? (
            <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-500 font-medium">
              No active cohort or course found.
            </div>
          ) : crosswalkRows.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl space-y-2">
              <p className="text-xs text-slate-600 font-medium">
                No lessons or modules match your current search and filters.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedModuleFilter("ALL");
                    setSelectedTrack("ALL");
                  }}
                  className="text-xs font-medium h-8 rounded-xl"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-white text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-3 px-5 w-[28%] font-semibold">MODULE · LESSON</th>
                      <th className="py-3 px-5 w-[42%] font-semibold">LEARNING OBJECTIVE</th>
                      <th className="py-3 px-5 w-[14%] font-semibold">READING</th>
                      <th className="py-3 px-5 w-[16%] font-semibold">ASSESSMENT</th>
                      {canManageStaffActions && (
                        <th className="py-3 px-4 w-[6%] text-right font-semibold">ACTION</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {crosswalkRows.map(({ modIndex, moduleId, moduleTitle, unit }) => {
                      const modColor = MODULE_EDGE_COLORS[modIndex % MODULE_EDGE_COLORS.length];
                      const firstReading = unit.assignedTextbookReadings?.[0];
                      const readingText = firstReading
                        ? firstReading.assignedChapters?.toLowerCase().startsWith("ch")
                          ? firstReading.assignedChapters
                          : `Ch. ${firstReading.assignedChapters}`
                        : "—";

                      const primaryAssessment = unit.assessments?.[0];
                      const assessmentLabel = primaryAssessment
                        ? primaryAssessment.type || primaryAssessment.title
                        : unit.lessonType;

                      return (
                        <tr
                          key={`${moduleId}-${unit.lessonId}`}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* MODULE · LESSON with module color edge accent */}
                          <td className="py-3.5 px-5 align-top">
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`w-1 h-8 rounded-full shrink-0 mt-0.5 ${modColor}`}
                              />
                              <div>
                                <div className="text-xs font-semibold text-slate-900 leading-snug">
                                  L{unit.lessonId} · {unit.lessonTitle}
                                </div>
                                <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                                  {moduleTitle}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* LEARNING OBJECTIVE */}
                          <td className="py-3.5 px-5 align-top">
                            <div className="text-xs text-slate-600 font-normal leading-relaxed">
                              {unit.lessonTitle}
                            </div>
                            {unit.isWeekOneAttendanceGate && (
                              <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-medium px-1.5 py-0 mt-1">
                                Week-1 Attendance Gate
                              </Badge>
                            )}
                          </td>

                          {/* READING */}
                          <td className="py-3.5 px-5 align-top">
                            <span className="text-xs text-slate-500 font-medium">
                              {readingText}
                            </span>
                          </td>

                          {/* ASSESSMENT pill badge */}
                          <td className="py-3.5 px-5 align-top">
                            {assessmentLabel ? (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${getAssessmentPill(
                                  assessmentLabel
                                )}`}
                              >
                                {assessmentLabel}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          {/* STAFF ACTIONS (Instructor Link Reading) */}
                          {canManageStaffActions && (
                            <td className="py-3.5 px-4 align-top text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenLinkReading(unit)}
                                className="h-7 px-2 text-[11px] text-[#6366F1] hover:text-[#4F46E5] hover:bg-indigo-50 font-medium rounded-lg"
                              >
                                <Link2 className="w-3 h-3 mr-1" />
                                Link
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Textbook Details / Preview Modal */}
        <Dialog
          open={Boolean(activePreviewTextbook)}
          onOpenChange={(open) => !open && setActivePreviewTextbook(null)}
        >
          <DialogContent className="max-w-md">
            <DialogTitle className="text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Course Textbook Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Registered syllabus reference and required reading material.
            </DialogDescription>

            {activePreviewTextbook && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] font-semibold">
                      Required Textbook
                    </Badge>
                    {activePreviewTextbook.isbn && (
                      <span className="text-[11px] font-mono text-slate-400">
                        ISBN: {activePreviewTextbook.isbn}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-heading font-semibold text-slate-900">
                    {activePreviewTextbook.title}
                  </h4>
                  <p className="text-xs text-slate-600">
                    Author: <span className="font-medium text-slate-900">{activePreviewTextbook.author}</span>
                  </p>
                  {activePreviewTextbook.edition && (
                    <p className="text-xs text-slate-600">
                      Edition: <span className="font-medium text-slate-900">{activePreviewTextbook.edition}</span>
                    </p>
                  )}
                  {activePreviewTextbook.publisher && (
                    <p className="text-xs text-slate-600">
                      Publisher: <span className="font-medium text-slate-900">{activePreviewTextbook.publisher}</span>
                    </p>
                  )}
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Approved curriculum reading for Washington State NA-C Certification</span>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivePreviewTextbook(null)}
                    className="h-8 text-xs font-medium rounded-xl"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Link Reading Dialog (Instructors) */}
        <Dialog open={isLinkReadingOpen} onOpenChange={setIsLinkReadingOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle className="text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Link Textbook Reading to Unit
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Assign textbook chapters and page ranges for{" "}
              <span className="font-semibold text-slate-800">
                L{selectedUnitForReading?.lessonId}: {selectedUnitForReading?.lessonTitle}
              </span>
            </DialogDescription>

            <form onSubmit={handleAssignReading} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Select Textbook
                </label>
                <Select value={selectedTextbookId} onValueChange={setSelectedTextbookId}>
                  <SelectTrigger className="w-full text-xs font-medium h-9 rounded-xl">
                    <SelectValue placeholder="Choose registered textbook" />
                  </SelectTrigger>
                  <SelectContent>
                    {textbooks.map((b: any) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.title} ({b.edition || "Main Edition"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Assigned Chapter(s)
                </label>
                <Input
                  value={readingChapters}
                  onChange={(e) => setReadingChapters(e.target.value)}
                  placeholder="e.g. Chapter 3: Role and Responsibilities"
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Page Range
                </label>
                <Input
                  value={readingPageRange}
                  onChange={(e) => setReadingPageRange(e.target.value)}
                  placeholder="e.g. 24-38"
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLinkReadingOpen(false)}
                  className="h-9 text-xs font-medium rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={assignReadingMutation.isPending}
                  className="h-9 text-xs font-semibold bg-primary text-white hover:bg-[#084B78] rounded-xl"
                >
                  {assignReadingMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4 mr-1.5" />
                  )}
                  Save Reading Link
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Register Textbook Dialog (Instructors) */}
        <Dialog open={isAddTextbookOpen} onOpenChange={setIsAddTextbookOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle className="text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-primary" />
              Register Course Textbook
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Link an approved textbook to this course for syllabus crosswalk and reading assignments.
            </DialogDescription>

            <form onSubmit={handleAddTextbook} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Textbook Title
                </label>
                <Input
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="e.g., Mosby's Textbook for Nursing Assistants"
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Author(s)
                </label>
                <Input
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="e.g., Sheila A. Sorrentino, Leighann Remmert"
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Edition
                  </label>
                  <Input
                    value={bookEdition}
                    onChange={(e) => setBookEdition(e.target.value)}
                    placeholder="e.g., 10th Edition"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    ISBN
                  </label>
                  <Input
                    value={bookIsbn}
                    onChange={(e) => setBookIsbn(e.target.value)}
                    placeholder="e.g., 978-0323655606"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Publisher
                </label>
                <Input
                  value={bookPublisher}
                  onChange={(e) => setBookPublisher(e.target.value)}
                  placeholder="e.g., Elsevier"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddTextbookOpen(false)}
                  className="h-9 text-xs font-medium rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addTextbookMutation.isPending}
                  className="h-9 text-xs font-semibold bg-primary text-white hover:bg-[#084B78] rounded-xl"
                >
                  {addTextbookMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-1.5" />
                  )}
                  Save Textbook
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  if (isInstructorOrAuditor) {
    return <InstructorLayout>{content}</InstructorLayout>;
  }
  return <StudentLayout>{content}</StudentLayout>;
};

export default CurriculumCompliancePage;
