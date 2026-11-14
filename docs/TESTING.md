# Development

Use Node.js 26.

```bash
npm ci --ignore-scripts
npm run check
npm test
```

Rebuild the interface dictionaries after editing `locales.js`:

```bash
npm run i18n:build
```

## Browser commands

Start Harness Web with this plugin enabled and at least one cached translation.

```bash
npx playwright install chromium
DSH_TEST_URL=http://127.0.0.1:3080 npm run test:browser
DSH_TEST_URL=http://127.0.0.1:3080 npm run test:workspaces
```

To request a fresh translation with the selected model:

```bash
DSH_TEST_URL=http://127.0.0.1:3080 npm run test:browser -- --retranslate
```

Set `DSH_TEST_ARTIFACTS` to select an output directory.

`tests/browser-scope.mjs` checks the native workspace menu, compact path notes,
keyboard selection and nine viewport widths without changing policies.
`tests/browser-native-controls.mjs` checks native switches, rule menus, tabs,
translation controls and an actual approved MCP tool call. It requires the
isolated host and synthetic Skill/model/MCP fixtures described in the sibling
Soul Desk project's `docs/TESTING.md`; it writes test rules and approvals, so
never target a production profile. Run these scripts sequentially with other
tests that change locale or selections. See
[joint acceptance](./NATIVE-UI-MIGRATION-ACCEPTANCE.zh-CN.md) for this local build.

`tests/browser-model-sync.mjs` uses the same isolated host to verify native
model selection changes, single-click forced translation, automatic cached
display across models/reloads, top-banner feedback and stable list/dialog geometry.
`tests/browser-menu-anchors.mjs` measures each clicked rule/persona/category
button against its menu at several viewport widths, including scroll/outside dismissal.
The model test instruments only its own browser's
fetched plugin module to access the native test context. It creates and archives
its own synthetic session; never point it at a production profile.

`tests/browser-translation-queue.mjs` uses the isolated host and synthetic
`queue-ui-*` fixtures to hold model calls open, measure the global eight-call
cap, queue 12 tasks, fail/retry one item, remove one cache without affecting the
others, verify reload persistence and cancel an old queue on model changes.
It also verifies actual browser concurrency reaches eight using short async
submission/poll requests, leaving other settings requests usable.
