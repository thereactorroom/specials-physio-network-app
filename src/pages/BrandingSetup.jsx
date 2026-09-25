import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Monitor, Smartphone, Save, Download, RotateCcw, Code2, Eye, Check, ChevronLeft } from "lucide-react";
import { useBranding } from "@/lib/brandingContext";
import { DEFAULT_BRANDING } from "@/lib/brandingConfig";
import { getParamCaseInsensitive } from "@/lib/urlParams";
import ConfigRail from "@/components/branding/ConfigRail";
import LivePreview from "@/components/branding/LivePreview";
import ConfigDrawer from "@/components/branding/ConfigDrawer";
import StatusBadge from "@/components/branding/StatusBadge";

export default function BrandingSetup() {
  const navigate = useNavigate();
  const { branding, isConfigured, isLoading, saveConfig } = useBranding();
  const [draft, setDraft] = useState(null);
  const [snapshot, setSnapshot] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const adminParam = getParamCaseInsensitive("Admin");
  const backUrl = `/admin/views${adminParam ? `?Admin=${adminParam}` : ""}`;

  useEffect(() => {
    if (!isLoading && draft === null) {
      const d = { ...branding };
      setDraft(d);
      setSnapshot(JSON.stringify(d));
    }
  }, [isLoading, branding, draft]);

  if (isLoading || draft === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  const update = (field, value) => {
    setDraft((d) => ({ ...d, [field]: value }));
    setSaved(false);
  };
  const dirty = JSON.stringify(draft) !== snapshot;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig(draft);
      setSnapshot(JSON.stringify(draft));
      setSaved(true);
      toast.success("Branding config saved — this tenant is now active.");
    } catch (e) {
      toast.error(e?.message || "Could not save the config.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const { configured, ...config } = draft;
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(draft.app_name || "tenant").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-branding.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_BRANDING });
    setSaved(false);
    toast.info("Reset to Dolphin Coast defaults — press Save to apply.");
  };

  const saveIcon = saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* ── Mobile ─────────────────────────────────────────────── */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-200/10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(backUrl)}
            className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-200/15 flex items-center justify-center shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </button>
          <h1 className="font-jakarta font-bold text-sm text-white flex-1 min-w-0 truncate">Branding Engine</h1>
          <StatusBadge configured={isConfigured} />
        </div>
        <div className="flex-1">
          <ConfigRail draft={draft} onChange={update} />
        </div>
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-200/10 p-4 flex gap-3">
          <Button
            variant="outline"
            onClick={() => setSheetOpen(true)}
            className="flex-1 h-11 rounded-xl border-slate-200/20 bg-slate-950 text-slate-200 gap-2"
          >
            <Eye className="w-4 h-4" /> Preview Tenant App
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 rounded-xl gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          >
            {saveIcon}
            Save & Lock Config
          </Button>
        </div>
      </div>

      {/* ── Desktop ────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        <aside className="w-[400px] shrink-0 flex flex-col h-full border-r border-slate-200/10 bg-slate-900">
          <div className="p-5 border-b border-slate-200/10 flex items-start justify-between gap-3">
            <div>
              <h1 className="font-jakarta font-bold text-lg text-white leading-tight">Master Template Branding Engine</h1>
              <p className="text-xs text-slate-400 mt-1">Tenant identity, palette & typography — previews live.</p>
            </div>
            <StatusBadge configured={isConfigured} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConfigRail draft={draft} onChange={update} />
          </div>
          <div className="p-4 border-t border-slate-200/10 space-y-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-11 rounded-xl gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
              {saveIcon}
              {saved ? "Config Saved" : "Apply & Save Config"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                className="h-10 rounded-xl border-slate-200/20 bg-slate-950 text-slate-200 gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" /> Export JSON
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="h-10 rounded-xl border-slate-200/20 bg-slate-950 text-slate-200 gap-1.5 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200/10">
            <div className="flex rounded-lg border border-slate-200/15 overflow-hidden">
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={`inline-flex items-center gap-1.5 px-3 h-9 text-xs font-semibold transition-colors ${
                  previewMode === "desktop" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={`inline-flex items-center gap-1.5 px-3 h-9 text-xs font-semibold transition-colors ${
                  previewMode === "mobile" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${dirty ? "animate-pulse" : ""}`} />
              {dirty ? "Live sync" : "Synced"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="border-slate-200/20 bg-slate-900 text-slate-200 hover:bg-slate-800 gap-1.5 rounded-lg"
            >
              <Code2 className="w-3.5 h-3.5" /> View Generated Config
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <LivePreview draft={draft} mobile={previewMode === "mobile"} />
          </div>
        </main>
      </div>

      <ConfigDrawer open={drawerOpen} onOpenChange={setDrawerOpen} draft={draft} />

      {/* Mobile full-height preview sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[92vh] bg-slate-950 border-slate-200/10 p-0 flex flex-col rounded-t-2xl">
          <SheetHeader className="px-4 py-3 border-b border-slate-200/10 space-y-0">
            <SheetTitle className="font-jakarta text-white text-sm">Tenant Preview</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-4">
            <LivePreview draft={draft} mobile />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}