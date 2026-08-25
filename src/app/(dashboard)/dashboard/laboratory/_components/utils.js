/**
 * Correctly extract a list from backend paginated or direct responses.
 * Paginated:   axios.data = { code, status, message, data: { results: [...], pagination: {...} } }
 * Direct list: axios.data = { code, status, message, data: [...] }
 */
export function extractList(axiosResponse) {
  const payload = axiosResponse?.data?.data;
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  return [];
}

export function extractPagination(axiosResponse) {
  const payload = axiosResponse?.data?.data;
  if (payload && payload.pagination) return payload.pagination;
  return null;
}

export function formatApiError(err) {
  const resp = err.response?.data;
  if (!resp) return err.message || "An unexpected error occurred.";
  let msg = resp.message || "Validation failed.";
  if (resp.data && typeof resp.data === "object" && !Array.isArray(resp.data)) {
    const details = [];
    for (const [key, val] of Object.entries(resp.data)) {
      if (key === "pagination") continue;
      if (Array.isArray(val)) details.push(`${key}: ${val.join(", ")}`);
      else if (typeof val === "object") {
        const subs = Object.values(val).flatMap((v) => (Array.isArray(v) ? v : [String(v)]));
        details.push(`${key}: ${subs.join(", ")}`);
      } else details.push(`${key}: ${val}`);
    }
    if (details.length) msg += ` — ${details.join(" | ")}`;
  }
  return msg;
}

export function getStatusStyle(status) {
  switch (status) {
    case "ordered": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "sample_collected": case "collected": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "received": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "in_process": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "resulted": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
    case "verified": case "released": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "rejected": case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default: return "bg-slate-100 text-slate-700";
  }
}
