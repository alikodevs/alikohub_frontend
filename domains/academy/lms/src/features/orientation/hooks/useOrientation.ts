import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orientationService } from "../services/orientationService";
import type { CompleteOrientationPayload, OrientationStatus } from "../types";
import { toast } from "sonner";

export const useOrientationStatus = (cohortId?: number | null) => {
  return useQuery<OrientationStatus>({
    queryKey: ["orientation-status", cohortId],
    queryFn: () => {
      if (!cohortId) {
        throw new Error("Cohort ID required to check orientation status");
      }
      return orientationService.getOrientationStatus(cohortId);
    },
    enabled: typeof cohortId === "number" && !isNaN(cohortId) && cohortId > 0,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
};

export const useCompleteOrientationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompleteOrientationPayload) =>
      orientationService.completeOrientation(payload),
    onSuccess: (_, variables) => {
      toast.success("Mandatory Orientation confirmed complete!", {
        description: "Course lessons and curriculum are now unlocked.",
      });
      queryClient.invalidateQueries({
        queryKey: ["orientation-status", variables.cohortId],
      });
      queryClient.invalidateQueries({
        queryKey: ["orientation-status"],
      });
      queryClient.invalidateQueries({
        queryKey: ["enrollments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-dashboard"],
      });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit orientation completion. Please try again.";
      toast.error("Orientation Submission Error", {
        description: msg,
      });
    },
  });
};
