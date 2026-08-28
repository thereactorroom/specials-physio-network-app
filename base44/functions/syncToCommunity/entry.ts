import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COMMUNITY_URL = "https://api.base44.app/api/apps/69d3439e3d3bb5a81e39f45d/functions/syncSpecial";
const SYNC_SECRET = Deno.env.get("COMMUNITY_SYNC_SECRET") || "fusionOnQ_sync_secret";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // body may come from entity automation payload or direct call
    const special = body.data || body;


    const payload = {
      title: special.title,
      description: special.description,
      business_name: special.business_name,
      category: special.category,
      start_date: special.start_date,
      end_date: special.end_date,
      image_url: special.image_url || null,
      is_active: special.status === 'active',
      external_id: special.id, // use this app's record ID as the external_id for upsert
      tags: special.offer_type ? [special.offer_type] : [],
    };

    const response = await fetch(COMMUNITY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SYNC_SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return Response.json({ success: true, communityResponse: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});