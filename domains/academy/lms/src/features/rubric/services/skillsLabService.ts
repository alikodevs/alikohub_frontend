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
   * Postman 3.5.2: POST {{baseUrl}}/skills-lab/checkoffs
   */
  recordCheckoff: async (
    dto: Partial<SkillCheckoff>
  ): Promise<SkillCheckoff> => {
    const notesText =
      dto.evaluatorNotes ||
      dto.notes ||
      (dto.status === "PASSED"
        ? "Demonstrated clinical competency."
        : "Needs practice on sequential steps.");
    const payload = {
      skillId: Number(dto.skillId) || dto.skillId,
      studentUserId: dto.studentUserId || "student-uid-1001",
      cohortId: Number(dto.cohortId) || 1,
      status: dto.status || "PASSED",
      attemptNumber: Number(dto.attemptNumber) || 1,
      evaluatorNotes: notesText,
      notes: notesText,
      criticalStepsCompleted: dto.criticalStepsCompleted || [],
      signatureUrl: dto.signatureUrl,
    };
    const response = await api.post<SkillCheckoff>(
      "/skills-lab/checkoffs",
      payload
    );
    return response.data;
  },

  /**
   * Update skill checkoff record (retake / verification)
   * Postman 3.5.3: PATCH {{baseUrl}}/skills-lab/checkoffs/:checkoffId
   */
  updateCheckoff: async (
    checkoffId: string | number,
    dto: { status?: string; evaluatorNotes?: string; notes?: string }
  ): Promise<SkillCheckoff> => {
    const notesText = dto.evaluatorNotes || dto.notes || "Checkoff verified during retake";
    const payload = {
      status: dto.status || "PASSED",
      evaluatorNotes: notesText,
    };
    const response = await api.patch<SkillCheckoff>(
      `/skills-lab/checkoffs/${checkoffId}`,
      payload
    );
    return response.data;
  },

  /**
   * Get student skills lab matrix
   * Postman 2.5.6 / 3.5.4: GET {{baseUrl}}/skills-lab/matrix/student/:studentUserId/cohort/:cohortId
   */
  getStudentMatrix: async (
    studentUserId: string,
    cohortId: string | number
  ): Promise<SkillsLabMatrix> => {
    const response = await api.get<SkillsLabMatrix>(
      `/skills-lab/matrix/student/${studentUserId}/cohort/${cohortId}`
    );
    return response.data;
  },
};
