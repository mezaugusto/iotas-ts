# Copilot Instructions

## Project overview

TypeScript API client library for the IOTAS smart home platform, designed for use in Homebridge and Matterbridge plugins. Published as an ESM-only npm package.

## Commands

```bash
npm run build        # Clean build (rm -rf dist && tsc)
npm run lint         # ESLint with zero warnings allowed
npm run format       # Prettier format
npm run format:check # Prettier check
npm test             # Build then run tests: tsc && node --test dist/test/*.test.js

# Run a single test file
npm run build && node --test dist/test/session.test.js
```

## Architecture

The library has three layers:

- **`IotasSession`** (`src/api/session.ts`) — manages authentication and token lifecycle (login, JWT refresh, retry with backoff, request deduplication).
- **`IotasTransport`** (`src/api/transport.ts`) — authenticated HTTP transport. Injects bearer tokens via `Headers` API, retries on 401 by invalidating the token and re-authenticating.
- **`IotasClient`** (`src/api/iotasClient.ts`) — high-level API client. Resolves the user's unit, discovers rooms/devices/features, and provides feature read/write operations. `getFeature()` uses an O(1) `Map<string, Feature>` index built from `getRooms()`. `updateFeatureReliable` sends redundant PUT calls for Z-Wave reliability. `updateFeature` applies `encodeURIComponent()` to user-provided `featureId` in URL paths.
- **`FeatureCache`** (`src/cache/featureCache.ts`) — polls `getRooms()` on an interval, caches feature values, and notifies subscribers of changes via `FeatureChangeCallback(changed: Map<string, number>)`. Uses a write barrier to prevent stale poll data from overwriting recent writes, and exponential backoff on poll failures.
- **`isTokenExpired`** (`src/api/jwt.ts`) — checks JWT `exp` claim without signature verification. Must NOT be used for authN/authZ; only for avoiding sending expired tokens.

## Conventions

- **ESM with `.js` extensions** — all imports use `.js` extensions (e.g., `import { Foo } from './foo.js'`), required by `"module": "nodenext"`.
- **Dependency injection for testability** — `fetch` and `delay` functions are injected via options rather than using globals directly. Tests provide mock implementations with `node:test`'s `mock.fn()`. No global state patching in tests.
- **Node.js built-in test runner** — tests use `node:test` (`describe`, `it`, `beforeEach`, `mock`) and `node:assert`. No third-party test frameworks.
- **Options pattern** — classes accept a single options object with sensible defaults (see `IotasClientOptions`, `FeatureCacheOptions`, `IotasSessionOptions`, `IotasTransportOptions`).
- **Feature IDs are strings** — feature IDs from the API are numbers but are converted to strings (via `.toString()`) for use as map keys throughout the codebase.
- **Prettier config** is in `package.json`: single quotes, trailing commas, 2-space indent, semicolons, 120 char print width.
- **Error logging** — catch blocks log only `error.message` (or `String(error)`) to avoid leaking credentials or tokens from error objects.
- **Conventional Commits** — commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `feat!:`, `docs:`, `chore:`, `refactor:`). Release-please automates versioning and changelogs.

## CI/CD

- **CI** (`.github/workflows/ci.yml` + `ci-shared.yml`) — runs lint, build, test on Node 20/22/24 for PRs to `main`.
- **Release** (`.github/workflows/release.yml`) — on push to `main`, release-please opens a release PR. Merging it triggers CI then publishes to npm with OIDC provenance (trusted publishers, no npm token needed).
