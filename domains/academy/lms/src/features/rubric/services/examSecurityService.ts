import api from "@/lib/api";
import type {
  ExamSession,
  StartExamSessionDto,
  TabBlurDto,
  EndExamSessionDto,
  AuditExamSessionDto,
} from "../types";

const normalizeExamSession = (raw: any): ExamSession => {
  const id = raw?.id ?? raw?.sessionId;
  const userId = raw?.userId ?? raw?.studentUserId;
  const idPhotoUrl = raw?.idPhotoUrl ?? raw?.photoIdSnapshotUrl ?? undefined;
  const webcamSnapUrl = raw?.webcamSnapUrl ?? raw?.webcamSnapshotUrl ?? undefined;
  const tabBlurCount = Number(raw?.tabBlurCount ?? 0);

  return {
    ...raw,
    id,
    sessionId: raw?.sessionId ?? id,
    userId,
    studentUserId: userId,
    idPhotoUrl,
    webcamSnapUrl,
    photoIdSnapshotUrl: idPhotoUrl,
    webcamSnapshotUrl: webcamSnapUrl,
    tabBlurCount,
    totalBlurDurationSeconds: raw?.totalBlurDurationSeconds ?? 0,
    isAudited: Boolean(raw?.isAudited),
    isFlagged: Boolean(raw?.isFlagged ?? tabBlurCount >= 3),
  };
};

export const examSecurityService = {
  /**
   * Start proctored exam session with identity attestation and snapshot
   * Backend: POST /exam-security/sessions/start (StartExamSessionSchema)
   */
  startSession: async (dto: StartExamSessionDto): Promise<ExamSession> => {
    const idPhoto = dto.idPhotoUrl ?? dto.photoIdSnapshotUrl;
    const webcamSnap = dto.webcamSnapUrl ?? dto.webcamSnapshotUrl;
    const ipAddress = dto.ipAddress ?? dto.clientIp;

    const payload: Record<string, any> = {
      exerciseId: Number(dto.exerciseId),
      honorCodeAccepted: true,
    };
    if (idPhoto) payload.idPhotoUrl = idPhoto;
    if (webcamSnap) payload.webcamSnapUrl = webcamSnap;
    if (ipAddress) payload.ipAddress = ipAddress;
    if (dto.userAgent) payload.userAgent = dto.userAgent;

    const response = await api.post<any>("/exam-security/sessions/start", payload);
    return normalizeExamSession(response.data);
  },

  /**
   * Record tab-blur / window switch telemetry
   * Backend: POST /exam-security/sessions/tab-blur (RecordTabBlurSchema)
   */
  recordTabBlur: async (
    dto: TabBlurDto
  ): Promise<{ sessionId?: number; tabBlurCount?: number; integrityAlert?: boolean; alertMessage?: string | null }> => {
    const response = await api.post("/exam-security/sessions/tab-blur", {
      sessionId: Number(dto.sessionId),
    });
    return response.data;
  },

  /**
   * End proctored exam session
   * Backend: POST /exam-security/sessions/end (EndExamSessionSchema)
   */
  endSession: async (dto: EndExamSessionDto): Promise<ExamSession> => {
    const payload: Record<string, any> = {
      sessionId: Number(dto.sessionId),
    };
    if (dto.score !== undefined && !isNaN(Number(dto.score))) {
      payload.score = Math.max(0, Number(dto.score));
    }
    const response = await api.post<any>("/exam-security/sessions/end", payload);
    return normalizeExamSession(response.data);
  },

  /**
   * Get exam session details and security telemetry
   * Backend: GET /exam-security/sessions/:sessionId
   */
  getSessionDetails: async (
    sessionId: string | number
  ): Promise<ExamSession> => {
    const response = await api.get<any>(`/exam-security/sessions/${sessionId}`);
    return normalizeExamSession(response.data);
  },

  /**
   * Get all exam sessions for an exercise (Instructor / Admin / Auditor)
   * Backend: GET /exam-security/sessions/exercise/:exerciseId
   */
  getSessionsByExercise: async (
    exerciseId: string | number
  ): Promise<ExamSession[]> => {
    const response = await api.get<any[]>(
      `/exam-security/sessions/exercise/${exerciseId}`
    );
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map(normalizeExamSession);
  },

  /**
   * Instructor / Auditor verification of exam session
   * Backend: POST /exam-security/sessions/audit (AuditExamSessionSchema)
   */
  auditSession: async (dto: AuditExamSessionDto): Promise<ExamSession> => {
    const isAudited =
      dto.isAudited !== undefined
        ? Boolean(dto.isAudited)
        : dto.isFlagged !== undefined
        ? !dto.isFlagged
        : true;

    const response = await api.post<any>("/exam-security/sessions/audit", {
      sessionId: Number(dto.sessionId),
      isAudited,
    });
    return normalizeExamSession(response.data);
  },
};
