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
