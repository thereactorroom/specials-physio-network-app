import { format } from "date-fns";
import { Pause, Play, X, Pencil, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";

export default function SpecialCard({ special, onEdit, onPause, onResume, onCancel, viewOnly }) {
  const navigate = useNavigate();
  const isActive = special.status === "active";
  const isPaused = special.status === "paused";

  const handlePreview = () => {
    sessionStorage.setItem("preview-special", JSON.stringify(special));
    navigate(`/specials/preview?id=${special.id}&view=true${viewOnly ? "&viewonly=true" : ""}`);
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{special.title}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-nowrap whitespace-nowrap">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Expires {special.end_date ? format(new Date(special.end_date), "MMM d, yyyy") : "—"}
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
              <Eye className="w-3 h-3 shrink-0" />
              Unique Views ({special.unique_views || 0})
            </span>
          </div>
        </div>
        <StatusBadge status={special.status} />
      </div>

      {special.image_url && (
        <img
          src={special.image_url}
          alt={special.title}
          className="w-full h-32 object-cover rounded-xl cursor-pointer"
          onClick={handlePreview}
        />
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreview}
          className="flex-1 rounded-xl h-9 text-xs font-medium gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </Button>
        {!viewOnly && isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPause(special)}
            className="flex-1 rounded-xl h-9 text-xs font-medium gap-1.5"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </Button>
        )}
        {!viewOnly && isPaused && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResume(special)}
            className="flex-1 rounded-xl h-9 text-xs font-medium gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <Play className="w-3.5 h-3.5" />
            Resume
          </Button>
        )}
        {!viewOnly && (isActive || isPaused) && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(special)}
              className="flex-1 rounded-xl h-9 text-xs font-medium gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(special)}
              className="rounded-xl h-9 text-xs font-medium gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}