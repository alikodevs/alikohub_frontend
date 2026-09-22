import React from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import { BarChart2, TrendingUp, Users, BookOpen, Clock, AlertCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useInstructorStats } from "@/hooks/useAcademy";
import { Skeleton } from "@/components/ui/skeleton";

const InstructorAnalytics = () => {
  const { data: stats, isLoading, isError, refetch } = useInstructorStats();

  if (isLoading) {
    return (
      <InstructorLayout>
        <main className="section-container py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </InstructorLayout>
    );
  }

  if (isError) {
    return (
      <InstructorLayout>
        <main className="section-container py-8 md:py-12">
          <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Failed to load analytics
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              We couldn't retrieve your analytics data. Please try again.
            </p>
            <Button
              onClick={() => refetch()}
              className="gap-2 font-bold rounded-full px-5"
              size="sm"
            >
              <RotateCcw className="w-4 h-4" /> Retry
            </Button>
          </div>
        </main>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <main className="section-container py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900 border-none">
              Performance Analytics
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Detailed insights into your course performance and student
              engagement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Courses
              </CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalCourses || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Active courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalStudents || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                Overall enrollment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Rating
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.averageRating || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Student feedback</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Experience</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.yearsOfExperience || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Years of teaching</p>
            </CardContent>
          </Card>
        </div>

        <Card className="min-h-[400px] flex items-center justify-center border-dashed">
          <CardContent className="text-center py-12">
            <BarChart2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Detailed Analytics Coming Soon
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              We're building comprehensive visual reports to help you track
              every aspect of your teaching performance.
            </p>
          </CardContent>
        </Card>
      </main>
    </InstructorLayout>
  );
};

export default InstructorAnalytics;
