const iconv = require('iconv-lite');
const fs = require('fs');

const corruptedHex = 'c384c485c3a2e282acc5a1'; // from "NieopÄąâ€šacone" (the Äąâ€š part)
const corruptedBuf = Buffer.from(corruptedHex, 'hex');
const corruptedStr = corruptedBuf.toString('utf8');

console.log("Target corrupted string:", corruptedStr);

const targetOriginal = 'ł';
const targetBuf = Buffer.from(targetOriginal, 'utf8');

const encodings = ['win1250', 'win1252', 'iso-8859-1', 'iso-8859-2', 'macroman'];

for (let e1 of encodings) {
    for (let e2 of encodings) {
        // Assume original was UTF-8.
        // It was read using e1 (so bytes became characters in e1)
        // Then it was saved... wait
        // Let's just try:
        try {
            // Reversing the corruption:
            // The file currently has corruptedStr (valid UTF-8 string).
            // We need to encode it back to bytes using e2.
            const bytesBack = iconv.encode(corruptedStr, e2);
            // Then decode those bytes using e1 to get the original UTF-8 string.
            const reversed = iconv.decode(bytesBack, e1);
            if (reversed === targetOriginal) {
                console.log(`FOUND REVERSE! encode to ${e2}, decode from ${e1}`);
            }
        } catch(e) {}
    }
}

// Let's also try triple encoding just in case
for (let e1 of encodings) {
  for (let e2 of encodings) {
    for (let e3 of encodings) {
      try {
        const bytes1 = iconv.encode(corruptedStr, e3);
        const str1 = iconv.decode(bytes1, 'utf8');
        const bytes2 = iconv.encode(str1, e2);
        const reversed = iconv.decode(bytes2, e1);
        if (reversed === targetOriginal) {
            console.log(`FOUND TRIPLE REVERSE! e3=${e3}, e2=${e2}, e1=${e1}`);
        }
      } catch(e) {}
    }
  }
}
