import path from "node:path";

export function isWarehouseExportProject(filePath) {
  const name = path.basename(String(filePath || "")).toLowerCase();
  return name.startsWith("zam-") && name.endsWith(".project");
}

export function hasFinishedGibLabResult(xml) {
  const text = String(xml || "");
  if (/\b(?:waste|businessWaste)=["']true["']/i.test(text)) return true;
  if (/\b(?:dblId|dbId|dblid|dbid)=["'][^"']+["']/i.test(text)) return true;

  for (const match of text.matchAll(/\busedCount=["']([^"']+)["']/gi)) {
    const value = Number(String(match[1]).replace(",", "."));
    if (Number.isFinite(value) && value > 0) return true;
  }
  return false;
}

export function projectFingerprint(stats = {}) {
  return `${Number(stats.size || 0)}:${Number(stats.mtimeMs || 0)}`;
}
