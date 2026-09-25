import { useEffect } from "react";
import { Sparkles, Users, BarChart3, ArrowRight } from "lucide-react";
import { ensureFontsLoaded, normalizeHex } from "@/lib/brandingConfig";

// Live mock of the tenant app rendered inside a browser frame. Reads the
// draft config directly so every input change is reflected instantly.
export default function LivePreview({ draft, mobile = false }) {
  const dark = draft.theme_mode === "dark";
  const canvas = dark ? "#0f172a" : "#f8fafc";
  const surface = dark ? "#1e293b" : "#ffffff";
  const text = dark ? "#e2e8f0" : "#0f172a";
  const subtle = dark ? "#94a3b8" : "#64748b";
  const line = dark ? "#334155" : "#e2e8f0";
  const primary = normalizeHex(draft.primary_color);
  const accent = normalizeHex(draft.accent_color);
  const heading = `"${draft.heading_font}", sans-serif`;
  const body = `"${draft.body_font}", sans-serif`;

  useEffect(() => {
    ensureFontsLoaded([draft.heading_font, draft.body_font]);
  }, [draft.heading_font, draft.body_font]);

  const features = [
    { icon: Sparkles, title: "Create Specials", text: "Post offers in minutes with a guided flow." },
    { icon: Users, title: "Community Feed", text: "Members browse and redeem instantly." },
    { icon: BarChart3, title: "View Insights", text: "Track unique views per offer." },
  ];

  const slug = (draft.app_name || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "app";

  return (
    <div className={`w-full ${mobile ? "max-w-[390px]" : "max-w-3xl"} mx-auto`}>
      <div className="rounded-xl overflow-hidden border border-slate-200/20 shadow-2xl shadow-black/40 bg-slate-900">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-200/10">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400/60" />
          </div>
          <div className="flex-1 flex justify-center">
            <span className="font-jetbrains text-[10px] text-slate-400 bg-slate-950 rounded-md px-3 py-1 border border-slate-200/10 truncate max-w-[220px]">
              {slug}.base44.app
            </span>
          </div>
          <div className="w-10 shrink-0" />
        </div>

        {/* Tenant app */}
        <div style={{ background: canvas, color: text, fontFamily: body }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: line, background: surface }}>
            {draft.logo_url ? (
              <img src={draft.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: primary }}>
                {(draft.app_name || "A").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold leading-tight truncate" style={{ fontFamily: heading }}>
                {draft.app_name || "Your App"}
              </p>
              <p className="text-[11px] truncate" style={{ color: subtle }}>Community offers</p>
            </div>
          </div>

          {/* Hero */}
          <div className="px-6 py-10 text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
            <p className="text-[11px] uppercase tracking-widest opacity-80">Today's picks</p>
            <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: heading }}>
              {draft.app_name || "Your App"}
            </h2>
            <p className="text-sm opacity-90 mt-1 max-w-md">{draft.tagline || "Your tagline appears here."}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold bg-white/15 rounded-full px-5 py-2">
              Browse Specials <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Feature cards */}
          <div className={`px-6 py-8 grid gap-4 ${mobile ? "grid-cols-1" : "grid-cols-3"}`}>
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl p-5 border" style={{ background: surface, borderColor: line }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${primary}1a`, color: primary }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold mt-3 text-sm" style={{ fontFamily: heading }}>{f.title}</p>
                  <p className="text-xs mt-1" style={{ color: subtle }}>{f.text}</p>
                  <span
                    className="inline-block mt-3 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5"
                    style={{ background: `${accent}1a`, color: accent }}
                  >
                    {f.title.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 text-[11px] border-t" style={{ borderColor: line, color: subtle, background: surface }}>
            © {new Date().getFullYear()} {draft.app_name || "Your App"} — Powered by the Specials Master Template
          </div>
        </div>
      </div>
    </div>
  );
}