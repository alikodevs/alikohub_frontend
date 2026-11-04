import api from "@/lib/api";
import type { SeatTimeHeartbeatDto, SeatTimeSummary } from "../types";

export const wabonComplianceService = {
  // ── Seat-Time Heartbeat Engine (WAC 246-841A-440(2) / Postman 2.4.1) ──
  recordSeatTimeHeartbeat: async (dto: SeatTimeHeartbeatDto): Promise<{ success: boolean; recordedSeconds?: number }> => {
    const payload = {
      courseId: Number(dto.courseId),
      lessonId: Number(dto.lessonId),
      cohortId: Number(dto.cohortId) || 1,
      activeSeconds: dto.activeSeconds ?? dto.intervalSeconds ?? 60,
      idleSeconds: dto.idleSeconds ?? 0,
      tabFocused: dto.tabFocused !== undefined ? dto.tabFocused : true,
      intervalSeconds: dto.intervalSeconds ?? dto.activeSeconds ?? 60,
      engagementScore: dto.engagementScore ?? 1.0,
      interactionType: dto.interactionType ?? "READING",
    };
    const response = await api.post<{ success: boolean; recordedSeconds?: number }>(
      "/seat-time/heartbeat",
      payload
    );
    return response.data;
  },

  getSeatTimeSummary: async (courseId: string | number): Promise<SeatTimeSummary> => {
    const response = await api.get<SeatTimeSummary>(
      `/seat-time/summary/course/${courseId}`
    );
    return response.data;
  },

  // Postman 2.4.10: GET {{baseUrl}}/seat-time/lesson/{{lessonId}}/course/{{courseId}}
  getLessonSeatTimeBreakdown: async (lessonId: string | number, courseId: string | number) => {
    const response = await api.get(
      `/seat-time/lesson/${lessonId}/course/${courseId}`
    );
    return response.data;
  },

  getCohortSeatTimeReport: async (cohortId: string | number) => {
    const response = await api.get(`/seat-time/cohort/${cohortId}/report`);
    return response.data;
  },

  // ── Clinical Hours & Ratio Enforcement (WAC 246-841A-440) ──
  createClinicalShift: async (dto: any) => {
    const response = await api.post("/clinical/shifts", dto);
    return response.data;
  },

  getCohortClinicalShifts: async (cohortId: string | number) => {
    const response = await api.get(`/clinical/shifts/cohort/${cohortId}`);
    return response.data;
  },

  recordClinicalAttendance: async (dto: any) => {
    const response = await api.post("/clinical/attendance", dto);
    return response.data;
  },

  getStudentClinicalHours: async (studentUserId: string, cohortId: string | number) => {
    const response = await api.get(
      `/clinical/hours/student/${studentUserId}/cohort/${cohortId}`
    );
    return response.data;
  },

  // ── Technical Support Desk (WAC 246-841A-440(18)) ──
  getSystemRequirements: async () => {
    const response = await api.get("/support-desk/system-requirements");
    return response.data;
  },

  createSupportTicket: async (dto: any) => {
    const response = await api.post("/support-desk/tickets", dto);
    return response.data;
  },

  getMySupportTickets: async () => {
    const response = await api.get("/support-desk/tickets/me");
    return response.data;
  },

  // ── Regulatory Compliance Dossier (WAC 246-841A-440) ──
  generateDossier: async (dto: { courseId?: string | number; cohortId: string | number; studentUserId?: string; includeFullLogs?: boolean }) => {
    const response = await api.post("/compliance-exporter/dossier", dto);
    return response.data;
  },
};
