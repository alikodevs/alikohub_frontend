import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Trophy, Award, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CelebrationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  isLastItem?: boolean;
  onClose: () => void;
  onContinue: () => void;
}

function generateParticles() {
  const colors = [
    "bg-amber-400",
    "bg-emerald-400",
    "bg-blue-400",
    "bg-rose-400",
  ];
  return [...Array(30)].map((_, i) => ({
    id: i,
    colorClass: colors[Math.floor(Math.random() * colors.length)],
    targetX: `${Math.random() * 100}%`,
    targetY: `${Math.random() * 100}%`,
    targetScale: Math.random() * 0.8 + 0.2,
    rotate: Math.random() * 360,
    duration: Math.random() * 1.5 + 1,
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
}: CelebrationModalProps) {
  const particles = useMemo(() => {
    if (!isOpen) return [];
    return generateParticles();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
            className="relative w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-emerald-50/30 opacity-50 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Confetti / Particles Simulation */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                  opacity: 1,
                }}
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
                  "absolute w-2 h-2 rounded-full pointer-events-none",
                  p.colorClass,
                )}
                style={{ top: 0, left: 0 }}
              />
            ))}

            {/* Header / Dismiss */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="relative p-8 pt-12 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  duration: 0.8,
                  bounce: 0.5,
                  delay: 0.1,
                }}
                className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20"
              >
                {title.toLowerCase().includes("module") ? (
                  <Trophy size={36} className="text-white drop-shadow-md" />
                ) : (
                  <Award size={36} className="text-white drop-shadow-md" />
                )}

                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles
                    size={24}
                    className="text-emerald-400 drop-shadow-lg fill-emerald-100"
                  />
                </motion.div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-heading font-bold text-slate-900 mb-2 truncate max-w-full tracking-tight"
              >
                {title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 font-medium mb-8 leading-relaxed max-w-sm"
              >
                {message}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full flex"
              >
                <Button
                  onClick={onContinue}
                  className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                >
                  {isLastItem
                    ? "Back to Dashboard"
                    : title.toLowerCase().includes("module")
                      ? "Continue to Next Module"
                      : "Continue to Next Item"}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
