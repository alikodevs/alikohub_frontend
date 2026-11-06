import React, { useState, useMemo } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  FileSpreadsheet,
  BookOpen,
  Clock,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  BookMarked,
  Brain,
  HeartHandshake,
  Users,
  Timer,
  Info,
  Loader2,
  ExternalLink,
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
import { useUser } from "@/features/auth/hooks/useAuth";
import type { CurriculumCrosswalk } from "@/features/rubric/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const CurriculumCompliancePage: React.FC = () => {
  const { data: user } = useUser();
  const role = (
    user?.academyUser?.role ||
    user?.globalRole ||
    ""
  ).toUpperCase();
  const isInstructorOrAuditor =
    role === "INSTRUCTOR" ||
    role === "ADMIN" ||
    role === "COURSE_MANAGER" ||
    role === "COMMISSION_AUDITOR";

  // Cohorts query
  const { data: cohortsData } = useInstructorCohortsList();
  const cohorts = cohortsData || [];
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const activeCohort = cohorts.find(
    (c: any) => String(c.id) === (selectedCohortId || (cohorts[0] ? String(cohorts[0].id) : "1"))
  ) || cohorts[0];

  const courseId = activeCohort?.courseId || 1;

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

  // ── 90-Day Cohort Window Calculations ──
  const cohortDates = useMemo(() => {
    if (!activeCohort) return null;
    const start = new Date(activeCohort.startDate || Date.now());
    const end = new Date(
      activeCohort.endDate ||
        new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000)
    );
    const now = new Date();

    const totalDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const elapsedDays = Math.max(
      0,
      Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const daysRemaining = Math.max(0, totalDays - elapsedDays);
    const isWithinCap = totalDays <= 90;

    return {
      startDate: start.toLocaleDateString(),
      endDate: end.toLocaleDateString(),
      totalDays,
      elapsedDays,
      daysRemaining,
      isWithinCap,
    };
  }, [activeCohort]);

  // Modules filtered
  const modules = crosswalkData?.curriculumMatrix || [];
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
                Curriculum Alignment & Program Scheduling
              </h1>
              <p className="text-xs text-slate-500">
                WAC 246-841A-440 Syllabus Crosswalk | 138 Total Core Program Hours | 90-Day Statutory Cap.
              </p>
            </div>
          </div>
        </div>

        {isInstructorOrAuditor && (
          <Button
            onClick={() => setIsAddTextbookOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Register Course Textbook
          </Button>
        )}
      </div>

      {/* 138-Hour Core Allocation Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Master 138-Hour Curriculum Breakdown
          </h2>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 font-bold text-xs">
            WAC 246-841A Mandated Total: 138.0 Hours
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Theory Track */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Theory (Online Seat-Time)
              </span>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                Ratio 30:1
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">66.0</span>
              <span className="text-xs text-slate-400 font-bold">Hours</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Active telemetry heartbeats with 120s server-side idle timeout clamping.
            </p>
          </div>

          {/* Skills Lab Track */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Skills Lab (In-Person)
              </span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                Ratio 10:1
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">32.0</span>
              <span className="text-xs text-slate-400 font-bold">Hours</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              In-person RN demonstration, guided practice, and 22 competency checkoffs.
            </p>
          </div>

          {/* Clinical Track */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Clinical Direct Care
              </span>
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                Ratio 10:1
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">40.0</span>
              <span className="text-xs text-slate-400 font-bold">Hours</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Direct patient care in contracted healthcare facilities under RN supervision.
            </p>
          </div>

          {/* Orientation Exclusion Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Orientation & Admissions
              </span>
              <Badge variant="outline" className="bg-white text-slate-600 border-slate-300 text-[10px] font-bold">
                Separately Tracked
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-600">Excluded</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Per statutory regulations, orientation hours are <strong>excluded</strong> from the 138-hour core instructional requirement.
            </p>
          </div>
        </div>
      </div>

      {/* Specialty Sub-Hours & 90-Day Pacing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specialty Hours Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Washington Specialty Curriculum Allocations
              </h3>
              <p className="text-xs text-slate-500">
                Integrated into the 66 Theory & 32 Lab hours.
              </p>
            </div>
            <Brain className="w-5 h-5 text-primary" />
          </div>

          <div className="space-y-3 pt-1">
            {/* Developmental Disabilities */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Developmental Disabilities</span>
                <span className="font-bold text-slate-900">16.0 / 16.0 Hours Required</span>
              </div>
              <Progress value={100} className="h-2 bg-slate-100" />
            </div>

            {/* Mental Health */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Mental Health Specialty</span>
                <span className="font-bold text-slate-900">8.0 / 8.0 Hours Required</span>
              </div>
              <Progress value={100} className="h-2 bg-slate-100" />
            </div>

            {/* Dementia & Alzheimer's */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Dementia & Alzheimer's Care</span>
                <span className="font-bold text-slate-900">8.0 / 8.0 Hours Required</span>
              </div>
              <Progress value={100} className="h-2 bg-slate-100" />
            </div>
          </div>
        </div>

        {/* 90-Day Program Window Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                90-Day Cohort Program Completion Window
              </h3>
              <p className="text-xs text-slate-500">
                Statutory maximum duration per WAC 246-841A.
              </p>
            </div>
            <Timer className="w-5 h-5 text-amber-600" />
          </div>

          {cohortDates ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Cohort Duration Window
                  </span>
                  <span className="font-bold text-slate-900">
                    {cohortDates.startDate} — {cohortDates.endDate}
                  </span>
                </div>
                <Badge
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5",
                    cohortDates.isWithinCap
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-rose-50 text-rose-700 border-rose-300"
                  )}
                  variant="outline"
                >
                  {cohortDates.isWithinCap ? `${cohortDates.totalDays} Days (Compliant <= 90)` : `${cohortDates.totalDays} Days (Exceeds 90-day Cap)`}
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
          ) : (
            <p className="text-xs text-slate-400">Loading cohort scheduling data...</p>
          )}
        </div>
      </div>

      {/* Learning Environment Faculty-to-Student Ratios Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600 shrink-0" />
          <div className="text-xs text-blue-950">
            <p className="font-bold">Statutory Faculty-to-Student Ratio Standards:</p>
            <p className="text-blue-800">
              • <strong>30:1</strong> Online Asynchronous Theory & Seat-Time
              {"  "}|{"  "}• <strong>20:1</strong> Live Interactive Sessions
              {"  "}|{"  "}• <strong>10:1</strong> In-Person Skills Lab & Clinical Direct Care
            </p>
          </div>
        </div>
      </div>

      {/* Registered Course Textbooks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-primary" />
            Accredited Course Textbooks & Reading References
          </h2>
          <span className="text-xs text-slate-500">
            {textbooks.length} Books Registered
          </span>
        </div>

        {textbooks.length === 0 ? (
          <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
            No textbooks registered yet for this course. Click "Register Course Textbook" above to add the WABON approved nursing assistant textbook.
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
                <SelectItem value="THEORY_ASYNC">Theory (Async)</SelectItem>
                <SelectItem value="SKILLS_LAB_IN_PERSON">Skills Lab</SelectItem>
                <SelectItem value="CLINICAL_IN_PERSON">Clinical</SelectItem>
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

        {isCrosswalkLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-xs">Generating WAC curriculum crosswalk matrix...</p>
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
                    <Badge variant="outline" className="text-[10px] font-bold uppercase bg-white border-slate-200 text-slate-600">
                      {mod.track?.replace(/_/g, " ") || "THEORY"}
                    </Badge>
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
