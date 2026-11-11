import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wabonComplianceService } from "../services/wabonComplianceService";
import type { CurriculumCrosswalk, CourseTextbook } from "../types";
import { toast } from "sonner";

export const useCourseCrosswalk = (courseId?: string | number) => {
  return useQuery<CurriculumCrosswalk>({
    queryKey: ["curriculum-crosswalk", "matrix", courseId],
    queryFn: () => wabonComplianceService.getCourseCrosswalk(courseId!),
    enabled: Boolean(courseId),
  });
};

export const useCourseTextbooks = (courseId?: string | number) => {
  return useQuery<CourseTextbook[]>({
    queryKey: ["curriculum-crosswalk", "textbooks", courseId],
    queryFn: () => wabonComplianceService.getCourseTextbooks(courseId!),
    enabled: Boolean(courseId),
  });
};

export const useAddTextbookMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      courseId: number;
      title: string;
      author: string;
      edition?: string;
      isbn?: string;
      publisher?: string;
    }) => wabonComplianceService.addCourseTextbook(dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["curriculum-crosswalk", "textbooks", vars.courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum-crosswalk", "matrix", vars.courseId],
      });
      toast.success("Textbook registered for curriculum crosswalk");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to register textbook");
    },
  });
};

export const useAssignReadingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      lessonId: number;
      textbookId: number;
      chapters: string;
      pageRange: string;
      courseId?: number;
    }) =>
      wabonComplianceService.assignLessonReading({
        lessonId: dto.lessonId,
        textbookId: dto.textbookId,
        chapters: dto.chapters,
        pageRange: dto.pageRange,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["curriculum-crosswalk"],
      });
      if (vars.lessonId) {
        queryClient.invalidateQueries({
          queryKey: ["curriculum-crosswalk", "readings", "lesson", vars.lessonId],
        });
      }
      toast.success("Reading assignment linked to unit syllabus");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to assign reading");
    },
  });
};

export const useLessonReadings = (lessonId?: string | number | null) => {
  return useQuery<any[]>({
    queryKey: ["curriculum-crosswalk", "readings", "lesson", lessonId],
    queryFn: () => wabonComplianceService.getLessonReadings(lessonId!),
    enabled: Boolean(lessonId),
    staleTime: 2 * 60 * 1000,
  });
};

