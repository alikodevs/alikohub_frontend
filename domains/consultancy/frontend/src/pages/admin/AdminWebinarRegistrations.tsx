import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, RefreshCw, Mail, Calendar, Video, ChevronLeft, ChevronRight } from "lucide-react";

type WebinarRegistration = {
  id: string;
  webinarId?: string;
  webinarTitle?: string;
  webinar?: {
    id: string;
    title: string;
  };
  name: string;
  email: string;
  createdAt: string;
};

const PAGE_SIZE = 5;

const AdminWebinarRegistrations = () => {
  const [registrations, setRegistrations] = useState<WebinarRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/consultancy/cms/webinars-registrations");
      setRegistrations(data || []);
    } catch (e: any) {
      console.error("Failed to fetch webinar registrations:", e);
      toast({
        title: "Error",
        description: e.response?.data?.message || "Failed to fetch webinar registrations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const filteredRegistrations = registrations.filter((r) => {
    const term = search.toLowerCase();
    const nameMatch = r.name?.toLowerCase().includes(term);
    const emailMatch = r.email?.toLowerCase().includes(term);
    const titleMatch = (r.webinarTitle || r.webinar?.title || "")
      .toLowerCase()
      .includes(term);
    return nameMatch || emailMatch || titleMatch;
  });

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary mb-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" /> Webinar Registrations
          </h1>
          <p className="text-muted-foreground text-sm">
            View attendee registrations for upcoming & past webinars.
          </p>
        </div>
        <Button
          onClick={fetchRegistrations}
          variant="outline"
          size="sm"
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Search by name, email, or webinar title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
        />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Attendee Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Webinar Session</th>
                <th className="px-6 py-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedRegistrations.map((reg) => {
                const webinarName =
                  reg.webinarTitle || reg.webinar?.title || "Webinar Session";
                return (
                  <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {reg.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        {reg.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">
                      <span className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-accent" />
                        {webinarName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {reg.createdAt ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(reg.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredRegistrations.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground">
                    No webinar registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredRegistrations.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredRegistrations.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {filteredRegistrations.length}
              </span>{" "}
              registrations
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safeCurrentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <span className="text-xs font-medium text-muted-foreground px-2">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-3"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWebinarRegistrations;

