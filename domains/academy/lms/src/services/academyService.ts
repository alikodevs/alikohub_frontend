import api from "../lib/api";
import type {
  Course,
  Module,
  Lesson,
  Content,
  InstructorStats,
  TeacherApplication,
  Enrollment,
  Cohort,
} from "@/types/academy";

const serializeCoursePayload = (
  data: FormData | Record<string, any>
): Record<string, any> => {
  let payload: Record<string, any>;
  if (data instanceof FormData) {
    payload = {};
    data.forEach((val, key) => {
      if (val instanceof File) {
        return;
      }
      if (payload[key] !== undefined) {
        if (Array.isArray(payload[key])) {
          payload[key].push(val);
        } else {
          payload[key] = [payload[key], val];
        }
      } else {
        payload[key] = val;
      }
    });
  } else {
    payload = { ...data };
  }

  if (payload.title !== undefined && payload.title !== null) {
    payload.title = String(payload.title).trim();
  }

  if (payload.shortDescription !== undefined && payload.shortDescription !== null) {
    payload.shortDescription = String(payload.shortDescription).trim();
  }
  if (payload.longDescription !== undefined && payload.longDescription !== null) {
    payload.longDescription = String(payload.longDescription).trim();
  }
  if (payload.category !== undefined && payload.category !== null) {
    payload.category = String(payload.category).trim();
  }

  if (payload.price !== undefined && payload.price !== null && payload.price !== "") {
    const numPrice = Number(payload.price);
    payload.price = isNaN(numPrice) ? 0 : numPrice;
  }
  if (payload.priceInUsd !== undefined && payload.priceInUsd !== null && payload.priceInUsd !== "") {
    const numPriceUsd = Number(payload.priceInUsd);
    payload.priceInUsd = isNaN(numPriceUsd) ? 0 : numPriceUsd;
  }
  if (payload.estimatedTime !== undefined && payload.estimatedTime !== null && payload.estimatedTime !== "") {
    const numTime = Number(payload.estimatedTime);
    payload.estimatedTime = isNaN(numTime) ? 0 : Math.round(numTime);
  }

  if (payload.createDefaultCohort !== undefined) {
    payload.createDefaultCohort =
      payload.createDefaultCohort === true ||
      payload.createDefaultCohort === "true";
  }

  ["skills", "conceptsLearned", "outcomes", "prerequisites", "languages"].forEach(
    (arrKey) => {
      if (payload[arrKey] !== undefined) {
        if (!Array.isArray(payload[arrKey])) {
          payload[arrKey] = payload[arrKey] ? [String(payload[arrKey])] : [];
        } else {
          payload[arrKey] = payload[arrKey].map(String);
        }
      }
    }
  );

  if (
    typeof payload.thumbnail !== "string" ||
    (!payload.thumbnail.startsWith("http://") &&
      !payload.thumbnail.startsWith("https://"))
  ) {
    delete payload.thumbnail;
  }

  return payload;
};

export const academyService = {
  // Public Endpoints (Postman 1.9 - 1.13)
  getCourses: async (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    difficulty?: string;
    status?: string;
  }) => {
    const response = await api.get("/courses", { params });
    const data = response.data;
    // Backend may return a plain array OR a wrapped { items/courses, total } object
    if (Array.isArray(data)) {
      return { courses: data as Course[], total: data.length };
    }
    return {
      courses: (data as any).items || (data as any).courses || [],
      total: (data as any).total || 0,
    };
  },

  getCoursesByCategory: async (
    category: string,
    params?: { page?: number; pageSize?: number },
  ) => {
    const response = await api.get(`/courses/category/${category}`, {
      params,
    });
    return {
      courses: response.data.items || response.data.courses || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      pageSize: response.data.pageSize || 10,
      totalPages: response.data.totalPages || 1,
    };
  },

  getCoursesByDifficulty: async (
    difficulty: string,
    params?: { page?: number; pageSize?: number },
  ) => {
    const response = await api.get(
      `/courses/difficulty/${difficulty.toUpperCase()}`,
      {
        params,
      },
    );
    return {
      courses: response.data.items || response.data.courses || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      pageSize: response.data.pageSize || 10,
      totalPages: response.data.totalPages || 1,
    };
  },

  getCourseDetails: async (courseId: string) => {
    const response = await api.get<Course>(`/courses/${courseId}`);
    return response.data;
  },

  getCourseBySlug: async (slug: string) => {
    const response = await api.get<Course>(`/courses/slug/${slug}`);
    return response.data;
  },

  getCohorts: async (
    courseId: string | number,
    params?: { page?: number; pageSize?: number },
  ) => {
    const response = await api.get<{ items: Cohort[]; total: number }>(
      `/cohorts`,
      {
        params: { courseId, ...params },
      },
    );
    return {
      cohorts: response.data.items || (response.data as any).cohorts || [],
      total: response.data.total || 0,
    };
  },

  // Student/Shared Endpoints (Postman 2.1 - 2.7)
  getCourseSchedules: async (courseId: string | number) => {
    const response = await api.get(
      `/teaching-schedule/course/${courseId}`,
    );
    return response.data;
  },

  enrollInCourse: async (
    courseId: string | number,
    paymentGateway?: string,
  ) => {
    const response = await api.post<Enrollment>(`/enrollment`, {
      courseId: Number(courseId),
      ...(paymentGateway && { paymentGateway }),
    });
    return response.data;
  },

  enrollInCohort: async (
    cohortId: string | number,
    courseId: string | number,
    paymentGateway?: string,
  ) => {
    const response = await api.post<Enrollment>(`/enrollment`, {
      courseId: Number(courseId),
      cohortId: Number(cohortId),
      ...(paymentGateway && { paymentGateway }),
    });
    return response.data;
  },

  getMyEnrollments: async () => {
    const response = await api.get<Enrollment[]>("/enrollment/me");
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/profile");
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.post("/profile", data);
    return response.data;
  },

  getCourseCurriculum: async (courseId: string) => {
    const response = await api.get<Module[]>(
      `/modules/course/${courseId}`,
    );
    return response.data;
  },

  getLessonContent: async (lessonId: string) => {
    const response = await api.get<Content[]>(
      `/content/lesson/${lessonId}`,
    );
    return response.data;
  },

  getStudentAnalytics: async () => {
    const response = await api.get("/progress/analytics/student");
    return response.data;
  },

  getStudentDashboard: async () => {
    const response = await api.get("/progress/dashboard");
    return response.data;
  },

  markLessonComplete: async (courseId: string | number, lessonId: string | number) => {
    const response = await api.post(
      `/progress/course/${courseId}/lesson/${lessonId}/complete`,
    );
    return response.data;
  },

  updateContentProgress: async (data: {
    courseId: number;
    moduleId: number;
    lessonId: number;
    contentId: number;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
    score?: number | null;
  }) => {
    const response = await api.post("/progress/content", data);
    return response.data;
  },

  checkLessonComplete: async (courseId: string | number, lessonId: string | number) => {
    const response = await api.get(
      `/progress/course/${courseId}/lesson/${lessonId}/complete`,
    );
    return response.data;
  },

  submitExercise: async (exerciseId: string | number, answer: any) => {
    const response = await api.post(`/exercises/${exerciseId}/submit`, {
      answer,
      answers: [{ questionId: "q1", value: answer }],
      submissionText: typeof answer === "string" ? answer : JSON.stringify(answer),
    });
    return response.data;
  },

  getExerciseDetails: async (exerciseId: string) => {
    const response = await api.get(`/exercises/${exerciseId}`);
    return response.data;
  },

  getMySubmissions: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }) => {
    const response = await api.get("/exercises/submissions/instructor", {
      params,
    });
    return response.data;
  },

  getCourseReport: async (courseId: string) => {
    const response = await api.get(
      `/progress/course/${courseId}/report`,
    );
    return response.data;
  },

  getMyTransactions: async () => {
    const response = await api.get("/payments/transactions/my");
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get("/notifications/me");
    return response.data;
  },

  getNotificationDetails: async (notifId: string | number) => {
    const response = await api.get(`/notifications/${notifId}`);
    return response.data;
  },

  markNotificationRead: async (notifId: string) => {
    const response = await api.patch(`/notifications/${notifId}/read`);
    return response.data;
  },

  deleteNotification: async (notifId: string) => {
    const response = await api.delete(`/notifications/${notifId}`);
    return response.data;
  },

  // Announcements (Postman 2.7.14, 3.6.9 - 3.6.12)
  getAnnouncements: async (params?: { page?: number; pageSize?: number }) => {
    const response = await api.get<{
      items: {
        id: string;
        title: string;
        content: string;
        createdAt: string;
        updatedAt: string;
      }[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>("/announcements", { params });
    return response.data;
  },

  createAnnouncement: async (data: { title: string; content: string }) => {
    const response = await api.post("/announcements", data);
    return response.data;
  },

  updateAnnouncement: async (id: string, data: { title: string; content: string }) => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id: string) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },

  // Instructor Endpoints (Postman 3.1 - 3.6)
  instructor: {
    getMyCourses: async (params?: {
      page?: number;
      pageSize?: number;
      status?: string;
    }) => {
      const response = await api.get("/courses/instructor/my-courses", { params });
      const data = response.data;
      // Backend may return a plain array OR a wrapped { items/courses, total } object
      if (Array.isArray(data)) {
        return { courses: data as Course[], total: data.length };
      }
      return {
        courses: (data as any).items || (data as any).courses || [],
        total: (data as any).total || 0,
      };
    },

    getStats: async () => {
      const response = await api.get<InstructorStats>(
        "/progress/instructor/stats",
      );
      return response.data;
    },

    getAllSubmissions: async (params?: {
      page?: number;
      pageSize?: number;
      status?: string;
    }) => {
      const response = await api.get(
        "/exercises/submissions/instructor",
        {
          params,
        },
      );
      return response.data;
    },

    // Get submissions for a specific course via the course report endpoint
    // GET /progress/course/:courseId/report
    getSubmissionsByCourse: async (courseId: string) => {
      const response = await api.get(
        `/progress/course/${courseId}/report`,
      );
      return response.data; // Array of modules with nested lessons → exercises
    },
    // Get analytics for a specific course
    getCourseAnalytics: async (courseId: string) => {
      const response = await api.get(
        `/progress/course/${courseId}/analytics`,
      );
      return response.data;
    },
    // Teaching schedules for instructor (Postman 3.6.5)
    getTeachingSchedules: async (params?: {
      page?: number;
      pageSize?: number;
    }) => {
      const response = await api.get(`/teaching-schedule/instructor`, {
        params,
      });
      return response.data;
    },
    // Create a teaching schedule (Postman 3.6.4)
    createTeachingSchedule: async (data: any) => {
      const response = await api.post(`/teaching-schedule`, data);
      return response.data;
    },

    createCohort: async (data: {
      name: string;
      courseId: string | number;
      startDate: string;
      endDate: string;
    }) => {
      const response = await api.post<Cohort>("/cohorts", {
        ...data,
        courseId: Number(data.courseId),
      });
      return response.data;
    },

    createCourse: async (formData: FormData | Record<string, any>) => {
      const payload = serializeCoursePayload(formData);
      let response;
      try {
        response = await api.post<Course>("/courses", payload, {
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        response = await api.post<Course>("/academy/courses", payload, {
          headers: { "Content-Type": "application/json" },
        });
      }
      return response.data;
    },

    updateCourse: async (courseId: string, data: FormData | Record<string, any>) => {
      const payload = serializeCoursePayload(data);
      let response;
      try {
        response = await api.put<Course>(`/courses/${courseId}`, payload, {
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        response = await api.put<Course>(`/academy/courses/${courseId}`, payload, {
          headers: { "Content-Type": "application/json" },
        });
      }
      return response.data;
    },

    deleteCourse: async (courseId: string) => {
      const response = await api.delete(`/courses/${courseId}`);
      return response.data;
    },

    submitCourseForApproval: async (courseId: string) => {
      const response = await api.post(`/courses/${courseId}/submit-for-approval`);
      return response.data;
    },

    // Modules
    createModule: async (data: {
      courseId: string;
      title: string;
      description?: string;
    }) => {
      const response = await api.post<Module>("/modules", {
        ...data,
        courseId: Number(data.courseId),
        description: data.description || "",
      });
      return response.data;
    },

    updateModule: async (
      moduleId: string,
      data: { title?: string; description?: string },
    ) => {
      const response = await api.put<Module>(
        `/modules/${moduleId}`,
        data,
      );
      return response.data;
    },

    deleteModule: async (moduleId: string) => {
      const response = await api.delete(`/modules/${moduleId}`);
      return response.data;
    },

    // Lessons
    createLesson: async (data: {
      moduleId: string;
      title: string;
      type: string;
    }) => {
      const response = await api.post<Lesson>("/lessons", {
        ...data,
        moduleId: Number(data.moduleId),
      });
      return response.data;
    },

    updateLesson: async (
      lessonId: string,
      data: { title?: string; type?: string; order?: number },
    ) => {
      const response = await api.put<Lesson>(
        `/lessons/${lessonId}`,
        data,
      );
      return response.data;
    },

    deleteLesson: async (lessonId: string) => {
      const response = await api.delete(`/lessons/${lessonId}`);
      return response.data;
    },

    // Content
    uploadContent: async (formData: FormData) => {
      const response = await api.post<Content>(
        "/content/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data;
    },

    createContent: async (data: {
      lessonId: string;
      title: string;
      type: string;
      url?: string;
    }) => {
      const response = await api.post<Content>("/content", {
        ...data,
        lessonId: Number(data.lessonId),
      });
      return response.data;
    },

    updateContent: async (contentId: string, data: { title?: string }) => {
      const response = await api.put<Content>(
        `/content/${contentId}`,
        data,
      );
      return response.data;
    },

    deleteContent: async (contentId: string) => {
      const response = await api.delete(`/content/${contentId}`);
      return response.data;
    },

    // Exercises
    createExercise: async (data: any) => {
      const response = await api.post("/exercises", data);
      return response.data;
    },

    createExercisesBulk: async (data: { dtos: any[] }) => {
      const response = await api.post("/exercises/bulk", data);
      return response.data;
    },

    updateExercise: async (exerciseId: string, data: any) => {
      const response = await api.patch(
        `/exercises/${exerciseId}`,
        data,
      );
      return response.data;
    },

    deleteExercise: async (exerciseId: string) => {
      const response = await api.delete(`/exercises/${exerciseId}`);
      return response.data;
    },

    gradeSubmission: async (
      submissionId: string | number,
      data: { isCorrect?: boolean; score: number; feedback: string; status?: string },
    ) => {
      const response = await api.post(
        `/exercises/submissions/${submissionId}/grade`,
        {
          score: data.score,
          feedback: data.feedback,
          status: data.status || "GRADED",
        },
      );
      return response.data;
    },

    getCourseStructure: async (courseId: string) => {
      const response = await api.get<Course>(
        `/courses/${courseId}/structure`,
      );
      return response.data;
    },
  },

  // Admin Endpoints (Postman 4.1 - 4.22)
  admin: {
    getAllApplications: async (page: number = 1, pageSize: number = 5) => {
      const response = await api.get<TeacherApplication[]>(
        "/auth/academy/teacher-applications",
        { params: { page, pageSize, requestingUserRole: "ADMIN" } },
      );
      return response.data;
    },

    getPlatformAnalytics: async () => {
      const response = await api.get("/progress/analytics/overall");
      return response.data;
    },

    getAllCourses: async (page: number = 1, pageSize: number = 5) => {
      const response = await api.get<Course[]>("/courses", {
        params: { page, pageSize },
      });
      return response.data;
    },

    approveApplication: async (appId: string, reviewNotes: string, reviewerId?: string) => {
      const user = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
          return {};
        }
      })();
      const payload: Record<string, any> = {
        applicationId: appId,
        reviewNotes,
      };
      const reviewer = reviewerId || user.email;
      if (reviewer) {
        payload.reviewerId = reviewer;
      }
      if (user.globalRole) {
        payload.requestingUserRole = user.globalRole;
      }
      const response = await api.post("/auth/academy/approve-teacher", payload);
      return response.data;
    },

    rejectApplication: async (appId: string, reviewNotes: string, reviewerId?: string) => {
      const user = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
          return {};
        }
      })();
      const payload: Record<string, any> = {
        applicationId: appId,
        reviewNotes,
      };
      const reviewer = reviewerId || user.email;
      if (reviewer) {
        payload.reviewerId = reviewer;
      }
      if (user.globalRole) {
        payload.requestingUserRole = user.globalRole;
      }
      const response = await api.post("/auth/academy/reject-teacher", payload);
      return response.data;
    },

    getPendingCourses: async () => {
      const response = await api.get<Course[]>("/courses", {
        params: { status: "PENDING" },
      });
      return response.data;
    },

    approveCourse: async (courseId: string) => {
      const response = await api.post(`/courses/${courseId}/approve`);
      return response.data;
    },

    rejectCourse: async (courseId: string, reason: string) => {
      const response = await api.post(`/courses/${courseId}/reject`, {
        reason,
      });
      return response.data;
    },

    assignInstructor: async (
      courseId: string | number,
      instructorId: string,
    ) => {
      const response = await api.post(
        `/courses/${courseId}/assign-instructor`,
        { instructorId },
      );
      return response.data;
    },

    deleteModule: async (moduleId: string | number) => {
      const response = await api.delete(`/modules/${moduleId}`);
      return response.data;
    },

    deleteLesson: async (lessonId: string | number) => {
      const response = await api.delete(`/lessons/${lessonId}`);
      return response.data;
    },

    getAllCohorts: async () => {
      const response = await api.get("/cohorts");
      return response.data;
    },

    deleteCohort: async (cohortId: string | number) => {
      const response = await api.delete(`/cohorts/${cohortId}`);
      return response.data;
    },

    getAllEnrollments: async () => {
      const response = await api.get("/enrollments");
      return response.data;
    },

    cancelEnrollment: async (enrollmentId: string | number) => {
      const response = await api.delete(`/enrollments/${enrollmentId}`);
      return response.data;
    },

    getAllInstructors: async () => {
      const response = await api.get("/instructors/all");
      return response.data;
    },

    approveInstructorCredentials: async (instructorUserId: string) => {
      const response = await api.post("/instructors/approve", {
        instructorUserId,
      });
      return response.data;
    },

    getAllContent: async () => {
      const response = await api.get("/content");
      return response.data;
    },
  },
};
