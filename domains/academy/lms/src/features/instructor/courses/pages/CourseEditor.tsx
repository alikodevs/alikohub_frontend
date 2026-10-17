import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Eye,
  Layout,
  Book,
  Settings as SettingsIcon,
  BarChart3,
  Calendar,
  Send,
  PlusCircle,
  ChevronRight,
  MonitorPlay,
  FileText,
  Plus,
  PlusSquare,
  Users,
  Menu,
  X,
  GripVertical,
  PlayCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { BasicInfoTab } from "@/features/instructor/courses/components/BasicInfoTab";
import { CurriculumTab } from "@/features/instructor/courses/components/CurriculumTab";
import { SettingsTab } from "@/features/instructor/courses/components/SettingsTab";
import { AnalyticsTab } from "@/features/instructor/courses/components/AnalyticsTab";
import { ScheduleTab } from "@/features/instructor/courses/components/ScheduleTab";
import { CohortsTab } from "@/features/instructor/courses/components/CohortsTab";
import { ModuleModal } from "@/features/instructor/courses/components/ModuleModal";
import { LessonModal } from "@/features/instructor/courses/components/LessonModal";
import { ContentModal } from "@/features/instructor/courses/components/ContentModal";
import { ExerciseModal } from "@/features/instructor/courses/components/ExerciseModal";
import { PreviewModal } from "@/features/instructor/courses/components/PreviewModal";
import {
  useCourseDetails,
  useCreateCourse,
  useUpdateCourse,
  useCreateModule,
  useDeleteModule,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useSubmitCourseForApproval,
  useCreateContent,
  useDeleteContent,
  useCreateExercisesBulk,
  useUpdateExercise,
  useDeleteExercise,
} from "@/hooks/useAcademy";
import { academyService } from "@/services/academyService";
import { DeleteConfirmationModal } from "@/features/instructor/components/DeleteConfirmationModal";

const InstructorCourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = id && id !== "new";
  const { data: course, isLoading } = useCourseDetails(isEdit ? id : "");

  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();
  const createModuleMutation = useCreateModule();
  const deleteModuleMutation = useDeleteModule();
  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();
  const deleteLessonMutation = useDeleteLesson();
  const submitCourseMutation = useSubmitCourseForApproval();
  const createContentMutation = useCreateContent();
  const deleteContentMutation = useDeleteContent();
  const createExerciseMutation = useCreateExercisesBulk();
  const updateExerciseMutation = useUpdateExercise();
  const deleteExerciseMutation = useDeleteExercise();

  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    category: "",
    price: "",
    priceInUsd: "",
    thumbnail: null as File | null,
  });

  // Modal states
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [initialExerciseTitle, setInitialExerciseTitle] = useState<string>("");
  const [previewContent, setPreviewContent] = useState<any>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Curriculum Selection State (Lifted from CurriculumTab)
  const [selectedCurriculumItem, setSelectedCurriculumItem] = useState<{
    type: "CONTENT" | "EXERCISE" | "OVERVIEW" | "LESSON" | "QUIZ_SESSION";
    data: any;
    moduleId?: string;
    lessonId?: string;
  } | null>(null);

  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});

  const reorderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState("VIDEO");
  const [editingExercise, setEditingExercise] = useState<any>(null);

  // Delete states
  const [deleteConfig, setDeleteConfig] = useState<{
    type: "module" | "lesson" | "content" | "exercise";
    id: string;
    title: string;
  } | null>(null);

  const showCurriculum = course && course.status !== "REJECTED";

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        shortDescription: course.shortDescription || "",
        category: course.category || "",
        price: course.price ? course.price.toString() : "",
        priceInUsd: course.priceInUsd ? course.priceInUsd.toString() : "",
        thumbnail: null,
      });

      // Synchronize selected curriculum item if course data is updated
      if (selectedCurriculumItem) {
        if (selectedCurriculumItem.type === "LESSON") {
          const freshLesson = course.modules
            ?.flatMap((m: any) => m.lessons || [])
            ?.find((l: any) => l.id === selectedCurriculumItem.lessonId);

          if (
            freshLesson &&
            JSON.stringify(freshLesson) !==
              JSON.stringify(selectedCurriculumItem.data)
          ) {
            setSelectedCurriculumItem((prev) =>
              prev ? { ...prev, data: freshLesson } : null,
            );
          } else if (!freshLesson) {
            setSelectedCurriculumItem(null);
          }
        } else if (selectedCurriculumItem.type === "QUIZ_SESSION") {
          const freshLesson = course.modules
            ?.flatMap((m: any) => m.lessons || [])
            ?.find((l: any) => l.id === selectedCurriculumItem.lessonId);

          if (
            freshLesson &&
            freshLesson.exercises &&
            JSON.stringify(freshLesson.exercises) !==
              JSON.stringify(selectedCurriculumItem.data)
          ) {
            setSelectedCurriculumItem((prev) =>
              prev ? { ...prev, data: freshLesson.exercises } : null,
            );
          } else if (!freshLesson) {
            setSelectedCurriculumItem(null);
          }
        }
      }
    }
  }, [course]);

  const handleSaveBasicInfo = async () => {
    const data = new FormData();
    data.append("title", formData.title);
    data.append("shortDescription", formData.shortDescription);
    data.append("category", formData.category);
    data.append("price", formData.price ? formData.price.toString() : "0");
    data.append(
      "priceInUsd",
      formData.priceInUsd ? formData.priceInUsd.toString() : "0",
    );
    data.append("status", "DRAFT");
    if (formData.thumbnail) {
      data.append("thumbnail", formData.thumbnail);
    }

    if (isEdit) {
      updateCourseMutation.mutate(
        { courseId: id!, formData: data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["course", id] });
            queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
          },
        },
      );
    } else {
      createCourseMutation.mutate(data, {
        onSuccess: (newCourse) => {
          queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
          navigate(`/instructor/courses/${newCourse.id}`);
        },
      });
    }
  };

  const handleAddModule = () => {
    if (!isEdit) {
      toast.error("Please save course basic info first");
      return;
    }
    setModuleTitle("");
    setModuleDescription("");
    setIsModuleModalOpen(true);
  };

  const handleCreateModule = () => {
    if (!moduleTitle.trim()) {
      toast.error("Module title is required");
      return;
    }
    createModuleMutation.mutate(
      {
        courseId: id!,
        title: moduleTitle,
        description: moduleDescription || undefined,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["course", id] });
          setIsModuleModalOpen(false);
          setModuleTitle("");
          setModuleDescription("");
        },
      },
    );
  };

  const handleAddLesson = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setLessonTitle("");
    setLessonType("VIDEO");
    setIsLessonModalOpen(true);
  };

  const handleCreateLesson = () => {
    if (!lessonTitle.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    createLessonMutation.mutate(
      {
        moduleId: selectedModuleId,
        title: lessonTitle,
        type: lessonType,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["course", id] });
          setIsLessonModalOpen(false);
          setLessonTitle("");
          setLessonType("VIDEO");
        },
      },
    );
  };

  const handleAddContent = (moduleId: string, lessonId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedLessonId(lessonId);
    setIsContentModalOpen(true);
  };

  const handleCreateContent = (data: any) => {
    createContentMutation.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["course", id] });
        setIsContentModalOpen(false);
      },
    });
  };

  const handleAddExercise = (
    moduleId: string,
    lessonId: string,
    initialTitle?: string,
  ) => {
    setSelectedModuleId(moduleId);
    setSelectedLessonId(lessonId);
    setInitialExerciseTitle(initialTitle || "");
    setEditingExercise(null);
    setIsExerciseModalOpen(true);
  };

  const handleCreateExercise = (data: { dtos: any[] }) => {
    createExerciseMutation.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["course", id] });
        setIsExerciseModalOpen(false);
      },
    });
  };

  const handleEditExercise = (exercise: any) => {
    setEditingExercise(exercise);
    setIsExerciseModalOpen(true);
  };

  const handleUpdateExercise = (exerciseId: string, data: any) => {
    updateExerciseMutation.mutate(
      { exerciseId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["course", id] });
          setIsExerciseModalOpen(false);
          setEditingExercise(null);
        },
      },
    );
  };

  const [isSyncingReorder, setIsSyncingReorder] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSyncingReorder) {
        e.preventDefault();
        e.returnValue = "You have unsaved curriculum reordering changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSyncingReorder]);

  const handleReorderLessons = (moduleId: string, newLessons: any[]) => {
    const previousCourse = queryClient.getQueryData(["course", id]);
    setIsSyncingReorder(true);

    queryClient.setQueryData(["course", id], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        modules: old.modules.map((m: any) => {
          if (m.id.toString() === moduleId) {
            return { ...m, lessons: newLessons };
          }
          return m;
        }),
      };
    });

    if (reorderTimeoutRef.current) {
      clearTimeout(reorderTimeoutRef.current);
    }

    reorderTimeoutRef.current = setTimeout(async () => {
      try {
        const updates = newLessons.map((lesson, index) => ({
          lessonId: lesson.id,
          data: { order: index + 1 },
        }));

        await Promise.all(
          updates.map((update) =>
            academyService.instructor.updateLesson(
              update.lessonId,
              update.data,
            ),
          ),
        );

        queryClient.invalidateQueries({ queryKey: ["course", id] });
      } catch (error) {
        console.error("Failed to update lesson order:", error);
        toast.error("Failed to update lesson order");
        if (previousCourse) {
          queryClient.setQueryData(["course", id], previousCourse);
        }
      } finally {
        setIsSyncingReorder(false);
      }
    }, 1000);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfig) return;

    const { type, id: deleteId } = deleteConfig;

    if (type === "module") {
      deleteModuleMutation.mutate(
        { moduleId: deleteId, courseId: id! },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["course", id] });
            setDeleteConfig(null);
          },
        },
      );
    } else if (type === "lesson") {
      deleteLessonMutation.mutate(
        { lessonId: deleteId, courseId: id! },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["course", id] });
            setDeleteConfig(null);
          },
        },
      );
    } else if (type === "content") {
      deleteContentMutation.mutate(deleteId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["course", id] });
          setDeleteConfig(null);
        },
      });
    } else if (type === "exercise") {
      deleteExerciseMutation.mutate(deleteId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["course", id] });
          setDeleteConfig(null);
        },
      });
    }
  };

  const handleView = (content: any) => {
    setSelectedCurriculumItem({
      type: "CONTENT",
      data: content,
      moduleId: selectedCurriculumItem?.moduleId,
      lessonId: selectedCurriculumItem?.lessonId,
    });
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleLessonSelect = (lesson: any, moduleId: string) => {
    setActiveTab("curriculum");
    setSelectedCurriculumItem({
      type: "LESSON",
      data: lesson,
      moduleId,
      lessonId: lesson.id,
    });
  };

  const handleSubmitForApproval = () => {
    if (!id) return;
    submitCourseMutation.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["course", id] });
      },
    });
  };

  const renderTabContent = () => {
    if (activeTab === "basic") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 font-heading tracking-tight">
                Course basics
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Set up your course title, description, and pricing.
              </p>
            </div>
          </div>
          <BasicInfoTab
            formData={formData}
            course={course}
            onFormDataChange={setFormData}
          />
        </div>
      );
    }

    if (activeTab === "curriculum" && showCurriculum) {
      return (
        <CurriculumTab
          course={course}
          selectedItem={selectedCurriculumItem}
          onSetSelectedItem={setSelectedCurriculumItem}
          onAddModule={handleAddModule}
          onAddLesson={handleAddLesson}
          onUpdateLesson={(lid, data) =>
            updateLessonMutation.mutate(
              { lessonId: lid, data, courseId: id! },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: ["course", id] });
                },
              },
            )
          }
          onAddContent={handleAddContent}
          onAddExercise={handleAddExercise}
          onEditExercise={handleEditExercise}
          onDeleteModule={(mid) =>
            setDeleteConfig({ type: "module", id: mid, title: "Module" })
          }
          onDeleteLesson={(lid) =>
            setDeleteConfig({ type: "lesson", id: lid, title: "Lesson" })
          }
          onDeleteContent={(cid) =>
            setDeleteConfig({ type: "content", id: cid, title: "Content" })
          }
          onDeleteExercise={(eid) =>
            setDeleteConfig({ type: "exercise", id: eid, title: "Exercise" })
          }
          onView={handleView}
          isRejected={course?.status === "REJECTED"}
        />
      );
    }

    if (activeTab === "settings") {
      return (
        <SettingsTab
          course={course}
          onSubmitForApproval={handleSubmitForApproval}
          isSubmitting={submitCourseMutation.isPending}
        />
      );
    }

    if (activeTab === "analytics" && isEdit) {
      return <AnalyticsTab courseId={id!} />;
    }

    if (activeTab === "schedule" && isEdit) {
      return <ScheduleTab courseId={id!} />;
    }

    if (activeTab === "cohorts" && isEdit) {
      return <CohortsTab courseId={id!} />;
    }

    return null;
  };

  if (isLoading && isEdit) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#7c6ef0] animate-spin mx-auto" />
          <p className="text-slate-600 font-medium text-sm">
            Loading course details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col h-screen overflow-hidden text-slate-200">
      <header className="h-auto min-h-[56px] md:h-[68px] flex items-center justify-between px-3 md:px-6 border-b border-slate-200 z-50 bg-white text-slate-900 shrink-0 gap-2 flex-wrap py-2 md:py-0">
        <div className="flex items-center gap-2 md:gap-5 min-w-0 flex-1">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden shrink-0"
            aria-label="Toggle Sidebar"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => navigate("/instructor/courses")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
          <div className="flex flex-col min-w-0">
            <h1 className="text-[13px] md:text-[15px] font-semibold text-slate-900 leading-tight tracking-tight truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs lg:max-w-md">
              {isEdit ? course?.title : "New Course"}
            </h1>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide hidden sm:block">
              Course editor
            </span>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <nav className="hidden lg:flex items-center bg-slate-100/60 p-1 rounded-xl border border-slate-200">
          {[
            { id: "basic", label: "Intro", icon: FileText },
            { id: "curriculum", label: "Activities", icon: Layout },
            { id: "settings", label: "Settings", icon: SettingsIcon },
            ...(isEdit
              ? [
                  {
                    id: "analytics",
                    label: "Analytics",
                    icon: BarChart3,
                  },
                  { id: "cohorts", label: "Cohorts", icon: Users },
                  { id: "schedule", label: "Schedule", icon: Calendar },
                ]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-[12.5px] font-medium tracking-tight transition-all",
                activeTab === tab.id
                  ? "bg-white text-[#7c6ef0] shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <tab.icon
                className={cn(
                  "w-3.5 h-3.5",
                  activeTab === tab.id ? "text-[#7c6ef0]" : "text-slate-450",
                )}
              />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {}}
            className="gap-2 font-medium h-8 md:h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors px-2 md:px-3"
          >
            <Eye className="w-4 h-4" />{" "}
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button
            onClick={handleSaveBasicInfo}
            disabled={
              createCourseMutation.isPending || updateCourseMutation.isPending
            }
            size="sm"
            className="gap-1.5 md:gap-2 font-medium bg-[#7c6ef0] text-white hover:bg-[#6b5ee0] h-8 md:h-9 px-3 md:px-5 rounded-lg transition-all border-none shadow-sm shadow-[#7c6ef0]/20 text-xs md:text-sm"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isEdit ? "Save change" : "Create draft"}
            </span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside
          className={cn(
            "fixed lg:relative z-40 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 overflow-hidden h-full shrink-0 text-slate-700",
            isSidebarOpen
              ? "w-[320px] translate-x-0"
              : "w-0 -translate-x-full lg:w-0",
          )}
        >
          <ScrollArea className="flex-1">
            <div className="flex flex-col pb-4">
              {showCurriculum && (
                <div className="flex flex-col">
                  <div className="flex flex-col divide-y divide-slate-100">
                    {course?.modules?.map((module, mIdx) => (
                      <div key={module.id} className="flex flex-col">
                        <div
                          onClick={() => {
                            toggleModule(module.id.toString());
                            setActiveTab("curriculum");
                          }}
                          className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition-all ${
                            expandedModules[module.id]
                              ? "bg-slate-50/50"
                              : "hover:bg-slate-50/30"
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-600 border border-slate-200 shrink-0">
                            {mIdx + 1}
                          </div>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <ChevronRight
                              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                                expandedModules[module.id] ? "rotate-90" : ""
                              }`}
                            />
                            <span className="text-[13.5px] font-medium text-slate-900 break-words leading-snug">
                              {module.title}
                            </span>
                          </div>
                        </div>

                        {expandedModules[module.id] && (
                          <div className="flex flex-col bg-white pt-2 pb-3 relative">
                            {/* Vertical Connector Line */}
                            <div className="absolute left-[2.25rem] top-0 bottom-12 w-[1.5px] bg-slate-100" />

                            <Reorder.Group
                              axis="y"
                              values={module.lessons || []}
                              onReorder={(newLessons) =>
                                handleReorderLessons(
                                  module.id.toString(),
                                  newLessons,
                                )
                              }
                              className="flex flex-col space-y-0.5"
                            >
                              {module.lessons?.map((lesson) => (
                                <Reorder.Item
                                  key={lesson.id}
                                  value={lesson}
                                  className="relative px-3"
                                >
                                  <div
                                    className={cn(
                                      "group flex items-center p-2 rounded-lg text-left transition-all relative cursor-pointer gap-3",
                                      selectedCurriculumItem?.lessonId ===
                                        lesson.id
                                        ? "bg-slate-100"
                                        : "hover:bg-slate-50",
                                    )}
                                    onClick={() => {
                                      handleLessonSelect(
                                        lesson,
                                        module.id.toString(),
                                      );
                                      if (window.innerWidth < 1024)
                                        setIsSidebarOpen(false);
                                    }}
                                  >
                                    {/* Item Icon Node */}
                                    <div className="relative z-10 flex items-center justify-center w-6 h-6 ml-1">
                                      <div
                                        className={cn(
                                          "w-2.5 h-2.5 rounded-full ring-4 ring-white transition-all",
                                          selectedCurriculumItem?.lessonId ===
                                            lesson.id
                                            ? "bg-[#7c6ef0] ring-[#7c6ef0]/20"
                                            : "bg-slate-300",
                                        )}
                                      />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={cn(
                                            "text-[13px] truncate transition-colors",
                                            selectedCurriculumItem?.lessonId ===
                                              lesson.id
                                              ? "font-medium text-slate-900"
                                              : "font-normal text-slate-600 group-hover:text-slate-900",
                                          )}
                                        >
                                          {lesson.title}
                                        </span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-slate-400">
                                          <GripVertical className="w-3 h-3" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Reorder.Item>
                              ))}
                            </Reorder.Group>

                            <div className="px-5 mt-2">
                              <button
                                onClick={() =>
                                  handleAddLesson(module.id.toString())
                                }
                                className="flex items-center justify-between w-full px-4 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all group"
                              >
                                <div className="flex items-center gap-2 text-[12.5px] font-medium text-slate-700">
                                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                  <span>New activity</span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-slate-300" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Only Show Navigation Tabs here on Mobile */}
              <div className="lg:hidden px-4 py-6 space-y-2 mt-4">
                {[
                  { id: "basic", label: "Intro", icon: FileText },
                  { id: "curriculum", label: "Activities", icon: Layout },
                  { id: "settings", label: "Settings", icon: SettingsIcon },
                  ...(isEdit
                    ? [
                        {
                          id: "analytics",
                          label: "Analytics",
                          icon: BarChart3,
                        },
                        { id: "cohorts", label: "Cohorts", icon: Users },
                        { id: "schedule", label: "Schedule", icon: Calendar },
                      ]
                    : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      activeTab === tab.id
                        ? "bg-white text-[#7c6ef0] shadow-sm border border-slate-200"
                        : "text-slate-500 hover:bg-slate-100",
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-slate-200 bg-white">
            <button
              onClick={handleAddModule}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 text-slate-600 font-medium text-sm transition-all group"
            >
              <PlusCircle className="w-4 h-4 text-slate-400 group-hover:text-[#7c6ef0] transition-colors" />
              <span>Add section</span>
            </button>
          </div>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 flex flex-col relative custom-scrollbar">
          <div className="flex-1 mx-auto w-full flex flex-col transition-all duration-300 max-w-5xl p-4 md:p-10">
            {renderTabContent()}
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>

      <ModuleModal
        isOpen={isModuleModalOpen}
        onClose={() => {
          setIsModuleModalOpen(false);
          setModuleTitle("");
          setModuleDescription("");
        }}
        onCreate={handleCreateModule}
        title={moduleTitle}
        description={moduleDescription}
        onTitleChange={setModuleTitle}
        onDescriptionChange={setModuleDescription}
        isCreating={createModuleMutation.isPending}
      />

      <LessonModal
        isOpen={isLessonModalOpen}
        onClose={() => {
          setIsLessonModalOpen(false);
          setLessonTitle("");
          setLessonType("VIDEO");
        }}
        onCreate={handleCreateLesson}
        title={lessonTitle}
        lessonType={lessonType}
        onTitleChange={setLessonTitle}
        onTypeChange={setLessonType}
        isCreating={createLessonMutation.isPending}
      />

      {isContentModalOpen && (
        <ContentModal
          isOpen={true}
          onClose={() => setIsContentModalOpen(false)}
          onAdd={handleCreateContent}
          lessonId={selectedLessonId}
          isAdding={createContentMutation.isPending}
        />
      )}

      {isExerciseModalOpen && (
        <ExerciseModal
          isOpen={true}
          onClose={() => {
            setIsExerciseModalOpen(false);
            setInitialExerciseTitle("");
            setEditingExercise(null);
          }}
          onAddBulk={handleCreateExercise}
          moduleId={selectedModuleId}
          lessonId={selectedLessonId}
          isAdding={
            createExerciseMutation.isPending || updateExerciseMutation.isPending
          }
          initialTitle={initialExerciseTitle}
          initialData={editingExercise}
          onUpdate={handleUpdateExercise}
          existingExercisesCount={
            course?.modules
              ?.flatMap((m) => m.lessons || [])
              .find((l) => l.id.toString() === selectedLessonId.toString())
              ?.exercises?.length || 0
          }
        />
      )}

      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        content={previewContent}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteConfig}
        onClose={() => setDeleteConfig(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteConfig?.title}?`}
        description={`Are you sure you want to delete this ${deleteConfig?.title.toLowerCase()}? This action cannot be undone.`}
        isDeleting={
          deleteModuleMutation.isPending ||
          deleteLessonMutation.isPending ||
          deleteContentMutation.isPending ||
          deleteExerciseMutation.isPending
        }
      />
    </div>
  );
};

export default InstructorCourseEditor;
