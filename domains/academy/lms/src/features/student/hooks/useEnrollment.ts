import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

interface EnrollmentRequest {
  courseId: number;
  paymentGateway?: "CHAPA" | "STRIPE";
}

interface EnrollmentResponse {
  success: boolean;
  checkoutUrl?: string;
  message?: string;
  enrollmentId?: string;
}

export const useEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      paymentGateway = "CHAPA",
    }: EnrollmentRequest): Promise<EnrollmentResponse> => {
      const response = await api.post("/enrollment", {
        courseId,
        paymentGateway,
      });

      return response.data;
    },
    onSuccess: (data: EnrollmentResponse) => {
      if (data.checkoutUrl) {
        // Clear any pending UI state
        queryClient.invalidateQueries({ queryKey: ["enrollments"] });

        // Show success message
        toast.success("Redirecting to payment gateway...");

        // Redirect to payment gateway
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("No payment URL provided. Please contact support.");
      }
    },
    onError: (error: unknown) => {
      console.error("Enrollment error:", error);
      let message = "Failed to initiate payment. Please try again.";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        message = axiosError.response?.data?.message || message;
      } else if (error && typeof error === "object" && "message" in error) {
        message = (error as { message: string }).message;
      }

      toast.error(message);
    },
  });
};

// Hook to check enrollment status
export const useEnrollmentStatus = (courseId?: number) => {
  return useQuery({
    queryKey: ["enrollment-status", courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const response = await api.get(`/enrollments/status/${courseId}`);
      return response.data;
    },
    enabled: !!courseId,
  });
};

// Hook to get user's enrollments (Postman 2.2.2 GET /enrollment/me)
export const useUserEnrollments = () => {
  return useQuery({
    queryKey: ["enrollments"],
    queryFn: async () => {
      const response = await api.get("/enrollment/me");
      return response.data;
    },
  });
};
