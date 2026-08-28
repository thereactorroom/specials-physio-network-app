import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveFusionHost } from "../../shared/fusionHost.ts";

// ── getFusionBusiness ───────────────────────────────────────────────────────
// Fetches a single business record from Fusion's public service-directory API
// and returns it for storage in the Business entity.
//
// Payload: { business_id: number, host?: string }
// The host defaults to the UAT endpoint provided by Fusion. Returns
// { business } on success, or { error } when the API fails / returns no data.
export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const { business_id, host } = body || {};
    const id = parseInt(business_id, 10);
    if (!id || isNaN(id)) {
      return Response.json({ error: 'Missing or invalid business_id' }, { status: 400 });
    }

    const baseUrl = resolveFusionHost(host);
    if (!baseUrl) {
      return Response.json({ error: 'Invalid host' }, { status: 400 });
    }
    const url = `${baseUrl}/modules/module_dev/service_directory/v2/businesses/get?id=${id}`;

    console.log('[getFusionBusiness] Requesting URL:', url);
    console.log('[getFusionBusiness] business_id:', id, '| host param:', host || '(none — defaulting to UAT)');

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    console.log('[getFusionBusiness] Response status:', res.status);
    if (!res.ok) {
      console.log('[getFusionBusiness] Fusion API failed with status:', res.status);
      return Response.json({ error: `Fusion API failed: ${res.status}` }, { status: 404 });
    }
    // Some ids return an HTML error page instead of JSON — treat as not found.
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json({ error: 'No business data returned' }, { status: 404 });
    }
    const json = await res.json().catch(() => null);
    console.log('[getFusionBusiness] JSON response:', JSON.stringify(json).slice(0, 500));
    if (!json || json.status !== true || !json.data) {
      console.log('[getFusionBusiness] No business data returned for id:', id);
      return Response.json({ error: 'No business data returned' }, { status: 404 });
    }
    console.log('[getFusionBusiness] Success — business_name:', json.data?.business_name);
    return Response.json({ business: json.data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}