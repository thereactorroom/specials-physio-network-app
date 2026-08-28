import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UtensilsCrossed, Wrench, ShoppingBag, Dumbbell, PartyPopper } from "lucide-react";

const categories = [
  { value: "food_drink", label: "Food & Drink", icon: UtensilsCrossed },
  { value: "services", label: "Services", icon: Wrench },
  { value: "retail", label: "Retail", icon: ShoppingBag },
  { value: "health_fitness", label: "Health & Fitness", icon: Dumbbell },
  { value: "events", label: "Events", icon: PartyPopper },
];

export default function CategorySelect({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-12 rounded-xl bg-card text-base">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <SelectItem key={cat.value} value={cat.value}>
              <span className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                {cat.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}