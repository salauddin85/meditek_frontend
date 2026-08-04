"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Building2, User, Mail, Phone, MapPin } from "lucide-react";
import { useRegistrationStore } from "@/store/meditek";
import apiClient from "@/lib/api-client";

const DISTRICTS = [
  "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barishal", "Rangpur", "Mymensingh",
  "Gazipur", "Narayanganj", "Comilla", "Cox's Bazar", "Jessore", "Bogura", "Dinajpur",
];

const DIVISIONS = [
  "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barishal", "Rangpur", "Mymensingh",
];

const ORG_TYPES = [
  { value: "hospital", label: "Hospital" },
  { value: "clinic", label: "Clinic" },
  { value: "diagnostic_center", label: "Diagnostic Center" },
  { value: "multispecialty", label: "Multispecialty" },
];

export default function OrgInfoStep() {
  const router = useRouter();
  const { setInitiation, setOrgInfo } = useRegistrationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      org_type: "hospital",
      district: "Dhaka",
      division: "Dhaka",
    },
  });

  const slugValue = watch("slug", "");

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/public/register/", {
        name: data.name,
        slug: data.slug.toLowerCase().trim(),
        org_type: data.org_type,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        district: data.district,
        division: data.division,
        password: data.password,
      });
      const { registration_id, tenant_id, access_token, slug } = res.data.data;
      setInitiation({ registration_id, tenant_id, access_token, slug });
      setOrgInfo(data);
      toast.success("Registration started! Check your email for the verification link.");
      router.push("/auth/register/verify");
    } catch (err) {
      console.error("Registration error:", err);
      const resData = err?.response?.data;
      const msg = resData?.message || err?.userMessage || "Registration failed.";
      const fieldErrors = resData?.data || {};

      if (fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msgs]) => {
          const fieldMsg = Array.isArray(msgs) ? msgs[0] : msgs;
          setError(field, { type: "server", message: fieldMsg });
          toast.error(`${field}: ${fieldMsg}`);
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Register Your Organization</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Step 1 of 5 — Tell us about your healthcare facility.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Organization Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
            <Building2 className="inline w-4 h-4 mr-1 text-[#00A67E]" />
            Organization Name *
          </label>
          <input
            {...register("name", { required: "Organization name is required" })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A67E]/30 focus:border-[#00A67E] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="e.g. City General Hospital"
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {/* Subdomain Slug */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Workspace Subdomain *
          </label>
          <div className="flex items-center border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary bg-background">
            <input
              {...register("slug", {
                required: "Subdomain is required",
                pattern: {
                  value: /^[a-z0-9][a-z0-9-]{2,30}$/,
                  message: "3-31 chars, lowercase letters, numbers and hyphens only",
                },
              })}
              className="flex-1 px-4 py-2.5 text-sm focus:outline-none"
              placeholder="citycare"
            />
            <span className="px-3 py-2.5 bg-muted text-muted-foreground text-sm border-l border-border">
              .meditek.com
            </span>
          </div>
          {slugValue && (
            <p className="mt-1 text-xs text-primary">
              Your workspace: <strong>{slugValue.toLowerCase()}.meditek.com</strong>
            </p>
          )}
          {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
        </div>

        {/* Org Type */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Organization Type *
          </label>
          <select
            {...register("org_type", { required: true })}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          >
            {ORG_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            <User className="inline w-4 h-4 mr-1 text-primary" />
            Contact Person *
          </label>
          <input
            {...register("contact_person", { required: "Contact person is required" })}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            placeholder="Dr. Rafiq Hassan"
          />
          {errors.contact_person && <p className="mt-1 text-xs text-destructive">{errors.contact_person.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            <Mail className="inline w-4 h-4 mr-1 text-primary" />
            Official Email *
          </label>
          <input
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address" },
            })}
            type="email"
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            placeholder="admin@citycarehospital.com"
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            <Phone className="inline w-4 h-4 mr-1 text-primary" />
            Phone Number *
          </label>
          <input
            {...register("phone", { required: "Phone is required" })}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            placeholder="+8801XXXXXXXXX"
          />
          {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
        </div>

        {/* Initial Admin Password */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Admin Password *
          </label>
          <input
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "Password must be at least 6 characters" },
            })}
            type="password"
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            placeholder="Create an admin password"
          />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {/* Division & District */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              <MapPin className="inline w-4 h-4 mr-1 text-[#00A67E]" />
              Division *
            </label>
            <select
              {...register("division", { required: true })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00A67E]/30 focus:border-[#00A67E] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">District *</label>
            <select
              {...register("district", { required: true })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00A67E]/30 focus:border-[#00A67E] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-[#00A67E] font-semibold text-white shadow-[0_6px_20px_rgba(0,166,126,0.25)] transition-all hover:bg-[#008A6A] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Continue to Email Verification →"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        Already registered?{" "}
        <a href="/auth/tenant-login" className="font-semibold text-[#00A67E] hover:text-[#008A6A] hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
