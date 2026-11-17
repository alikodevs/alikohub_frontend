import { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  Layers,
  Stethoscope,
  Code2,
  Atom,
  RotateCcw,
  Sparkles,
  BookOpen,
  BarChart2,
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
import { cn } from "@/lib/utils";

const streamConfigs = [
  { key: "All", label: "All Disciplines", icon: Layers },
  { key: "Health", label: "Healthcare", icon: Stethoscope },
  { key: "Technology", label: "Technology", icon: Code2 },
  { key: "STEM", label: "STEM", icon: Atom },
];

const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

const LmsExplore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeStream, setActiveStream] = useState("All");
  const [activeLevel, setActiveLevel] = useState("All Levels");

  useCourseSEO({
    title: "Course Catalog & Discovery",
    description:
      "Explore AlikoHub Academy's top tech, health, and STEM courses. Filter by stream, difficulty level, and search keywords.",
    category: activeStream !== "All" ? activeStream : "General",
  });

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearch(q);
  }, [searchParams]);

  // Fetch all published courses
  const { data: allCoursesData, isLoading: isLoadingAll } = useCourses(
    { status: "PUBLISHED", page: 1, pageSize: 20 },
    { enabled: activeStream === "All" && activeLevel === "All Levels" },
  );

  // Fetch courses by category
  const { data: categoryCoursesData, isLoading: isLoadingCategory } =
    useCoursesByCategory(
      activeStream !== "All" ? activeStream : "",
      { page: 1, pageSize: 20 },
      { enabled: activeStream !== "All" && activeLevel === "All Levels" },
    );

  // Fetch courses by difficulty
  const { data: difficultyCoursesData, isLoading: isLoadingDifficulty } =
    useCoursesByDifficulty(
      activeLevel !== "All Levels" ? activeLevel : "",
      { page: 1, pageSize: 20 },
      { enabled: activeLevel !== "All Levels" && activeStream === "All" },
    );

  // Determine active dataset
  let data: any;
  let isLoading = false;

  if (activeStream !== "All" && activeLevel !== "All Levels") {
    data = categoryCoursesData;
    isLoading = isLoadingCategory;
  } else if (activeStream !== "All") {
    data = categoryCoursesData;
    isLoading = isLoadingCategory;
  } else if (activeLevel !== "All Levels") {
    data = difficultyCoursesData;
    isLoading = isLoadingDifficulty;
  } else {
    data = allCoursesData;
    isLoading = isLoadingAll;
  }

  const courses: any[] = Array.isArray(data)
    ? data
    : (data as any)?.courses || [];

  const filtered = useMemo(() => {
    return courses.filter((c: any) => {
      let matchLevel = true;
      let matchStream = true;

      if (activeStream !== "All" && activeLevel !== "All Levels") {
        matchLevel = c.difficulty?.toUpperCase() === activeLevel.toUpperCase();
      }

      const matchSearch =
        !search.trim() ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.category?.toLowerCase().includes(search.toLowerCase());

      return matchLevel && matchStream && matchSearch;
    });
  }, [courses, activeStream, activeLevel, search]);

  const hasActiveFilters =
    activeStream !== "All" ||
    activeLevel !== "All Levels" ||
    search.trim().length > 0;

  const handleResetFilters = () => {
    setActiveStream("All");
    setActiveLevel("All Levels");
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

  return (
    <StudentLayout>
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ── 1. Hero Banner Area ── */}
        <div
          className="relative overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 lg:p-10"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 0%, #f4f8fe 48%, #fffaf5 100%)",
          }}
        >
          {/* Subtle brand glow effects */}
          <div
            className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-60"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(13,114,186,0.12) 0%, rgba(191,102,34,0.06) 40%, transparent 70%)",
            }}
          />

          <div className="relative z-10 max-w-3xl">
            {/* Kicker badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/95 text-[#0D72BA] border border-blue-200/60 shadow-2xs mb-3">
              <span>Aliko Academy Catalog</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#0b1a40] tracking-tight leading-tight">
              Explore Courses & Career Pathways
            </h1>

            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Advance your career with accredited, industry-aligned curricula
              across Healthcare, Technology, and STEM disciplines. Gain
              practical, verifiable credentials.
            </p>

            {/* Prominent Search Bar */}
            <div className="relative max-w-xl mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0D72BA] pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search courses, disciplines, or skills..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-sm text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0D72BA] focus:ring-2 focus:ring-[#0D72BA]/15 shadow-2xs transition-all relative z-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors z-10"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. Compact Dropdown Filter Toolbar ── */}
        <section
          aria-label="Course Filters"
          className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Results Count & Active Status */}
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span className="font-bold text-slate-900 text-sm">
                {filtered.length}
              </span>
              <span>{filtered.length === 1 ? "course available" : "courses available"}</span>

              {hasActiveFilters && (
                <>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D72BA] hover:text-[#17469E] hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset filters
                  </button>
                </>
              )}
            </div>

            {/* Right: Compact Sleek Dropdowns */}
            <div className="flex items-center gap-2.5">
              {/* Discipline Dropdown */}
              <div className="flex-1 sm:flex-initial">
                <Select value={activeStream} onValueChange={setActiveStream}>
                  <SelectTrigger className="h-9 w-full sm:w-[190px] rounded-xl border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer">
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="w-3.5 h-3.5 text-[#0D72BA] shrink-0" />
                      <span className="truncate">
                        {streamConfigs.find((s) => s.key === activeStream)?.label || "Discipline"}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-lg border-slate-200">
                    {streamConfigs.map(({ key, label, icon: Icon }) => (
                      <SelectItem key={key} value={key} className="text-xs font-medium cursor-pointer py-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-slate-500" />
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Level Dropdown */}
              <div className="flex-1 sm:flex-initial">
                <Select value={activeLevel} onValueChange={setActiveLevel}>
                  <SelectTrigger className="h-9 w-full sm:w-[160px] rounded-xl border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer">
                    <div className="flex items-center gap-2 truncate">
                      <BarChart2 className="w-3.5 h-3.5 text-[#17469E] shrink-0" />
                      <span className="truncate">{activeLevel}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-lg border-slate-200">
                    {levels.map((lvl) => (
                      <SelectItem key={lvl} value={lvl} className="text-xs font-medium cursor-pointer py-2">
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Active chips row (only shown if a specific filter or search is active) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Filtered by:</span>

              {activeStream !== "All" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0D72BA] font-semibold text-[11px] border border-blue-200/80">
                  {streamConfigs.find((s) => s.key === activeStream)?.label}
                  <button
                    onClick={() => setActiveStream("All")}
                    className="hover:text-blue-900 ml-0.5"
                    aria-label="Remove stream filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activeLevel !== "All Levels" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#17469E] font-semibold text-[11px] border border-indigo-200/80">
                  {activeLevel}
                  <button
                    onClick={() => setActiveLevel("All Levels")}
                    className="hover:text-indigo-900 ml-0.5"
                    aria-label="Remove level filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {search.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-[#BF6622] font-semibold text-[11px] border border-amber-200/80">
                  &ldquo;{search}&rdquo;
                  <button
                    onClick={() => handleSearchChange("")}
                    className="hover:text-amber-900 ml-0.5"
                    aria-label="Clear search keyword"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium ml-auto transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </section>

        {/* ── 3. Course Grid / Loading / Empty States ── */}
        <div>
          {/* Loading Skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ExploreCourseCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Active Course Grid */}
          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {filtered.map((course: any) => (
                <ExploreCourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center bg-white rounded-2xl border border-slate-200/80 p-10 sm:p-14 shadow-2xs max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-[#0D72BA]">
                <BookOpen className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-heading font-bold text-slate-900 text-lg">
                  No courses found
                </h3>
                <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto leading-relaxed">
                  We couldn't find any courses matching your selected criteria.
                  Try adjusting your search terms or filters.
                </p>
              </div>

              {hasActiveFilters && (
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleResetFilters}
                    className="bg-[#0D72BA] hover:bg-[#17469E] text-white font-semibold text-xs h-9 px-4 rounded-xl gap-2 shadow-xs transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset all filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default LmsExplore;
