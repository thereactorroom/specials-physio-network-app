// Status badge for the Branding Engine: shows whether a tenant config
// has been saved (Active Tenant) or the app is still running on defaults.
export default function StatusBadge({ configured }) {
  return configured ? (
    <span className="inline-flex items-center gap-1.5 shrink-0 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Active Tenant
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 shrink-0 text-[11px] font-semibold text-slate-400 bg-slate-400/10 border border-slate-400/30 rounded-full px-2.5 py-1 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Unconfigured
    </span>
  );
}