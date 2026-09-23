import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// ── getCronLogs ─────────────────────────────────────────────────────────────
// Admin-only: returns the most recent auto-expire cron run logs so the admin
// section can show whether the nightly workflow fired and what it expired.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only: cron logs expose system run history.
    let user = null;
    try { user = await base44.auth.me(); } catch (e) {}
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const logs = await base44.asServiceRole.entities.CronRunLog.list('-created_date', 50);
    return Response.json({ logs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}