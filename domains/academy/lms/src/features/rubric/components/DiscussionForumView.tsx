import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  Award,
  Send,
  Reply,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Loader2,
  User,
  ShieldCheck,
  Calendar,
  X,
  AlertCircle,
  CornerDownRight,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  useModuleDiscussions,
  useDiscussionTopic,
  useCreateDiscussionPostMutation,
  useCreateDiscussionTopicMutation,
  useUpdateDiscussionTopicMutation,
  useGradeDiscussionPostMutation,
} from "../hooks/useDiscussions";
import { useRubricDetail } from "../hooks/useRubrics";
import { RubricCriteriaTable } from "./RubricCriteriaTable";
import { RubricGradingMatrix } from "./RubricGradingMatrix";
import { RubricSelector } from "./RubricSelector";
import { RubricStudentResultView } from "./RubricStudentResultView";
import type { DiscussionTopic, DiscussionPost, Rubric, RubricEvaluationResult } from "../types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

export interface DiscussionForumViewProps {
  moduleId: string | number;
  isInstructor?: boolean;
  canCreateTopic?: boolean;
  className?: string;
}

export const DiscussionForumView: React.FC<DiscussionForumViewProps> = ({
  moduleId,
  isInstructor = false,
  canCreateTopic = false,
  className,
}) => {
  const {
    data: topics,
    isLoading: topicsLoading,
    isError: topicsError,
    refetch: refetchTopics,
  } = useModuleDiscussions(moduleId);

  const [selectedTopicId, setSelectedTopicId] = useState<string | number | null>(null);

  // Active topic
  const activeTopicId = selectedTopicId || (topics && topics.length > 0 ? topics[0].id : null);
  const {
    data: activeTopic,
    isLoading: topicLoading,
    isError: topicError,
    refetch: refetchTopic,
  } = useDiscussionTopic(activeTopicId || undefined);

  // Attached Rubric (either directly in topic or fetched via rubricId)
  const hasEmbeddedRubric =
    activeTopic?.rubricRef &&
    typeof activeTopic.rubricRef === "object" &&
    Array.isArray(activeTopic.rubricRef.criteria);

  const { data: fetchedRubric } = useRubricDetail(
    hasEmbeddedRubric ? undefined : activeTopic?.rubricId
  );
  const attachedRubric: Rubric | undefined =
    (activeTopic?.rubricRef as Rubric) || fetchedRubric;

  // Post & Reply form state
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<DiscussionPost | null>(null);
  const [isPreviewRubricOpen, setIsPreviewRubricOpen] = useState(false);

  // Topic creation modal state (Instructor only)
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [newTopicForm, setNewTopicForm] = useState({
    title: "",
    prompt: "",
    rubricId: "",
    dueDate: "",
  });

  // Topic edit / attach rubric modal state (Instructor only)
  const [isEditTopicOpen, setIsEditTopicOpen] = useState(false);
  const [editTopicForm, setEditTopicForm] = useState({
    title: "",
    prompt: "",
    rubricId: "",
    dueDate: "",
  });

  // Grading modal state (Instructor only)
  const [gradingPost, setGradingPost] = useState<DiscussionPost | null>(null);

  // Student Rubric Evaluation view state
  const [viewingEvaluationPost, setViewingEvaluationPost] =
    useState<DiscussionPost | null>(null);

  const createTopicMutation = useCreateDiscussionTopicMutation();
  const updateTopicMutation = useUpdateDiscussionTopicMutation();
  const createPostMutation = useCreateDiscussionPostMutation();
  const gradePostMutation = useGradeDiscussionPostMutation();

  const handleOpenEditTopic = () => {
    if (!activeTopic) return;
    const rawDue = activeTopic.dueDate || activeTopic.dueAt;
    setEditTopicForm({
      title: activeTopic.title || "",
      prompt: activeTopic.prompt || (activeTopic as any).description || "",
      rubricId: activeTopic.rubricId || activeTopic.rubricRef?.id || "",
      dueDate: rawDue ? rawDue.slice(0, 16) : "",
    });
    setIsEditTopicOpen(true);
  };

  const handleEditTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopicId) return;

    if (!editTopicForm.title.trim()) {
      toast.error("Please enter a discussion title.");
      return;
    }
    if (!editTopicForm.prompt.trim()) {
      toast.error("Please enter a discussion prompt.");
      return;
    }

    try {
      await updateTopicMutation.mutateAsync({
        topicId: activeTopicId,
        moduleId,
        dto: {
          title: editTopicForm.title.trim(),
          prompt: editTopicForm.prompt.trim(),
          rubricId: editTopicForm.rubricId || undefined,
          dueDate: editTopicForm.dueDate
            ? new Date(editTopicForm.dueDate).toISOString()
            : undefined,
        },
      });
      setIsEditTopicOpen(false);
    } catch {
      // Handled by toast
    }
  };

  const handleCreateTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicForm.title.trim()) {
      toast.error("Please enter a discussion title.");
      return;
    }
    if (!newTopicForm.prompt.trim()) {
      toast.error("Please enter a clinical case prompt.");
      return;
    }

    try {
      const created = await createTopicMutation.mutateAsync({
        moduleId: Number(moduleId) || 1,
        title: newTopicForm.title.trim(),
        prompt: newTopicForm.prompt.trim(),
        rubricId: newTopicForm.rubricId || undefined,
        dueDate: newTopicForm.dueDate
          ? new Date(newTopicForm.dueDate).toISOString()
          : undefined,
      });

      if (created?.id) {
        setSelectedTopicId(created.id);
      }
      setIsCreateTopicOpen(false);
      setNewTopicForm({ title: "", prompt: "", rubricId: "", dueDate: "" });
    } catch {
      // Handled by toast
    }
  };

  // Organize root posts vs threaded replies
  const { rootPosts, repliesMap } = useMemo(() => {
    const roots: DiscussionPost[] = [];
    const replies: Record<string, DiscussionPost[]> = {};

    (activeTopic?.posts || []).forEach((post) => {
      if (post.parentId) {
        const pId = String(post.parentId);
        if (!replies[pId]) replies[pId] = [];
        replies[pId].push(post);
      } else {
        roots.push(post);
      }
    });

    return { rootPosts: roots, repliesMap: replies };
  }, [activeTopic?.posts]);

  const handleSendPost = async (parentId?: string | number | null) => {
    const text = replyText.trim();
    if (!text || !activeTopicId) return;

    try {
      await createPostMutation.mutateAsync({
        topicId: activeTopicId,
        body: text,
        content: text,
        parentId: parentId || undefined,
      });
      setReplyText("");
      setReplyingTo(null);
    } catch {
      // Handled by mutation toast
    }
  };

  const handleApplyRubricGrade = async (
    totalScore: number,
    feedback: string,
    evaluation: any
  ) => {
    if (!gradingPost) return;

    const criteriaScores = (evaluation?.criteriaScores || []).map((cs: any) => ({
      criterionId: String(cs.criterionId),
      levelId: cs.selectedLevelId,
      points: Number(cs.points) || 0,
      feedback: cs.levelName,
    }));

    try {
      await gradePostMutation.mutateAsync({
        postId: gradingPost.id,
        topicId: activeTopicId || undefined,
        dto: {
          score: totalScore,
          grade: totalScore,
          feedback,
          isSubstantive: (evaluation?.percentage || 0) >= 70,
          rubricId: attachedRubric?.id,
          selectedLevelIds: evaluation?.selectedLevelIds,
          criteriaScores,
          rubricScores: evaluation?.criteriaScores,
        },
      });
      setGradingPost(null);
    } catch {
      // Handled by toast
    }
  };

  const getStudentEvaluationResult = (
    post: DiscussionPost,
    rubric?: Rubric
  ): RubricEvaluationResult => {
    const maxPts =
      activeTopic?.maxPoints ||
      rubric?.criteria?.reduce((sum, c) => sum + (c.maxPoints || 0), 0) ||
      10;
    const earnedPts = post.grade ?? post.score ?? 0;
    const percentage = maxPts > 0 ? Math.round((earnedPts / maxPts) * 100) : 0;

    let criteriaScores = Array.isArray(post.rubricScores)
      ? post.rubricScores
      : [];
    if (criteriaScores.length === 0 && rubric?.criteria) {
      criteriaScores = rubric.criteria.map((c) => ({
        criterionId: c.id || c.title,
        criterionTitle: c.title,
        selectedLevelId: "",
        levelName: percentage >= 80 ? "Proficient" : "Needs Work",
        points: Math.round((c.maxPoints * earnedPts) / maxPts),
        maxPoints: c.maxPoints,
      }));
    }

    return {
      rubricId: rubric?.id,
      totalPoints: earnedPts,
      maxPoints: maxPts,
      percentage,
      criteriaScores,
      customFeedback: post.feedback,
    };
  };

  // Loading state
  if (topicsLoading) {
    return (
      <div className="p-12 rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400 text-xs gap-3 shadow-xs">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="font-semibold text-slate-600">Loading module discussion forums...</span>
      </div>
    );
  }

  // Error state
  if (topicsError) {
    return (
      <div className="p-8 rounded-2xl border border-rose-200 bg-rose-50/50 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h4 className="text-sm font-bold text-rose-900">Failed to Load Discussions</h4>
        <p className="text-xs text-rose-600 max-w-md mx-auto">
          We encountered an error retrieving discussion topics for this unit.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetchTopics()}
          className="rounded-lg text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-100/60"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state (no topics created yet)
  if (!topics || topics.length === 0) {
    return (
      <div className={cn("p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center space-y-4", className)}>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-800">No Unit Discussion Topics Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            WAC 246-841A-440 requires at least one rubric-evaluated asynchronous discussion per unit
            encouraging substantive clinical engagement and peer responses.
          </p>
        </div>

        {canCreateTopic && isInstructor ? (
          <Button
            size="sm"
            onClick={() => setIsCreateTopicOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create Unit Discussion Topic
          </Button>
        ) : (
          <p className="text-[11px] text-slate-400 italic">
            Your instructor will publish this unit's discussion prompt shortly.
          </p>
        )}

        {/* Create Topic Modal */}
        {canCreateTopic && isInstructor && (
          <Dialog open={isCreateTopicOpen} onOpenChange={setIsCreateTopicOpen}>
            <DialogContent className="sm:max-w-[650px] p-0 border-none rounded-3xl overflow-hidden bg-white shadow-2xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900">
                      Create Unit Discussion Topic
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Postman 5.1 &bull; WAC 246-841A-440 Asynchronous Unit Discussion
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateTopicSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Topic Title *</label>
                  <Input
                    value={newTopicForm.title}
                    onChange={(e) => setNewTopicForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Unit 2 Discussion: Responding to Resident Fall Risk"
                    className="text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Clinical Case Study / Discussion Prompt *</label>
                  <Textarea
                    value={newTopicForm.prompt}
                    onChange={(e) => setNewTopicForm((prev) => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Pose a realistic clinical scenario requiring critical thinking, infection control protocols, and textbook citations..."
                    className="text-xs rounded-xl min-h-[110px] resize-none"
                    required
                  />
                </div>

                <RubricSelector
                  selectedRubricId={newTopicForm.rubricId}
                  onSelectRubric={(rubricId) =>
                    setNewTopicForm((prev) => ({ ...prev, rubricId: rubricId || "" }))
                  }
                  typeFilter="DISCUSSION"
                  label="Attach Standardized Grading Rubric"
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Due Date (Optional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={newTopicForm.dueDate}
                    onChange={(e) => setNewTopicForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateTopicOpen(false)}
                    className="text-xs font-bold rounded-xl h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTopicMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-5 shadow-xs"
                  >
                    {createTopicMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Publish Discussion Topic"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className={cn("w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs", className)}>
      {/* Topics Selector Bar */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTopicId(t.id);
                setReplyingTo(null);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                activeTopicId === t.id
                  ? "bg-white text-blue-700 shadow-2xs border border-blue-200"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t.title}
            </button>
          ))}
        </div>

        {canCreateTopic && isInstructor && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCreateTopicOpen(true)}
            className="h-7 text-[11px] font-bold rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 shrink-0"
          >
            <Plus className="w-3 h-3 mr-1" /> New Topic
          </Button>
        )}
      </div>

      {/* Topic Prompt Header */}
      {topicLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          Loading topic discussion...
        </div>
      ) : activeTopic ? (
        <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 space-y-4">
          {/* Top Bar: Topic Title & Rubric Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {activeTopic.title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {attachedRubric ? (
                <>
                  <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs py-1 px-2.5 font-bold shadow-2xs">
                    <Award className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
                    Rubric: {attachedRubric.name}
                    <span className="text-[10px] text-blue-500 font-normal ml-1">
                      ({activeTopic.maxPoints || attachedRubric.criteria?.reduce((s, c) => s + (c.maxPoints || 0), 0)} pts)
                    </span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreviewRubricOpen(true)}
                    className="h-8 text-xs font-bold rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5 shrink-0"
                  >
                    <Award className="w-3.5 h-3.5 text-blue-600" /> View Rubric Criteria
                  </Button>
                </>
              ) : (
                <Badge variant="outline" className="text-slate-400 border-dashed text-xs py-1 px-2.5">
                  No Rubric Attached
                </Badge>
              )}

              {canCreateTopic && isInstructor && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditTopic}
                  className="h-8 text-xs font-bold rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  {attachedRubric ? "Edit Topic & Rubric" : "Attach Rubric"}
                </Button>
              )}
            </div>
          </div>

          {/* Full-width Clinical Case Scenario & Discussion Prompt */}
          {(activeTopic.prompt || (activeTopic as any).description) && (
            <div className="w-full bg-slate-50/80 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Clinical Case Scenario &amp; Discussion Prompt</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                {activeTopic.prompt || (activeTopic as any).description}
              </p>
            </div>
          )}

          {/* Substantive Dialogue Requirement Notice */}
          <div className="w-full p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              WAC 246-841A-440(4): Requires at least 1 substantive original post & 2 constructive peer responses.
            </span>
            {(activeTopic.dueDate || activeTopic.dueAt) && (
              <span className="text-[11px] font-bold text-blue-700 shrink-0">
                Due: {format(new Date(activeTopic.dueDate || activeTopic.dueAt!), "MMM d, yyyy h:mm a")}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {/* Discussion Posts Stream */}
      <div className="p-6 space-y-5 max-h-[520px] overflow-y-auto divide-y divide-slate-100">
        {rootPosts.length > 0 ? (
          rootPosts.map((post) => {
            const childReplies = repliesMap[String(post.id)] || post.replies || [];

            return (
              <div key={post.id} className="pt-5 first:pt-0 space-y-3">
                {/* Main Post Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {post.authorName || "Nursing Candidate"}
                        </span>
                        {post.authorRole && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-semibold text-slate-500">
                            {post.authorRole}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {post.createdAt ? format(new Date(post.createdAt), "MMM d, h:mm a") : "Recent"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {post.isSubstantive && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                        <ShieldCheck className="w-3 h-3" /> Substantive
                      </Badge>
                    )}
                    {post.grade != null && (
                      <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                        {post.grade} pts
                      </span>
                    )}
                    {post.grade != null && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingEvaluationPost(post)}
                        className="h-7 text-[11px] font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 bg-emerald-50/40 flex items-center gap-1 shadow-2xs"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-600" /> View Rubric Evaluation
                      </Button>
                    )}
                    {isInstructor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setGradingPost(post)}
                        className="h-7 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Award className="w-3 h-3 mr-1" /> Grade with Rubric
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(post)}
                      className="h-7 text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                    >
                      <Reply className="w-3 h-3 mr-1" /> Reply
                    </Button>
                  </div>
                </div>

                {/* Main Post Content */}
                <div className="pl-10 text-xs text-slate-800 leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 whitespace-pre-wrap">
                  {post.body || post.content}
                </div>

                {/* Feedback if graded */}
                {post.feedback && (
                  <div className="ml-10 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold flex items-center gap-1 text-[11px] text-emerald-800">
                        <Award className="w-3.5 h-3.5" /> Instructor Rubric Evaluation & Feedback:
                      </span>
                      {post.grade != null && (
                        <button
                          type="button"
                          onClick={() => setViewingEvaluationPost(post)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
                        >
                          View Breakdown &rarr;
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-relaxed pl-4">{post.feedback}</p>
                  </div>
                )}

                {/* Nested Threaded Replies */}
                {childReplies.length > 0 && (
                  <div className="ml-10 space-y-3 pt-2 border-l-2 border-blue-100 pl-4">
                    {childReplies.map((reply) => (
                      <div key={reply.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CornerDownRight className="w-3 h-3 text-blue-400" />
                            <span className="text-[11px] font-bold text-slate-800">
                              {reply.authorName || "Peer Response"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {reply.createdAt ? format(new Date(reply.createdAt), "MMM d, h:mm a") : "Recent"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {reply.isSubstantive && (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold">
                                Substantive
                              </Badge>
                            )}
                            {reply.grade != null && (
                              <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {reply.grade} pts
                              </span>
                            )}
                            {reply.grade != null && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingEvaluationPost(reply)}
                                className="h-6 text-[10px] font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 bg-emerald-50/40 px-2 flex items-center gap-1 shadow-2xs"
                              >
                                <Award className="w-3 h-3 text-emerald-600" /> Rubric
                              </Button>
                            )}
                            {isInstructor && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setGradingPost(reply)}
                                className="h-6 text-[10px] font-bold text-blue-600 hover:text-blue-700 px-2"
                              >
                                Grade
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                          {reply.body || reply.content}
                        </div>

                        {reply.feedback && (
                          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                            <strong>Feedback:</strong> {reply.feedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 space-y-2">
            <MessageSquare className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-400 italic">
              No discussion contributions yet. Be the first to share your clinical perspective!
            </p>
          </div>
        )}
      </div>

      {/* Compose Contribution Box */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-2.5">
        {replyingTo && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-800">
            <span className="flex items-center gap-1.5 font-medium">
              <Reply className="w-3.5 h-3.5 text-blue-600" />
              Replying to <strong>{replyingTo.authorName || "Peer"}</strong>: "{((replyingTo.body || replyingTo.content) ?? "").slice(0, 50)}..."
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <Textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={
            replyingTo
              ? "Compose constructive peer response with clinical rationales..."
              : "Compose substantive clinical dialogue with textbook citations and evidence-based rationales..."
          }
          className="min-h-[85px] bg-white text-xs rounded-xl border-slate-200 resize-none focus-visible:ring-blue-500 shadow-2xs"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">
              WABON Standard: Cite specific infection protocols or textbook chapters for full rubric points.
            </span>
            {attachedRubric && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewRubricOpen(true)}
                className="h-6 text-[10px] font-bold text-blue-700 bg-blue-50/70 border-blue-200 hover:bg-blue-100 flex items-center gap-1 shadow-2xs"
              >
                <Award className="w-3 h-3 text-blue-600" /> Review Rubric Criteria
              </Button>
            )}
          </div>
          <Button
            onClick={() => handleSendPost(replyingTo?.id)}
            disabled={!replyText.trim() || createPostMutation.isPending}
            className="h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
          >
            {createPostMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Send className="w-3.5 h-3.5 mr-1.5" />
            )}
            {replyingTo ? "Post Peer Reply" : "Post Contribution"}
          </Button>
        </div>
      </div>

      {/* Rubric Preview Dialog */}
      <Dialog open={isPreviewRubricOpen} onOpenChange={setIsPreviewRubricOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[85vh] flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <DialogTitle className="text-sm font-bold text-slate-900">
                Discussion Evaluation Rubric: {attachedRubric?.name}
              </DialogTitle>
            </div>
          </div>
          <div className="p-6 overflow-y-auto">
            {attachedRubric && <RubricCriteriaTable rubric={attachedRubric} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rubric Evaluation Modal for Instructor */}
      <Dialog
        open={Boolean(gradingPost)}
        onOpenChange={(open) => {
          if (!open) setGradingPost(null);
        }}
      >
        <DialogContent className="sm:max-w-[800px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[90vh] flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <DialogTitle className="text-sm font-bold text-slate-900">
                Grade Discussion Post with Standardized Rubric
              </DialogTitle>
            </div>
          </div>
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700">
                Student Contribution by {gradingPost?.authorName || "Student"}:
              </span>
              <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-100">
                "{gradingPost?.body || gradingPost?.content || ""}"
              </p>
            </div>
            {attachedRubric ? (
              <RubricGradingMatrix
                rubric={attachedRubric}
                initialFeedback={gradingPost?.feedback || ""}
                onApplyScore={handleApplyRubricGrade}
              />
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 space-y-3">
                <p>No rubric attached to this discussion topic. You can attach one anytime.</p>
                {isInstructor && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setGradingPost(null);
                      handleOpenEditTopic();
                    }}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 font-bold rounded-lg text-xs"
                  >
                    <Award className="w-3.5 h-3.5 mr-1.5" /> Attach Rubric Now
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Completed Rubric Evaluation Dialog */}
      <Dialog
        open={Boolean(viewingEvaluationPost)}
        onOpenChange={(open) => {
          if (!open) setViewingEvaluationPost(null);
        }}
      >
        <DialogContent className="sm:max-w-[760px] p-0 border-none rounded-3xl overflow-hidden bg-white max-h-[88vh] flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <DialogTitle className="text-sm font-bold text-slate-900">
                Discussion Evaluation &amp; Rubric Scores
              </DialogTitle>
            </div>
          </div>
          <div className="p-6 overflow-y-auto">
            {viewingEvaluationPost && (
              <RubricStudentResultView
                rubric={attachedRubric}
                evaluation={getStudentEvaluationResult(
                  viewingEvaluationPost,
                  attachedRubric
                )}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Discussion Topic & Attach Rubric Modal */}
      {canCreateTopic && isInstructor && (
        <Dialog open={isEditTopicOpen} onOpenChange={setIsEditTopicOpen}>
          <DialogContent className="sm:max-w-[650px] p-0 border-none rounded-3xl overflow-hidden bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Edit Discussion Topic &amp; Attached Rubric
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Update prompt or attach standardized rubric
                  </DialogDescription>
                </div>
              </div>
            </div>

            <form onSubmit={handleEditTopicSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Topic Title *</label>
                <Input
                  value={editTopicForm.title}
                  onChange={(e) => setEditTopicForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Unit Discussion: Infection Control"
                  className="text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Discussion Prompt *</label>
                <Textarea
                  value={editTopicForm.prompt}
                  onChange={(e) => setEditTopicForm((prev) => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Clinical scenario or prompt..."
                  className="text-xs rounded-xl min-h-[100px] resize-none"
                  required
                />
              </div>

              <RubricSelector
                selectedRubricId={editTopicForm.rubricId}
                onSelectRubric={(rubricId) =>
                  setEditTopicForm((prev) => ({ ...prev, rubricId: rubricId || "" }))
                }
                typeFilter="DISCUSSION"
                label="Standardized Grading Rubric"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Due Date (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={editTopicForm.dueDate}
                  onChange={(e) => setEditTopicForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditTopicOpen(false)}
                  className="text-xs font-bold rounded-xl h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateTopicMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-5 shadow-xs"
                >
                  {updateTopicMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Topic Modal (When topics already exist) */}
      {canCreateTopic && isInstructor && (
        <Dialog open={isCreateTopicOpen} onOpenChange={setIsCreateTopicOpen}>
          <DialogContent className="sm:max-w-[650px] p-0 border-none rounded-3xl overflow-hidden bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Create Unit Discussion Topic
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Postman 5.1 &bull; WAC 246-841A-440 Asynchronous Unit Discussion
                  </DialogDescription>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateTopicSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Topic Title *</label>
                <Input
                  value={newTopicForm.title}
                  onChange={(e) => setNewTopicForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Unit 2 Discussion: Responding to Resident Fall Risk"
                  className="text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Clinical Case Study / Discussion Prompt *</label>
                <Textarea
                  value={newTopicForm.prompt}
                  onChange={(e) => setNewTopicForm((prev) => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Pose a realistic clinical scenario requiring critical thinking, infection control protocols, and textbook citations..."
                  className="text-xs rounded-xl min-h-[110px] resize-none"
                  required
                />
              </div>

              <RubricSelector
                selectedRubricId={newTopicForm.rubricId}
                onSelectRubric={(rubricId) =>
                  setNewTopicForm((prev) => ({ ...prev, rubricId: rubricId || "" }))
                }
                typeFilter="DISCUSSION"
                label="Attach Standardized Grading Rubric"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Due Date (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={newTopicForm.dueDate}
                  onChange={(e) => setNewTopicForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateTopicOpen(false)}
                  className="text-xs font-bold rounded-xl h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTopicMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-5 shadow-xs"
                >
                  {createTopicMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Publish Discussion Topic"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
