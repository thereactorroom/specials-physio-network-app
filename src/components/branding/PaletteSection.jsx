import { Input } from "@/components/ui/input";
import { COLOR_PRESETS, THEME_MODES, normalizeHex } from "@/lib/brandingConfig";

function ColorField({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <label
          className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200/20 shrink-0 cursor-pointer"
          style={{ background: normalizeHex(value) }}
        >
          <input
            type="color"
            value={normalizeHex(value)}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 font-jetbrains text-xs uppercase bg-slate-950 border-slate-200/15 text-slate-50 rounded-lg"
        />
      </div>
    </div>
  );
}

export default function PaletteSection({ draft, onChange }) {
  return (
    <div className="space-y-4">
      <ColorField label="Primary" value={draft.primary_color} onChange={(v) => onChange("primary_color", v)} />
      <ColorField label="Accent" value={draft.accent_color} onChange={(v) => onChange("accent_color", v)} />

      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Presets</span>
        <div className="grid grid-cols-5 gap-2">
          {COLOR_PRESETS.map((p) => {
            const active = normalizeHex(p.primary) === normalizeHex(draft.primary_color) && normalizeHex(p.accent) === normalizeHex(draft.accent_color);
            return (
              <button
                key={p.label}
                type="button"
                title={p.label}
                onClick={() => {
                  onChange("primary_color", p.primary);
                  onChange("accent_color", p.accent);
                }}
                className={`h-9 rounded-lg border transition-transform hover:scale-105 ${
                  active ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-200/20"
                }`}
                style={{ background: `linear-gradient(135deg, ${p.primary} 0%, ${p.primary} 50%, ${p.accent} 50%, ${p.accent} 100%)` }}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Background</span>
        <div className="grid grid-cols-2 gap-2">
          {THEME_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange("theme_mode", m.value)}
              className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                draft.theme_mode === m.value
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                  : "border-slate-200/15 bg-slate-950 text-slate-300 hover:border-slate-200/30"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}