import React, { useState, useMemo } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  Stethoscope,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Award,
  Search,
  Filter,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Send,
  Loader2,
  User,
  RotateCcw,
  BookOpen,
  Calendar,
  AlertCircle,
  HelpCircle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useSkillsList,
  useStudentSkillsMatrix,
  useRecordCheckoffMutation,
} from "../hooks/useSkillsLab";
import { useInstructorCohortsList } from "../hooks/useSeatTime";
import { useUser } from "@/features/auth/hooks/useAuth";
import { useEnrollments } from "@/hooks/useAcademy";
import type { Skill, SkillCheckoff } from "../types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// ── Washington State Board of Nursing (WABON) 22 Required Core Skills ──
const WABON_22_CORE_SKILLS: Skill[] = [
  {
    id: 1,
    skillNumber: "SKILL-01",
    title: "Hand Hygiene (Medical Asepsis)",
    category: "INFECTION_CONTROL",
    description:
      "Decontaminates hands using soap and warm water with proper friction, wrist coverage, and clean paper towel technique.",
    criticalSteps: [
      "Wet hands and wrists thoroughly under running water, keeping hands lower than elbows.",
      "Apply soap and lather all surfaces including wrists, backs of hands, and between fingers for at least 20 seconds.",
      "Clean under fingernails against palm of opposite hand.",
      "Rinse hands thoroughly with fingertips pointing downward.",
      "Dry hands with clean paper towel and discard.",
      "Turn off faucet with a separate clean, dry paper towel without touching clean hands to faucet handle.",
    ],
    passingScore: 100,
  },
  {
    id: 2,
    skillNumber: "SKILL-02",
    title: "Donning & Doffing Full PPE (Gown & Gloves)",
    category: "INFECTION_CONTROL",
    description:
      "Properly sequences PPE donning and doffing to prevent self-contamination and environmental transmission.",
    criticalSteps: [
      "Select correct size gown and unroll completely.",
      "Fasten ties at neck securely and overlap back of gown completely.",
      "Fasten waist ties at back or side.",
      "Put on clean gloves and pull cuffs over the gown wrists.",
      "Doff gloves first by turning inside out without touching outer contaminated surface.",
      "Unfasten neck and waist ties, peel gown downward and outward away from body.",
      "Dispose in biohazard/linen receptacle and perform immediate hand hygiene.",
    ],
    passingScore: 100,
  },
  {
    id: 3,
    skillNumber: "SKILL-03",
    title: "Measuring & Recording Radial Pulse and Respirations",
    category: "VITAL_SIGNS",
    description:
      "Accurately counts radial pulse for 60 seconds and covertly measures respiration rate.",
    criticalSteps: [
      "Locate radial pulse using tips of first two or three fingers (never thumb).",
      "Count pulse for 60 seconds (or 30 seconds x 2 if regular).",
      "Count respirations immediately without letting resident know.",
      "Record pulse rate within +/- 4 beats of RN evaluator.",
      "Record respiration rate within +/- 2 breaths of RN evaluator.",
    ],
    passingScore: 100,
  },
  {
    id: 4,
    skillNumber: "SKILL-04",
    title: "Measuring & Recording Blood Pressure (Manual)",
    category: "VITAL_SIGNS",
    description:
      "Measures systolic and diastolic blood pressure using aneroid sphygmomanometer and stethoscope with dual bell.",
    criticalSteps: [
      "Clean stethoscope earpieces and diaphragm with alcohol wipe.",
      "Position resident's arm palm up, supported at heart level.",
      "Wrap cuff smoothly 1 inch above antecubital space with artery marker aligned.",
      "Inflate cuff 30 mmHg above estimated systolic pressure.",
      "Deflate cuff slowly at 2-3 mmHg per second while listening for Korotkoff sounds.",
      "Record systolic and diastolic reading within +/- 4 mmHg of RN evaluator.",
    ],
    passingScore: 100,
  },
  {
    id: 5,
    skillNumber: "SKILL-05",
    title: "Measuring & Recording Body Temperature & Weight",
    category: "VITAL_SIGNS",
    description:
      "Safely operates digital/tympanic thermometer and upright balance scale with zero calibration.",
    criticalSteps: [
      "Ensure resident is wearing non-skid footwear before standing.",
      "Zero/calibrate scale balance beam prior to resident stepping on.",
      "Assist resident onto center of scale facing weights.",
      "Read balance indicator accurately and record within +/- 2 lbs of RN evaluator.",
      "Measure temperature following aseptic probe cover protocol.",
    ],
    passingScore: 100,
  },
  {
    id: 6,
    skillNumber: "SKILL-06",
    title: "Transfer Resident from Bed to Wheelchair Using Gait Belt",
    category: "MOBILITY",
    description:
      "Safely transfers a partially weight-bearing resident using a transfer belt with locked bed and wheelchair wheels.",
    criticalSteps: [
      "Explain procedure and position wheelchair at head or foot of bed with brakes locked.",
      "Ensure bed is in lowest position and bed brakes are locked.",
      "Assist resident to seated position on edge of bed with non-skid footwear on flat floor.",
      "Apply gait belt securely around natural waistline over clothing (two-finger fit).",
      "Grasp belt with upward underhand grip on both sides.",
      "On count of three, brace resident knees/feet and assist to standing position.",
      "Pivot toward wheelchair and back resident until legs touch seat.",
      "Lower resident gently into wheelchair, remove belt, and position footrests.",
    ],
    passingScore: 100,
  },
  {
    id: 7,
    skillNumber: "SKILL-07",
    title: "Ambulate Resident with a Transfer/Gait Belt",
    category: "MOBILITY",
    description:
      "Assists resident with standing and ambulating safely while maintaining slight posterior-lateral positioning.",
    criticalSteps: [
      "Apply gait belt over clothing with buckle off-center.",
      "Ensure non-skid footwear is on resident before standing.",
      "Stand slightly behind and to the side (affected side if applicable).",
      "Maintain upward underhand grip on belt during ambulation.",
      "Walk 15 feet smoothly, monitoring resident for dizziness or gait instability.",
      "Assist resident safely back to chair/bed and remove gait belt.",
    ],
    passingScore: 100,
  },
  {
    id: 8,
    skillNumber: "SKILL-08",
    title: "Positioning Resident in Bed (Lateral Side-Lying)",
    category: "MOBILITY",
    description:
      "Reposition resident into side-lying lateral position with 4 support pillows to relieve pressure points.",
    criticalSteps: [
      "Lower head of bed to flat or comfortable level, raising bed to working height.",
      "Gently roll resident onto side facing away from caregiver.",
      "Place support pillow folded behind back to maintain 30-degree tilt.",
      "Place pillow under upper arm and hand supported.",
      "Place pillow between knees and ankles ensuring bony prominences do not touch.",
      "Ensure resident body alignment and call light within reach.",
    ],
    passingScore: 100,
  },
  {
    id: 9,
    skillNumber: "SKILL-09",
    title: "Passive Range of Motion (PROM) for Shoulder, Elbow, & Wrist",
    category: "MOBILITY",
    description:
      "Performs gentle, slow flexion, extension, abduction, and rotation exercises supporting joints with pain monitoring.",
    criticalSteps: [
      "Instruct resident to inform caregiver immediately if any pain or resistance occurs.",
      "Support joint above and below (wrist and elbow) throughout movement.",
      "Perform flexion and extension of shoulder gently 3 times.",
      "Perform abduction and adduction of shoulder smoothly 3 times.",
      "Stop immediately if resident reports discomfort or resistance is felt.",
    ],
    passingScore: 100,
  },
  {
    id: 10,
    skillNumber: "SKILL-10",
    title: "Passive Range of Motion (PROM) for Hip, Knee, & Ankle",
    category: "MOBILITY",
    description:
      "Supports lower extremity joints through 3 repetitions of flexion, extension, dorsiflexion, and plantarflexion.",
    criticalSteps: [
      "Support lower extremity joint at knee and ankle throughout movement.",
      "Flex and extend hip and knee smoothly through comfortable range 3 times.",
      "Support foot and move ankle in dorsiflexion and plantarflexion 3 times.",
      "Never force a joint beyond normal range or resident comfort level.",
    ],
    passingScore: 100,
  },
  {
    id: 11,
    skillNumber: "SKILL-11",
    title: "Application of Anti-Embolic Elastic Stocking (TED Hose)",
    category: "MOBILITY",
    description:
      "Applies knee-high compression stocking smoothly without wrinkles to prevent DVT.",
    criticalSteps: [
      "Ensure resident is in supine position with leg elevated.",
      "Turn stocking inside out to heel pocket.",
      "Slip stocking over toes and heel, ensuring heel is properly seated.",
      "Smooth stocking up over calf to 1-2 inches below knee.",
      "Ensure stocking is completely smooth with no twists, wrinkles, or rolling bands.",
    ],
    passingScore: 100,
  },
  {
    id: 12,
    skillNumber: "SKILL-12",
    title: "Making an Occupied Bed",
    category: "PERSONAL_CARE",
    description:
      "Replaces bottom and top linens while resident remains safely turned in bed maintaining comfort and modesty.",
    criticalSteps: [
      "Raise side rail opposite turning side if applicable or maintain resident safety.",
      "Loosen bottom linens and roll soiled sheets close to resident back.",
      "Apply clean fitted bottom sheet and tuck cleanly toward center roll.",
      "Turn resident over center hump onto clean side.",
      "Remove soiled linens without shaking and pull clean sheets taut.",
      "Apply clean top sheet and blanket with toe pleat to prevent pressure sores.",
    ],
    passingScore: 100,
  },
  {
    id: 13,
    skillNumber: "SKILL-13",
    title: "Partial Bed Bath (Face, Neck, Arms, Hands, & Axilla)",
    category: "PERSONAL_CARE",
    description:
      "Performs gentle cleansing with warm water and soap using mitt technique and patting dry.",
    criticalSteps: [
      "Test water temperature and have resident verify comfort.",
      "Wash eyes with warm water only from inner canthus to outer canthus using clean section of cloth.",
      "Wash face, neck, and ears without soap (or per preference) and pat dry.",
      "Expose only one arm at a time, washing with soap from wrist to axilla.",
      "Rinse and pat dry thoroughly, including axillary fold.",
    ],
    passingScore: 100,
  },
  {
    id: 14,
    skillNumber: "SKILL-14",
    title: "Perineal Care for Incontinent Resident (Female/Male)",
    category: "PERSONAL_CARE",
    description:
      "Aseptic cleansing of perineum from front to back (urethra to rectum) to prevent infection.",
    criticalSteps: [
      "Wear clean gloves and check water temperature with resident.",
      "Separate labia and wash front to back with clean surface of washcloth for each wipe.",
      "Cleanse rectal area from front to back with separate clean strokes.",
      "Rinse thoroughly and pat dry completely.",
      "Remove gloves and perform immediate hand hygiene before touching clean linens.",
    ],
    passingScore: 100,
  },
  {
    id: 15,
    skillNumber: "SKILL-15",
    title: "Catheter Care for Resident with Indwelling Urinary Catheter",
    category: "PERSONAL_CARE",
    description:
      "Cleanses catheter tubing downward away from meatus while stabilizing tubing to prevent pulling.",
    criticalSteps: [
      "Check water temperature and wear clean gloves.",
      "Hold catheter tubing at urinary meatus to prevent tugging on balloon inside bladder.",
      "With soapy washcloth, clean at least 4 inches down tubing away from body in one stroke.",
      "Use clean area of washcloth for rinse stroke down tubing away from body.",
      "Ensure tubing has no kinks and drainage bag is hung below bladder level on bed frame.",
    ],
    passingScore: 100,
  },
  {
    id: 16,
    skillNumber: "SKILL-16",
    title: "Assisting Resident with Bedpan & Output Measurement",
    category: "PERSONAL_CARE",
    description:
      "Places standard or fracture bedpan correctly and accurately reads urinary output in graduate container.",
    criticalSteps: [
      "Position bedpan under buttocks with wide end toward head (fracture pan handle toward feet).",
      "Raise head of bed to sitting position and place toilet paper/call light within reach.",
      "Wear gloves to remove bedpan gently and empty into graduated container.",
      "Place graduate on flat surface at eye level to read volume in milliliters (mL/cc).",
      "Record output measurement within +/- 25 mL of RN evaluator.",
    ],
    passingScore: 100,
  },
  {
    id: 17,
    skillNumber: "SKILL-17",
    title: "Measuring & Recording Urinary Drainage Bag Output",
    category: "PERSONAL_CARE",
    description:
      "Empties catheter drainage bag into graduate without contaminating drain port and records volume.",
    criticalSteps: [
      "Place barrier on floor underneath drainage bag and graduate.",
      "Open drain clamp and empty urine into graduate without touching drain spout to container.",
      "Wipe drain spout with alcohol wipe and clamp securely.",
      "Read graduate at eye level on flat surface.",
      "Record output in mL/cc within +/- 25 mL of RN evaluator.",
    ],
    passingScore: 100,
  },
  {
    id: 18,
    skillNumber: "SKILL-18",
    title: "Mouth Care / Denture Care for Dependent Resident",
    category: "PERSONAL_CARE",
    description:
      "Cleanses resident teeth, gums, and tongue or brushes dentures with cool water and padded sink barrier.",
    criticalSteps: [
      "Line bottom of sink with paper towel or fill with cool water to prevent denture fracture.",
      "Brush all surfaces of dentures with cool water and denture cleanser.",
      "Brush resident teeth and gums gently using 45-degree angle stroke.",
      "Assist resident to rinse mouth into emesis basin and pat mouth dry.",
      "Store dentures in cool water or denture cup labeled with resident name.",
    ],
    passingScore: 100,
  },
  {
    id: 19,
    skillNumber: "SKILL-19",
    title: "Feeding Dependent Resident & Fluid Intake Recording",
    category: "PERSONAL_CARE",
    description:
      "Assists resident in upright position with meals, offering fluids, pacing bites, and recording percentage consumed.",
    criticalSteps: [
      "Sit resident upright at 75-90 degrees (High Fowler's).",
      "Sit facing resident at eye level to provide unhurried feeding.",
      "Offer fluids frequently between bites of food.",
      "Ensure resident mouth is swallowed completely before offering next bite.",
      "Calculate and record food consumption percentage within +/- 15% and fluids in mL.",
    ],
    passingScore: 100,
  },
  {
    id: 20,
    skillNumber: "SKILL-20",
    title: "Dressing Resident with an Affected (Weak) Upper Extremity",
    category: "PERSONAL_CARE",
    description:
      "Removes clothing starting with unaffected side; dresses starting with affected (weak) side.",
    criticalSteps: [
      "Offer resident choice between two clothing options.",
      "Undress unaffected (strong) arm first.",
      "Dress affected (weak) arm first, supporting joints gently.",
      "Pull garment smoothly across back and insert strong arm.",
      "Fasten buttons/snaps and adjust garment for comfort and dignity.",
    ],
    passingScore: 100,
  },
  {
    id: 21,
    skillNumber: "SKILL-21",
    title: "Foot Care on One Foot (Washing, Drying, & Lotion)",
    category: "PERSONAL_CARE",
    description:
      "Soaks, washes, and thoroughly dries foot and between toes; applies lotion avoiding interdigital spaces.",
    criticalSteps: [
      "Test water temperature and confirm with resident.",
      "Submerge foot in basin of warm water to soak.",
      "Wash foot with soap, including heel and sole.",
      "Dry foot thoroughly, especially between toes to prevent fungal infection.",
      "Apply lotion to top and bottom of foot; NEVER apply lotion between toes.",
    ],
    passingScore: 100,
  },
  {
    id: 22,
    skillNumber: "SKILL-22",
    title: "Nail Care on One Hand (Soaking, Cleaning, & Filing)",
    category: "PERSONAL_CARE",
    description:
      "Soaks fingernails, cleans under nails with orangewood stick, and files smooth in one direction.",
    criticalSteps: [
      "Soak resident hand in basin of warm water for 5 minutes.",
      "Clean gently under each nail using blunt end of orangewood stick wiped on towel between nails.",
      "File fingernails gently in one direction with emery board to smooth rough edges.",
      "Apply lotion to hand and fingers and pat off excess.",
    ],
    passingScore: 100,
  },
];

export const CNACompetencyMatrixPage: React.FC = () => {
  const { data: user } = useUser();
  const role = (
    user?.academyUser?.role ||
    user?.globalRole ||
    ""
  ).toUpperCase();
  const isInstructorOrAuditor =
    role === "INSTRUCTOR" ||
    role === "ADMIN" ||
    role === "COURSE_MANAGER" ||
    role === "COMMISSION_AUDITOR";

  // Cohort & Enrollment queries
  const { data: cohortsData } = useInstructorCohortsList();
  const cohorts = cohortsData || [];

  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const activeCohortId =
    selectedCohortId || (cohorts.length > 0 ? String(cohorts[0].id) : "1");

  // Fetch cohort enrollments for instructor student-picker
  const { data: enrollmentsData } = useQuery({
    queryKey: ["cohort-enrollments", activeCohortId],
    queryFn: async () => {
      const res = await api.get(`/enrollments/cohort/${activeCohortId}`);
      return res.data;
    },
    enabled: Boolean(isInstructorOrAuditor && activeCohortId),
  });

  const studentList = useMemo(() => {
    const list = Array.isArray(enrollmentsData)
      ? enrollmentsData
      : enrollmentsData?.enrollments || [];
    return list.map((e: any) => ({
      userId: e.userId || e.profile?.userId || String(e.id),
      name:
        e.user
          ? `${e.user.firstname || ""} ${e.user.lastname || ""}`.trim() || e.user.email
          : e.profile
          ? `${e.profile.user?.firstname || ""} ${e.profile.user?.lastname || ""}`.trim() || e.userId
          : `Student ${e.userId?.slice?.(0, 8) || e.id}`,
    }));
  }, [enrollmentsData]);

  const [selectedStudentUserId, setSelectedStudentUserId] =
    useState<string>("");

  const effectiveStudentUserId = useMemo(() => {
    if (!isInstructorOrAuditor) return user?.firebaseId || "";
    if (selectedStudentUserId) return selectedStudentUserId;
    if (studentList.length > 0) return studentList[0].userId;
    return "";
  }, [isInstructorOrAuditor, user, selectedStudentUserId, studentList]);

  // Skills List from Backend
  const { data: apiSkills } = useSkillsList();
  const allSkills: Skill[] = useMemo(() => {
    if (apiSkills && apiSkills.length >= 22) return apiSkills;
    if (apiSkills && apiSkills.length > 0) {
      // Merge with default 22 to guarantee full 22-skill compliance
      const existingNumbers = new Set(apiSkills.map((s) => s.skillNumber));
      const missing = WABON_22_CORE_SKILLS.filter(
        (s) => !existingNumbers.has(s.skillNumber)
      );
      return [...apiSkills, ...missing];
    }
    return WABON_22_CORE_SKILLS;
  }, [apiSkills]);

  // Student Matrix from Backend
  const { data: matrixData } = useStudentSkillsMatrix(
    effectiveStudentUserId,
    activeCohortId
  );

  // Map backend matrix items
  const matrixMap = useMemo(() => {
    const map = new Map<number, any>();
    if (matrixData && Array.isArray(matrixData.skills)) {
      matrixData.skills.forEach((s: any) => {
        map.set(Number(s.skillId), s);
      });
    }
    return map;
  }, [matrixData]);

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Checkoff Modal State
  const [selectedSkillForCheckoff, setSelectedSkillForCheckoff] =
    useState<Skill | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [evaluatorNotes, setEvaluatorNotes] = useState<string>("");
  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [evaluatorSignature, setEvaluatorSignature] = useState<string>(
    "RN Evaluator Verified"
  );

  const recordCheckoffMutation = useRecordCheckoffMutation();

  const handleOpenCheckoff = (skill: Skill) => {
    const existing = matrixMap.get(Number(skill.id));
    setSelectedSkillForCheckoff(skill);
    setCompletedSteps(skill.criticalSteps ? [...skill.criticalSteps] : []);
    setEvaluatorNotes(existing?.comments || "");
    setAttemptCount(existing ? (existing.attempts || 1) + 1 : 1);
  };

  const toggleStep = (stepText: string) => {
    setCompletedSteps((prev) =>
      prev.includes(stepText)
        ? prev.filter((s) => s !== stepText)
        : [...prev, stepText]
    );
  };

  const handleSelectAllSteps = () => {
    if (selectedSkillForCheckoff?.criticalSteps) {
      setCompletedSteps([...selectedSkillForCheckoff.criticalSteps]);
    }
  };

  const handleSubmitEvaluation = async (passed: boolean) => {
    if (!selectedSkillForCheckoff) return;
    if (!effectiveStudentUserId) {
      toast.error("Please select a student first.");
      return;
    }

    const notesText =
      evaluatorNotes.trim() ||
      (passed
        ? "Demonstrated clinical competency in accordance with WAC 246-841A."
        : "Failed critical steps. Requires additional lab practice and reassessment.");

    try {
      await recordCheckoffMutation.mutateAsync({
        skillId: Number(selectedSkillForCheckoff.id),
        studentUserId: effectiveStudentUserId,
        cohortId: Number(activeCohortId),
        passed,
        status: passed ? "PASSED" : "FAILED",
        attemptNumber: attemptCount,
        attempts: attemptCount,
        comments: notesText,
        evaluatorNotes: notesText,
        criticalStepsCompleted: completedSteps,
        signatureUrl: evaluatorSignature,
      });
      setSelectedSkillForCheckoff(null);
    } catch {
      // Handled by mutation toast
    }
  };

  // Filter skills
  const filteredSkills = useMemo(() => {
    return allSkills.filter((s) => {
      const matchCat =
        activeCategory === "ALL" || s.category === activeCategory;
      const matchSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.skillNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());

      const record = matrixMap.get(Number(s.id));
      const status = record?.status || "NOT_ATTEMPTED";

      let matchStatus = true;
      if (statusFilter === "PASSED") matchStatus = status === "PASSED";
      if (statusFilter === "FAILED")
        matchStatus = status === "FAILED" || status === "NEEDS_PRACTICE";
      if (statusFilter === "NOT_ATTEMPTED")
        matchStatus = status === "NOT_ATTEMPTED";
      if (statusFilter === "NEEDS_REASSESSMENT")
        matchStatus = status === "FAILED" || status === "NEEDS_PRACTICE";

      return matchCat && matchSearch && matchStatus;
    });
  }, [allSkills, activeCategory, searchQuery, statusFilter, matrixMap]);

  // Hours and statistics calculation
  const totalCoreSkillsCount = allSkills.length;
  const passedSkillsCount = matrixData?.passedSkills ?? 0;
  const failedSkillsCount = useMemo(() => {
    let count = 0;
    matrixMap.forEach((v) => {
      if (v.status === "FAILED" || v.status === "NEEDS_PRACTICE") count++;
    });
    return count;
  }, [matrixMap]);

  // Statutory 32 Skills Lab Hours calculation
  // 32.0 hours minimum per WAC 246-841A
  const REQUIRED_LAB_HOURS = 32.0;
  const calculatedLabHours = useMemo(() => {
    if (totalCoreSkillsCount === 0) return 0;
    return parseFloat(
      Math.min(
        REQUIRED_LAB_HOURS,
        (passedSkillsCount / totalCoreSkillsCount) * REQUIRED_LAB_HOURS
      ).toFixed(1)
    );
  }, [passedSkillsCount, totalCoreSkillsCount]);

  const completionPercent = totalCoreSkillsCount > 0
    ? Math.round((passedSkillsCount / totalCoreSkillsCount) * 100)
    : 0;

  // Selected student name display
  const currentStudentName = useMemo(() => {
    if (!isInstructorOrAuditor) {
      return `${user?.firstname || ""} ${user?.lastname || ""}`.trim() || "Student";
    }
    const found = studentList.find((s: any) => s.userId === effectiveStudentUserId);
    return found ? found.name : effectiveStudentUserId || "Select a Student";
  }, [isInstructorOrAuditor, user, studentList, effectiveStudentUserId]);

  const content = (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                In-Person Skills Lab & Competency Matrix
              </h1>
              <p className="text-xs text-slate-500">
                Washington WAC 246-841A Requirement: 32 In-Person Lab Hours & 22 Mandatory RN-Observed Competencies.
              </p>
            </div>
          </div>
        </div>

        {/* 32 Lab Hours & 22 Skills Cards */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Skills Lab Hours
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">
                  {calculatedLabHours}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  / 32.0 hrs
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Competencies Passed
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">
                  {passedSkillsCount}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  / 22 Skills ({completionPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort & Student Selector (Instructor View) */}
      {isInstructorOrAuditor && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="w-full sm:w-60">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Active Cohort
              </label>
              <Select
                value={activeCohortId}
                onValueChange={(val) => {
                  setSelectedCohortId(val);
                  setSelectedStudentUserId("");
                }}
              >
                <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
                  <SelectValue placeholder="Select Cohort" />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name || `Cohort #${c.id}`}
                    </SelectItem>
                  ))}
                  {cohorts.length === 0 && (
                    <SelectItem value="1">Cohort 1 (Default)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-72">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Select Student for Checkoff Review
              </label>
              <Select
                value={effectiveStudentUserId}
                onValueChange={(val) => setSelectedStudentUserId(val)}
              >
                <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {studentList.map((s: any) => (
                    <SelectItem key={s.userId} value={s.userId}>
                      {s.name}
                    </SelectItem>
                  ))}
                  {studentList.length === 0 && (
                    <SelectItem value={effectiveStudentUserId || "student-1"}>
                      {effectiveStudentUserId ? `User: ${effectiveStudentUserId.slice(0, 10)}...` : "No enrolled students found"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Roster Status */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200">
            <User className="w-4 h-4 text-primary shrink-0" />
            <span>Viewing: <strong className="text-slate-900">{currentStudentName}</strong></span>
            {failedSkillsCount > 0 && (
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 ml-2">
                {failedSkillsCount} Need Reassessment
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Student View Banner */}
      {!isInstructorOrAuditor && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Your Official Washington CNA Competency Record
              </h3>
              <p className="text-xs text-emerald-700">
                Skills must be observed and checked off in-person by an approved RN instructor. Online self-reporting is not permitted under WAC 246-841A.
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white border-0 text-xs px-3 py-1 font-bold">
            {passedSkillsCount === 22 ? "ALL 22 PASSED" : `${22 - passedSkillsCount} Remaining`}
          </Badge>
        </div>
      )}

      {/* Filters & Status Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
            {[
              { id: "ALL", label: "All Skills (22)" },
              { id: "INFECTION_CONTROL", label: "Infection Control" },
              { id: "VITAL_SIGNS", label: "Vital Signs" },
              { id: "MOBILITY", label: "Mobility & Transfers" },
              { id: "PERSONAL_CARE", label: "Personal Care" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0",
                  activeCategory === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-white border-slate-200 text-xs font-semibold h-10">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Evaluation States</SelectItem>
                <SelectItem value="PASSED">Satisfactory (Passed)</SelectItem>
                <SelectItem value="NEEDS_REASSESSMENT">
                  Reassessment Required
                </SelectItem>
                <SelectItem value="NOT_ATTEMPTED">Not Yet Attempted</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skill title or number..."
                className="pl-9 h-10 rounded-xl bg-white border-slate-200 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 22 Skills Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSkills.map((skill) => {
          const checkoff = matrixMap.get(Number(skill.id));
          const isPassed = checkoff?.status === "PASSED";
          const isFailed =
            checkoff?.status === "FAILED" ||
            checkoff?.status === "NEEDS_PRACTICE";
          const attempts = checkoff?.attempts || 0;
          const comments = checkoff?.comments;
          const checkoffDate = checkoff?.checkoffDate;

          return (
            <div
              key={skill.id}
              className={cn(
                "rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4",
                isPassed
                  ? "border-emerald-200 bg-emerald-50/10"
                  : isFailed
                  ? "border-rose-200 bg-rose-50/10"
                  : "border-slate-200"
              )}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {skill.skillNumber}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500">
                      {skill.category.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5",
                      isPassed
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : isFailed
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    )}
                  >
                    {isPassed
                      ? "SATISFACTORY (PASSED)"
                      : isFailed
                      ? `UNSATISFACTORY (ATTEMPT #${attempts})`
                      : "NOT EVALUATED"}
                  </Badge>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {skill.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {skill.description}
                  </p>
                </div>

                {/* Feedback or Notes */}
                {comments && (
                  <div className={cn(
                    "p-2.5 rounded-xl border text-xs",
                    isPassed
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50/50 border-rose-200 text-rose-800"
                  )}>
                    <span className="font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                      Instructor Evaluation Notes:
                    </span>
                    <p className="text-xs">{comments}</p>
                    {checkoffDate && (
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Evaluated: {new Date(checkoffDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Critical Steps List Summary */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Critical Steps ({skill.criticalSteps?.length || 0})
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {skill.criticalSteps?.slice(0, 2).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <span className="line-clamp-1">{step}</span>
                      </li>
                    ))}
                    {(skill.criticalSteps?.length || 0) > 2 && (
                      <li className="text-[10px] font-semibold text-slate-400 pl-3">
                        + {(skill.criticalSteps?.length || 0) - 2} more critical steps in protocol
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isPassed ? "Criteria 100% Met" : "Mandatory 100% Pass Required"}
                </span>

                {isInstructorOrAuditor && (
                  <Button
                    onClick={() => handleOpenCheckoff(skill)}
                    size="sm"
                    className="h-8 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {isPassed ? "Re-evaluate Skill" : "Record Checkoff"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkoff Evaluation Dialog (Instructor Mode) */}
      <Dialog
        open={Boolean(selectedSkillForCheckoff)}
        onOpenChange={(open) => {
          if (!open) setSelectedSkillForCheckoff(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            {selectedSkillForCheckoff?.skillNumber}: {selectedSkillForCheckoff?.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Evaluating student: <strong>{currentStudentName}</strong> for in-person skills lab competency.
          </DialogDescription>

          <div className="space-y-4 pt-2">
            {/* Protocol Steps Checklist */}
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Critical Steps Verification
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllSteps}
                  className="h-6 text-[11px] text-emerald-700 font-bold"
                >
                  Check All Steps
                </Button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedSkillForCheckoff?.criticalSteps.map((step, idx) => {
                  const isChecked = completedSteps.includes(step);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStep(step)}
                      className={cn(
                        "flex items-start gap-2.5 p-2 rounded-lg text-xs cursor-pointer transition-colors border",
                        isChecked
                          ? "bg-white border-emerald-300 text-slate-900"
                          : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                      )}
                    >
                      <button type="button" className="mt-0.5 shrink-0 text-emerald-600">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                      <span className="leading-snug">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evaluator Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Instructor Observation Feedback & Critical Notes
              </label>
              <Textarea
                value={evaluatorNotes}
                onChange={(e) => setEvaluatorNotes(e.target.value)}
                placeholder="Document student's technique, safety considerations, areas needing practice, or specific remediation instructions..."
                rows={3}
                className="text-xs"
              />
            </div>

            {/* Attempt Count */}
            <div className="flex items-center gap-4">
              <div className="w-36">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Attempt Number
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={attemptCount}
                  onChange={(e) => setAttemptCount(Number(e.target.value) || 1)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  RN Evaluator Attestation
                </label>
                <Input
                  value={evaluatorSignature}
                  onChange={(e) => setEvaluatorSignature(e.target.value)}
                  placeholder="RN Evaluator Name / License"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSkillForCheckoff(null)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                variant="destructive"
                disabled={recordCheckoffMutation.isPending}
                onClick={() => handleSubmitEvaluation(false)}
                className="h-9 text-xs font-bold"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Unsatisfactory (Needs Reassessment)
              </Button>

              <Button
                size="sm"
                disabled={recordCheckoffMutation.isPending}
                onClick={() => handleSubmitEvaluation(true)}
                className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {recordCheckoffMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                )}
                Satisfactory (Competency Passed)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isInstructorOrAuditor) {
    return <InstructorLayout>{content}</InstructorLayout>;
  }
  return <StudentLayout>{content}</StudentLayout>;
};

export default CNACompetencyMatrixPage;
