import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveFusionHost } from "../../shared/fusionHost.ts";

// ── getFusionUser ─────────────────────────────────────────────────────────────
// Backend function: given a fusion host URL + session token, fetches the
// user's identity from the host's API. This is the fusion auth handshake.
//
// Flow:
//   1. Client detects it's in a fusion iframe (via fusionBridge.js)
//   2. Client reads the `session` URL param
//   3. Client calls this function with { host, session }
//   4. This function fetches a CSRF nonce, then fetches the user profile
//   5. Returns { user } to the client
//
// No Base44 auth required — this calls the fusion host's public API directly.
export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const { host, session } = body || {};

    if (!host || !session) {
      return Response.json({ error: 'Missing host or session' }, { status: 400 });
    }

    const baseUrl = resolveFusionHost(host);
    if (!baseUrl) {
      return Response.json({ error: 'Invalid host' }, { status: 400 });
    }

    // Step 1: fetch CSRF nonce (needed as API key for subsequent calls)
    const csrfRes = await fetch(`${baseUrl}/api/?action=csrf_nonce`, {
      headers: { session },
    });
    if (!csrfRes.ok) {
      return Response.json({ error: `CSRF nonce failed: ${csrfRes.status}` }, { status: 502 });
    }
    const apiKey = await csrfRes.text();

    // Step 2: fetch user
    const userRes = await fetch(`${baseUrl}/api/?action=getUser`, {
      headers: { Apikey: apiKey },
    });
    if (!userRes.ok) {
      return Response.json({ error: `getUser failed: ${userRes.status}` }, { status: 502 });
    }
    const user = await userRes.json();

    return Response.json({ user });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}