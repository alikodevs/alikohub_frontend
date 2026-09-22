import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUser,
  useSelectAcademyRole,
  useSwitchAcademyRole,
} from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";

export const useAccessLms = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const navigate = useNavigate();
  const selectRoleMutation = useSelectAcademyRole();
  const switchRoleMutation = useSwitchAcademyRole();
  const isExecuting = useRef(false);

  const accessLms = async () => {
    if (isExecuting.current) return;
    isExecuting.current = true;

    if (!user) {
      navigate("/login");
      isExecuting.current = false;
      return;
    }

    try {
      const targetRole = "student" as const;
      const currentUser = queryClient.getQueryData(["user"]) as any;
      const academyUser = currentUser?.academyUser;
      const currentRole = (academyUser?.role || "USER").toUpperCase();

      if (currentRole === "USER" || !academyUser) {
        await selectRoleMutation.mutateAsync({
          role: "student",
        });

        queryClient.setQueryData(["user"], (old: any) => ({
          ...old,
          academyRole: "STUDENT",
          academyUser: {
            ...(old?.academyUser || {}),
            role: "STUDENT",
          },
        }));
      }

      const latestUser = queryClient.getQueryData(["user"]) as any;
      const latestActive = (
        latestUser?.academyUser?.activeRole || "USER"
      ).toUpperCase();

      if (latestActive !== "STUDENT") {
        await switchRoleMutation.mutateAsync({ newRole: "student" });
        toast.success(`Accessing LMS as ${targetRole}!`);
      } else {
        toast.success("Accessing LMS!");
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Failed to access LMS:", error);
      const currentActive = user.academyUser?.activeRole?.toLowerCase();
      navigate(currentActive === "instructor" ? "/instructor" : "/dashboard");
    } finally {
      isExecuting.current = false;
    }
  };

  return {
    accessLms,
    isLoading: selectRoleMutation.isPending || switchRoleMutation.isPending,
  };
};
