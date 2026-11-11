import React, { useState, useMemo } from "react";
import { useAllUsers } from "@/features/auth/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Clock } from "lucide-react";

export const AdminUsersTab: React.FC = () => {
  const { data: usersRaw, isLoading } = useAllUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const users: any[] = useMemo(() => {
    if (Array.isArray(usersRaw)) return usersRaw;
    return (
      (usersRaw as any)?.users ||
      (usersRaw as any)?.items ||
      (usersRaw as any)?.data ||
      []
    );
  }, [usersRaw]);

  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    users.forEach((u) => {
      const r = String(
        u.academyUser?.role || u.academyRole || u.globalRole || "",
      ).toUpperCase();
      if (r) roles.add(r);
    });
    return Array.from(roles);
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const role = String(
        u.academyUser?.role || u.academyRole || u.globalRole || "",
      ).toUpperCase();
      const matchRole = roleFilter === "ALL" || role === roleFilter;
      if (!matchRole) return false;
      if (!q) return true;
      const fullName = `${u.firstname || ""} ${u.lastname || ""}`.toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const uid = String(u.firebaseId || u.id || "").toLowerCase();
      return (
        fullName.includes(q) || email.includes(q) || uid.includes(q)
      );
    });
  }, [users, searchQuery, roleFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E1EAF2] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2b5f9e]" />
            Platform Users Directory ({filteredUsers.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All accounts registered on the user service.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E1EAF2] bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Roles</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or email..."
              className="pl-9 h-9 text-xs bg-slate-50 border-[#E1EAF2]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E1EAF2] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 uppercase text-xs font-bold border-b border-[#E1EAF2]">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Global Role</th>
                <th className="px-6 py-4">Academy Role</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1EAF2]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <Clock className="w-7 h-7 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-xs">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u: any, idx: number) => {
                  const fullName =
                    `${u.firstname || ""} ${u.lastname || ""}`.trim() || "—";
                  const academyRole =
                    u.academyUser?.role || u.academyRole || "—";
                  return (
                    <tr
                      key={u.firebaseId || u.id || idx}
                      className="hover:bg-[#EAF4FB] transition-colors"
                    >
                      <td className="px-6 py-4 text-xs font-semibold text-slate-900">
                        {fullName}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {u.email || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase bg-slate-50 text-slate-700 border-slate-200"
                        >
                          {u.globalRole || "USER"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {academyRole}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "—"}
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

