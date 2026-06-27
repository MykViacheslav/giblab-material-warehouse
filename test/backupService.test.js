import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  createBackup,
  createDailyAutoBackup,
  ensureBackupDirectory,
  listBackups,
  resolveBackupPath,
  restoreBackup,
  validateBackupFilename
} from "../src/backupService.js";

test("creates backup directory if missing", () => {
  const { root, backupDir } = tempWorkspace();
  rmSync(backupDir, { recursive: true, force: true });
  ensureBackupDirectory(backupDir);
  assert.equal(existsSync(backupDir), true);
  cleanup(root);
});

test("creates backup file", () => {
  const { root, dbPath, backupDir } = tempWorkspace();
  writeFileSync(dbPath, "active-db");
  const backup = createBackup({ dbPath, backupDir, now: fixedDate() });
  assert.equal(backup.filename, "warehouse-backup-20260626-153000.sqlite");
  assert.equal(readFileSync(path.join(backupDir, backup.filename), "utf8"), "active-db");
  cleanup(root);
});

test("backup filename uses safe timestamp format", () => {
  const { root, dbPath, backupDir } = tempWorkspace();
  writeFileSync(dbPath, "active-db");
  const backup = createBackup({ dbPath, backupDir, now: fixedDate() });
  assert.match(backup.filename, /^warehouse-backup-\d{8}-\d{6}\.sqlite$/);
  cleanup(root);
});

test("lists backups newest first", () => {
  const { root, dbPath, backupDir } = tempWorkspace();
  writeFileSync(dbPath, "active-db");
  createBackup({ dbPath, backupDir, now: new Date("2026-06-26T10:00:00") });
  createBackup({ dbPath, backupDir, now: new Date("2026-06-26T11:00:00") });
  const rows = listBackups(backupDir);
  assert.equal(rows[0].filename, "warehouse-backup-20260626-110000.sqlite");
  cleanup(root);
});

test("rejects invalid filename with traversal", () => {
  assert.throws(() => validateBackupFilename("../warehouse.sqlite"), /Invalid backup filename/);
});

test("rejects absolute path filename", () => {
  assert.throws(() => validateBackupFilename("C:\\Windows\\test.sqlite"), /Invalid backup filename/);
});

test("download path resolves only inside backup directory", () => {
  const { root, backupDir } = tempWorkspace();
  const resolved = resolveBackupPath(backupDir, "warehouse-backup-20260626-153000.sqlite");
  assert.equal(path.dirname(resolved), path.resolve(backupDir));
  assert.throws(() => resolveBackupPath(backupDir, "..\\warehouse-backup-20260626-153000.sqlite"), /Invalid backup filename/);
  cleanup(root);
});

test("restore creates pre-restore backup", () => {
  const { root, dbPath, backupDir } = tempWorkspace();
  writeFileSync(dbPath, "current-db");
  writeFileSync(path.join(backupDir, "warehouse-backup-20260626-153000.sqlite"), "backup-db");
  const result = restoreBackup({ dbPath, backupDir, filename: "warehouse-backup-20260626-153000.sqlite", now: new Date("2026-06-26T16:00:00") });
  assert.equal(result.pre_restore_backup, "warehouse-backup-before-restore-20260626-160000.sqlite");
  assert.equal(readFileSync(path.join(backupDir, result.pre_restore_backup), "utf8"), "current-db");
  cleanup(root);
});

test("restore replaces active database with selected backup", () => {
  const { root, dbPath, backupDir } = tempWorkspace();
  writeFileSync(dbPath, "current-db");
  writeFileSync(path.join(backupDir, "warehouse-backup-20260626-153000.sqlite"), "backup-db");
  restoreBackup({ dbPath, backupDir, filename: "warehouse-backup-20260626-153000.sqlite", now: fixedDate() });
  assert.equal(readFileSync(dbPath, "utf8"), "backup-db");
  cleanup(root);
});

test("restore rejects missing backup", () => {
  const { root, dbPath, backupDir } = tempWorkspace();
  writeFileSync(dbPath, "current-db");
  assert.throws(() => restoreBackup({ dbPath, backupDir, filename: "warehouse-backup-20260626-153000.sqlite" }), /Backup file not found/);
  cleanup(root);
});

test("restore does not accept non-sqlite filename", () => {
  const { root, dbPath, backupDir } = tempWorkspace();
  writeFileSync(dbPath, "current-db");
  writeFileSync(path.join(backupDir, "bad.txt"), "backup-db");
  assert.throws(() => restoreBackup({ dbPath, backupDir, filename: "bad.txt" }), /Invalid backup filename/);
  cleanup(root);
});

test("restore does not delete original backup", () => {
  const { root, dbPath, backupDir } = tempWorkspace();
  const filename = "warehouse-backup-20260626-153000.sqlite";
  writeFileSync(dbPath, "current-db");
  writeFileSync(path.join(backupDir, filename), "backup-db");
  restoreBackup({ dbPath, backupDir, filename, now: fixedDate() });
  assert.equal(existsSync(path.join(backupDir, filename)), true);
  cleanup(root);
});

test("backup service does not modify data content except by restore", () => {
  const { root, dbPath, backupDir } = tempWorkspace();
  createSqliteFile(dbPath, "original-event");
  createBackup({ dbPath, backupDir, now: fixedDate() });
  assert.equal(readEventNote(dbPath), "original-event");

  const restoreSource = path.join(backupDir, "warehouse-backup-20260626-160000.sqlite");
  createSqliteFile(restoreSource, "restored-event");
  restoreBackup({ dbPath, backupDir, filename: "warehouse-backup-20260626-160000.sqlite", now: new Date("2026-06-26T16:30:00") });
  assert.equal(readEventNote(dbPath), "restored-event");
  cleanup(root);
});

test("creates one daily auto backup per day", () => {
  const { root, dbPath, backupDir } = tempWorkspace();
  writeFileSync(dbPath, "active-db");
  createDailyAutoBackup({ dbPath, backupDir, now: fixedDate() });
  createDailyAutoBackup({ dbPath, backupDir, now: fixedDate() });
  const autoBackups = listBackups(backupDir).filter((backup) => backup.filename.startsWith("warehouse-auto-"));
  assert.equal(autoBackups.length, 1);
  cleanup(root);
});

function fixedDate() {
  return new Date("2026-06-26T15:30:00");
}

function tempWorkspace() {
  const root = mkdtempSync(path.join(tmpdir(), "warehouse-backup-test-"));
  const backupDir = path.join(root, "backups");
  ensureBackupDirectory(backupDir);
  return { root, dbPath: path.join(root, "warehouse.sqlite"), backupDir };
}

function cleanup(root) {
  rmSync(root, { recursive: true, force: true });
}

function createSqliteFile(filePath, note) {
  const db = new DatabaseSync(filePath);
  db.exec("CREATE TABLE stock_events (id INTEGER PRIMARY KEY AUTOINCREMENT, note TEXT)");
  db.prepare("INSERT INTO stock_events (note) VALUES (?)").run(note);
  db.close();
}

function readEventNote(filePath) {
  const db = new DatabaseSync(filePath);
  const note = db.prepare("SELECT note FROM stock_events ORDER BY id DESC LIMIT 1").get().note;
  db.close();
  return note;
}
