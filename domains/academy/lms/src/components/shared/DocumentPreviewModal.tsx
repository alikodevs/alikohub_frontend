import React, { useState, useEffect, useRef } from "react";
import { X, Download, ExternalLink, Loader2, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  title: string;
  fileUrl: string | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  title,
  fileUrl,
  onClose,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [kind, setKind] = useState<"image" | "document">("document");
  const objectUrlRef = useRef<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Load and create in-memory Blob URL
  useEffect(() => {
    if (!isOpen || !fileUrl) {
      setBlobUrl(null);
      setLoading(false);
      setHasError(false);
      return;
    }

    let isCancelled = false;

    // Detect image by extension
    const isImageFile = /\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(fileUrl);
    setKind(isImageFile ? "image" : "document");
    setLoading(true);
    setHasError(false);

    // If it's already a blob or data URL, use it directly
    if (fileUrl.startsWith("blob:") || fileUrl.startsWith("data:")) {
      setBlobUrl(fileUrl);
      setLoading(false);
      return;
    }

    async function loadDocument() {
      try {
        const token =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(fileUrl!, { headers });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        if (isCancelled) return;

        // Detect type from blob MIME type or response content-type
        const mime = (blob.type || response.headers.get("content-type") || "").toLowerCase();
        if (mime.startsWith("image/")) {
          setKind("image");
        } else {
          setKind("document");
        }

        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setBlobUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        console.warn("Direct blob fetch failed:", err);
        if (!isCancelled) {
          setHasError(true);
          setLoading(false);
        }
      }
    }

    loadDocument();

    // Clean up memory on close / change
    return () => {
      isCancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [isOpen, fileUrl]);

  if (!isOpen || !fileUrl) return null;

  const downloadUrl = blobUrl || fileUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-[88vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#E1E7F1]">
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between border-b border-[#E1E7F1] px-5 py-3.5 bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#2B5E9C] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-sm sm:text-base text-[#0F1B34] truncate">
                {title || "Document Preview"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="h-8 px-3 rounded-xl text-xs font-semibold text-[#0F1B34] bg-white border-[#E1E7F1] hover:bg-slate-50 shadow-2xs"
            >
              <a href={downloadUrl} download={title || "document"}>
                <Download className="w-3.5 h-3.5 mr-1 text-[#5A6B8C]" />
                Download
              </a>
            </Button>

            {/* Open in New Tab Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="h-8 px-3 rounded-xl text-xs font-semibold text-[#0F1B34] bg-white border-[#E1E7F1] hover:bg-slate-50 shadow-2xs"
            >
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1 text-[#5A6B8C]" />
                New tab
              </a>
            </Button>

            {/* Close Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-xl text-[#5A6B8C] hover:text-[#0F1B34] hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ── Modal Content Body ── */}
        <div className="relative flex-1 bg-slate-100/70 flex items-center justify-center overflow-hidden p-2 sm:p-4">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-[#5A6B8C]">
              <Loader2 className="w-7 h-7 animate-spin text-[#2B5E9C]" />
              <p className="text-xs font-medium">Loading document preview...</p>
            </div>
          )}

          {!loading && hasError && (
            <div className="p-6 text-center max-w-md bg-white rounded-2xl border border-[#E1E7F1] shadow-2xs space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <div>
                <h4 className="text-sm font-semibold text-[#0F1B34]">Preview Not Displayable</h4>
                <p className="text-xs text-[#5A6B8C] mt-1">
                  The document could not be rendered directly in the embedded frame. You can open or download it directly.
                </p>
              </div>
              <Button
                asChild
                className="bg-[#2B5E9C] hover:bg-[#204777] text-white text-xs font-semibold rounded-xl h-9 px-4"
              >
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Open Document in New Tab
                </a>
              </Button>
            </div>
          )}

          {!loading && !hasError && blobUrl && (
            kind === "image" ? (
              <img
                src={blobUrl}
                alt={title}
                className="max-h-full max-w-full rounded-xl object-contain shadow-xs bg-white"
                onLoad={() => setLoading(false)}
                onError={() => setHasError(true)}
              />
            ) : (
              <iframe
                title={title}
                src={blobUrl}
                className="h-full w-full rounded-xl bg-white border-0 shadow-xs"
                onLoad={() => setLoading(false)}
                onError={() => setHasError(true)}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;

