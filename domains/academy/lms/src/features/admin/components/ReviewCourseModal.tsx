import React, { useState } from "react";
import type { Course } from "@/types/academy";
import { CheckCircle, XCircle, BookOpen } from "lucide-react";

interface ReviewCourseModalProps {
  course: Course | null;
  onClose: () => void;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, notes: string) => void;
  isProcessing: boolean;
}

const ReviewCourseModal: React.FC<ReviewCourseModalProps> = ({
  course,
  onClose,
  onApprove,
  onReject,
  isProcessing,
}) => {
  const [notes, setNotes] = useState("");

  if (!course) return null;

  const isActionable =
    course.status === "PENDING" ||
    course.status === "PENDING_APPROVAL" ||
    course.status === "DRAFT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#27272a] w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-[#3f3f46] overflow-hidden shadow-2xl transition-colors duration-300">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white transition-colors duration-300">
            Review course
          </h2>
          <p className="text-sm text-zinc-505 dark:text-zinc-400 transition-colors duration-300">
            You are about to review this course content
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-200 dark:border-[#3f3f46] transition-colors duration-300" />

        {/* Scrollable Content Area */}
        <div className="max-h-[70vh] overflow-y-auto">
          {/* Summary rows */}
          <div className="px-6 py-4 space-y-3 text-sm border-b border-zinc-200 dark:border-[#3f3f46] transition-colors duration-300">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
                Title
              </span>
              <span
                className="font-medium text-zinc-900 dark:text-white truncate max-w-[240px] transition-colors duration-300"
                title={course.title}
              >
                {course.title}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
                Instructor
              </span>
              <span className="font-medium text-zinc-900 dark:text-white transition-colors duration-300">
                {course.instructor
                  ? `${course.instructor.firstname} ${course.instructor.lastname}`
                  : "Unknown"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
                Category
              </span>
              <span className="font-medium text-zinc-900 dark:text-white transition-colors duration-300">
                {course.category}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
                Price
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                {course.price && course.price > 0 ? `$${course.price}` : "Free"}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-[#3f3f46] transition-colors duration-300">
            <span className="text-zinc-500 dark:text-zinc-400 block mb-2 font-medium text-sm transition-colors duration-300">
              Short description
            </span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-[#3f3f46] p-4 rounded-xl border border-zinc-205 dark:border-[#52525b] transition-colors duration-300">
              {course.shortDescription || "No description provided."}
            </p>
          </div>

          {course.thumbnail && (
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-[#3f3f46] transition-colors duration-300">
              <span className="text-zinc-500 dark:text-zinc-400 block mb-2 font-medium text-sm transition-colors duration-300">
                Thumbnail
              </span>
              <div className="bg-zinc-50 dark:bg-[#3f3f46] p-2 rounded-xl border border-zinc-205 dark:border-[#52525b] transition-colors duration-300">
                <img
                  src={course.thumbnail}
                  alt="Thumbnail"
                  className="max-h-[200px] w-auto mx-auto rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Notes or Status */}
          <div className="px-6 py-6">
            {isActionable ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-505 dark:text-zinc-400 mb-1 transition-colors duration-300">
                  Rejection reason / notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-305 dark:border-[#3f3f46] rounded-xl p-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none resize-none h-28 transition-all"
                  placeholder="Provide internal notes or feedback for the instructor (required if rejecting)..."
                />
              </div>
            ) : (
              <div
                className={`p-6 rounded-2xl border transition-colors duration-300 ${
                  course.status === "PUBLISHED"
                    ? "bg-emerald-505/10 border-emerald-500/20"
                    : course.status === "REJECTED"
                      ? "bg-red-505/10 border-red-500/20"
                      : "bg-zinc-50 dark:bg-[#3f3f46] border-zinc-205 dark:border-[#52525b]"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {course.status === "PUBLISHED" ? (
                    <div className="bg-emerald-500 rounded-full p-1.5 animate-in zoom-in duration-300">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                  ) : course.status === "REJECTED" ? (
                    <div className="bg-red-500 rounded-full p-1.5 animate-in zoom-in duration-300">
                      <XCircle size={16} className="text-white" />
                    </div>
                  ) : (
                    <div className="bg-zinc-500 rounded-full p-1.5 animate-in zoom-in duration-300">
                      <BookOpen size={16} className="text-white" />
                    </div>
                  )}
                  <span
                    className={`text-lg font-semibold transition-colors duration-300 ${
                      course.status === "PUBLISHED"
                        ? "text-emerald-500 dark:text-emerald-400"
                        : course.status === "REJECTED"
                          ? "text-red-500 dark:text-red-400"
                          : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    Course {course.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium transition-colors duration-300">
                  {course.status === "DRAFT"
                    ? "This course is currently in draft and has not been submitted yet."
                    : `This course was processed on ${new Date(course.updatedAt).toLocaleDateString()}.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-[#1f1f22] flex justify-end gap-3 border-t border-zinc-200 dark:border-[#3f3f46] transition-colors duration-300">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-zinc-300 dark:border-[#52525b] text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-[#3f3f46] transition-colors duration-300"
          >
            Close
          </button>

          {isActionable && (
            <>
              <button
                onClick={() => onReject(course.id, notes)}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl border border-red-500/30 text-red-550 dark:text-red-400 text-sm font-medium hover:bg-red-500/10 disabled:opacity-50 transition-colors duration-300"
              >
                Reject
              </button>
              <button
                onClick={() => onApprove(course.id, notes)}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors duration-300"
              >
                Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCourseModal;
