import { useQuery } from "@tanstack/react-query";
import { wabonComplianceService } from "../services/wabonComplianceService";
import type { SeatTimeSummary, CohortSeatTimeReport, StudentSeatTimeRecord } from "../types";

export const DEFAULT_REQUIRED_THEORY_SECONDS = 50 * 3600; // 50 hours per WAC 246-841A-440

export const useInstructorCohortsList = () => {
  return useQuery({
    queryKey: ["instructor-cohorts-list"],
    queryFn: async () => {
      try {
        const res = await wabonComplianceService.getInstructorCohorts();
        return res?.items || (Array.isArray(res) ? res : []);
      } catch (err) {
        console.warn("[useInstructorCohortsList] Error fetching instructor cohorts:", err);
        return [];
      }
    },
    staleTime: 60 * 1000,
  });
};

export const useSeatTimeSummary = (courseId?: string | number) => {
  return useQuery<SeatTimeSummary>({
    queryKey: ["seatTimeSummary", courseId],
    queryFn: async () => {
      if (!courseId) {
        return {
          courseId: 0,
          totalActiveTimeSeconds: 0,
          totalActiveTimeMinutes: 0,
          totalActiveSeconds: 0,
          totalRequiredSeconds: DEFAULT_REQUIRED_THEORY_SECONDS,
          progressPercentage: 0,
          lessons: [],
          lessonsBreakdown: [],
        };
      }
      try {
        const data = await wabonComplianceService.getSeatTimeSummary(courseId);
        if (data) {
          const totalSecs = data.totalActiveTimeSeconds ?? data.totalActiveSeconds ?? 0;
          const totalMins = data.totalActiveTimeMinutes ?? Math.round(totalSecs / 60);
          return {
            ...data,
            totalActiveTimeSeconds: totalSecs,
            totalActiveTimeMinutes: totalMins,
            totalActiveSeconds: totalSecs,
            totalRequiredSeconds: DEFAULT_REQUIRED_THEORY_SECONDS,
            progressPercentage: Math.min(
              100,
              Math.round((totalSecs / DEFAULT_REQUIRED_THEORY_SECONDS) * 100)
            ),
            lessons: data.lessons || [],
          };
        }
      } catch (err) {
        console.warn("[useSeatTimeSummary] Fetch failed:", err);
      }

      return {
        courseId,
        totalActiveTimeSeconds: 0,
        totalActiveTimeMinutes: 0,
        totalActiveSeconds: 0,
        totalRequiredSeconds: DEFAULT_REQUIRED_THEORY_SECONDS,
        progressPercentage: 0,
        lessons: [],
        lessonsBreakdown: [],
      };
    },
    enabled: Boolean(courseId),
    staleTime: 30 * 1000,
  });
};

export const useStudentCourseSeatTime = (
  courseId?: string | number,
  userId?: string
) => {
  return useQuery<SeatTimeSummary>({
    queryKey: ["studentCourseSeatTime", courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId) {
        return {
          courseId: courseId || 0,
          userId: userId || "",
          totalActiveTimeSeconds: 0,
          totalActiveTimeMinutes: 0,
          lessons: [],
        };
      }
      try {
        const res = await wabonComplianceService.getStudentCourseSeatTime(courseId, userId);
        if (res) {
          return {
            ...res,
            totalActiveTimeSeconds: res.totalActiveTimeSeconds ?? 0,
            totalActiveTimeMinutes: res.totalActiveTimeMinutes ?? Math.round((res.totalActiveTimeSeconds || 0) / 60),
            lessons: res.lessons || [],
          };
        }
      } catch (err) {
        console.warn("[useStudentCourseSeatTime] Failed to fetch student breakdown:", err);
      }
      return {
        courseId,
        userId,
        totalActiveTimeSeconds: 0,
        totalActiveTimeMinutes: 0,
        lessons: [],
      };
    },
    enabled: Boolean(courseId && userId),
    staleTime: 30 * 1000,
  });
};

export const useCohortSeatTimeReport = (
  cohortId?: string | number,
  courseId?: string | number
) => {
  return useQuery<CohortSeatTimeReport>({
    queryKey: ["cohortSeatTimeReport", cohortId, courseId],
    queryFn: async () => {
      let activeCohortId = cohortId ? Number(cohortId) : undefined;
      let activeCourseId = courseId ? Number(courseId) : undefined;
      let activeCohortName = "";
      let activeCourseTitle = "";

      // Auto-discover instructor's active cohort if not passed
      if (!activeCohortId) {
        try {
          const cohortsRes = await wabonComplianceService.getInstructorCohorts();
          const cohortList = cohortsRes?.items || (Array.isArray(cohortsRes) ? cohortsRes : []);
          if (cohortList.length > 0) {
            activeCohortId = cohortList[0].id;
            activeCohortName = cohortList[0].name || "";
            activeCourseId = activeCourseId || cohortList[0].courseId;
            activeCourseTitle = cohortList[0].course?.title || "";
          }
        } catch (e) {
          console.warn("[useCohortSeatTimeReport] Failed to fetch instructor cohorts:", e);
        }
      }

      if (!activeCohortId) {
        return {
          cohortId: 0,
          cohortName: "",
          courseId: activeCourseId || 0,
          courseTitle: activeCourseTitle || "",
          totalStudents: 0,
          averageActiveHours: 0,
          totalActiveHours: 0,
          compliantStudentsCount: 0,
          students: [],
        };
      }

      // 1. Fetch real seat-time report for this cohort from backend
      let rawReport: any = null;
      try {
        rawReport = await wabonComplianceService.getCohortSeatTimeReport(activeCohortId);
      } catch (err) {
        console.warn("[useCohortSeatTimeReport] Failed to fetch cohort report:", err);
      }

      // 2. Fetch instructor enrollments to enrich with student name, email & profile
      let enrollments: any[] = [];
      try {
        const enrollmentsRes = await wabonComplianceService.getInstructorEnrollments(activeCohortId);
        enrollments = enrollmentsRes?.items || (Array.isArray(enrollmentsRes) ? enrollmentsRes : []);
      } catch (err) {
        console.warn("[useCohortSeatTimeReport] Failed to fetch enrollments:", err);
      }

      const rawStudents: any[] = Array.isArray(rawReport?.students)
        ? rawReport.students
        : Array.isArray(rawReport?.records)
        ? rawReport.records
        : [];

      const studentMap = new Map<string, any>();
      for (const s of rawStudents) {
        if (s.userId) studentMap.set(s.userId, s);
      }

      const mergedList: StudentSeatTimeRecord[] = [];

      for (const s of rawStudents) {
        const enrollment = enrollments.find(
          (e) => e.userId === s.userId || e.user?.firebaseId === s.userId
        );
        const name = enrollment?.user
          ? `${enrollment.user.firstname || ""} ${enrollment.user.lastname || ""}`.trim() ||
            enrollment.user.email ||
            s.userId
          : s.studentName || s.userId;
        const email = enrollment?.user?.email || s.studentEmail || "";
        const totalSecs = s.totalActiveTimeSeconds ?? s.activeSeconds ?? 0;
        const totalMins = s.totalActiveTimeMinutes ?? Math.round(totalSecs / 60);
        const activeHrs = Number((totalSecs / 3600).toFixed(1));

        mergedList.push({
          id: s.userId,
          userId: s.userId,
          studentId: enrollment?.user?.id || s.studentId,
          studentName: name,
          studentEmail: email,
          avatarUrl: enrollment?.user?.profilePicture,
          courseId: activeCourseId || s.courseId || rawReport?.courseId,
          courseTitle: activeCourseTitle || enrollment?.course?.title,
          cohortId: activeCohortId,
          cohortName: activeCohortName || enrollment?.cohort?.name,
          totalActiveTimeSeconds: totalSecs,
          totalActiveTimeMinutes: totalMins,
          activeHours: activeHrs,
          requiredSeconds: DEFAULT_REQUIRED_THEORY_SECONDS,
          isCompliant: totalSecs >= DEFAULT_REQUIRED_THEORY_SECONDS,
          progressPct: Math.min(100, Math.round((totalSecs / DEFAULT_REQUIRED_THEORY_SECONDS) * 100)),
          enrolledAt: enrollment?.enrolledAt,
          enrollmentStatus: enrollment?.status || "ACTIVE",
        });
      }

      // Add any enrolled students that may not have a progress row in the DB yet
      for (const e of enrollments) {
        if (!studentMap.has(e.userId)) {
          const name = e.user
            ? `${e.user.firstname || ""} ${e.user.lastname || ""}`.trim() || e.user.email || e.userId
            : e.userId;
          mergedList.push({
            id: e.userId,
            userId: e.userId,
            studentId: e.user?.id,
            studentName: name,
            studentEmail: e.user?.email || "",
            avatarUrl: e.user?.profilePicture,
            courseId: activeCourseId || e.courseId,
            courseTitle: activeCourseTitle || e.course?.title,
            cohortId: activeCohortId,
            cohortName: activeCohortName || e.cohort?.name,
            totalActiveTimeSeconds: 0,
            totalActiveTimeMinutes: 0,
            activeHours: 0,
            requiredSeconds: DEFAULT_REQUIRED_THEORY_SECONDS,
            isCompliant: false,
            progressPct: 0,
            enrolledAt: e.enrolledAt,
            enrollmentStatus: e.status || "ACTIVE",
          });
        }
      }

      const totalStudents = mergedList.length;
      const sumSeconds = mergedList.reduce((acc, s) => acc + s.totalActiveTimeSeconds, 0);
      const avgHours = totalStudents > 0 ? Number((sumSeconds / totalStudents / 3600).toFixed(1)) : 0;
      const totalHours = Number((sumSeconds / 3600).toFixed(1));
      const compliantCount = mergedList.filter((s) => s.isCompliant).length;

      return {
        cohortId: activeCohortId,
        cohortName: activeCohortName,
        courseId: activeCourseId,
        courseTitle: activeCourseTitle,
        totalStudents,
        averageActiveHours: avgHours,
        totalActiveHours: totalHours,
        compliantStudentsCount: compliantCount,
        students: mergedList,
      };
    },
    staleTime: 30 * 1000,
  });
};
