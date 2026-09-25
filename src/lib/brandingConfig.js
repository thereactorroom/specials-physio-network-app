// ═══════════════════════════════════════════════════════════════════════════
// brandingConfig.js — single source of truth for tenant branding.
// The DEFAULT_BRANDING values reproduce this app's current Dolphin Coast
// look. A fresh clone of this app starts unconfigured (no TenantConfig
// record) and is branded via the Branding Engine setup screen.
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_BRANDING = {
  app_name: "Community Specials",
  tagline: "Exclusive offers from businesses we know and trust in our community",
  logo_url: "",
  primary_color: "#0d9488",
  accent_color: "#f97316",
  theme_mode: "light",
  heading_font: "Inter",
  body_font: "Inter",
};

export const COLOR_PRESETS = [
  { label: "Dolphin Coast", primary: "#0d9488", accent: "#f97316" },
  { label: "Ocean Blue", primary: "#2563eb", accent: "#0ea5e9" },
  { label: "Forest", primary: "#16a34a", accent: "#eab308" },
  { label: "Berry", primary: "#9333ea", accent: "#ec4899" },
  { label: "Ember", primary: "#dc2626", accent: "#f59e0b" },
];

export const FONT_PAIRS = [
  { id: "inter", label: "Inter / Inter", heading: "Inter", body: "Inter" },
  { id: "jakarta", label: "Jakarta / Inter", heading: "Plus Jakarta Sans", body: "Inter" },
  { id: "poppins", label: "Poppins / Inter", heading: "Poppins", body: "Inter" },
  { id: "playfair", label: "Playfair / Inter", heading: "Playfair Display", body: "Inter" },
  { id: "outfit", label: "Outfit / Inter", heading: "Outfit", body: "Inter" },
];

export const THEME_MODES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// Expands 3-digit hex and falls back to the Dolphin teal for invalid values.
export function normalizeHex(hex) {
  let v = (hex || "").trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(v)) v = v.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(v)) return "#0d9488";
  return `#${v.toLowerCase()}`;
}

// Converts a hex color to the "H S% L%" channel string our CSS tokens use.
export function hexToHslChannels(hex) {
  const norm = normalizeHex(hex).slice(1);
  const r = parseInt(norm.slice(0, 2), 16) / 255;
  const g = parseInt(norm.slice(2, 4), 16) / 255;
  const b = parseInt(norm.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Loads Google Fonts for the given family names (idempotent).
export function ensureFontsLoaded(families) {
  const uniq = [...new Set(families.filter(Boolean))];
  if (uniq.length === 0) return;
  const href =
    "https://fonts.googleapis.com/css2?" +
    uniq.map((f) => `family=${f.replace(/\s+/g, "+")}:wght@400;500;600;700;800`).join("&") +
    "&display=swap";
  let link = document.getElementById("tenant-font-link");
  if (!link) {
    link = document.createElement("link");
    link.id = "tenant-font-link";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) link.href = href;
}

// Pushes a branding config into the live document: CSS color tokens,
// font tokens, theme mode and page title. Called by BrandingProvider.
export function applyBrandingToDocument(branding) {
  if (!branding) return;
  const root = document.documentElement;
  const primary = hexToHslChannels(branding.primary_color);
  const accent = hexToHslChannels(branding.accent_color);
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--chart-1", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-ring", primary);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--chart-2", accent);
  root.style.setProperty("--chart-4", accent);
  root.style.setProperty("--font-inter", `"${branding.body_font}", sans-serif`);
  root.style.setProperty("--font-heading", `"${branding.heading_font}", sans-serif`);
  root.classList.toggle("dark", branding.theme_mode === "dark");
  if (branding.app_name) document.title = branding.app_name;
  ensureFontsLoaded([branding.heading_font, branding.body_font]);
}