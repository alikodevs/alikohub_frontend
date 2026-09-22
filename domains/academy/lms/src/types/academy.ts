export type CourseStatus =
  | "DRAFT"
  | "PENDING"
  | "PUBLISHED"
  | "REJECTED"
  | "PENDING_APPROVAL";
export type LessonType = "VIDEO" | "TEXT" | "QUIZ";
export type ContentType = "VIDEO" | "PDF" | "TEXT" | "QUIZ" | "ASSIGNMENT";
export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  description?: string;
  thumbnail?: string;
  videoUrl?: string;
  price?: number | null;
  currency?: string | null;
  priceInUsd?: number | null;
  isFree?: boolean;
  status: CourseStatus;
  difficulty?: Difficulty;
  category?: string;
  instructorId?: string;
  instructor?: {
    firstname: string;
    lastname: string;
    profilePicture?: string;
  };
  modulesCount?: number;
  lessonsCount?: number;
  enrolledNum?: number;
  enrolledCount?: number;
  enrollmentCount?: number;
  estimatedTime?: string | null;
  rating?: number | null;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
  modules?: Module[];
  skills?: string[];
  outcomes?: string[];
}

export interface Module {
  id: string | number;
  courseId: string | number;
  title: string;
  description?: string;
  order?: number;
  lessons?: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export type ExerciseType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "FILE_UPLOAD";

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  type: LessonType;
  order: number;
  duration?: number;
  isFreePreview: boolean;
  contents?: Content[];
  exercises?: Exercise[];
  createdAt: string;
  updatedAt: string;
}

export interface Content {
  id: string;
  lessonId: string;
  title: string;
  type: ContentType;
  url?: string;
  filePath?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  moduleId: string;
  lessonId: string;
  title: string;
  type: ExerciseType;
  question: string;
  description?: string;
  options?: any;
  correctAnswer?: any;
  userAnswer?: string;
  points: number;
  mySubmission?: ExerciseSubmission;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseSubmission {
  id: string | number;
  exerciseId: string | number;
  userId: string;
  status: "PENDING" | "GRADED" | "SUBMITTED";
  score?: number;
  feedback?: string;
  answer: string;
  isCorrect?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  yearsOfExperience: number;
  totalEarnings?: number;
  coursesByStatus?: Record<CourseStatus, number>;
}

export interface TeacherApplication {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACCEPTED" | "SUBMITTED";
  user?: {
    firstname: string;
    lastname: string;
    email: string;
    profilePicture?: string | null;
  };
  formData?: {
    resumeUrl?: string;
    documents?: { name: string; url: string }[];
    personalDetails?: {
      firstname?: string;
      lastname?: string;
      email?: string;
      phone?: string;
    };
    teachingCategories?: string[];
    interviewResponses?: {
      question: string;
      answer: string;
    }[];
  };
  reviewedBy?: string | null;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cohort {
  id: number | string;
  name: string;
  courseId: number | string;
  startDate: string;
  endDate: string;
  createdAt?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  cohortId?: string | number | null;
  context?: "COURSE_ONLY" | "COHORT_BASED";
  cohortRole?: "STUDENT" | "TEACHING_ASSISTANT";
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "DROPPED" | "PENDING";
  paymentStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | null;
  checkoutUrl?: string | null;
  progress: number;
  course?: Course;
  cohort?: Cohort;
  user?: {
    firstname: string;
    lastname: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
