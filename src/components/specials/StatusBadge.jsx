import { cn } from "@/lib/utils";

const statusConfig = {
  active: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  paused: { label: "Paused", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  expired: { label: "Expired", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.active;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", config.bg, config.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}