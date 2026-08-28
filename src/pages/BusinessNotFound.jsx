import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { closeComponent } from "@/lib/fusionBridge";
import { getBusinessContext } from "@/lib/urlParams";

export default function BusinessNotFound() {
  const navigate = useNavigate();
  const { fId, businessId } = getBusinessContext();

  const handleRetry = () => {
    const params = [];
    if (fId > 0) params.push(`fID=${fId}`);
    if (businessId > 0) params.push(`BusinessID=${businessId}`);
    params.push("Create=true");
    navigate(`/${params.length ? `?${params.join("&")}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <Store className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Business not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          We couldn't load the business details
          {businessId > 0 ? ` for Business ID ${businessId}` : ""}. Please check the link and try again.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={handleRetry} className="h-12 rounded-full font-semibold">
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => closeComponent()}
            className="h-12 rounded-full font-medium"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}