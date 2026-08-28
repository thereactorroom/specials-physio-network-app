import { format } from "date-fns";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";

export default function HistoryCard({ special, onReuse }) {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50 opacity-90">
      {special.image_url && (
        <img src={special.image_url} alt={special.title} className="w-full h-32 object-cover" />
      )}
      <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{special.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {special.start_date && format(new Date(special.start_date), "MMM d")} — {special.end_date && format(new Date(special.end_date), "MMM d, yyyy")}
          </p>
        </div>
        <StatusBadge status={special.status} />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          onClick={() => onReuse(special)}
          className="w-full rounded-xl h-9 text-xs font-medium gap-1.5 bg-primary hover:bg-primary/90"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reuse Special
        </Button>
      </div>
      </div>
    </div>
  );
}