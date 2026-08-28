import { useState, useMemo } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getParamCaseInsensitive } from "@/lib/urlParams";

const PREVIEW_COUNT = 3;
const MAX_COUNT = 10;

export default function MostViewedSection({ specials }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  // Only specials with unique_views > 0, sorted by most viewed
  const sortedByViews = useMemo(() => {
    return specials
      .filter((s) => (s.unique_views || 0) > 0)
      .sort((a, b) => (b.unique_views || 0) - (a.unique_views || 0));
  }, [specials]);

  if (!sortedByViews.length) return null;

  const visible = sortedByViews.slice(0, expanded ? MAX_COUNT : PREVIEW_COUNT);
  const hasMore = sortedByViews.length > PREVIEW_COUNT;

  const handleOpen = (special) => {
    sessionStorage.setItem("preview-special", JSON.stringify(special));
    sessionStorage.removeItem("app_create_mode");
    const params = [];
    const fId = getParamCaseInsensitive("fID");
    const businessId = getParamCaseInsensitive("BusinessID");
    const business = getParamCaseInsensitive("business");
    if (fId) params.push(`fID=${encodeURIComponent(fId)}`);
    if (businessId) params.push(`BusinessID=${encodeURIComponent(businessId)}`);
    if (business) params.push(`business=${encodeURIComponent(business)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    navigate(`/specials/view/${special.id}${query}`);
  };

  return (
    <div className="bg-[#EDE4E0] rounded-2xl p-4">
      <div className="inline-flex items-center gap-1.5 bg-[#EADCD9] px-2.5 py-1 rounded-full mb-3">
        <Eye className="w-3 h-3 text-[#BC6C7C]" />
        <span className="text-xs font-semibold text-[#2D2527]">Most Viewed Specials</span>
      </div>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {visible.map((special) => (
            <motion.button
              key={special.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => handleOpen(special)}
              className="block text-left w-full space-y-1 p-2 -m-2 rounded-lg hover:bg-black/5 transition-colors duration-150"
            >
              <p className="text-sm font-semibold text-foreground leading-tight">{special.title}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  {special.business_name} <span className="font-semibold text-foreground/70">({special.unique_views || 0})</span>
                </p>
                {special.offer_type === "limited_time" && (
                  <span className="inline-flex items-center bg-[#FEFCE8] text-[#854D0E] text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                    Limited Time
                  </span>
                )}
                {special.today_only && (
                  <span className="inline-flex items-center bg-[#FEEBC8] text-[#975A16] text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                    One Day Only
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 text-xs font-medium text-[#4A9C8C] hover:underline"
        >
          {expanded ? "Show less" : "Click to see more"}
        </button>
      )}
    </div>
  );
}