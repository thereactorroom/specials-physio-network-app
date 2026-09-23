import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Loader2, Play, CheckCircle2, XCircle } from "lucide-react";
import { format, addHours } from "date-fns";
import { getParamCaseInsensitive } from "@/lib/urlParams";

// CAT (Africa/Johannesburg) is UTC+2 with no daylight saving.
// Timestamps are stored in UTC; shift them +2 hours for display.
const formatCAT = (date, fmt) => {
  if (!date) return "";
  return format(addHours(new Date(date), 2), fmt);
};

// The auto-expire workflow runs daily at midnight SAST (cron "0 0 * * *").
// Returns the UTC instant of the next SAST midnight.
const nextScheduledRun = () => {
  const nowSast = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return new Date(Date.UTC(nowSast.getUTCFullYear(), nowSast.getUTCMonth(), nowSast.getUTCDate() + 1));
};

export default function AdminCronLog() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null); // { ok: boolean, text: string }

  const adminParam = getParamCaseInsensitive("Admin");
  const adminQuery = adminParam ? `?Admin=${adminParam}` : "";
  const fId = getParamCaseInsensitive("fID");
  const fIdQuery = fId ? (adminQuery ? "&" : "?") + `fID=${fId}` : "";
  const fullQuery = adminQuery + fIdQuery;

  const loadLogs = useCallback(() => {
    setLoading(true);
    base44.functions
      .invoke("getCronLogs")
      .then((res) => {
        const data = res?.data || res;
        setLogs(data?.logs || []);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const runNow = () => {
    setRunning(true);
    setRunResult(null);
    base44.functions
      .invoke("expireSpecials", { source: "manual" })
      .then((res) => {
        const data = res?.data || res;
        const count = data?.expired_count ?? 0;
        setRunResult({
          ok: true,
          text:
            count > 0
              ? `Run complete — expired ${count} special${count === 1 ? "" : "s"}.`
              : "Run complete — no expired specials found.",
        });
        loadLogs();
      })
      .catch((err) => {
        setRunResult({ ok: false, text: err?.message || "Run failed." });
      })
      .finally(() => setRunning(false));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/views${fullQuery}`)}
            className="w-9 h-9 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Cron Logs</h1>
            <p className="text-xs text-muted-foreground">
              Auto-expire runs daily at midnight SAST. Next run: {formatCAT(nextScheduledRun(), "d MMM yyyy, HH:mm")}
            </p>
          </div>
          <button
            onClick={runNow}
            disabled={running}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run now
          </button>
        </div>
      </div>

      {/* Result banner */}
      {runResult && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div
            className={`rounded-xl p-4 border text-sm font-medium ${
              runResult.ok
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {runResult.text}
          </div>
        </div>
      )}

      {/* Run history */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 text-center border border-dashed border-border">
            <p className="text-sm font-medium text-foreground">No cron runs recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Runs appear here once the nightly cron fires or you trigger one manually.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {log.status === "error" ? (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${
                          log.source === "manual" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {log.source === "manual" ? "Manual" : "Scheduled"}
                      </span>
                      <span className="text-sm font-semibold text-foreground truncate">
                        {log.message || (log.status === "error" ? "Run failed" : "Run complete")}
                      </span>
                    </div>
                    {log.expired_ids && log.expired_ids.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.expired_ids.length} special{log.expired_ids.length === 1 ? "" : "s"} marked expired
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatCAT(log.created_date, "d MMM yyyy, HH:mm")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}