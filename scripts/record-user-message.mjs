#!/usr/bin/env node
import path from "node:path";
import { appendJsonl,json,locateActiveRoot,readStdin,runDir,sha256 } from "./lib.mjs";
const input=await readStdin(),cwd=path.resolve(input.cwd||process.cwd()),active=await locateActiveRoot(cwd);if(!active)process.exit(0);const dir=runDir(active.root,active.runId),state=await json(path.join(dir,"state.json")),prompt=String(input.prompt||input.message||"").trim(),expected=state.pendingApproval?.approvalCommand||"",approved=Boolean(expected&&prompt===expected);await appendJsonl(path.join(dir,"user-approvals.jsonl"),{at:new Date().toISOString(),promptHash:sha256(prompt),approved,gate:state.pendingApproval?.gate||null,proposalHash:state.pendingApproval?.proposalHash||null});
