import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import StudentLayout from "@/features/student/components/StudentLayout";
import { useEnrollments } from "@/hooks/useAcademy";
import {
  useOrientationStatus,
  useCompleteOrientationMutation,
} from "../hooks/useOrientation";
import { useUser } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/shared/ProgressRing";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  MonitorCheck,
  RefreshCw,
  Loader2,
  Play,
  FileText,
  Check,
  Info,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const OrientationChecklistPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { data: enrollments } = useEnrollments();

  // Find relevant cohorts from student enrollments
  const cohortOptions = React.useMemo(() => {
    if (!enrollments) return [];
    const map = new Map<number, { cohortId: number; name: string; courseTitle: string }>();
    enrollments.forEach((e: any) => {
      const cId = Number(e.cohortId || e.cohort?.id);
      if (cId && !map.has(cId)) {
        map.set(cId, {
          cohortId: cId,
          name: e.cohort?.name || `Cohort #${cId}`,
          courseTitle: e.course?.title || e.cohort?.name || "Course",
        });
      }
    });
    return Array.from(map.values());
  }, [enrollments]);

  // Determine active cohort ID: url param -> first enrolled cohort
  const paramCohort = searchParams.get("cohortId");
  const redirectTarget = searchParams.get("redirect") || "/learning";

  const [selectedCohortId, setSelectedCohortId] = useState<number>(() => {
    if (paramCohort && !isNaN(Number(paramCohort))) {
      return Number(paramCohort);
    }
    return 0;
  });

  useEffect(() => {
    if (cohortOptions.length > 0 && (!paramCohort || isNaN(Number(paramCohort)))) {
      setSelectedCohortId(cohortOptions[0].cohortId);
    }
  }, [cohortOptions, paramCohort]);

  // Fetch status for this cohort
  const {
    data: status,
    isLoading: statusLoading,
    isError,
    error,
    refetch,
  } = useOrientationStatus(selectedCohortId);

  const completeMutation = useCompleteOrientationMutation();

  // Checklist states
  const [attended, setAttended] = useState<boolean>(false);
  const [tutorialDone, setTutorialDone] = useState<boolean>(false);
  const [netiquetteSigned, setNetiquetteSigned] = useState<boolean>(false);

  // Modal dialog states
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [isNetiquetteModalOpen, setIsNetiquetteModalOpen] = useState(false);

  // Sync checkboxes if already completed in DB
  useEffect(() => {
    if (status?.orientationCompleted) {
      setAttended(true);
      setTutorialDone(true);
      setNetiquetteSigned(true);
    } else {
      if (status?.orientationAttendedAt) setAttended(true);
      if (status?.lmsTutorialCompleted) setTutorialDone(true);
      if (status?.netiquetteSigned) setNetiquetteSigned(true);
    }
  }, [status]);

  const allChecked = attended && tutorialDone && netiquetteSigned;
  const isCompleted = Boolean(status?.orientationCompleted);
  const completedCount = [attended, tutorialDone, netiquetteSigned].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 3) * 100);

  const currentCohort = cohortOptions.find((c) => c.cohortId === selectedCohortId);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!allChecked || !selectedCohortId) {
      toast.error("Please complete all 3 orientation items before submitting.");
      return;
    }

    await completeMutation.mutateAsync({
      cohortId: selectedCohortId,
      orientationAttended: true,
      lmsTutorialCompleted: true,
      netiquetteSigned: true,
    });
  };

  return (
    <StudentLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-[#F2F5FB] py-6 sm:py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* ── Top Header Bar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0 pr-4">
              {/* Page Title & Subtitle */}
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#0F1B34] tracking-tight">
                Student Orientation
              </h1>
              <p className="text-xs sm:text-sm text-[#5A6B8C] mt-1 font-normal">
                Required before you can open curriculum lessons
              </p>
            </div>

            {/* Action Group: Dropdown Button (matching peer styling) + Primary CTA Button */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Cohort Dropdown Button */}
              {cohortOptions.length > 1 && (
                <div className="relative inline-flex items-center w-full sm:w-auto">
                  <select
                    id="cohort-select"
                    aria-label="Select cohort"
                    value={selectedCohortId}
                    onChange={(e) => setSelectedCohortId(Number(e.target.value))}
                    className="h-10 pl-4 pr-9 rounded-xl text-xs font-semibold text-[#0F1B34] bg-white border border-[#E1E7F1] hover:bg-slate-50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F16A1C] cursor-pointer appearance-none transition-all w-full sm:w-auto sm:max-w-[200px] truncate"
                  >
                    {cohortOptions.map((opt) => (
                      <option key={opt.cohortId} value={opt.cohortId}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5A6B8C] absolute right-3 pointer-events-none" />
                </div>
              )}

              {/* Orientation Status / Action Button (Aliko Orange #F16A1C matching Admissions Clearance) */}
              {isCompleted ? (
                <div
                  className="h-10 px-5 rounded-xl text-xs font-semibold shadow-2xs inline-flex items-center justify-center bg-[#F16A1C] text-white select-none cursor-default w-full sm:w-auto whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Orientation Complete
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!allChecked || completeMutation.isPending || statusLoading}
                  className={cn(
                    "h-10 px-5 rounded-xl text-xs font-semibold shadow-2xs transition-all w-full sm:w-auto justify-center whitespace-nowrap",
                    allChecked
                      ? "bg-[#F16A1C] hover:bg-[#D95507] text-white cursor-pointer"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed"
                  )}
                >
                  {completeMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin shrink-0" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      Complete orientation
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

        {/* ── API Error Alert (if error) ── */}
        {isError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="text-xs font-bold">Failed to load orientation status</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  {error instanceof Error ? error.message : "Network error contacting Academy service."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="bg-white border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold h-8 rounded-xl shrink-0"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </div>
        )}

        {/* ── Hero / Progress Card (V2 Clean Calm Design) ── */}
        <div className="bg-white rounded-2xl border border-[#E1E7F1] p-6 shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex items-center gap-6 min-w-0">
            {/* Circular Progress Ring (Green #10B981) */}
            <div className="shrink-0">
              <ProgressRing
                percentage={progressPercent}
                value={`${completedCount}/3`}
                color="#10B981"
                size={76}
                strokeWidth={7}
                trackColor="#E1E7F1"
                valueClassName="font-heading font-bold text-base text-[#0F1B34]"
              />
            </div>

            {/* Dynamic Status Headline & Description */}
            <div className="space-y-1 min-w-0">
              <h2 className="text-base sm:text-lg font-heading font-bold text-[#0F1B34] truncate">
                {isCompleted || completedCount === 3
                  ? "Orientation Complete! You're ready to learn."
                  : completedCount === 2
                  ? "You're two-thirds of the way there"
                  : completedCount === 1
                  ? "You're one-third of the way there"
                  : "Let's get started with orientation"}
              </h2>
              <p className="text-xs sm:text-sm text-[#5A6B8C] leading-relaxed">
                {isCompleted
                  ? "All 3 orientation gates have been acknowledged. Course theory modules and clinical lessons are unlocked."
                  : `Finish the remaining ${3 - completedCount} item${3 - completedCount === 1 ? "" : "s"} to unlock Certified Nursing Assistant lessons. About 25 minutes.`}
              </p>
            </div>
          </div>

          {/* Right Action CTA in banner */}
          <div className="shrink-0 self-start md:self-center">
            {isCompleted ? (
              <Button
                type="button"
                onClick={() => navigate(redirectTarget)}
                className="bg-[#2B5E9C] hover:bg-[#204777] text-white text-xs font-semibold px-5 h-10 rounded-xl shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                Go to My Learning <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <div className="text-right hidden sm:block">
                <span className="text-xs font-semibold text-[#0F1B34] block">
                  Gate Progress: {completedCount} of 3
                </span>
                <span className="text-[11px] text-[#5A6B8C]">
                  {3 - completedCount} item{3 - completedCount === 1 ? "" : "s"} remaining
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── V2 Orientation Checklist Items Card (Unified Card with Horizontal Rows) ── */}
        <div className="bg-white rounded-2xl border border-[#E1E7F1] shadow-2xs divide-y divide-[#E1E7F1] overflow-hidden">
          {/* ════════ Row 1: Cohort Orientation Attendance ════════ */}
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50">
            <div className="flex items-start gap-4 min-w-0">
              {/* Step Status Indicator (Check or Number 1) */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all",
                  attended || isCompleted
                    ? "bg-[#10B981] text-white shadow-2xs"
                    : "bg-slate-100 text-[#5A6B8C] border border-[#CBD5E1]"
                )}
              >
                {attended || isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  "1"
                )}
              </div>

              {/* Title, Badge, Description, Checkbox */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-semibold font-heading text-[#0F1B34]">
                    Cohort Orientation Attendance
                  </h3>
                  {attended || isCompleted ? (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[2.5]" /> Completed
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Required
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5A6B8C] leading-relaxed max-w-2xl">
                  Live kickoff: program overview, schedule, clinical expectations and instructor introductions.
                </p>

                {/* Checkbox Acknowledgment */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none group w-fit">
                  <input
                    type="checkbox"
                    checked={attended || isCompleted}
                    disabled={isCompleted || completeMutation.isPending}
                    onChange={(e) => setAttended(e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#2B5E9C] focus:ring-[#2B5E9C] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#0F1B34] group-hover:text-primary transition-colors">
                    I confirm attendance at orientation
                  </span>
                </label>
              </div>
            </div>

            {/* Action Button: View Recording */}
            <div className="shrink-0 self-start sm:self-center ml-12 sm:ml-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVideoModalOpen(true)}
                className="h-9 px-4 rounded-xl text-xs font-semibold text-[#0F1B34] bg-white border-[#E1E7F1] hover:bg-slate-50 shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-[#5A6B8C]" />
                View recording
              </Button>
            </div>
          </div>

          {/* ════════ Row 2: Platform Navigation & Attendance Tracking ════════ */}
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50">
            <div className="flex items-start gap-4 min-w-0">
              {/* Step Status Indicator (Check or Number 2) */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all",
                  tutorialDone || isCompleted
                    ? "bg-[#10B981] text-white shadow-2xs"
                    : "bg-blue-50 text-[#1D4ED8] border border-blue-200"
                )}
              >
                {tutorialDone || isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  "2"
                )}
              </div>

              {/* Title, Badge, Description, Checkbox */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-semibold font-heading text-[#0F1B34]">
                    Platform Navigation &amp; Attendance Tracking
                  </h3>
                  {tutorialDone || isCompleted ? (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[2.5]" /> Completed
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200">
                      Required · 10 min
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5A6B8C] leading-relaxed max-w-2xl">
                  Guided tour of lessons, quizzes, attendance check-ins, grades and messaging.
                </p>

                {/* Checkbox Acknowledgment */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none group w-fit">
                  <input
                    type="checkbox"
                    checked={tutorialDone || isCompleted}
                    disabled={isCompleted || completeMutation.isPending}
                    onChange={(e) => setTutorialDone(e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#2B5E9C] focus:ring-[#2B5E9C] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#0F1B34] group-hover:text-primary transition-colors">
                    I completed the platform tour
                  </span>
                </label>
              </div>
            </div>

            {/* Action Button: Start Tour */}
            <div className="shrink-0 self-start sm:self-center ml-12 sm:ml-0">
              <Button
                type="button"
                onClick={() => {
                  setTourStep(1);
                  setIsTourModalOpen(true);
                }}
                className={cn(
                  "h-9 px-4 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer",
                  tutorialDone || isCompleted
                    ? "text-[#0F1B34] bg-white border border-[#E1E7F1] hover:bg-slate-50"
                    : "bg-[#2B5E9C] hover:bg-[#204777] text-white"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {tutorialDone || isCompleted ? "Review tour" : "Start tour"}
              </Button>
            </div>
          </div>

          {/* ════════ Row 3: Healthcare Etiquette & Academic Integrity ════════ */}
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50">
            <div className="flex items-start gap-4 min-w-0">
              {/* Step Status Indicator (Check or Number 3) */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all",
                  netiquetteSigned || isCompleted
                    ? "bg-[#10B981] text-white shadow-2xs"
                    : "bg-purple-50 text-[#6D28D9] border border-purple-200"
                )}
              >
                {netiquetteSigned || isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  "3"
                )}
              </div>

              {/* Title, Badge, Description, Checkbox */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-semibold font-heading text-[#0F1B34]">
                    Healthcare Etiquette &amp; Academic Integrity
                  </h3>
                  {netiquetteSigned || isCompleted ? (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[2.5]" /> Completed
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#6D28D9] border border-purple-200">
                      Required · 15 min
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5A6B8C] leading-relaxed max-w-2xl">
                  Professional conduct, HIPAA basics, plagiarism policy and respectful online communication.
                </p>

                {/* Checkbox Acknowledgment */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none group w-fit">
                  <input
                    type="checkbox"
                    checked={netiquetteSigned || isCompleted}
                    disabled={isCompleted || completeMutation.isPending}
                    onChange={(e) => setNetiquetteSigned(e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#2B5E9C] focus:ring-[#2B5E9C] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#0F1B34] group-hover:text-primary transition-colors">
                    I acknowledge healthcare netiquette policy
                  </span>
                </label>
              </div>
            </div>

            {/* Action Button: Begin Module */}
            <div className="shrink-0 self-start sm:self-center ml-12 sm:ml-0">
              <Button
                type="button"
                onClick={() => setIsNetiquetteModalOpen(true)}
                className={cn(
                  "h-9 px-4 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer",
                  netiquetteSigned || isCompleted
                    ? "text-[#0F1B34] bg-white border border-[#E1E7F1] hover:bg-slate-50"
                    : "bg-[#2B5E9C] hover:bg-[#204777] text-white"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                {netiquetteSigned || isCompleted ? "Review policy" : "Begin module"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── V2 Footer Notice Banner (Exact V2 Design) ── */}
        <div className="bg-white rounded-2xl border border-[#E1E7F1] p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2B5E9C] flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <p className="text-xs text-[#0F1B34] leading-relaxed">
              <span className="font-bold text-[#0F1B34]">Non-credit prerequisite.</span>{" "}
              <span className="text-[#5A6B8C]">
                Orientation doesn't affect your grade, but lessons stay locked until all three items are acknowledged.
              </span>
            </p>
          </div>

          <Link
            to={`/admissions?cohortId=${selectedCohortId}`}
            className="text-xs font-semibold text-[#2B5E9C] hover:text-[#204777] hover:underline inline-flex items-center gap-1 shrink-0 ml-10 sm:ml-0"
          >
            Learn more <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Bottom Submit Bar (Sticky/Fixed at bottom when incomplete) ── */}
        {!isCompleted && (
          <div className="bg-white rounded-2xl border border-[#E1E7F1] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[#0F1B34] font-heading">
                Ready to confirm orientation?
              </h4>
              <p className="text-xs text-[#5A6B8C]">
                {allChecked
                  ? "All 3 requirements are acknowledged. Submit to unlock course lessons immediately."
                  : `${3 - completedCount} item${3 - completedCount === 1 ? "" : "s"} still require acknowledgment.`}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!allChecked || completeMutation.isPending || statusLoading}
              className={cn(
                "h-10 px-6 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0",
                allChecked
                  ? "bg-[#F16A1C] hover:bg-[#D95507] text-white"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              )}
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Recording Verification...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Confirm &amp; Unlock Curriculum
                </>
              )}
            </Button>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            MODAL 1: Live Cohort Orientation Video Recording
        ────────────────────────────────────────────────────────── */}
        <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
          <DialogContent className="max-w-2xl p-6 rounded-2xl">
            <DialogTitle className="text-base font-semibold text-[#0F1B34] font-heading flex items-center gap-2">
              <Play className="w-4 h-4 text-[#0183C7]" />
              Cohort Kickoff &amp; Orientation Session
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5A6B8C]">
              {currentCohort?.name || "CNA Cohort"} · Recorded faculty orientation
            </DialogDescription>

            <div className="space-y-4 my-2">
              {/* Video Player Display */}
              <div className="aspect-video w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="w-14 h-14 rounded-full bg-[#0183C7] hover:bg-[#0284C7] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform cursor-pointer z-10">
                  <Play className="w-6 h-6 ml-1" />
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs z-10 text-white/90 font-medium">
                  <span>Aliko Academy · Orientation &amp; Program Syllabus Overview</span>
                  <span>42:15</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-[#E1E7F1] rounded-xl p-3 text-xs text-[#5A6B8C] space-y-1">
                <span className="font-semibold text-[#0F1B34] block">Key Agenda Items Covered:</span>
                <p>1. Program prerequisites, background check and TB clearance deadlines.</p>
                <p>2. Attendance expectations: 100% attendance required under WAC 246-841A.</p>
                <p>3. Skills lab schedule and clinical rotation partner health systems.</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E1E7F1]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsVideoModalOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setAttended(true);
                  setIsVideoModalOpen(false);
                  toast.success("Orientation attendance confirmed");
                }}
                className="bg-[#2B5E9C] hover:bg-[#204777] text-white text-xs font-semibold rounded-xl"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Mark Attendance Confirmed
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ──────────────────────────────────────────────────────────
            MODAL 2: Interactive Platform Walkthrough Tour
        ────────────────────────────────────────────────────────── */}
        <Dialog open={isTourModalOpen} onOpenChange={setIsTourModalOpen}>
          <DialogContent className="max-w-xl p-6 rounded-2xl">
            <DialogTitle className="text-base font-semibold text-[#0F1B34] font-heading flex items-center gap-2">
              <MonitorCheck className="w-4 h-4 text-[#0183C7]" />
              Platform Navigation Walkthrough (Step {tourStep} of 4)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5A6B8C]">
              Learn how to navigate lessons, check-in for seat-time, and submit assignments.
            </DialogDescription>

            <div className="space-y-4 my-2">
              {tourStep === 1 && (
                <div className="space-y-3 p-4 rounded-xl bg-sky-50/50 border border-sky-100">
                  <h4 className="text-sm font-semibold text-[#0F1B34]">1. Accessing Courses &amp; Lessons</h4>
                  <p className="text-xs text-[#5A6B8C] leading-relaxed">
                    Navigate to <strong>My Learning</strong> from the sidebar. Each course is organized into sequential modules and chapters. Lessons unlock automatically as you complete prerequisites.
                  </p>
                </div>
              )}

              {tourStep === 2 && (
                <div className="space-y-3 p-4 rounded-xl bg-sky-50/50 border border-sky-100">
                  <h4 className="text-sm font-semibold text-[#0F1B34]">2. Active Seat-Time &amp; WABON Compliance</h4>
                  <p className="text-xs text-[#5A6B8C] leading-relaxed">
                    Under Washington State WAC regulations, active seat-time is measured while interacting with curriculum materials. Avoid leaving lesson pages idle. Periodic engagement check-ins ensure your hours are certified.
                  </p>
                </div>
              )}

              {tourStep === 3 && (
                <div className="space-y-3 p-4 rounded-xl bg-sky-50/50 border border-sky-100">
                  <h4 className="text-sm font-semibold text-[#0F1B34]">3. Quizzes, Grades &amp; Knowledge Checks</h4>
                  <p className="text-xs text-[#5A6B8C] leading-relaxed">
                    End-of-chapter quizzes require an 80% passing score to advance. You can retake practice assessments, and grades sync immediately with your instructor's census roster.
                  </p>
                </div>
              )}

              {tourStep === 4 && (
                <div className="space-y-3 p-4 rounded-xl bg-sky-50/50 border border-sky-100">
                  <h4 className="text-sm font-semibold text-[#0F1B34]">4. Messaging &amp; Instructor Support</h4>
                  <p className="text-xs text-[#5A6B8C] leading-relaxed">
                    Use the <strong>Chat</strong> and <strong>Support Desk</strong> channels to communicate directly with your primary instructor and cohort peers.
                  </p>
                </div>
              )}

              {/* Step indicator dots */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all",
                      tourStep === s ? "bg-[#0183C7] w-6" : "bg-slate-200"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E1E7F1]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={tourStep === 1}
                onClick={() => setTourStep((prev) => Math.max(1, prev - 1))}
                className="rounded-xl text-xs font-semibold"
              >
                Previous
              </Button>

              {tourStep < 4 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setTourStep((prev) => Math.min(4, prev + 1))}
                  className="bg-[#0183C7] hover:bg-[#0284C7] text-white text-xs font-semibold rounded-xl"
                >
                  Next Step <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setTutorialDone(true);
                    setIsTourModalOpen(false);
                    toast.success("Platform tutorial acknowledged");
                  }}
                  className="bg-[#2B5E9C] hover:bg-[#204777] text-white text-xs font-semibold rounded-xl"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Complete Walkthrough
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ──────────────────────────────────────────────────────────
            MODAL 3: Netiquette & Academic Integrity Policy
        ────────────────────────────────────────────────────────── */}
        <Dialog open={isNetiquetteModalOpen} onOpenChange={setIsNetiquetteModalOpen}>
          <DialogContent className="max-w-2xl p-6 rounded-2xl">
            <DialogTitle className="text-base font-semibold text-[#0F1B34] font-heading flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
              Healthcare Netiquette &amp; Academic Honesty Policy
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5A6B8C]">
              Review the statutory and ethical standards governing clinical student conduct.
            </DialogDescription>

            <div className="space-y-3.5 my-2 max-h-96 overflow-y-auto pr-2 text-xs text-[#5A6B8C]">
              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1">
                <span className="font-semibold text-[#0F1B34] block">1. HIPAA &amp; Patient Confidentiality</span>
                <p>
                  No protected health information (PHI), patient identifiers, or real clinical scenarios containing identifying details may ever be posted, shared, or recorded on online platforms or discussion forums.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1">
                <span className="font-semibold text-[#0F1B34] block">2. Professional Online Communication</span>
                <p>
                  Maintain respectful, courteous, and culturally competent communication with peers, faculty, and clinical lab partners. Discriminatory, harassing, or abusive language will result in immediate administrative review.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1">
                <span className="font-semibold text-[#0F1B34] block">3. Academic Integrity &amp; Authentic Work</span>
                <p>
                  All submitted quiz responses, written case reflections, and skills documentation must represent your own authentic effort. Plagiarism, unauthorized collaboration, or falsification of training records is grounds for dismissal.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E1E7F1]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNetiquetteModalOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setNetiquetteSigned(true);
                  setIsNetiquetteModalOpen(false);
                  toast.success("Netiquette & integrity pledge acknowledged");
                }}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-xl"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                I Agree &amp; Acknowledge Pledge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </StudentLayout>
);
};

export default OrientationChecklistPage;
