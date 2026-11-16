# FreeLLMAPI fork — end-state blueprint

## Final product
A stable self-hosted **OpenAI-compatible gateway** that connects user-authorized AI providers, routes requests according to capability, cost and quotas, protects credentials, and reports when models or providers are unavailable.

## Foundation and permissions
This repository contains upstream-derived FreeLLMAPI software. Preserve upstream credits and licenses. Marketing numbers for free providers, endpoints, subscriptions and quotas are **not guaranteed current** and must be tested against provider terms and live catalogs, never assumed from README figures.

## Production invariants
- Explicit provider connection and scoped API keys; secrets encrypted at rest and never sent to logs, browsers or telemetry payloads.
- Auth required for remotely exposed endpoints; rate limiting and anti-abuse defaults; clear LAN-only/local deployment paths.
- Accurate OpenAI-compatible request/response behavior (chat, compatible streaming, tools, errors, embeddings/media when supported).
- Routing that checks **actual** capability, budgets, current quotas and timeout; bounded retries and predictable fallback, with no silent duplicate charged calls.
- Deterministic provider isolation, key rotation/revocation, per-key usage history, readable privacy notices and opt-in diagnostics.
- Reproducible versioned upgrades, backup/migration, Docker image security and compatibility with current provider terms.

## Existing baseline
Large workspace/monorepo: server, client, CLI, desktop, docs, integration suites, Docker packaging and model catalog. This is not a reason to overwrite or fork-diverge without a specific test.

## Definition of done
Run `npm test`, `npm run lint`, `npm run build`, migration tests and container smoke tests. Test revoked keys, missing credentials, quota exhaustion, provider timeouts, streaming cancellation, retry duplication, schema compatibility, invalid catalog updates and air-gapped operation. Verify a deployed isolated gateway using only test credentials.

## Build sequence
Security/key isolation → protocol regressions → cost/routing correctness → deployment/testing → release discipline.
