import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wabonComplianceService } from "../services/wabonComplianceService";
import type {
  EvaluationSurvey,
  SubmitEvaluationSurveyDto,
  CohortEvaluationMetrics,
} from "../types";
import { toast } from "sonner";

export const useMyEvaluationSurvey = (cohortId?: string | number | null) => {
  return useQuery<EvaluationSurvey | null>({
    queryKey: ["evaluations", "my-survey", cohortId],
    queryFn: () => wabonComplianceService.getMyEvaluationSurvey(cohortId!),
    enabled: Boolean(cohortId),
  });
};

export const useCohortEvaluations = (
  cohortId?: string | number | null,
  enabled: boolean = true
) => {
  return useQuery<CohortEvaluationMetrics>({
    queryKey: ["evaluations", "cohort", cohortId],
    queryFn: () => wabonComplianceService.getCohortEvaluationSurveys(cohortId!),
    enabled: Boolean(cohortId && enabled),
  });
};

export const useSubmitEvaluationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SubmitEvaluationSurveyDto) =>
      wabonComplianceService.submitEvaluationSurvey(dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["evaluations", "my-survey", vars.cohortId],
      });
      queryClient.invalidateQueries({
        queryKey: ["evaluations", "cohort", vars.cohortId],
      });
      toast.success("Program evaluation submitted. Thank you for your feedback!");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Failed to submit program evaluation"
      );
    },
  });
};

