import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Type, Palette, CaseSensitive } from "lucide-react";
import IdentitySection from "./IdentitySection";
import PaletteSection from "./PaletteSection";
import FontsSection from "./FontsSection";

function Section({ icon: Icon, title, children }) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="w-full flex items-center gap-2 px-4 py-3.5 hover:bg-slate-800/40 text-left transition-colors">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="font-jakarta font-semibold text-sm text-white">{title}</span>
        <ChevronDown className="ml-auto w-4 h-4 text-slate-400" />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-5">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export default function ConfigRail({ draft, onChange }) {
  return (
    <div className="divide-y divide-slate-200/10">
      <Section icon={Type} title="App Basics">
        <IdentitySection draft={draft} onChange={onChange} />
      </Section>
      <Section icon={Palette} title="Theme Colors">
        <PaletteSection draft={draft} onChange={onChange} />
      </Section>
      <Section icon={CaseSensitive} title="Typography">
        <FontsSection draft={draft} onChange={onChange} />
      </Section>
    </div>
  );
}