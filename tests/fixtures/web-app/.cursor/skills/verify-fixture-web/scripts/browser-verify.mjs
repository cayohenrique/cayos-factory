#!/usr/bin/env node
import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../");
const target = path.resolve(process.argv[2] || path.join(root, "evidence/runtime/browser.json"));
const screenshot = path.resolve(process.argv[3] || path.join(root, "evidence/runtime/browser.png"));

async function resolvePluginRoot() {
  const fromEnv = process.env.CURSOR_PLUGIN_ROOT || process.env.CAYOS_PLUGIN_ROOT;
  if (fromEnv) return path.resolve(fromEnv);
  let current = path.dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 12; depth += 1) {
    const candidate = path.join(current, "scripts/browser-mcp.mjs");
    try {
      await access(candidate);
      return current;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  throw new Error("unable to locate cayos-factory plugin root (set CURSOR_PLUGIN_ROOT)");
}

const pluginRoot = await resolvePluginRoot();
const browserMcp = path.join(pluginRoot, "scripts/browser-mcp.mjs");
const child = spawn(process.execPath, [path.join(root, "app.mjs")], { cwd: root, stdio: ["ignore", "pipe", "inherit"] });
let done = false;

const fail = (error) => {
  if (!done) {
    done = true;
    child.kill();
    console.error(error);
    process.exitCode = 1;
  }
};

child.stdout.once("data", async (chunk) => {
  try {
    const { port } = JSON.parse(String(chunk).trim());
    const url = `http://127.0.0.1:${port}/`;
    const probe = spawn(process.execPath, [browserMcp, "doctor"], { encoding: "utf8" });
    let probeOutput = "";
    probe.stdout.on("data", (data) => { probeOutput += data; });
    await new Promise((resolve) => probe.on("close", resolve));
    const doctor = JSON.parse(probeOutput || "{}");
    if (doctor.status !== "PASS") {
      const response = await fetch(url);
      const body = await response.text();
      const evidence = { seam: "http-fallback", action: "GET /", status: response.status, body, browserDoctor: doctor };
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, `${JSON.stringify(evidence, null, 2)}\n`);
      done = true;
      child.kill();
      if (response.status !== 200 || body !== "hello from fixture") throw new Error("unexpected fallback response");
      console.log(JSON.stringify({ ...evidence, note: "Chrome unavailable; used HTTP fallback" }));
      return;
    }
    const verify = spawn(
      process.execPath,
      [browserMcp, "verify-page", "--url", url, "--expression", "document.body.innerText", "--expect", "hello from fixture", "--evidence", target, "--screenshot", screenshot],
      { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
    );
    let verifyOutput = "";
    verify.stdout.on("data", (data) => { verifyOutput += data; });
    const exitCode = await new Promise((resolve) => verify.on("close", (code) => resolve(code ?? 1)));
    done = true;
    child.kill();
    if (exitCode !== 0) throw new Error(verify.stderr || verifyOutput || "browser verification failed");
    console.log(verifyOutput.trim());
  } catch (error) {
    fail(error.stack || error.message);
  }
});

child.on("error", (error) => fail(error.message));
setTimeout(() => fail("verification timeout"), 15000).unref();
