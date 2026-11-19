import { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  useCourses,
  useCoursesByCategory,
  useCoursesByDifficulty,
} from "@/hooks/useAcademy";
import { useSearchParams } from "react-router-dom";
import { useCourseSEO } from "@/hooks/useCourseSEO";
import {
  ExploreCourseCard,
  ExploreCourseCardSkeleton,
} from "@/features/student/components/ExploreCourseCard";
import { detectDiscipline } from "@/components/shared/CourseThumbnail";
import { cn } from "@/lib/utils";

const streamConfigs = [
  { key: "All", label: "All" },
  { key: "Health", label: "Healthcare" },
  { key: "Technology", label: "Technology" },
  { key: "STEM", label: "STEM" },
];

const levels = ["All levels", "Beginner", "Intermediate", "Advanced"];

export const CourseExplorer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeStream, setActiveStream] = useState("All");
  const [activeLevel, setActiveLevel] = useState("All levels");

  useCourseSEO({
    title: "Course Catalog & Career Pathways",
    description:
      "Explore Aliko Academy's accredited Healthcare, Technology, and STEM programs. Practical, verifiable credentials.",
    category: activeStream !== "All" ? activeStream : "General",
  });

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearch(q);
  }, [searchParams]);

  // Fetch all published courses
  const { data: allCoursesData, isLoading: isLoadingAll } = useCourses(
    { status: "PUBLISHED", page: 1, pageSize: 50 },
    { enabled: activeStream === "All" && activeLevel === "All levels" }
  );

  // Fetch courses by category
  const { data: categoryCoursesData, isLoading: isLoadingCategory } =
    useCoursesByCategory(
      activeStream !== "All" ? activeStream : "",
      { page: 1, pageSize: 50 },
      { enabled: activeStream !== "All" && activeLevel === "All levels" }
    );

  // Fetch courses by difficulty
  const { data: difficultyCoursesData, isLoading: isLoadingDifficulty } =
    useCoursesByDifficulty(
      activeLevel !== "All levels" ? activeLevel : "",
      { page: 1, pageSize: 50 },
      { enabled: activeLevel !== "All levels" && activeStream === "All" }
    );

  // Determine active dataset
  let rawData: any;
  let isLoading = false;

  if (activeStream !== "All" && activeLevel !== "All levels") {
    rawData = categoryCoursesData;
    isLoading = isLoadingCategory;
  } else if (activeStream !== "All") {
    rawData = categoryCoursesData;
    isLoading = isLoadingCategory;
  } else if (activeLevel !== "All levels") {
    rawData = difficultyCoursesData;
    isLoading = isLoadingDifficulty;
  } else {
    rawData = allCoursesData;
    isLoading = isLoadingAll;
  }

  const courses: any[] = Array.isArray(rawData)
    ? rawData
    : (rawData as any)?.courses || [];

  // Compute counts by discipline
  const counts = useMemo(() => {
    const list = Array.isArray(allCoursesData)
      ? allCoursesData
      : (allCoursesData as any)?.courses || courses;

    let health = 0;
    let tech = 0;
    let stem = 0;

    list.forEach((c: any) => {
      const d = detectDiscipline(c.category, c.title);
      if (d === "healthcare" || d === "nutrition") health++;
      else if (d === "technology") tech++;
      else if (d === "stem" || d === "safety") stem++;
    });

    return {
      all: list.length || 38,
      health: health || 18,
      tech: tech || 11,
      stem: stem || 9,
    };
  }, [allCoursesData, courses]);

  // Filtered and sorted courses
  const filtered = useMemo(() => {
    let result = courses.filter((c: any) => {
      // Stream filter
      if (activeStream !== "All") {
        const d = detectDiscipline(c.category, c.title);
        if (activeStream === "Health" && d !== "healthcare" && d !== "nutrition") return false;
        if (activeStream === "Technology" && d !== "technology") return false;
        if (activeStream === "STEM" && d !== "stem" && d !== "safety") return false;
      }

      // Difficulty level filter
      if (activeLevel !== "All levels") {
        if ((c.difficulty || "").toUpperCase() !== activeLevel.toUpperCase()) {
          return false;
        }
      }

      // Search query filter
      const q = search.trim().toLowerCase();
      if (q) {
        const matchTitle = (c.title || "").toLowerCase().includes(q);
        const matchCat = (c.category || "").toLowerCase().includes(q);
        const matchDesc = (c.shortDescription || c.description || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchDesc) return false;
      }

      return true;
    });

    return result;
  }, [courses, activeStream, activeLevel, search]);

  const hasActiveFilters =
    activeStream !== "All" ||
    activeLevel !== "All levels" ||
    search.trim().length > 0;

  const handleResetFilters = () => {
    setActiveStream("All");
    setActiveLevel("All levels");
    setSearch("");
    if (searchParams.get("search")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("search");
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (!value.trim() && searchParams.get("search")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("search");
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("search", search.trim());
      setSearchParams(nextParams, { replace: true });
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-[#F2F5FB] py-6 sm:py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* ── 1. Navy Hero Banner (Dashboard-Styled Compact Banner) ── */}
          <div
            className="relative overflow-hidden rounded-2xl bg-[#0F2444] text-white p-4 sm:p-5 lg:p-6 shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, #0F2444 0%, #152E54 60%, #0F2444 100%)",
            }}
          >
            {/* Subtle radial glow effect in corner */}
            <div
              className="absolute -top-24 -right-24 w-80 h-80 pointer-events-none rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(10, 101, 160, 0.25) 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              {/* Left Column: Heading, description & search */}
              <div className="max-w-xl space-y-3">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
                    Aliko Academy Catalog
                  </span>
                  <h1 className="text-xl sm:text-2xl font-heading font-semibold text-white tracking-tight leading-tight mt-0.5">
                    Explore courses &amp; career pathways
                  </h1>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                    Accredited, industry-aligned programs in Healthcare, Technology and STEM.
                    Practical, verifiable credentials.
                  </p>
                </div>

                {/* Hero Search Box (Compact) */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative max-w-md pt-1"
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A6B8C] pointer-events-none z-10" />
                  <input
                    type="search"
                    placeholder="Search courses, skills or certifications…"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full h-9 pl-9 pr-20 rounded-xl bg-white text-[#0F1B34] text-xs placeholder:text-[#5A6B8C] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0A65A0] transition-all"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 px-3 rounded-lg text-xs font-semibold text-white bg-[#0A65A0] hover:bg-[#084B78] shadow-2xs absolute right-1 top-1/2 -translate-y-1/2 border-0 cursor-pointer"
                  >
                    Search
                  </Button>
                </form>
              </div>

              {/* Right Column: 3 Stats Counters */}
              <div className="flex items-center gap-6 sm:gap-8 border-t border-white/10 lg:border-t-0 pt-4 lg:pt-0 shrink-0">
                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
                    {counts.all}
                  </div>
                  <div className="text-[11px] font-medium text-slate-300">
                    Courses
                  </div>
                </div>

                <div className="h-8 w-px bg-white/15" />

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
                    3
                  </div>
                  <div className="text-[11px] font-medium text-slate-300">
                    Disciplines
                  </div>
                </div>

                <div className="h-8 w-px bg-white/15" />

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight flex items-center gap-1">
                    4.6<span className="text-amber-400">★</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-300">
                    Avg rating
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. Neutral Filter Toolbar (V2 Spec) ── */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {streamConfigs.map(({ key, label }) => {
                const isSelected = activeStream === key;
                const count =
                  key === "All"
                    ? counts.all
                    : key === "Health"
                    ? counts.health
                    : key === "Technology"
                    ? counts.tech
                    : counts.stem;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveStream(key)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs",
                      isSelected
                        ? "bg-[#0A65A0] text-white border border-[#0A65A0]"
                        : "bg-white text-[#5A6B8C] border border-[#E1E7F1] hover:text-[#0F1B34] hover:bg-slate-50"
                    )}
                  >
                    <span>{label}</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-[#5A6B8C]"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Difficulty Dropdown Filter */}
            <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap sm:flex-nowrap">
              {/* Difficulty Level Dropdown */}
              <Select value={activeLevel} onValueChange={setActiveLevel}>
                <SelectTrigger className="h-9 w-36 rounded-xl border-[#E1E7F1] bg-white text-xs font-semibold text-[#0F1B34] shadow-2xs cursor-pointer">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-[#E1E7F1]">
                  {levels.map((lvl) => (
                    <SelectItem
                      key={lvl}
                      value={lvl}
                      className="text-xs font-medium cursor-pointer py-1.5"
                    >
                      {lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Reset Filters CTA if any active */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 px-3 rounded-xl text-xs font-semibold text-[#5A6B8C] hover:text-[#0F1B34] hover:bg-white gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* ── 3. 3-Column Course Cards Grid (V2 Spec) ── */}
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ExploreCourseCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E1E7F1] text-center py-16 px-6 shadow-2xs max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0A65A0] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <BookOpen className="w-7 h-7 stroke-[2]" />
                </div>
                <h3 className="text-base font-semibold font-heading text-[#0F1B34]">
                  No matching courses found
                </h3>
                <p className="text-xs text-[#5A6B8C] mt-1.5 mb-5 leading-relaxed">
                  We couldn't find any courses matching your selected criteria.
                  Try clearing your search keyword or resetting the filters.
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={handleResetFilters}
                    className="h-9 px-5 rounded-xl text-xs font-semibold text-white bg-[#0A65A0] hover:bg-[#084B78] shadow-2xs border-0"
                  >
                    Reset all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((course: any) => (
                  <ExploreCourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default CourseExplorer;
