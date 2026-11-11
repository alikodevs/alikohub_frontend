import api from "@/lib/api";
import type { Skill, SkillCheckoff, SkillsLabMatrix } from "../types";

export const skillsLabService = {
  /**
   * Register a new core NA competency skill
   * Backend: POST /skills-lab/skills (CreateCoreSkillSchema)
   */
  createSkill: async (dto: {
    skillNumber: string;
    name?: string;
    title?: string;
    category: string;
    steps?: string[];
    criticalSteps?: string[];
  }): Promise<Skill> => {
    const steps =
      Array.isArray(dto.steps) && dto.steps.length > 0
        ? dto.steps
        : Array.isArray(dto.criticalSteps)
        ? dto.criticalSteps
        : [];
    const payload = {
      skillNumber: dto.skillNumber.trim(),
      name: (dto.name || dto.title || "").trim(),
      category: dto.category.trim(),
      steps,
    };
    const response = await api.post<Skill>("/skills-lab/skills", payload);
    return response.data;
  },

  /**
   * List all core nursing assistant skills
   * GET /skills-lab/skills
   */
  getSkills: async (): Promise<Skill[]> => {
    const response = await api.get<Skill[] | { skills: Skill[] }>(
      "/skills-lab/skills"
    );
    const data = response.data;
    const rawList = Array.isArray(data)
      ? data
      : data && Array.isArray((data as any).skills)
      ? (data as any).skills
      : [];
    return rawList.map((s: any) => ({
      ...s,
      title: s.title || s.name || "",
      name: s.name || s.title || "",
      category: s.category || "",
      criticalSteps: Array.isArray(s.criticalSteps) ? s.criticalSteps : [],
      passingScore: s.passingScore ?? 0,
    }));
  },

  /**
   * Record skill checkoff evaluation attempt with critical step verification
   * Backend: POST /skills-lab/checkoffs
   */
  recordCheckoff: async (
    dto: Partial<SkillCheckoff> & { passed?: boolean; attempts?: number; comments?: string }
  ): Promise<SkillCheckoff> => {
    const isPassed =
      dto.passed !== undefined
        ? Boolean(dto.passed)
        : dto.status === "PASSED" || dto.status === "SATISFACTORY";

    const notesText =
      dto.evaluatorNotes ||
      dto.comments ||
      dto.notes ||
      "";

    const payload = {
      skillId: Number(dto.skillId),
      studentUserId: dto.studentUserId || "",
      cohortId: Number(dto.cohortId),
      status: dto.status || (isPassed ? "PASSED" : "FAILED"),
      attemptNumber: Number(dto.attemptNumber || dto.attempts || 1),
      evaluatorNotes: notesText,
      // Compatibility fields for backend Joi validation:
      passed: isPassed,
      attempts: Number(dto.attempts || dto.attemptNumber || 1),
      comments: notesText,
    };
    const response = await api.post<SkillCheckoff>(
      "/skills-lab/checkoffs",
      payload
    );
    return response.data;
  },

  /**
   * Update skill checkoff record (retake / verification)
   * Backend: PATCH /skills-lab/checkoffs/:checkoffId
   */
  updateCheckoff: async (
    checkoffId: string | number,
    dto: { passed?: boolean; status?: string; attempts?: number; comments?: string; evaluatorNotes?: string; notes?: string }
  ): Promise<SkillCheckoff> => {
    const isPassed =
      dto.passed !== undefined
        ? Boolean(dto.passed)
        : dto.status ? (dto.status === "PASSED" || dto.status === "SATISFACTORY") : undefined;

    const commentsText =
      dto.comments ||
      dto.evaluatorNotes ||
      dto.notes;

    const payload: Record<string, any> = {};
    if (isPassed !== undefined) payload.passed = isPassed;
    if (dto.attempts !== undefined) payload.attempts = Number(dto.attempts);
    if (commentsText !== undefined) payload.comments = commentsText;

    const response = await api.patch<SkillCheckoff>(
      `/skills-lab/checkoffs/${checkoffId}`,
      payload
    );
    return response.data;
  },

  /**
   * Get core skill by ID
   * Backend: GET /skills-lab/skills/:skillId
   */
  getSkill: async (skillId: string | number): Promise<Skill> => {
    const response = await api.get<Skill>(`/skills-lab/skills/${skillId}`);
    return response.data;
  },

  /**
   * Get student skills lab matrix
   * Backend: GET /skills-lab/matrix/student/:studentUserId/cohort/:cohortId
   */
  getStudentMatrix: async (
    studentUserId: string,
    cohortId: string | number
  ): Promise<any> => {
    const response = await api.get(
      `/skills-lab/matrix/student/${studentUserId}/cohort/${cohortId}`
    );
    return response.data;
  },

  /**
   * Register Instructor WABON RN Credentials
   * Backend: POST /instructors/credentials
   */
  registerInstructorCredentials: async (dto: {
    rnLicenseNumber: string;
    rnLicenseExpiration: string;
    yearsLongTermCareExp: number;
    trainTheTrainerCertUrl?: string;
    wabonApprovalLetterUrl?: string;
  }): Promise<any> => {
    const response = await api.post("/instructors/credentials", dto);
    return response.data;
  },

  /**
   * Update Instructor WABON RN Credentials
   * Backend: PUT /instructors/credentials (UpdateCredentialSchema)
   */
  updateInstructorCredentials: async (dto: {
    rnLicenseNumber?: string;
    rnLicenseExpiration?: string;
    yearsLongTermCareExp?: number;
    trainTheTrainerCertUrl?: string;
    wabonApprovalLetterUrl?: string;
  }): Promise<any> => {
    const response = await api.put("/instructors/credentials", dto);
    return response.data;
  },

  /**
   * Get Instructor WABON Credential
   * Backend: GET /instructors/credentials/:instructorUserId
   */
  getInstructorCredentials: async (instructorUserId: string): Promise<any> => {
    try {
      const response = await api.get(`/instructors/credentials/${instructorUserId}`);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },
};
