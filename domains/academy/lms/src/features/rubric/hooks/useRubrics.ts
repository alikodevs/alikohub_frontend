import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rubricService } from "../services/rubricService";
import type {
  CreateRubricDto,
  EvaluateRubricDto,
  RubricType,
} from "../types";
import { toast } from "sonner";

export const useRubricsList = (params?: {
  type?: RubricType | string;
  isActive?: boolean;
}) => {
  return useQuery({
    queryKey: ["rubrics", params],
    queryFn: () => rubricService.getRubrics(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRubricDetail = (id?: string) => {
  return useQuery({
    queryKey: ["rubric", id],
    queryFn: () => rubricService.getRubricById(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateRubricMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRubricDto) => rubricService.createRubric(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubrics"] });
      toast.success("Standardized rubric created successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create rubric");
    },
  });
};

export const useCloneRubricMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rubricId, newName }: { rubricId: string; newName: string }) =>
      rubricService.cloneRubric(rubricId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubrics"] });
      toast.success("Rubric cloned successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to clone rubric");
    },
  });
};

export const useEvaluateRubricMutation = () => {
  return useMutation({
    mutationFn: (dto: EvaluateRubricDto) => rubricService.evaluateRubric(dto),
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Rubric evaluation failed");
    },
  });
};
