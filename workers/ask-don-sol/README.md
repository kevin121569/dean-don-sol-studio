# Ask Don Sol proxy — NOT DEPLOYED, NOT ENABLED, NOT OPERATIONAL
The page `/ask-don-sol/` is a non-functional **preview** (noindex, not in the sitemap, input disabled, "coming soon" banner) until activation. GitHub Pages cannot hold secrets, so live chat needs this proxy and a paid AI provider. **Nothing here may be deployed or activated without Kevin's explicit approval.**

## Security model
- **Origin is not authentication.** Any script can forge an `Origin` header. It is used only for CORS headers.
- **Turnstile (free)** — each message carries a single-use token verified server-side before any counters or provider call.
- **Atomic limits** — Durable Object counters (one object per key, serialized with `blockConcurrencyWhile`): per-visitor hourly cap, global daily request cap, and a global in-flight limit. KV is not used because KV read-modify-write is not atomic and concurrent requests can bypass a counter.
- **Strict inputs** — JSON only, ≤8 KB body, ≤12 messages, ≤500 chars each, ≤4000 total, strict user/assistant alternation ending on a user turn; invalid input is rejected (400/413/415), not repaired.
- **Safe failures** — 15 s provider timeout, provider error bodies never forwarded, malformed/empty provider replies become generic errors, replies capped at 2000 chars, system prompt contains public facts only, nothing is stored.
- **Fail closed** — returns 503 unless ENABLED, SPEND_LIMIT_CONFIRMED, API key, MODEL, TURNSTILE_SECRET and the Durable Object binding are all present.

## A request cap is NOT a spending limit
`DAILY_CAP` limits how many requests are accepted per UTC day; it does not limit money. Cost depends on tokens and on the provider's current price, which can change, and counters can be wrong or reset by a bug or redeploy. Worst case per request is roughly: system prompt + up to 4000 characters of history as input, plus 400 output tokens. Multiply by `DAILY_CAP` and by the provider's *current* published prices to estimate a ceiling; do not rely on this document for prices.
**Before activation a provider-side hard spending limit must exist** (a monthly spend limit on the dedicated API key/workspace in the provider console, with billing alerts) and only then may `SPEND_LIMIT_CONFIRMED` be set to "true".

## Activation checklist (all require Kevin's approval; none done)
1. Kevin approves provider, model, and monthly spend ceiling.
2. Create a dedicated API key/workspace with a hard monthly spend limit and alerts; record the limit.
3. Create a Turnstile widget (free); put the secret in `wrangler secret put TURNSTILE_SECRET`.
4. `wrangler secret put ANTHROPIC_API_KEY`; set MODEL; set SPEND_LIMIT_CONFIRMED="true", ENABLED="true"; `wrangler deploy`.
5. Live tests against the deployed Worker: happy path, multi-turn (≥7 turns), forced provider failure, Turnstile failure, rate/daily cap, concurrency burst, prompt-injection attempts, mobile + desktop.
6. Only after step 5 passes: add `window.ASK_DON_SOL_ENDPOINT` and `window.ASK_DON_SOL_TURNSTILE_SITEKEY` in a separate reviewed change, remove the noindex/preview banner, add to sitemap, and re-run `node tests/ask-don-sol.cjs` (its release-gate checks must be updated in the same change).
