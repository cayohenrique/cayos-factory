#!/usr/bin/env node
import path from "node:path";
import { appendJsonl,locateActiveRoot,readStdin,runDir } from "./lib.mjs";
const input=await readStdin(),active=await locateActiveRoot(path.resolve(input.cwd||process.cwd()));if(active)await appendJsonl(path.join(runDir(active.root,active.runId),"hook-events.jsonl"),{at:new Date().toISOString(),event:input.hook_event_name||"unknown",tool:input.tool_name||null});
