import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useAdminCourseStructure,
  useAdminInstructors,
  useAssignCourseInstructor,
  useAdminDeleteModule,
  useAdminDeleteLesson,
} from "@/hooks/useAcademy";
import { useAllUsers } from "@/features/auth/hooks/useAuth";
import type { Course } from "@/types/academy";
import {
  BookOpen,
  UserPlus,
  Trash2,
  Loader2,
  Layers,
  FileText,
} from "lucide-react";

interface AdminCourseManageModalProps {
  course: Course | null;
  userMap: Record<string, string>;
  onClose: () => void;
}

const extractList = (raw: any, keys: string[] = []) => {
  if (Array.isArray(raw)) return raw;
  for (const k of keys) {
    if (Array.isArray(raw?.[k])) return raw[k];
  }
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

export const AdminCourseManageModal: React.FC<AdminCourseManageModalProps> = ({
  course,
  userMap,
  onClose,
}) => {
  const { data: structure, isLoading: structureLoading } =
    useAdminCourseStructure(course?.id);
  const { data: instructorsRaw } = useAdminInstructors();
  const { data: usersRaw } = useAllUsers();

  const assignMutation = useAssignCourseInstructor();
  const deleteModuleMutation = useAdminDeleteModule();
  const deleteLessonMutation = useAdminDeleteLesson();

  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "module" | "lesson";
    id: string | number;
    title: string;
  } | null>(null);

  const instructorOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();

    const instructors = extractList(instructorsRaw, ["instructors"]);
    instructors.forEach((inst: any) => {
      const uid = String(inst.userId || inst.firebaseId || "");
      if (!uid) return;
      const name =
        inst.user?.firstname || inst.user?.lastname
          ? `${inst.user?.firstname || ""} ${inst.user?.lastname || ""}`.trim()
          : userMap[uid] || uid;
      const email = inst.user?.email ? ` (${inst.user.email})` : "";
      map.set(uid, {
        id: uid,
        label: `${name}${email}${inst.rnLicenseNumber ? ` • ${inst.rnLicenseNumber}` : ""}`,
      });
    });

    const users = extractList(usersRaw, ["users"]);
    users.forEach((u: any) => {
      const uid = String(u.firebaseId || u.userId || "");
      const role = String(
        u.academyUser?.role || u.academyRole || u.globalRole || "",
      ).toUpperCase();
      if (
        uid &&
        !map.has(uid) &&
        (role === "INSTRUCTOR" || role === "COURSE_MANAGER")
      ) {
        const name =
          `${u.firstname || ""} ${u.lastname || ""}`.trim() || u.email || uid;
        map.set(uid, {
          id: uid,
          label: `${name}${u.email ? ` (${u.email})` : ""}`,
        });
      }
    });

    return Array.from(map.values());
  }, [instructorsRaw, usersRaw, userMap]);

  if (!course) return null;

  const modules = (structure as any)?.modules || (course as any)?.modules || [];

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructorId) return;
    await assignMutation.mutateAsync({
      courseId: course.id,
      instructorId: selectedInstructorId,
    });
  };

  return (
    <>
      <Dialog open={Boolean(course)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl bg-white border-[#E1EAF2] max-h-[88vh] flex flex-col p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E1EAF2] bg-slate-50/70">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0095DA]" />
                Manage Course: {course.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Assign instructor or moderate modules and lessons from backend curriculum structure.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {/* Assign Instructor (Postman 4.3) */}
            <form
              onSubmit={handleAssign}
              className="p-4 rounded-xl border border-[#E1EAF2] bg-[#F4F8FB]/60 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#0095DA]" />
                  Assign Instructor to Course
                </span>
                {course.instructor && (
                  <span className="text-xs text-slate-500">
                    Current:{" "}
                    <strong className="text-slate-800">
                      {course.instructor.firstname} {course.instructor.lastname}
                    </strong>
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedInstructorId}
                  onChange={(e) => setSelectedInstructorId(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg border border-[#E1EAF2] bg-white text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0095DA]"
                >
                  <option value="">Select instructor...</option>
                  {instructorOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!selectedInstructorId || assignMutation.isPending}
                  className="h-9 px-4 bg-[#0095DA] hover:bg-[#007BB8] text-white text-xs font-bold rounded-lg"
                >
                  {assignMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Assign Instructor
                </Button>
              </div>
            </form>

            {/* Modules & Lessons Structure (Postman 4.5 & 4.6) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-600" />
                  Modules &amp; Lessons ({modules.length})
                </span>
              </div>

              {structureLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading course structure...
                </div>
              ) : modules.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-[#E1EAF2] text-xs text-slate-500">
                  No modules found for this course.
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((mod: any) => {
                    const lessons = mod.lessons || [];
                    return (
                      <div
                        key={mod.id}
                        className="rounded-xl border border-[#E1EAF2] bg-white overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-slate-50 border-b border-[#E1EAF2] flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              Module #{mod.id}: {mod.title}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-2">
                              ({lessons.length} lessons)
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setConfirmDelete({
                                type: "module",
                                id: mod.id,
                                title: mod.title,
                              })
                            }
                            className="h-7 px-2.5 text-[11px] font-bold text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete Module
                          </Button>
                        </div>

                        {lessons.length > 0 && (
                          <div className="divide-y divide-slate-100">
                            {lessons.map((lesson: any) => (
                              <div
                                key={lesson.id}
                                className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-50/50"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="font-medium text-slate-800 truncate">
                                    {lesson.title}
                                  </span>
                                  {lesson.type && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase font-semibold">
                                      {lesson.type}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setConfirmDelete({
                                      type: "lesson",
                                      id: lesson.id,
                                      title: lesson.title,
                                    })
                                  }
                                  className="h-7 px-2 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-[#E1EAF2] bg-slate-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-semibold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Module/Lesson Confirmation */}
      <Dialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-md bg-white border-[#E1EAF2]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Delete {confirmDelete?.type === "module" ? "Module" : "Lesson"}?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to permanently delete "{confirmDelete?.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={
                deleteModuleMutation.isPending || deleteLessonMutation.isPending
              }
              onClick={async () => {
                if (!confirmDelete) return;
                if (confirmDelete.type === "module") {
                  await deleteModuleMutation.mutateAsync(confirmDelete.id);
                } else {
                  await deleteLessonMutation.mutateAsync(confirmDelete.id);
                }
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

