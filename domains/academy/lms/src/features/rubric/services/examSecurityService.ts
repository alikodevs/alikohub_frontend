import api from "@/lib/api";
import type {
  ExamSession,
  StartExamSessionDto,
  TabBlurDto,
  EndExamSessionDto,
  AuditExamSessionDto,
} from "../types";

export const examSecurityService = {
  /**
   * Start proctored exam session with identity attestation and snapshot
   * Postman 2.6.1: POST {{baseUrl}}/exam-security/sessions/start
   */
  startSession: async (dto: StartExamSessionDto): Promise<ExamSession> => {
    const response = await api.post<ExamSession>(
      "/exam-security/sessions/start",
      dto
    );
    return response.data;
  },

  /**
   * Record tab-blur / window switch telemetry
   * Postman 2.6.2: POST {{baseUrl}}/exam-security/sessions/tab-blur
   */
  recordTabBlur: async (dto: TabBlurDto): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(
      "/exam-security/sessions/tab-blur",
      dto
    );
    return response.data;
  },

  /**
   * End proctored exam session
   * Postman 2.6.3: POST {{baseUrl}}/exam-security/sessions/end
   */
  endSession: async (dto: EndExamSessionDto): Promise<ExamSession> => {
    const response = await api.post<ExamSession>(
      "/exam-security/sessions/end",
      dto
    );
    return response.data;
  },

  /**
   * Get exam session details and security telemetry
   * Postman 2.6.4: GET {{baseUrl}}/exam-security/sessions/:sessionId
   */
  getSessionDetails: async (
    sessionId: string | number
  ): Promise<ExamSession> => {
    const response = await api.get<ExamSession>(
      `/exam-security/sessions/${sessionId}`
    );
    return response.data;
  },

  /**
   * Instructor / Auditor verification of exam session
   * Postman 4.15: POST {{baseUrl}}/exam-security/sessions/audit
   */
  auditSession: async (dto: AuditExamSessionDto): Promise<ExamSession> => {
    const response = await api.post<ExamSession>(
      "/exam-security/sessions/audit",
      dto
    );
    return response.data;
  },
};
