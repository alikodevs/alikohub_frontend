import React, { useState, useRef, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Camera,
  Upload,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { admissionsService } from "@/features/admissions/services/admissionsService";
import { toast } from "sonner";

interface ExamIdentityVerificationCardProps {
  user?: any;
  questionsCount: number;
  attestationChecked: boolean;
  onAttestationChange: (checked: boolean) => void;
  onBeginExam: (capture: { idPhotoUrl?: string; webcamSnapUrl?: string }) => void;
  isReadOnlyPreview?: boolean;
}

export const ExamIdentityVerificationCard: React.FC<
  ExamIdentityVerificationCardProps
> = ({
  user,
  questionsCount,
  attestationChecked,
  onAttestationChange,
  onBeginExam,
  isReadOnlyPreview = false,
}) => {
  const [idPhotoUrl, setIdPhotoUrl] = useState<string>("");
  const [webcamSnapUrl, setWebcamSnapUrl] = useState<string>("");
  const [uploadingField, setUploadingField] = useState<"id" | "webcam" | null>(
    null
  );
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const handleFileUpload = async (
    file: File | undefined,
    target: "id" | "webcam"
  ) => {
    if (!file) return;
    setUploadingField(target);
    try {
      const url = await admissionsService.uploadDocumentFile(file);
      if (!url) {
        toast.error("Upload failed. Please try another file.");
        return;
      }
      if (target === "id") {
        setIdPhotoUrl(url);
        toast.success("Government Photo ID uploaded.");
      } else {
        setWebcamSnapUrl(url);
        toast.success("Identity snapshot uploaded.");
      }
    } catch {
      toast.error("Could not upload verification photo.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleOpenCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera API unavailable in this browser. Upload a selfie image instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      toast.error("Camera permission denied. You can upload an identity photo instead.");
    }
  };

  const handleCaptureSnapshot = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      stopCamera();
      if (!blob) return;
      const file = new File([blob], `proctor-snap-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      await handleFileUpload(file, "webcam");
    }, "image/jpeg", 0.85);
  };

  if (isReadOnlyPreview) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              Proctored Examination View (Read-Only Inspection)
            </h3>
            <p className="text-xs text-slate-500 m-0">
              {questionsCount} Questions &bull; Student honor code, webcam/ID capture, and tab-blur telemetry are enforced during live attempts.
            </p>
          </div>
        </div>
        <Button
          onClick={() => onBeginExam({})}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 h-10 rounded-lg"
        >
          Inspect Exam Questions (Read-Only)
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 m-0">
            Academic Integrity &amp; Identity Verification
          </h3>
          <p className="text-xs text-slate-500 m-0">
            Examination Security Protocol
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-xs">
        <div>
          <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-0.5">
            Enrolled Student
          </span>
          <span className="font-bold text-slate-800 text-sm block">
            {user ? `${user.firstname} ${user.lastname}` : "Candidate"}
          </span>
          <span className="text-slate-500 block">{user?.email}</span>
        </div>
        <div>
          <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-0.5">
            Monitored Parameters
          </span>
          <span className="font-bold text-slate-800 text-sm block">
            {questionsCount} Questions &middot; Timed Assessment
          </span>
          <span className="text-slate-500 block">
            Tab navigation &amp; window focus monitored
          </span>
        </div>
      </div>

      {/* Photo ID & Live Webcam Identity Verification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              1. Government Photo ID
            </span>
            {idPhotoUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Captured
              </span>
            )}
          </div>
          {idPhotoUrl && (
            <img
              src={idPhotoUrl}
              alt="Uploaded ID"
              className="h-24 w-full object-cover rounded-lg border border-slate-200 bg-white"
            />
          )}
          <label className="inline-flex items-center justify-center w-full h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer gap-1.5">
            {uploadingField === "id" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {idPhotoUrl ? "Replace Photo ID" : "Upload Photo ID"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingField !== null}
              onChange={(e) => handleFileUpload(e.target.files?.[0], "id")}
            />
          </label>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              2. Candidate Webcam Snapshot
            </span>
            {webcamSnapUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Captured
              </span>
            )}
          </div>

          {cameraActive ? (
            <div className="space-y-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-32 object-cover rounded-lg bg-slate-900"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCaptureSnapshot}
                  className="flex-1 h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Camera className="w-3.5 h-3.5 mr-1" /> Capture Photo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={stopCamera}
                  className="h-8 px-2.5 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {webcamSnapUrl && (
                <img
                  src={webcamSnapUrl}
                  alt="Webcam snapshot"
                  className="h-24 w-full object-cover rounded-lg border border-slate-200 bg-white"
                />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenCamera}
                  disabled={uploadingField !== null}
                  className="flex-1 h-9 text-xs font-semibold bg-white"
                >
                  {uploadingField === "webcam" ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Use Webcam
                </Button>
                <label className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer gap-1">
                  <Upload className="w-3.5 h-3.5" /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingField !== null}
                    onChange={(e) =>
                      handleFileUpload(e.target.files?.[0], "webcam")
                    }
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          Student Examination Attestation
        </div>
        <p className="leading-relaxed">
          By beginning this assessment, I certify that I am the enrolled student
          listed above. I attest that I will complete this examination
          independently without unauthorized aids, browser extensions, secondary
          monitors, or external assistance, in compliance with academy
          assessment policies.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={attestationChecked}
            onChange={(e) => onAttestationChange(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
          <span>
            I confirm my identity and agree to the exam integrity pledge
          </span>
        </label>

        <Button
          onClick={() => {
            if (!attestationChecked) {
              toast.error(
                "Please confirm your identity and check the attestation pledge to begin."
              );
              return;
            }
            stopCamera();
            onBeginExam({
              idPhotoUrl: idPhotoUrl || undefined,
              webcamSnapUrl: webcamSnapUrl || undefined,
            });
          }}
          disabled={!attestationChecked || uploadingField !== null}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 h-10 rounded-lg shadow-sm"
        >
          <ShieldCheck className="w-4 h-4 mr-2" />
          Begin Monitored Assessment
        </Button>
      </div>
    </div>
  );
};

