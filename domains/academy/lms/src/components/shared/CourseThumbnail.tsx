import React from "react";
import {
  Stethoscope,
  Ruler,
  Cpu,
  Heart,
  HardHat,
  BookOpen,
  GraduationCap,
  Syringe,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DisciplineType =
  | "healthcare"
  | "stem"
  | "technology"
  | "nutrition"
  | "safety"
  | "general";

interface DisciplineStyle {
  bgGradient: string;
  bgColor: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
}

const DISCIPLINE_MAP: Record<DisciplineType, DisciplineStyle> = {
  healthcare: {
    bgGradient: "bg-gradient-to-br from-rose-500 to-pink-600",
    bgColor: "bg-rose-500",
    icon: Stethoscope,
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    badgeText: "Healthcare",
  },
  stem: {
    bgGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
    bgColor: "bg-sky-500",
    icon: Ruler,
    badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
    badgeText: "STEM",
  },
  technology: {
    bgGradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-500",
    icon: Cpu,
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "Technology",
  },
  nutrition: {
    bgGradient: "bg-gradient-to-br from-emerald-500 to-green-600",
    bgColor: "bg-emerald-500",
    icon: Heart,
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "Health",
  },
  safety: {
    bgGradient: "bg-gradient-to-br from-amber-500 to-orange-500",
    bgColor: "bg-amber-500",
    icon: HardHat,
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeText: "Safety",
  },
  general: {
    bgGradient: "bg-gradient-to-br from-[#0A65A0] to-[#084B78]",
    bgColor: "bg-[#0A65A0]",
    icon: GraduationCap,
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeText: "General",
  },
};

export function detectDiscipline(category?: string | null, title?: string | null): DisciplineType {
  const text = `${category || ""} ${title || ""}`.toLowerCase();

  if (text.includes("nutrition") || text.includes("hydration") || text.includes("diet")) {
    return "nutrition";
  }
  if (
    text.includes("nursing") ||
    text.includes("cna") ||
    text.includes("patient") ||
    text.includes("phlebotomy") ||
    text.includes("health") ||
    text.includes("infection") ||
    text.includes("clinic")
  ) {
    return "healthcare";
  }
  if (
    text.includes("autocad") ||
    text.includes("civil") ||
    text.includes("stem") ||
    text.includes("engineering") ||
    text.includes("corridor")
  ) {
    return "stem";
  }
  if (
    text.includes("python") ||
    text.includes("data") ||
    text.includes("tech") ||
    text.includes("code") ||
    text.includes("software") ||
    text.includes("digital literacy")
  ) {
    return "technology";
  }
  if (text.includes("osha") || text.includes("safety") || text.includes("construction")) {
    return "safety";
  }
  return "general";
}

export interface CourseThumbnailProps {
  thumbnail?: string | null;
  category?: string | null;
  title?: string | null;
  discipline?: DisciplineType;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  iconClassName?: string;
  rounded?: "md" | "lg" | "xl" | "2xl" | "full";
}

const SIZE_MAP = {
  xs: { box: "w-8 h-8", icon: "w-4 h-4" },
  sm: { box: "w-10 h-10", icon: "w-5 h-5" },
  md: { box: "w-12 h-12", icon: "w-6 h-6" },
  lg: { box: "w-16 h-16", icon: "w-8 h-8" },
  xl: { box: "w-20 h-20", icon: "w-10 h-10" },
};

const ROUNDED_MAP = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export const CourseThumbnail: React.FC<CourseThumbnailProps> = ({
  thumbnail,
  category,
  title,
  discipline,
  size = "md",
  className,
  iconClassName,
  rounded = "xl",
}) => {
  const chosenDiscipline = discipline || detectDiscipline(category, title);
  const style = DISCIPLINE_MAP[chosenDiscipline];
  const Icon = style.icon;
  const sizeConfig = SIZE_MAP[size];
  const roundedClass = ROUNDED_MAP[rounded];

  if (thumbnail && !thumbnail.includes("placeholder") && !thumbnail.includes("default")) {
    return (
      <div
        className={cn(
          sizeConfig.box,
          roundedClass,
          "overflow-hidden shrink-0 border border-slate-200/80 bg-slate-100 flex items-center justify-center",
          className
        )}
      >
        <img
          src={thumbnail}
          alt={title || "Course thumbnail"}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to discipline thumbnail on load error
            (e.currentTarget as HTMLElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeConfig.box,
        roundedClass,
        style.bgGradient,
        "flex items-center justify-center shrink-0 shadow-sm text-white",
        className
      )}
    >
      <Icon className={cn(sizeConfig.icon, "text-white stroke-[2.2]", iconClassName)} />
    </div>
  );
};

export default CourseThumbnail;
