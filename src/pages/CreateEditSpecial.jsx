import { useState, useEffect } from "react";
import { getParamCaseInsensitive, getBusinessContext } from "@/lib/urlParams";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImagePlus, Eye, Send, Building2, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import AppHeader from "@/components/specials/AppHeader";
import { toast } from "sonner";
import CategorySelect from "@/components/specials/CategorySelect";
import OfferTypeChips from "@/components/specials/OfferTypeChips";

const today = format(new Date(), "yyyy-MM-dd");

export default function CreateEditSpecial() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const { fId, businessId, businessName: businessNameFromUrl } = getBusinessContext();
  if (businessNameFromUrl) sessionStorage.setItem("app_business", businessNameFromUrl);
  const businessParam = businessNameFromUrl || sessionStorage.getItem("app_business");

  const getInitialForm = () => {
    if (!isEdit) {
      const repostData = sessionStorage.getItem("repost-special");
      if (repostData) {
        sessionStorage.removeItem("repost-special");
        return { ...JSON.parse(repostData) };
      }
    }
    return {
      business_name: businessNameFromUrl || "",
      business_id: businessId,
      f_id: fId,
      title: "",
      description: "",
      category: "",
      offer_type: "",
      start_date: today,
      end_date: "",
      today_only: false,
      image_url: "",
    };
  };

  const [form, setForm] = useState(getInitialForm);
  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);

  // Build nav query using URL params first, falling back to the loaded special's values
  const businessQuery = (() => {
    const params = [];
    const effectiveFId = fId > 0 ? fId : form.f_id;
    const effectiveBusinessId = businessId > 0 ? businessId : form.business_id;
    if (effectiveFId > 0) params.push(`fID=${effectiveFId}`);
    if (effectiveBusinessId > 0) params.push(`BusinessID=${effectiveBusinessId}`);
    if (businessParam) params.push(`business=${encodeURIComponent(businessParam)}`);
    return params.length ? `?${params.join("&")}` : "";
  })();

  useEffect(() => {
    async function loadUser() {
      if (!isEdit) {
        if (businessNameFromUrl) {
          setForm((f) => ({ ...f, business_name: businessNameFromUrl, business_id: businessId, f_id: fId }));
        } else {
          try {
            const user = await base44.auth.me();
            const name = user?.full_name || "";
            if (name) {
              setForm((f) => f.business_name ? f : { ...f, business_name: name });
            }
          } catch {}
        }
      }
    }
    loadUser();
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    async function loadSpecial() {
      const specials = await base44.entities.Special.filter({ id });
      if (specials.length > 0) {
        const s = specials[0];
        setForm({
          business_name: s.business_name || "",
          business_id: s.business_id || 0,
          f_id: s.f_id || 0,
          title: s.title || "",
          description: s.description || "",
          category: s.category || "",
          offer_type: s.offer_type || "",
          start_date: s.start_date || today,
          end_date: s.end_date || "",
          today_only: s.today_only || false,
          image_url: s.image_url || "",
        });
      }
      setLoading(false);
    }
    loadSpecial();
  }, [id, isEdit]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleTodayOnly = (checked) => {
    update("today_only", checked);
    if (checked) {
      update("start_date", today);
      update("end_date", today);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update("image_url", file_url);
    setUploading(false);
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Special.create({ ...data, status: "active" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specials-active"] });
      navigate(`/${businessQuery}`);
    },
    onError: (err) => {
      toast.error("Failed to save: " + (err?.message || "Unknown error"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke("updateSpecial", {
      special_id: id,
      f_id: form.f_id,
      data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specials-active"] });
      navigate(`/${businessQuery}`);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || "Unknown error";
      toast.error("Failed to update: " + msg);
    },
  });

  const handlePreview = () => {
    sessionStorage.setItem("preview-special", JSON.stringify(form));
    navigate(isEdit ? `/specials/preview?edit=${id}` : "/specials/preview");
  };

  const handlePost = () => {
    if (!form.title) return toast.error("Please add an offer title.");
    if (!form.description) return toast.error("Please add a description.");
    if (!form.category) return toast.error("Please select a category.");
    if (!form.offer_type) return toast.error("Please select an offer type.");
    if (!form.today_only && !form.end_date) return toast.error("Please set an end date.");
    if (isEdit) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const isValid = form.title && form.description && form.category && form.offer_type && form.start_date && (form.today_only || form.end_date);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <AppHeader
        title={isEdit ? "Edit Special" : "Create Special"}
        subtitle="Fill in the details below"
        showBack
        backTo={`/${businessQuery}`}
      />

      <div className="max-w-lg mx-auto px-3 pb-32 pt-4 w-full">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Business</Label>
            <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{form.business_name}</span>
            </div>
          </div>

          {/* Offer Title */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Offer Title</Label>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder='e.g. "10% Off All Haircuts"'
              className="h-12 rounded-xl text-base bg-card"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What does this offer include?"
              className="min-h-[100px] rounded-xl text-sm bg-card resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</Label>
            <CategorySelect value={form.category} onChange={(v) => update("category", v)} />
          </div>

          {/* Offer Type */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Offer Type</Label>
            <OfferTypeChips value={form.offer_type} onChange={(v) => update("offer_type", v)} />
          </div>

          {/* Validity */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Validity</Label>
            <div className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-border/50">
              <span className="text-sm font-medium">Today Only</span>
              <Switch checked={form.today_only} onCheckedChange={handleTodayOnly} />
            </div>
            {!form.today_only && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <span className="text-xs text-muted-foreground">Start Date</span>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => update("start_date", e.target.value)}
                    className="h-11 rounded-xl bg-card text-sm w-full min-w-0"
                  />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <span className="text-xs text-muted-foreground">End Date</span>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => update("end_date", e.target.value)}
                    className="h-11 rounded-xl bg-card text-sm w-full min-w-0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image (Optional)</Label>
            {form.image_url ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={form.image_url} alt="Upload" className="w-full h-40 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-2 bg-black/40 backdrop-blur-sm">
                  <label className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg py-1.5 text-xs font-medium cursor-pointer transition-colors">
                    <ImagePlus className="w-3.5 h-3.5" />
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Replace"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <button
                    onClick={() => update("image_url", "")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg py-1.5 text-xs font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 bg-card rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8 text-muted-foreground/40 mb-2" />
                    <span className="text-xs text-muted-foreground">Tap to upload image</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/40 p-4 z-20">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!isValid}
            className="flex-1 h-12 rounded-2xl font-semibold gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button
            onClick={handlePost}
            disabled={isSaving}
            className="flex-1 h-12 rounded-2xl font-semibold gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isEdit ? "Update" : "Post Special"}
          </Button>
        </div>
      </div>
    </div>
  );
}