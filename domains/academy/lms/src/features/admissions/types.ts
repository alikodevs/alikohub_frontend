/**
 * Admissions Clearance & First-Week Attendance Types
 * Source of Truth: Backend Admissions & Cohort Enrollment Architecture
 * WABON WAC 246-841A-440 & Regulatory Enrollment Clearance
 */

export interface SubmitDocumentsPayload {
  cohortId: number;
  backgroundCheckUrl: string;
  tbTestProofUrl: string;
  immunizationProofUrl: string;
  cprCertUrl: string;
  idDocUrl: string;
  highSchoolProofUrl: string;
}

export interface SignAgreementPayload {
  cohortId: number;
  signature: string;
  acknowledgments?: Record<string, boolean> | boolean;
  agreedToStatutoryDisclosures?: boolean;
  signedAt?: string;
}

export interface AdmissionsApplication {
  id: number;
  userId: string;
  cohortId: number;
  status: "DRAFT" | "SUBMITTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  backgroundCheckUrl?: string | null;
  tbTestProofUrl?: string | null;
  immunizationProofUrl?: string | null;
  cprCertUrl?: string | null;
  idDocUrl?: string | null;
  highSchoolProofUrl?: string | null;
  agreementSigned?: boolean;
  agreementSignature?: string | null;
  agreementSignedAt?: string | null;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id?: string | number;
    firstname?: string;
    lastname?: string;
    email?: string;
    profilePicture?: string;
  };
  cohort?: {
    id?: number;
    name?: string;
    courseId?: number;
    course?: {
      id?: number;
      title?: string;
    };
  };
}

export interface AdmissionsReviewPayload {
  applicationId: number;
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

export type AttendanceVerificationStatus =
  | "PENDING_VERIFICATION"
  | "VERIFIED_PRESENT"
  | "NO_SHOW_AT_RISK"
  | "ADMINISTRATIVE_DROP";

export interface CohortCensusEnrollment {
  id: number | string;
  userId: string;
  cohortId: number;
  courseId?: number;
  status: string; // Enrollment status: ACTIVE, PENDING, COMPLETED, etc.
  approvalStatus?: string; // Admissions status: APPROVED, PENDING_REVIEW, REJECTED
  attendanceStatus: AttendanceVerificationStatus;
  attendanceVerifiedAt?: string | null;
  enrolledAt?: string;
  createdAt?: string;
  user?: {
    id?: string | number;
    firstname?: string;
    lastname?: string;
    email?: string;
    profilePicture?: string;
  };
  cohort?: {
    id?: number;
    name?: string;
    courseId?: number;
    course?: {
      id?: number;
      title?: string;
    };
  };
}

