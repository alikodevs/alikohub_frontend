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
    <div className="min-h-screen bg-[#f6f8fb] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#e5e9f0] shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0fa] text-[#2b5f9e] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0f1b2d]">
                WABON Credential Verification
              </h1>
              <p className="text-xs text-[#64748b]">
                Verify Aliko Academy Nursing Assistant completion certificates.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold text-[#64748b] hover:text-[#2b5f9e] flex items-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Portal Login
          </Link>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runVerification(inputCert);
          }}
          className="space-y-2"
        >
          <div className="flex gap-2">
            <Input
              value={inputCert}
              onChange={(e) => setInputCert(e.target.value)}
              placeholder="Enter certificate number (e.g. WA-NAC-1-STUDENT-2026)"
              className="h-10 text-xs border-[#e5e9f0]"
            />
            <Button
              type="submit"
              disabled={verifyMutation.isPending}
              className="h-10 px-4 text-xs font-semibold gap-1.5 bg-[#2b5f9e] hover:bg-[#234e83] text-white shrink-0"
            >
              {verifyMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Verify
            </Button>
          </div>
          <p className="text-[11px] text-[#64748b]">
            Expected format: <code className="font-mono text-[#0f1b2d]">WA-NAC-&lt;cohortId&gt;-&lt;id&gt;-&lt;year&gt;</code>
          </p>
        </form>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        {verified && (
          <div className="p-5 rounded-2xl bg-[#f4f8fd] border border-[#c8dcf3] space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[#0f1b2d] flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#2b5f9e]" />
                Verified Credential
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#2b5f9e] text-white text-[10px] font-bold uppercase tracking-wide">
                {verified.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[#0f1b2d]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#2b5f9e] block">
                  Certificate Number
                </span>
                <span className="font-mono font-bold">{verified.certificateNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#2b5f9e] block">
                  WABON Approval Code
                </span>
                <span className="font-semibold">{verified.wabonApprovalCode}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#2b5f9e] block">
                  Institution
                </span>
                <span className="font-semibold">{verified.institution}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#2b5f9e] block">
                  Program
                </span>
                <span className="font-semibold">{verified.programName}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-[#2b5f9e] block">
                  State Board &amp; Compliance
                </span>
                <span>
                  {verified.stateBoard} · {verified.regulatoryCompliance}
                </span>
              </div>
              {verified.verifiedAt && (
                <div className="sm:col-span-2 text-[11px] text-[#64748b]">
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

