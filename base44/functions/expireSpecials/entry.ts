import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Today's date in YYYY-MM-DD, in Johannesburg time (matches the workflow's
    // midnight-SAST schedule; UTC date is still "yesterday" when the cron fires)
    const today = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Find active/paused specials whose end_date is before today
    const expired = await base44.asServiceRole.entities.Special.filter({
      status: { $in: ["active", "paused"] },
      end_date: { $lt: today }
    });

    if (expired.length === 0) {
      return Response.json({ expired_count: 0, message: "No specials to expire" });
    }

    // Mark them all as expired
    const ids = expired.map(s => s.id);
    await base44.asServiceRole.entities.Special.updateMany(
      { status: { $in: ["active", "paused"] }, end_date: { $lt: today } },
      { $set: { status: "expired" } }
    );

    return Response.json({ expired_count: ids.length, ids });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}