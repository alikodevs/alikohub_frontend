import React from "react";
import { cn } from "@/lib/utils";

export type MasteryLevel =
  | "NOT_STARTED"
  | "ATTEMPTED"
  | "PRACTICING"
  | "PROFICIENT"
  | "CHECKED_OFF";

const LEVEL_MAP: Record<MasteryLevel, { step: number; label: string; color: string; bg: string }> = {
  NOT_STARTED: {
    step: 0,
    label: "Not started",
    color: "text-slate-500",
    bg: "bg-slate-200",
  },
  ATTEMPTED: {
    step: 1,
    label: "Attempted",
    color: "text-sky-600",
    bg: "bg-sky-500",
  },
  PRACTICING: {
    step: 2,
    label: "Practicing",
    color: "text-amber-600",
    bg: "bg-amber-500",
  },
  PROFICIENT: {
    step: 3,
    label: "Proficient",
    color: "text-violet-600",
    bg: "bg-violet-500",
  },
  CHECKED_OFF: {
    step: 4,
    label: "Checked off",
    color: "text-emerald-600",
    bg: "bg-emerald-500",
  },
};

export interface MasteryBarProps {
  level: MasteryLevel | number;
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const MasteryBar: React.FC<MasteryBarProps> = ({
  level,
  showLabel = false,
  className,
  size = "md",
}) => {
  let stepIndex = 0;
  let currentLevel: MasteryLevel = "NOT_STARTED";

  if (typeof level === "number") {
    stepIndex = Math.max(0, Math.min(4, Math.floor(level)));
    const keys: MasteryLevel[] = [
      "NOT_STARTED",
      "ATTEMPTED",
      "PRACTICING",
      "PROFICIENT",
      "CHECKED_OFF",
    ];
    currentLevel = keys[stepIndex];
  } else if (level && LEVEL_MAP[level]) {
    currentLevel = level;
    stepIndex = LEVEL_MAP[level].step;
  }

  const info = LEVEL_MAP[currentLevel];

  const heightClass = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-2.5",
  }[size];

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <div className="grid grid-cols-4 gap-1.5 w-full">
        {[1, 2, 3, 4].map((step) => {
          const isActive = stepIndex >= step;
          return (
            <div
              key={step}
              className={cn(
                "rounded-full transition-all duration-300",
                heightClass,
                isActive ? info.bg : "bg-slate-200"
              )}
            />
          );
        })}
      </div>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className={cn("font-medium", info.color)}>{info.label}</span>
          <span className="text-slate-400 text-[11px] font-normal">
            {stepIndex}/4 steps
          </span>
        </div>
      )}
    </div>
  );
};

export default MasteryBar;

