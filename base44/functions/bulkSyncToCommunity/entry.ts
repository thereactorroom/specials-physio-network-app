import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COMMUNITY_URL = "https://api.base44.app/api/apps/69d3439e3d3bb5a81e39f45d/functions/syncSpecial";
const SYNC_SECRET = "fusionOnQ_sync_secret";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Fetch all active specials
    const specials = await base44.asServiceRole.entities.Special.filter({ status: 'active' });

    const results = [];
    for (const special of specials) {
      const payload = {
        title: special.title,
        description: special.description,
        business_name: special.business_name,
        category: special.category,
        start_date: special.start_date,
        end_date: special.end_date,
        image_url: special.image_url || null,
        is_active: true,
        external_id: special.id,
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
      results.push({ specialId: special.id, title: special.title, ...result });
    }

    return Response.json({ success: true, synced: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});