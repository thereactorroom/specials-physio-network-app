import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  let source = 'cron';
  try {
    const base44 = createClientFromRequest(req);

    // The workflow's scheduled runs pass no body ('cron'); the admin section's
    // "Run now" button passes source: 'manual'. No server-side role check:
    // app sessions in the Fusion iframe are anonymous, and the operation is
    // idempotent — it only expires specials already past their end date, which
    // is exactly what the nightly cron does. The admin UI gates the button.
    const body = await req.json().catch(() => ({}));
    source = body?.source === 'manual' ? 'manual' : 'cron';

    // Today's date in YYYY-MM-DD, in Johannesburg time (matches the workflow's
    // midnight-SAST schedule; UTC date is still "yesterday" when the cron fires)
    const today = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Find active/paused specials whose end_date is before today
    const expired = await base44.asServiceRole.entities.Special.filter({
      status: { $in: ["active", "paused"] },
      end_date: { $lt: today }
    });

    const ids = expired.map(s => s.id);
    if (expired.length > 0) {
      // Mark them all as expired
      await base44.asServiceRole.entities.Special.updateMany(
        { status: { $in: ["active", "paused"] }, end_date: { $lt: today } },
        { $set: { status: "expired" } }
      );
    }

    // Log every run (cron or manual) for the admin cron-log view
    await base44.asServiceRole.entities.CronRunLog.create({
      source,
      expired_count: expired.length,
      status: 'success',
      message: expired.length === 0
        ? 'No specials to expire'
        : `Expired ${expired.length} special${expired.length === 1 ? '' : 's'}`,
      expired_ids: ids,
    });

    return Response.json({ expired_count: ids.length, ids, source });
  } catch (error) {
    // Best-effort: log the failed run so it shows up in the admin cron log
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.CronRunLog.create({
        source,
        expired_count: 0,
        status: 'error',
        message: error.message,
        expired_ids: [],
      });
    } catch (e) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
}