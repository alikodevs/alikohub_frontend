import { useEffect, useState, useRef } from "react";
import api, { formatUploadUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, FileText, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Resource = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  resourceType: "article" | "guide" | "checklist" | "template";
  consultationType: string | null;
  isPublished: boolean;
  thumbnailUrl: string | null;
  fileUrl: string | null;
  createdAt: string;
};

const emptyResource: Partial<Resource> = {
  title: "",
  slug: "",
  description: "",
  resourceType: "article",
  consultationType: "",
  isPublished: false,
  thumbnailUrl: "",
  fileUrl: ""
};

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.txt,.csv,.zip,.rar";

const AdminResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [editing, setEditing] = useState<Partial<Resource> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchResources = async () => {
    try {
      const { data } = await api.get("/consultancy/cms/resources");
      setResources(data || []);
    } catch (e) {
      toast({ title: "Error", description: "Failed to fetch resources.", variant: "destructive" });
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const uploadFile = async (file: File, type: "image" | "document" = "document"): Promise<string | null> => {
    setUploading(true);
    setUploadProgress(30);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post(`/upload/${type}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });
      setUploadProgress(100);
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
      return formatUploadUrl(data.url);
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.response?.data?.message || error.message, variant: "destructive" });
      setUploading(false);
      setUploadProgress(0);
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "thumbnail") => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 50MB.", variant: "destructive" });
      return;
    }

    const uploadType = type === "thumbnail" ? "image" : "document";
    const url = await uploadFile(file, uploadType);
    if (url) {
      if (type === "file") {
        setEditing({ ...editing, fileUrl: url });
      } else {
        setEditing({ ...editing, thumbnailUrl: url });
      }
      toast({ title: "File uploaded successfully" });
    }
    if (e.target) e.target.value = "";
  };


  const save = async () => {
    if (!editing) return;
    const payload = {
      title: editing.title,
      slug: editing.slug,
      description: editing.description,
      resourceType: editing.resourceType,
      thumbnailUrl: editing.thumbnailUrl || null,
      consultationType: editing.consultationType || null,
      isPublished: editing.isPublished,
      fileUrl: editing.fileUrl || null,
    };

    try {
      if (isNew) {
        await api.post("/consultancy/cms/resources", payload);
      } else {
        await api.patch(`/consultancy/cms/resources/${editing.id}`, payload);
      }
      toast({ title: isNew ? "Resource Created" : "Resource Updated" });
      setEditing(null);
      fetchResources();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to save.", variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/consultancy/cms/resources/${id}`);
      toast({ title: "Resource Deleted" });
      fetchResources();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split("/");
      const name = parts[parts.length - 1];
      return name.split("?")[0];
    } catch {
      return "Attached file";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary mb-1">Resources</h1>
          <p className="text-muted-foreground text-sm">Manage articles, guides, checklists, and templates.</p>
        </div>
        <Button onClick={() => { setEditing(emptyResource); setIsNew(true); }} className="bg-gold text-navy hover:bg-gold/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Add Resource
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${r.isPublished ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                {r.isPublished ? "Published" : "Draft"}
              </span>
              <span className="text-xs text-muted-foreground capitalize">{r.resourceType}</span>
            </div>
            <h3 className="font-semibold text-primary mb-1">{r.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{r.description}</p>
            {r.fileUrl && (
              <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mb-3">
                <FileText className="w-3 h-3" /> File attached
              </a>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditing(r); setIsNew(false); }}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
        {resources.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No resources yet.</p>}
      </div>


      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isNew ? "New Resource" : "Edit Resource"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Input placeholder="Title" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })} />
              <Input placeholder="Slug" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              <Textarea placeholder="Description" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              <Select value={editing.resourceType || "article"} onValueChange={(v) => setEditing({ ...editing, resourceType: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                </SelectContent>
              </Select>
              <Select value={editing.consultationType || ""} onValueChange={(v) => setEditing({ ...editing, consultationType: v as any })}>
                <SelectTrigger><SelectValue placeholder="Category (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                </SelectContent>
              </Select>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Thumbnail Image (Optional)</label>
                {editing.thumbnailUrl ? (
                  <div className="relative w-24 h-24 group">
                    <img src={editing.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover rounded-lg border border-border" />
                    <button
                      onClick={() => setEditing({ ...editing, thumbnailUrl: "" })}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="border border-dashed border-border rounded-lg py-4 text-center cursor-pointer hover:border-accent/40"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e: any) => handleFileChange(e, "thumbnail");
                      input.click();
                    }}
                  >
                    <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Upload thumbnail</p>
                  </div>
                )}
              </div>


              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Attach File (PDF, Word, Image, etc.)</label>
                {editing.fileUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="w-4 h-4 text-accent shrink-0" />
                    <a href={editing.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline truncate flex-1">
                      {getFileName(editing.fileUrl)}
                    </a>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditing({ ...editing, fileUrl: "" })} className="text-destructive shrink-0">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload a file</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, Images, ZIP — up to 50MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "file")}
                />
                {uploading && <Progress value={uploadProgress} className="h-2" />}
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={editing.isPublished || false} onCheckedChange={(v) => setEditing({ ...editing, isPublished: v })} />
                <span className="text-sm">Published</span>
              </div>
              <Button onClick={save} disabled={uploading} className="w-full bg-gold text-navy hover:bg-gold/90 font-semibold">Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminResources;
