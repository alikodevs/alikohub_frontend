import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@/features/auth/hooks/useAuth";
import { Loader2 } from "lucide-react";

const InstructorRoute = () => {
  const { data: user, isLoading, isFetched } = useUser();
  if (isLoading || !isFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const instructorStatus = user?.instructorStatus?.toUpperCase();
  const isInstructor =
    user?.globalRole === "ADMIN" ||
    user?.academyUser?.role === "INSTRUCTOR" ||
    instructorStatus === "ACCEPTED" ||
    instructorStatus === "APPROVED" ||
    instructorStatus === "ACTIVE" ||
    user?.roleStatus?.instructor === "ACTIVE" ||
    user?.roleStatus?.instructor?.toUpperCase() === "ACTIVE";

  const activeRole = (
    user?.academyUser?.activeRole ||
    user?.academyActiveRole ||
    ""
  ).toLowerCase();

  const isActiveInstructor =
    user?.globalRole === "ADMIN" || activeRole === "instructor";

  if (!isInstructor) {
    return <Navigate to="/instructor/apply" replace />;
  }

  if (!isActiveInstructor) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default InstructorRoute;
