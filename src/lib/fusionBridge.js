// ═══════════════════════════════════════════════════════════════════════════
// fusionBridge.js — iframe detection + bridge communication layer
// Ported from the ICE onQ project. Config-driven via fusionConfig.js.
// ═══════════════════════════════════════════════════════════════════════════

import { FUSION_CONFIG } from "@/lib/fusionConfig";

const C = FUSION_CONFIG;

// Bridge scripts declare their objects with `const` at the top level, which
// creates a global lexical binding that does NOT attach to `window`. We use
// `new Function` to evaluate in the global scope so we can access them,
// while keeping the name in a string to avoid lint errors.
export function getGlobalBridge(name) {
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return typeof ${name} !== 'undefined' ? ${name} : undefined`)();
  } catch {
    return undefined;
  }
}

// ── Host resolution ──────────────────────────────────────────────────────────
// Returns the appropriate base URL for the current environment (prod or UAT).
export function getFusionHostUrl() {
  let host = "";
  try {
    host = window.parent.location.hostname; // same-origin parent
  } catch {
    try {
      host = new URL(document.referrer).hostname; // cross-origin parent
    } catch {
      host = "";
    }
  }
  if (host && host.includes(C.UAT_SUBSTRING)) return C.HOST_URL_UAT;
  return C.HOST_URL_PROD;
}

// ── Iframe detection ─────────────────────────────────────────────────────────
// Determines if the app is running inside a fusion iframe.
// Priority: top-level check → fresh parent host → sessionStorage cache → bridge globals.
export function isInFusionIframe() {
  // A top-level window is never in a fusion iframe. Check this BEFORE the
  // sessionStorage cache so a stale "true" doesn't hide web-only UI on a
  // direct web visit.
  if (window.self === window.top) {
    try { sessionStorage.setItem(C.SESSION_CACHE_KEY, "false"); } catch {}
    return false;
  }

  // We're in an iframe. Try to detect the parent host FRESH first — this
  // overwrites any stale cached value when the current parent is actually
  // non-fusion (e.g., the Base44 builder preview).
  let host = "";
  try {
    host = window.parent.location.hostname; // same-origin parent
  } catch {
    try {
      host = new URL(document.referrer).hostname; // cross-origin parent via referrer
    } catch {
      host = "";
    }
  }

  const ownHost = window.location.hostname;

  // Fresh, usable host that isn't our own (i.e. not an internal navigation) →
  // detect from it and update the cache.
  if (host && host !== ownHost) {
    const result = host.endsWith(C.HOST_DOMAIN);
    try { sessionStorage.setItem(C.SESSION_CACHE_KEY, String(result)); } catch {}
    return result;
  }

  // Internal navigation (referrer is our own URL) or no usable referrer —
  // trust the cache, then fall back to bridge globals.
  try {
    const cached = sessionStorage.getItem(C.SESSION_CACHE_KEY);
    if (cached !== null) return cached === "true";
  } catch {}
  const hasBridge = !!window[C.BRIDGE_FLAG] || !!getGlobalBridge(C.FUSION_BRIDGE_NAME);
  try { sessionStorage.setItem(C.SESSION_CACHE_KEY, String(hasBridge)); } catch {}
  return hasBridge;
}

// ── Bridge action helpers ───────────────────────────────────────────────────
// Each helper tries the native bridge first (when in a fusion iframe),
// then falls back to standard browser behavior.

// Call a phone number
export function fusionCall(tel) {
  const bridge = getGlobalBridge(C.NATIVE_BRIDGE_NAME);
  if (isInFusionIframe() && bridge && typeof bridge.openPhone === "function") {
    bridge.openPhone({ tel });
  } else {
    window.location.href = `tel:${tel}`;
  }
}

// Send SMS
export function fusionSMS(to, body) {
  const bridge = getGlobalBridge(C.NATIVE_BRIDGE_NAME);
  if (isInFusionIframe() && bridge && typeof bridge.openSMS === "function") {
    bridge.openSMS({ to, body });
  } else {
    window.location.href = `sms:${to}?body=${encodeURIComponent(body)}`;
  }
}

// Download a file by URL
// Tries: NativeBridge.download → FusionBridge.send → postMessage → browser download
export function fusionDownload(url, filename) {
  const nativeBridge = getGlobalBridge(C.NATIVE_BRIDGE_NAME);
  const fusionBridge = getGlobalBridge(C.FUSION_BRIDGE_NAME);

  if (nativeBridge && typeof nativeBridge.download === "function") {
    nativeBridge.download({ url });
    return true;
  }

  if (fusionBridge && typeof fusionBridge.send === "function") {
    fusionBridge.send({ request: "download", payload: { url } });
    return true;
  }

  if (window.self !== window.top) {
    window.top.postMessage({ request: "download", payload: { url } }, "*");
    return true;
  }

  // Browser download fallback
  const link = document.createElement("a");
  link.href = url;
  if (filename) link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

// Open WhatsApp
// Tries: NativeBridge.openWhatsApp → FusionBridge.openWhatsApp → postMessage → wa.me link
export function fusionWhatsApp(phone, text) {
  const uri = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  const nativeBridge = getGlobalBridge(C.NATIVE_BRIDGE_NAME);
  if (nativeBridge && typeof nativeBridge.openWhatsApp === "function") {
    nativeBridge.openWhatsApp({ uri });
    return;
  }

  const fusionBridge = getGlobalBridge(C.FUSION_BRIDGE_NAME);
  if (fusionBridge && typeof fusionBridge.openWhatsApp === "function") {
    fusionBridge.openWhatsApp(uri);
    return;
  }

  if (window.self !== window.top) {
    window.top.postMessage({ request: "openWhatsApp", payload: { uri } }, "*");
    return;
  }

  window.location.href = uri;
}

// ── Member / admin lookup ───────────────────────────────────────────────────
// Calls the host bridge's `getUserCommunityGroups` for a fusion userId and
// resolves with the raw response object ({ result, member }).
// Handles both callback-style and promise-style bridges, and waits for the
// bridge script to finish loading (injected asynchronously by IframeDetector).
export function getUserCommunityGroups(userId) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (res) => { if (!settled) { settled = true; resolve(res); } };
    const fail = (err) => { if (!settled) { settled = true; reject(err); } };

    const attempt = () => {
      const bridge = getGlobalBridge(C.FUSION_BRIDGE_NAME);
      if (!bridge) return false;
      if (typeof bridge.getUserCommunityGroups === "function") {
        try {
          // Pass the fID from the URL so the bridge resolves the actual logged-in
          // member. Calling with no arguments returns a stale/default member.
          console.log("[fusion] calling bridge.getUserCommunityGroups with userId=", userId, typeof userId);
          const ret = bridge.getUserCommunityGroups(userId);
          console.log("[fusion] bridge returned:", ret);
          if (ret && typeof ret.then === "function") ret.then((r)=>{ console.log("[fusion] resolved:", r); done(r); }, fail);
          else if (ret !== undefined) done(ret);
        } catch (e) { fail(e); }
        return true;
      }
      if (typeof bridge.send === "function") {
        try {
          const ret = bridge.send({ request: "getUserCommunityGroups", payload: { userId } });
          if (ret && typeof ret.then === "function") ret.then(done, fail);
        } catch (e) { fail(e); }
        return true;
      }
      return false;
    };

    if (attempt()) return;

    let tries = 0;
    const interval = setInterval(() => {
      tries++;
      if (attempt()) { clearInterval(interval); return; }
      if (tries >= 20) { clearInterval(interval); fail(new Error("FusionBridge unavailable")); }
    }, 250);
  });
}

// Resolves the member's full name ("Name Surname") or null when unavailable.
export function getFusionMemberName(userId) {
  return getUserCommunityGroups(userId)
    .then((res) => {
      const member = res?.member || res?.data?.member || res?.data || res;
      const name = [member?.name, member?.surname].filter(Boolean).join(" ").trim();
      return name || null;
    })
    .catch(() => null);
}

// Resolves true when the fusion member belongs to a group named "Admin".
export function checkFusionAdmin(userId) {
  return getUserCommunityGroups(userId)
    .then((res) => {
      const member = res?.member || res?.data?.member || res?.result?.member || res?.data || res?.result || res;
      const groups = Array.isArray(member?.groups) ? member.groups : [];
      return groups.some((g) => {
        const name = typeof g === "string" ? g : (g?.name || g?.title || "");
        return name.toLowerCase().includes("admin");
      });
    })
    .catch(() => false);
}

// Close the component (tell the host to dismiss the iframe)
export function closeComponent() {
  const fusionBridge = getGlobalBridge(C.FUSION_BRIDGE_NAME);
  if (fusionBridge && typeof fusionBridge.closeComponent === "function") {
    fusionBridge.closeComponent();
    return; // prevent the duplicate postMessage fallback when the native bridge handled it
  }
  if (window.self !== window.top) {
    window.top.postMessage({ request: "closeComponent" }, "*");
  }
}