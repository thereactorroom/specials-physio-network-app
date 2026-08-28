import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { special_id, f_id, data } = body;

    if (!special_id || !data) {
      return Response.json({ error: 'special_id and data are required' }, { status: 400 });
    }

    // Try to authenticate, but don't fail if not authenticated (public app / iframe)
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      // Not authenticated - continue, ownership checked via f_id below
    }

    // Load the special using service role to bypass RLS
    const special = await base44.asServiceRole.entities.Special.get(special_id);

    // Check ownership:
    // - authenticated admin: allow all
    // - f_id > 0 matching special.f_id: owner
    const isAdmin = user?.role === 'admin';
    const isOwner = Number(f_id) > 0 && special.f_id === Number(f_id);

    if (!isAdmin && !isOwner) {
      return Response.json({ error: 'Permission denied: you are not the owner of this special' }, { status: 403 });
    }

    // Update the special using service role
    const updated = await base44.asServiceRole.entities.Special.update(special_id, data);

    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}