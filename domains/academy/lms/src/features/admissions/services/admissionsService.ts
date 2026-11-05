import api from "@/lib/api";
import type {
  SubmitDocumentsPayload,
  SignAgreementPayload,
  AdmissionsApplication,
  AdmissionsReviewPayload,
  CohortCensusEnrollment,
} from "../types";

export const admissionsService = {
  /**
   * Submit prerequisite document URLs for student admissions clearance
   * Endpoint: POST /admissions/submit
   */
  submitPrerequisites: async (
    payload: SubmitDocumentsPayload
  ): Promise<AdmissionsApplication> => {
    const toUri = (val?: string | null) => {
      if (!val || typeof val !== "string") return "";
      const trimmed = val.trim();
      if (!trimmed) return "";
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed.replace(/^\/+/, "")}`;
    };

    const body = {
      cohortId: Number(payload.cohortId),
      backgroundCheckUrl: toUri(payload.backgroundCheckUrl),
      tbTestProofUrl: toUri(payload.tbTestProofUrl),
      immunizationProofUrl: toUri(payload.immunizationProofUrl),
      cprCertUrl: toUri(payload.cprCertUrl),
      idDocUrl: toUri(payload.idDocUrl),
      highSchoolProofUrl: toUri(payload.highSchoolProofUrl),
    };
    try {
      const response = await api.post<AdmissionsApplication>(
        "/admissions/submit",
        body
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await api.post<AdmissionsApplication>(
          "/academy/admissions/submit",
          body
        );
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Submit digital signature and statutory disclosure acknowledgments
   * Endpoint: POST /admissions/sign-agreement
   */
  signAgreement: async (
    payload: SignAgreementPayload
  ): Promise<AdmissionsApplication> => {
    // Backend Joi schema strictly requires:
    // { cohortId: number (integer), signatureUrl: string, disclosuresAcknowledged: true }
    // Joi will reject any extra/unknown keys with: "value" does not match any of the allowed types
    const signatureText = (
      payload.signatureUrl ||
      payload.signature ||
      ""
    ).trim();

    const body = {
      cohortId: Number(payload.cohortId),
      signatureUrl: signatureText,
      disclosuresAcknowledged: true,
    };

    try {
      const response = await api.post<AdmissionsApplication>(
        "/admissions/sign-agreement",
        body
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await api.post<AdmissionsApplication>(
          "/academy/admissions/sign-agreement",
          body
        );
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Retrieve student application and clearance checklist status, verification state, and rejection reasons
   * Endpoint: GET /admissions/my-application/:cohortId
   */
  getMyApplication: async (
    cohortId: number
  ): Promise<AdmissionsApplication | null> => {
    try {
      const response = await api.get<AdmissionsApplication>(
        `/admissions/my-application/${cohortId}`
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          const fallback = await api.get<AdmissionsApplication>(
            `/academy/admissions/my-application/${cohortId}`
          );
          return fallback.data;
        } catch {
          return null;
        }
      }
      return null;
    }
  },

  /**
   * Retrieve incoming student applications for a cohort (Instructor / Admin review)
   * Endpoint: GET /admissions/cohort/:cohortId
   */
  getCohortApplications: async (
    cohortId: number
  ): Promise<AdmissionsApplication[]> => {
    try {
      const response = await api.get<AdmissionsApplication[]>(
        `/admissions/cohort/${cohortId}`
      );
      return Array.isArray(response.data) ? response.data : (response.data as any)?.applications || [];
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await api.get<AdmissionsApplication[]>(
          `/academy/admissions/cohort/${cohortId}`
        );
        return Array.isArray(fallback.data) ? fallback.data : (fallback.data as any)?.applications || [];
      }
      throw err;
    }
  },

  /**
   * Approve or reject student admissions clearance
   * Endpoint: PATCH /admissions/review
   * Approval: { applicationId: 5, status: "APPROVED" }
   * Rejection: { applicationId: 5, status: "REJECTED", rejectionReason: "..." }
   */
  reviewApplication: async (
    payload: AdmissionsReviewPayload
  ): Promise<AdmissionsApplication> => {
    const body: Record<string, any> = {
      applicationId: Number(payload.applicationId),
      status: payload.status,
    };
    if (payload.status === "REJECTED" && payload.rejectionReason) {
      body.rejectionReason = payload.rejectionReason;
    }

    try {
      const response = await api.patch<AdmissionsApplication>(
        "/admissions/review",
        body
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await api.patch<AdmissionsApplication>(
          "/academy/admissions/review",
          body
        );
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Retrieve cohort enrollment census and first-week attendance verification data
   * Endpoint: GET /enrollments/cohort/:cohortId
   */
  getCohortCensus: async (
    cohortId: number
  ): Promise<CohortCensusEnrollment[]> => {
    try {
      const response = await api.get<CohortCensusEnrollment[]>(
        `/enrollments/cohort/${cohortId}`
      );
      return Array.isArray(response.data) ? response.data : (response.data as any)?.enrollments || [];
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await api.get<CohortCensusEnrollment[]>(
          `/academy/enrollments/cohort/${cohortId}`
        );
        return Array.isArray(fallback.data) ? fallback.data : (fallback.data as any)?.enrollments || [];
      }
      throw err;
    }
  },

  /**
   * Helper to upload document file and return hosted URL
   */
  uploadDocumentFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document", file);
    try {
      const res = await api.post<any>("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const rawUrl =
        res.data?.url ||
        res.data?.fileUrl ||
        res.data?.secure_url ||
        res.data?.data?.url ||
        res.data?.data?.fileUrl ||
        "";
      if (!rawUrl) return "";
      if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
      const base = (import.meta.env.VITE_API_URL || "https://api.consultancy.alikohub.com").replace(/\/+$/, "");
      return `${base}/${rawUrl.replace(/^\/+/, "")}`;
    } catch {
      try {
        const res2 = await api.post<any>("/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const rawUrl = res2.data?.url || res2.data?.fileUrl || res2.data?.secure_url || "";
        if (!rawUrl) return "";
        if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
        const base = (import.meta.env.VITE_API_URL || "https://api.consultancy.alikohub.com").replace(/\/+$/, "");
        return `${base}/${rawUrl.replace(/^\/+/, "")}`;
      } catch {
        const fallback = await api.post<any>("/content/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return fallback.data?.url || fallback.data?.fileUrl || "";
      }
    }
  },
};

