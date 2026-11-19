import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Star,
  Users,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CourseThumbnail, detectDiscipline } from "@/components/shared/CourseThumbnail";

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
  stateApproved?: boolean;
}

export interface ExploreCourseCardProps {
  course: ExploreCourse;
  className?: string;
}

/**
 * Returns formatted discipline badge config based on category/title
 */
export function getDisciplineBadge(discipline: string) {
  switch (discipline) {
    case "healthcare":
      return { label: "Healthcare", className: "bg-rose-50 text-[#BE123C] border-rose-200" };
    case "stem":
      return { label: "STEM", className: "bg-sky-50 text-[#0369A1] border-sky-200" };
    case "technology":
      return { label: "Technology", className: "bg-emerald-50 text-[#047857] border-emerald-200" };
    case "nutrition":
      return { label: "Health", className: "bg-rose-50 text-[#BE123C] border-rose-200" };
    case "safety":
      return { label: "Safety", className: "bg-amber-50 text-[#B45309] border-amber-200" };
    default:
      return { label: "General", className: "bg-blue-50 text-[#1D4ED8] border-blue-200" };
  }
}

/**
 * ExploreCourseCard — V2 4-Column Design System Card
 * Matches Page 12/13 of AlikoHub_LMS_UIUX_Redesign_v2.pdf
 */
export const ExploreCourseCard: React.FC<ExploreCourseCardProps> = ({
  course,
  className,
}) => {
  const [imgError, setImgError] = useState(false);

  const discipline = detectDiscipline(course.category, course.title);
  const badgeConfig = getDisciplineBadge(discipline);

  const rawThumbnail = (course.thumbnail || "").trim();
  const hasValidThumbnail = Boolean(
    rawThumbnail && !imgError && !rawThumbnail.includes("placeholder")
  );

  const learnerCount =
    course.enrollmentCount ??
    course.enrolledCount ??
    course.enrolledNum ??
    0;

  const durationText = course.estimatedTime || "Self-paced";
  const ratingValue = course.rating ? Number(course.rating).toFixed(1) : "4.8";

  const courseLink = `/courses/${course.id}`;

  const isFreeCourse =
    course.isFree || course.price === 0 || course.price === null;
  const isStateApproved =
    course.stateApproved ||
    (course.title && /WA\s|CNA|Nursing\sAssistant|State\sApproved/i.test(course.title));

  const priceOrBadgeLabel = isFreeCourse
    ? "Free"
    : isStateApproved
    ? "State approved"
    : course.price
    ? `${course.currency || "$"}${course.price}`
    : "Certificate";

  const difficultyLabel = course.difficulty
    ? course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1).toLowerCase()
    : "All levels";

  return (
    <article
      className={cn(
        "group relative flex flex-col bg-white rounded-2xl border border-[#E1E7F1] shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden",
        className
      )}
      aria-label={`Course: ${course.title}`}
    >
      {/* ── 1. Thumbnail Header (Subject-Colored Gradient or Real Image) ── */}
      <div className="relative w-full h-28 sm:h-32 overflow-hidden bg-slate-100 flex items-center justify-center">
        <Link
          to={courseLink}
          tabIndex={-1}
          className="block w-full h-full cursor-pointer relative"
          aria-hidden="true"
        >
          {hasValidThumbnail ? (
            <img
              src={rawThumbnail}
              alt={course.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <CourseThumbnail
              category={course.category}
              title={course.title}
              discipline={discipline}
              size="xl"
              rounded="md"
              className="w-full h-full rounded-none"
              iconClassName="w-10 h-10"
            />
          )}
        </Link>

        {/* Featured Pill (Optional) */}
        {course.featured && (
          <div className="absolute top-3 right-3 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#F16A1C] text-white shadow-2xs">
              <Sparkles className="w-2.5 h-2.5" />
              Featured
            </span>
          </div>
        )}
      </div>

      {/* ── 2. Card Content Body (V2 Spec) ── */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-3.5">
        <div className="space-y-2">
          {/* Row 1: Discipline Pill & Rating */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs",
                badgeConfig.className
              )}
            >
              {badgeConfig.label}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D97706]">
              <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
              {ratingValue}
            </span>
          </div>

          {/* Row 2: Course Title */}
          <Link
            to={courseLink}
            className="focus:outline-none group/title block"
            title={course.title}
          >
            <h3 className="font-heading font-semibold text-[#0F1B34] text-sm sm:text-base leading-snug line-clamp-2 min-h-[2.5rem] group-hover/title:text-[#0A65A0] transition-colors tracking-tight">
              {course.title}
            </h3>
          </Link>

          {/* Row 3: Metadata Row (Duration, Level, Learners) */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5A6B8C] pt-1">
            <span className="flex items-center gap-1" title="Duration">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{durationText}</span>
            </span>

            <span className="text-slate-300">·</span>

            <span className="text-xs text-[#5A6B8C]">
              {difficultyLabel}
            </span>

            {learnerCount > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1" title="Enrolled Learners">
                  <Users className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{learnerCount.toLocaleString()}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── 3. Bottom Row: Badge/Price & Primary Blue "View course" CTA ── */}
        <div className="pt-3 border-t border-[#E1E7F1] flex items-center justify-between gap-3">
          <span
            className={cn(
              "text-xs font-semibold truncate",
              isFreeCourse
                ? "text-[#047857]"
                : isStateApproved
                ? "text-[#0F1B34]"
                : "text-[#0F1B34]"
            )}
          >
            {priceOrBadgeLabel}
          </span>

          <Button
            asChild
            size="sm"
            className="h-8 px-3.5 rounded-xl text-xs font-semibold text-white bg-[#0A65A0] hover:bg-[#084B78] shadow-2xs gap-1 border-0 transition-all cursor-pointer shrink-0"
          >
            <Link to={courseLink}>
              View course
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
};

/**
 * Skeleton placeholder for 4-column grid loading state.
 */
export const ExploreCourseCardSkeleton: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div
      className={cn(
        "flex flex-col bg-white rounded-2xl border border-[#E1E7F1] shadow-2xs overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="h-28 sm:h-32 w-full rounded-none" />

      <div className="p-4 sm:p-5 flex flex-col flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-10 rounded-md" />
        </div>

        <Skeleton className="h-5 w-full rounded-md" />
        <Skeleton className="h-4 w-3/4 rounded-md" />

        <div className="flex items-center gap-3 pt-1">
          <Skeleton className="h-3.5 w-14 rounded-md" />
          <Skeleton className="h-3.5 w-16 rounded-md" />
        </div>

        <div className="mt-auto pt-3 border-t border-[#E1E7F1] flex items-center justify-between">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
