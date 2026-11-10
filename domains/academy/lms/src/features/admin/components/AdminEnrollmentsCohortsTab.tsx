import React, { useState, useMemo } from "react";
import {
  useAdminEnrollments,
  useAdminDropEnrollment,
  useAdminCohorts,
  useAdminDeleteCohort,
} from "@/hooks/useAcademy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Layers,
  Search,
  Trash2,
  Clock,
  Loader2,
} from "lucide-react";

interface AdminEnrollmentsCohortsTabProps {
  userMap: Record<string, string>;
}

export const AdminEnrollmentsCohortsTab: React.FC<
  AdminEnrollmentsCohortsTabProps
> = ({ userMap }) => {
  const { data: enrollmentsRaw, isLoading: enrollmentsLoading } =
    useAdminEnrollments();
  const { data: cohortsRaw, isLoading: cohortsLoading } = useAdminCohorts();
  const dropEnrollmentMutation = useAdminDropEnrollment();
  const deleteCohortMutation = useAdminDeleteCohort();

  const [subTab, setSubTab] = useState<"ENROLLMENTS" | "COHORTS">("ENROLLMENTS");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<{
    type: "enrollment" | "cohort";
    id: string | number;
    label: string;
  } | null>(null);

  const enrollments: any[] = useMemo(() => {
    if (Array.isArray(enrollmentsRaw)) return enrollmentsRaw;
    return (
      enrollmentsRaw?.enrollments ||
      enrollmentsRaw?.items ||
      enrollmentsRaw?.data ||
      []
    );
  }, [enrollmentsRaw]);

  const cohorts: any[] = useMemo(() => {
    if (Array.isArray(cohortsRaw)) return cohortsRaw;
    return cohortsRaw?.cohorts || cohortsRaw?.items || cohortsRaw?.data || [];
  }, [cohortsRaw]);

  const filteredEnrollments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return enrollments;
    return enrollments.filter((e) => {
      const uid = String(e.userId || "");
      const studentName =
        e.user?.firstname || e.user?.lastname
          ? `${e.user?.firstname || ""} ${e.user?.lastname || ""}`.trim()
          : userMap[uid] || "";
      const courseTitle = e.course?.title || "";
      const cohortName = e.cohort?.name || "";
      return (
        studentName.toLowerCase().includes(q) ||
        courseTitle.toLowerCase().includes(q) ||
        cohortName.toLowerCase().includes(q) ||
        uid.toLowerCase().includes(q)
      );
    });
  }, [enrollments, searchQuery, userMap]);

  const filteredCohorts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return cohorts;
    return cohorts.filter(
      (c) =>
        String(c.name || "")
          .toLowerCase()
          .includes(q) ||
        String(c.course?.title || "")
          .toLowerCase()
          .includes(q) ||
        String(c.id).includes(q),
    );
  }, [cohorts, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E1EAF2] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setSubTab("ENROLLMENTS")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === "ENROLLMENTS"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Platform Enrollments ({enrollments.length})
          </button>
          <button
            onClick={() => setSubTab("COHORTS")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === "COHORTS"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Cohorts ({cohorts.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              subTab === "ENROLLMENTS"
                ? "Search student or course..."
                : "Search cohort name or course..."
            }
            className="pl-9 h-9 text-xs bg-slate-50 border-[#E1EAF2]"
          />
        </div>
      </div>

      {subTab === "ENROLLMENTS" ? (
        <div className="bg-white border border-[#E1EAF2] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 uppercase text-xs font-bold border-b border-[#E1EAF2]">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Cohort</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Enrolled Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1EAF2]">
                {enrollmentsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      <Clock className="w-7 h-7 animate-spin mx-auto mb-2 text-zinc-400" />
                      Loading enrollments...
                    </td>
                  </tr>
                ) : filteredEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-xs">
                      No enrollments found.
                    </td>
                  </tr>
                ) : (
                  filteredEnrollments.map((enr: any) => {
                    const uid = String(enr.userId || "");
                    const studentName =
                      enr.user?.firstname || enr.user?.lastname
                        ? `${enr.user?.firstname || ""} ${enr.user?.lastname || ""}`.trim()
                        : userMap[uid] || uid;
                    return (
                      <tr
                        key={enr.id}
                        className="hover:bg-[#EAF4FB] transition-colors"
                      >
                        <td className="px-6 py-4 text-xs">
                          <div className="font-semibold text-slate-900">
                            {studentName}
                          </div>
                          {enr.user?.email && (
                            <div className="text-[11px] text-slate-500">
                              {enr.user.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-800">
                          {enr.course?.title ||
                            (enr.courseId ? `Course #${enr.courseId}` : "—")}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {enr.cohort?.name ||
                            (enr.cohortId ? `Cohort #${enr.cohortId}` : "—")}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold uppercase bg-slate-50 text-slate-700 border-slate-200"
                          >
                            {enr.status || "ACTIVE"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {enr.enrolledAt || enr.createdAt
                            ? new Date(
                                enr.enrolledAt || enr.createdAt,
                              ).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setConfirmTarget({
                                type: "enrollment",
                                id: enr.id,
                                label: `${studentName} — ${enr.course?.title || `Course #${enr.courseId}`}`,
                              })
                            }
                            className="h-8 px-2.5 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Drop
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E1EAF2] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 uppercase text-xs font-bold border-b border-[#E1EAF2]">
                <tr>
                  <th className="px-6 py-4">Cohort</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1EAF2]">
                {cohortsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      <Clock className="w-7 h-7 animate-spin mx-auto mb-2 text-zinc-400" />
                      Loading cohorts...
                    </td>
                  </tr>
                ) : filteredCohorts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-xs">
                      No cohorts found.
                    </td>
                  </tr>
                ) : (
                  filteredCohorts.map((cohort: any) => (
                    <tr
                      key={cohort.id}
                      className="hover:bg-[#EAF4FB] transition-colors"
                    >
                      <td className="px-6 py-4 text-xs font-bold text-slate-900">
                        {cohort.name || `Cohort #${cohort.id}`}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700">
                        {cohort.course?.title || `Course #${cohort.courseId}`}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {cohort.startDate
                          ? new Date(cohort.startDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {cohort.endDate
                          ? new Date(cohort.endDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setConfirmTarget({
                              type: "cohort",
                              id: cohort.id,
                              label: cohort.name || `Cohort #${cohort.id}`,
                            })
                          }
                          className="h-8 px-2.5 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Cohort
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <DialogContent className="sm:max-w-md bg-white border-[#E1EAF2]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {confirmTarget?.type === "enrollment"
                ? "Drop Student Enrollment?"
                : "Delete Cohort?"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to remove "{confirmTarget?.label}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={
                dropEnrollmentMutation.isPending ||
                deleteCohortMutation.isPending
              }
              onClick={async () => {
                if (!confirmTarget) return;
                if (confirmTarget.type === "enrollment") {
                  await dropEnrollmentMutation.mutateAsync(confirmTarget.id);
                } else {
                  await deleteCohortMutation.mutateAsync(confirmTarget.id);
                }
                setConfirmTarget(null);
              }}
            >
              {(dropEnrollmentMutation.isPending ||
                deleteCohortMutation.isPending) && (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

