import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ArrowRight, X, ChevronLeft, Sparkles, BookOpen, PlaySquare, HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CelebrationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  isLastItem?: boolean;
  onClose: () => void;
  onContinue: () => void;
  courseTitle?: string;
  lessonTitle?: string;
  nextItemTitle?: string;
  nextItemType?: string;
  progressPercent?: number;
  completedCount?: number;
  totalCount?: number;
  seatTimeHours?: string;
}

function generateParticles() {
  const colors = [
    "bg-[#F16A1C]", // Aliko Orange
    "bg-[#10B981]", // Emerald
    "bg-[#0A65A0]", // Primary Blue
    "bg-[#8B5CF6]", // Violet
    "bg-[#F59E0B]", // Amber
  ];
  return [...Array(24)].map((_, i) => ({
    id: i,
    colorClass: colors[Math.floor(Math.random() * colors.length)],
    targetX: `${Math.random() * 100}%`,
    targetY: `${Math.random() * 100}%`,
    targetScale: Math.random() * 0.6 + 0.3,
    rotate: Math.random() * 360,
    duration: Math.random() * 1.3 + 0.8,
    delay: Math.random() * 0.2,
  }));
}

export default function CelebrationModal({
  isOpen,
  title,
  message,
  isLastItem,
  onClose,
  onContinue,
  courseTitle,
  lessonTitle,
  nextItemTitle,
  nextItemType,
  progressPercent = 0,
  completedCount,
  totalCount,
  seatTimeHours,
}: CelebrationModalProps) {
  const particles = useMemo(() => {
    if (!isOpen) return [];
    return generateParticles();
  }, [isOpen]);

  const displayTitle = useMemo(() => {
    if (!title) return "Lesson complete!";
    if (title.toLowerCase().includes("complete") || title.toLowerCase().includes("mastered")) {
      return title;
    }
    return `${title} complete!`;
  }, [title]);

  const displaySubtitle = useMemo(() => {
    if (lessonTitle && courseTitle) {
      return `${lessonTitle} · ${courseTitle}`;
    }
    return message || courseTitle || "Great work completing this lesson!";
  }, [lessonTitle, courseTitle, message]);

  const renderNextIcon = () => {
    switch (nextItemType?.toLowerCase()) {
      case "video":
        return <PlaySquare className="w-5 h-5 text-white" />;
      case "quiz":
        return <HelpCircle className="w-5 h-5 text-white" />;
      case "discussion":
        return <MessageSquare className="w-5 h-5 text-white" />;
      default:
        return <BookOpen className="w-5 h-5 text-white" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.25 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden z-10"
          >
            {/* Confetti particles */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: "50%", y: "35%", scale: 0, opacity: 1 }}
                animate={{
                  x: p.targetX,
                  y: p.targetY,
                  scale: p.targetScale,
                  opacity: 0,
                  rotate: p.rotate,
                }}
                transition={{
                  duration: p.duration,
                  ease: "easeOut",
                  delay: p.delay,
                }}
                className={cn(
                  "absolute w-2 h-2 rounded-xs pointer-events-none",
                  p.colorClass,
                )}
                style={{ top: 0, left: 0 }}
              />
            ))}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 pt-9 flex flex-col items-center text-center">
              {/* Green Check Circle with mint halo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  duration: 0.5,
                  bounce: 0.4,
                  delay: 0.1,
                }}
                className="w-14 h-14 rounded-full bg-[#10B981] flex items-center justify-center text-white ring-6 ring-emerald-100 shadow-sm mb-4"
              >
                <Check className="w-7 h-7 stroke-[2.5]" />
              </motion.div>

              {/* Title & Subtitle */}
              <motion.h2
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-xl sm:text-2xl font-heading font-bold text-slate-900 mb-1 tracking-tight"
              >
                {displayTitle}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xs text-slate-500 font-medium mb-5 max-w-sm truncate"
              >
                {displaySubtitle}
              </motion.p>

              {/* 3 Dynamic Stats Cards (Zero hardcoded values) */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-3 gap-2.5 w-full mb-5"
              >
                {/* Stat 1: Time Logged */}
                <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-2xl p-2.5 flex flex-col items-center text-center">
                  <div className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                    {seatTimeHours ? `${seatTimeHours}h` : "Active"}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Time logged
                  </span>
                </div>

                {/* Stat 2: Dynamic Course Progress */}
                <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-2xl p-2.5 flex flex-col items-center text-center">
                  <div className="text-sm sm:text-base font-bold text-[#0A65A0] font-heading">
                    {progressPercent}%
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Progress
                  </span>
                </div>

                {/* Stat 3: Lessons Completed */}
                <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-2xl p-2.5 flex flex-col items-center text-center">
                  <div className="text-sm sm:text-base font-bold text-[#F16A1C] font-heading">
                    {completedCount !== undefined && totalCount !== undefined
                      ? `${completedCount}/${totalCount}`
                      : "Saved"}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Lessons done
                  </span>
                </div>
              </motion.div>

              {/* UP NEXT Card (Only if next item actually exists) */}
              {!isLastItem && nextItemTitle && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-3.5 mb-5 text-left"
                >
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1.5">
                    UP NEXT
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
                      {renderNextIcon()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate m-0 font-heading">
                        {nextItemTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate m-0 mt-0.5 capitalize">
                        {nextItemType ? `${nextItemType} module item` : "Next item in sequence"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons: concise text, no overflow */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="w-full flex items-center gap-2.5"
              >
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft size={15} />
                  Back
                </Button>
                <Button
                  onClick={onContinue}
                  className="flex-1 h-10 rounded-xl bg-[#F16A1C] hover:bg-[#D75812] text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isLastItem ? "Dashboard" : "Continue"}
                  <ArrowRight size={15} />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
