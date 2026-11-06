import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wabonComplianceService } from "../services/wabonComplianceService";
import type {
  SupportTicket,
  CreateSupportTicketDto,
  UpdateSupportTicketDto,
} from "../types";
import { toast } from "sonner";

export const useMySupportTickets = () => {
  return useQuery<SupportTicket[]>({
    queryKey: ["support-desk", "tickets", "me"],
    queryFn: () => wabonComplianceService.getMySupportTickets(),
  });
};

export const useSupportTicket = (ticketId?: string | number) => {
  return useQuery<SupportTicket>({
    queryKey: ["support-desk", "ticket", ticketId],
    queryFn: () => wabonComplianceService.getSupportTicketById(ticketId!),
    enabled: Boolean(ticketId),
  });
};

export const useAllSupportTickets = (params?: {
  category?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery<{
    tickets: SupportTicket[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["support-desk", "tickets", "all", params],
    queryFn: () => wabonComplianceService.listAllSupportTickets(params),
  });
};

export const useCreateSupportTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSupportTicketDto) =>
      wabonComplianceService.createSupportTicket(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["support-desk", "tickets"],
      });
      toast.success("Support ticket submitted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit support ticket");
    },
  });
};

export const useUpdateSupportTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      dto,
    }: {
      ticketId: number | string;
      dto: UpdateSupportTicketDto;
    }) => wabonComplianceService.updateSupportTicket(ticketId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["support-desk", "tickets"],
      });
      toast.success("Ticket status updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update ticket");
    },
  });
};

export const useSystemRequirements = () => {
  return useQuery({
    queryKey: ["support-desk", "system-requirements"],
    queryFn: () => wabonComplianceService.getSystemRequirements(),
    staleTime: 60 * 60 * 1000,
  });
};

