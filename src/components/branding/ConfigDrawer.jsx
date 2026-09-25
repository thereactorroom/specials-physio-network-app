import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

// Raw JSON view of the current draft branding config.
export default function ConfigDrawer({ open, onOpenChange, draft }) {
  const [copied, setCopied] = useState(false);

  const json = useMemo(() => {
    if (!draft) return "";
    const { configured, ...config } = draft;
    return JSON.stringify(config, null, 2);
  }, [draft]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[440px] sm:max-w-[440px] bg-slate-900 border-slate-200/10 text-slate-50 p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-slate-200/10 flex-row items-center justify-between space-y-0">
          <SheetTitle className="font-jakarta text-white">Generated Config</SheetTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={copy}
            className="border-slate-200/20 bg-slate-950 hover:bg-slate-800 text-slate-200 gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </SheetHeader>
        <pre className="flex-1 overflow-auto m-0 p-5 font-jetbrains text-[11px] leading-relaxed text-emerald-100/90 bg-slate-950">
          {json}
        </pre>
      </SheetContent>
    </Sheet>
  );
}