import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getBusinessContext } from "@/lib/urlParams";
import { getFusionHostUrl } from "@/lib/fusionBridge";

// Maps the raw Fusion business payload to our Business entity shape.
function mapBusiness(b) {
  return {
    business_id: b.id,
    unique_key_id: b.unique_key_id ?? 0,
    user_key_id: b.user_key_id ?? 0,
    user_id: b.user_id ?? 0,
    community_id: b.community_id ?? 0,
    content_id: b.content_id ?? "",
    business_name: b.business_name ?? "",
    country_code: b.country_code ?? "",
    contact_number: b.contact_number ?? "",
    office_number: b.office_number ?? "",
    email: b.email ?? "",
    person_name: b.person_name ?? "",
    person_surname: b.person_surname ?? "",
    description: b.description ?? "",
    logo: b.logo ?? "",
    whatsapp: b.whatsapp ?? "",
    google_url: b.google_url ?? "",
    website_url: b.website_url ?? "",
    facebook_url: b.facebook_url ?? "",
    x_url: b.x_url ?? "",
    instagram_url: b.instagram_url ?? "",
  };
}

// Resolves the business for the current URL BusinessID:
//   1. If BusinessID is 0/missing → no setup needed (status "ok", business null).
//   2. If a Business record already exists in the DB → use it.
//   3. Otherwise fetch from Fusion via the getFusionBusiness backend function
//      and store it in the Business entity.
//   4. If the fetch fails or returns no data → navigate to the not-found screen.
export function useBusinessSetup() {
  const navigate = useNavigate();
  const { businessId, fId, businessName } = getBusinessContext();
  const [status, setStatus] = useState(businessId > 0 ? "loading" : "ok");
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (businessId <= 0) {
      setStatus("ok");
      return;
    }

    const failQuery = buildFailQuery(fId, businessId, businessName);

    (async () => {
      try {
        // 1. Look for an existing cached record.
        const existing = await base44.entities.Business.filter({ business_id: businessId });
        if (cancelled) return;
        if (existing && existing.length > 0) {
          setBusiness(existing[0]);
          setStatus("ok");
          return;
        }

        // 2. Fetch from Fusion's public API.
        const host = getFusionHostUrl();
        const res = await base44.functions.invoke("getFusionBusiness", { business_id: businessId, host });
        const data = res?.data || res;
        if (cancelled) return;
        if (!data || data.error || !data.business) {
          navigate(`/business-not-found${failQuery}`);
          return;
        }

        // 3. Persist to the Business entity.
        const created = await base44.entities.Business.create(mapBusiness(data.business));
        if (cancelled) return;
        setBusiness(created);
        setStatus("ok");
      } catch (e) {
        if (cancelled) return;
        navigate(`/business-not-found${failQuery}`);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  return { status, business };
}

function buildFailQuery(fId, businessId, businessName) {
  const params = [];
  if (fId > 0) params.push(`fID=${fId}`);
  if (businessId > 0) params.push(`BusinessID=${businessId}`);
  if (businessName) params.push(`business=${encodeURIComponent(businessName)}`);
  return params.length ? `?${params.join("&")}` : "";
}