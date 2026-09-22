import {
  Receipt,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock3,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StudentLayout from "@/features/student/components/StudentLayout";
import { useMyTransactions } from "@/hooks/useAcademy";

// ── Helpers ──────────────────────────────────────────────────────────────────
type TxStatus = "PENDING" | "COMPLETED" | "FAILED";

const STATUS_CONFIG: Record<
  TxStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    dot: string;
  }
> = {
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  PENDING: {
    label: "Pending",
    icon: Clock3,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount,
  );

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const PROVIDER_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  STRIPE: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  CHAPA: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  PAYPAL: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
};

const providerStyle = (provider: string) =>
  PROVIDER_COLORS[provider?.toUpperCase()] ?? {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  };

// ── Component ─────────────────────────────────────────────────────────────────
const TransactionsPage = () => {
  const { data: transactions, isLoading, isError } = useMyTransactions();

  // Filter out free course enrollments (amount === 0)
  const paidTransactions = transactions?.filter(
    (t: any) => Number(t.amount) > 0,
  );

  const completed =
    paidTransactions?.filter((t: any) => t.status === "COMPLETED").length ?? 0;
  const pending =
    paidTransactions?.filter((t: any) => t.status === "PENDING").length ?? 0;
  const failed =
    paidTransactions?.filter((t: any) => t.status === "FAILED").length ?? 0;
  const totalSpent =
    paidTransactions
      ?.filter((t: any) => t.status === "COMPLETED")
      .reduce((sum: number, t: any) => sum + t.amount, 0) ?? 0;
  const currency =
    paidTransactions?.find((t: any) => t.status === "COMPLETED")?.currency ??
    "USD";

  return (
    <StudentLayout>
      <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-10 py-6 sm:py-8">
        <div className="max-w-4xl space-y-6">
        {/* ── Header ── */}
        <div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 gap-1.5 text-muted-foreground"
          >
            <Link to="/dashboard">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
                <Receipt className="w-6 h-6 text-primary" />
                Transaction History
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                A full record of all your payments on Aliko Academy.
              </p>
            </div>

            {/* Total badge */}
            {!isLoading && !isError && paidTransactions?.length > 0 && (
              <div
                className="rounded-xl px-5 py-3 text-white shrink-0"
                style={{ backgroundColor: "#081830" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-0.5">
                  Total paid
                </p>
                <p className="text-lg font-heading font-bold leading-none">
                  {formatCurrency(totalSpent, currency)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Summary chips ── */}
        {!isLoading && !isError && paidTransactions?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {[
              { count: completed, ...STATUS_CONFIG.COMPLETED },
              { count: pending, ...STATUS_CONFIG.PENDING },
              { count: failed, ...STATUS_CONFIG.FAILED },
            ].map((s) => (
              <span
                key={s.label}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${s.bg} ${s.color} ${s.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {s.count} {s.label}
              </span>
            ))}
          </div>
        )}

        {/* ── Body ── */}
        {isLoading ? (
          <div className="space-y-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
          </div>
        ) : isError ? (
          <div className="bg-card border rounded-2xl flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <XCircle className="w-7 h-7 text-rose-500" />
            </div>
            <p className="font-heading font-semibold text-foreground mb-1">
              Failed to load transactions
            </p>
            <p className="text-sm text-muted-foreground">
              Please check your connection and try again.
            </p>
          </div>
        ) : !paidTransactions || paidTransactions.length === 0 ? (
          <div className="bg-card border rounded-2xl flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-heading font-semibold text-foreground mb-1">
              No transactions yet
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Enroll in a course to see your payment history here.
            </p>
            <Button asChild size="sm">
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paidTransactions.map((tx: any) => {
              const cfg =
                STATUS_CONFIG[tx.status as TxStatus] ?? STATUS_CONFIG.PENDING;
              const StatusIcon = cfg.icon;
              const pvdr = providerStyle(tx.provider);

              return (
                <div
                  key={tx.id}
                  className="bg-card border rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all duration-200 group"
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    style={{ backgroundColor: "#EEF2FF" }}
                  >
                    <CreditCard
                      className="w-5 h-5"
                      style={{ color: "#6366f1" }}
                    />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-heading font-bold text-foreground leading-none">
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                      {/* Provider chip */}
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${pvdr.bg} ${pvdr.text} ${pvdr.border}`}
                      >
                        {tx.provider}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-muted-foreground mt-1 capitalize">
                      {tx.purpose.replace(/_/g, " ").toLowerCase()}
                    </p>

                    {tx.reference && (
                      <p className="text-[11px] text-muted-foreground/60 font-mono mt-0.5 truncate">
                        Ref: {tx.reference}
                      </p>
                    )}

                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl border shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default TransactionsPage;
