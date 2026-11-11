import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useVerifyCertificateMutation } from "@/features/rubric/hooks/useCertification";
import { ShieldCheck, Search, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VerifiedCertificate } from "@/features/rubric/types";
import { format } from "date-fns";

const PublicCertificateVerifyPage: React.FC = () => {
  const { certificateNumber: routeCertNumber } = useParams<{
    certificateNumber?: string;
  }>();
  const [inputCert, setInputCert] = useState(routeCertNumber || "");
  const [verified, setVerified] = useState<VerifiedCertificate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const verifyMutation = useVerifyCertificateMutation();

  const runVerification = async (certNumber: string) => {
    const trimmed = certNumber.trim();
    if (!trimmed) return;
    setErrorMsg(null);
    try {
      const res = await verifyMutation.mutateAsync(trimmed);
      setVerified(res);
    } catch (err: any) {
      setVerified(null);
      setErrorMsg(
        err?.response?.data?.message || "Certificate could not be verified.",
      );
    }
  };

  useEffect(() => {
    if (routeCertNumber) {
      setInputCert(routeCertNumber);
      runVerification(routeCertNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCertNumber]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                WABON Credential Verification
              </h1>
              <p className="text-xs text-slate-500">
                Verify Aliko Academy Nursing Assistant completion certificates.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Portal Login
          </Link>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runVerification(inputCert);
          }}
          className="flex gap-2"
        >
          <Input
            value={inputCert}
            onChange={(e) => setInputCert(e.target.value)}
            placeholder="Enter certificate number (e.g. ALIKO-WABON-...)"
            className="h-10 text-xs"
          />
          <Button
            type="submit"
            disabled={verifyMutation.isPending}
            className="h-10 px-4 text-xs font-semibold gap-1.5"
          >
            {verifyMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Verify
          </Button>
        </form>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        {verified && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Verified Credential
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase">
                {verified.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-emerald-950">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                  Certificate Number
                </span>
                <span className="font-mono font-bold">{verified.certificateNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                  WABON Approval Code
                </span>
                <span className="font-semibold">{verified.wabonApprovalCode}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                  Institution
                </span>
                <span className="font-semibold">{verified.institution}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                  Program
                </span>
                <span className="font-semibold">{verified.programName}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                  State Board &amp; Compliance
                </span>
                <span>
                  {verified.stateBoard} · {verified.regulatoryCompliance}
                </span>
              </div>
              {verified.verifiedAt && (
                <div className="sm:col-span-2 text-[11px] text-emerald-700">
                  Verified at {format(new Date(verified.verifiedAt), "PPP p")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCertificateVerifyPage;

