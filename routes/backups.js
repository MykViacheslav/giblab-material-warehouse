import { Router } from "express";
import { existsSync } from "node:fs";
import {
  listBackups,
  createBackup,
  enforceBackupRetention,
  resolveBackupPath,
  restoreBackup
} from "../src/backupService.js";

export function createBackupsRouter({ db, dbPath, backupDir, appState }) {
  const router = Router();

  router.get("/", (request, response) => {
    response.json(listBackups(backupDir));
  });

  router.post("/", (request, response) => {
    db.exec("PRAGMA wal_checkpoint(FULL)");
    const backup = createBackup({ dbPath, backupDir });
    enforceBackupRetention({ backupDir, keep: 30 });
    response.status(201).json({ filename: backup.filename, message: "Backup created" });
  });

  router.get("/:filename/download", (request, response) => {
    try {
      const filename = request.params.filename;
      const filePath = resolveBackupPath(backupDir, filename);
      if (!existsSync(filePath)) return response.status(404).json({ error: "Backup file not found" });
      response.setHeader("Content-Type", "application/octet-stream");
      response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      response.sendFile(filePath);
    } catch (error) {
      response.status(400).json({ error: error.message || "Invalid backup filename" });
    }
  });

  router.post("/:filename/restore", (request, response) => {
    let databaseClosed = false;
    try {
      const backupPath = resolveBackupPath(backupDir, request.params.filename);
      if (!existsSync(backupPath)) return response.status(404).json({ error: "Backup file not found" });

      db.exec("PRAGMA wal_checkpoint(FULL)");
      db.close();
      databaseClosed = true;
      const result = restoreBackup({ dbPath, backupDir, filename: request.params.filename });
      appState.restoreRequiresRestart = true;
      response.json({
        ...result,
        message: "Database restored. Please restart the server.",
        restart_required: true
      });
    } catch (error) {
      if (databaseClosed) appState.restoreRequiresRestart = true;
      response.status(400).json({
        error: error.message || "Could not restore backup",
        restart_required: appState.restoreRequiresRestart
      });
    }
  });

  return router;
}
