import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileText, Video, Link as LinkIcon, HelpCircle } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content?: {
    title: string;
    type: string;
    url?: string;
    content?: string; // For text content or exercise description
    options?: any; // For quiz options
  };
}

const getFullUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const baseUrl = import.meta.env.VITE_API_URL || "https://api.consultancy.alikohub.com";
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
};

const parseOptions = (options: any): string[] => {
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return options
        .split(",")
        .map((o: string) => o.trim())
        .filter(Boolean);
    }
  }
  return [];
};

export const PreviewModal = ({
  isOpen,
  onClose,
  content,
}: PreviewModalProps) => {
  if (!content) return null;

  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes("youtube.com/watch")) {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get("v");
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
      } else if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1]?.split("?")[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const renderPreview = () => {
    switch (content.type) {
      case "VIDEO": {
        const isYT =
          content.url &&
          (content.url.includes("youtube.com") ||
            content.url.includes("youtu.be"));
        const embedUrl = content.url
          ? isYT
            ? getEmbedUrl(content.url)
            : getFullUrl(content.url)
          : null;

        return (
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center relative shadow-inner">
            {embedUrl ? (
              isYT ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0 absolute inset-0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <video
                  src={embedUrl}
                  controls
                  className="w-full h-full"
                  poster="/placeholder.svg"
                />
              )
            ) : (
              <div className="text-white flex flex-col items-center gap-2">
                <Video className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium opacity-50">
                  No video URL provided
                </p>
              </div>
            )}
          </div>
        );
      }
      case "PDF":
        return (
          <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
            {content.url ? (
              <iframe
                src={`${getFullUrl(content.url)}#toolbar=0`}
                className="w-full h-full"
                title={content.title}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                <FileText className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium opacity-50">
                  No PDF URL provided
                </p>
              </div>
            )}
          </div>
        );
      case "TEXT":
      case "LINK":
        return (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 min-h-[200px]">
            <div className="flex items-center gap-3 mb-4 text-slate-900 font-bold">
              <LinkIcon className="w-5 h-5 text-accent" />
              <span>External Resource</span>
            </div>
            <p className="text-slate-600 mb-6">
              This content is hosted externally. You can view the full resource
              by clicking the link below.
            </p>
            {content.url ? (
              <a
                href={getFullUrl(content.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
              >
                Access Resource <LinkIcon className="w-4 h-4" />
              </a>
            ) : (
              <p className="text-sm text-red-500 font-medium">
                No URL provided for this link
              </p>
            )}
          </div>
        );
      case "QUIZ":
      case "MULTIPLE_CHOICE":
      case "TRUE_FALSE": {
        const options = parseOptions(content.options);
        return (
          <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100 shadow-sm relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-orange-100/40 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6 text-amber-700 font-bold uppercase tracking-wider text-xs">
                <HelpCircle className="w-4 h-4" />
                <span>Quiz Preview</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6 font-heading">
                {content.title}
              </h3>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/40 shadow-sm mb-6">
                <p className="text-slate-800 font-medium text-lg">
                  {content.content || "No question text available for preview."}
                </p>
              </div>

              {options && options.length > 0 && (
                <div className="space-y-3">
                  {options.map((opt: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border flex items-center gap-4 transition-colors bg-white/60 border-slate-200"
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100 text-slate-500">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="font-medium text-slate-700">{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-white/60 px-3 py-1.5 rounded-full border border-amber-100 shadow-sm">
                  Interactive Quiz
                </span>
              </div>
            </div>
          </div>
        );
      }
      default:
        return (
          <div className="p-12 text-center text-slate-400 font-medium">
            Preview not available for this type.
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              {content.type === "VIDEO" && <Video className="w-5 h-5" />}
              {content.type === "PDF" && <FileText className="w-5 h-5" />}
              {(content.type === "TEXT" || content.type === "LINK") && (
                <LinkIcon className="w-5 h-5" />
              )}
              {(content.type === "QUIZ" ||
                content.type === "MULTIPLE_CHOICE" ||
                content.type === "TRUE_FALSE") && (
                <HelpCircle className="w-5 h-5" />
              )}
            </div>
            {content.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preview of {content.title} ({content.type})
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2">{renderPreview()}</div>
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8">
          <span>{content.type} PREVIEW</span>
          <span>STREAMS ACADEMY V2</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
