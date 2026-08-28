import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, Utensils, Scissors, ShoppingBag, Heart, Calendar, Zap, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CommunityTile from "@/components/specials/CommunityTile";
import MostViewedSection from "@/components/specials/MostViewedSection";
import PullToRefresh from "@/components/PullToRefresh";
import { getParamCaseInsensitive } from "@/lib/urlParams";
import { useIsAdmin } from "@/lib/fusionAdminStore";

const filters = [
  { key: "all", label: "All", icon: LayoutGrid },
  { key: "food_drink", label: "Food & Drink", icon: Utensils },
  { key: "services", label: "Services", icon: Scissors },
  { key: "retail", label: "Retail", icon: ShoppingBag },
  { key: "health_fitness", label: "Health & Fitness", icon: Heart },
  { key: "events", label: "Events", icon: Calendar },
  { key: "today_only", label: "Today Only", icon: Zap },
];

export default function CommunityView() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const isAdmin = useIsAdmin();

  const buildQuery = () => {
    const params = [];
    const fId = getParamCaseInsensitive("fID");
    const businessId = getParamCaseInsensitive("BusinessID");
    const business = getParamCaseInsensitive("business");
    const admin = getParamCaseInsensitive("Admin");
    if (fId) params.push(`fID=${encodeURIComponent(fId)}`);
    if (businessId) params.push(`BusinessID=${encodeURIComponent(businessId)}`);
    if (business) params.push(`business=${encodeURIComponent(business)}`);
    if (admin) params.push(`Admin=${encodeURIComponent(admin)}`);
    return params.length ? `?${params.join("&")}` : "";
  };

  const handleAllViewsLog = () => {
    navigate(`/admin/views${buildQuery()}`);
  };

  const { data: specials = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["community-specials"],
    queryFn: () => base44.entities.Special.filter({ status: "active" }, "-created_date"),
    initialData: [],
  });

  const isRefreshing = isFetching && !isLoading;

  const filtered = specials.filter((s) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "today_only") return s.today_only === true;
    return s.category === activeFilter;
  });

  const counts = {
    all: specials.length,
    food_drink: specials.filter((s) => s.category === "food_drink").length,
    services: specials.filter((s) => s.category === "services").length,
    retail: specials.filter((s) => s.category === "retail").length,
    health_fitness: specials.filter((s) => s.category === "health_fitness").length,
    events: specials.filter((s) => s.category === "events").length,
    today_only: specials.filter((s) => s.today_only === true).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-lg mx-auto px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">Community Specials</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exclusive offers from businesses we know and trust in our community
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleAllViewsLog}
                className="shrink-0 inline-flex items-center bg-slate-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-full leading-none shadow-md hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Admin
              </button>
            )}
          </div>
        </div>
        <div className="max-w-lg mx-auto py-2.5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar touch-pan-x px-4">
            {filters.map((f) => {
              const Icon = f.icon;
              const count = counts[f.key] || 0;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeFilter === f.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card text-muted-foreground border border-border/50 hover:bg-muted"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {f.label}
                  {count > 0 && (
                    <span className={`ml-0.5 text-[10px] ${activeFilter === f.key ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8 pt-4 space-y-5">
        <PullToRefresh onRefresh={refetch} isRefreshing={isRefreshing}>
          <div className="space-y-4">
            {/* Top Rated summary */}
            {activeFilter === "all" && <MostViewedSection specials={specials} />}

            {/* Specials */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-card rounded-2xl p-10 text-center border border-dashed border-border">
                <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No specials yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Check back soon for exclusive community offers</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filtered.map((special, i) => (
                    <motion.div
                      key={special.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <CommunityTile special={special} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}