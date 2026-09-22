import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as zod from "zod";
import { Loader2, CheckCircle2, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect,  useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AuthLayout from "@/features/auth/components/AuthLayout";
import PasswordInput from "@/features/auth/components/PasswordInput";
import { useResetPassword } from "@/features/auth/hooks/useAuth";

// Brand tokens — shared with ForgotPasswordPage. Swap for Tailwind config
// `primary` / `accent` values once they're wired up.
const BRAND_PRIMARY = "#0095DA";
const BRAND_ACCENT = "#F37E28";
const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_ACCENT} 100%)`;
// Used specifically for "Back to Sign In" links and input focus rings —
// a deeper, more muted blue than BRAND_PRIMARY so these secondary/utility
// elements sit quietly beneath the gradient CTA and badge.
const BRAND_LINK = "#2C5F96";

const passwordChecks = [
  { label: "At least 6 characters", test: (p: string) => p.length >= 6 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

const resetPasswordSchema = zod
  .object({
    newPassword: zod
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: zod.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = zod.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate: resetPassword, isPending } = useResetPassword();
  const [isSuccess, setIsSuccess] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const token = searchParams.get("token") ?? "";

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const passwordValue = form.watch("newPassword");

  const onSubmit = (values: ResetPasswordFormValues) => {
    resetPassword(
      {
        token,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
      },
    );
  };

  // Redirect to login after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <AuthLayout
      heading={isSuccess ? "Password reset!" : "Reset your password"}
      subheading={
        isSuccess ? undefined : "Choose a new password for your account."
      }
    >
      {/* Icon badge — gradient ring echoes the logomark's blue-to-orange sweep */}
      <div className="mb-6 flex justify-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full p-[2px]"
          style={{ background: BRAND_GRADIENT }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
            {isSuccess ? (
              <CheckCircle2
                className="h-9 w-9"
                style={{ color: BRAND_ACCENT }}
                aria-hidden="true"
              />
            ) : (
              <KeyRound
                className="h-9 w-9"
                style={{ color: BRAND_PRIMARY }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-6 text-center"
            role="status"
            aria-live="polite"
          >
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your password has been reset successfully. You'll be redirected
                to sign in shortly.
              </p>
            </div>

            {/* Animated countdown bar */}
            <div className="relative h-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: BRAND_GRADIENT }}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 3, ease: "linear" }
                }
              />
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-80"
              style={{ color: BRAND_LINK }}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Go to Sign In now
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Create a strong password"
                          autoComplete="new-password"
                          className="h-11 rounded-lg border-input bg-white transition-colors focus-visible:ring-2 sm:h-12"
                          style={
                            {
                              "--tw-ring-color": `${BRAND_LINK}66`,
                            } as React.CSSProperties
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />

                      {/* Password strength checklist */}
                      {passwordValue.length > 0 && (
                        <motion.div
                          initial={
                            shouldReduceMotion
                              ? false
                              : { height: 0, opacity: 0 }
                          }
                          animate={{ height: "auto", opacity: 1 }}
                          className="space-y-1 pt-1"
                        >
                          {passwordChecks.map((c) => {
                            const met = c.test(passwordValue);
                            return (
                              <div
                                key={c.label}
                                className="flex items-center gap-2 text-xs"
                              >
                                <CheckCircle2
                                  className="h-3.5 w-3.5 shrink-0 transition-colors"
                                  style={{
                                    color: met ? BRAND_ACCENT : undefined,
                                  }}
                                  aria-hidden="true"
                                />
                                <span
                                  className={
                                    met
                                      ? "text-foreground"
                                      : "text-muted-foreground/70"
                                  }
                                >
                                  {c.label}
                                </span>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Repeat your new password"
                          autoComplete="new-password"
                          className="h-11 rounded-lg border-input bg-white transition-colors focus-visible:ring-2 sm:h-12"
                          style={
                            {
                              "--tw-ring-color": `${BRAND_LINK}66`,
                            } as React.CSSProperties
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-1">
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-lg text-base font-bold text-white shadow-md shadow-black/10 transition-opacity hover:opacity-90 active:opacity-80 sm:h-12"
                    style={{ background: BRAND_GRADIENT }}
                    disabled={isPending}
                    aria-busy={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2
                          className="mr-2 h-5 w-5 animate-spin"
                          aria-hidden="true"
                        />
                        Resetting…
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
                        Reset Password
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-80"
                      style={{ color: BRAND_LINK }}
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      Back to Sign In
                    </Link>
                  </div>
                </div>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
