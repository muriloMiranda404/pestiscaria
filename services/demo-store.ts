import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { demoFixtures } from "@/services/demo-fixtures";
import { StoreError } from "@/services/errors";
import type { Catalog, Metric, QrEntry } from "@/types/domain";

function connect() {
  if (process.env.APP_MODE !== "demo") throw new StoreError(403, "A demonstração está desativada.");
  const path = resolve(/* turbopackIgnore: true */ process.env.DEMO_DB_PATH || ".local/demo.sqlite");
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS catalog (id INTEGER PRIMARY KEY CHECK (id=1), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS metrics (id TEXT PRIMARY KEY, kind TEXT NOT NULL, subject TEXT NOT NULL, campaign TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS metric_period ON metrics(created_at);
    CREATE TABLE IF NOT EXISTS qr_codes (id TEXT PRIMARY KEY, label TEXT NOT NULL, table_code TEXT NOT NULL, template TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, action TEXT NOT NULL, created_at TEXT NOT NULL);`);
  db.prepare("INSERT OR IGNORE INTO catalog(id,data) VALUES(1,?)").run(JSON.stringify(demoFixtures()));
  return db;
}

export function readDemo(): Catalog {
  const db = connect();
  try { return JSON.parse((db.prepare("SELECT data FROM catalog WHERE id=1").get() as { data: string }).data) as Catalog; }
  finally { db.close(); }
}

/** A single transaction serializes read-modify-write, including concurrent requests. */
export function changeDemo<T>(action: string, update: (catalog: Catalog) => T): T {
  const db = connect();
  try {
    db.exec("BEGIN IMMEDIATE");
    const catalog = JSON.parse((db.prepare("SELECT data FROM catalog WHERE id=1").get() as { data: string }).data) as Catalog;
    const result = update(catalog);
    db.prepare("UPDATE catalog SET data=? WHERE id=1").run(JSON.stringify(catalog));
    db.prepare("INSERT INTO audit_logs VALUES(?,?,?)").run(randomUUID(), action, new Date().toISOString());
    db.exec("COMMIT");
    return result;
  } catch (error) { if (db.isTransaction) db.exec("ROLLBACK"); throw error; }
  finally { db.close(); }
}

export function demoMetrics(from: string, to: string): Metric[] {
  const db = connect();
  try { return db.prepare("SELECT kind,subject,campaign,created_at FROM metrics WHERE created_at>=? AND created_at<? ORDER BY created_at DESC").all(from, to) as unknown as Metric[]; }
  finally { db.close(); }
}

export function appendDemoMetric(data: Omit<Metric, "created_at">) {
  const db = connect();
  try {
    db.exec("BEGIN IMMEDIATE");
    const catalog = JSON.parse((db.prepare("SELECT data FROM catalog WHERE id=1").get() as { data: string }).data) as Catalog;
    if (catalog.settings.analytics_enabled) db.prepare("INSERT INTO metrics VALUES(?,?,?,?,?)").run(randomUUID(), data.kind, data.subject, data.campaign, new Date().toISOString());
    db.exec("COMMIT");
  } catch (error) { if (db.isTransaction) db.exec("ROLLBACK"); throw error; }
  finally { db.close(); }
}

export function demoQr(): QrEntry[] {
  const db = connect();
  try { return db.prepare("SELECT * FROM qr_codes ORDER BY created_at DESC").all() as unknown as QrEntry[]; }
  finally { db.close(); }
}

export function appendDemoQr(data: Omit<QrEntry, "id" | "created_at">): QrEntry {
  const row = { ...data, id: randomUUID(), created_at: new Date().toISOString() };
  const db = connect();
  try { db.prepare("INSERT INTO qr_codes VALUES(?,?,?,?,?)").run(row.id, row.label, row.table_code, row.template, row.created_at); return row; }
  finally { db.close(); }
}

export function clearDemo() {
  const db = connect();
  try {
    db.exec("BEGIN IMMEDIATE");
    db.prepare("UPDATE catalog SET data=? WHERE id=1").run(JSON.stringify(demoFixtures()));
    db.exec("DELETE FROM metrics; DELETE FROM qr_codes; DELETE FROM audit_logs; COMMIT");
  } catch (error) { if (db.isTransaction) db.exec("ROLLBACK"); throw error; }
  finally { db.close(); }
}
