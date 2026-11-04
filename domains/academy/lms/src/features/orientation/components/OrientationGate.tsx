import React from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useUser } from "@/features/auth/hooks/useAuth";
import { useEnrollments } from "@/hooks/useAcademy";
import { useOrientationStatus } from "../hooks/useOrientation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  GraduationCap,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Loader2,
  LayoutDashboard,
} from "lucide-react";

interface OrientationGateProps {
  children: React.ReactNode;
}

export const OrientationGate: React.FC<OrientationGateProps> = ({ children }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user, isLoading: userLoading } = useUser();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();

  // If user is Instructor or Admin, orientation prerequisite is bypassed
  const isPrivileged =
    user?.academyRole === "INSTRUCTOR" ||
    user?.academyActiveRole === "INSTRUCTOR" ||
    user?.globalRole === "ADMIN" ||
    user?.academyRole === "ADMIN";

  // Find enrollment for this course
  const enrollment = React.useMemo(() => {
    if (!enrollments || !id) return null;
    return enrollments.find(
      (e: any) =>
        String(e.courseId) === String(id) ||
        String(e.course?.id) === String(id) ||
        String(e.id) === String(id)
    );
  }, [enrollments, id]);

  const cohortId = Number(enrollment?.cohortId || enrollment?.cohort?.id || 1);

  // Check orientation status for the student's cohort
  const {
    data: status,
    isLoading: statusLoading,
    isError,
    error,
    refetch,
  } = useOrientationStatus(isPrivileged ? null : cohortId);

  if (userLoading || (enrollmentsLoading && !isPrivileged)) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
        <p className="text-sm font-semibold text-slate-300">
          Loading learning environment...
        </p>
      </div>
    );
  }

  // Instructors and admins bypass student orientation
  if (isPrivileged) {
    return <>{children}</>;
  }

  // If status is loading
  if (statusLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-200">
            Verifying WABON Orientation Compliance...
          </p>
          <p className="text-xs text-slate-400">
            Checking prerequisite completion status for Cohort #{cohortId}
          </p>
        </div>
      </div>
    );
  }

  // If error checking status
  if (isError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">
              Compliance Verification Error
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unable to verify your orientation prerequisite status.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-bold rounded-xl h-10 px-4"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Check
            </Button>
            <Button
              size="sm"
              onClick={() =>
                navigate(`/orientation?cohortId=${cohortId}&redirect=${encodeURIComponent(location.pathname)}`)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10 px-5"
            >
              Go to Orientation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If orientation is NOT completed, block access and present the WABON requirement notice
  if (status && !status.orientationCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Badge & Lock Icon */}
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5"
              >
                Prerequisite Incomplete
              </Badge>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Mandatory Orientation Required
              </h2>
            </div>
          </div>

          {/* Explanation */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left text-xs text-slate-300 space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <GraduationCap className="w-4 h-4" />
              <span>WABON WAC 246-841A-440(2) Compliance Rule</span>
            </div>
            <p>
              Access to course curriculum and lessons is locked until you complete the
              mandatory cohort orientation verification, LMS navigation tutorial, and
              healthcare netiquette pledge.
            </p>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/50">
              Assigned Cohort:{" "}
              <span className="font-semibold text-white">Cohort #{cohortId}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold rounded-xl h-11 px-5"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <Button
              onClick={() =>
                navigate(
                  `/orientation?cohortId=${cohortId}&redirect=${encodeURIComponent(location.pathname)}`
                )
              }
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-11 px-6 shadow-lg shadow-blue-600/25"
            >
              Complete Orientation Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // All clear! Render child lesson view
  return <>{children}</>;
};

export default OrientationGate;
