import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as zod from "zod";
import { Loader2, Mail, ArrowLeft, CheckCircle2, GraduationCap } from "lucide-react";
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
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { useForgotPassword } from "@/features/auth/hooks/useAuth";

const forgotPasswordSchema = zod.object({
  email: zod.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

type ForgotPasswordFormValues = zod.infer<typeof forgotPasswordSchema>;

// Brand tokens — swap these for your Tailwind config's `primary` / `accent`
// values once they're wired up, so this file can drop the arbitrary hex.
// The gradient mirrors the diagonal blue → orange sweep in the Aliko "A" logomark,
// so any brand-forward surface (CTA, icon badge) uses the same sweep rather than
// a single flat color.
const BRAND_PRIMARY = "#0A65A0";
const BRAND_ACCENT = "#D77510";
const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_ACCENT} 100%)`;
const BRAND_LINK = "#0A65A0";

// Cooldown (seconds) before a resend can be requested, to discourage spamming
// the reset endpoint and to give the user clear feedback that something happened.
const RESEND_COOLDOWN = 30;

const ForgotPasswordPage = () => {
  const { mutate: forgotPassword, isPending } = useForgotPassword();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = (values: ForgotPasswordFormValues) => {
    forgotPassword(values, {
      onSuccess: () => {
        setSubmittedEmail(values.email);
        setIsSubmitted(true);
        setCooldown(RESEND_COOLDOWN);
      },
    });
  };

  const handleTryAnotherEmail = () => {
    setIsSubmitted(false);
    form.reset();
    requestAnimationFrame(() => emailInputRef.current?.focus());
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    forgotPassword(
      { email: submittedEmail },
      {
        onSuccess: () => setCooldown(RESEND_COOLDOWN),
      }
    );
  };

  return (
    <AuthLayout
      heading={isSubmitted ? "Check your email" : "Forgot your password?"}
      subheading={
        isSubmitted
          ? undefined
          : "Enter your email address and we'll send you instructions to reset your password."
      }
    >
      {/* Icon badge — gradient ring echoes the logomark's blue-to-orange sweep */}
      <div className="mb-6 flex justify-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full p-[2px]"
          style={{ background: BRAND_GRADIENT }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
            {isSubmitted ? (
              <CheckCircle2 className="h-9 w-9" style={{ color: BRAND_ACCENT }} aria-hidden="true" />
            ) : (
              <GraduationCap className="h-9 w-9" style={{ color: BRAND_PRIMARY }} aria-hidden="true" />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSubmitted ? (
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
                We've sent a password reset link to{" "}
                <span className="font-semibold text-foreground">{submittedEmail}</span>.
              </p>
              <p className="text-xs text-muted-foreground/70">
                The link expires in 15 minutes. Be sure to check your spam folder.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="button"
                className="h-11 w-full font-medium text-white shadow-md shadow-black/10 transition-opacity hover:opacity-90 active:opacity-80 sm:h-12"
                style={{ background: BRAND_GRADIENT }}
                onClick={handleResend}
                disabled={isPending || cooldown > 0}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : cooldown > 0 ? (
                  `Resend link in ${cooldown}s`
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                    Resend Link
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleTryAnotherEmail}
                className="w-full text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Use a different email
              </button>

              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: BRAND_LINK }}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Sign In
              </Link>
            </div>
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
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"
                            aria-hidden="true"
                          />
                          <Input
                            type="email"
                            placeholder="name@company.com"
                            autoComplete="email"
                            autoFocus
                            autoCapitalize="none"
                            spellCheck={false}
                            className="h-11 rounded-lg border-input bg-white pl-10 transition-colors focus-visible:ring-2 sm:h-12"
                            style={
                              {
                                "--tw-ring-color": `${BRAND_LINK}66`,
                              } as React.CSSProperties
                            }
                            {...field}
                            ref={(el) => {
                              field.ref(el);
                              emailInputRef.current = el;
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-1">
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-lg text-base font-medium text-white shadow-md shadow-black/10 transition-opacity hover:opacity-90 active:opacity-80 sm:h-12"
                    style={{ background: BRAND_GRADIENT }}
                    disabled={isPending}
                    aria-busy={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                        Sending…
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <div className="text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
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

export default ForgotPasswordPage;
