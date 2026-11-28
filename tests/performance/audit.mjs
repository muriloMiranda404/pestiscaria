import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const origin = process.env.AUDIT_URL || "http://127.0.0.1:3101";
const outputDirectory = path.resolve("test-results/performance");
await fs.mkdir(outputDirectory, { recursive: true });

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: { ...process.env, CHROME_PATH: process.env.CHROMIUM_PATH || "/usr/bin/chromium" } });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`Lighthouse encerrou com código ${code}.`)));
  });
}

const summary = [];
for (const page of [{ name: "inicio", path: "/" }, { name: "cardapio", path: "/cardapio" }]) {
  const reportPath = path.join(outputDirectory, `${page.name}.json`);
  await run(path.resolve("node_modules/.bin/lighthouse"), [new URL(page.path, origin).href,
    "--quiet", "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage", "--output=json", `--output-path=${reportPath}`,
    "--only-categories=performance,accessibility,best-practices,seo",
  ]);
  const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
  if (report.runtimeError) throw new Error(report.runtimeError.message);
  summary.push({
    path: page.path,
    url: report.finalDisplayedUrl,
    timestamp: report.fetchTime,
    version: report.lighthouseVersion,
    scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)])),
    metrics: Object.fromEntries(["largest-contentful-paint", "cumulative-layout-shift", "total-blocking-time", "first-contentful-paint", "speed-index"]
      .map(key => [key, report.audits[key]?.numericValue])),
    failures: Object.entries(report.audits).filter(([, audit]) => audit.score !== null && audit.score < 1 && ["binary", "numeric"].includes(audit.scoreDisplayMode))
      .map(([id, audit]) => ({ id, title: audit.title, displayValue: audit.displayValue })),
  });
}
await fs.writeFile(path.join(outputDirectory, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
