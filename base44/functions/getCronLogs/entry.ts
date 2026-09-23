import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// ── getCronLogs ─────────────────────────────────────────────────────────────
// Admin-only: returns the most recent auto-expire cron run logs so the admin
// section can show whether the nightly workflow fired and what it expired.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // No server-side role check: app sessions in the Fusion iframe are
    // anonymous, and these logs contain only run timestamps/counts (no member
    // data). The admin UI gates access to this page client-side.

    const logs = await base44.asServiceRole.entities.CronRunLog.list('-created_date', 50);
    return Response.json({ logs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}