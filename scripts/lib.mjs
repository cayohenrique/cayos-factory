import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const states = ["PREFLIGHT","TICKET_RESOLVED","UNDERSTANDING_PENDING","TEST_SEAM_PENDING","PLAN_PENDING","READY_TO_IMPLEMENT","IMPLEMENTING","REVIEWING","VERIFYING","READY_FOR_PR","OPENING_PR","DONE","BLOCKED","ABORTED"];
export const transitions = {
  PREFLIGHT:["TICKET_RESOLVED","BLOCKED","ABORTED"], TICKET_RESOLVED:["UNDERSTANDING_PENDING","BLOCKED","ABORTED"],
  UNDERSTANDING_PENDING:["TEST_SEAM_PENDING","BLOCKED","ABORTED"], TEST_SEAM_PENDING:["PLAN_PENDING","UNDERSTANDING_PENDING","BLOCKED","ABORTED"],
  PLAN_PENDING:["READY_TO_IMPLEMENT","TEST_SEAM_PENDING","BLOCKED","ABORTED"], READY_TO_IMPLEMENT:["IMPLEMENTING","PLAN_PENDING","BLOCKED","ABORTED"],
  IMPLEMENTING:["REVIEWING","BLOCKED","ABORTED"], REVIEWING:["IMPLEMENTING","VERIFYING","BLOCKED","ABORTED"],
  VERIFYING:["IMPLEMENTING","READY_FOR_PR","BLOCKED","ABORTED"], READY_FOR_PR:["OPENING_PR","VERIFYING","ABORTED"],
  OPENING_PR:["DONE","BLOCKED"], BLOCKED:["ABORTED"], DONE:[], ABORTED:[]
};
export const approvalFor = { TEST_SEAM_PENDING:"sharedUnderstanding", PLAN_PENDING:"testSeam", READY_TO_IMPLEMENT:"ticketPlan", IMPLEMENTING:"implementation", OPENING_PR:"pullRequest" };
export const sha256 = value => createHash("sha256").update(value).digest("hex");
export const json = async file => JSON.parse(await readFile(file,"utf8"));
export async function writeJson(file,value){ await mkdir(path.dirname(file),{recursive:true}); await writeFile(file,`${JSON.stringify(value,null,2)}\n`); }
export async function appendJsonl(file,value){ await mkdir(path.dirname(file),{recursive:true}); await appendFile(file,`${JSON.stringify(value)}\n`); }
export const activeFile = root => path.join(root,".cayos","runs","active.json");
export const runDir = (root,id) => path.join(root,".cayos","runs",id);
export function gitRoot(cwd){ try{return path.resolve(execFileSync("git",["rev-parse","--show-toplevel"],{cwd,encoding:"utf8",stdio:["ignore","pipe","ignore"]}).trim());}catch{return path.resolve(cwd);} }
export function gitValue(root,args,fallback=""){ try{return execFileSync("git",args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","ignore"]}).trim();}catch{return fallback;} }
export function sharedActiveFile(root){ const common=gitValue(root,["rev-parse","--git-common-dir"],""); const resolved=common?(path.isAbsolute(common)?common:path.resolve(root,common)):root; return path.join(resolved,"cayos-factory","active.json"); }
export async function locateActiveRoot(cwd){ const root=gitRoot(cwd); try{const a=await json(sharedActiveFile(root));return {root:path.resolve(a.projectRoot),runId:a.runId};}catch{} try{const a=await json(activeFile(root));return {root,runId:a.runId};}catch{} return null; }
export async function readStdin(){let data="";for await(const chunk of process.stdin)data+=chunk;return data.trim()?JSON.parse(data):{};}
