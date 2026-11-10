import { useQuery } from "@tanstack/react-query";
import { wabonComplianceService } from "../services/wabonComplianceService";
import api from "@/lib/api";
import type { SeatTimeSummary, CohortSeatTimeReport, StudentSeatTimeRecord } from "../types";

export const useInstructorCohortsList = (isStaffMode: boolean = true) => {
  return useQuery({
    queryKey: ["instructor-cohorts-list", isStaffMode ? "staff" : "student"],
    queryFn: async () => {
      if (!isStaffMode) {
        try {
          const [enrollRes, cohortsRes] = await Promise.allSettled([
            api.get("/enrollment/me"),
            api.get("/cohorts"),
          ]);
          const allCohorts =
            cohortsRes.status === "fulfilled"
              ? cohortsRes.value.data?.items ||
                (Array.isArray(cohortsRes.value.data) ? cohortsRes.value.data : [])
              : [];
          const enrollments =
            enrollRes.status === "fulfilled"
              ? enrollRes.value.data?.items ||
                (Array.isArray(enrollRes.value.data) ? enrollRes.value.data : [])
              : [];

          const seenKeys = new Set<string>();
          const merged: any[] = [];

          enrollments.forEach((e: any) => {
            const cid = Number(e.cohortId || e.cohort?.id);
            const courseId = Number(e.courseId || e.course?.id);
            const matched = cid
              ? allCohorts.find((c: any) => Number(c.id) === cid)
              : courseId
              ? allCohorts.find((c: any) => Number(c.courseId) === courseId)
              : undefined;

            if (matched && !seenKeys.has(`cohort:${matched.id}`)) {
              seenKeys.add(`cohort:${matched.id}`);
              merged.push(matched);
            } else if (cid && !seenKeys.has(`cohort:${cid}`)) {
              seenKeys.add(`cohort:${cid}`);
              merged.push(
                e.cohort || {
                  id: cid,
                  courseId: courseId || undefined,
                  name: e.course?.title ? `Cohort #${cid} — ${e.course.title}` : `Cohort #${cid}`,
                }
              );
            } else if (courseId && !seenKeys.has(`course:${courseId}`)) {
              seenKeys.add(`course:${courseId}`);
              merged.push({
                id: `course-${courseId}`,
                courseId,
                name: e.course?.title || `Course #${courseId}`,
              });
            }
          });

          if (merged.length > 0) return merged;
          return allCohorts;
        } catch {
          return [];
        }
      }

      try {
        const res = await wabonComplianceService.getInstructorCohorts();
        const list = res?.items || (Array.isArray(res) ? res : []);
        if (list.length > 0) return list;
        const allRes = await api.get("/cohorts");
        return allRes.data?.items || (Array.isArray(allRes.data) ? allRes.data : []);
      } catch (err) {
        console.warn("[useInstructorCohortsList] Error fetching instructor cohorts, trying /cohorts:", err);
        try {
          const allRes = await api.get("/cohorts");
          return allRes.data?.items || (Array.isArray(allRes.data) ? allRes.data : []);
        } catch {
          return [];
        }
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
          totalRequiredSeconds: 0,
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
          const requiredSecs = data.totalRequiredSeconds ?? (data as any).requiredSeconds ?? 0;
          const computedPct =
            data.progressPercentage !== undefined
              ? data.progressPercentage
              : requiredSecs > 0
              ? Math.min(100, Math.round((totalSecs / requiredSecs) * 100))
              : 0;
          return {
            ...data,
            totalActiveTimeSeconds: totalSecs,
            totalActiveTimeMinutes: totalMins,
            totalActiveSeconds: totalSecs,
            totalRequiredSeconds: requiredSecs,
            progressPercentage: computedPct,
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
        totalRequiredSeconds: 0,
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
        const requiredSecs = s.requiredSeconds ?? s.totalRequiredSeconds ?? rawReport?.requiredSeconds ?? 0;
        const isCompliant =
          s.isCompliant !== undefined
            ? Boolean(s.isCompliant)
            : requiredSecs > 0
            ? totalSecs >= requiredSecs
            : false;
        const progressPct =
          s.progressPct !== undefined
            ? s.progressPct
            : requiredSecs > 0
            ? Math.min(100, Math.round((totalSecs / requiredSecs) * 100))
            : 0;

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
          requiredSeconds: requiredSecs,
          isCompliant,
          progressPct,
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
          const defaultRequiredSecs = rawReport?.requiredSeconds ?? 0;
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
            requiredSeconds: defaultRequiredSecs,
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
