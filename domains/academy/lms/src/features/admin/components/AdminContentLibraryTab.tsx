import React, { useState, useMemo } from "react";
import { useAdminContentLibrary } from "@/hooks/useAcademy";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, Clock, ExternalLink } from "lucide-react";

export const AdminContentLibraryTab: React.FC = () => {
  const { data: contentRaw, isLoading } = useAdminContentLibrary();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const items: any[] = useMemo(() => {
    if (Array.isArray(contentRaw)) return contentRaw;
    return (
      (contentRaw as any)?.content ||
      (contentRaw as any)?.contents ||
      (contentRaw as any)?.items ||
      (contentRaw as any)?.data ||
      []
    );
  }, [contentRaw]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    items.forEach((it) => {
      if (it.type) types.add(String(it.type).toUpperCase());
    });
    return Array.from(types);
  }, [items]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((it) => {
      const matchType =
        typeFilter === "ALL" ||
        String(it.type || "").toUpperCase() === typeFilter;
      if (!matchType) return false;
      if (!q) return true;
      return (
        String(it.title || "")
          .toLowerCase()
          .includes(q) ||
        String(it.lesson?.title || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [items, searchQuery, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E1EAF2] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2b5f9e]" />
            Platform Content Library ({filtered.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All instructional assets indexed across academy lessons.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E1EAF2] bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Types</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title or lesson..."
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
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Lesson</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1EAF2]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <Clock className="w-7 h-7 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading content library...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-xs">
                    No content items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#EAF4FB] transition-colors"
                  >
                    <td className="px-6 py-4 text-xs font-semibold text-slate-900">
                      {item.title || `Content #${item.id}`}
                    </td>
                    <td className="px-6 py-4">
                      {item.type ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase bg-slate-50 text-slate-700 border-slate-200"
                        >
                          {item.type}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {item.lesson?.title ||
                        (item.lessonId ? `Lesson #${item.lessonId}` : "—")}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2b5f9e] hover:underline"
                        >
                          Open <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

