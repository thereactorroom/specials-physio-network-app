import { useNavigate } from "react-router-dom";
import { getBusinessContext } from "@/lib/urlParams";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Archive, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppHeader from "@/components/specials/AppHeader";
import HistoryCard from "@/components/specials/HistoryCard";

export default function HistorySpecials() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { fId, businessId, businessName: businessFromUrl } = getBusinessContext();
  if (businessFromUrl) sessionStorage.setItem("app_business", businessFromUrl);
  const businessParam = businessFromUrl || sessionStorage.getItem("app_business");
  const buildNavQuery = () => {
    const params = [];
    if (fId > 0) params.push(`fID=${fId}`);
    if (businessId > 0) params.push(`BusinessID=${businessId}`);
    if (businessParam) params.push(`business=${encodeURIComponent(businessParam)}`);
    return params.length ? `?${params.join("&")}` : "";
  };
  const businessQuery = buildNavQuery();

  const { data: specials = [], isLoading } = useQuery({
    queryKey: ["specials-history", businessId, businessParam],
    queryFn: () => {
      const filter = { status: { $in: ["expired", "cancelled"] } };
      if (businessId > 0) filter.business_id = businessId;
      else if (businessParam) filter.business_name = businessParam;
      return base44.entities.Special.filter(filter, "-created_date");
    },
    initialData: [],
  });

  const handleReuse = (special) => {
    const today = format(new Date(), "yyyy-MM-dd");
    sessionStorage.setItem("repost-special", JSON.stringify({
      business_name: special.business_name,
      business_id: special.business_id || businessId || 0,
      f_id: special.f_id || fId || 0,
      title: special.title,
      description: special.description,
      category: special.category,
      offer_type: special.offer_type,
      start_date: today,
      end_date: today,
      today_only: false,
      image_url: special.image_url || "",
    }));
    const query = businessQuery ? `&${businessQuery.slice(1)}` : "";
    navigate(`/specials/create?repost=true${query}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="History" subtitle="Your past specials" showBack backTo={`/${businessQuery}`} />

      <div className="max-w-lg mx-auto px-4 pb-8 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : specials.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-dashed border-border">
            <Archive className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No history yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Past specials will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {specials.map((special, i) => (
                <motion.div
                  key={special.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <HistoryCard
                    special={special}
                    onReuse={handleReuse}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}