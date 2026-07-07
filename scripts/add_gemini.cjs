const fs = require('fs');

let js = fs.readFileSync('server.js', 'utf8');

// 1. Add dotenv import if not exists
if (!js.includes('import dotenv from "dotenv"')) {
  js = js.replace(
    'import express from "express";',
    'import dotenv from "dotenv";\ndotenv.config();\nimport express from "express";'
  );
}

// 2. Replace /api/ocr/cut-text
const oldOcrStart = 'app.post("/api/ocr/cut-text", upload.single("photo"), async (request, response) => {';
const oldOcrEnd = 'response.status(500).json({ error: "Nie udao si odczyta tekstu ze zdjcia" });\n    }\n  });';
const oldOcrEndFallback = 'response.status(500).json({ error: "Nie udało się odczytać tekstu ze zdjęcia" });\n    }\n  });';

const newOcr = `app.post("/api/ocr/cut-text", upload.single("photo"), async (request, response) => {
    try {
      if (!request.file?.buffer) return response.status(400).json({ error: "Missing photo" });

      if (process.env.GEMINI_API_KEY) {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using pro model because it handles complex handwritten sketches much better than flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = \`Otrzymujesz zdjęcie ręcznych notatek stolarza z listą formatek.
Zignoruj całkowicie wszelkie rysunki profilowe, schematy frezowania, szkice (np. kółka, trójkąty, schodki).
Zignoruj pozycje przekreślone.
Wyciągnij tylko listę formatek w formacie: Długość x Szerokość x Ilość.
Jeśli formatka ma dopisaną notatkę słowną (np. "Bez frezu w środku", "Blenda gładka", "Witryna"), dopisz to na końcu danej linii.
Zwróć TYLKO czystą listę (każda formatka w nowej linii). Nie dodawaj żadnych wstępów ani komentarzy.\`;
        
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: request.file.buffer.toString("base64"),
              mimeType: request.file.mimetype || "image/jpeg"
            }
          }
        ]);
        const resultText = result.response.text();
        return response.json({ text: resultText });
      }

      // Fallback to Tesseract
      const fsPromises = await import("node:fs/promises");
      const os = await import("node:os");
      const tempFilePath = path.join(os.tmpdir(), \`ocr_\${Date.now()}_\${Math.floor(Math.random() * 10000)}.jpg\`);
      await fsPromises.writeFile(tempFilePath, request.file.buffer);
  
      let resultText = "";
      try {
        const worker = await createWorker("pol+eng");
        const result = await worker.recognize(tempFilePath);
        await worker.terminate();
        resultText = result.data.text || "";
      } finally {
        await fsPromises.unlink(tempFilePath).catch(() => {});
      }
  
      response.json({ text: "UWAGA: Brak klucza GEMINI_API_KEY w pliku .env. Użyto starego ślepego skanera.\\n\\n" + normalizeOcrText(resultText) });
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: "Nie udało się odczytać tekstu ze zdjęcia. Sprawdź logi." });
    }
  });`;

// Replace using regex to match the whole block since it might have encoding issues
js = js.replace(/app\.post\("\/api\/ocr\/cut-text"[\s\S]*?response\.status\(500\)\.json\([^)]+\);\s*\}\s*\}\);/, newOcr);

fs.writeFileSync('server.js', js, 'utf8');
console.log("server.js updated with Gemini integration.");
