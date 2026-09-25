import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { DEFAULT_BRANDING, applyBrandingToDocument } from "@/lib/brandingConfig";

const BrandingContext = createContext(null);

const FIELDS = [
  "app_name",
  "tagline",
  "logo_url",
  "primary_color",
  "accent_color",
  "theme_mode",
  "heading_font",
  "body_font",
  "configured",
];

// Loads the single TenantConfig record (if any), exposes the effective
// branding (saved values over Dolphin Coast defaults), applies it to the
// document, and persists updates from the Branding Engine setup screen.
export function BrandingProvider({ children }) {
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    return base44.entities.TenantConfig.list("-created_date", 1)
      .then((rows) => setRecord(rows[0] || null))
      .catch(() => setRecord(null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const branding = useMemo(() => {
    if (!record) return { ...DEFAULT_BRANDING };
    const merged = { ...DEFAULT_BRANDING };
    for (const f of FIELDS) {
      if (record[f] !== null && record[f] !== undefined && record[f] !== "") merged[f] = record[f];
    }
    return merged;
  }, [record]);

  const isConfigured = !isLoading && !!record?.configured;

  useEffect(() => {
    if (!isLoading) applyBrandingToDocument(branding);
  }, [isLoading, branding]);

  const saveConfig = useCallback(
    async (values) => {
      const payload = { ...DEFAULT_BRANDING, ...values, configured: true };
      if (record) {
        await base44.entities.TenantConfig.update(record.id, payload);
      } else {
        await base44.entities.TenantConfig.create(payload);
      }
      await load();
    },
    [record, load]
  );

  return (
    <BrandingContext.Provider value={{ branding, isConfigured, isLoading, saveConfig }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}