import api, { clearAuth } from "@/lib/api";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  SelectRoleRequest,
  SwitchRoleRequest,
  InstructorApplicationRequest,
  User,
} from "@/features/auth/types/auth";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", credentials);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        if (!error.response.data) error.response.data = {};
        error.response.data.message =
          "Too many login attempts. Please try again later.";
      }
      throw error;
    }
  },

  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login-google", {
      idToken,
    });
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      "/auth/register",
      credentials,
    );
    return response.data;
  },

  logout: () => {
    clearAuth();
  },

  setSession: (accessToken: string, refreshToken: string, user: any) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
  },

  getSession: () => {
    const accessToken = localStorage.getItem("accessToken");
    const userJson = localStorage.getItem("user");
    return {
      accessToken,
      user: userJson ? JSON.parse(userJson) : null,
    };
  },

  isTokenExpired: (token?: string | null): boolean => {
    const t = token || localStorage.getItem("accessToken");
    if (!t) return true;
    try {
      const parts = t.split(".");
      if (parts.length !== 3) return false;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      if (typeof payload.exp !== "number") return false;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return false;
    }
  },

  selectAcademyRole: async (roleData: SelectRoleRequest): Promise<any> => {
    const response = await api.post("/auth/academy/select-role", roleData);
    return response.data;
  },

  switchAcademyRole: async (roleData: SwitchRoleRequest): Promise<any> => {
    const response = await api.post("/auth/academy/switch-role", roleData);
    return response.data;
  },

  applyInstructor: async (
    applicationData: InstructorApplicationRequest,
  ): Promise<any> => {
    const response = await api.post(
      "/auth/academy/apply-teacher",
      applicationData,
    );
    return response.data;
  },

  uploadResume: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/upload/document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>("/profile");
    return response.data;
  },

  getUserAcademyStatus: async (userId: string): Promise<any> => {
    const response = await api.get(`/auth/academy/user-status/${userId}`);
    return response.data;
  },

  getAllUsers: async (): Promise<any[]> => {
    const response = await api.get<any[]>("/users");
    return response.data;
  },

  forgotPassword: async (data: { email: string }): Promise<any> => {
    const response = await api.post("/auth/forgot-password", data);
    return response.data;
  },

  resetPassword: async (data: {
    token: string;
    newPassword: string;
  }): Promise<any> => {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  },
};
