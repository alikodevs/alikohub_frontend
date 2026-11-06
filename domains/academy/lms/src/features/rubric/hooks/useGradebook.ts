import { useQuery, useMutation } from "@tanstack/react-query";
import { wabonComplianceService } from "../services/wabonComplianceService";
import type { CohortGradebookReport, StudentGradeReport } from "../types";
import { toast } from "sonner";

export const useCohortGradebook = (cohortId?: string | number) => {
  return useQuery<CohortGradebookReport>({
    queryKey: ["gradebook", "cohort", cohortId],
    queryFn: () => wabonComplianceService.getCohortGradebook(cohortId!),
    enabled: Boolean(cohortId),
  });
};

export const useStudentGradeReport = (
  cohortId?: string | number,
  userId?: string
) => {
  return useQuery<StudentGradeReport>({
    queryKey: ["gradebook", "student", cohortId, userId],
    queryFn: () => wabonComplianceService.getStudentGradeReport(cohortId!, userId),
    enabled: Boolean(cohortId),
  });
};

export const useExportGradebookCsvMutation = () => {
  return useMutation({
    mutationFn: async (cohortId: string | number) => {
      const data = await wabonComplianceService.exportCohortGradebookCsv(cohortId);
      // Trigger browser download if csvContent is returned
      if (data && data.csvContent) {
        const blob = new Blob([data.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", data.filename || `cohort_${cohortId}_gradebook.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Gradebook CSV exported successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to export gradebook CSV");
    },
  });
};

