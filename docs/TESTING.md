# Testing

## Automated tests

Use Node.js 26 and npm:

```bash
npm ci --ignore-scripts
npm run check
npm test
```

The 43 tests cover global and workspace rules, root-agent scope inheritance, Skill loading, MCP tools/resources, nested calls, source selection, authentication, persistence and concurrency, current-model selection, translation caching, explicit retranslation, workspace display-title priority, and canonical workspace identity.

Tests use the real DSH registries and MCP client with a small local test server. They require permission to bind a loopback HTTP port and spawn a local Node.js process. Model tests use stubs and do not consume model API credits.

## Optional browser checks

Start a compatible DSH Web instance, enable the plugin and make at least one Skill with a cached translation visible. Then install Chromium and run:

```bash
npx playwright install chromium
DSH_TEST_URL=http://127.0.0.1:3080 npm run test:browser
```

The browser must be able to access the DSH instance using its normal authentication rules. If it needs an authentication link, use that link in the browser setup before running the checks. The supplied script expects an already accessible local or trusted-network instance; it does not disable authentication.

The test checks 9 viewport widths (320–1440 px), equal control heights and alignment, horizontal overflow, the bottom-right 28×28 px translation button, local cached-text toggling without translation requests, and persistence after reload. It does not modify discovery or capability rules.

Artifacts are written to `test-results/` by default. Override the output directory with `DSH_TEST_ARTIFACTS`.

To additionally call the configured model once and verify explicit retranslation and replacement caching:

```bash
DSH_TEST_URL=http://127.0.0.1:3080 npm run test:browser -- --retranslate
```

This optional command consumes the configured model's API credits and replaces one cached translation. The regular automated tests do neither.

### Live workspace rename check

With DSH running on the same host and the updated plugin enabled:

```bash
DSH_TEST_URL=http://127.0.0.1:3080 npm run test:workspaces
```

This creates a temporary directory and workspace registration, renames it twice through DSH's native API, and checks the settings selector without closing the page. HTTP polling is deliberately held at an older title to verify that the sidebar's live workspace store supplies the name. It also checks that the selected directory and policy revision stay unchanged. The temporary workspace registration and directory are removed afterwards; no conversation is created and no model is called.
