/**
 * AlikoHub Academy — Mandatory Student Orientation Types
 * Source of Truth: Aliko_backend/apps/academy-service/src/orientation
 * WABON WAC 246-841A-440(2) & Req 11 (Non-Credit Prerequisite)
 */

export interface OrientationStatus {
  cohortId: number;
  userId: string;
  orientationCompleted: boolean;
  orientationAttendedAt: string | null;
  lmsTutorialCompleted: boolean;
  netiquetteSigned: boolean;
  isCreditHour: boolean; // Always false — orientation is non-credited under WAC 246-841A-440
}

export interface CompleteOrientationPayload {
  cohortId: number;
  orientationAttended: true;
  lmsTutorialCompleted: true;
  netiquetteSigned: true;
}

export interface OrientationRequirementItem {
  id: "orientationAttended" | "lmsTutorialCompleted" | "netiquetteSigned";
  title: string;
  subtitle: string;
  wabonReference: string;
  description: string;
  required: true;
}
