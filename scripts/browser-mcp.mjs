#!/usr/bin/env node
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverEntry = path.join(pluginRoot, "node_modules/chrome-agent-mcp/dist/index.js");
const raw = process.argv.slice(2);
const command = raw[0] || "help";

function value(name) {
  const index = raw.indexOf(`--${name}`);
  return index >= 0 ? raw[index + 1] : "";
}

function parseJsonArg(input, label) {
  if (!input) return {};
  try {
    return JSON.parse(input);
  } catch {
    throw new Error(`invalid JSON for ${label}`);
  }
}

async function checkChrome(debugPort) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Chrome debug endpoint returned ${response.status}`);
    const body = await response.json();
    return { ok: true, browser: body.Browser || "unknown", port: debugPort };
  } catch (error) {
    return { ok: false, port: debugPort, detail: error.name === "AbortError" ? "connection timeout" : error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function withClient(debugPort, run) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    env: { ...process.env, CHROME_DEBUG_PORT: String(debugPort) },
  });
  const client = new Client({ name: "cayos-browser-mcp", version: "1.0.0" });
  await client.connect(transport);
  try {
    return await run(client);
  } finally {
    await client.close();
  }
}

function textContent(result) {
  return (result?.content || [])
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

async function doctor() {
  const debugPort = Number(value("port") || process.env.CHROME_DEBUG_PORT || 9222);
  const chrome = await checkChrome(debugPort);
  let mcp = { ok: false, detail: "not checked" };
  if (chrome.ok) {
    try {
      const tools = await withClient(debugPort, (client) => client.listTools());
      mcp = { ok: true, tools: tools.tools.map((tool) => tool.name) };
    } catch (error) {
      mcp = { ok: false, detail: error.message };
    }
  }
  const status = chrome.ok && mcp.ok ? "PASS" : "FAIL";
  const out = { status, chrome, mcp };
  console.log(JSON.stringify(out, null, 2));
  process.exitCode = status === "PASS" ? 0 : 1;
}

async function callTool() {
  const debugPort = Number(value("port") || process.env.CHROME_DEBUG_PORT || 9222);
  const tool = value("tool");
  if (!tool) throw new Error("--tool is required");
  const args = parseJsonArg(value("args"), "--args");
  const result = await withClient(debugPort, (client) => client.callTool({ name: tool, arguments: args }));
  console.log(JSON.stringify(result, null, 2));
}

async function verifyPage() {
  const debugPort = Number(value("port") || process.env.CHROME_DEBUG_PORT || 9222);
  const url = value("url");
  const expression = value("expression") || "document.body?.innerText || ''";
  const expect = value("expect");
  const evidencePath = path.resolve(value("evidence") || "evidence/runtime/browser.json");
  const screenshotPath = value("screenshot") ? path.resolve(value("screenshot")) : "";
  if (!url) throw new Error("--url is required");

  const chrome = await checkChrome(debugPort);
  if (!chrome.ok) throw new Error(`Chrome remote debugging unavailable on port ${debugPort}: ${chrome.detail}`);

  const result = await withClient(debugPort, async (client) => {
    const navigation = await client.callTool({ name: "browser_navigate", arguments: { url } });
    const evaluated = await client.callTool({
      name: "browser_evaluate",
      arguments: { expression, returnByValue: true },
    });
    let screenshot = null;
    if (screenshotPath) {
      screenshot = await client.callTool({ name: "browser_take_screenshot", arguments: { fullPage: true } });
    }
    return { navigation, evaluated, screenshot };
  });

  const observed = textContent(result.evaluated).trim();
  const evidence = {
    seam: "browser",
    action: `browser_navigate ${url}`,
    expression,
    observed,
    navigation: textContent(result.navigation),
    screenshot: screenshotPath || null,
  };
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  if (screenshotPath && result.screenshot?.content?.[0]?.type === "image") {
    await writeFile(screenshotPath, Buffer.from(result.screenshot.content[0].data, "base64"));
  }
  if (expect !== undefined && observed !== expect) {
    throw new Error(`browser assertion failed: expected ${JSON.stringify(expect)}, got ${JSON.stringify(observed)}`);
  }
  console.log(JSON.stringify(evidence, null, 2));
}

async function help() {
  console.log(`Usage:
  node browser-mcp.mjs doctor [--port 9222]
  node browser-mcp.mjs call --tool <name> [--args '{"key":"value"}'] [--port 9222]
  node browser-mcp.mjs verify-page --url <url> [--expression <js>] [--expect <text>] [--evidence <path>] [--screenshot <path>] [--port 9222]`);
}

try {
  switch (command) {
    case "doctor":
      await doctor();
      break;
    case "call":
      await callTool();
      break;
    case "verify-page":
      await verifyPage();
      break;
    default:
      await help();
      process.exitCode = command === "help" ? 0 : 1;
  }
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}
