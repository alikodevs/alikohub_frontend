import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useEnrollments } from "@/hooks/useAcademy";
import { useOrientationStatus, useCompleteOrientationMutation } from "../hooks/useOrientation";
import { useUser } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  ArrowRight,
  GraduationCap,
  FileCheck2,
  MonitorCheck,
  RefreshCw,
  Loader2,
  ChevronRight,
  Info,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const OrientationChecklistPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();

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

  // Checklist state
  const [attended, setAttended] = useState<boolean>(false);
  const [tutorialDone, setTutorialDone] = useState<boolean>(false);
  const [netiquetteSigned, setNetiquetteSigned] = useState<boolean>(false);

  // Sync checkboxes if already completed in DB
  useEffect(() => {
    if (status?.orientationCompleted) {
      setAttended(true);
      setTutorialDone(true);
      setNetiquetteSigned(true);
    } else {
      if (status?.lmsTutorialCompleted) setTutorialDone(true);
      if (status?.netiquetteSigned) setNetiquetteSigned(true);
    }
  }, [status]);

  const allChecked = attended && tutorialDone && netiquetteSigned;
  const isCompleted = Boolean(status?.orientationCompleted);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecked || !selectedCohortId) return;

    await completeMutation.mutateAsync({
      cohortId: selectedCohortId,
      orientationAttended: true,
      lmsTutorialCompleted: true,
      netiquetteSigned: true,
    });
  };

  const currentCohort = cohortOptions.find((c) => c.cohortId === selectedCohortId);

  return (
    <div className="min-h-screen bg-[#F7F9FC] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/dashboard" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/learning" className="hover:text-primary transition-colors">
            My Courses
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-medium">Student Orientation</span>
        </div>

        {/* ── Compact Cohort Selector Row (Separate, does not compete with title) ── */}
        {cohortOptions.length > 1 && (
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Enrolled Cohort:
            </span>
            <div className="flex items-center gap-2">
              <select
                id="cohort-select"
                aria-label="Select cohort"
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(Number(e.target.value))}
                className="text-xs font-medium bg-white border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {cohortOptions.map((opt) => (
                  <option key={opt.cohortId} value={opt.cohortId}>
                    {opt.name} ({opt.courseTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Hero Header: Light, elegant with brand wave ── */}
        <div className="rounded-3xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden relative">
          <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
            {/* Left Title & Subtitle */}
            <div className="relative z-10 max-w-lg">
              <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-[#081831] tracking-tight leading-[1.15]">
                Student<br />
                <span className="text-primary">Orientation</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-3 leading-relaxed font-normal">
                Required prerequisite verification before accessing curriculum lessons.
              </p>
            </div>

            {/* Right: Decorative brand wave & Graduation Cap artwork */}
            <div className="relative md:w-72 h-36 shrink-0 flex items-center justify-end pointer-events-none overflow-hidden">
              <svg
                viewBox="0 0 320 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <ellipse cx="220" cy="80" rx="90" ry="70" fill="#EAF3F9" opacity="0.7" />
                <path
                  d="M110 0 C150 70 170 160 320 160 L320 0 Z"
                  fill="url(#blue-brand-gradient-or)"
                />
                <path
                  d="M106 0 C146 70 166 160 316 160"
                  stroke="#D77510"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Books stack */}
                <rect x="180" y="118" width="110" height="12" rx="2" fill="#ffffff" stroke="#E2E8F0" strokeWidth="1.5" />
                <rect x="176" y="117" width="8" height="14" rx="2" fill="#084B78" />
                <rect x="186" y="104" width="102" height="12" rx="2" fill="#ffffff" stroke="#E2E8F0" strokeWidth="1.5" />
                <rect x="182" y="103" width="8" height="14" rx="2" fill="#D77510" />
                <rect x="192" y="90" width="94" height="12" rx="2" fill="#ffffff" stroke="#E2E8F0" strokeWidth="1.5" />
                <rect x="188" y="89" width="8" height="14" rx="2" fill="#0A65A0" />

                {/* Graduation cap */}
                <ellipse cx="238" cy="74" rx="28" ry="12" fill="#1e293b" />
                <path d="M210 74 L210 84 C210 92 266 92 266 84 L266 74 Z" fill="#0f172a" />
                <polygon points="238,44 286,60 238,76 190,60" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="238" cy="60" r="3" fill="#D77510" />
                <path d="M238 60 Q265 65 268 76" stroke="#D77510" strokeWidth="1.5" fill="none" />
                <polygon points="266,76 270,76 272,96 264,96" fill="#D77510" />

                <defs>
                  <linearGradient id="blue-brand-gradient-or" x1="120" y1="0" x2="300" y2="160" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0A65A0" />
                    <stop offset="1" stopColor="#084B78" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Integrated Milestones Progress Row */}
          <div className="border-t border-slate-100 bg-[#F4F8FB] px-6 sm:px-8 py-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* 3 Checklist Items Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                    attended || isCompleted ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    {attended || isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : "1"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800">Attendance</p>
                    <p className="text-[11px] text-slate-500">{attended || isCompleted ? "Acknowledged" : "Required"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                    tutorialDone || isCompleted ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    {tutorialDone || isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : "2"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800">LMS Tutorial</p>
                    <p className="text-[11px] text-slate-500">{tutorialDone || isCompleted ? "Acknowledged" : "Required"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                    netiquetteSigned || isCompleted ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    {netiquetteSigned || isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : "3"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800">Netiquette</p>
                    <p className="text-[11px] text-slate-500">{netiquetteSigned || isCompleted ? "Acknowledged" : "Required"}</p>
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                  isCompleted
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-[#EAF3F9] text-primary border-[#E2E8F0]"
                )}>
                  {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  {isCompleted ? "Verified & Complete" : `${[attended, tutorialDone, netiquetteSigned].filter(Boolean).length}/3 Complete`}
                </span>
              </div>
            </div>

            {/* Bottom progress bar */}
            <div className="w-full h-1 bg-slate-200/70 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${([attended, tutorialDone, netiquetteSigned].filter(Boolean).length / 3) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Program Notice */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs text-xs text-slate-600 flex items-start gap-3 leading-relaxed">
          <div className="w-8 h-8 rounded-lg bg-[#FFF2E3] border border-[#E2E8F0] text-[#D77510] flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="font-medium text-slate-900 block">Non-Credited Prerequisite</span>
            <p className="text-slate-500 mt-0.5">
              Orientation time is an administrative gate recorded separately from your 50+ theory hours and 40+ clinical hours.
            </p>
          </div>
        </div>

        {/* Admissions Prerequisite Link Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF3F9] border border-[#E2E8F0] text-primary flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900 font-heading">
                Admissions Prerequisites &amp; Agreement
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit background check, health screenings, and sign your digital agreement.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="rounded-xl h-9 text-xs font-medium text-primary hover:text-[#084B78] hover:bg-[#EAF3F9] border-[#E2E8F0] shrink-0"
          >
            <Link to={`/admissions?cohortId=${selectedCohortId}`}>
              Admissions Checklist <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>

        {/* API Error State */}
        {isError && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              className="bg-white border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold h-9 rounded-xl shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        )}

        {/* Completed State Celebration Card */}
        {isCompleted && (
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-emerald-200 shadow-xs space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-heading font-medium text-slate-900">
                  Orientation Verified &amp; Complete
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your attendance, LMS walkthrough, and netiquette pledge have been verified.
                </p>
                {status?.orientationAttendedAt && (
                  <p className="text-[11px] font-medium text-emerald-700">
                    Verified on {new Date(status.orientationAttendedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-xs text-slate-500">All course modules and lessons are unlocked.</span>
              <Button
                onClick={() => navigate(redirectTarget)}
                className="bg-primary hover:bg-[#084B78] text-white font-medium text-xs h-10 px-6 rounded-xl shadow-xs"
              >
                Continue to Lessons <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Interactive Checklist Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-heading font-semibold text-[#081831]">
                Required Prerequisite Items
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and acknowledge all 3 items to unlock your training curriculum.
              </p>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {/* Item 1: Live Orientation Attendance */}
              <label
                className={cn(
                  "p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer select-none group",
                  attended || isCompleted
                    ? "bg-[#F4F8FB] border-[#E2E8F0] shadow-2xs"
                    : "bg-white border-slate-200 hover:border-primary/40 hover:shadow-2xs"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                  attended || isCompleted
                    ? "bg-primary border-primary text-white"
                    : "border-slate-300 group-hover:border-primary"
                )}>
                  {(attended || isCompleted) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <input
                  type="checkbox"
                  id="orientationAttended"
                  checked={attended || isCompleted}
                  disabled={isCompleted || completeMutation.isPending}
                  onChange={(e) => setAttended(e.target.checked)}
                  className="sr-only"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EAF3F9] border border-[#E2E8F0] text-primary flex items-center justify-center">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      1. Cohort Orientation Attendance
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      attended || isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      {attended || isCompleted ? "Acknowledged" : "Required"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    I attended orientation for{" "}
                    <span className="font-medium text-slate-800">
                      {currentCohort?.name || `Cohort #${selectedCohortId}`}
                    </span>
                    , reviewing course syllabus, program objectives, faculty expectations, and clinical prerequisites.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Non-credited prerequisite (does not count toward theory hours).
                  </p>
                </div>
              </label>

              {/* Item 2: LMS Navigation & Seat-Time Tutorial */}
              <label
                className={cn(
                  "p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer select-none group",
                  tutorialDone || isCompleted
                    ? "bg-[#F4F8FB] border-[#E2E8F0] shadow-2xs"
                    : "bg-white border-slate-200 hover:border-primary/40 hover:shadow-2xs"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                  tutorialDone || isCompleted
                    ? "bg-primary border-primary text-white"
                    : "border-slate-300 group-hover:border-primary"
                )}>
                  {(tutorialDone || isCompleted) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <input
                  type="checkbox"
                  id="lmsTutorialCompleted"
                  checked={tutorialDone || isCompleted}
                  disabled={isCompleted || completeMutation.isPending}
                  onChange={(e) => setTutorialDone(e.target.checked)}
                  className="sr-only"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EAF3F9] border border-[#E2E8F0] text-primary flex items-center justify-center">
                        <MonitorCheck className="w-3.5 h-3.5" />
                      </div>
                      2. Platform Navigation &amp; Attendance Tracking
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      tutorialDone || isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      {tutorialDone || isCompleted ? "Acknowledged" : "Required"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    I have reviewed the LMS system walkthrough, understanding seat-time tracking, curriculum navigation, assignment submissions, and technical support.
                  </p>
                </div>
              </label>

              {/* Item 3: Netiquette & Academic Integrity Agreement */}
              <label
                className={cn(
                  "p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer select-none group",
                  netiquetteSigned || isCompleted
                    ? "bg-[#F4F8FB] border-[#E2E8F0] shadow-2xs"
                    : "bg-white border-slate-200 hover:border-primary/40 hover:shadow-2xs"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                  netiquetteSigned || isCompleted
                    ? "bg-primary border-primary text-white"
                    : "border-slate-300 group-hover:border-primary"
                )}>
                  {(netiquetteSigned || isCompleted) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <input
                  type="checkbox"
                  id="netiquetteSigned"
                  checked={netiquetteSigned || isCompleted}
                  disabled={isCompleted || completeMutation.isPending}
                  onChange={(e) => setNetiquetteSigned(e.target.checked)}
                  className="sr-only"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#FFF2E3] border border-[#E2E8F0] text-[#D77510] flex items-center justify-center">
                        <FileCheck2 className="w-3.5 h-3.5" />
                      </div>
                      3. Healthcare Netiquette &amp; Academic Integrity
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      netiquetteSigned || isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      {netiquetteSigned || isCompleted ? "Acknowledged" : "Required"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    I pledge to maintain professional communication, uphold HIPAA patient confidentiality, engage constructively in discussions, and adhere to academic honesty policies.
                  </p>
                </div>
              </label>
            </div>

            {/* Submission Actions */}
            {!isCompleted && (
              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  {!allChecked ? (
                    <>
                      <div className="w-5 h-5 rounded-md bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-3 h-3" />
                      </div>
                      <span>Acknowledge all 3 requirements above to submit.</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="text-emerald-700 font-medium">Ready to confirm and unlock curriculum.</span>
                    </>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!allChecked || completeMutation.isPending || statusLoading}
                  className={cn(
                    "w-full sm:w-auto font-medium text-xs h-10 px-8 rounded-xl shadow-xs disabled:opacity-50 transition-all",
                    allChecked
                      ? "bg-primary hover:bg-[#084B78] text-white"
                      : "bg-slate-200 text-slate-500"
                  )}
                >
                  {completeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording Verification...
                    </>
                  ) : (
                    <>
                      Confirm &amp; Unlock Curriculum <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrientationChecklistPage;
