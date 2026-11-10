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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/dashboard" className="hover:text-slate-800 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/learning" className="hover:text-slate-800 transition-colors">
            My Courses
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Mandatory Orientation</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 opacity-70" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border",
                  isCompleted
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : "bg-blue-50 border-blue-200 text-blue-600"
                )}
              >
                {isCompleted ? (
                  <ShieldCheck className="w-8 h-8" />
                ) : (
                  <GraduationCap className="w-8 h-8" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Mandatory Student Orientation
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Required prerequisite verification before accessing curriculum lessons.
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div>
              {statusLoading ? (
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-xs text-slate-600 font-medium animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  Checking Prerequisite...
                </div>
              ) : isCompleted ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Orientation Completed & Verified
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 shadow-xs">
                  <Clock className="w-4 h-4 text-rose-600" />
                  Action Required: Pending Completion
                </div>
              )}
            </div>
          </div>

          {/* Program Rules & Hours Disclaimer Notice */}
          <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 leading-relaxed">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-950 block">
                Program Orientation Notice — Non-Credited Prerequisite
              </span>
              <p className="text-amber-800">
                Orientation hours are an administrative prerequisite and attendance census.
                Under program policy, orientation time is{" "}
                <span className="font-semibold underline">
                  strictly non-credited (0 credited hours)
                </span>{" "}
                and is recorded independently from your 50+ hours of mandated classroom theory
                and 40+ clinical hours.
              </p>
            </div>
          </div>

          {/* Cohort Selector (if student has multiple enrollments) */}
          {cohortOptions.length > 1 && (
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700">Enrolled Cohort:</span>
              <div className="flex items-center gap-2 overflow-x-auto">
                {cohortOptions.map((cohort) => (
                  <button
                    key={cohort.cohortId}
                    type="button"
                    onClick={() => setSelectedCohortId(cohort.cohortId)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                      selectedCohortId === cohort.cohortId
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {cohort.name} ({cohort.courseTitle})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admissions Prerequisite Documents & Agreement Link */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Admissions Prerequisite Documents & Enrollment Agreement
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit background check, TB test, immunizations, CPR card, and sign digital enrollment agreement.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="rounded-xl h-9 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 shrink-0"
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
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border border-emerald-200 shadow-xs space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Orientation Gate Passed
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your attendance census, LMS tutorial, and netiquette pledge have been verified
                  by the Academy compliance system.
                </p>
                {status?.orientationAttendedAt && (
                  <p className="text-[11px] font-semibold text-emerald-700">
                    Verified on: {new Date(status.orientationAttendedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-100 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-xs text-slate-500">
                All course modules and lessons are accessible.
              </span>
              <Button
                onClick={() => navigate(redirectTarget)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md shadow-emerald-600/20"
              >
                Continue to Lessons <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Interactive Checklist Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                Required Prerequisite Items
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Carefully review and acknowledge all 3 items to unlock your training curriculum.
              </p>
            </div>

            {/* Checklist Items */}
            <div className="space-y-4">
              {/* Item 1: Live Orientation Attendance */}
              <label
                className={cn(
                  "p-5 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer select-none",
                  attended || isCompleted
                    ? "bg-blue-50/40 border-blue-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <input
                  type="checkbox"
                  id="orientationAttended"
                  checked={attended || isCompleted}
                  disabled={isCompleted || completeMutation.isPending}
                  onChange={(e) => setAttended(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-75 cursor-pointer"
                />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      1. Live / Cohort Orientation Attendance
                    </span>
                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-[10px] font-bold">
                      Mandatory
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    I confirm that I attended the live or scheduled orientation session for{" "}
                    <span className="font-semibold text-slate-800">
                      {currentCohort?.name || `Cohort #${selectedCohortId}`}
                    </span>
                    . I reviewed the course syllabus, program objectives, instructor contact
                    methods, and clinical facility prerequisites.
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    Note: Orientation is a non-credited onboarding prerequisite and does not count toward theory hours.
                  </p>
                </div>
              </label>

              {/* Item 2: LMS Navigation & Seat-Time Tutorial */}
              <label
                className={cn(
                  "p-5 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer select-none",
                  tutorialDone || isCompleted
                    ? "bg-blue-50/40 border-blue-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <input
                  type="checkbox"
                  id="lmsTutorialCompleted"
                  checked={tutorialDone || isCompleted}
                  disabled={isCompleted || completeMutation.isPending}
                  onChange={(e) => setTutorialDone(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-75 cursor-pointer"
                />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <MonitorCheck className="w-4 h-4 text-blue-600" />
                      2. LMS Platform Navigation & Seat-Time Tracking Tutorial
                    </span>
                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-[10px] font-bold">
                      Mandatory
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    I have completed the LMS system walkthrough. I understand how the seat-time
                    heartbeat tracks active engagement, how to navigate curriculum modules, submit
                    assignments, and access technical support.
                  </p>
                </div>
              </label>

              {/* Item 3: Netiquette & Academic Integrity Agreement */}
              <label
                className={cn(
                  "p-5 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer select-none",
                  netiquetteSigned || isCompleted
                    ? "bg-blue-50/40 border-blue-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <input
                  type="checkbox"
                  id="netiquetteSigned"
                  checked={netiquetteSigned || isCompleted}
                  disabled={isCompleted || completeMutation.isPending}
                  onChange={(e) => setNetiquetteSigned(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-75 cursor-pointer"
                />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-blue-600" />
                      3. Healthcare Netiquette & Academic Integrity Pledge
                    </span>
                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-[10px] font-bold">
                      Mandatory
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    I pledge to uphold professional healthcare communication, protect resident
                    confidentiality under HIPAA, engage with peers constructively in discussion
                    forums, and adhere strictly to AlikoHub Academy academic honesty policies.
                  </p>
                </div>
              </label>
            </div>

            {/* Submission Actions */}
            {!isCompleted && (
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    {!allChecked
                      ? "Acknowledge all 3 requirements above to submit."
                      : "Ready to confirm and unlock curriculum."}
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={!allChecked || completeMutation.isPending || statusLoading}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 px-8 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {completeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording Verification...
                    </>
                  ) : (
                    <>
                      Confirm & Unlock Curriculum <ArrowRight className="w-4 h-4 ml-2" />
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
