import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F6F8FA] px-6">
      {/* Ambient brand glow */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#1B6FA8]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-[#E0890D]/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
          😕
        </div>

        <p className="mb-1 text-3xl font-heading font-bold tracking-tight text-slate-800">
          Error 404
        </p>
        <p className="mb-4 text-lg font-semibold text-slate-700">
          Page not found
        </p>

        <p className="mb-8 text-sm leading-relaxed text-slate-500">
          The page has been moved, renamed, or never existed. Let&apos;s get you
          back on track.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="gap-2 bg-[#1B6FA8] px-6 text-white hover:bg-[#15577F]"
          >
            <a href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </a>
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-slate-300 px-6 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
