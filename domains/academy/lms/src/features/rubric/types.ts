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
  passed?: boolean;
  status: "PASSED" | "NEEDS_PRACTICE" | "FAILED" | string;
  attemptNumber: number;
  attempts?: number;
  criticalStepsCompleted?: string[];
  notes?: string;
  comments?: string;
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

// ── Clinical Hours & Shift Types (WAC 246-841A-440 / 40h Min, 10:1 Ratio) ──
export interface ClinicalShiftAttendance {
  id: number;
  shiftId: number;
  userId: string;
  student?: {
    userId: string;
    role: string;
  };
  hoursCompleted: number;
  passed: boolean;
  competencyNotes?: string;
  signedBy?: string;
  createdAt?: string;
}

export interface ClinicalShift {
  id: number;
  cohortId: number;
  facilityName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  hoursCredited: number;
  instructorId?: string;
  instructor?: {
    userId: string;
    role: string;
  };
  studentRoster?: ClinicalShiftAttendance[];
  _count?: {
    studentRoster: number;
  };
  cohort?: {
    id: number;
    name: string;
    courseId: number;
  };
}

export interface CreateClinicalShiftDto {
  cohortId: number;
  facilityName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  hoursCredited: number;
}

export interface RecordClinicalAttendanceDto {
  shiftId: number;
  studentUserId: string;
  hoursCompleted: number;
  competencyNotes?: string;
  passed?: boolean;
}

export interface UpdateClinicalAttendanceDto {
  hoursCompleted?: number;
  competencyNotes?: string;
  passed?: boolean;
}

export interface StudentClinicalHoursSummary {
  studentUserId: string;
  cohortId: number;
  totalHoursCompleted: number;
  minimumRequired: number; // 40
  hoursRemaining: number;
  meetsMinimum: boolean;
  completionPercent: number;
  totalShifts: number;
  passedShifts: number;
  shifts: Array<{
    attendanceId: number;
    shiftId: number;
    facilityName: string;
    shiftDate: string;
    hoursCompleted: number;
    passed: boolean;
    competencyNotes?: string;
    signedBy?: string;
  }>;
}

// ── Curriculum Crosswalk Types (WAC 246-841A-440 Curriculum Standard) ──
export interface CourseTextbook {
  id: number;
  courseId: number;
  title: string;
  author: string;
  edition?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  createdAt?: string;
  _count?: {
    readings: number;
  };
}

export interface LessonReading {
  id: number;
  lessonId: number;
  textbookId: number;
  chapters: string;
  pageRange: string;
  textbook?: CourseTextbook;
}

export interface CurriculumCrosswalkUnit {
  lessonId: number;
  lessonTitle: string;
  lessonType: string;
  isCreditHour: boolean;
  isWeekOneAttendanceGate: boolean;
  assignedTextbookReadings: Array<{
    textbookTitle: string;
    edition?: string | null;
    isbn?: string | null;
    assignedChapters: string;
    pageRange: string;
  }>;
  assessments: Array<{
    id: number;
    title: string;
    points: number;
    type: string;
  }>;
}

export interface CurriculumCrosswalkModule {
  moduleId: number;
  moduleTitle: string;
  track: string;
  isOrientationModule: boolean;
  discussionTopics: Array<{
    id: number;
    title: string;
    maxPoints: number;
  }>;
  units: CurriculumCrosswalkUnit[];
}

export interface CurriculumCrosswalk {
  courseId: number;
  courseTitle: string;
  accreditationStandard: string;
  textbooks: CourseTextbook[];
  curriculumMatrix: CurriculumCrosswalkModule[];
}

// ── Gradebook Types (WABON Theory 80% passing, skills 22/22, clinical 40h) ──
export interface StudentGradeSummary {
  overallTheoryPercent: number;
  letterGrade: string;
  isTheoryPassed: boolean;
  quizAveragePercent: number;
  examAveragePercent: number;
  discussionAveragePercent: number;
  skillsLab: {
    totalRequired: number;
    passedCount: number;
    isSkillsLabComplete: boolean;
  };
  clinicalHours: {
    totalCompleted: number;
    minimumRequired: number;
    isClinicalHoursMet: boolean;
  };
  pacing: {
    status: "ON_TRACK" | "AT_RISK" | "BEHIND_SCHEDULE";
    expectedProgressPercent: number;
    actualProgressPercent: number;
    daysRemainingInCohort: number;
  };
  complianceStatus: string;
}

export interface StudentGradeReport {
  userId: string;
  cohortId: number;
  courseTitle?: string;
  summary: StudentGradeSummary;
  details?: {
    quizzesCompleted: number;
    examsCompleted: number;
    discussionsGraded: number;
  };
}

export interface CohortGradebookReport {
  cohortId: number;
  totalStudents: number;
  graduatingCount: number;
  passRatePercent: number;
  students: StudentGradeReport[];
}

// ── Study Group Types ──
export interface StudyGroupMember {
  id: number;
  userId: string;
  role: string;
  joinedAt: string;
  profile?: {
    userId: string;
    role: string;
  };
}

export interface StudyGroup {
  id: number;
  cohortId: number;
  name: string;
  description?: string | null;
  meetingUrl?: string | null;
  createdBy: string;
  createdAt: string;
  members?: StudyGroupMember[];
  _count?: {
    members: number;
  };
}

export interface CreateStudyGroupDto {
  cohortId: number;
  name: string;
  description?: string;
  meetingUrl?: string;
}

// ── Support Desk Types ──
export type SupportCategory =
  | "LOGIN_AUTH"
  | "VIDEO_CONTENT_PLAYER"
  | "QUIZ_EXAM_ERROR"
  | "DISCUSSION_SUBMISSION"
  | "BROWSER_COMPATIBILITY"
  | "GENERAL";

export type SupportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type SupportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface SupportTicket {
  id: number;
  userId: string;
  category: SupportCategory;
  subject: string;
  description: string;
  priority: SupportPriority;
  status: SupportStatus;
  attachmentUrl?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: {
    userId: string;
    role: string;
  };
}

export interface CreateSupportTicketDto {
  category: SupportCategory;
  subject: string;
  description: string;
  priority?: SupportPriority;
  attachmentUrl?: string;
  clientDiagnostics?: {
    browser?: string;
    os?: string;
    screenResolution?: string;
    cookiesEnabled?: boolean;
    webRtcSupported?: boolean;
  };
}

export interface UpdateSupportTicketDto {
  ticketId?: number;
  status?: SupportStatus;
  priority?: SupportPriority;
  resolution?: string;
}

// ── Regulatory Compliance Dossier (WAC 246-841A-440) ──
export interface ComplianceDossier {
  dossierTitle: string;
  submissionAuthority: string;
  programName: string;
  courseId: number;
  courseTitle: string;
  generatedAt: string;
  statutoryStandards: {
    statuteCitation: string;
    maximumTheoryRatio: string;
    maximumLabAndClinicalRatio: string;
    maximumCohortDurationCalendarDays: number;
    minimumClinicalHoursRequired: number;
    passingGradeThresholdPercent: number;
    weekOneAttendanceCensusDeadlineDays: number;
  };
  cohortVerification?: {
    cohortId: number;
    startDate: string;
    endDate: string;
    calendarDurationDays: number;
    isWithinStatutory90DayCap: boolean;
    totalEnrolledStudents: number;
    statutoryTheoryRatioCompliant: boolean;
  } | null;
  curriculumCrosswalk: {
    totalModules: number;
    totalLessons: number;
    textbooksRegistered: Array<{
      title: string;
      author: string;
      edition?: string;
      isbn?: string;
    }>;
    matrix: Array<{
      moduleTitle: string;
      lessonTitle: string;
      curriculumTrack: string;
      isOrientationLesson: boolean;
      textbookReadings: Array<{
        chapters: string;
        pageRange: string;
      }>;
      exercisesCount: number;
      hasAttendanceGate: boolean;
    }>;
  };
  skillsLabCurriculum: {
    totalCoreSkills: number;
    skillsChecklist: Array<{
      skillNumber: string;
      name: string;
      category: string;
    }>;
  };
  facultyRoster: Array<{
    userId: string;
    rnLicenseNumber: string;
    rnLicenseExpiration: string;
    yearsLongTermCareExp: number;
    isTrainTheTrainerCertified: boolean;
    isDirectorApproved: boolean;
  }>;
  qualityAssuranceAndQM: {
    wacStandard: string;
    accreditationStatus: string;
    qualityMattersCertified: boolean;
    qmCertificationLevel: string;
    qmReviewScore: string;
    qmReviewDate: string;
    historicalPassRates: {
      nnaapStateExamPassRatePercent: number;
      stateMinimumPassRateBenchmarkPercent: number;
      cohortCompletionRatePercent: number;
    };
    continuousQualityImprovement: {
      annualEvaluationDate: string;
      evaluationCadence: string;
    };
  };
  triTrackMasterCurriculum: {
    trackOneTheoryAsync: {
      track: string;
      totalRequiredHours: number;
      ratioLimit: string;
      pacing: string;
      seatTimeTracking: string;
      minimumPassingScorePercent: number;
    };
    trackTwoSkillsLab: {
      track: string;
      totalRequiredHours: number;
      ratioLimit: string;
      prerequisites: string;
      competencyRequirement: string;
    };
    trackThreeClinical: {
      track: string;
      totalRequiredHours: number;
      ratioLimit: string;
      entryPrerequisite: string;
      directPatientCareRequired: boolean;
    };
  };
  rubricStandards: {
    wacStandard: string;
    evaluationModel: string;
    supportedTypes: string[];
    features: string[];
  };
  regulatoryProtocols: {
    examSecurity: {
      photoIdVerificationRequired: boolean;
      webcamSnapshotRequired: boolean;
      studentHonorCodeRequired: boolean;
      windowBlurTrackingThreshold: number;
      ipLoggingEnabled: boolean;
    };
    activeSeatTime: {
      heartbeatIntervalSeconds: number;
      idleTimeoutSeconds: number;
      enforceActiveEngagement: boolean;
    };
    remediationPolicy: {
      triggerScorePercent: number;
      humanFacultyFeedbackMandatory: boolean;
      studyPlanLogged: boolean;
    };
    studentSupport: {
      helpdeskAvailable: boolean;
      urgentSlaHours: number;
      generalSlaHours: number;
    };
  };
}
