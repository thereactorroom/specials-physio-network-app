import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import AppHeader from "@/components/specials/AppHeader";
import PreviewCard from "@/components/specials/PreviewCard";

export default function PreviewSpecial() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [special, setSpecial] = useState(null);

  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id") || searchParams.get("edit");
  const isViewMode = searchParams.get("view") === "true" || searchParams.get("mode") === "view";
  const isViewOnly = searchParams.get("viewonly") === "true";

  useEffect(() => {
    const stored = sessionStorage.getItem("preview-special");
    if (stored) {
      setSpecial(JSON.parse(stored));
    }
  }, []);

  // Record a unique view when a consumer opens the special (view mode only)
  useEffect(() => {
    if (!special || !isViewMode || !editId) return;
    let viewerId = localStorage.getItem("viewer_id");
    if (!viewerId) {
      viewerId = crypto.randomUUID();
      localStorage.setItem("viewer_id", viewerId);
    }
    base44.functions
      .invoke("recordSpecialView", { special_id: editId, viewer_id: viewerId })
      .then(() => queryClient.invalidateQueries({ queryKey: ["community-specials"] }))
      .catch(() => {});
  }, [special, isViewMode, editId, queryClient]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Special.create({ ...data, status: "active" }),
    onSuccess: () => {
      sessionStorage.removeItem("preview-special");
      queryClient.invalidateQueries({ queryKey: ["specials-active"] });
      navigate("/");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Special.update(editId, data),
    onSuccess: () => {
      sessionStorage.removeItem("preview-special");
      queryClient.invalidateQueries({ queryKey: ["specials-active"] });
      navigate("/");
    },
  });

  const handlePost = () => {
    if (editId) {
      updateMutation.mutate(special);
    } else {
      createMutation.mutate(special);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (!special) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Preview"
        subtitle="This is how your special will appear"
        showBack
        backTo={(() => {
          const params = [];
          if (special?.f_id > 0) params.push(`fID=${special.f_id}`);
          if (special?.business_id > 0) params.push(`BusinessID=${special.business_id}`);
          if (special?.business_name) params.push(`business=${encodeURIComponent(special.business_name)}`);
          return params.length ? `/?${params.join("&")}` : "/";
        })()}
      />

      <div className="max-w-lg mx-auto px-4 pb-32 pt-4">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
          <div className="mb-4">
            <p className="text-xs text-center text-muted-foreground bg-muted/50 rounded-full py-1.5 px-4 inline-flex mx-auto">
              👁 Consumer View
            </p>
          </div>
          <PreviewCard special={special} />
        </motion.div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/40 p-4 z-20">
        <div className="max-w-lg mx-auto flex gap-3">
          {isViewMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  const params = [];
                  if (special.f_id > 0) params.push(`fID=${special.f_id}`);
                  if (special.business_id > 0) params.push(`BusinessID=${special.business_id}`);
                  if (special.business_name) params.push(`business=${encodeURIComponent(special.business_name)}`);
                  const query = params.length ? `?${params.join("&")}` : "";
                  navigate(`/${query}`);
                }}
                className="flex-1 h-12 rounded-2xl font-semibold gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              {!isViewOnly && (
                <Button
                  onClick={() => {
                    const params = [];
                    if (special.f_id > 0) params.push(`fID=${special.f_id}`);
                    if (special.business_id > 0) params.push(`BusinessID=${special.business_id}`);
                    if (special.business_name) params.push(`business=${encodeURIComponent(special.business_name)}`);
                    const query = params.length ? `?${params.join("&")}` : "";
                    navigate(`/specials/edit/${editId}${query}`);
                  }}
                  className="flex-1 h-12 rounded-2xl font-semibold gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  Edit Special
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (!editId) {
                    sessionStorage.setItem("repost-special", JSON.stringify(special));
                    const params = [];
                    if (special.f_id > 0) params.push(`fID=${special.f_id}`);
                    if (special.business_id > 0) params.push(`BusinessID=${special.business_id}`);
                    if (special.business_name) params.push(`business=${encodeURIComponent(special.business_name)}`);
                    const query = params.length ? `&${params.join("&")}` : "";
                    navigate(`/specials/create?repost=true${query}`);
                  } else {
                    navigate(-1);
                  }
                }}
                className="flex-1 h-12 rounded-2xl font-semibold gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit
              </Button>
              <Button
                onClick={handlePost}
                disabled={isSaving}
                className="flex-1 h-12 rounded-2xl font-semibold gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {editId ? "Update Special" : "Post Special"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}