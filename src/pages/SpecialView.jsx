import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Tag, Gift, Eye, MapPin } from "lucide-react";
import { format } from "date-fns";
import { getParamCaseInsensitive } from "@/lib/urlParams";
import { useIsAdmin } from "@/lib/fusionAdminStore";
import { getFusionMemberName } from "@/lib/fusionBridge";

const offerTypeConfig = {
  discount: { label: "Discount", icon: Tag },
  value_add: { label: "Value Add", icon: Gift },
  limited_time: { label: "Limited Time", icon: Clock },
  event: { label: "Event", icon: Calendar },
};

export default function SpecialView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [special, setSpecial] = useState(null);
  const [viewRecorded, setViewRecorded] = useState(false);
  const recordedViewsRef = useRef(null);
  const isAdmin = useIsAdmin();

  const buildQuery = () => {
    const params = [];
    const fId = getParamCaseInsensitive("fID");
    const admin = getParamCaseInsensitive("Admin");
    const businessId = getParamCaseInsensitive("BusinessID");
    const business = getParamCaseInsensitive("business");
    if (fId) params.push(`fID=${encodeURIComponent(fId)}`);
    if (businessId) params.push(`BusinessID=${encodeURIComponent(businessId)}`);
    if (business) params.push(`business=${encodeURIComponent(business)}`);
    if (admin) params.push(`Admin=${encodeURIComponent(admin)}`);
    return params.length ? `?${params.join("&")}` : "";
  };

  const handleViewLog = () => {
    navigate(`/admin/views/${id}${buildQuery()}`);
  };

  const initial = special?.business_name ? special.business_name.charAt(0).toUpperCase() : "?";
  const offerType = special?.offer_type ? offerTypeConfig[special.offer_type] : null;

  useEffect(() => {
    const stored = sessionStorage.getItem("preview-special");
    if (stored) {
      setSpecial(JSON.parse(stored));
    }
    // Always fetch fresh data from the API to ensure all fields (e.g. today_only) are present.
    // Preserve the view count returned by the recording when it lands first (avoids a stale
    // fetch overwriting the just-incremented unique_views).
    if (id) {
      base44.entities.Special.filter({ id }).then((results) => {
        if (results.length > 0) {
          setSpecial((prev) => {
            const fresh = results[0];
            if (recordedViewsRef.current != null) {
              return { ...fresh, unique_views: recordedViewsRef.current };
            }
            return fresh;
          });
        }
      }).catch(() => {});
    }
  }, [id]);

  // Record a unique view when a consumer opens the special.
  // Uses fID from URL for uniqueness; falls back to a localStorage UUID when fID is 0.
  // Runs once per special id (independent of the special state) to avoid re-triggering.
  useEffect(() => {
    if (!id) return;
    const fId = parseInt(getParamCaseInsensitive("fID"), 10) || 0;
    let viewerId;
    if (fId > 0) {
      viewerId = String(fId);
    } else {
      viewerId = localStorage.getItem("viewer_id");
      if (!viewerId) {
        viewerId = crypto.randomUUID();
        localStorage.setItem("viewer_id", viewerId);
      }
    }
    const recordView = (memberName) => {
      base44.functions
        .invoke("recordSpecialView", {
          special_id: id,
          viewer_id: viewerId,
          ...(fId > 0 ? { f_id: fId, member_name: memberName || "" } : {})
        })
        .then((res) => {
          const data = res?.data || res;
          if (data && typeof data.unique_views === "number") {
            recordedViewsRef.current = data.unique_views;
            setSpecial((s) => (s ? { ...s, unique_views: data.unique_views } : s));
          }
          setViewRecorded(true);
          queryClient.invalidateQueries({ queryKey: ["community-specials"] });
        })
        .catch(() => setViewRecorded(true));
    };

    if (fId > 0) {
      // Always resolve the member name fresh from the bridge — the bridge
      // returns the currently logged-in user, so a cached name from a previous
      // session must not be attributed to the current viewer.
      getFusionMemberName(fId).then((name) => {
        recordView(name);
      });
    } else {
      recordView();
    }
  }, [id, queryClient]);

  if (!special) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image - always shown expanded (full, uncropped) */}
      <div className="relative w-full bg-slate-50">
        {special.image_url ? (
          <img
            src={special.image_url}
            alt={special.title}
            className="w-full object-contain h-auto"
          />
        ) : (
          <div className="w-full h-72 bg-gradient-to-br from-slate-100 to-slate-200" />
        )}
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-5 pt-5 pb-28 space-y-5">
        {/* Business Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
            {special.business_name ? (
              <span className="text-base font-bold text-teal-700">{initial}</span>
            ) : (
              <MapPin className="w-5 h-5 text-teal-700" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{special.business_name}</p>
            <div
              onClick={isAdmin && viewRecorded ? handleViewLog : undefined}
              className={`flex items-center gap-1 mt-1 text-xs text-slate-400 ${isAdmin && viewRecorded ? "cursor-pointer hover:text-teal-700 transition-colors" : ""}`}
            >
              <Eye className="w-3.5 h-3.5" />
              {viewRecorded ? (
                <>
                  <span>Unique Views: {special.unique_views || 0}</span>
                  {isAdmin && (
                    <span className="inline-flex items-center bg-slate-800 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                      Admin
                    </span>
                  )}
                </>
              ) : (
                <span className="inline-block w-20 h-3 bg-slate-100 rounded animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">{special.title}</h1>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {offerType && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-xs font-medium text-red-500">
              <offerType.icon className="w-3.5 h-3.5" />
              {offerType.label}
            </span>
          )}
          {special.today_only && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEEBC8] text-xs font-semibold text-[#975A16]">
              <Clock className="w-3.5 h-3.5" />
              One Day Only
            </span>
          )}
        </div>

        {/* Validity Box */}
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="text-sm">
            <span className="text-slate-500">Valid: </span>
            <span className="font-semibold text-slate-900">
              {special.start_date ? format(new Date(special.start_date), "d MMM yyyy") : "Start"} – {special.end_date ? format(new Date(special.end_date), "d MMM yyyy") : "End"}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {special.description}
        </p>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 z-20">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={() => { navigate(`/${buildQuery()}`); }}
            className="w-full h-12 rounded-2xl font-semibold text-base"
            style={{ backgroundColor: "#007AFF" }}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}