import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCourseAnalytics } from "@/hooks/useAcademy";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle, Clock } from "lucide-react";
import { SeatTimeAuditTable } from "@/features/instructor/analytics/SeatTimeAuditTable";

interface AnalyticsTabProps {
  courseId: string;
}

export const AnalyticsTab = ({ courseId }: AnalyticsTabProps) => {
  const { data: analytics, isLoading } = useCourseAnalytics(courseId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Total Progress Entries",
      value: analytics?.totalProgressEntries || 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Completed",
      value: analytics?.completed || 0,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "In Progress",
      value: analytics?.inProgress || 0,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 lowercase first-letter:uppercase">
                {stat.label}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SeatTimeAuditTable courseId={courseId} />
    </div>
  );
};
