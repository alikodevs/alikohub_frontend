import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wabonComplianceService } from "../services/wabonComplianceService";
import { examSecurityService } from "../services/examSecurityService";
import type { ComplianceDossier, ExamSession, AuditExamSessionDto } from "../types";
import { toast } from "sonner";

export const useComplianceDossier = (
  courseId?: string | number,
  cohortId?: string | number
) => {
  return useQuery<ComplianceDossier>({
    queryKey: ["compliance-exporter", "dossier", courseId, cohortId],
    queryFn: () =>
      wabonComplianceService.generateDossier({
        courseId: Number(courseId!),
        cohortId: cohortId ? Number(cohortId) : undefined,
      }),
    enabled: Boolean(courseId),
  });
};

export const useExerciseExamSessions = (exerciseId?: string | number) => {
  return useQuery<ExamSession[]>({
    queryKey: ["exam-security", "sessions", "exercise", exerciseId],
    queryFn: () => examSecurityService.getSessionsByExercise(exerciseId!),
    enabled: Boolean(exerciseId),
  });
};

export const useAuditExamSessionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AuditExamSessionDto) =>
      examSecurityService.auditSession(dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["exam-security"],
      });
      toast.success("Exam session audit record updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to audit exam session");
    },
  });
};

