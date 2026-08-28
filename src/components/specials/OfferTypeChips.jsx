import { cn } from "@/lib/utils";
import { Percent, Gift, Clock, CalendarHeart } from "lucide-react";

const offerTypes = [
  { value: "discount", label: "Discount", icon: Percent },
  { value: "value_add", label: "Value Add", icon: Gift },
  { value: "limited_time", label: "Limited Time", icon: Clock },
  { value: "event", label: "Event", icon: CalendarHeart },
];

export default function OfferTypeChips({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {offerTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isSelected
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                : "bg-card text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {type.label}
          </button>
        );
      })}
    </div>
  );
}