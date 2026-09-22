import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/authService";
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  InstructorApplicationRequest,
} from "@/features/auth/types/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import type { ApiError } from "@/features/auth/types/auth";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (data: AuthResponse) => {
      authService.setSession(data.accessToken, data.refreshToken, data.user);
      queryClient.setQueryData(["user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Successfully logged in!");

      // Determine active role, prefer academyUser.activeRole as it's the most accurate
      const activeRole = (
        data.user.academyUser?.activeRole ||
        data.user.academyActiveRole ||
        ""
      ).toLowerCase();

      // If user is admin, redirect to /admin
      if (data.user.globalRole === "ADMIN") {
        navigate("/admin");
      } else if (activeRole === "instructor") {
        navigate("/instructor");
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error: ApiError) => {
      const message =
        error.response?.data?.message ||
        "Failed to login. Please check your credentials.";
      toast.error(message);
    },
  });
};

export const useGoogleLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (idToken: string) => authService.googleLogin(idToken),
    onSuccess: (data: AuthResponse) => {
      authService.setSession(data.accessToken, data.refreshToken, data.user);
      queryClient.setQueryData(["user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Successfully authenticated with Google!");

      if (data.isNewUser) {
        toast.info("Welcome to Aliko Academy! Please complete your profile.");
      }

      // Determine active role
      const activeRole = (
        data.user.academyUser?.activeRole ||
        data.user.academyActiveRole ||
        ""
      ).toLowerCase();

      if (data.user.globalRole === "ADMIN") {
        navigate("/admin");
      } else if (activeRole === "instructor") {
        navigate("/instructor");
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error: ApiError) => {
      const message =
        error.response?.data?.message || "Google authentication failed.";
      toast.error(message);
    },
  });
};

export const useGoogleAuth = () => {
  const { mutate: googleLogin, isPending } = useGoogleLogin();

  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      googleLogin(idToken);
    } catch (error: any) {
      if (error.code !== "auth/popup-closed-by-user") {
        console.error("Google Sign-In Error:", error);
        toast.error("Google login failed. Please try again.");
      }
    }
  };

  return { signIn, isPending };
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      authService.register(credentials),
    onSuccess: (data: AuthResponse) => {
      authService.setSession(data.accessToken, data.refreshToken, data.user);
      queryClient.setQueryData(["user"], data.user);
      toast.success("Successfully registered!");
      navigate("/");
    },
    onError: (error: ApiError) => {
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      toast.error(message);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase signOut error", error);
    }
    authService.logout();
    queryClient.setQueryData(["user"], null);
    queryClient.removeQueries({ queryKey: ["user"] });
    queryClient.clear();
    toast.success("Logged out successfully");
    navigate("/");
  };
};

export const useUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { accessToken, user: localUser } = authService.getSession();

      if (!accessToken) return null;

      // If we have a local user, return it immediately to avoid blocking UI
      // Background revalidation will happen if needed
      try {
        const remoteUser = await authService.getProfile();

        // Background sync: update academy status if possible
        try {
          const academyStatus = await authService.getUserAcademyStatus(
            remoteUser.id.toString(),
          );
          const mergedUser = { ...remoteUser, ...academyStatus };

          // Sync back to localStorage only if changed
          const refreshToken = localStorage.getItem("refreshToken") || "";

          if (JSON.stringify(mergedUser) !== JSON.stringify(localUser)) {
            authService.setSession(accessToken, refreshToken, mergedUser);
          }

          return mergedUser;
        } catch (statusError) {
          return remoteUser;
        }
      } catch (e) {
        if (localUser) return localUser;
        throw e; // If no local user exists and remote fails, then we are truly unauthenticated
      }
    },
    placeholderData: () => {
      const { user } = authService.getSession();
      return user || undefined;
    },
    staleTime: 5000,
    retry: false, // Don't retry indefinitely on timeouts
  });
};

export const useSelectAcademyRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleData: { role: "student" | "instructor" }) =>
      authService.selectAcademyRole(roleData),
    onSuccess: (data: any, variables: { role: "student" | "instructor" }) => {
      // 1. Adopt tokens immediately
      if (data.accessToken) {
        const currentRefresh =
          data.refreshToken || localStorage.getItem("refreshToken") || "";
        const existingUser = queryClient.getQueryData(["user"]) || {};
        authService.setSession(
          data.accessToken,
          currentRefresh,
          data.user || existingUser,
        );
      }

      // 2. Aggressively patch local cache to the target role
      // This is crucial because if the backend returns the old 'USER' role in its response,
      // it will block Step 2 (switch-role). We FORCE it to our selected target locally.
      queryClient.setQueryData(["user"], (old: any) => {
        const base = data.user || old || {};
        return {
          ...base,
          academyRole: variables.role.toUpperCase(), // Sync flat property
          academyUser: {
            ...(base.academyUser || {}),
            role: variables.role.toUpperCase(), // Sync nested object
          },
        };
      });
    },
    onError: (error: ApiError) => {
      const message =
        error.response?.data?.message || "Failed to select academy role";
      toast.error(message);
    },
  });
};

export const useSwitchAcademyRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleData: { newRole: "student" | "instructor" }) =>
      authService.switchAcademyRole(roleData),
    onSuccess: (
      data: any,
      variables: { newRole: "student" | "instructor" },
    ) => {
      // Adopt new tokens if returned
      if (data.accessToken) {
        const currentRefresh =
          data.refreshToken || localStorage.getItem("refreshToken") || "";
        const existingUser = queryClient.getQueryData(["user"]) || {};
        authService.setSession(
          data.accessToken,
          currentRefresh,
          data.user || existingUser,
        );
      }

      // Update user data in cache
      queryClient.setQueryData(["user"], (old: any) => {
        const base = data.user || old || {};
        return {
          ...base,
          academyUser: {
            ...(base.academyUser || {}),
            activeRole: variables.newRole, // Manually ensure the active role reflects our switch
          },
        };
      });

      // Clear chat cache so the new role fetches its own contacts/conversations
      queryClient.removeQueries({ queryKey: ["chat"] });
    },
    onError: (error: ApiError) => {
      const message =
        error.response?.data?.message || "Failed to switch academy role";
      toast.error(message);
    },
  });
};

export const useApplyInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationData: InstructorApplicationRequest) =>
      authService.applyInstructor(applicationData),
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      // Invalidate the user query to re-fetch and see the new status
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error: ApiError) => {
      const message =
        error.response?.data?.message || "Failed to submit application";
      toast.error(message);
    },
  });
};

export const useUploadResume = () => {
  return useMutation({
    mutationFn: (file: File) => authService.uploadResume(file),
    onError: (error: ApiError) => {
      const message =
        error.response?.data?.message || "Failed to upload resume";
      toast.error(message);
    },
  });
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ["all-users"],
    queryFn: () => authService.getAllUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: { email: string }) => authService.forgotPassword(data),
    onSuccess: () => {
      toast.success(
        "If the email exists, a password reset link has been sent.",
      );
    },
    onError: (error: ApiError) => {
      const message =
        error.response?.data?.message ||
        "Failed to request password reset. Please try again.";
      toast.error(message);
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: { token: string; newPassword: string }) =>
      authService.resetPassword(data),
    onSuccess: () => {
      toast.success("Password reset successful!");
    },
    onError: (error: ApiError) => {
      const message =
        error.response?.data?.message ||
        "Failed to reset password. Please try again.";
      toast.error(message);
    },
  });
};
