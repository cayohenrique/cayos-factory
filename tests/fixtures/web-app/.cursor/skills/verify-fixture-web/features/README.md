# Feature map
| Feature | Action | Result | Helper |
|---|---|---|---|
| Greeting (browser) | `browser_navigate http://127.0.0.1:<port>/` | body text `hello from fixture` | `scripts/browser-verify.mjs` |
| Greeting (http fallback) | `GET /` | 200 and `hello from fixture` | `scripts/verify.mjs` |
