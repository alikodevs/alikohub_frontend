import { Layout, Upload, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Course } from "@/types/academy";

interface BasicInfoTabProps {
  formData: {
    title: string;
    shortDescription: string;
    category: string;
    price: string;
    priceInUsd: string;
    thumbnail: File | null;
  };
  course?: Course;
  onFormDataChange: (data: any) => void;
}

export const BasicInfoTab = ({
  formData,
  course,
  onFormDataChange,
}: BasicInfoTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#2b5f9e]" /> Course Information
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Course Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  onFormDataChange({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Mastering React and Advanced Design Patterns"
                className="h-12"
              />
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Your title should be catchy and include keywords to help
                students find your course.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Short Description
              </label>
              <Textarea
                value={formData.shortDescription}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    shortDescription: e.target.value,
                  })
                }
                placeholder="A brief summary that appears in search results and cards."
                className="resize-none min-h-[80px]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#2b5f9e]" /> Pricing
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Price (ETB)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Br</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formData.price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                      onFormDataChange({ ...formData, price: val });
                    }
                  }}
                  placeholder="0.00"
                  className="pl-10 h-12"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Used for Chapa (local) payments. Set to 0 for a free course.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Price in USD
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formData.priceInUsd}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                      onFormDataChange({ ...formData, priceInUsd: val });
                    }
                  }}
                  placeholder="0.00"
                  className="pl-8 h-12"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Used for Stripe (international) payments. Set to 0 for a free course.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Course Meta</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  onFormDataChange({ ...formData, category: e.target.value })
                }
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-accent outline-none appearance-none cursor-pointer"
              >
                <option value="Health">Health</option>
                <option value="Technology">Technology</option>
                <option value="STEM">STEM</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">
            Course Cover
          </h2>
          <div
            className="relative aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:border-accent group cursor-pointer transition-all"
            onClick={() => document.getElementById("thumbnail-upload")?.click()}
          >
            {course?.thumbnail && !formData.thumbnail ? (
              <img
                src={course.thumbnail}
                className="w-full h-full object-cover"
                alt="Course thumbnail"
              />
            ) : formData.thumbnail ? (
              <img
                src={URL.createObjectURL(formData.thumbnail)}
                className="w-full h-full object-cover"
                alt="Preview"
              />
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-300 group-hover:text-[#2b5f9e] transition-colors" />
                <p className="text-[10px] uppercase font-bold text-slate-400 mt-2">
                  Upload Image
                </p>
              </>
            )}
            <input
              type="file"
              id="thumbnail-upload"
              className="hidden"
              accept="image/*"
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  thumbnail: e.target.files?.[0] || null,
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
