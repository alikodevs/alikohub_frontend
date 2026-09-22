import { useEffect, useState } from "react";
import api, { formatUploadUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Star, Upload, X } from "lucide-react";

type Testimonial = {
  id: string;
  authorName: string;
  authorRole: string | null;
  authorImageUrl: string | null;
  quote: string;
  consultationType: string | null;
  rating: number | null;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
};

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();

  const fetchTestimonials = async () => {
    try {
      const { data } = await api.get("/consultancy/cms/testimonials");
      setTestimonials(data || []);
    } catch (e) {
      toast({ title: "Error", description: "Failed to fetch testimonials.", variant: "destructive" });
    }
  };

  useEffect(() => { fetchTestimonials(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      authorName: editing.authorName,
      quote: editing.quote,
      authorRole: editing.authorRole || null,
      authorImageUrl: editing.authorImageUrl || null,
      consultationType: editing.consultationType || null,
      rating: editing.rating || null,
      isPublished: editing.isPublished || false,
      displayOrder: editing.displayOrder || 0,
    };

    try {
      if (isNew) {
        await api.post("/consultancy/cms/testimonials", payload);
      } else {
        await api.patch(`/consultancy/cms/testimonials/${editing.id}`, payload);
      }
      toast({ title: isNew ? "Testimonial Created" : "Testimonial Updated" });
      setEditing(null);
      fetchTestimonials();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to save.", variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/consultancy/cms/testimonials/${id}`);
      toast({ title: "Testimonial Deleted" });
      fetchTestimonials();
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary mb-1">Testimonials</h1>
          <p className="text-muted-foreground text-sm">Manage client testimonials.</p>
        </div>
        <Button onClick={() => { setEditing({ authorName: "", quote: "", isPublished: false, displayOrder: 0 }); setIsNew(true); }} className="bg-gold text-navy hover:bg-gold/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Add Testimonial
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testimonials.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${t.isPublished ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                {t.isPublished ? "Published" : "Draft"}
              </span>
              {t.rating && <div className="flex gap-0.5">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-accent text-accent" />)}</div>}
            </div>
            <p className="text-sm italic text-foreground mb-3">"{t.quote}"</p>
            <p className="text-sm font-semibold">{t.authorName}</p>
            <p className="text-xs text-muted-foreground">{t.authorRole}</p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={() => { setEditing(t); setIsNew(false); }}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(t.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No testimonials yet.</p>}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isNew ? "New Testimonial" : "Edit Testimonial"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Input placeholder="Author Name" value={editing.authorName || ""} onChange={(e) => setEditing({ ...editing, authorName: e.target.value })} />
              <Input placeholder="Author Role (e.g. Startup Founder)" value={editing.authorRole || ""} onChange={(e) => setEditing({ ...editing, authorRole: e.target.value })} />
              
              {/* Author Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Author Image (Optional)</label>
                {editing.authorImageUrl ? (
                  <div className="relative w-20 h-20 group">
                    <img src={formatUploadUrl(editing.authorImageUrl)} alt="Author" className="w-full h-full object-cover rounded-full border border-border" />
                    <button onClick={() => setEditing({ ...editing, authorImageUrl: "" })} className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div 
                    className="border border-dashed border-border rounded-full w-20 h-20 flex flex-col items-center justify-center cursor-pointer hover:border-accent/40"
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
                            setEditing({ ...editing, authorImageUrl: formatUploadUrl(data.url) });
                          } catch (err) {
                            toast({ title: "Upload failed", variant: "destructive" });
                          }
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                  </div>
                )}
              </div>

              <Textarea placeholder="Quote" value={editing.quote || ""} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} rows={4} />
              <Select value={editing.consultationType || ""} onValueChange={(v) => setEditing({ ...editing, consultationType: v as any })}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" min={1} max={5} placeholder="Rating (1-5)" value={editing.rating || ""} onChange={(e) => setEditing({ ...editing, rating: parseInt(e.target.value) || null })} />
              <Input type="number" placeholder="Display Order" value={editing.displayOrder || 0} onChange={(e) => setEditing({ ...editing, displayOrder: parseInt(e.target.value) || 0 })} />
              <div className="flex items-center gap-3"><Switch checked={editing.isPublished || false} onCheckedChange={(v) => setEditing({ ...editing, isPublished: v })} /><span className="text-sm">Published</span></div>
              <Button onClick={save} className="w-full bg-gold text-navy hover:bg-gold/90 font-semibold">Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTestimonials;
