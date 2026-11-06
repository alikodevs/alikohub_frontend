import api from "@/lib/api";
import type { Skill, SkillCheckoff, SkillsLabMatrix } from "../types";

export const skillsLabService = {
  /**
   * Register a new core NA competency skill
   * Postman 3.5.1: POST {{baseUrl}}/skills-lab/skills
   */
  createSkill: async (dto: Partial<Skill>): Promise<Skill> => {
    const payload = {
      ...dto,
      skillNumber: dto.skillNumber || "SKILL-01",
      name: (dto as any).name || dto.title,
      category: dto.category || "INFECTION_CONTROL",
      description: dto.description || "",
    };
    const response = await api.post<Skill>("/skills-lab/skills", payload);
    return response.data;
  },

  /**
   * List all core nursing assistant skills (22 WABON Core Skills)
   * Postman 2.5.4: GET {{baseUrl}}/skills-lab/skills
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
      title: s.title || s.name || `Core Skill ${s.skillNumber || s.id}`,
      name: s.name || s.title,
      category: s.category || "INFECTION_CONTROL",
      criticalSteps: s.criticalSteps || [],
      passingScore: s.passingScore || 100,
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

    const commentsText =
      dto.comments ||
      dto.evaluatorNotes ||
      dto.notes ||
      (isPassed
        ? "Demonstrated clinical competency."
        : "Needs practice on sequential steps.");

    const payload = {
      skillId: Number(dto.skillId) || dto.skillId,
      studentUserId: dto.studentUserId || "student-uid-1001",
      cohortId: Number(dto.cohortId) || 1,
      passed: isPassed,
      attempts: Number(dto.attempts || dto.attemptNumber || 1),
      comments: commentsText,
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
};
