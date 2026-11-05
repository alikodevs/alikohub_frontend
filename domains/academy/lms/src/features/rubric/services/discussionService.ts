import api from "@/lib/api";
import type {
  DiscussionTopic,
  DiscussionPost,
  CreateDiscussionTopicDto,
  UpdateDiscussionTopicDto,
  CreateDiscussionPostDto,
  GradeDiscussionPostDto,
} from "../types";

const isIdString = (val?: string | null): boolean => {
  if (!val || typeof val !== "string") return false;
  const s = val.trim();
  if (!s) return false;
  // Has space? Likely a genuine name like "John Doe" or "Sarah Jenkins"
  if (s.includes(" ")) return false;
  // UUID pattern (8-4-4-4-12 hex)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return true;
  // Prisma CUID / CUID2 (e.g. clx..., cly...)
  if (/^c[a-z0-9]{20,32}$/i.test(s)) return true;
  // Pure integer / numeric ID (e.g. "14", "85")
  if (/^\d+$/.test(s)) return true;
  // Firebase UID or hash with no spaces and >= 20 characters
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return true;
  // Prefixes like user_, student_, usr_, cand_, author_
  if (/^(user_|student_|usr_|cand_|author_)/i.test(s)) return true;
  return false;
};

const extractAuthorName = (p: any): string => {
  if (!p) return "Nursing Candidate";

  // 1. Check nested user / author / profile / student objects
  const u = p.user || p.author || p.profile || p.student;
  if (u) {
    const fn = u.firstname || u.firstName || u.first_name || "";
    const ln = u.lastname || u.lastName || u.last_name || "";
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
    if (u.name && typeof u.name === "string" && !isIdString(u.name)) return u.name;
    if (u.displayName && typeof u.displayName === "string" && !isIdString(u.displayName)) return u.displayName;
    if (u.email && typeof u.email === "string") {
      const emailPrefix = u.email.split("@")[0].replace(/[._-]/g, " ");
      return emailPrefix
        .split(" ")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }

  // 2. Direct authorName if not an ID string
  if (p.authorName && typeof p.authorName === "string" && !isIdString(p.authorName)) {
    return p.authorName;
  }

  // 3. Fallback based on role
  if (p.authorRole) {
    return p.authorRole === "INSTRUCTOR" ? "Course Instructor" : "Nursing Candidate";
  }

  return "Nursing Candidate";
};

const normalizePost = (p: any): DiscussionPost => {
  if (!p) return p;
  const gradeObj =
    typeof p.grade === "object" && p.grade !== null ? p.grade : null;
  const rawScore = gradeObj
    ? gradeObj.score ?? gradeObj.grade
    : typeof p.grade === "number"
    ? p.grade
    : p.score;
  const numericScore =
    typeof rawScore === "number"
      ? rawScore
      : rawScore !== undefined && rawScore !== null && !isNaN(Number(rawScore))
      ? Number(rawScore)
      : undefined;
  const feedbackText = gradeObj?.feedback || p.feedback || "";

  let rubricScoresData =
    gradeObj?.rubricScores || p.rubricScores || p.criteriaScores || null;
  if (typeof rubricScoresData === "string") {
    try {
      rubricScoresData = JSON.parse(rubricScoresData);
    } catch {
      // keep raw if not JSON
    }
  }

  const childReplies = Array.isArray(p.replies)
    ? p.replies.map(normalizePost)
    : [];

  return {
    ...p,
    id: p.id,
    topicId: p.topicId,
    content: p.content || p.body || "",
    body: p.body || p.content || "",
    grade: numericScore,
    score: numericScore,
    feedback: feedbackText,
    rubricScores: rubricScoresData,
    gradeDetails: gradeObj || undefined,
    authorName: extractAuthorName(p),
    authorRole: p.authorRole || p.profile?.role || undefined,
    isSubstantive:
      p.isSubstantive ?? (numericScore != null ? numericScore > 0 : undefined),
    replies: childReplies,
  };
};

const normalizeTopic = (data: any): DiscussionTopic => {
  const rubricId =
    data.rubricId ||
    data.rubricRef?.id ||
    (typeof data.rubric === "string" ? data.rubric : data.rubric?.id);
  const rubricRef =
    data.rubricRef ||
    (typeof data.rubric === "object" && data.rubric ? data.rubric : undefined);

  return {
    ...data,
    id: data.id,
    moduleId: data.moduleId,
    title: data.title,
    prompt: data.prompt || data.description || "",
    description: data.description || data.prompt || "",
    rubricId,
    rubricRef,
    dueDate: data.dueDate || data.dueAt,
    dueAt: data.dueAt || data.dueDate,
    maxPoints: data.maxPoints,
  };
};

export const discussionService = {
  /**
   * Create discussion topic with attached rubric (Option A: rubricId, Option B: inline rubric)
   * Postman 3.6.13 / Endpoint: POST {{baseUrl}}/academy/discussions/topics
   */
  createTopic: async (dto: CreateDiscussionTopicDto): Promise<DiscussionTopic> => {
    const payload: any = {
      moduleId: Number(dto.moduleId),
      title: dto.title,
      prompt: dto.prompt || dto.description || "",
    };

    if (dto.rubricId) {
      payload.rubricId = dto.rubricId;
    }
    if (dto.rubric) {
      payload.rubric = dto.rubric;
    }
    if (dto.dueDate || dto.dueAt) {
      payload.dueDate = dto.dueDate || dto.dueAt;
    }
    if (dto.maxPoints) {
      payload.maxPoints = Number(dto.maxPoints);
    }

    let response;
    try {
      response = await api.post<DiscussionTopic>(
        "/academy/discussions/topics",
        payload
      );
    } catch {
      response = await api.post<DiscussionTopic>(
        "/discussions/topics",
        payload
      );
    }
    return normalizeTopic(response.data);
  },

  /**
   * Edit / Attach rubric to existing discussion topic
   * Method: PATCH or PUT {{baseUrl}}/academy/discussions/topics/:topicId
   */
  updateTopic: async (
    topicId: string | number,
    dto: UpdateDiscussionTopicDto
  ): Promise<DiscussionTopic> => {
    const payload: any = {};
    if (dto.rubricId !== undefined) {
      payload.rubricId = dto.rubricId;
    }
    if (dto.rubric !== undefined) {
      payload.rubric = dto.rubric;
    }
    if (dto.prompt !== undefined) {
      payload.prompt = dto.prompt;
    }
    if (dto.title !== undefined) {
      payload.title = dto.title;
    }
    if (dto.dueDate || dto.dueAt) {
      payload.dueDate = dto.dueDate || dto.dueAt;
    }
    if (dto.maxPoints !== undefined) {
      payload.maxPoints = Number(dto.maxPoints);
    }

    let response;
    try {
      response = await api.patch<DiscussionTopic>(
        `/academy/discussions/topics/${topicId}`,
        payload
      );
    } catch {
      try {
        response = await api.put<DiscussionTopic>(
          `/academy/discussions/topics/${topicId}`,
          payload
        );
      } catch {
        response = await api.patch<DiscussionTopic>(
          `/discussions/topics/${topicId}`,
          payload
        );
      }
    }
    return normalizeTopic(response.data);
  },

  /**
   * Find discussions for a specific module
   * Postman 2.7.1: GET {{baseUrl}}/discussions/modules/:moduleId
   */
  getModuleDiscussions: async (
    moduleId: string | number
  ): Promise<DiscussionTopic[]> => {
    let response;
    try {
      response = await api.get<DiscussionTopic[] | { topics: DiscussionTopic[] }>(
        `/academy/discussions/modules/${moduleId}`
      );
    } catch {
      response = await api.get<DiscussionTopic[] | { topics: DiscussionTopic[] }>(
        `/discussions/modules/${moduleId}`
      );
    }
    const data = response.data;
    const rawList = Array.isArray(data)
      ? data
      : data && Array.isArray((data as any).topics)
      ? (data as any).topics
      : [];
    return rawList.map(normalizeTopic);
  },

  /**
   * Get discussion topic with full threaded posts
   * Postman 2.7.2: GET {{baseUrl}}/discussions/topics/:topicId
   */
  getTopicWithPosts: async (
    topicId: string | number
  ): Promise<DiscussionTopic> => {
    let response;
    try {
      response = await api.get<DiscussionTopic>(
        `/academy/discussions/topics/${topicId}`
      );
    } catch {
      response = await api.get<DiscussionTopic>(
        `/discussions/topics/${topicId}`
      );
    }
    const data = response.data;
    const rawPosts = data.posts || (data as any).replies || [];
    const normalized = normalizeTopic(data);
    return {
      ...normalized,
      posts: rawPosts.map(normalizePost),
    };
  },

  /**
   * Post substantive discussion contribution or reply
   * Postman 2.7.3: POST {{baseUrl}}/discussions/posts
   * Payload:
   * {
   *   "topicId": 1,
   *   "body": "Maintaining resident dignity during bathing..."
   * }
   */
  createPost: async (dto: CreateDiscussionPostDto): Promise<DiscussionPost> => {
    const text = (dto.body ?? dto.content ?? "").trim();
    const numTopicId = Number(dto.topicId);
    const topicIdVal =
      !isNaN(numTopicId) && String(dto.topicId).trim() !== ""
        ? numTopicId
        : dto.topicId;

    const payload: Record<string, any> = {
      topicId: topicIdVal,
      body: text,
    };

    if (dto.parentId !== undefined && dto.parentId !== null) {
      const numParentId = Number(dto.parentId);
      payload.parentId = !isNaN(numParentId) ? numParentId : dto.parentId;
    }

    let response;
    try {
      response = await api.post<DiscussionPost>("/discussions/posts", payload);
    } catch {
      response = await api.post<DiscussionPost>(
        "/academy/discussions/posts",
        payload
      );
    }

    const raw: any =
      (response.data as any)?.data ||
      (response.data as any)?.post ||
      response.data ||
      {};

    return normalizePost({
      ...raw,
      id: raw.id ?? Date.now(),
      topicId: raw.topicId ?? topicIdVal,
      content: raw.content || raw.body || text,
      body: raw.body || raw.content || text,
      authorName: extractAuthorName(raw),
      createdAt: raw.createdAt || new Date().toISOString(),
    });
  },

  /**
   * Grade discussion post with rubric score, criterion-by-criterion breakdown, and substantive indicator
   * Postman 3.4.5: POST {{baseUrl}}/discussions/posts/:postId/grade
   */
  gradePost: async (
    postId: string | number,
    dto: GradeDiscussionPostDto
  ): Promise<DiscussionPost> => {
    const scoreVal = dto.score ?? dto.grade ?? 0;
    const payload: Record<string, any> = {
      score: scoreVal,
      grade: scoreVal,
      feedback: dto.feedback,
      isSubstantive: dto.isSubstantive ?? true,
    };

    if (dto.rubricId) {
      payload.rubricId = dto.rubricId;
    }
    if (dto.selectedLevelIds && dto.selectedLevelIds.length > 0) {
      payload.selectedLevelIds = dto.selectedLevelIds;
    }
    if (dto.criteriaScores && dto.criteriaScores.length > 0) {
      payload.criteriaScores = dto.criteriaScores;
    }
    if (dto.rubricScores) {
      payload.rubricScores = dto.rubricScores;
    }

    let response;
    try {
      response = await api.post<any>(
        `/discussions/posts/${postId}/grade`,
        payload
      );
    } catch {
      response = await api.post<any>(
        `/academy/discussions/posts/${postId}/grade`,
        payload
      );
    }
    return normalizePost(response.data);
  },

  /**
   * Get student grade report synchronized across theory, discussions, skills lab, and clinical
   * Postman 2.8.1: GET {{baseUrl}}/gradebook/student/:cohortId?userId=:userId
   */
  getStudentGradeReport: async (
    cohortId: string | number,
    userId?: string
  ): Promise<any> => {
    const params = userId ? { userId } : {};
    let response;
    try {
      response = await api.get(`/gradebook/student/${cohortId}`, { params });
    } catch {
      response = await api.get(`/academy/gradebook/student/${cohortId}`, {
        params,
      });
    }
    return response.data;
  },
};
