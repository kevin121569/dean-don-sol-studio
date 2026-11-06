# Ask Don Sol — review notes, Cloudflare risks, and controlled staging plan
Status: development branch only. NOT merged, NOT deployed, Worker disabled, no paid service active. The public nav link is hidden; `/ask-don-sol/` is a noindex "coming soon" preview that is not in the sitemap and not linked from any page.

## What the branch contains
- `/ask-don-sol/` chat page (disabled preview until configured), `workers/ask-don-sol/` proxy (Worker + Durable Object), nav fix (Reader List, About on Library/Games/Film/Animation), `docs/AUDIO_VERIFICATION_CHECKLIST.md`, `tests/ask-don-sol.cjs` (180 checks), `tests/staging-smoke.cjs` (staging only, refuses to run without explicit non-production settings).
- Run the suite: `npm i --no-save playwright && npx playwright install chromium && node tests/ask-don-sol.cjs`.

## Remaining real-Cloudflare risks (not testable locally)
1. **Durable Object behaviour is simulated in tests.** Atomicity relies on `blockConcurrencyWhile` on a real SQLite-backed DO. Needs a live burst test. (`blockConcurrencyWhile` is documented mainly for constructors; a plain read-modify-write inside a DO with only storage awaits is also serialized, so a simpler implementation may be preferable — reviewer's call.)
2. **Free-plan limits fail with errors, not slowdowns.** Per Cloudflare docs: Workers Free 100,000 requests/day and 10 ms CPU per invocation; DO Free 100,000 requests/day and 100,000 SQLite rows written/day. The Worker fails closed (503) if a DO call errors, but 10 ms CPU has not been measured (JSON parse + SHA-256 + several subrequests; I/O wait should not count as CPU).
3. **Turnstile specifics unverified live:** hostname allow-list must include the exact page host (and staging host); `appearance: interaction-only` + `execution: execute` + reset-per-message flow is implemented to the documented API but untested against the real widget; tokens are single-use and expire.
4. **Per-IP limits are weak against IPv6 rotation and shared NATs.** Per-visitor keys use the full address. Consider keying on the IPv6 /64. The global daily cap + Turnstile + spend limit are the real backstops.
5. **CORS/staging:** production origins are hard-coded; staging requires `CORS_EXTRA_ORIGINS` (added this round; CORS headers only, not access control).
6. **Provider spend limit availability is unverified for this account.** Anthropic's docs describe organization/workspace monthly spend limits via API as an early-access preview for Console organizations (contact Anthropic). Confirm that a hard limit can be set in the Console (UI or API) for a dedicated workspace; if not, use prepaid credit with auto-reload off plus billing alerts, and confirm that behaviour with Anthropic before activation.
7. **Model id** is deliberately blank; confirm the exact API model id from Anthropic's model docs (pricing page lists names, not ids).
8. **No logging/alerting yet:** add Workers observability and a billing alert; the only kill switch is redeploying with `ENABLED="false"` or deleting the API-key secret.
9. **Prompt injection:** the system prompt is not a security boundary; it contains only public facts, so the worst case is off-brand text, not a data leak. Needs live adversarial probes.
10. **Public endpoint discoverability:** once enabled, the Worker URL is visible in page source; abuse protection must stand on its own.

## Minimum configuration for a controlled staging test (all require Kevin's approval; none done)
1. Cloudflare account (Free plan is enough) with a workers.dev subdomain. Turnstile widget (Free): hostnames = the staging page host (e.g. `localhost`) — separate from the production widget.
2. Anthropic Console: a **dedicated staging workspace and API key**, hard monthly limit of about $5 (or $5 prepaid credit, auto-reload off) and a billing alert. Only then set `SPEND_LIMIT_CONFIRMED`.
3. From `workers/ask-don-sol/`:
   `npx wrangler deploy --name ask-don-sol-staging --var ENABLED:true --var SPEND_LIMIT_CONFIRMED:true --var MODEL:<confirmed-model-id> --var DAILY_CAP:50 --var HOURLY_PER_IP:15 --var MAX_INFLIGHT:2 --var CORS_EXTRA_ORIGINS:http://localhost:8080`
   `npx wrangler secret put ANTHROPIC_API_KEY --name ask-don-sol-staging` and `npx wrangler secret put TURNSTILE_SECRET --name ask-don-sol-staging`
   (staging gets its own Durable Object namespace because bindings are per Worker.)
4. Serve the repo locally (`python3 -m http.server 8080`) and run `STAGING_ENDPOINT=… STAGING_SITEKEY=… STAGING_ORIGIN=http://localhost:8080 node tests/staging-smoke.cjs` (about 5 provider calls).
5. Manual staging checks: ≥7-turn conversation, forced provider failure (bad key on a throwaway deploy), burst of ~60 parallel requests with `DAILY_CAP=50` confirming ≤50 served, Turnstile failure/expiry, mobile + desktop, injection probes, check Cloudflare and Anthropic usage dashboards match, then delete the staging Worker and key.
Nothing in the repo is changed for production at any point.

## Expected costs (sources: Cloudflare and Anthropic pricing docs fetched 2026-11-06; verify before relying)
- **Cloudflare:** $0 on the Free plan within limits. One chat message ≈ 1 Worker request + ~4 DO requests and ~4–5 DO rows written, so `DAILY_CAP=200` ≈ 1,000 DO requests and ≈ 1,000 rows written per day against 100,000 and 100,000 allowed. Turnstile Free: unlimited challenges, up to 20 widgets. (Workers Paid, $5/month minimum, is not needed.)
- **Anthropic (the only real cost).** Worst-case request ≈ 1,850 input tokens (1,512-char system prompt + 4,000 chars of history at a conservative 3 chars/token) + 400 output tokens. At listed prices:

| Model (list price, per million tokens in/out) | Per request, worst case | 50-request staging test | At 200 requests/day for 30 days |
|---|---|---|---|
| Claude Haiku 5.5 ($0.10 / $0.50, prompts ≤100k) | ≈ $0.0004 | ≈ $0.02 | ≈ $2.30 |
| Claude Sonnet 5.5 ($2 / $10) | ≈ $0.0077 | ≈ $0.39 | ≈ $46 |

Real usage will be lower than worst case. These are estimates, not limits: the provider-side spend limit is the control.
