import { useState, useEffect } from "react";
import { getParamCaseInsensitive, getBusinessContext } from "@/lib/urlParams";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, History, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import AppHeader from "@/components/specials/AppHeader";
import SpecialCard from "@/components/specials/SpecialCard";
import PullToRefresh from "@/components/PullToRefresh";
import { useBusinessSetup } from "@/hooks/useBusinessSetup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Dashboard({ viewOnly }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const { status: businessStatus, business } = useBusinessSetup();

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

  useEffect(() => {
    if (business?.business_name) {
      setDisplayName(business.business_name);
      sessionStorage.setItem("app_business", business.business_name);
    } else if (businessParam) {
      setDisplayName(businessParam);
    } else {
      base44.auth.me().then(user => {
        if (user?.full_name) setDisplayName(user.full_name);
      }).catch(() => {});
    }
  }, [businessParam, business]);

  const { data: specials = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["specials-active", businessId, businessParam],
    queryFn: () => {
      const filter = viewOnly ? { status: "active" } : { status: { $in: ["active", "paused"] } };
      if (businessId > 0) filter.business_id = businessId;
      else if (businessParam) filter.business_name = businessParam;
      return base44.entities.Special.filter(filter, "-created_date");
    },
    initialData: [],
  });

  const isRefreshing = isFetching && !isLoading;

  const updateMutation = useMutation({
    mutationFn: ({ id, f_id, data }) => base44.functions.invoke("updateSpecial", {
      special_id: id,
      f_id,
      data,
    }),
    onMutate: ({ id, data }) => {
      queryClient.setQueryData(["specials-active", businessId, businessParam], (old = []) =>
        old.map((s) => (s.id === id ? { ...s, ...data } : s))
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["specials-active"] }),
  });

  const handlePause = (special) => {
    updateMutation.mutate({ id: special.id, f_id: special.f_id, data: { status: "paused" } });
    toast.info("This special's visibility will be removed from the Specials Directory");
  };
  const handleResume = (special) => {
    updateMutation.mutate({ id: special.id, f_id: special.f_id, data: { status: "active" } });
    toast.info("This special will now be visible from the Specials Directory");
  };
  const handleCancel = () => {
    if (cancelTarget) {
      updateMutation.mutate({ id: cancelTarget.id, f_id: cancelTarget.f_id, data: { status: "cancelled" } });
      toast.info("This special's visibility will be removed from the Specials Directory");
      setCancelTarget(null);
    }
  };
  const handleEdit = (special) => navigate(`/specials/edit/${special.id}${businessQuery}`);

  if (businessStatus === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading business…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={businessId > 0 && displayName ? `${displayName}'s Specials` : (viewOnly ? "My Specials" : "Manage Specials")}
        businessName={businessId > 0 && displayName ? undefined : (displayName || undefined)}
        subtitle={viewOnly ? "Preview your community offers" : "Create and manage your community offers"}
      />

      <div className="max-w-lg mx-auto px-4 pb-8 space-y-6 pt-4">
        {/* Action Pills */}
        {!viewOnly && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex gap-3">
          <Button
            onClick={() => navigate(`/specials/create${businessQuery}`)}
            className="flex-1 h-12 rounded-full text-sm font-semibold gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Create New Special
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/specials/history${businessQuery}`)}
            className="flex-1 h-12 rounded-full text-sm font-medium gap-2"
          >
            <History className="w-4 h-4" />
            View History
          </Button>
        </motion.div>
        )}

        {/* Active Specials */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Active Specials</h2>
            <span className="ml-auto text-xs text-muted-foreground">{specials.length} offer{specials.length !== 1 ? "s" : ""}</span>
          </div>

          <PullToRefresh onRefresh={refetch} isRefreshing={isRefreshing}>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-4 h-28 animate-pulse border border-border/50" />
                ))}
              </div>
            ) : specials.length === 0 ? (
              <div className="bg-card rounded-2xl p-8 text-center border border-dashed border-border">
                <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No active specials yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Create your first special to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {specials.map((special, i) => (
                    <motion.div
                      key={special.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <SpecialCard
                        special={special}
                        onEdit={handleEdit}
                        onPause={handlePause}
                        onResume={handleResume}
                        onCancel={setCancelTarget}
                        viewOnly={viewOnly}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </PullToRefresh>
        </div>


      </div>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent className="rounded-2xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this Special?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel "{cancelTarget?.title}". It will no longer appear in the community feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="rounded-xl bg-destructive hover:bg-destructive/90">
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}