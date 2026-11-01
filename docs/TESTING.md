# Development checks

Use Node.js 26:

```bash
npm ci --ignore-scripts
npm run check
npm test
```

Coverage includes global/workspace rules, session scope, Skill loading, MCP calls, discovery, translations, caching, persistence, hot reloads, and workspace labels. CI runs against both supported Harness versions.

## Browser checks

Start an accessible Harness Web instance with this plugin enabled and a Skill with a cached translation:

```bash
npx playwright install chromium
DSH_TEST_URL=http://127.0.0.1:3080 npm run test:browser
```

The browser check covers responsive controls, translation actions, cache display, and reload behavior. Set `DSH_TEST_ARTIFACTS` to change the output directory from `test-results/`.

Add `-- --retranslate` to exercise translation through the configured model and replace one cached result:

```bash
DSH_TEST_URL=http://127.0.0.1:3080 npm run test:browser -- --retranslate
```

Check live workspace renames with:

```bash
DSH_TEST_URL=http://127.0.0.1:3080 npm run test:workspaces
```
