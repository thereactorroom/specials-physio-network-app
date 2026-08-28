import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    let businessIdParam = url.searchParams.get('business_id') || url.searchParams.get('BusinessID');
    let fIdParam = url.searchParams.get('f_id') || url.searchParams.get('fID');
    // Also accept business_id / f_id from a JSON body (e.g. frontend SDK invoke)
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      if (!businessIdParam) businessIdParam = String(body?.business_id ?? body?.BusinessID ?? '');
      if (!fIdParam) fIdParam = String(body?.f_id ?? body?.fID ?? '');
    }
    if (!businessIdParam) {
      return Response.json({ error: "Missing required parameter: business_id" }, { status: 400 });
    }
    const businessId = parseInt(businessIdParam, 10);
    if (isNaN(businessId)) {
      return Response.json({ error: "Invalid business_id (must be numeric)" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Authorization: admin, or the fusion owner of this business (f_id match).
    let user = null;
    try { user = await base44.auth.me(); } catch (e) {}
    if (!user || user.role !== 'admin') {
      const fId = parseInt(fIdParam, 10) || 0;
      const businesses = await base44.asServiceRole.entities.Business.filter({ business_id: businessId }, '-created_date', 1);
      const ownerFid = businesses[0]?.user_id || 0;
      if (fId <= 0 || ownerFid !== fId) {
        return Response.json({ error: 'Permission denied: not the business owner' }, { status: 403 });
      }
    }

    // Only active specials for this business — already-paused ones are left untouched
    const activeSpecials = await base44.asServiceRole.entities.Special.filter({
      business_id: businessId,
      status: 'active'
    }, '-created_date', 1000);

    if (activeSpecials.length === 0) {
      return Response.json({
        success: true,
        business_id: businessId,
        paused_count: 0,
        message: "No active specials found for this business"
      });
    }

    // Pause only the active ones (different change per record, up to 500)
    const updates = activeSpecials.map(s => ({ id: s.id, status: 'paused' }));
    await base44.asServiceRole.entities.Special.bulkUpdate(updates);

    return Response.json({
      success: true,
      business_id: businessId,
      paused_count: activeSpecials.length,
      paused_special_ids: activeSpecials.map(s => s.id)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}