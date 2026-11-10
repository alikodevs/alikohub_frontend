import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { skillsLabService } from "../services/skillsLabService";
import type { SkillCheckoff } from "../types";
import { toast } from "sonner";

export const useSkillsList = () => {
  return useQuery({
    queryKey: ["skills-lab", "skills"],
    queryFn: () => skillsLabService.getSkills(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useStudentSkillsMatrix = (
  studentUserId?: string,
  cohortId?: string | number
) => {
  return useQuery({
    queryKey: ["skills-lab", "matrix", studentUserId, cohortId],
    queryFn: () => skillsLabService.getStudentMatrix(studentUserId!, cohortId!),
    enabled: Boolean(studentUserId && cohortId),
  });
};

export const useRecordCheckoffMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<SkillCheckoff>) =>
      skillsLabService.recordCheckoff(dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["skills-lab", "matrix", vars.studentUserId, vars.cohortId],
      });
      toast.success(
        vars.status === "PASSED"
          ? "Competency verified: PASSED"
          : "Skill checkoff recorded: Needs Practice"
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to record checkoff");
    },
  });
};

export const useInstructorCredentials = (instructorUserId?: string) => {
  return useQuery({
    queryKey: ["instructor-credentials", instructorUserId],
    queryFn: () => skillsLabService.getInstructorCredentials(instructorUserId!),
    enabled: Boolean(instructorUserId),
  });
};

export const useRegisterCredentialsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      rnLicenseNumber: string;
      rnLicenseExpiration: string;
      yearsLongTermCareExp: number;
      trainTheTrainerCertUrl?: string;
      wabonApprovalLetterUrl?: string;
    }) => skillsLabService.registerInstructorCredentials(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-credentials"] });
      toast.success("WABON RN Instructor Credentials verified and active!");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Failed to register RN credentials."
      );
    },
  });
};
