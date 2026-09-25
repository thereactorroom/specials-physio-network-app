import { Input } from "@/components/ui/input";

const inputCls =
  "h-10 bg-slate-950 border-slate-200/15 text-slate-50 placeholder:text-slate-500 rounded-lg text-sm";

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export default function IdentitySection({ draft, onChange }) {
  return (
    <div className="space-y-3">
      <Field label="App Name">
        <Input
          value={draft.app_name}
          onChange={(e) => onChange("app_name", e.target.value)}
          placeholder="e.g. Dolphin Coast Specials"
          className={inputCls}
        />
      </Field>
      <Field label="Tagline">
        <Input
          value={draft.tagline}
          onChange={(e) => onChange("tagline", e.target.value)}
          placeholder="Short community tagline"
          className={inputCls}
        />
      </Field>
      <Field label="Logo URL">
        <Input
          value={draft.logo_url}
          onChange={(e) => onChange("logo_url", e.target.value)}
          placeholder="https://…"
          className={inputCls}
        />
      </Field>
      {draft.logo_url && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200/15 bg-slate-950 p-2">
          <img src={draft.logo_url} alt="Logo preview" className="w-8 h-8 rounded-md object-cover" />
          <span className="text-[11px] text-slate-400 truncate">Logo preview</span>
        </div>
      )}
    </div>
  );
}