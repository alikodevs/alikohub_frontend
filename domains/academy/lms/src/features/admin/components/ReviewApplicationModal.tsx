import React, { useState } from "react";
import type { TeacherApplication } from "@/types/academy";
import { CheckCircle, XCircle } from "lucide-react";

interface ReviewModalProps {
  application: TeacherApplication | null;
  onClose: () => void;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, notes: string) => void;
  isProcessing: boolean;
}

const ReviewApplicationModal: React.FC<ReviewModalProps> = ({
  application,
  onClose,
  onApprove,
  onReject,
  isProcessing,
}) => {
  const [notes, setNotes] = useState("");

  if (!application) return null;

  const department =
    application.formData?.teachingCategories &&
    application.formData.teachingCategories.length > 0
      ? application.formData.teachingCategories.join(", ")
      : "General";

  const isActionable =
    application.status === "PENDING" || application.status === "SUBMITTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#27272a] w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-[#3f3f46] overflow-hidden shadow-2xl transition-colors duration-300">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white transition-colors duration-300">
            Review teacher application
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
            You are about to review this candidate
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
                Name
              </span>
              <span className="font-medium text-zinc-900 dark:text-white transition-colors duration-300">
                {application.user?.firstname} {application.user?.lastname}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
                Email
              </span>
              <span className="font-medium text-zinc-900 dark:text-white transition-colors duration-300">
                {application.user?.email}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
                Department
              </span>
              <span className="font-medium text-zinc-900 dark:text-white transition-colors duration-300">
                {department}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
                Resume
              </span>
              {application.formData?.resumeUrl ? (
                <a
                  href={application.formData.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-500 dark:text-emerald-400 font-semibold hover:underline bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md text-xs transition-colors duration-300"
                >
                  View resume
                </a>
              ) : (
                <span className="text-zinc-500">Not provided</span>
              )}
            </div>

            {application.formData?.documents &&
              application.formData.documents.length > 0 && (
                <div className="pt-2">
                  <span className="text-zinc-500 dark:text-zinc-400 block mb-2 font-medium transition-colors duration-300">
                    Supporting documents
                  </span>
                  <div className="space-y-2">
                    {application.formData.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-zinc-55 dark:bg-[#3f3f46] p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-[#52525b] transition-colors border border-zinc-200 dark:border-[#52525b] group"
                      >
                        <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[200px] text-xs font-medium transition-colors duration-300">
                          {doc.name || `Document ${idx + 1}`}
                        </span>
                        <span className="text-emerald-55 dark:text-emerald-400 font-medium text-[10px] uppercase group-hover:underline">
                          View
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

            {application.formData?.interviewResponses &&
              application.formData.interviewResponses.length > 0 && (
                <div className="pt-2">
                  <span className="text-zinc-550 dark:text-zinc-400 block mb-2 font-medium transition-colors duration-300">
                    Interview responses
                  </span>
                  <div className="space-y-4">
                    {application.formData.interviewResponses.map((res, i) => (
                      <div
                        key={i}
                        className="bg-zinc-50 dark:bg-[#3f3f46] p-4 rounded-lg border border-zinc-200 dark:border-[#52525b] transition-colors duration-300"
                      >
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1 transition-colors duration-300">
                          {res.question}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed transition-colors duration-300">
                          {res.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Notes or Status */}
          <div className="px-6 py-6">
            {isActionable ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 transition-colors duration-300">
                  Reviewer notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-[#3f3f46] rounded-xl p-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none resize-none h-28 transition-all"
                  placeholder="Provide internal notes or feedback for the candidate..."
                />
              </div>
            ) : (
              <div
                className={`p-6 rounded-2xl border transition-colors duration-300 ${
                  application.status === "ACCEPTED" ||
                  application.status === "APPROVED"
                    ? "bg-emerald-55/10 border-emerald-500/20"
                    : "bg-red-55/10 border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {application.status === "ACCEPTED" ||
                  application.status === "APPROVED" ? (
                    <div className="bg-emerald-500 rounded-full p-1.5 animate-in zoom-in duration-300">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                  ) : (
                    <div className="bg-red-505 rounded-full p-1.5 animate-in zoom-in duration-300">
                      <XCircle size={16} className="text-white" />
                    </div>
                  )}
                  <span
                    className={`text-lg font-semibold transition-colors duration-300 ${
                      application.status === "ACCEPTED" ||
                      application.status === "APPROVED"
                        ? "text-emerald-500 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"
                    }`}
                  >
                    Application {application.status}
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium transition-colors duration-300">
                  This application was processed on{" "}
                  {new Date(application.updatedAt).toLocaleDateString()}.
                </p>
                {application.reviewNotes && (
                  <div className="mt-4 p-4 bg-zinc-50 dark:bg-[#18181b] rounded-lg text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#3f3f46] transition-colors duration-300">
                    <p className="font-semibold text-xs text-zinc-450 dark:text-zinc-500 uppercase mb-1 transition-colors duration-300">
                      Notes
                    </p>
                    <p>{application.reviewNotes}</p>
                  </div>
                )}
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
                onClick={() => onReject(application.id, notes)}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl border border-red-500/30 text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-500/10 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => onApprove(application.id, notes)}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
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

export default ReviewApplicationModal;
