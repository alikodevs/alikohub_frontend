import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import {
  Check,
  Upload,
  DollarSign,
  X,
  AlertCircle,
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  Rocket,
  Target,
  Lightbulb,
  BookOpen,
  Users,
  Clock,
  GraduationCap,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useCreateCourse } from "@/hooks/useAcademy";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const COURSE_CATEGORIES = [
  "Health",
  "Technology",
  "STEM",
  "Data Science",
  "Business",
  "Design",
];

// ─── Step Indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, title: "Foundation", subtitle: "Basics & Details" },
  { number: 2, title: "Outcomes", subtitle: "Skills & Goals" },
  { number: 3, title: "Investment", subtitle: "Pricing & Launch" },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-2xl mx-auto mb-10">
      {STEPS.map((step, i) => {
        const isComplete = currentStep > step.number;
        const isActive = currentStep === step.number;
        return (
          <div
            key={step.number}
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                  isComplete
                    ? "bg-primary/15 border-primary text-primary"
                    : isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-muted border-border text-muted-foreground"
                }`}
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {isComplete ? <Check className="w-4 h-4" /> : step.number}
              </motion.div>
              <div className="text-center">
                <p
                  className={`text-xs font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}
                >
                  {step.title}
                </p>
                <p className="text-[10px] text-muted-foreground hidden sm:block">
                  {step.subtitle}
                </p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-3 mt-[-18px]">
                <div
                  className={`h-0.5 rounded ${isComplete ? "bg-primary/40" : "bg-border"}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const InstructorCreateCourse = () => {
  const navigate = useNavigate();
  const createCourseMutation = useCreateCourse();

  const [activeStep, setActiveStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "Health",
    shortDescription: "",
    longDescription: "",
    skills: [] as string[],
    conceptsLearned: [] as string[],
    outcomes: [] as string[],
    prerequisites: [] as string[],
    languages: [] as string[],
    estimatedTime: "",
    targetLevel: "Beginner",
    createDefaultCohort: false,
    price: "",
    priceInUsd: "",
    thumbnail: null as File | null,
    thumbnailPreview: "" as string,
  });

  const handleArrayAdd = (
    field:
      | "skills"
      | "conceptsLearned"
      | "outcomes"
      | "prerequisites"
      | "languages",
    item: string,
  ) => {
    if (!formData[field].includes(item)) {
      setFormData((prev) => ({ ...prev, [field]: [...prev[field], item] }));
    }
  };
  const handleArrayRemove = (
    field:
      | "skills"
      | "conceptsLearned"
      | "outcomes"
      | "prerequisites"
      | "languages",
    item: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((i) => i !== item),
    }));
  };

  const handleUpdateField = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    handleUpdateField({ thumbnail: file, thumbnailPreview: previewUrl });
  };

  const handleNext = () => {
    if (activeStep === 1) {
      if (
        !formData.title ||
        !formData.shortDescription ||
        !formData.longDescription
      ) {
        setError(
          "Please fill in all required fields (Title, Short Summary, and Full Description).",
        );
        return;
      }
    }
    setError(null);
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleFinalCreate();
    }
  };

  const handleBack = () => {
    setError(null);
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFinalCreate = async () => {
    const payload = {
      title: formData.title.trim(),
      shortDescription: formData.shortDescription.trim(),
      longDescription: formData.longDescription.trim(),
      category: formData.category,
      price: formData.price ? Number(formData.price) : 0,
      priceInUsd: formData.priceInUsd ? Number(formData.priceInUsd) : 0,
      status: "DRAFT",
      targetLevel: formData.targetLevel,
      estimatedTime: formData.estimatedTime ? Number(formData.estimatedTime) : 0,
      createDefaultCohort: Boolean(formData.createDefaultCohort),
      skills: formData.skills,
      conceptsLearned: formData.conceptsLearned,
      outcomes: formData.outcomes,
      prerequisites: formData.prerequisites,
      languages: formData.languages,
    };

    createCourseMutation.mutate(payload, {
      onSuccess: (newCourse) => {
        toast.success("Course shell created successfully!");
        navigate(`/instructor/courses/${newCourse.id}`);
      },
      onError: (err: any) => {
        setError(
          err.response?.data?.message ||
            "Failed to create course. Please try again.",
        );
      },
    });
  };

  return (
    <InstructorLayout>
      {/* Sticky header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/instructor/courses")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-bold text-foreground">
              Create Course
            </h1>
          </div>
          <span className="text-xs text-muted-foreground">
            Step {activeStep} of 3 · Draft
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Step Indicator */}
        <StepIndicator currentStep={activeStep} />

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-3 text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {/* ── Step 1: Foundation ── */}
          {activeStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="space-y-8"
            >
              {/* Course Basics */}
              <section className="space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Course Basics
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Give your course a clear identity. A strong title and summary
                  help students decide to enroll.
                </p>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title">
                      Course Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        handleUpdateField({ title: e.target.value })
                      }
                      placeholder="e.g. Mastering Advanced React Patterns"
                      className="mt-1.5"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => handleUpdateField({ category: v })}
                    >
                      <SelectTrigger id="category" className="mt-1.5">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Short Description */}
                  <div>
                    <Label htmlFor="shortDescription">
                      Short Summary <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) =>
                        handleUpdateField({
                          shortDescription: e.target.value,
                        })
                      }
                      placeholder="Describe your course in 1-2 powerful sentences."
                      className="mt-1.5 min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Long Description */}
                  <div>
                    <Label htmlFor="longDescription">
                      Full Description{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="longDescription"
                      value={formData.longDescription}
                      onChange={(e) =>
                        handleUpdateField({ longDescription: e.target.value })
                      }
                      placeholder="Dive deep into what students will learn, the teaching approach, and real-world applications."
                      className="mt-1.5 min-h-[140px] resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Thumbnail */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Upload className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Cover Image
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a high-quality thumbnail. Recommended: 1280×720px,
                  JPG/PNG/WebP, max 5MB.
                </p>

                <div
                  className="relative aspect-video rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden hover:border-primary group cursor-pointer transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.thumbnailPreview ? (
                    <>
                      <img
                        src={formData.thumbnailPreview}
                        className="w-full h-full object-cover"
                        alt="Preview"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-semibold uppercase tracking-widest">
                          Change Image
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-3 border border-border">
                        <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        Click to upload
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </section>
            </motion.div>
          )}

          {/* ── Step 2: Skills & Outcomes ── */}
          {activeStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="space-y-8"
            >
              {/* Skills & Tools */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Skills & Tools
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Technologies and tools students will work with (e.g. Python,
                  Pandas, Figma).
                </p>
                <TagInput
                  items={formData.skills}
                  onAdd={(item) => handleArrayAdd("skills", item)}
                  onRemove={(item) => handleArrayRemove("skills", item)}
                  placeholder="e.g. Python, Pandas, NumPy"
                />
              </section>

              {/* Concepts Learned */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Concepts Covered
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Key topics and concepts students will study throughout the
                  course.
                </p>
                <TagInput
                  items={formData.conceptsLearned}
                  onAdd={(item) => handleArrayAdd("conceptsLearned", item)}
                  onRemove={(item) =>
                    handleArrayRemove("conceptsLearned", item)
                  }
                  placeholder="e.g. Data Wrangling, Statistical Analysis"
                />
              </section>

              {/* Learning Outcomes */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Learning Outcomes
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Start with action verbs (Build, Apply, Analyze). These appear
                  on your course landing page.
                </p>
                <TagInput
                  items={formData.outcomes}
                  onAdd={(item) => handleArrayAdd("outcomes", item)}
                  onRemove={(item) => handleArrayRemove("outcomes", item)}
                  placeholder="e.g. Build ML models, Create data visualizations"
                />
              </section>

              {/* Prerequisites */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Prerequisites
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  What students should know before enrolling.
                </p>
                <TagInput
                  items={formData.prerequisites}
                  onAdd={(item) => handleArrayAdd("prerequisites", item)}
                  onRemove={(item) => handleArrayRemove("prerequisites", item)}
                  placeholder="e.g. Basic Python knowledge, High school math"
                />
              </section>
            </motion.div>
          )}

          {/* ── Step 3: Pricing ── */}
          {activeStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="space-y-8"
            >
              {/* Course Details */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Course Details
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedTime">Estimated Hours</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="estimatedTime"
                        type="text"
                        inputMode="numeric"
                        value={formData.estimatedTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d+$/.test(val))
                            handleUpdateField({ estimatedTime: val });
                        }}
                        placeholder="e.g. 80"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total hours to complete.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="targetLevel">Target Level</Label>
                    <Select
                      value={formData.targetLevel}
                      onValueChange={(v) =>
                        handleUpdateField({ targetLevel: v })
                      }
                    >
                      <SelectTrigger id="targetLevel" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Who this course is for.
                    </p>
                  </div>
                </div>
              </section>

              {/* Languages */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Languages
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Languages the course is delivered in.
                </p>
                <TagInput
                  items={formData.languages}
                  onAdd={(item) => handleArrayAdd("languages", item)}
                  onRemove={(item) => handleArrayRemove("languages", item)}
                  placeholder="e.g. English, Amharic"
                />
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Pricing & Launch
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Set your enrollment fee. You can change this anytime before
                  publishing. Set to 0 for a free course.
                </p>

                {/* Price inputs */}
                <div className="border border-border rounded-xl p-6 bg-card space-y-5">
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Price (ETB)
                    </Label>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-2xl font-bold text-muted-foreground">
                        Br
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.price}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            handleUpdateField({ price: val });
                          }
                        }}
                        placeholder="0.00"
                        className="border-none bg-transparent text-3xl font-black text-foreground focus-visible:ring-0 shadow-none h-auto p-0 w-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Chapa (local) payments.
                    </p>
                  </div>

                  <div className="border-t border-border pt-5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Price in USD
                    </Label>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-2xl font-bold text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.priceInUsd}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            handleUpdateField({ priceInUsd: val });
                          }
                        }}
                        placeholder="0.00"
                        className="border-none bg-transparent text-3xl font-black text-foreground focus-visible:ring-0 shadow-none h-auto p-0 w-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Stripe (international) payments.
                    </p>
                  </div>
                </div>

                {/* Create Default Cohort Toggle */}
                <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Create Default Cohort
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Automatically create an initial cohort when the course
                        is published.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.createDefaultCohort}
                    onCheckedChange={(checked) =>
                      handleUpdateField({ createDefaultCohort: checked })
                    }
                  />
                </div>

                {/* Launch info box */}
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-5 flex gap-4 items-center">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground mb-0.5">
                      Ready to create?
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your course will be created in{" "}
                      <span className="font-semibold text-foreground">
                        Draft
                      </span>{" "}
                      mode. You can then add modules, video lessons, and your
                      full curriculum in the Course Manager.
                    </p>
                  </div>
                </div>

                {/* Checklist */}
                <div className="border border-border rounded-xl p-5 space-y-3 bg-card">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    Pre-launch Checklist
                  </h4>
                  {[
                    {
                      done: !!formData.title,
                      label: "Course title is set",
                    },
                    {
                      done: !!formData.shortDescription,
                      label: "Short summary written",
                    },
                    {
                      done: !!formData.longDescription,
                      label: "Full description written",
                    },
                    {
                      done: !!formData.thumbnail,
                      label: "Cover image uploaded",
                    },
                    {
                      done: formData.skills.length >= 1,
                      label: "Skills & tools added",
                    },
                    {
                      done: formData.outcomes.length >= 1,
                      label: "Learning outcomes added",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          item.done
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.done && <Check className="w-3 h-3" />}
                      </div>
                      <span
                        className={
                          item.done
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={activeStep === 1 || createCourseMutation.isPending}
            className="gap-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {activeStep < 3 ? (
            <Button onClick={handleNext} className="gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={createCourseMutation.isPending}
              className="gap-2"
            >
              <Rocket className="w-4 h-4" />
              {createCourseMutation.isPending ? "Creating..." : "Create Course"}
            </Button>
          )}
        </div>
      </main>
    </InstructorLayout>
  );
};

export default InstructorCreateCourse;

// ─── Reusable Tag Input ──────────────────────────────────────────────────────────
function TagInput({
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !items.includes(trimmed)) {
      onAdd(trimmed);
      setInput("");
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          onClick={handleAdd}
          variant="outline"
          className="gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Add
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
              >
                <Badge
                  variant="secondary"
                  className="text-sm font-medium px-3 py-1.5 flex items-center gap-2"
                >
                  <Check className="w-3 h-3 text-primary" />
                  {item}
                  <button
                    onClick={() => onRemove(item)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
