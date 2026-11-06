import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wabonComplianceService } from "../services/wabonComplianceService";
import type { StudyGroup, CreateStudyGroupDto } from "../types";
import { toast } from "sonner";

export const useCohortStudyGroups = (cohortId?: string | number) => {
  return useQuery<StudyGroup[]>({
    queryKey: ["study-groups", "cohort", cohortId],
    queryFn: () => wabonComplianceService.getCohortStudyGroups(cohortId!),
    enabled: Boolean(cohortId),
  });
};

export const useStudyGroup = (id?: string | number) => {
  return useQuery<StudyGroup>({
    queryKey: ["study-groups", id],
    queryFn: () => wabonComplianceService.getStudyGroup(id!),
    enabled: Boolean(id),
  });
};

export const useCreateStudyGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateStudyGroupDto) =>
      wabonComplianceService.createStudyGroup(dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["study-groups", "cohort", vars.cohortId],
      });
      toast.success("Study group created");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create study group");
    },
  });
};

export const useJoinStudyGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studyGroupId: number) =>
      wabonComplianceService.joinStudyGroup(studyGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["study-groups"],
      });
      toast.success("Joined study group");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to join study group");
    },
  });
};

export const useLeaveStudyGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studyGroupId: number | string) =>
      wabonComplianceService.leaveStudyGroup(studyGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["study-groups"],
      });
      toast.success("Left study group");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to leave study group");
    },
  });
};

export const useUpdateStudyGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number | string;
      dto: { name?: string; description?: string; meetingUrl?: string };
    }) => wabonComplianceService.updateStudyGroup(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["study-groups"],
      });
      toast.success("Study group updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update study group");
    },
  });
};

export const useDeleteStudyGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      wabonComplianceService.deleteStudyGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["study-groups"],
      });
      toast.success("Study group removed");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete study group");
    },
  });
};

