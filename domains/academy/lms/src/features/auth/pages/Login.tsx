import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as zod from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLogin, useUser } from "@/features/auth/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import AuthLayout from "@/features/auth/components/AuthLayout";
import PasswordInput from "@/features/auth/components/PasswordInput";
import GoogleButton from "@/features/auth/components/GoogleButton";
import { toast } from "sonner";

const loginSchema = zod.object({
  email: zod.string().email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

const LoginPage = () => {
  const { mutate: login, isPending } = useLogin();
  const { data: user, isLoading, isFetched } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("expired") === "1") {
      toast.info("Your session has expired. Please sign in again.");
    }
  }, []);

  useEffect(() => {
    if (user) {
      const isInstructor =
        user.globalRole === "ADMIN" ||
        user.academyUser?.role === "INSTRUCTOR" ||
        user.roleStatus?.instructor?.toUpperCase() === "ACTIVE" ||
        user.instructorStatus?.toUpperCase() === "ACTIVE";

      if (user.globalRole === "ADMIN") {
        navigate("/admin");
      } else if (isInstructor) {
        navigate("/instructor");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    login(values);
  };

  if (isLoading || !isFetched) return null;

  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Sign in to continue your learning journey"
    >
      <Form {...form}>
        <motion.form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-[30px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold">
                  Email address
                </FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-11 sm:h-12 bg-white/50 backdrop-blur-sm transition-all focus:bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-semibold">
                    Password
                  </FormLabel>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary font-bold hover:underline transition-all"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    id="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-11 sm:h-12 bg-white/50 backdrop-blur-sm transition-all focus:bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2 space-y-6">
            <Button
              type="submit"
              className="w-full h-11 sm:h-12 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[12px] uppercase tracking-[0.1em]">
                <span className="bg-white/80 backdrop-blur-sm px-4 text-muted-foreground/60 font-bold uppercase">
                  OR
                </span>
              </div>
            </div>

            <GoogleButton label="Continue with Google" />
          </div>

          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary font-bold hover:text-primary/80 transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </motion.form>
      </Form>
    </AuthLayout>
  );
};

export default LoginPage;
