import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admissionsService } from "../services/admissionsService";
import type {
  SubmitDocumentsPayload,
  SignAgreementPayload,
  AdmissionsReviewPayload,
} from "../types";
import { toast } from "sonner";

export const useMyAdmissionsApplication = (cohortId?: number | null) => {
  return useQuery({
    queryKey: ["admissions-my-application", cohortId],
    queryFn: () => admissionsService.getMyApplication(cohortId!),
    enabled: Boolean(cohortId),
    staleTime: 30 * 1000,
  });
};

export const useSubmitPrerequisitesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitDocumentsPayload) =>
      admissionsService.submitPrerequisites(payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["admissions-my-application", vars.cohortId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admissions-cohort", vars.cohortId],
      });
      queryClient.invalidateQueries({
        queryKey: ["enrollments"],
      });
      toast.success("Prerequisite documents submitted for admissions clearance.");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          "Failed to submit documents. Please ensure all URLs or files are valid."
      );
    },
  });
};

export const useSignAgreementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SignAgreementPayload) =>
      admissionsService.signAgreement(payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["admissions-my-application", vars.cohortId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admissions-cohort", vars.cohortId],
      });
      toast.success("Enrollment agreement digitally signed and statutory disclosures acknowledged.");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          "Failed to record digital agreement signature. Please try again."
      );
    },
  });
};

export const useCohortAdmissions = (cohortId?: number | null) => {
  return useQuery({
    queryKey: ["admissions-cohort", cohortId],
    queryFn: () => admissionsService.getCohortApplications(cohortId!),
    enabled: Boolean(cohortId),
    staleTime: 30 * 1000,
  });
};

export const useReviewApplicationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdmissionsReviewPayload) =>
      admissionsService.reviewApplication(payload),
    onSuccess: (data, vars) => {
      const cohortId = data?.cohortId;
      if (cohortId) {
        queryClient.invalidateQueries({
          queryKey: ["admissions-cohort", cohortId],
        });
        queryClient.invalidateQueries({
          queryKey: ["admissions-my-application", cohortId],
        });
        queryClient.invalidateQueries({
          queryKey: ["cohort-census", cohortId],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["admissions-cohort"] });
      }
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-all-submissions"] });

      if (vars.status === "APPROVED") {
        toast.success("Student admissions clearance approved. Active enrollment confirmed.");
      } else {
        toast.warning("Student admissions application rejected with remediation notice.");
      }
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          "Failed to process admissions review decision."
      );
    },
  });
};

export const useCohortCensus = (cohortId?: number | null) => {
  return useQuery({
    queryKey: ["cohort-census", cohortId],
    queryFn: () => admissionsService.getCohortCensus(cohortId!),
    enabled: Boolean(cohortId),
    staleTime: 30 * 1000,
  });
};

