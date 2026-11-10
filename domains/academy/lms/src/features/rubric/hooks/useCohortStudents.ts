import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { admissionsService } from "@/features/admissions/services/admissionsService";
import { academyService } from "@/services/academyService";

export interface CohortStudentEntry {
  userId: string;
  name: string;
  email?: string;
}

const formatCleanDisplayName = (
  rawName?: string | null,
  rawEmail?: string | null,
  fallbackId?: string
): string => {
  const trimmed = (rawName || "").trim();
  if (
    trimmed &&
    !trimmed.includes("@") &&
    !trimmed.startsWith("firebase-") &&
    !trimmed.startsWith("usr_") &&
    trimmed !== fallbackId
  ) {
    return trimmed;
  }

  const emailSource = (trimmed.includes("@") ? trimmed : rawEmail || "").trim();
  if (emailSource && emailSource.includes("@")) {
    const localPart = emailSource.split("@")[0].replace(/[._-]+/g, " ").trim();
    if (localPart) {
      return localPart
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }

  return trimmed || "Enrolled Student";
};

const extractList = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.enrollments)) return data.enrollments;
  if (Array.isArray(data?.applications)) return data.applications;
  return [];
};

/**
 * Aggregates enrolled students and their human-readable names for a cohort
 * across enrollments, admissions, and submissions endpoints.
 */
export const useCohortStudents = (
  cohortId?: string | number | null,
  enabled: boolean = true
) => {
  const numericCohortId = Number(cohortId);
  const isQueryEnabled = Boolean(enabled && numericCohortId && !isNaN(numericCohortId));

  const censusQuery = useQuery({
    queryKey: ["cohort-census", numericCohortId],
    queryFn: async () => {
      try {
        return await admissionsService.getCohortCensus(numericCohortId);
      } catch {
        return [];
      }
    },
    enabled: isQueryEnabled,
    staleTime: 30 * 1000,
  });

  const instructorEnrollmentsQuery = useQuery({
    queryKey: ["instructor-enrollments", numericCohortId],
    queryFn: async () => {
      try {
        const res = await api.get("/enrollments/instructor", {
          params: { cohortId: numericCohortId, pageSize: 100 },
        });
        return extractList(res.data);
      } catch {
        return [];
      }
    },
    enabled: isQueryEnabled,
    staleTime: 30 * 1000,
  });

  const admissionsQuery = useQuery({
    queryKey: ["admissions-cohort", numericCohortId],
    queryFn: async () => {
      try {
        return await admissionsService.getCohortApplications(numericCohortId);
      } catch {
        return [];
      }
    },
    enabled: isQueryEnabled,
    staleTime: 30 * 1000,
  });

  const submissionsQuery = useQuery({
    queryKey: ["instructor-all-submissions", { page: 1, pageSize: 100 }],
    queryFn: async () => {
      try {
        return await academyService.instructor.getAllSubmissions({
          page: 1,
          pageSize: 100,
        });
      } catch {
        return { items: [] };
      }
    },
    enabled: isQueryEnabled,
    staleTime: 60 * 1000,
  });

  const { studentList, studentNameMap } = useMemo(() => {
    const map = new Map<string, CohortStudentEntry>();

    const register = (
      rawId: any,
      firstLastOrFull?: string | null,
      email?: string | null
    ) => {
      if (!rawId) return;
      const uid = String(rawId).trim();
      if (!uid || uid === "undefined" || uid === "null") return;

      const existing = map.get(uid);
      const resolvedName = formatCleanDisplayName(firstLastOrFull, email, uid);

      // Prefer a real name over a generic fallback
      const bestName =
        existing?.name && existing.name !== "Enrolled Student"
          ? resolvedName !== "Enrolled Student" &&
            resolvedName.length > existing.name.length &&
            firstLastOrFull &&
            !firstLastOrFull.includes("@")
            ? resolvedName
            : existing.name
          : resolvedName;

      map.set(uid, {
        userId: uid,
        name: bestName,
        email: (email || existing?.email || "").trim() || undefined,
      });
    };

    // 1. Census / Cohort enrollments (/enrollments/cohort/:id)
    extractList(censusQuery.data).forEach((c: any) => {
      const uid = c.userId || c.user?.firebaseId || c.profile?.userId;
      const fullName =
        `${c.user?.firstname || ""} ${c.user?.lastname || ""}`.trim() ||
        `${c.profile?.user?.firstname || ""} ${c.profile?.user?.lastname || ""}`.trim() ||
        c.name;
      const email = c.user?.email || c.profile?.user?.email || "";
      register(uid, fullName, email);
    });

    // 2. Instructor enrollments (/enrollments/instructor)
    extractList(instructorEnrollmentsQuery.data).forEach((e: any) => {
      const uid = e.userId || e.user?.firebaseId || e.profile?.userId;
      const fullName =
        `${e.user?.firstname || ""} ${e.user?.lastname || ""}`.trim() ||
        `${e.profile?.user?.firstname || ""} ${e.profile?.user?.lastname || ""}`.trim() ||
        e.name;
      const email = e.user?.email || e.profile?.user?.email || "";
      register(uid, fullName, email);
    });

    // 3. Admissions applications (/admissions/cohort/:id)
    extractList(admissionsQuery.data).forEach((app: any) => {
      const uid = app.userId || app.studentUserId || app.studentId;
      const fullName =
        app.candidateName ||
        `${app.user?.firstname || ""} ${app.user?.lastname || ""}`.trim() ||
        `${app.profile?.firstname || app.profile?.user?.firstname || ""} ${
          app.profile?.lastname || app.profile?.user?.lastname || ""
        }`.trim() ||
        app.student?.name;
      const email =
        app.candidateEmail ||
        app.user?.email ||
        app.profile?.email ||
        app.profile?.user?.email ||
        "";
      register(uid, fullName, email);
    });

    // 4. Submissions name enrichment (for students who submitted work)
    const subItems = (submissionsQuery.data as any)?.items || [];
    subItems.forEach((sub: any) => {
      const uid = sub.userId || sub.user?.firebaseId;
      if (!uid || !sub.user) return;
      const fullName = `${sub.user.firstname || ""} ${sub.user.lastname || ""}`.trim();
      if (fullName || sub.user.email) {
        // Only enrich existing students or add if no admissions/enrollments existed yet
        if (map.has(String(uid))) {
          register(uid, fullName, sub.user.email);
        }
      }
    });

    const list = Array.from(map.values());
    const nameMap = new Map<string, string>();
    list.forEach((s) => nameMap.set(s.userId, s.name));

    // Also store any submission user names into nameMap as pure lookup fallback for gradebook
    subItems.forEach((sub: any) => {
      const uid = sub.userId ? String(sub.userId) : "";
      if (uid && !nameMap.has(uid) && sub.user) {
        const clean = formatCleanDisplayName(
          `${sub.user.firstname || ""} ${sub.user.lastname || ""}`.trim(),
          sub.user.email,
          uid
        );
        if (clean) nameMap.set(uid, clean);
      }
    });

    return { studentList: list, studentNameMap: nameMap };
  }, [
    censusQuery.data,
    instructorEnrollmentsQuery.data,
    admissionsQuery.data,
    submissionsQuery.data,
  ]);

  return {
    studentList,
    studentNameMap,
    isLoading:
      censusQuery.isLoading ||
      instructorEnrollmentsQuery.isLoading ||
      admissionsQuery.isLoading,
  };
};

