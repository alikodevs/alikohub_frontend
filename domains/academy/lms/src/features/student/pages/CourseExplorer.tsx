import { useState, useEffect } from "react";
import { Search, Clock, BarChart, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  useCourses,
  useCoursesByCategory,
  useCoursesByDifficulty,
} from "@/hooks/useAcademy";
import { Link, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const streams = ["All", "Health", "Technology", "STEM"];
const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

const LmsExplore = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeStream, setActiveStream] = useState("All");
  const [activeLevel, setActiveLevel] = useState("All Levels");

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
  let data;
  let isLoading;

  if (activeStream !== "All" && activeLevel !== "All Levels") {
    // If both are selected, we will fetch by category and filter locally by difficulty
    // or fetch ALL and filter both. Let's fetch by category and filter by difficulty.
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

  const courses = Array.isArray(data) ? data : (data as any)?.courses || [];

  const filtered = courses.filter((c: any) => {
    let matchLevel = true;
    let matchStream = true;

    if (activeStream !== "All" && activeLevel !== "All Levels") {
      // Data is from category, we need to filter by difficulty
      matchLevel = c.difficulty?.toUpperCase() === activeLevel.toUpperCase();
    }

    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());

    return matchLevel && matchStream && matchSearch;
  });

  return (
    <StudentLayout>
      <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6">
        {/* ── Hero Banner ── */}
        <div
          className="relative overflow-hidden rounded-2xl border border-blue-100/80 shadow-sm p-6 sm:p-8"
          style={{
            background:
              "linear-gradient(135deg, #eef5ff 0%, #f4f8ff 55%, #fff7ed 100%)",
          }}
        >
          {/* Soft warm glow top-right */}
          <div
            className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at top right, rgba(254,215,170,0.45) 0%, rgba(253,230,138,0.2) 35%, transparent 70%)",
            }}
          />

          <div className="relative z-10 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#0b1a40] mb-6">
              Explore Courses
            </h1>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm text-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all relative z-0"
              />
            </div>
          </div>
        </div>

        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {streams.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveStream(s)}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                    activeStream === s
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {levels.map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLevel(l)}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                    activeLevel === l
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-40 w-full rounded-2xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Course Grid */}
          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((course: any) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 group flex flex-col"
                >
                  <div className="h-40 overflow-hidden relative bg-gradient-to-br from-primary/10 to-primary/20">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Search className="w-6 h-6 text-primary/40" />
                      </div>
                    )}

                    <span
                      className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm bg-white text-primary border border-white/20`}
                    >
                      {course.category}
                    </span>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-heading font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {course.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 mb-5 flex-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {course.estimatedTime || "8 weeks"}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <BarChart className="w-3.5 h-3.5 text-slate-400" />
                        {course.difficulty}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {course.enrollmentCount || 0} learners
                      </span>

                      <span className="flex items-center gap-1.5 font-medium">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-slate-700">{course.rating || "4.8"}</span>
                      </span>
                    </div>

                    <Button size="sm" className="w-full rounded-xl font-bold border-0 shadow-md shadow-primary/10" asChild>
                      <Link to={`/courses/${course.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center bg-white rounded-2xl border border-slate-200 py-16">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">
                No courses found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default LmsExplore;
