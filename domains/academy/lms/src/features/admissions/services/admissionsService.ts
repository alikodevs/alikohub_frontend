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
    try {
      const response = await api.post<AdmissionsApplication>(
        "/admissions/submit",
        payload
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await api.post<AdmissionsApplication>(
          "/academy/admissions/submit",
          payload
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
    try {
      const response = await api.post<AdmissionsApplication>(
        "/admissions/sign-agreement",
        payload
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await api.post<AdmissionsApplication>(
          "/academy/admissions/sign-agreement",
          payload
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
    try {
      const response = await api.patch<AdmissionsApplication>(
        "/admissions/review",
        payload
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await api.patch<AdmissionsApplication>(
          "/academy/admissions/review",
          payload
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
    try {
      const res = await api.post<{ url: string }>("/upload/document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.url;
    } catch {
      const fallback = await api.post<{ url: string }>("/content/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return fallback.data?.url;
    }
  },
};

