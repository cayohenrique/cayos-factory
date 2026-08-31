---
name: verify-fixture-web
description: Verify the fixture web server through its public HTTP boundary.
---
# Verify fixture web
## Launch
Run `node app.mjs` and capture its JSON port line.
## Doctor
Require Node.js, `app.mjs`, and an available loopback port.
## Drive
Send `GET /` to the reported loopback port.
## Evidence
Persist method, route, status, and response body as JSON.
## Cleanup
Terminate only the launched child and keep evidence.
## Helpers
Run `node scripts/verify.mjs <evidence-path>`.
