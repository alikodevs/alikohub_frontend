import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { discussionService } from "../services/discussionService";
import type {
  CreateDiscussionTopicDto,
  UpdateDiscussionTopicDto,
  CreateDiscussionPostDto,
  GradeDiscussionPostDto,
} from "../types";
import { toast } from "sonner";

export const useModuleDiscussions = (moduleId?: string | number) => {
  return useQuery({
    queryKey: ["discussions", "module", moduleId],
    queryFn: () => discussionService.getModuleDiscussions(moduleId!),
    enabled: Boolean(moduleId),
  });
};

export const useDiscussionTopic = (topicId?: string | number) => {
  return useQuery({
    queryKey: ["discussion-topic", topicId],
    queryFn: () => discussionService.getTopicWithPosts(topicId!),
    enabled: Boolean(topicId),
  });
};

export const useCreateDiscussionTopicMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDiscussionTopicDto) =>
      discussionService.createTopic(dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["discussions", "module", vars.moduleId],
      });
      toast.success("Discussion topic created");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create topic");
    },
  });
};

export const useUpdateDiscussionTopicMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      topicId,
      dto,
      moduleId,
    }: {
      topicId: string | number;
      dto: UpdateDiscussionTopicDto;
      moduleId?: string | number;
    }) => discussionService.updateTopic(topicId, dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["discussion-topic", vars.topicId],
      });
      if (vars.moduleId) {
        queryClient.invalidateQueries({
          queryKey: ["discussions", "module", vars.moduleId],
        });
      }
      toast.success("Discussion topic updated & rubric attached");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update topic");
    },
  });
};

export const useCreateDiscussionPostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDiscussionPostDto) =>
      discussionService.createPost(dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["discussion-topic", vars.topicId],
      });
      toast.success("Discussion post published");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to publish post");
    },
  });
};

export const useGradeDiscussionPostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      dto,
      topicId,
    }: {
      postId: string | number;
      dto: GradeDiscussionPostDto;
      topicId?: string | number;
    }) => discussionService.gradePost(postId, dto),
    onSuccess: (_, vars) => {
      if (vars.topicId) {
        queryClient.invalidateQueries({
          queryKey: ["discussion-topic", vars.topicId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["discussions"],
      });
      // Synchronize with module gradebook and student dashboard
      queryClient.invalidateQueries({
        queryKey: ["gradebook"],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-grade-report"],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-analytics"],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-dashboard"],
      });
      toast.success("Post graded successfully with rubric criteria");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to grade post");
    },
  });
};

export const useStudentGradeReport = (
  cohortId?: string | number,
  userId?: string
) => {
  return useQuery({
    queryKey: ["student-grade-report", cohortId, userId],
    queryFn: () => discussionService.getStudentGradeReport(cohortId!, userId),
    enabled: Boolean(cohortId),
  });
};
