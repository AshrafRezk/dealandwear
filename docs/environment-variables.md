# Environment variables

The browser never holds Salesforce credentials. All `/api/dw/*` calls go to the Netlify function
`netlify/functions/proxy.js`, which signs in to Salesforce with the client-credentials flow and forwards the
request to the Apex REST API (`/services/apexrest/dw/v1/*`).

## Netlify (Site settings › Environment variables)

| Variable | Required | Scope | Purpose |
| --- | --- | --- | --- |
| `SF_INSTANCE_URL` | Yes | Functions | My Domain URL of the org, e.g. `https://yourorg.my.salesforce.com` (no trailing slash). |
| `SF_CONNECTED_APP_CLIENT_ID` | Yes | Functions | Consumer key of the Find Your Fit External Client App (client-credentials flow, run-as the integration user with the `Deal_and_Wear_Rest_Integration` permission set). |
| `SF_CONNECTED_APP_CLIENT_SECRET` | Yes | Functions | Consumer secret of the same app. Mark as **secret** in Netlify. |
| `ALLOWED_ORIGINS` | No | Functions | Extra comma-separated origins allowed to call the proxy (e.g. a custom domain before it becomes the primary URL). The site's own `URL`, `DEPLOY_PRIME_URL` and `DEPLOY_URL` are always allowed. |
| `VITE_SENTRY_DSN` | No | Builds | Sentry DSN for front-end error reporting. Leave empty to disable. |
| `VITE_SENTRY_TRACES_RATE` | No | Builds | Performance sampling rate, `0`–`1` (default `0.1`). |
| `VITE_APP_ENV` | No | Builds | `production`, `staging`… shown in Sentry. |
| `VITE_APP_VERSION` | No | Builds | Release name for Sentry (e.g. the git SHA). |

`URL`, `DEPLOY_PRIME_URL` and `DEPLOY_URL` are set by Netlify automatically.

After changing a variable, trigger a redeploy (Deploys › Trigger deploy) so builds and functions pick it up.

## Local development

No secrets are needed on a laptop. The Vite dev server forwards `/api/dw/*` to an org using your Salesforce CLI
session:

```bash
sf org login web -a dealandwear      # once
SF_DEV_ORG=dealandwear npm run dev   # http://localhost:5179
```

To run the Netlify function locally instead, create `.env` (git-ignored) with the three `SF_*` variables and run
`netlify dev`.

## Keys that live in Salesforce, not Netlify

These are entered in Salesforce Setup and never reach the browser or Netlify:

- **Gemini API key**: Setup › Named Credentials › External Credentials › `FYF_Gemini` › principal *Primary* › parameter `ApiKey`.
- **Mac mini key**: External Credentials › `FYF_MacMini` › principal *Primary* › parameter `ApiKey` (same value as `FYF_SYNC_API_KEY` on the Mac mini).

## Retired variables

`VITE_GEMINI_API_KEY`, `VITE_GOOGLE_SHOPPING_API_KEY`, `VITE_GOOGLE_CSE_ID` and `VITE_SCRAPER_API_KEY` are no longer
used. Delete them from Netlify: any `VITE_` variable is embedded in the public JavaScript bundle.
