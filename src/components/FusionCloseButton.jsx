import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isInFusionIframe, closeComponent } from "@/lib/fusionBridge";
import { ArrowLeft } from "lucide-react";

// Floating "Back" button shown only when the app is embedded in a fusion iframe.
// Clicking it asks the fusion host to close the component. Rendered globally in
// App.jsx; hidden when not in an iframe, and hidden on routes that have their
// own in-page navigation (view log, special view/preview, create/edit, history).
const HIDDEN_PATTERNS = [
  /^\/admin\/views/,
  /^\/admin\/cron/,
  /^\/specials\/view\//,
  /^\/specials\/preview$/,
  /^\/specials\/create$/,
  /^\/specials\/edit\//,
  /^\/specials\/history$/,
];

export default function FusionCloseButton() {
  const [inIframe, setInIframe] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setInIframe(isInFusionIframe());
  }, []);

  if (!inIframe) return null;
  if (HIDDEN_PATTERNS.some((re) => re.test(location.pathname))) return null;

  return (
    <button
      type="button"
      onClick={closeComponent}
      className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-lg hover:bg-slate-800 transition-colors"
      aria-label="Close and go back"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}