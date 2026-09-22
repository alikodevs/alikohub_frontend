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

export const academyService = {
  // Public Endpoints
  getCourses: async (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    difficulty?: string;
    status?: string;
  }) => {
    const response = await api.get<{ courses: Course[]; total: number }>(
      "/academy/courses",
      { params },
    );
    // Backend returns { items, total, ... } but frontend expects { courses, total }
    return {
      courses: (response.data as any).items || response.data.courses,
      total: response.data.total,
    };
  },

  getCoursesByCategory: async (
    category: string,
    params?: { page?: number; pageSize?: number },
  ) => {
    const response = await api.get(`/academy/courses/category/${category}`, {
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
      `/academy/courses/difficulty/${difficulty.toUpperCase()}`,
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
    const response = await api.get<Course>(`/academy/courses/${courseId}`);
    return response.data;
  },

  getCourseBySlug: async (slug: string) => {
    const response = await api.get<Course>(`/academy/courses/slug/${slug}`);
    return response.data;
  },

  getCohorts: async (
    courseId: string | number,
    params?: { page?: number; pageSize?: number },
  ) => {
    const response = await api.get<{ items: Cohort[]; total: number }>(
      `/academy/cohorts`,
      {
        params: { courseId, ...params },
      },
    );
    return {
      cohorts: response.data.items || (response.data as any).cohorts || [],
      total: response.data.total || 0,
    };
  },

  // Student/Shared Endpoints
  getCourseSchedules: async (courseId: string | number) => {
    const response = await api.get(
      `/academy/teaching-schedules/course/${courseId}`,
    );
    return response.data;
  },

  enrollInCourse: async (
    courseId: string | number,
    paymentGateway?: string,
  ) => {
    const response = await api.post<Enrollment>(`/academy/enrollment`, {
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
    const response = await api.post<Enrollment>(`/academy/enrollment`, {
      courseId: Number(courseId),
      cohortId: Number(cohortId),
      ...(paymentGateway && { paymentGateway }),
    });
    return response.data;
  },

  getMyEnrollments: async () => {
    const response = await api.get<Enrollment[]>("/academy/enrollment/me");
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/academy/profile");
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.post("/users/profile", data);
    return response.data;
  },

  getCourseCurriculum: async (courseId: string) => {
    const response = await api.get<Module[]>(
      `/academy/modules/course/${courseId}`,
    );
    return response.data;
  },

  getLessonContent: async (lessonId: string) => {
    const response = await api.get<Content[]>(
      `/academy/content/lesson/${lessonId}`,
    );
    return response.data;
  },

  getStudentAnalytics: async () => {
    const response = await api.get("/academy/progress/analytics/student");
    return response.data;
  },

  getStudentDashboard: async () => {
    const response = await api.get("/academy/progress/dashboard");
    return response.data;
  },

  markLessonComplete: async (courseId: string, lessonId: string) => {
    const response = await api.post(
      `/academy/progress/course/${courseId}/lesson/${lessonId}/complete`,
    );
    return response.data;
  },

  checkLessonComplete: async (courseId: string, lessonId: string) => {
    const response = await api.get(
      `/academy/progress/course/${courseId}/lesson/${lessonId}/complete`,
    );
    return response.data;
  },

  submitExercise: async (exerciseId: string, answer: string) => {
    const response = await api.post(`/academy/exercises/${exerciseId}/submit`, {
      answer,
    });
    return response.data;
  },

  getExerciseDetails: async (exerciseId: string) => {
    const response = await api.get(`/academy/exercises/${exerciseId}`);
    return response.data;
  },

  getMySubmissions: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }) => {
    const response = await api.get("/academy/exercises/my-submissions", {
      params,
    });
    return response.data;
  },

  getCourseReport: async (courseId: string) => {
    const response = await api.get(
      `/academy/progress/course/${courseId}/report`,
    );
    return response.data;
  },

  getMyTransactions: async () => {
    const response = await api.get("/payments/transactions/my");
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get("/academy/notifications/me");
    return response.data;
  },

  getNotificationDetails: async (notifId: string | number) => {
    const response = await api.get(`/academy/notifications/${notifId}`);
    return response.data;
  },

  markNotificationRead: async (notifId: string) => {
    const response = await api.patch(`/academy/notifications/${notifId}/read`);
    return response.data;
  },

  deleteNotification: async (notifId: string) => {
    const response = await api.delete(`/academy/notifications/${notifId}`);
    return response.data;
  },

  // Announcements
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
    }>("/academy/announcements", { params });
    return response.data;
  },

  createAnnouncement: async (data: { title: string; content: string }) => {
    const response = await api.post("/academy/announcements", data);
    return response.data;
  },

  updateAnnouncement: async (id: string, data: { title: string; content: string }) => {
    const response = await api.put(`/academy/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id: string) => {
    const response = await api.delete(`/academy/announcements/${id}`);
    return response.data;
  },

  // Instructor Endpoints
  instructor: {
    getMyCourses: async (params?: {
      page?: number;
      pageSize?: number;
      status?: string;
    }) => {
      const response = await api.get<{ courses: Course[]; total: number }>(
        "/academy/courses/instructor/my",
        { params },
      );
      // Backend returns { items, total, ... } but frontend expects { courses, total }
      return {
        courses: (response.data as any).items || response.data.courses,
        total: response.data.total,
      };
    },

    getStats: async () => {
      const response = await api.get<InstructorStats>(
        "/academy/progress/instructor/stats",
      );
      return response.data;
    },

    getAllSubmissions: async (params?: {
      page?: number;
      pageSize?: number;
      status?: string;
    }) => {
      const response = await api.get(
        "/academy/exercises/instructor/submissions",
        {
          params,
        },
      );
      return response.data;
    },

    // Get submissions for a specific course via the course report endpoint
    // GET /academy/progress/course/:courseId/report
    getSubmissionsByCourse: async (courseId: string) => {
      const response = await api.get(
        `/academy/progress/course/${courseId}/report`,
      );
      return response.data; // Array of modules with nested lessons → exercises
    },
    // New: Get analytics for a specific course
    getCourseAnalytics: async (courseId: string) => {
      const response = await api.get(
        `/academy/progress/course/${courseId}/analytics`,
      );
      return response.data;
    },
    // New: Get teaching schedules for instructor
    getTeachingSchedules: async (params?: {
      page?: number;
      pageSize?: number;
    }) => {
      const response = await api.get(`/academy/teaching-schedules/instructor`, {
        params,
      });
      return response.data;
    },
    // New: Create a teaching schedule
    createTeachingSchedule: async (data: any) => {
      const response = await api.post(`/academy/teaching-schedules`, data);
      return response.data;
    },

    createCohort: async (data: {
      name: string;
      courseId: string | number;
      startDate: string;
      endDate: string;
    }) => {
      const response = await api.post<Cohort>("/academy/cohorts", {
        ...data,
        courseId: Number(data.courseId),
      });
      return response.data;
    },

    createCourse: async (formData: FormData) => {
      const response = await api.post<Course>("/academy/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },

    updateCourse: async (courseId: string, formData: FormData) => {
      const response = await api.patch<Course>(
        `/academy/courses/${courseId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data;
    },

    deleteCourse: async (courseId: string) => {
      const response = await api.delete(`/academy/courses/${courseId}`);
      return response.data;
    },

    submitCourseForApproval: async (courseId: string) => {
      const response = await api.post(`/academy/courses/${courseId}/submit`);
      return response.data;
    },

    // Modules
    createModule: async (data: {
      courseId: string;
      title: string;
      description?: string;
    }) => {
      const response = await api.post<Module>("/academy/modules", {
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
        `/academy/modules/${moduleId}`,
        data,
      );
      return response.data;
    },

    deleteModule: async (moduleId: string) => {
      const response = await api.delete(`/academy/modules/${moduleId}`);
      return response.data;
    },

    // Lessons
    createLesson: async (data: {
      moduleId: string;
      title: string;
      type: string;
    }) => {
      const response = await api.post<Lesson>("/academy/lessons", {
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
        `/academy/lessons/${lessonId}`,
        data,
      );
      return response.data;
    },

    deleteLesson: async (lessonId: string) => {
      const response = await api.delete(`/academy/lessons/${lessonId}`);
      return response.data;
    },

    // Content
    uploadContent: async (formData: FormData) => {
      const response = await api.post<Content>(
        "/academy/content/upload",
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
      const response = await api.post<Content>("/academy/content", {
        ...data,
        lessonId: Number(data.lessonId),
      });
      return response.data;
    },

    updateContent: async (contentId: string, data: { title?: string }) => {
      const response = await api.patch<Content>(
        `/academy/content/${contentId}`,
        data,
      );
      return response.data;
    },

    deleteContent: async (contentId: string) => {
      const response = await api.delete(`/academy/content/${contentId}`);
      return response.data;
    },

    // Exercises
    createExercise: async (data: any) => {
      const response = await api.post("/academy/exercises", data);
      return response.data;
    },

    createExercisesBulk: async (data: { dtos: any[] }) => {
      const response = await api.post("/academy/exercises/bulk", data);
      return response.data;
    },

    updateExercise: async (exerciseId: string, data: any) => {
      const response = await api.patch(
        `/academy/exercises/${exerciseId}`,
        data,
      );
      return response.data;
    },

    deleteExercise: async (exerciseId: string) => {
      const response = await api.delete(`/academy/exercises/${exerciseId}`);
      return response.data;
    },

    gradeSubmission: async (
      submissionId: string | number,
      data: { isCorrect: boolean; score: number; feedback: string },
    ) => {
      const response = await api.post(
        `/academy/exercises/submissions/${submissionId}/grade`,
        data,
      );
      return response.data;
    },

    getCourseStructure: async (courseId: string) => {
      const response = await api.get<Course>(
        `/academy/courses/${courseId}/structure`,
      );
      return response.data;
    },
  },

  // Admin Endpoints
  admin: {
    getAllApplications: async (page: number = 1, pageSize: number = 5) => {
      const response = await api.get<TeacherApplication[]>(
        "/auth/academy/teacher-applications",
        { params: { page, pageSize } },
      );
      return response.data;
    },

    getPlatformAnalytics: async () => {
      const response = await api.get("/academy/progress/analytics/overall");
      return response.data;
    },

    getAllCourses: async (page: number = 1, pageSize: number = 5) => {
      const response = await api.get<Course[]>("/academy/courses/all", {
        params: { page, pageSize },
      });
      return response.data;
    },

    approveApplication: async (appId: string, reviewNotes: string) => {
      const response = await api.post(
        `/auth/academy/approve-teacher/${appId}`,
        { reviewNotes },
      );
      return response.data;
    },

    rejectApplication: async (appId: string, reviewNotes: string) => {
      const response = await api.post(`/auth/academy/reject-teacher/${appId}`, {
        reviewNotes,
      });
      return response.data;
    },

    getPendingCourses: async () => {
      const response = await api.get<Course[]>("/academy/courses/pending");
      return response.data;
    },

    approveCourse: async (courseId: string) => {
      const response = await api.post(`/academy/courses/${courseId}/approve`);
      return response.data;
    },

    rejectCourse: async (courseId: string, reason: string) => {
      const response = await api.post(`/academy/courses/${courseId}/reject`, {
        reason,
      });
      return response.data;
    },
  },
};
