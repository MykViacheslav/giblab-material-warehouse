const fs = require('fs');
const xml = fs.readFileSync('C:/GibLabLocal/projects/ZAM-2026-0002-testowe zam.project', 'utf8');
const jobName = 'Pozycja 3';

let partIds = new Set();
for (const m of xml.matchAll(/<good[^>]*typeId="product"[^>]*name="[^"]*"([^>]*|.*?)<\/good>/gi)) {
  if (m[0].includes(jobName)) {
    for (const pm of m[0].matchAll(/<part[^>]*id="([0-9]+)"/gi)) {
      partIds.add(pm[1]);
    }
  }
}
console.log('Job Part IDs:', [...partIds]);

let sheetIds = new Set();
for (const m of xml.matchAll(/<pattern[^>]*sheet="([0-9]+)"[^>]*>(.*?)<\/pattern>/gi)) {
  const patternBody = m[2];
  for (const pid of partIds) {
    if (patternBody.includes('part.id="' + pid + '"')) {
      sheetIds.add(m[1]);
      break;
    }
  }
}
console.log('Sheet IDs:', [...sheetIds]);

let dbIds = new Set();
for (const m of xml.matchAll(/<good[^>]*typeId="sheet"[^>]*>(.*?)<\/good>/gi)) {
  const sheetBody = m[1];
  for (const pm of sheetBody.matchAll(/<part[^>]*dbId="([^"]+)"[^>]*id="([0-9]+)"/gi)) {
    if (sheetIds.has(pm[2])) {
      dbIds.add(pm[1]);
    }
  }
}
console.log('DB IDs:', [...dbIds]);
