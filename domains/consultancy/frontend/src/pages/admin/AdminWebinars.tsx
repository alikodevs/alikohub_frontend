import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { formatUploadUrl } from "@/lib/api";
import { formatWebinarDateTime, utcToEatDatetimeLocal, eatDatetimeLocalToUtcIso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, X, Users } from "lucide-react";

type Webinar = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  webinarUrl: string | null;
  thumbnailUrl: string | null;
  scheduledAt: string | null;
  durationMinutes: number | null;
  isPublished: boolean;
  isFree: boolean;
  createdAt: string;
};

const AdminWebinars = () => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [editing, setEditing] = useState<Partial<Webinar> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();

  const fetchWebinars = async () => {
    try {
      const { data } = await api.get("/consultancy/cms/webinars");
      setWebinars(data || []);
    } catch (e) {
      toast({ title: "Error", description: "Failed to fetch webinars.", variant: "destructive" });
    }
  };

  useEffect(() => { fetchWebinars(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      title: editing.title,
      slug: editing.slug,
      description: editing.description || "",
      webinarUrl: editing.webinarUrl || null,
      thumbnailUrl: editing.thumbnailUrl || null,
      scheduledAt: eatDatetimeLocalToUtcIso(editing.scheduledAt),
      durationMinutes: editing.durationMinutes || null,
      isPublished: editing.isPublished || false,
      isFree: editing.isFree ?? true,
    };

    try {
      if (isNew) {
        await api.post("/consultancy/cms/webinars", payload);
      } else {
        await api.patch(`/consultancy/cms/webinars/${editing.id}`, payload);
      }
      toast({ title: isNew ? "Webinar Created" : "Webinar Updated" });
      setEditing(null);
      fetchWebinars();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to save.", variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Are you sure you want to remove this webinar?")) return;
    try {
      // Use DELETE /consultancy/cms/webinars/:id/registrations or /webinars/:id
      try {
        await api.delete(`/consultancy/cms/webinars/${id}/registrations`);
      } catch (err) {
        await api.delete(`/consultancy/cms/webinars/${id}`);
      }
      toast({ title: "Webinar Removed" });
      fetchWebinars();
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary mb-1">Webinars</h1>
          <p className="text-muted-foreground text-sm">Manage webinar listings and attendee registrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/webinar-registrations">
            <Button variant="outline" className="font-medium">
              <Users className="w-4 h-4 mr-2" /> View Registrations
            </Button>
          </Link>
          <Button onClick={() => { setEditing({ title: "", slug: "", scheduledAt: "", isPublished: false, isFree: true }); setIsNew(true); }} className="bg-gold text-navy hover:bg-gold/90 font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Add Webinar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {webinars.map((w) => (
          <div key={w.id} className="bg-card border border-border rounded-xl p-5">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${w.isPublished ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {w.isPublished ? "Published" : "Draft"}
            </span>
            <h3 className="font-semibold text-primary mt-3 mb-1">{w.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{w.description}</p>
            {w.scheduledAt && <p className="text-xs text-muted-foreground">Scheduled: {formatWebinarDateTime(w.scheduledAt, w.durationMinutes).fullStr}</p>}
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={() => { setEditing({ ...w, scheduledAt: utcToEatDatetimeLocal(w.scheduledAt) }); setIsNew(false); }}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(w.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
        {webinars.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No webinars yet.</p>}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isNew ? "New Webinar" : "Edit Webinar"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Input placeholder="Title" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })} />
              <Input placeholder="Slug" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              <Textarea placeholder="Description" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              <Input placeholder="Webinar URL" value={editing.webinarUrl || ""} onChange={(e) => setEditing({ ...editing, webinarUrl: e.target.value })} />
              
              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Thumbnail Image</label>
                {editing.thumbnailUrl ? (
                  <div className="relative w-full aspect-video group">
                    <img src={formatUploadUrl(editing.thumbnailUrl)} alt="Thumbnail" className="w-full h-full object-cover rounded-lg border border-border" />
                    <button onClick={() => setEditing({ ...editing, thumbnailUrl: "" })} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div 
                    className="border border-dashed border-border rounded-lg py-8 text-center cursor-pointer hover:border-accent/40"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = async (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append("file", file);
                          try {
                            const { data } = await api.post("/upload/image", formData, { headers: { "Content-Type": "multipart/form-data" } });
                            setEditing({ ...editing, thumbnailUrl: formatUploadUrl(data.url) });
                          } catch (err) {
                            toast({ title: "Upload failed", variant: "destructive" });
                          }
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Upload thumbnail</p>
                  </div>
                )}
              </div>

              <Input type="datetime-local" value={editing.scheduledAt || ""} onChange={(e) => setEditing({ ...editing, scheduledAt: e.target.value })} />
              <Input type="number" placeholder="Duration (minutes)" value={editing.durationMinutes || ""} onChange={(e) => setEditing({ ...editing, durationMinutes: parseInt(e.target.value) || null })} />
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch checked={editing.isPublished || false} onCheckedChange={(v) => setEditing({ ...editing, isPublished: v })} /><span className="text-sm">Published</span></div>
                <div className="flex items-center gap-2"><Switch checked={editing.isFree ?? true} onCheckedChange={(v) => setEditing({ ...editing, isFree: v })} /><span className="text-sm">Free</span></div>
              </div>
              <Button onClick={save} className="w-full bg-gold text-navy hover:bg-gold/90 font-semibold">Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWebinars;
