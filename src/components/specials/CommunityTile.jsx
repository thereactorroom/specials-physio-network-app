import { format } from "date-fns";
import { Calendar, Clock, Tag, Gift, Eye, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getParamCaseInsensitive } from "@/lib/urlParams";
import { useIsAdmin } from "@/lib/fusionAdminStore";

const offerTypeConfig = {
  discount: { label: "Discount", icon: Tag },
  value_add: { label: "Value Add", icon: Gift },
  limited_time: { label: "Limited Time", icon: Clock },
  event: { label: "Event", icon: Calendar },
};

export default function CommunityTile({ special }) {
  const navigate = useNavigate();
  const initial = (special.business_name || "?").charAt(0).toUpperCase();
  const offerType = special.offer_type ? offerTypeConfig[special.offer_type] : null;

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

  const handleOpen = () => {
    sessionStorage.setItem("preview-special", JSON.stringify(special));
    sessionStorage.removeItem("app_create_mode");
    navigate(`/specials/view/${special.id}${buildQuery()}`);
  };

  const handleViewLog = (e) => {
    e.stopPropagation();
    navigate(`/admin/views/${special.id}${buildQuery()}`);
  };

  return (
    <div
      onClick={handleOpen}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100 cursor-pointer hover:shadow-lg transition-shadow"
    >
      {special.image_url && (
        <img
          src={special.image_url}
          alt={special.title}
          className="w-full h-40 object-cover"
        />
      )}

      <div className="p-4 space-y-3">
        {/* Business Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
            {special.business_name ? (
              <span className="text-sm font-bold text-teal-700">{initial}</span>
            ) : (
              <MapPin className="w-4 h-4 text-teal-700" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{special.business_name}</p>
            <div
              onClick={isAdmin ? handleViewLog : undefined}
              className={`flex items-center gap-1 mt-0.5 text-xs text-slate-400 ${isAdmin ? "cursor-pointer hover:text-teal-700 transition-colors" : ""}`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Unique Views: {special.unique_views || 0}</span>
              {isAdmin && (
                <span className="inline-flex items-center bg-slate-800 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-base font-bold text-slate-900 leading-tight">{special.title || "Special Title"}</h2>

        {/* Condensed Description */}
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
          {special.description || "Description not available"}
        </p>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {offerType && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-xs font-medium text-red-500">
              <offerType.icon className="w-3.5 h-3.5" />
              {offerType.label}
            </span>
          )}
          {special.today_only && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEEBC8] text-xs font-semibold text-[#975A16]">
              <Clock className="w-3.5 h-3.5" />
              One Day Only
            </span>
          )}
        </div>
      </div>
    </div>
  );
}