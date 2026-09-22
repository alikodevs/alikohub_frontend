import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { academyService } from "@/services/academyService";
import { toast } from "sonner";

export const useCourses = (params?: any, options?: any) => {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => academyService.getCourses(params),
    ...options,
  });
};

export const useCoursesByCategory = (
  category: string,
  params?: { page?: number; pageSize?: number },
  options?: any,
) => {
  return useQuery({
    queryKey: ["courses", "category", category, params],
    queryFn: () => academyService.getCoursesByCategory(category, params),
    enabled: !!category,
    ...options,
  });
};

export const useCoursesByDifficulty = (
  difficulty: string,
  params?: { page?: number; pageSize?: number },
  options?: any,
) => {
  return useQuery({
    queryKey: ["courses", "difficulty", difficulty, params],
    queryFn: () => academyService.getCoursesByDifficulty(difficulty, params),
    enabled: !!difficulty,
    ...options,
  });
};

export const useCourseDetails = (courseId: string) => {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      try {
        // Attempt to get standard details first
        const course = await academyService.getCourseDetails(courseId);

        // If it's a draft or pending, we need the full structure for editing
        if (
          course &&
          (course.status === "DRAFT" || course.status === "PENDING")
        ) {
          try {
            return await academyService.instructor.getCourseStructure(courseId);
          } catch (e) {
            return course; // Fallback to basic details if structure fails
          }
        }
        return course;
      } catch (error) {
        // If standard details fails (e.g. 500 Internal Server Error for drafts),
        // try fetching the structure directly as requested
        try {
          return await academyService.instructor.getCourseStructure(courseId);
        } catch (structureError) {
          // If both fail, throw the original details error
          throw error;
        }
      }
    },
    enabled: !!courseId,
  });
};

export const useCourseBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["course", "slug", slug],
    queryFn: async () => {
      try {
        // Try slug first
        return await academyService.getCourseBySlug(slug);
      } catch (error) {
        try {
          // If slug fails, it might be an ID
          return await academyService.getCourseDetails(slug);
        } catch (idError) {
          throw error; // Throw original error if both fail
        }
      }
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCohorts = (
  courseId: string,
  params?: { page?: number; pageSize?: number },
  options?: any,
) => {
  return useQuery({
    queryKey: ["cohorts", courseId, params],
    queryFn: () => academyService.getCohorts(courseId, params),
    enabled: !!courseId,
    ...options,
  });
};

export const useEnrollInCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      paymentGateway,
    }: {
      courseId: string | number;
      paymentGateway?: string;
    }) => academyService.enrollInCourse(courseId, paymentGateway),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success("Enrolled successfully!");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to enroll");
    },
  });
};

export const useEnrollInCohort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cohortId,
      courseId,
      paymentGateway,
    }: {
      cohortId: string | number;
      courseId: string | number;
      paymentGateway?: string;
    }) => academyService.enrollInCohort(cohortId, courseId, paymentGateway),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success("Enrolled in cohort successfully!");
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to enroll in cohort",
      );
    },
  });
};

export const useEnrollments = () => {
  return useQuery({
    queryKey: ["enrollments"],
    queryFn: () => academyService.getMyEnrollments(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

export const useAcademyProfile = () => {
  return useQuery({
    queryKey: ["academy-profile"],
    queryFn: () => academyService.getProfile(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
};

export const useUpdateAcademyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => academyService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-profile"] });
      toast.success("Profile updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => academyService.getNotifications(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notifId: string) =>
      academyService.markNotificationRead(notifId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notifId: string) => academyService.deleteNotification(notifId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted");
    },
  });
};

export const useStudentAnalytics = () => {
  return useQuery({
    queryKey: ["student-analytics"],
    queryFn: () => academyService.getStudentAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useStudentDashboard = () => {
  return useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => academyService.getStudentDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useMyTransactions = () => {
  return useQuery({
    queryKey: ["my-transactions"],
    queryFn: () => academyService.getMyTransactions(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

export const useMarkLessonComplete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
    }: {
      courseId: string;
      lessonId: string;
    }) => academyService.markLessonComplete(courseId, lessonId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["course", variables.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["student-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["course-report"] });
      queryClient.invalidateQueries({
        queryKey: ["lesson-complete", variables.courseId, variables.lessonId],
      });
    },
  });
};

export const useCheckLessonComplete = (courseId: string, lessonId: string) => {
  return useQuery({
    queryKey: ["lesson-complete", courseId, lessonId],
    queryFn: () => academyService.checkLessonComplete(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
  });
};

export const useSubmitExercise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      exerciseId,
      answer,
    }: {
      exerciseId: string;
      answer: string;
    }) => academyService.submitExercise(exerciseId, answer),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["course"] });
      queryClient.invalidateQueries({ queryKey: ["course-report"] });
      queryClient.invalidateQueries({
        queryKey: ["exercise", variables.exerciseId],
      });
      // toast.success("Exercise submitted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit exercise");
    },
  });
};

export const useExerciseDetails = (exerciseId: string) => {
  return useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => academyService.getExerciseDetails(exerciseId),
    enabled: !!exerciseId,
  });
};

export const useCourseReport = (courseId: string) => {
  return useQuery({
    queryKey: ["course-report", courseId],
    queryFn: () => academyService.getCourseReport(courseId),
    enabled: !!courseId,
  });
};

export const useMySubmissions = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: ["my-submissions", params],
    queryFn: () => academyService.getMySubmissions(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Instructor Hooks
export const useInstructorCourses = (params?: any) => {
  return useQuery({
    queryKey: ["instructor-courses", params],
    queryFn: async () => {
      // 1. Get current instructor profile to identify their various possible IDs
      const profile = await academyService.getProfile();

      // Handle potential ID variations (profile.id, profile.userId, or even a nested instructor id)
      const myIds = new Set(
        [profile.id, profile.userId, profile.instructorId]
          .filter(Boolean)
          .map((id) => String(id)),
      );

      // 2. Concurrently fetch:
      // - Private courses (Drafts, Pending Approval)
      // - General catalog courses (Published)
      const [instructorResult, publicResult] = await Promise.all([
        academyService.instructor
          .getMyCourses(params)
          .catch(() => ({ courses: [], total: 0 })),
        academyService
          .getCourses(params)
          .catch(() => ({ courses: [], total: 0 })),
      ]);

      // 3. Combine and Deduplicate
      const uniqueCourses = new Map();

      // First, add all the instructor's private work (Drafts/Pending)
      (instructorResult.courses || []).forEach((course: any) => {
        uniqueCourses.set(String(course.id), course);
      });

      // Second, find and add their published courses from the general catalog
      (publicResult.courses || []).forEach((course: any) => {
        const courseInstructorId = String(
          course.instructorId || course.instructor?.id || "",
        );

        // If the catalog item belongs to this instructor, add it (this adds Published courses)
        if (myIds.has(courseInstructorId)) {
          uniqueCourses.set(String(course.id), course);
        }
      });

      const finalCourses = Array.from(uniqueCourses.values());

      return {
        courses: finalCourses,
        total: finalCourses.length, // Total count after merging
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useInstructorStats = () => {
  return useQuery({
    queryKey: ["instructor-stats"],
    queryFn: () => academyService.instructor.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Fetch all exercise submissions for a course via the course report endpoint.
// Returns the raw array of modules with nested lessons → exercises.
export const useSubmissionsByCourse = (courseId: string) => {
  return useQuery({
    queryKey: ["instructor-submissions", courseId],
    queryFn: () => academyService.instructor.getSubmissionsByCourse(courseId),
    enabled: !!courseId,
  });
};

export const useInstructorSubmissions = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: ["instructor-all-submissions", params],
    queryFn: () => academyService.instructor.getAllSubmissions(params),
  });
};

export const useCourseAnalytics = (courseId: string) => {
  return useQuery({
    queryKey: ["course-analytics", courseId],
    queryFn: () => academyService.instructor.getCourseAnalytics(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTeachingSchedules = (params?: {
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["teaching-schedules", params],
    queryFn: () => academyService.instructor.getTeachingSchedules(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateTeachingSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      academyService.instructor.createTeachingSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaching-schedules"] });
      toast.success("Schedule created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create schedule");
    },
  });
};

export const useCourseSchedules = (courseId: string | number) => {
  return useQuery({
    queryKey: ["course-schedules", courseId],
    queryFn: () => academyService.getCourseSchedules(courseId),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      academyService.instructor.createCourse(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      toast.success("Course created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create course");
    },
  });
};

export const useCreateCohort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      courseId: string | number;
      startDate: string;
      endDate: string;
    }) => academyService.instructor.createCohort(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
      toast.success("Cohort created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create cohort");
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      formData,
    }: {
      courseId: string;
      formData: FormData;
    }) => academyService.instructor.updateCourse(courseId, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["course", variables.courseId],
      });
      toast.success("Course updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update course");
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      academyService.instructor.deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete course");
    },
  });
};

export const useSubmitCourseForApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      academyService.instructor.submitCourseForApproval(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course"] });
      toast.success("Course submitted for approval!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit course");
    },
  });
};

// Curriculum Hooks (Instructor)
export const useCreateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      courseId: string;
      title: string;
      description?: string;
    }) => academyService.instructor.createModule(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["course", variables.courseId],
      });
      toast.success("Module created!");
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      data,
      courseId,
    }: {
      moduleId: string;
      data: any;
      courseId: string;
    }) => academyService.instructor.updateModule(moduleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["course", variables.courseId],
      });
      toast.success("Module updated!");
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId }: { moduleId: string; courseId: string }) =>
      academyService.instructor.deleteModule(moduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["course", variables.courseId],
      });
      toast.success("Module deleted!");
    },
  });
};

export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { moduleId: string; title: string; type: string }) =>
      academyService.instructor.createLesson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course"],
      });
      toast.success("Lesson created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create lesson");
    },
  });
};

export const useCreateContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (data instanceof FormData) {
        return academyService.instructor.uploadContent(data);
      }
      return academyService.instructor.createContent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course"],
      });
      toast.success("Content added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add content");
    },
  });
};

export const useDeleteContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contentId: string) =>
      academyService.instructor.deleteContent(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course"],
      });
      toast.success("Content deleted!");
    },
  });
};

export const useDeleteExercise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) =>
      academyService.instructor.deleteExercise(exerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course"],
      });
      toast.success("Exercise deleted!");
    },
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      data,
    }: {
      submissionId: string | number;
      data: { isCorrect: boolean; score: number; feedback: string };
    }) => academyService.instructor.gradeSubmission(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-stats"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-submissions"] });
      queryClient.invalidateQueries({
        queryKey: ["instructor-all-submissions"],
      });
      toast.success("Submission graded successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to grade submission",
      );
    },
  });
};

export const useUpdateExercise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      exerciseId,
      data,
    }: {
      exerciseId: string | number;
      data: any;
    }) => academyService.instructor.updateExercise(exerciseId.toString(), data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course"],
      });
      toast.success("Exercise updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update exercise");
    },
  });
};

export const useCreateExercise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => academyService.instructor.createExercise(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course"],
      });
      toast.success("Exercise created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create exercise");
    },
  });
};

export const useCreateExercisesBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { dtos: any[] }) =>
      academyService.instructor.createExercisesBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course"],
      });
      toast.success("Exercises created successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create exercises",
      );
    },
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      data,
      courseId,
    }: {
      lessonId: string;
      data: any;
      courseId: string;
    }) => academyService.instructor.updateLesson(lessonId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["course", variables.courseId],
      });
      toast.success("Lesson updated!");
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId }: { lessonId: string; courseId: string }) =>
      academyService.instructor.deleteLesson(lessonId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["course", variables.courseId],
      });
      toast.success("Lesson deleted!");
    },
  });
};

// Announcement Hooks
export const useAnnouncements = (params?: {
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["announcements", params],
    queryFn: () => academyService.getAnnouncements(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      academyService.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement published successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to publish announcement",
      );
    },
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string; content: string } }) =>
      academyService.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement updated successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update announcement",
      );
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academyService.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete announcement",
      );
    },
  });
};

// Admin Hooks
export const useTeacherApplications = (
  page: number = 1,
  pageSize: number = 5,
) => {
  return useQuery({
    queryKey: ["teacher-applications", page, pageSize],
    queryFn: () => academyService.admin.getAllApplications(page, pageSize),
  });
};

export const useAdminCourses = (page: number = 1, pageSize: number = 5) => {
  return useQuery({
    queryKey: ["admin-courses", page, pageSize],
    queryFn: () => academyService.admin.getAllCourses(page, pageSize),
  });
};

export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => academyService.admin.getPlatformAnalytics(),
  });
};

export const useApproveTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appId,
      reviewNotes,
    }: {
      appId: string;
      reviewNotes: string;
    }) => academyService.admin.approveApplication(appId, reviewNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-applications"] });
      toast.success("Teacher application approved!");
    },
  });
};

export const useRejectTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appId,
      reviewNotes,
    }: {
      appId: string;
      reviewNotes: string;
    }) => academyService.admin.rejectApplication(appId, reviewNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-applications"] });
      toast.success("Teacher application rejected");
    },
  });
};

export const usePendingCourses = () => {
  return useQuery({
    queryKey: ["pending-courses"],
    queryFn: () => academyService.admin.getPendingCourses(),
  });
};

export const useApproveCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      academyService.admin.approveCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-courses"] });
      toast.success("Course approved successfully!");
    },
  });
};

export const useRejectCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, reason }: { courseId: string; reason: string }) =>
      academyService.admin.rejectCourse(courseId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-courses"] });
      toast.success("Course rejected");
    },
  });
};
