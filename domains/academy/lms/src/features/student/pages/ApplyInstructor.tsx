import React, { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "@/features/student/components/LmsNavbar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useApplyInstructor,
  useUser,
  useSwitchAcademyRole,
  useUploadResume,
} from "@/features/auth/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  CloudUpload,
  Trash2,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  User,
  BookOpen,
  FolderOpen,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  personalDetails: z.object({
    firstname: z.string().min(2, "First name is too short"),
    lastname: z.string().min(2, "Last name is too short"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Invalid phone number"),
  }),
  teachingArea: z.string().min(2, "Please specify at least one teaching area"),
  resumeUrl: z.string().min(1, "Please upload your resume"),
  interviewResponses: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string().min(1, "Field required"),
      }),
    )
    .length(3),
});

const ApplyInstructor = () => {
  const { data: user } = useUser();
  const navigate = useNavigate();
  const applyMutation = useApplyInstructor();
  const uploadMutation = useUploadResume();
  const switchRoleMutation = useSwitchAcademyRole();
  const [isSwitching, setIsSwitching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personalDetails: {
        firstname: user?.firstname || "",
        lastname: user?.lastname || "",
        email: user?.email || "",
        phone: "",
      },
      teachingArea: "",
      resumeUrl: "",
      interviewResponses: [
        { question: "Why do you want to teach?", answer: "" },
        {
          question: "What subjects are you most passionate about?",
          answer: "",
        },
        { question: "Describe your teaching experience.", answer: "" },
      ],
    },
  });

  const { fields: interviewFields } = useFieldArray({
    control: form.control,
    name: "interviewResponses",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync(file);
      form.setValue("resumeUrl", result.url, {
        shouldDirty: true,
        shouldTouch: true,
      });
      toast.success("Resume uploaded successfully");
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Transform comma-separated string into an array expected by your backend payload
    const payload = {
      personalDetails: values.personalDetails,
      resumeUrl: values.resumeUrl,
      interviewResponses: values.interviewResponses,
      teachingCategories: values.teachingArea
        .split(",")
        .map((category) => category.trim())
        .filter((category) => category.length > 0),
    };
    applyMutation.mutate(payload as any);
  };

  const handleGoToLms = async () => {
    setIsSwitching(true);
    try {
      await switchRoleMutation.mutateAsync({ newRole: "instructor" });
      navigate("/instructor");
    } catch (error) {
      console.error("Failed to switch to instructor role:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  const isInstructor =
    user?.academyUser?.role === "INSTRUCTOR" ||
    user?.instructorStatus?.toUpperCase() === "ACCEPTED" ||
    user?.instructorStatus?.toUpperCase() === "APPROVED" ||
    user?.instructorStatus?.toUpperCase() === "ACTIVE" ||
    user?.roleStatus?.instructor?.toUpperCase() === "ACTIVE";

  if (isInstructor) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <main className="flex-grow container max-w-4xl mx-auto px-4 py-20 flex items-center justify-center">
          <Card className="w-full border border-slate-200 shadow-xl text-center p-12 bg-white rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="mb-6 inline-flex p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="font-heading text-3xl font-bold mb-3 text-slate-900 tracking-tight">
              You're an Instructor!
            </h1>
            <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
              Welcome, Your application was accepted and you are ready to start
              sharing your expertise.
            </p>
            <Button
              size="lg"
              onClick={handleGoToLms}
              disabled={isSwitching}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-6 font-semibold transition-all shadow-md"
            >
              {isSwitching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Switching Role...
                </>
              ) : (
                "Enter Instructor Dashboard"
              )}
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  const isPending =
    user?.hasTeacherApplication ||
    user?.instructorStatus?.toUpperCase() === "PENDING" ||
    user?.roleStatus?.instructor?.toUpperCase() === "PENDING";

  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <main className="flex-grow container max-w-4xl mx-auto px-4 py-20 flex items-center justify-center">
          <Card className="w-full border border-slate-200 shadow-xl text-center p-12 bg-white rounded-3xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="mb-6 inline-flex p-4 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock size={40} />
            </div>
            <h1 className="font-heading text-3xl font-bold mb-3 text-slate-900 tracking-tight">
              Application Pending
            </h1>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              We've received your application! Our team is currently reviewing
              your profile. We'll notify you via email as soon as there's an
              update.
            </p>
            <div className="mt-8 p-3 bg-slate-50 rounded-xl border border-slate-100 italic text-xs text-slate-400">
              Estimated review time: 2-3 business days
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const isRejected =
    user?.roleStatus?.instructor?.toUpperCase() === "REJECTED" ||
    user?.instructorStatus?.toUpperCase() === "REJECTED";

  if (isRejected && !form.formState.isDirty && !form.formState.isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <main className="flex-grow container max-w-4xl mx-auto px-4 py-20 flex items-center justify-center">
          <Card className="w-full border border-slate-200 shadow-xl text-center p-12 bg-white rounded-3xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500" />
            <div className="mb-6 inline-flex p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100">
              <AlertCircle size={40} />
            </div>
            <h1 className="font-heading text-3xl font-bold mb-3 text-slate-900 tracking-tight">
              Application Not Accepted
            </h1>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              Unfortunately, your application was not accepted at this time.
              Don't worry, you can refine your profile and re-apply anytime!
            </p>
            <div className="mt-8">
              <Button
                onClick={() => form.reset()}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-6 font-semibold transition-all"
              >
                Start New Application
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-700 antialiased">
      <Navbar />
      <main className="flex-grow container max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* Header Hero Section */}
        <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 relative overflow-hidden shadow-sm">
          <div className="absolute top-4 right-4 text-blue-500/5">
            <Sparkles size={120} className="opacity-30" />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-2">
            {user?.instructorStatus?.toUpperCase() === "REJECTED"
              ? "Re-apply to Teach on AlikoHub"
              : "Become an Instructor on AlikoHub"}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl leading-relaxed mb-4">
            Share your expertise with thousands of learners. Fill out this short
            application—our team reviews submissions within 2-3 business days
            and will contact you by email with next steps.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-slate-400 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-slate-300" /> ~5 mins to
              complete
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-slate-300" /> Review
              status required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-slate-300" /> Email
              confirmation sent
            </span>
          </div>
        </div>

        {/* Steps Horizontal Progress Indicator */}
        <div className="grid grid-cols-4 gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-center text-xs font-semibold text-slate-400">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 py-1 bg-emerald-50/50 border border-emerald-100 rounded-lg">
            <CheckCircle2 size={13} /> Personal Info
          </div>
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 py-1 bg-emerald-50/50 border border-emerald-100 rounded-lg">
            <CheckCircle2 size={13} /> Teaching Area
          </div>
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 py-1 bg-emerald-50/50 border border-emerald-100 rounded-lg">
            <CheckCircle2 size={13} /> Documents
          </div>
          <div className="flex items-center justify-center gap-1.5 text-blue-600 py-1 bg-blue-50 border border-blue-100 rounded-lg">
            <Clock size={13} /> Review & Submit
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* STEP 1: Personal Details */}
            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-slate-900">
                    Step 1 — Personal information
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review and verify your existing account details.
                  </p>
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs leading-relaxed">
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  <p>
                    Your profile information was automatically imported from
                    your account. Pre-filled fields are secured and ready to go.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="personalDetails.firstname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-500">
                          First name
                        </FormLabel>
                        <FormControl>
                          <Input
                            disabled
                            className="h-10 bg-slate-100 border-slate-200 text-slate-500 text-xs rounded-xl cursor-not-allowed opacity-80"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 size={10} /> pre-filled
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalDetails.lastname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-500">
                          Last name
                        </FormLabel>
                        <FormControl>
                          <Input
                            disabled
                            className="h-10 bg-slate-100 border-slate-200 text-slate-500 text-xs rounded-xl cursor-not-allowed opacity-80"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 size={10} /> pre-filled
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalDetails.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-500">
                          Email address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            disabled
                            className="h-10 bg-slate-100 border-slate-200 text-slate-500 text-xs rounded-xl cursor-not-allowed opacity-80"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 size={10} /> pre-filled
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalDetails.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-500">
                          Phone number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+1 (555) 000-0000"
                            className="h-10 bg-slate-50/50 border-slate-200 focus-visible:ring-slate-300 text-slate-800 text-xs rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-slate-400">
                          Used only for routine coordinator updates.
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* STEP 2: Teaching Area */}
            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-slate-900">
                    Step 2 — Teaching areas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Specify the subjects you are confident teaching.
                  </p>
                </div>
              </div>
              <CardContent className="p-5">
                <FormField
                  control={form.control}
                  name="teachingArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-500">
                        Fields of expertise
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Certified Nursing Assistant (CNA), Clinical Skills Lab, Infection Control"
                          className="h-10 bg-slate-50/50 border-slate-200 focus-visible:ring-slate-300 text-slate-800 text-xs rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <div className="text-xs text-slate-400">
                        Separate multiple topics with commas to help prioritize
                        course matching targets.
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* STEP 3: Supporting Documents */}
            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <FolderOpen size={16} />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-slate-900">
                    Step 3 — Supporting documents
                  </h3>
                  <p className="text-xs text-slate-400">
                    Attach verification records below.
                  </p>
                </div>
              </div>
              <CardContent className="p-5">
                <FormField
                  control={form.control}
                  name="resumeUrl"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold text-slate-600">
                        Resume/CV *
                      </FormLabel>
                      <FormControl>
                        <div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                          />

                          {!field.value ? (
                            <div
                              onClick={() =>
                                !uploadMutation.isPending &&
                                fileInputRef.current?.click()
                              }
                              className={`border border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/50 rounded-xl p-5 flex flex-col items-center text-center cursor-pointer transition-all ${
                                uploadMutation.isPending
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {uploadMutation.isPending ? (
                                <Loader2 className="h-5 w-5 text-blue-600 animate-spin mb-1.5" />
                              ) : (
                                <CloudUpload className="h-5 w-5 text-slate-400 mb-1.5" />
                              )}
                              <p className="text-xs font-semibold text-slate-700">
                                Drop your file or click to browse
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                PDF, DOC or DOCX — max 5MB
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                                  <FileText size={15} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate">
                                    resume_bezawit_eshetu.pdf
                                  </p>
                                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                                    <CheckCircle2 size={9} /> uploaded
                                    successfully
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg"
                                onClick={() => form.setValue("resumeUrl", "")}
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* STEP 4: Review & Submit */}
            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-slate-900">
                    Step 4 — Review & submit
                  </h3>
                  <p className="text-xs text-slate-400">
                    Verify information accuracy before saving execution flags.
                  </p>
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                {interviewFields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`interviewResponses.${index}.answer` as any}
                    render={({ field: inputField }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-slate-700 leading-relaxed">
                          {index + 1}.{" "}
                          {form.getValues(
                            `interviewResponses.${index}.question` as any,
                          )}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share your detailed response or professional background experience..."
                            className="min-h-[90px] bg-white border-slate-200 focus-visible:ring-slate-300 text-slate-800 text-xs rounded-xl p-3 resize-none"
                            {...inputField}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-slate-400 max-w-sm text-center sm:text-left">
                    By submitting, you agree to our Instructor Terms. Reviews
                    conclude within 72h max.
                  </p>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto h-10 px-5 font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm min-w-[160px] transition-all"
                    disabled={
                      applyMutation.isPending || uploadMutation.isPending
                    }
                  >
                    {applyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default ApplyInstructor;
