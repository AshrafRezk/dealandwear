/* eslint-env node */
/**
 * Salesforce OAuth (client credentials) for the Find Your Fit integration user.
 * Tokens are cached per warm function instance and refreshed on expiry or on a 401.
 */
let cachedToken = null;
let tokenExpiry = 0;

export function instanceUrl() {
  const { SF_INSTANCE_URL } = process.env;
  if (!SF_INSTANCE_URL) throw new Error('SF_INSTANCE_URL is not configured');
  return SF_INSTANCE_URL.replace(/\/$/, '');
}

export function clearSalesforceToken() {
  cachedToken = null;
  tokenExpiry = 0;
}

export async function getSalesforceToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now + 60_000) return cachedToken;

  const { SF_CONNECTED_APP_CLIENT_ID, SF_CONNECTED_APP_CLIENT_SECRET } = process.env;
  if (!SF_CONNECTED_APP_CLIENT_ID || !SF_CONNECTED_APP_CLIENT_SECRET) {
    throw new Error('Salesforce client credentials are not configured');
  }

  const res = await fetch(`${instanceUrl()}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SF_CONNECTED_APP_CLIENT_ID,
      client_secret: SF_CONNECTED_APP_CLIENT_SECRET,
    }).toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Salesforce token request failed', res.status, text.slice(0, 300));
    throw new Error('Salesforce authentication failed');
  }
  const data = await res.json();
  cachedToken = data.access_token;
  const issued = parseInt(data.issued_at, 10) || now;
  // Session lifetime is org-configured; refresh conservatively after 90 minutes.
  tokenExpiry = issued + 90 * 60 * 1000;
  return cachedToken;
}
