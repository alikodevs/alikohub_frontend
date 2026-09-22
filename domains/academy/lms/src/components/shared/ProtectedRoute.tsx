import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@/features/auth/hooks/useAuth";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
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

  return <Outlet />;
};

export default ProtectedRoute;
