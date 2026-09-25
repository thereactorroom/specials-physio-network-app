import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Search, Menu, Download, Loader2, Eye, Users, Clock, Palette } from "lucide-react";
import { format, addHours } from "date-fns";

// CAT (Africa/Johannesburg) is UTC+2 with no daylight saving.
// Timestamps are stored in UTC; shift them +2 hours for display.
const formatCAT = (dateStr, fmt) => {
  if (!dateStr) return "";
  return format(addHours(new Date(dateStr), 2), fmt);
};
import { getParamCaseInsensitive } from "@/lib/urlParams";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminViewLog() {
  const navigate = useNavigate();
  const { specialId } = useParams();
  const [views, setViews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("views"); // "views" | "user_list"

  const adminParam = getParamCaseInsensitive("Admin");
  const adminQuery = adminParam ? `?Admin=${adminParam}` : "";
  const fId = getParamCaseInsensitive("fID");
  const fIdQuery = fId ? (adminQuery ? "&" : "?") + `fID=${fId}` : "";
  const fullQuery = adminQuery + fIdQuery;

  useEffect(() => {
    setLoading(true);
    if (viewMode === "user_list") {
      base44.functions
        .invoke("getViewLogs", { mode: "user_list" })
        .then((res) => {
          const data = res?.data || res;
          setUsers(data?.users || []);
        })
        .catch(() => setUsers([]))
        .finally(() => setLoading(false));
    } else {
      base44.functions
        .invoke("getViewLogs", { special_id: specialId || undefined })
        .then((res) => {
          const data = res?.data || res;
          setViews(data?.views || []);
        })
        .catch(() => setViews([]))
        .finally(() => setLoading(false));
    }
  }, [specialId, viewMode]);

  const filtered = (viewMode === "user_list" ? users : views).filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const memberName = (v.member_name || "").toLowerCase();
    const fId = String(v.f_id || "");
    const viewerId = (v.viewer_id || "").toLowerCase();
    const business = (v.business_name || "").toLowerCase();
    if (viewMode === "user_list") {
      return memberName.includes(q) || fId.includes(q) || viewerId.includes(q);
    }
    return memberName.includes(q) || fId.includes(q) || viewerId.includes(q) || business.includes(q);
  });

  const exportCSV = () => {
    if (viewMode === "user_list") {
      const headers = ["User ID", "Distinct Specials Viewed", "Total Views"];
      const rows = filtered.map((u) => [
        u.viewer_id || "",
        String(u.distinct_specials_count || 0),
        String(u.total_views || 0),
      ]);
      const csv = [headers, ...rows]
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "user_list.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ["User ID", "Business Name", "Date Viewed"];
      const rows = filtered.map((v) => [
        v.viewer_id || "",
        v.business_name || "",
        v.created_date ? formatCAT(v.created_date, "yyyy-MM-dd HH:mm:ss") : "",
      ]);
      const csv = [headers, ...rows]
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "view_logs.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Display rule: when f_id is 0, the viewer is anonymous — show "Test User (0)"
  // instead of the raw UUID viewer_id.
  const displayName = (v) => {
    if (!v.f_id || v.f_id === 0) return "Test User (0)";
    return v.member_name ? `${v.member_name} (${v.f_id || v.viewer_id})` : v.viewer_id;
  };

  const backUrl = specialId ? `/specials/view/${specialId}${fullQuery}` : `/${fullQuery}`;

  const subtitle = loading
    ? viewMode === "user_list"
      ? "Users ranked by distinct specials viewed"
      : specialId
        ? "Unique views for this special"
        : "All specials with unique views > 0"
    : viewMode === "user_list"
      ? `${filtered.length} user${filtered.length === 1 ? "" : "s"}`
      : `${filtered.length} ${specialId ? "unique view" : "special"}${filtered.length === 1 ? "" : "s"}${specialId ? "" : " with views"}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(backUrl)}
            className="w-9 h-9 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">
              {viewMode === "user_list" ? "User List" : "View Log"}
            </h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:bg-muted transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setViewMode("views"); navigate(`/admin/views${fullQuery}`); }}>
                <Eye className="w-4 h-4 mr-2" />
                See All Unique Views {">"}0
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("user_list")}>
                <Users className="w-4 h-4 mr-2" />
                User List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/admin/cron${fullQuery}`)}>
                <Clock className="w-4 h-4 mr-2" />
                Cron Logs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/admin/branding${fullQuery}`)}>
                <Palette className="w-4 h-4 mr-2" />
                Branding Setup
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, user number or business..."
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 text-center border border-dashed border-border">
            <p className="text-sm font-medium text-foreground">
              {viewMode === "user_list" ? "No users found" : "No views recorded"}
            </p>
          </div>
        ) : viewMode === "user_list" ? (
          <div className="space-y-2">
            {filtered.map((u, i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {(u.viewer_id || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {displayName(u)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.distinct_specials_count} special{u.distinct_specials_count === 1 ? "" : "s"} viewed
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center bg-primary/10 text-primary text-sm font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                  {u.distinct_specials_count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((v, i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {displayName(v)}
                  </p>
                  {v.special_title && (
                    <p className="text-xs font-medium text-foreground/80">{v.special_title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{v.business_name || "—"}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {v.created_date ? formatCAT(v.created_date, "d MMM yyyy, HH:mm") : "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}