import React, { useState } from "react";
import {
  Book,
  PlusCircle,
  Trash2,
  Video,
  Youtube,
  FileText,
  ChevronRight,
  ChevronLeft,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  HelpCircle,
  Eye,
  PlayCircle,
  Plus,
  MonitorPlay,
  ClipboardList,
  Layers,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Save,
  Edit2,
  Sparkles,
  Copy,
  UploadCloud,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Course, Lesson } from "@/types/academy";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CurriculumTabProps {
  course?: Course;
  selectedItem: any;
  onSetSelectedItem: (item: any) => void;
  onAddModule: () => void;
  onAddLesson: (moduleId: string) => void;
  onUpdateLesson: (lessonId: string, data: any) => void;
  onAddContent: (moduleId: string, lessonId: string) => void;
  onAddExercise: (
    moduleId: string,
    lessonId: string,
    initialTitle?: string,
  ) => void;
  onEditExercise: (exercise: any) => void;
  onDeleteModule: (moduleId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onDeleteContent: (contentId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onView: (content: any) => void;
  isRejected: boolean;
}

const getFullUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const baseUrl = import.meta.env.VITE_API_URL || "https://api.consultancy.alikohub.com";
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
};

const parseOptions = (options: any): string[] => {
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return options
        .split(",")
        .map((o: string) => o.trim())
        .filter(Boolean);
    }
  }
  return [];
};

export const CurriculumTab = ({
  course,
  selectedItem,
  onSetSelectedItem,
  onAddModule,
  onAddLesson,
  onUpdateLesson,
  onAddContent,
  onAddExercise,
  onEditExercise,
  onDeleteModule,
  onDeleteLesson,
  onDeleteContent,
  onDeleteExercise,
  onView,
  isRejected,
}: CurriculumTabProps) => {
  const [lessonActiveTab, setLessonActiveTab] = useState<string>("materials");
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(
    null,
  );

  const getEmbedUrl = (url: string) => {
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      if (url.includes("youtube.com/watch")) {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get("v");
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1&origin=${origin}`;
      } else if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1]?.split("?")[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1&origin=${origin}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const handleLessonSelect = (lesson: Lesson, moduleId: string) => {
    onSetSelectedItem({
      type: "LESSON",
      data: lesson,
      moduleId,
      lessonId: lesson.id,
    });
    setEditingLesson({ ...lesson });
    setLessonActiveTab("materials");
  };

  const handleUpdateLessonSave = () => {
    if (selectedItem?.type === "LESSON" && editingLesson) {
      onUpdateLesson(selectedItem.lessonId!, editingLesson);
    }
  };

  const setSelectItem = (content: any) => {
    onSetSelectedItem({
      type: "CONTENT",
      data: content,
      moduleId: selectedItem?.moduleId,
      lessonId: selectedItem?.lessonId,
    });
  };

  const renderPreview = () => {
    if (!selectedItem) return null;
    const { type, data } = selectedItem;

    if (type === "LESSON") {
      const lesson = data;
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm transition-all mb-8">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="w-fit gap-1.5 border-[#7c6ef0]/30 bg-[#7c6ef0]/5 text-[#7c6ef0] hover:bg-[#7c6ef0]/10 font-medium text-[10px] uppercase tracking-wide rounded-full px-3 py-1"
                  >
                    {lesson.type === "VIDEO" ? (
                      <PlayCircle className="w-3.5 h-3.5 text-[#7c6ef0]" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-[#7c6ef0]" />
                    )}
                    <span>{lesson.type} lesson</span>
                  </Badge>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-medium uppercase tracking-wide">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Published
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-slate-900 font-heading leading-tight tracking-tight">
                  {editingLesson?.title || lesson.title}
                </h3>

                <div className="flex items-center gap-4 text-[13px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Module section</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <Book className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lesson.contents?.length || 0} materials</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteLesson(lesson.id)}
                  className="h-9 w-9 p-0 text-slate-400 bg-white hover:text-red-600 hover:bg-red-50 hover:border-red-200 border-slate-200 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Lesson Tabs */}
          <Tabs
            value={lessonActiveTab}
            onValueChange={setLessonActiveTab}
            className="w-full"
          >
            <TabsList className="bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 gap-8">
              <TabsTrigger
                value="materials"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#7c6ef0] data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-slate-500 data-[state=active]:text-[#7c6ef0] pb-3 px-0 transition-all text-[13.5px]"
              >
                Materials
              </TabsTrigger>
              <TabsTrigger
                value="assessments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#7c6ef0] data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-slate-500 data-[state=active]:text-[#7c6ef0] pb-3 px-0 transition-all text-[13.5px]"
              >
                Assessments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="mt-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  {lesson.contents?.map((content: any) => (
                    <div
                      key={content.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between group hover:border-[#7c6ef0]/40 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#7c6ef0]/5 group-hover:text-[#7c6ef0] group-hover:border-[#7c6ef0]/20 transition-all">
                          {content.type === "VIDEO" ? (
                            <PlayCircle className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-[14px]">
                            {content.title}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-0.5">
                            {content.type} document
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-slate-400 hover:text-[#7c6ef0] hover:bg-[#7c6ef0]/5 rounded-lg transition-all"
                          onClick={() => setSelectItem(content)}
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                          onClick={() => onDeleteContent(content.id)}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Upload Area */}
                  <div className="mt-8 p-9 rounded-3xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-center transition-all hover:bg-slate-50 hover:border-slate-300">
                    <UploadCloud className="w-10 h-10 text-slate-300 mb-3" />
                    <h4 className="text-[15px] font-semibold text-slate-800 mb-1.5">
                      Add content to this lesson
                    </h4>
                    <p className="text-sm text-slate-500 mb-6">
                      Click a button below to open the upload modal
                    </p>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="gap-2 text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 font-medium h-9 px-4 rounded-lg transition-all"
                        onClick={() =>
                          onAddContent(selectedItem.moduleId!, lesson.id)
                        }
                      >
                        <UploadCloud className="w-4 h-4" /> Upload file
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 font-medium h-9 px-4 rounded-lg transition-all"
                        onClick={() =>
                          onAddContent(selectedItem.moduleId!, lesson.id)
                        }
                      >
                        <LinkIcon className="w-4 h-4" /> Add URL
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 font-medium h-9 px-4 rounded-lg transition-all"
                        onClick={() =>
                          onAddContent(selectedItem.moduleId!, lesson.id)
                        }
                      >
                        <Youtube className="w-4 h-4" /> Embed video
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assessments" className="mt-6">
              <div className="p-7 rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[16px] font-semibold text-slate-900 font-heading">
                    Lesson assessments
                  </h4>
                  <Button
                    size="sm"
                    className="bg-[#7c6ef0] hover:bg-[#6b5ee0] text-white rounded-lg gap-2 font-medium"
                    onClick={() =>
                      onAddExercise(selectedItem.moduleId!, lesson.id)
                    }
                  >
                    <Plus className="w-4 h-4" /> Add question
                  </Button>
                </div>

                <div className="space-y-3">
                  {(() => {
                    if (!lesson.exercises || lesson.exercises.length === 0)
                      return null;

                    const groupedExercises = (lesson.exercises || []).reduce(
                      (acc: any, ex: any) => {
                        const title = ex.title || "Lesson Assessment";
                        // Group by the suffix if it exists, otherwise by title
                        const groupKey = title.includes(" ||| ")
                          ? title.split(" ||| ")[1]
                          : title;

                        if (!acc[groupKey]) {
                          acc[groupKey] = {
                            fullTitle: title, // Use the title of the first item for the group
                            exercises: [],
                          };
                        }
                        acc[groupKey].exercises.push(ex);
                        return acc;
                      },
                      {},
                    );

                    return Object.entries(groupedExercises).map(
                      ([groupKey, group]: [string, any]) => {
                        const { fullTitle, exercises: groupExercises } = group;
                        const displayTitle = fullTitle.split(" ||| ")[0];
                        return (
                          <div
                            key={fullTitle}
                            className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between group hover:border-[#7c6ef0]/30 hover:shadow-sm transition-all cursor-pointer"
                            onClick={() =>
                              onSetSelectedItem({
                                type: "QUIZ_SESSION",
                                data: groupExercises,
                                moduleId: selectedItem.moduleId,
                                lessonId: lesson.id,
                                title: fullTitle,
                              })
                            }
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-xl bg-[#7c6ef0]/10 border border-[#7c6ef0]/20 flex items-center justify-center text-[#7c6ef0]">
                                <HelpCircle className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-medium text-slate-800 text-[14px] block">
                                  {displayTitle}
                                </span>
                                <span className="text-[11px] font-medium text-[#7c6ef0] uppercase tracking-wide">
                                  {groupExercises.length} questions · click to
                                  manage
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-[#7c6ef0] hover:text-white hover:bg-[#7c6ef0] rounded-lg"
                              >
                                <Eye className="w-4.5 h-4.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      },
                    );
                  })()}

                  {(!lesson.exercises || lesson.exercises.length === 0) && (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <ClipboardList className="w-9 h-9 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">
                        No assessments yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      );
    }

    if (type === "CONTENT") {
      if (data.type === "VIDEO") {
        const isYT =
          data.url &&
          (data.url.includes("youtube.com") || data.url.includes("youtu.be"));
        const embedUrl = data.url
          ? isYT
            ? getEmbedUrl(data.url)
            : getFullUrl(data.url)
          : null;

        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="aspect-video w-full rounded-3xl overflow-hidden bg-black shadow-xl relative">
              {embedUrl ? (
                isYT ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-0 absolute inset-0"
                    allowFullScreen
                  />
                ) : (
                  <video src={embedUrl} controls className="w-full h-full" />
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Video className="w-12 h-12 mb-2 opacity-50" />
                  <p>No video URL available</p>
                </div>
              )}
            </div>
            {isYT && data.url && (
              <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-slate-50 border border-slate-200 border-dashed">
                <p className="text-sm text-slate-500 text-center max-w-md">
                  If the video player doesn't load here, it may have embedding
                  restricted by the owner. You can watch it directly on YouTube.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-2 font-medium rounded-lg h-10 px-6"
                >
                  <a href={data.url} target="_blank" rel="noopener noreferrer">
                    <Youtube size={16} />
                    Open on YouTube
                  </a>
                </Button>
              </div>
            )}
            <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-none font-medium"
                >
                  Video content
                </Badge>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  {data.title}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 leading-tight tracking-tight">
                {data.title}
              </h3>
            </div>
          </div>
        );
      }

      if (data.type === "PDF") {
        const pdfUrl = getFullUrl(data.url);
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-5xl mx-auto">
            <div className="overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-lg flex flex-col h-[750px]">
              {/* Header inspired by LearnWise */}
              <div className="flex flex-col gap-3 border-b border-slate-100 px-7 py-5 sm:flex-row sm:items-center sm:justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-slate-900 font-heading">
                      {data.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700 border-none font-medium text-[10px] px-2 py-0.5">
                        PDF document
                      </Badge>
                      <span className="text-[10px] font-medium text-slate-400">
                        Instructor view
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg px-4 font-medium border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors gap-2"
                    asChild
                  >
                    <a
                      href={pdfUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download size={16} />
                      Download
                    </a>
                  </Button>
                </div>
              </div>

              {/* PDF toolbar */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 disabled:opacity-30"
                    disabled
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="text-xs font-medium text-slate-500">
                    Page 1
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 disabled:opacity-30"
                    disabled
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Zoom and fullscreen removed */}
                </div>
              </div>

              {/* Document Area */}
              <div className="flex-1 bg-slate-100/30 relative">
                {data.url ? (
                  <iframe
                    src={`${pdfUrl}#toolbar=0`}
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                    <FileText className="w-16 h-16 mb-2" />
                    <p className="font-medium uppercase tracking-wide text-xs">
                      No PDF loaded
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-7 py-4 bg-white flex items-center justify-between">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                  Select a document from your curriculum to update the preview
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-white hover:bg-red-500 border-red-200 font-medium h-8 transition-all"
                    onClick={() => {
                      onDeleteContent(data.id);
                      onSetSelectedItem(null);
                    }}
                  >
                    Delete content
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }

    if (type === "EXERCISE") {
      const exercise = data;
      const options = parseOptions(exercise.options);
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-9 rounded-3xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-100/50 shadow-sm relative overflow-hidden min-h-[400px]">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ClipboardList className="w-32 h-32 text-amber-900" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <Badge className="bg-amber-100 text-amber-700 border-none font-medium uppercase tracking-wide text-[10px] px-3 py-1">
                  Question preview
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg font-medium border-amber-200 text-amber-700 hover:bg-amber-50 h-8"
                    onClick={() =>
                      onSetSelectedItem({
                        type: "QUIZ_SESSION",
                        data:
                          course?.modules
                            ?.flatMap((m) => m.lessons)
                            ?.find((l) => l?.id === selectedItem.lessonId)
                            ?.exercises || [],
                        moduleId: selectedItem.moduleId,
                        lessonId: selectedItem.lessonId,
                      })
                    }
                  >
                    Back to quiz
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg font-medium border-amber-200 text-amber-700 hover:bg-amber-50 h-8 gap-1"
                    onClick={() => onEditExercise(exercise)}
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit question
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:bg-red-500 border-red-200 hover:text-white font-medium h-8 transition-all"
                    onClick={() => {
                      onDeleteExercise(exercise.id);
                      onSetSelectedItem(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 mb-8 font-heading leading-snug tracking-tight max-w-xl">
                {exercise.question}
              </h3>

              <div className="space-y-3 max-w-2xl">
                {options.map((opt: string, idx: number) => {
                  const isCorrect = exercise.correctAnswer === opt;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        isCorrect
                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-900"
                          : "border-white bg-white/60 text-slate-600"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                          isCorrect
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="font-medium flex-1 text-[14px]">
                        {opt}
                      </span>
                      {isCorrect && (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (type === "QUIZ_SESSION") {
      const exercises = data;
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 font-heading tracking-tight">
                      {selectedItem.title?.split(" ||| ")[0] ||
                        "Lesson Assessment"}
                    </h3>
                    <p className="text-[13px] text-slate-500">
                      Manage all questions for this knowledge check
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="bg-amber-100 text-amber-700 border-none font-medium px-3 py-1.5 rounded-lg">
                    {exercises.length} questions
                  </Badge>
                  <Button
                    onClick={() =>
                      onAddExercise(
                        selectedItem.moduleId!,
                        selectedItem.lessonId!,
                        selectedItem.title, // Preserve the full title including batch ID
                      )
                    }
                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add question
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {exercises.map((exercise: any, idx: number) => {
              const options = parseOptions(exercise.options);
              return (
                <div
                  key={exercise.id}
                  className="group bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:border-amber-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-7">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500 text-xs font-semibold border border-amber-100">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                        {exercise.title?.split(" ||| ")[0] ||
                          "Untitled question"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg"
                        onClick={() => onEditExercise(exercise)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-slate-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                        onClick={() => onDeleteExercise(exercise.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <h4 className="text-lg font-semibold text-slate-900 mb-6 leading-snug tracking-tight">
                    {exercise.question}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {options.map((opt: string, oIdx: number) => {
                      const isCorrect = exercise.correctAnswer === opt;
                      return (
                        <div
                          key={oIdx}
                          className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                            isCorrect
                              ? "border-emerald-500 bg-emerald-50/50 text-emerald-900"
                              : "border-slate-100 bg-slate-50/30 text-slate-600"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold ${
                              isCorrect
                                ? "bg-emerald-500 text-white"
                                : "bg-white text-slate-400 border border-slate-200"
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span className="text-[13.5px] font-medium flex-1">
                            {opt}
                          </span>
                          {isCorrect && (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {exercises.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <HelpCircle className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-slate-900 mb-2 tracking-tight">
                No questions yet
              </h4>
              <p className="text-slate-500 mb-8 text-sm">
                Start building your assessment by adding your first question.
              </p>
              <Button
                onClick={() =>
                  onAddExercise(selectedItem.moduleId!, selectedItem.lessonId!)
                }
                className="bg-primary hover:bg-primary-dark text-white font-medium rounded-lg"
              >
                Add first question
              </Button>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full">
      {renderPreview() || (
        <div className="min-h-[600px] flex flex-col items-center justify-center text-center p-12 bg-transparent text-slate-500">
          <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-7 text-slate-400">
            <MonitorPlay className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-heading tracking-tight">
            Curriculum builder
          </h3>
          <p className="text-slate-500 max-w-sm text-[14px] mb-8">
            Select a module or lesson from the sidebar to start building your
            course content.
          </p>
          <Button
            onClick={onAddModule}
            className="bg-[#7c6ef0] hover:bg-[#6b5ee0] text-white px-8 h-11 rounded-xl font-medium shadow-lg shadow-[#7c6ef0]/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Add your first section
          </Button>
        </div>
      )}
    </div>
  );
};
