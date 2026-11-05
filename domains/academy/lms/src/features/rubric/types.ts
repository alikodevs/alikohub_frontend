/**
 * AlikoHub Academy — Rubrics & WABON Compliance Types
 * Source of Truth: AlikoHub_Academy_WABON_Compliance.postman_collection.json
 */

export type RubricType = "DISCUSSION" | "ASSIGNMENT";

export interface RubricLevel {
  id?: string;
  name: string;
  description: string;
  points: number;
  order: number;
}

export interface RubricCriterion {
  id?: string;
  title: string;
  description: string;
  maxPoints: number;
  order: number;
  levels: RubricLevel[];
}

export interface Rubric {
  id: string;
  name: string;
  description?: string;
  type: RubricType;
  isActive: boolean;
  criteria: RubricCriterion[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CreateRubricDto {
  name: string;
  title?: string;
  courseId?: number;
  maxScore?: number;
  passingScore?: number;
  description?: string;
  type?: RubricType;
  isActive?: boolean;
  criteria: Array<{
    name?: string;
    title: string;
    description: string;
    maxPoints: number;
    order?: number;
    levels: Array<{
      name: string;
      description: string;
      points: number;
      order?: number;
    }>;
  }>;
}

export interface CloneRubricDto {
  rubricId: string;
  newName: string;
}

export interface EvaluateCriterionScoreDto {
  criterionId: string;
  levelId?: string;
  points: number;
  feedback?: string;
}

export interface EvaluateRubricDto {
  rubricId: string | number;
  scores?: EvaluateCriterionScoreDto[];
  criteriaScores?: EvaluateCriterionScoreDto[];
  studentId?: string;
  studentUserId?: string;
  evaluatorId?: string;
  overallFeedback?: string;
  selectedLevelIds?: string[];
  customFeedback?: string;
  ratings?: Array<{
    criterionId: string | number;
    points: number;
    feedback?: string;
  }>;
}

export interface CriterionScoreResult {
  criterionId: string;
  criterionTitle?: string;
  selectedLevelId: string;
  levelName: string;
  points: number;
  maxPoints?: number;
  description?: string;
}

export interface RubricEvaluationResult {
  rubricId?: string;
  totalPoints: number;
  maxPoints?: number;
  percentage?: number;
  selectedLevelIds?: string[];
  criteriaScores?: CriterionScoreResult[];
  customFeedback?: string;
  evaluatedAt?: string;
  evaluatorId?: string;
}

// ── Discussion Forum Types (WABON WAC 246-841A-440(4)) ──
export interface DiscussionTopic {
  id: string | number;
  moduleId: string | number;
  title: string;
  prompt: string;
  description?: string;
  rubricId?: string;
  rubric?: Rubric | any;
  rubricRef?: Rubric | any;
  maxPoints?: number;
  dueDate?: string;
  dueAt?: string;
  createdAt?: string;
  posts?: DiscussionPost[];
  postsCount?: number;
  _count?: {
    posts?: number;
  };
}

export interface DiscussionPost {
  id: string | number;
  topicId: string | number;
  content: string;
  body?: string;
  parentId?: string | number | null;
  userId?: string;
  authorName?: string;
  authorAvatar?: string;
  authorRole?: string;
  grade?: number;
  score?: number;
  feedback?: string;
  isSubstantive?: boolean;
  createdAt: string;
  replies?: DiscussionPost[];
  rubricScores?: any;
  gradeDetails?: {
    id?: number | string;
    postId?: number | string;
    score: number;
    rubricScores?: any;
    feedback?: string;
    graderId?: string;
    createdAt?: string;
  };
}

export interface CreateDiscussionTopicDto {
  moduleId: string | number;
  title: string;
  prompt: string;
  description?: string;
  rubricId?: string;
  rubric?: any;
  maxPoints?: number;
  dueDate?: string;
  dueAt?: string;
}

export interface UpdateDiscussionTopicDto {
  rubricId?: string;
  rubric?: any;
  prompt?: string;
  title?: string;
  dueDate?: string;
  dueAt?: string;
  maxPoints?: number;
}

export interface CreateDiscussionPostDto {
  topicId: string | number;
  content?: string;
  body?: string;
  parentId?: string | number | null;
}

export interface GradeDiscussionPostDto {
  score?: number;
  grade?: number;
  feedback: string;
  isSubstantive?: boolean;
  rubricId?: string;
  selectedLevelIds?: string[];
  criteriaScores?: Array<{
    criterionId: string;
    levelId?: string;
    points: number;
    feedback?: string;
  }>;
  rubricScores?: any;
}

// ── Skills Lab Competency Matrix Types (WABON WAC 246-841A-440(7)) ──
export interface Skill {
  id: string | number;
  skillNumber: string;
  title: string;
  category: "INFECTION_CONTROL" | "VITAL_SIGNS" | "PERSONAL_CARE" | "MOBILITY" | "SAFETY" | string;
  description: string;
  criticalSteps: string[];
  passingScore: number;
}

export interface SkillCheckoff {
  id?: string | number;
  skillId: string | number;
  studentUserId: string;
  cohortId: string | number;
  status: "PASSED" | "NEEDS_PRACTICE" | "FAILED" | string;
  attemptNumber: number;
  criticalStepsCompleted?: string[];
  notes?: string;
  evaluatorNotes?: string;
  signatureUrl?: string;
  evaluatorName?: string;
  evaluatorUserId?: string;
  evaluatedAt?: string;
}

export interface SkillsLabMatrixItem {
  skill: Skill;
  checkoffs: SkillCheckoff[];
  isCompetent: boolean;
  latestStatus?: "PASSED" | "NEEDS_PRACTICE" | "FAILED" | "NOT_ATTEMPTED";
}

export interface SkillsLabMatrix {
  studentUserId: string;
  cohortId: string | number;
  skills: SkillsLabMatrixItem[];
  totalSkills: number;
  passedSkills: number;
  completionPercentage: number;
}

// ── Exam Security & Proctoring Types (WABON WAC 246-841A-440(9)) ──
export interface StartExamSessionDto {
  exerciseId: string | number;
  webcamSnapshotUrl?: string;
  photoIdSnapshotUrl?: string;
  clientIp?: string;
  userAgent?: string;
  honorCodeAccepted?: boolean;
}

export interface ExamSession {
  id: string | number;
  exerciseId: string | number;
  studentUserId?: string;
  startTime: string;
  endTime?: string;
  tabBlurCount: number;
  totalBlurDurationSeconds: number;
  webcamSnapshotUrl?: string;
  photoIdSnapshotUrl?: string;
  isFlagged?: boolean;
  auditNotes?: string;
}

export interface TabBlurDto {
  sessionId: string | number;
  blurDurationSeconds: number;
  currentQuestionIndex?: number;
}

export interface EndExamSessionDto {
  sessionId: string | number;
}

export interface AuditExamSessionDto {
  sessionId: string | number;
  isFlagged: boolean;
  auditNotes: string;
}

// ── Active Seat-Time Heartbeat Engine (WABON WAC 246-841A-440(6)) ──
export interface SeatTimeHeartbeatDto {
  courseId: string | number;
  lessonId: string | number;
  cohortId?: string | number;
  activeSeconds?: number;
  idleSeconds?: number;
  tabFocused?: boolean;
  intervalSeconds?: number;
  engagementScore?: number;
  interactionType?: "VIDEO_PLAYBACK" | "READING" | "QUIZ_INTERACTION" | "EXERCISE" | string;
}

export interface SeatTimeSummary {
  courseId: string | number;
  userId?: string;
  totalActiveTimeSeconds: number;
  totalActiveTimeMinutes: number;
  creditHourActiveTimeSeconds?: number;
  creditHourActiveTimeMinutes?: number;
  totalActiveSeconds?: number;
  totalRequiredSeconds?: number;
  progressPercentage?: number;
  lessons?: Array<{
    lessonId: string | number;
    lessonTitle?: string;
    title?: string;
    isCreditHour?: boolean;
    activeTimeSeconds: number;
    activeTimeMinutes: number;
    status?: string;
    lastActivity?: string;
  }>;
  lessonsBreakdown?: Array<{
    lessonId: string | number;
    title: string;
    seconds: number;
  }>;
}

export interface StudentSeatTimeRecord {
  id: string | number;
  userId: string;
  studentId?: string | number;
  studentName: string;
  studentEmail?: string;
  avatarUrl?: string;
  courseId?: string | number;
  courseTitle?: string;
  cohortId?: string | number;
  cohortName?: string;
  totalActiveTimeSeconds: number;
  totalActiveTimeMinutes: number;
  activeHours: number;
  requiredSeconds: number;
  isCompliant: boolean;
  progressPct: number;
  enrolledAt?: string;
  enrollmentStatus?: string;
  lessonsBreakdown?: Array<{
    lessonId: string | number;
    lessonTitle?: string;
    title?: string;
    isCreditHour?: boolean;
    activeTimeSeconds: number;
    activeTimeMinutes: number;
    status?: string;
    lastActivity?: string;
  }>;
}

export interface CohortSeatTimeReport {
  cohortId: string | number;
  cohortName?: string;
  courseId?: string | number;
  courseTitle?: string;
  totalStudents: number;
  averageActiveHours: number;
  totalActiveHours: number;
  compliantStudentsCount: number;
  students: StudentSeatTimeRecord[];
}
