import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

interface User {
  id: number;
  firebaseId: string;
  email: string;
  firstname: string;
  lastname?: string;
  globalRole: string;
  academyRole?: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null; cancelled?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/users/profile");
      const userData = response.data;
      setUser(userData);
      setIsAdmin(userData.globalRole === "ADMIN");
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, user: userData } = response.data;
      localStorage.setItem("token", accessToken);
      setUser(userData);
      setIsAdmin(userData.globalRole === "ADMIN");
      return { error: null };
    } catch (error: any) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const [firstname, ...lastnameParts] = fullName.split(" ");
      const lastname = lastnameParts.join(" ");
      await api.post("/auth/register", {
        email,
        password,
        firstname,
        lastname,
      });
      return { error: null };
    } catch (error: any) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { signInWithPopup } = await import("firebase/auth");
      const { auth, googleProvider } = await import("@/lib/firebase");

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await api.post("/auth/login/google", {
        idToken,
      });
      const { accessToken, user: userData } = response.data;
      if (accessToken) {
        localStorage.setItem("token", accessToken);
      }
      setUser(userData);
      setIsAdmin(userData?.globalRole === "ADMIN");
      return { error: null, cancelled: false };
    } catch (error: any) {
      const code = error?.code || error?.message || "";
      if (
        code.includes("popup-closed-by-user") ||
        code.includes("cancelled-popup-request") ||
        code.includes("popup-blocked")
      ) {
        return { error: null, cancelled: true };
      }
      console.error("Google sign-in application error:", error);
      return { error: error as Error, cancelled: false };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
