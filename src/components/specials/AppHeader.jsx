import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AppHeader({ title, subtitle, businessName, showBack = false, backTo }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            className="w-9 h-9 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground font-heading">{title}</h1>
          {businessName && <p className="text-xs font-semibold text-foreground/70 mt-0.5">{businessName}</p>}
          {subtitle && <p className="text-xs text-muted-foreground mt-0">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}