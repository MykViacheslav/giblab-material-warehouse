import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const MANUAL_PREFIX = "warehouse-backup";
const PRE_RESTORE_PREFIX = "warehouse-backup-before-restore";
const AUTO_PREFIX = "warehouse-auto";
const BACKUP_PATTERN = /^warehouse-(?:(?:backup|backup-before-restore)-\d{8}-\d{6}|auto-\d{8})\.sqlite$/;

export function ensureBackupDirectory(backupDir) {
  mkdirSync(backupDir, { recursive: true });
  return backupDir;
}

export function createBackup({ dbPath, backupDir, now = new Date(), prefix = MANUAL_PREFIX }) {
  ensureBackupDirectory(backupDir);
  if (!existsSync(dbPath)) throw new Error("Database file not found");
  const filename = buildBackupFilename(prefix, now);
  const target = resolveBackupPath(backupDir, filename);
  copyFileSync(dbPath, target);
  return backupInfo(target, filename);
}

export function createDailyAutoBackup({ dbPath, backupDir, now = new Date() }) {
  ensureBackupDirectory(backupDir);
  if (!existsSync(dbPath)) return null;
  const filename = `warehouse-auto-${formatDate(now)}.sqlite`;
  const target = resolveBackupPath(backupDir, filename);
  if (existsSync(target)) return backupInfo(target, filename);
  copyFileSync(dbPath, target);
  return backupInfo(target, filename);
}

export function listBackups(backupDir) {
  ensureBackupDirectory(backupDir);
  return readdirSync(backupDir)
    .filter((filename) => BACKUP_PATTERN.test(filename))
    .map((filename) => backupInfo(resolveBackupPath(backupDir, filename), filename))
    .sort((first, second) => {
      const byDate = backupSortKey(second.filename).localeCompare(backupSortKey(first.filename));
      return byDate || second.filename.localeCompare(first.filename);
    });
}

export function validateBackupFilename(filename) {
  const clean = String(filename || "");
  if (clean !== path.basename(clean)) throw new Error("Invalid backup filename");
  if (path.isAbsolute(clean)) throw new Error("Invalid backup filename");
  if (!BACKUP_PATTERN.test(clean)) throw new Error("Invalid backup filename");
  return clean;
}

export function resolveBackupPath(backupDir, filename) {
  const safeName = validateBackupFilename(filename);
  const root = path.resolve(backupDir);
  const resolved = path.resolve(root, safeName);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Invalid backup path");
  return resolved;
}

export function restoreBackup({ dbPath, backupDir, filename, now = new Date() }) {
  ensureBackupDirectory(backupDir);
  const safeName = validateBackupFilename(filename);
  const source = resolveBackupPath(backupDir, safeName);
  if (!existsSync(source)) throw new Error("Backup file not found");
  if (!existsSync(dbPath)) throw new Error("Database file not found");

  const preRestore = createBackup({ dbPath, backupDir, now, prefix: PRE_RESTORE_PREFIX });
  const tempPath = `${dbPath}.restore-${Date.now()}.tmp`;
  const replacedPath = `${dbPath}.restore-replaced-${Date.now()}.tmp`;

  try {
    copyFileSync(source, tempPath);
    renameSync(dbPath, replacedPath);
    renameSync(tempPath, dbPath);
    rmSync(replacedPath, { force: true });
  } catch (error) {
    try {
      if (!existsSync(dbPath) && existsSync(replacedPath)) renameSync(replacedPath, dbPath);
    } catch {
      // The original error is more useful to the caller.
    }
    rmSync(tempPath, { force: true });
    throw error;
  }

  return {
    message: "Database restored",
    restored_from: safeName,
    pre_restore_backup: preRestore.filename
  };
}

export function enforceBackupRetention({ backupDir, keep = 30 }) {
  const removable = listBackups(backupDir).filter((backup) => !backup.filename.startsWith(`${PRE_RESTORE_PREFIX}-`));
  removable.slice(keep).forEach((backup) => {
    rmSync(resolveBackupPath(backupDir, backup.filename), { force: true });
  });
}

export function buildBackupFilename(prefix = MANUAL_PREFIX, now = new Date()) {
  if (prefix === AUTO_PREFIX) return `${AUTO_PREFIX}-${formatDate(now)}.sqlite`;
  if (![MANUAL_PREFIX, PRE_RESTORE_PREFIX].includes(prefix)) throw new Error("Invalid backup prefix");
  return `${prefix}-${formatDate(now)}-${formatTime(now)}.sqlite`;
}

function backupInfo(filePath, filename) {
  const stats = statSync(filePath);
  return {
    filename,
    size_bytes: stats.size,
    created_at: stats.mtime.toISOString()
  };
}

function backupSortKey(filename) {
  const timed = filename.match(/-(\d{8})-(\d{6})\.sqlite$/);
  if (timed) return `${timed[1]}${timed[2]}`;
  const daily = filename.match(/-(\d{8})\.sqlite$/);
  if (daily) return `${daily[1]}000000`;
  return "";
}

function formatDate(now) {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");
}

function formatTime(now) {
  return [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");
}
