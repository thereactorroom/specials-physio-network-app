import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only: view logs expose member activity analytics.
    let user = null;
    try { user = await base44.auth.me(); } catch (e) {}
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { special_id, mode } = body || {};

    // User List mode: aggregate by viewer_id, count distinct specials viewed
    if (mode === "user_list") {
      const views = await base44.asServiceRole.entities.SpecialView.filter({}, '-created_date', 5000);
      const userMap = new Map();
      for (const v of views) {
        const key = v.viewer_id || "Unknown";
        if (!userMap.has(key)) {
          userMap.set(key, { viewer_id: key, business_name: v.business_name || "", member_name: v.member_name || "", f_id: v.f_id || 0, distinct_specials: new Set(), total_views: 0 });
        }
        const entry = userMap.get(key);
        entry.distinct_specials.add(v.special_id);
        entry.total_views += 1;
        if (!entry.business_name && v.business_name) entry.business_name = v.business_name;
        if (!entry.member_name && v.member_name) entry.member_name = v.member_name;
        if (!entry.f_id && v.f_id) entry.f_id = v.f_id;
      }
      const userList = Array.from(userMap.values())
        .map(u => ({ viewer_id: u.viewer_id, business_name: u.business_name, member_name: u.member_name, f_id: u.f_id, distinct_specials_count: u.distinct_specials.size, total_views: u.total_views }))
        .sort((a, b) => b.distinct_specials_count - a.distinct_specials_count);
      return Response.json({ users: userList });
    }

    // When a specific special is requested, return only its views
    if (special_id) {
      const views = await base44.asServiceRole.entities.SpecialView.filter({ special_id }, '-created_date', 1000);
      const special = await base44.asServiceRole.entities.Special.get(special_id).catch(() => null);
      const special_title = special?.title || "";
      return Response.json({ views: views.map(v => ({ ...v, special_title })) });
    }

    // No specific special: only return views for specials that have unique_views > 0
    const views = await base44.asServiceRole.entities.SpecialView.filter({}, '-created_date', 1000);
    const specials = await base44.asServiceRole.entities.Special.filter({}, '-created_date', 1000);
    const specialMap = new Map(specials.map(s => [s.id, s]));
    const specialIdsWithViews = new Set(
      specials.filter(s => (s.unique_views || 0) > 0).map(s => s.id)
    );
    const filteredViews = views
      .filter(v => specialIdsWithViews.has(v.special_id))
      .map(v => ({ ...v, special_title: specialMap.get(v.special_id)?.title || "" }));
    return Response.json({ views: filteredViews });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}