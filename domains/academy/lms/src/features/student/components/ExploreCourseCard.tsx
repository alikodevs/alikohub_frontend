import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Star,
  Users,
  BookOpen,
  ArrowRight,
  Sparkles,
  Stethoscope,
  Code2,
  Atom,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ExploreCourse {
  id: string | number;
  title: string;
  slug?: string;
  thumbnail?: string | null;
  category?: string | null;
  difficulty?: string | null;
  estimatedTime?: string | null;
  rating?: number | null;
  enrollmentCount?: number | null;
  enrolledCount?: number | null;
  enrolledNum?: number | null;
  modulesCount?: number | null;
  lessonsCount?: number | null;
  price?: number | null;
  currency?: string | null;
  isFree?: boolean;
  shortDescription?: string | null;
  description?: string | null;
  instructor?: {
    firstname?: string;
    lastname?: string;
    profilePicture?: string;
  } | null;
  featured?: boolean;
}

export interface ExploreCourseCardProps {
  course: ExploreCourse;
  className?: string;
}

/**
 * Returns category visual branding (badge color, dot indicator, icon, accent bar).
 */
export function getCategoryBadgeConfig(category?: string | null) {
  const cat = (category || "").toLowerCase();

  if (cat.includes("health") || cat.includes("medic") || cat.includes("cna")) {
    return {
      label: category || "Healthcare",
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-800",
      bgColor: "bg-emerald-50/90",
      borderColor: "border-emerald-200/70",
      accentBarColor: "bg-emerald-500",
      icon: Stethoscope,
    };
  }

  if (cat.includes("stem") || cat.includes("engineer")) {
    return {
      label: category || "STEM",
      dotColor: "bg-[#BF6622]",
      textColor: "text-[#9c4f14]",
      bgColor: "bg-amber-50/90",
      borderColor: "border-amber-200/70",
      accentBarColor: "bg-[#BF6622]",
      icon: Atom,
    };
  }

  if (cat.includes("tech") || cat.includes("software") || cat.includes("data")) {
    return {
      label: category || "Technology",
      dotColor: "bg-[#0D72BA]",
      textColor: "text-[#0D72BA]",
      bgColor: "bg-blue-50/90",
      borderColor: "border-blue-200/70",
      accentBarColor: "bg-[#0D72BA]",
      icon: Code2,
    };
  }

  return {
    label: category || "Professional",
    dotColor: "bg-slate-500",
    textColor: "text-slate-700",
    bgColor: "bg-slate-50/90",
    borderColor: "border-slate-200/70",
    accentBarColor: "bg-[#0D72BA]",
    icon: GraduationCap,
  };
}

/**
 * Returns formatted difficulty label and color scheme.
 */
export function getDifficultyConfig(difficulty?: string | null) {
  const diff = (difficulty || "").toUpperCase();

  if (diff === "BEGINNER") {
    return {
      label: "Beginner",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
      overlayClass: "bg-emerald-950/75 text-emerald-200 border-emerald-400/20",
    };
  }
  if (diff === "INTERMEDIATE") {
    return {
      label: "Intermediate",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200/70",
      overlayClass: "bg-blue-950/75 text-blue-200 border-blue-400/20",
    };
  }
  if (diff === "ADVANCED") {
    return {
      label: "Advanced",
      badgeClass: "bg-purple-50 text-purple-800 border-purple-200/70",
      overlayClass: "bg-purple-950/75 text-purple-200 border-purple-400/20",
    };
  }

  return {
    label: difficulty || "All Levels",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200/70",
    overlayClass: "bg-slate-900/65 text-slate-200 border-white/15",
  };
}

/**
 * ExploreCourseCard — Modern, accessible, premium course card component.
 * If course has a valid thumbnail, it renders the 16:9 media header.
 * Where image is not set, it displays the graduation hat icon and Aliko Academy branding.
 */
export const ExploreCourseCard: React.FC<ExploreCourseCardProps> = ({
  course,
  className,
}) => {
  const [imgError, setImgError] = useState(false);

  const categoryConfig = getCategoryBadgeConfig(course.category);
  const difficultyConfig = getDifficultyConfig(course.difficulty);

  const rawThumbnail = (course.thumbnail || "").trim();
  const hasValidThumbnail = Boolean(rawThumbnail && !imgError);

  const learnerCount =
    course.enrollmentCount ??
    course.enrolledCount ??
    course.enrolledNum ??
    0;

  const moduleOrLessonCount =
    course.modulesCount && course.modulesCount > 0
      ? `${course.modulesCount} modules`
      : course.lessonsCount && course.lessonsCount > 0
        ? `${course.lessonsCount} lessons`
        : null;

  const durationText = course.estimatedTime || "Self-paced";
  const ratingValue = course.rating ? Number(course.rating).toFixed(1) : "4.8";

  const courseLink = `/courses/${course.id}`;

  const instructorName = course.instructor
    ? `${course.instructor.firstname || ""} ${course.instructor.lastname || ""}`.trim()
    : null;

  const isFreeCourse =
    course.isFree || course.price === 0 || course.price === null;
  const priceDisplay = isFreeCourse
    ? "Free Track"
    : `${course.currency || "$"}${course.price}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-2xs",
        "transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-900/8 hover:border-slate-300",
        "overflow-hidden focus-within:ring-2 focus-within:ring-[#0D72BA]/30",
        className,
      )}
      aria-label={`Course: ${course.title}`}
    >
      {/* ── 16:9 Header Area ── */}
      <div className="relative w-full aspect-video overflow-hidden bg-slate-50 border-b border-slate-100">
        <Link
          to={courseLink}
          tabIndex={-1}
          className="block w-full h-full cursor-pointer relative"
          aria-hidden="true"
        >
          {hasValidThumbnail ? (
            <>
              <img
                src={rawThumbnail}
                alt={course.title}
                loading="lazy"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              {/* Scrim gradient for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent pointer-events-none" />
            </>
          ) : (
            /* Graduation hat icon + Aliko Academy text where image is not set */
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 select-none group-hover:bg-[#f0f6ff]/40 transition-colors"
              style={{
                background:
                  "linear-gradient(135deg, #f0f6ff 0%, #f8fafc 55%, #fff7ed 100%)",
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-blue-100/90 flex items-center justify-center text-[#0D72BA] group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <GraduationCap className="w-6 h-6 text-[#0D72BA]" />
              </div>
              <span className="text-xs font-heading font-semibold text-slate-700 tracking-wider uppercase">
                Aliko Academy
              </span>
            </div>
          )}
        </Link>

        {/* Floating Category Badge (Top-Left) */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide",
              "bg-white/95 backdrop-blur-md shadow-xs border border-white/80",
              categoryConfig.textColor,
            )}
          >
            {categoryConfig.label}
          </span>
        </div>

        {/* Floating Difficulty Tag (Top-Right) */}
        {course.difficulty && (
          <div className="absolute top-3 right-3 z-10 pointer-events-none">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide uppercase",
                hasValidThumbnail
                  ? cn("backdrop-blur-md shadow-2xs border", difficultyConfig.overlayClass)
                  : "bg-white/95 backdrop-blur-md shadow-xs border border-slate-200/80 text-slate-700",
              )}
            >
              {difficultyConfig.label}
            </span>
          </div>
        )}

        {/* Featured Pill */}
        {course.featured && (
          <div className="absolute bottom-2.5 left-3 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#BF6622] text-white shadow-xs">
              <Sparkles className="w-2.5 h-2.5" />
              Featured
            </span>
          </div>
        )}
      </div>

      {/* ── Card Content Body ── */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        {/* Title */}
        <Link
          to={courseLink}
          className="focus:outline-none focus:underline group/title block"
        >
          <h3
            className="font-heading font-semibold text-slate-900 text-base leading-snug line-clamp-2 min-h-[2.6rem] group-hover/title:text-[#0D72BA] transition-colors tracking-tight"
            title={course.title}
          >
            {course.title}
          </h3>
        </Link>

        {/* Short description snippet */}
        {(course.shortDescription || course.description) && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
            {course.shortDescription || course.description}
          </p>
        )}

        {/* Clean Metadata Icons */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-medium pt-3 mt-1">
          {/* Duration */}
          <span
            className="flex items-center gap-1.5"
            title={`Estimated completion: ${durationText}`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{durationText}</span>
          </span>

          {/* Module or lesson count */}
          {moduleOrLessonCount && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{moduleOrLessonCount}</span>
            </span>
          )}

          {/* Learners count */}
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {learnerCount > 0
                ? `${learnerCount.toLocaleString()} learners`
                : "Open cohort"}
            </span>
          </span>

          {/* Rating */}
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span>{ratingValue}</span>
          </span>
        </div>

        {/* Instructor line (if present) */}
        {instructorName && (
          <div className="flex items-center gap-2 pt-3 mt-2 text-xs text-slate-500 border-t border-slate-100/80">
            <span className="text-slate-400">By</span>
            <span className="font-medium text-slate-700 truncate">
              {instructorName}
            </span>
          </div>
        )}

        {/* ── Bottom Section: Price & Aligned CTA ── */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Access
            </span>
            <span
              className={cn(
                "text-xs font-bold",
                isFreeCourse ? "text-emerald-700" : "text-slate-900",
              )}
            >
              {priceDisplay}
            </span>
          </div>

          <Button
            asChild
            size="sm"
            className="bg-[#0D72BA] hover:bg-[#17469E] text-white font-semibold text-xs sm:text-sm h-9 px-4 rounded-xl gap-1.5 transition-all shadow-xs hover:shadow group/btn"
          >
            <Link to={courseLink}>
              View Course
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
};

/**
 * Skeleton placeholder for loading state.
 */
export const ExploreCourseCardSkeleton: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div
      className={cn(
        "flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <div className="relative w-full aspect-video bg-slate-100 animate-pulse">
        <div className="absolute top-3 left-3 w-20 h-5 bg-slate-200 rounded-full" />
        <div className="absolute top-3 right-3 w-16 h-4 bg-slate-200 rounded-md" />
      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-1 space-y-3">
        <Skeleton className="h-5 w-4/5 rounded-md" />
        <Skeleton className="h-4 w-3/5 rounded-md" />

        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-3.5 w-16 rounded-md" />
          <Skeleton className="h-3.5 w-16 rounded-md" />
          <Skeleton className="h-3.5 w-12 rounded-md" />
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
