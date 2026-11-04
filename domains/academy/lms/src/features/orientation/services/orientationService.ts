import api from "@/lib/api";
import type { OrientationStatus, CompleteOrientationPayload } from "../types";

export const orientationService = {
  /**
   * Fetch orientation status for a student's cohort
   * Verified Contract: GET {{baseUrl}}/academy/orientation/status/{{cohortId}}
   */
  getOrientationStatus: async (cohortId: number): Promise<OrientationStatus> => {
    try {
      const response = await api.get<OrientationStatus>(
        `/academy/orientation/status/${cohortId}`
      );
      return response.data;
    } catch (err: any) {
      // Fallback to direct path if proxy rewrite routes without prefix
      if (err?.response?.status === 404 || err?.response?.status === 400) {
        try {
          const fallback = await api.get<OrientationStatus>(
            `/orientation/status/${cohortId}`
          );
          return fallback.data;
        } catch {
          // Rethrow original error if fallback also fails
        }
      }
      throw err;
    }
  },

  /**
   * Complete mandatory student orientation gate
   * Verified Contract: POST {{baseUrl}}/academy/orientation/complete
   * Submits strictly the 4 verified required fields: cohortId, orientationAttended, lmsTutorialCompleted, netiquetteSigned
   */
  completeOrientation: async (
    payload: CompleteOrientationPayload
  ): Promise<any> => {
    const strictPayload = {
      cohortId: Number(payload.cohortId),
      orientationAttended: true as const,
      lmsTutorialCompleted: true as const,
      netiquetteSigned: true as const,
    };

    try {
      const response = await api.post(
        "/academy/orientation/complete",
        strictPayload
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await api.post(
          "/orientation/complete",
          strictPayload
        );
        return fallback.data;
      }
      throw err;
    }
  },
};
