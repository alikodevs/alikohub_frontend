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

  getStudentCourseSeatTime: async (courseId: string | number, userId: string): Promise<SeatTimeSummary> => {
    const response = await api.get<SeatTimeSummary>(`/seat-time/summary/course/${courseId}`, {
      params: { userId },
    });
    return response.data;
  },

  getInstructorCohorts: async () => {
    const response = await api.get('/cohorts/instructor');
    return response.data;
  },

  getInstructorEnrollments: async (cohortId?: string | number) => {
    const response = await api.get('/enrollments/instructor', {
      params: cohortId ? { cohortId } : undefined,
    });
    return response.data;
  },

  // ── Clinical Hours & Ratio Enforcement (WAC 246-841A-440 / 40h Min, 10:1 Ratio) ──
  createClinicalShift: async (dto: {
    cohortId: number;
    facilityName: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    hoursCredited: number;
  }) => {
    const response = await api.post("/clinical/shifts", dto);
    return response.data;
  },

  getCohortClinicalShifts: async (cohortId: string | number) => {
    const response = await api.get(`/clinical/shifts/cohort/${cohortId}`);
    return response.data;
  },

  getClinicalShift: async (shiftId: string | number) => {
    const response = await api.get(`/clinical/shifts/${shiftId}`);
    return response.data;
  },

  recordClinicalAttendance: async (dto: {
    shiftId: number;
    studentUserId: string;
    hoursCompleted: number;
    competencyNotes?: string;
    passed?: boolean;
  }) => {
    const response = await api.post("/clinical/attendance", dto);
    return response.data;
  },

  updateClinicalAttendance: async (
    attendanceId: number | string,
    dto: {
      hoursCompleted?: number;
      competencyNotes?: string;
      passed?: boolean;
    }
  ) => {
    const response = await api.patch(`/clinical/attendance/${attendanceId}`, dto);
    return response.data;
  },

  getStudentClinicalHours: async (
    studentUserId: string,
    cohortId: string | number
  ) => {
    const response = await api.get(
      `/clinical/hours/student/${studentUserId}/cohort/${cohortId}`
    );
    return response.data;
  },

  // ── Gradebook Engine (WAC 80% passing, 22/22 skills, 40h clinical) ──
  getCohortGradebook: async (cohortId: string | number) => {
    const response = await api.get(`/gradebook/cohort/${cohortId}`);
    return response.data;
  },

  getStudentGradeReport: async (
    cohortId: string | number,
    userId?: string
  ) => {
    const response = await api.get(`/gradebook/student/${cohortId}`, {
      params: userId ? { userId } : undefined,
    });
    return response.data;
  },

  exportCohortGradebookCsv: async (cohortId: string | number) => {
    const response = await api.get(`/gradebook/cohort/${cohortId}/export-csv`);
    return response.data;
  },

  // ── Curriculum Crosswalk (WAC 246-841A-440 Syllabus Standard) ──
  getCourseCrosswalk: async (courseId: string | number) => {
    const response = await api.get(`/curriculum-crosswalk/matrix/course/${courseId}`);
    return response.data;
  },

  getCourseTextbooks: async (courseId: string | number) => {
    const response = await api.get(`/curriculum-crosswalk/textbooks/course/${courseId}`);
    return response.data;
  },

  addCourseTextbook: async (dto: {
    courseId: number;
    title: string;
    author: string;
    edition?: string;
    isbn?: string;
    publisher?: string;
  }) => {
    const response = await api.post("/curriculum-crosswalk/textbooks", dto);
    return response.data;
  },

  assignLessonReading: async (dto: {
    lessonId: number;
    textbookId: number;
    chapters: string;
    pageRange: string;
  }) => {
    const response = await api.post("/curriculum-crosswalk/readings", dto);
    return response.data;
  },

  getLessonReadings: async (lessonId: string | number) => {
    const response = await api.get(`/curriculum-crosswalk/readings/lesson/${lessonId}`);
    return response.data;
  },

  // ── Study Groups ──
  getCohortStudyGroups: async (cohortId: string | number) => {
    const response = await api.get(`/study-groups/cohort/${cohortId}`);
    return response.data;
  },

  getStudyGroup: async (id: string | number) => {
    const response = await api.get(`/study-groups/${id}`);
    return response.data;
  },

  createStudyGroup: async (dto: {
    cohortId: number;
    name: string;
    description?: string;
    meetingUrl?: string;
  }) => {
    const response = await api.post("/study-groups", dto);
    return response.data;
  },

  joinStudyGroup: async (studyGroupId: number) => {
    const response = await api.post("/study-groups/join", { studyGroupId });
    return response.data;
  },

  leaveStudyGroup: async (id: string | number) => {
    const response = await api.post(`/study-groups/${id}/leave`);
    return response.data;
  },

  updateStudyGroup: async (
    id: string | number,
    dto: { name?: string; description?: string; meetingUrl?: string }
  ) => {
    const response = await api.patch(`/study-groups/${id}`, dto);
    return response.data;
  },

  deleteStudyGroup: async (id: string | number) => {
    const response = await api.delete(`/study-groups/${id}`);
    return response.data;
  },

  // ── Technical Support Desk (WAC 246-841A-440(18)) ──
  getSystemRequirements: async () => {
    const response = await api.get("/support-desk/system-requirements");
    return response.data;
  },

  createSupportTicket: async (dto: {
    category: string;
    subject: string;
    description: string;
    priority?: string;
    attachmentUrl?: string;
    clientDiagnostics?: any;
  }) => {
    const response = await api.post("/support-desk/tickets", dto);
    return response.data;
  },

  getMySupportTickets: async () => {
    const response = await api.get("/support-desk/tickets/me");
    return response.data;
  },

  getSupportTicketById: async (ticketId: string | number) => {
    const response = await api.get(`/support-desk/tickets/${ticketId}`);
    return response.data;
  },

  listAllSupportTickets: async (params?: {
    category?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/support-desk/tickets", { params });
    return response.data;
  },

  updateSupportTicket: async (
    ticketId: string | number,
    dto: {
      status?: string;
      priority?: string;
      resolution?: string;
    }
  ) => {
    const response = await api.patch(`/support-desk/tickets/${ticketId}`, dto);
    return response.data;
  },

  // ── Regulatory Compliance Dossier (WAC 246-841A-440) ──
  generateDossier: async (dto: {
    courseId: number;
    cohortId?: number;
    studentUserId?: string;
    includeFullLogs?: boolean;
  }) => {
    const response = await api.post("/compliance-exporter/dossier", dto);
    return response.data;
  },
};
