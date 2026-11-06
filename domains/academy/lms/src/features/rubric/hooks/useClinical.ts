import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wabonComplianceService } from "../services/wabonComplianceService";
import type {
  ClinicalShift,
  StudentClinicalHoursSummary,
  CreateClinicalShiftDto,
  RecordClinicalAttendanceDto,
  UpdateClinicalAttendanceDto,
} from "../types";
import { toast } from "sonner";

export const useCohortClinicalShifts = (cohortId?: string | number) => {
  return useQuery({
    queryKey: ["clinical", "shifts", "cohort", cohortId],
    queryFn: () => wabonComplianceService.getCohortClinicalShifts(cohortId!),
    enabled: Boolean(cohortId),
  });
};

export const useClinicalShift = (shiftId?: string | number) => {
  return useQuery({
    queryKey: ["clinical", "shift", shiftId],
    queryFn: () => wabonComplianceService.getClinicalShift(shiftId!),
    enabled: Boolean(shiftId),
  });
};

export const useStudentClinicalHours = (
  studentUserId?: string,
  cohortId?: string | number
) => {
  return useQuery<StudentClinicalHoursSummary>({
    queryKey: ["clinical", "hours", "student", studentUserId, cohortId],
    queryFn: () =>
      wabonComplianceService.getStudentClinicalHours(studentUserId!, cohortId!),
    enabled: Boolean(studentUserId && cohortId),
  });
};

export const useCreateClinicalShiftMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateClinicalShiftDto) =>
      wabonComplianceService.createClinicalShift(dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["clinical", "shifts", "cohort", vars.cohortId],
      });
      toast.success("Clinical shift created successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create clinical shift");
    },
  });
};

export const useRecordClinicalAttendanceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RecordClinicalAttendanceDto) =>
      wabonComplianceService.recordClinicalAttendance(dto),
    onSuccess: (data: any, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["clinical", "shifts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["clinical", "shift", vars.shiftId],
      });
      queryClient.invalidateQueries({
        queryKey: ["clinical", "hours", "student", vars.studentUserId],
      });
      toast.success("Clinical attendance verified and recorded");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Failed to record clinical attendance"
      );
    },
  });
};

export const useUpdateClinicalAttendanceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      attendanceId,
      dto,
    }: {
      attendanceId: string | number;
      dto: UpdateClinicalAttendanceDto;
    }) => wabonComplianceService.updateClinicalAttendance(attendanceId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clinical"],
      });
      toast.success("Clinical attendance updated");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Failed to update clinical attendance"
      );
    },
  });
};
