import { FONT_PAIRS } from "@/lib/brandingConfig";

export default function FontsSection({ draft, onChange }) {
  const activePair = FONT_PAIRS.find((p) => p.heading === draft.heading_font && p.body === draft.body_font);
  return (
    <div className="space-y-2">
      {FONT_PAIRS.map((p) => {
        const selected = activePair?.id === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              onChange("heading_font", p.heading);
              onChange("body_font", p.body);
            }}
            className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
              selected
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-slate-200/15 bg-slate-950 hover:border-slate-200/30"
            }`}
          >
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${selected ? "text-emerald-400" : "text-slate-50"}`}>{p.label}</p>
              <p className="text-[10px] text-slate-400 truncate">{p.heading} headings · {p.body} body</p>
            </div>
            <span className="text-xl font-bold text-slate-300 shrink-0 ml-2" style={{ fontFamily: `"${p.heading}", sans-serif` }}>
              Aa
            </span>
          </button>
        );
      })}
    </div>
  );
}