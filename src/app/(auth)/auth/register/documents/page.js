"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Loader2,
  Upload,
  CheckCircle,
  FileText,
  X,
  AlertCircle,
} from "lucide-react";
import { useRegistrationStore } from "@/store/meditek";
import { uploadApi } from "@/lib/api-client";

const REQUIRED_DOCS = [
  {
    key: "trade_licence",
    label: "Trade Licence",
    desc: "Valid trade/business licence from local authorities",
  },
  {
    key: "dghs_licence",
    label: "DGHS Licence",
    desc: "Directorate General of Health Services licence",
  },
  {
    key: "tin_bin_certificate",
    label: "TIN/BIN Certificate",
    desc: "Tax Identification Number or Business Identification Number",
  },
  {
    key: "nid_signatory",
    label: "NID of Signatory",
    desc: "National ID card of the authorized signatory",
  },
];

function DocUploadCard({ doc, onUploaded, onDelete, uploadedDocs }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const isUploaded = uploadedDocs[doc.key];

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("doc_type", doc.key);
    formData.append("file", file);
    try {
      await uploadApi.post("/public/register/documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(doc.key, file.name);
      toast.success(`${doc.label} uploaded successfully.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to upload ${doc.label}.`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await uploadApi.delete(`/public/register/documents/${doc.key}/`);
      onDelete(doc.key);
      toast.success(`${doc.label} removed.`);
    } catch {
      toast.error("Failed to remove document.");
    }
  };

  return (
    <div
      className={`border-2 rounded-xl p-4 transition-all ${
        isUploaded
          ? "border-teal-300 bg-teal-50"
          : "border-slate-200 bg-white hover:border-teal-300"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isUploaded ? "bg-teal-600" : "bg-slate-100"
            }`}
          >
            {isUploaded ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <FileText className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{doc.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{doc.desc}</p>
            {isUploaded && (
              <p className="text-xs text-teal-600 mt-1 font-medium truncate max-w-[180px]">
                ✓ {isUploaded}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isUploaded ? (
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              title="Remove document"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? "Uploading..." : "Upload"}
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

export default function DocumentsPage() {
  const router = useRouter();
  const { steps, setDocsUploaded } = useRegistrationStore();
  const [uploadedDocs, setUploadedDocs] = useState({});

  const allUploaded = REQUIRED_DOCS.every((d) => uploadedDocs[d.key]);

  const handleUploaded = (key, filename) => {
    setUploadedDocs((prev) => ({ ...prev, [key]: filename }));
  };

  const handleDelete = (key) => {
    setUploadedDocs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleContinue = () => {
    if (!allUploaded) {
      toast.error("Please upload all required documents before continuing.");
      return;
    }
    setDocsUploaded();
    router.push("/auth/register/plan");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Upload Documents</h1>
        <p className="mt-2 text-slate-500">
          Step 3 of 5 — Upload your hospital&apos;s verification documents. All 4 are required.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Documents are reviewed by our team within <strong>1-2 business days</strong>. 
          You&apos;ll receive an email once approved. Accepted formats: PDF, JPG, PNG.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {REQUIRED_DOCS.map((doc) => (
          <DocUploadCard
            key={doc.key}
            doc={doc}
            onUploaded={handleUploaded}
            onDelete={handleDelete}
            uploadedDocs={uploadedDocs}
          />
        ))}
      </div>

      {allUploaded && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" />
          <p className="text-sm text-teal-800">
            All documents uploaded! Click Continue to select your plan.
          </p>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!allUploaded}
        className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        Continue to Plan Selection →
      </button>

      <button
        onClick={() => router.push("/auth/register/verify")}
        className="w-full mt-3 py-2.5 text-slate-500 text-sm hover:text-slate-700 transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}
