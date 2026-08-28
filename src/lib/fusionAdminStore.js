// Reactive store for the Fusion bridge-derived admin status.
// App.jsx resolves admin status once (via getUserCommunityGroups) and pushes
// the result here. Components subscribe through useFusionAdmin / useIsAdmin so
// they re-render the moment the bridge resolves — instead of depending on a
// sessionStorage write + parent re-render.

import { useState, useEffect } from "react";
import { getParamCaseInsensitive } from "@/lib/urlParams";

// Hydrate from the session cache so admin UI renders immediately on internal
// navigations (e.g. after clicking "Close") before the bridge re-resolves.
let adminStatus = (() => {
  try {
    const cached = sessionStorage.getItem("__fusion_admin");
    if (cached === "true") return true;
    if (cached === "false") return false;
  } catch {}
  return null;
})();
const listeners = new Set();

export function getFusionAdminStatus() {
  return adminStatus;
}

export function setFusionAdminStatus(value) {
  if (value === adminStatus) return;
  adminStatus = value;
  try { sessionStorage.setItem("__fusion_admin", String(value)); } catch {}
  listeners.forEach((l) => l());
}

export function useFusionAdmin() {
  const [status, setStatus] = useState(adminStatus);
  useEffect(() => {
    const listener = () => setStatus(adminStatus);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return status;
}

// Combines the explicit Admin URL param (always takes priority) with the
// bridge-derived status. Returns true only when admin access is confirmed.
export function useIsAdmin() {
  const fusionAdmin = useFusionAdmin();
  const explicit = getParamCaseInsensitive("Admin");
  if (explicit !== null && explicit !== "") return explicit.toLowerCase() === "true";
  return fusionAdmin === true;
}