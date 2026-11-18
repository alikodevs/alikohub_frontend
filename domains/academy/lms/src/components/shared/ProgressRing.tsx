import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  percentage: number;
  value?: string | number;
  label?: string;
  sublabel?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  value,
  label,
  sublabel,
  color = "#0A65A0",
  size = 76,
  strokeWidth = 6.5,
  trackColor = "#E2E8F0",
  className,
  valueClassName,
  labelClassName,
}) => {
  const clampedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            className="transition-all"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-base font-semibold font-heading text-slate-800 leading-none", valueClassName)}>
            {value !== undefined ? value : `${clampedPercentage}%`}
          </span>
        </div>
      </div>

      {/* Label underneath */}
      {label && (
        <span className={cn("text-xs font-semibold text-slate-700 mt-2 leading-tight", labelClassName)}>
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[11px] text-slate-500 mt-0.5 leading-tight font-normal">
          {sublabel}
        </span>
      )}
    </div>
  );
};

export default ProgressRing;

