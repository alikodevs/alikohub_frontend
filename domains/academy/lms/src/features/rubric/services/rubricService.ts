import api from "@/lib/api";
import type {
  Rubric,
  CreateRubricDto,
  EvaluateRubricDto,
  RubricEvaluationResult,
  RubricType,
} from "../types";

const normalizeRubric = (r: any): Rubric => ({
  ...r,
  id: String(r.id || r._id || ""),
  name: r.name || r.title || "Standardized Rubric",
  description: r.description || "",
  type: r.type || "DISCUSSION",
  isActive: r.isActive !== false,
  criteria: (r.criteria || []).map((c: any, idx: number) => ({
    ...c,
    id: c.id ? String(c.id) : `crit-${idx + 1}`,
    title: c.title || c.name || `Criterion ${idx + 1}`,
    description: c.description || "",
    maxPoints: Number(c.maxPoints || c.points || 0),
    order: c.order || idx + 1,
    levels: (c.levels || []).map((l: any, lIdx: number) => ({
      ...l,
      id: l.id ? String(l.id) : `lvl-${idx + 1}-${lIdx + 1}`,
      name: l.name || "Level",
      description: l.description || "",
      points: Number(l.points || 0),
      order: l.order || lIdx + 1,
    })),
  })),
});

export const rubricService = {
  /**
   * Create a new standardized multi-criteria rubric
   * Postman 3.3.2 / Backend: POST {{baseUrl}}/rubrics
   * Strictly matches createRubricSchema in apps/academy-service/src/rubrics/rubrics.validation.ts
   */
  createRubric: async (dto: CreateRubricDto): Promise<Rubric> => {
    const rawType = String(dto.type || "").toUpperCase();
    const rubricType = rawType === "DISCUSSION" ? "DISCUSSION" : "ASSIGNMENT";

    const payload = {
      name: (dto.name || dto.title || "Standardized Rubric").trim(),
      description: dto.description?.trim() || "",
      type: rubricType,
      isActive: dto.isActive !== false,
      criteria: (dto.criteria || []).map((c, cIdx) => ({
        title: (c.title || c.name || `Criterion ${cIdx + 1}`).trim(),
        description: c.description?.trim() || "",
        maxPoints: Math.max(0.1, Number(c.maxPoints) || 10),
        order: c.order ?? cIdx + 1,
        levels: (c.levels && c.levels.length > 0)
          ? c.levels.map((l, lIdx) => ({
              name: (l.name || `Level ${lIdx + 1}`).trim(),
              description: l.description?.trim() || "Demonstrates required standard.",
              points: Math.max(0, Number(l.points) || 0),
              order: l.order ?? lIdx + 1,
            }))
          : [
              {
                name: "Proficient",
                description: "Demonstrates required standard.",
                points: Math.max(0.1, Number(c.maxPoints) || 10),
                order: 1,
              },
              {
                name: "Unacceptable",
                description: "Does not meet standard.",
                points: 0,
                order: 2,
              },
            ],
      })),
    };

    const response = await api.post<Rubric>("/rubrics", payload);
    return normalizeRubric(response.data);
  },

  /**
   * List all rubrics, optionally filtered by type and active status
   * Postman 3.3.1 / Backend: GET {{baseUrl}}/rubrics
   */
  getRubrics: async (params?: {
    type?: RubricType | string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Rubric[]> => {
    const queryParams: any = {};
    if (params?.type && ["DISCUSSION", "ASSIGNMENT"].includes(params.type.toUpperCase())) {
      queryParams.type = params.type.toUpperCase();
    }
    if (params?.isActive !== undefined) {
      queryParams.isActive = params.isActive;
    }
    if (params?.search) {
      queryParams.search = params.search;
    }
    if (params?.page) {
      queryParams.page = params.page;
    }
    if (params?.limit) {
      queryParams.limit = params.limit;
    }

    const response = await api.get<any>("/rubrics", {
      params: queryParams,
    });
    const data = response.data;
    const rawList = Array.isArray(data)
      ? data
      : data && Array.isArray((data as any).rubrics)
      ? (data as any).rubrics
      : data && Array.isArray((data as any).items)
      ? (data as any).items
      : [];
    return rawList.map(normalizeRubric);
  },

  /**
   * Retrieve rubric schema with complete criteria and level hierarchy
   * Postman 3.3.3: GET {{baseUrl}}/rubrics/{{rubricId}}
   */
  getRubricById: async (id: string): Promise<Rubric> => {
    const response = await api.get<Rubric>(`/rubrics/${id}`);
    return normalizeRubric(response.data);
  },

  /**
   * Duplicate a rubric and its nested criteria/levels
   * Postman 3.3.6: POST {{baseUrl}}/rubrics/{{rubricId}}/clone
   */
  cloneRubric: async (
    rubricId: string,
    newName?: string
  ): Promise<Rubric> => {
    const response = await api.post<Rubric>(`/rubrics/${rubricId}/clone`, {
      rubricId,
      newName: newName || undefined,
    });
    return normalizeRubric(response.data);
  },

  /**
   * Calculate weighted score and generate standardized rubric evaluation feedback
   * Postman 3.3.5 / Backend: POST {{baseUrl}}/rubrics/evaluate
   */
  evaluateRubric: async (
    dto: EvaluateRubricDto
  ): Promise<RubricEvaluationResult> => {
    const scores = dto.scores || dto.criteriaScores || (dto.ratings ? dto.ratings.map((r) => ({
      criterionId: String(r.criterionId),
      points: Math.max(0, Number(r.points) || 0),
      feedback: r.feedback || "",
    })) : undefined);

    const payload: any = {
      rubricId: String(dto.rubricId),
    };

    if (scores && scores.length > 0) {
      payload.scores = scores;
    } else if (dto.selectedLevelIds && dto.selectedLevelIds.length > 0) {
      payload.selectedLevelIds = dto.selectedLevelIds;
    }

    if (dto.studentId || dto.studentUserId) {
      payload.studentId = dto.studentId || dto.studentUserId;
    }
    if (dto.evaluatorId) {
      payload.evaluatorId = dto.evaluatorId;
    }
    if (dto.overallFeedback || dto.customFeedback) {
      payload.overallFeedback = dto.overallFeedback || dto.customFeedback;
      payload.customFeedback = dto.customFeedback || dto.overallFeedback;
    }

    const response = await api.post<RubricEvaluationResult>(
      "/rubrics/evaluate",
      payload
    );
    return response.data;
  },
};
