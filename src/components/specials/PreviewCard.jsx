import { format } from "date-fns";
import { MapPin, Calendar, Tag, Eye } from "lucide-react";

const categoryLabels = {
  food_drink: "Food & Drink",
  services: "Services",
  retail: "Retail",
  health_fitness: "Health & Fitness",
  events: "Events",
};

const offerTypeLabels = {
  discount: "Discount",
  value_add: "Value Add",
  limited_time: "Limited Time",
  event: "Event",
};

export default function PreviewCard({ special }) {
  return (
    <div className="bg-card rounded-3xl overflow-hidden shadow-lg border border-border/30">
      {special.image_url ? (
        <img
          src={special.image_url}
          alt={special.title}
          className="w-full object-contain h-auto"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 flex items-center justify-center">
          <Tag className="w-12 h-12 text-primary/30" />
        </div>
      )}

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{special.business_name}</span>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground leading-tight">{special.title || "Your Offer Title"}</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {special.description || "Your offer description will appear here..."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {special.category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
              {categoryLabels[special.category]}
            </span>
          )}
          {special.offer_type && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
              {offerTypeLabels[special.offer_type]}
            </span>
          )}
          {special.today_only && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-xs font-medium text-accent">
              Today Only
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {special.start_date ? format(new Date(special.start_date), "MMM d") : "Start"} — {special.end_date ? format(new Date(special.end_date), "MMM d, yyyy") : "End"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/30">
          <Eye className="w-3.5 h-3.5" />
          <span>Unique Views</span>
          <span className="font-medium text-foreground">({special.unique_views || 0})</span>
        </div>
      </div>
    </div>
  );
}