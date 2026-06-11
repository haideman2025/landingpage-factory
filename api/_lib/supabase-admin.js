import { createClient } from '@supabase/supabase-js';

export function adminClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Verify the Supabase access token from the Authorization header.
// Returns the user object or null.
export async function userFromReq(req) {
  const auth = req.headers.authorization || '';
  const jwt = auth.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return null;
  try {
    const { data, error } = await adminClient().auth.getUser(jwt);
    if (error) return null;
    return data.user || null;
  } catch (_) {
    return null;
  }
}
