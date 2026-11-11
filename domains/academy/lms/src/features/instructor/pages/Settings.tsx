import React, { useEffect, useState } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import { ShieldCheck, Upload, Loader2, CheckCircle2, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/features/auth/hooks/useAuth";
import {
  useInstructorCredentials,
  useRegisterCredentialsMutation,
  useUpdateCredentialsMutation,
} from "@/features/rubric/hooks/useSkillsLab";
import { admissionsService } from "@/features/admissions/services/admissionsService";
import { toast } from "sonner";

const toDateInput = (iso?: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const InstructorSettings = () => {
  const { data: user } = useUser();
  const { data: credential, isLoading: isCredLoading } =
    useInstructorCredentials(user?.firebaseId);
  const registerMutation = useRegisterCredentialsMutation();
  const updateMutation = useUpdateCredentialsMutation();

  const [rnLicenseNumber, setRnLicenseNumber] = useState("");
  const [rnLicenseExpiration, setRnLicenseExpiration] = useState("");
  const [yearsLongTermCareExp, setYearsLongTermCareExp] = useState<number>(0);
  const [trainTheTrainerCertUrl, setTrainTheTrainerCertUrl] = useState("");
  const [wabonApprovalLetterUrl, setWabonApprovalLetterUrl] = useState("");
  const [uploadingField, setUploadingField] = useState<
    "ttt" | "approval" | null
  >(null);

  useEffect(() => {
    if (!credential) return;
    setRnLicenseNumber(credential.rnLicenseNumber || "");
    setRnLicenseExpiration(toDateInput(credential.rnLicenseExpiration));
    setYearsLongTermCareExp(Number(credential.yearsLongTermCareExp ?? 0));
    setTrainTheTrainerCertUrl(credential.trainTheTrainerCertUrl || "");
    setWabonApprovalLetterUrl(credential.wabonApprovalLetterUrl || "");
  }, [credential]);

  const handleUploadDoc = async (
    field: "ttt" | "approval",
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    try {
      const url = await admissionsService.uploadDocumentFile(file);
      if (!url) {
        toast.error("Upload succeeded without a document URL.");
        return;
      }
      if (field === "ttt") setTrainTheTrainerCertUrl(url);
      else setWabonApprovalLetterUrl(url);
      toast.success("Credential document uploaded.");
    } catch {
      toast.error("Failed to upload credential document.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rnLicenseNumber.trim() || !rnLicenseExpiration) {
      toast.error("RN license number and future expiration date are required.");
      return;
    }

    const expDate = new Date(rnLicenseExpiration);
    if (isNaN(expDate.getTime()) || expDate <= new Date()) {
      toast.error("RN license expiration date must be in the future.");
      return;
    }

    const payload = {
      rnLicenseNumber: rnLicenseNumber.trim(),
      rnLicenseExpiration: expDate.toISOString(),
      yearsLongTermCareExp: Math.max(0, Number(yearsLongTermCareExp) || 0),
      ...(trainTheTrainerCertUrl.trim()
        ? { trainTheTrainerCertUrl: trainTheTrainerCertUrl.trim() }
        : {}),
      ...(wabonApprovalLetterUrl.trim()
        ? { wabonApprovalLetterUrl: wabonApprovalLetterUrl.trim() }
        : {}),
    };

    try {
      if (credential?.id) {
        await updateMutation.mutateAsync(payload);
      } else {
        await registerMutation.mutateAsync(payload);
      }
    } catch {
      // handled by mutation
    }
  };

  const isSaving = registerMutation.isPending || updateMutation.isPending;
  const credentialStatus =
    credential?.complianceStatus ||
    (credential?.isDirectorApproved
      ? "APPROVED"
      : credential?.id
        ? "SUBMITTED"
        : undefined);

  return (
    <InstructorLayout>
      <main className="section-container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-slate-900 border-none">
            Instructor Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your WABON RN instructor credentials and teaching profile.
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* WABON RN Instructor Credentials Card */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  WABON RN Instructor Credentials
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Required under WAC 246-841A-430 for supervising classroom, skills lab checkoffs, and clinical shifts.
                </CardDescription>
              </div>
              {credentialStatus && (
                <Badge
                  variant="outline"
                  className={
                    credentialStatus === "APPROVED" ||
                    credentialStatus === "COMPLIANT" ||
                    credentialStatus === "VERIFIED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                      : "bg-amber-50 text-amber-700 border-amber-200 font-bold"
                  }
                >
                  {credentialStatus === "APPROVED" ||
                  credentialStatus === "COMPLIANT" ||
                  credentialStatus === "VERIFIED" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 mr-1" />
                  )}
                  {credentialStatus}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {isCredLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading credential record...
                </div>
              ) : (
                <form onSubmit={handleSaveCredentials} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="rnLicenseNumber">RN License Number *</Label>
                      <Input
                        id="rnLicenseNumber"
                        value={rnLicenseNumber}
                        onChange={(e) => setRnLicenseNumber(e.target.value)}
                        placeholder="e.g. RN60123456"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rnLicenseExpiration">
                        License Expiration Date *
                      </Label>
                      <Input
                        id="rnLicenseExpiration"
                        type="date"
                        value={rnLicenseExpiration}
                        onChange={(e) => setRnLicenseExpiration(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="yearsLtc">
                        Years Long-Term Care Experience *
                      </Label>
                      <Input
                        id="yearsLtc"
                        type="number"
                        min={0}
                        max={60}
                        value={yearsLongTermCareExp}
                        onChange={(e) =>
                          setYearsLongTermCareExp(Number(e.target.value) || 0)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Train-the-Trainer Certificate (Optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={trainTheTrainerCertUrl}
                          onChange={(e) =>
                            setTrainTheTrainerCertUrl(e.target.value)
                          }
                          placeholder="Upload or paste certificate URL"
                          className="text-xs"
                        />
                        <label className="cursor-pointer shrink-0">
                          <span className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold">
                            {uploadingField === "ttt" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            Upload
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleUploadDoc("ttt", e)}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>WABON Approval Letter (Optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={wabonApprovalLetterUrl}
                          onChange={(e) =>
                            setWabonApprovalLetterUrl(e.target.value)
                          }
                          placeholder="Upload or paste approval letter URL"
                          className="text-xs"
                        />
                        <label className="cursor-pointer shrink-0">
                          <span className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold">
                            {uploadingField === "approval" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            Upload
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleUploadDoc("approval", e)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSaving || Boolean(uploadingField)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      {isSaving && (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      )}
                      {credential?.id
                        ? "Update RN Credentials"
                        : "Submit RN Credentials"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Public Profile</CardTitle>
              <CardDescription className="text-xs">
                Account identity synced from your LMS profile ({user?.email || "—"}).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                    Instructor Name
                  </span>
                  <span className="font-bold text-slate-900">
                    {`${user?.firstname || ""} ${user?.lastname || ""}`.trim() || "—"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                    Role
                  </span>
                  <span className="font-bold text-slate-900">
                    {user?.role || "INSTRUCTOR"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </InstructorLayout>
  );
};

export default InstructorSettings;
