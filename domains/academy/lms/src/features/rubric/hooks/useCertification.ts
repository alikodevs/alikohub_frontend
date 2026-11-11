import { useMutation } from "@tanstack/react-query";
import { wabonComplianceService } from "../services/wabonComplianceService";
import type {
  GenerateCertificateDto,
  GeneratedCertificate,
  VerifiedCertificate,
} from "../types";
import { toast } from "sonner";

export const useGenerateCertificateMutation = () => {
  return useMutation<GeneratedCertificate, any, GenerateCertificateDto>({
    mutationFn: (dto: GenerateCertificateDto) =>
      wabonComplianceService.generateCertificate(dto),
    onSuccess: () => {
      toast.success("Official state completion certificate generated!");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          "Program requirements not yet met for certificate issuance"
      );
    },
  });
};

export const useVerifyCertificateMutation = () => {
  return useMutation<VerifiedCertificate, any, string>({
    mutationFn: (certificateNumber: string) =>
      wabonComplianceService.verifyCertificate(certificateNumber),
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          "Certificate number not found or invalid format"
      );
    },
  });
};

