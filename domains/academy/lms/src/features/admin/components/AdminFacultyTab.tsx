import React, { useState, useMemo } from "react";
import {
  useAdminInstructors,
  useApproveInstructorCredentials,
} from "@/hooks/useAcademy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Clock,
  Search,
  ShieldCheck,
  Loader2,
  Award,
} from "lucide-react";

interface AdminFacultyTabProps {
  userMap: Record<string, string>;
}

export const AdminFacultyTab: React.FC<AdminFacultyTabProps> = ({ userMap }) => {
  const { data: instructorsRaw, isLoading } = useAdminInstructors();
  const approveMutation = useApproveInstructorCredentials();
  const [searchQuery, setSearchQuery] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const instructors: any[] = useMemo(() => {
    if (Array.isArray(instructorsRaw)) return instructorsRaw;
    return (
      instructorsRaw?.instructors ||
      instructorsRaw?.items ||
      instructorsRaw?.data ||
      []
    );
  }, [instructorsRaw]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return instructors;
    return instructors.filter((inst) => {
      const uid = String(inst.userId || inst.firebaseId || "");
      const name =
        inst.user?.firstname || inst.user?.lastname
          ? `${inst.user?.firstname || ""} ${inst.user?.lastname || ""}`.trim()
          : userMap[uid] || "";
      const email = inst.user?.email || "";
      const lic = inst.rnLicenseNumber || "";
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        lic.toLowerCase().includes(q) ||
        uid.toLowerCase().includes(q)
      );
    });
  }, [instructors, searchQuery, userMap]);

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    try {
      await approveMutation.mutateAsync(userId);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E1EAF2] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0095DA]" />
            Qualified Faculty Roster &amp; Credentials
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review registered RN credentials and issue Director of Nursing faculty approval.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty by name or license..."
            className="pl-9 h-9 text-xs bg-slate-50 border-[#E1EAF2]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E1EAF2] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 uppercase text-xs font-bold border-b border-[#E1EAF2]">
              <tr>
                <th className="px-6 py-4">Instructor</th>
                <th className="px-6 py-4">RN License #</th>
                <th className="px-6 py-4">License Expiration</th>
                <th className="px-6 py-4">LTC Experience</th>
                <th className="px-6 py-4">Train-the-Trainer</th>
                <th className="px-6 py-4">Director Approval</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1EAF2]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <Clock className="w-7 h-7 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading qualified instructors...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-xs">
                    No instructor credential records found.
                  </td>
                </tr>
              ) : (
                filtered.map((inst: any, idx: number) => {
                  const uid = String(inst.userId || inst.firebaseId || "");
                  const displayName =
                    inst.user?.firstname || inst.user?.lastname
                      ? `${inst.user?.firstname || ""} ${inst.user?.lastname || ""}`.trim()
                      : userMap[uid] || uid;
                  const email = inst.user?.email || "";
                  const approved = Boolean(inst.isDirectorApproved);

                  return (
                    <tr
                      key={inst.id || uid || idx}
                      className="hover:bg-[#EAF4FB] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 text-xs">
                          {displayName}
                        </div>
                        {email && (
                          <div className="text-[11px] text-slate-500">{email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-slate-800">
                        {inst.rnLicenseNumber || "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {inst.rnLicenseExpiration
                          ? new Date(inst.rnLicenseExpiration).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700">
                        {inst.yearsLongTermCareExp != null
                          ? `${inst.yearsLongTermCareExp} Years`
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={
                            inst.isTrainTheTrainerCertified
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                              : "bg-slate-50 text-slate-500 border-slate-200 text-[10px]"
                          }
                        >
                          {inst.isTrainTheTrainerCertified ? "CERTIFIED" : "PENDING"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={
                            approved
                              ? "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                              : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                          }
                        >
                          {approved ? "APPROVED" : "PENDING APPROVAL"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!approved ? (
                          <Button
                            size="sm"
                            disabled={!uid || approveMutation.isPending}
                            onClick={() => handleApprove(uid)}
                            className="h-8 text-xs font-bold bg-[#0095DA] hover:bg-[#007BB8] text-white"
                          >
                            {approvingId === uid ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            )}
                            Approve Credentials
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

