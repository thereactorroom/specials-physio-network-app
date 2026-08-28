import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { special_id, viewer_id, member_name, f_id } = body;

    if (!special_id || !viewer_id) {
      return Response.json({ error: 'special_id and viewer_id are required' }, { status: 400 });
    }

    // Fetch the special once (used for both business_name and view count)
    const special = await base44.asServiceRole.entities.Special.get(special_id);

    // Check if this viewer already viewed this special (one person = one view)
    const existing = await base44.asServiceRole.entities.SpecialView.filter({
      special_id,
      viewer_id
    });

    if (existing.length > 0) {
      return Response.json({ unique_views: special.unique_views || 0, already_viewed: true });
    }

    // Record the new unique view. When f_id is 0 (no Fusion login),
    // label the viewer as "Test User" so logs are readable.
    const isAnonymous = !f_id || f_id === 0;
    await base44.asServiceRole.entities.SpecialView.create({
      special_id,
      viewer_id,
      business_name: special.business_name || '',
      member_name: isAnonymous ? 'Test User' : (member_name || ''),
      f_id: f_id || 0
    });

    // Increment the unique_views counter on the Special
    const newCount = (special.unique_views || 0) + 1;
    await base44.asServiceRole.entities.Special.update(special_id, { unique_views: newCount });

    return Response.json({ unique_views: newCount, already_viewed: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}