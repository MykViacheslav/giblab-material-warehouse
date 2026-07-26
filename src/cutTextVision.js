import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.5-flash";
const MIN_PART_SIDE_MM = 20;
const MAX_QUANTITY = 99;

export async function readCutTextWithGemini({ buffer, mimeType, apiKey, modelName = DEFAULT_MODEL }) {
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  if (!buffer?.length) throw new Error("Missing image buffer");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1
    }
  });

  const result = await model.generateContent([
    buildPrompt(),
    {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: mimeType || "image/jpeg"
      }
    }
  ]);

  const rawText = result.response.text();
  const parsed = parseGeminiJson(rawText);
  const normalized = normalizeVisionRows(parsed);
  return {
    model: modelName,
    rows: normalized.rows,
    warnings: normalized.warnings,
    text: rowsToCutText(normalized.rows)
  };
}

function buildPrompt() {
  return `Jestes inteligentnym asystentem dla zakladu stolarskiego.
Otrzymasz zdjecie kartki z wymiarami do rozkroju. Moga tam byc listy wymiarow, ale takze szkice elementow (trapezy, trojkaty).

Zadanie:
1. Wyciagnij wszystkie formatki do rozkroju, z ktorych powstana opisane elementy.
2. Zwykle pozycje (np. "2580 x 300", "786 x 596 - 2 szt.", "liczba w kolku obok") zapisz bezposrednio.
3. Dla rysunkow nietypowych elementow (np. trapezy, trojkaty, ksztalty ze skosami) odczytaj z ich krawedzi MAKSYMALNY wymiar Dlugosc i Szerokosc, ktory jest potrzebny, aby wyciac obrys prostokatny z plyty (np. jesli trapez ma boki 1316, 670, 893 to obrysem jest 1316 x 670). Jako note dodaj "skos", "trapez" itp.
4. Ignoruj mikroszkice profili, schodkow (np. wymiary 60 i 2,5 na dole z boku rysunku, ktore nie sa gabarytami plyty), strzalki, kratki, luźne pojedyncze cyfry nic nie znaczace, i pozycje przekreslone.
5. Jesli przy linii jest napisane "frez", ustaw work_milling: true.
6. Jesli przy linii jest "bez frezu" itp., ustaw work_milling: false i dodaj to w note.
7. ZWROC UWAGE NA OKLEJANIE KRAWEDZI! Kreski narysowane bezposrednio pod wymiarami oznaczaja ilosc oklejanych krawedzi:
   - Pojedyncza kreska pod wymiarem (np. 720 _) oznacza 1 oklejona krawedz (zwroc wartosc 1).
   - Podwojna kreska lub znak rownosci pod wymiarem (np. 446 =) oznacza 2 oklejone krawedzie (zwroc wartosc 2).
   - Brak kreski oznacza 0 oklejonych krawedzi (zwroc wartosc 0).
   Zapisz te wartosci do pol edges_length (dla wymiaru dlugosci) oraz edges_width (dla wymiaru szerokosci). Upewnij sie, ze nie pomylisz kresek miedzy dlugoscia a szerokoscia!

Zwroc wylacznie JSON w formacie:
{
  "items": [
    {
      "length": 2580,
      "edges_length": 1,
      "width": 300,
      "edges_width": 2,
      "quantity": 1,
      "name": "",
      "note": "",
      "work_milling": false,
      "work_lacquer": false,
      "uncertain": false
    },
    {
      "length": 1316,
      "edges_length": 0,
      "width": 670,
      "edges_width": 0,
      "quantity": 1,
      "name": "",
      "note": "skos",
      "work_milling": false,
      "work_lacquer": false,
      "uncertain": false
    }
  ],
  "warnings": ["tylko faktyczne bledy, NIE ostrzegaj przed trapezami!"]
}

PAMIETAJ: ZAWSZE umieszczaj trapezy/trojkaty w tablicy "items" podajac ich MAKSYMALNY prostokatny obrys. Nigdy nie wrzucaj ich do warnings.
Nie dodawaj zadnych komentarzy, jedynie poprawny format JSON.`;
}

function parseGeminiJson(text) {
  const trimmed = String(text || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini did not return JSON");
    return JSON.parse(jsonMatch[0]);
  }
}

export function normalizeVisionRows(payload) {
  const source = typeof payload === "string" ? parseGeminiJson(payload) : payload;
  const items = Array.isArray(source) ? source : Array.isArray(source?.items) ? source.items : Array.isArray(source?.parts) ? source.parts : [];
  const sourceWarnings = typeof source === "object" && source ? source.warnings : [];
  const warnings = Array.isArray(sourceWarnings) ? sourceWarnings.map(String).filter(Boolean) : [];
  const rows = [];

  for (const item of items) {
    if (item?.crossed_out || item?.crossedOut) continue;
    const length = toNumber(item?.length);
    const width = toNumber(item?.width);
    const quantity = toNumber(item?.quantity || 1);
    if (!isLikelyPart(length, width, quantity)) {
      warnings.push(`Pominieto niepewna pozycje: ${JSON.stringify(item)}`);
      continue;
    }
    const edgesLength = toNumber(item?.edges_length);
    const edgesWidth = toNumber(item?.edges_width);

    rows.push({
      length,
      width,
      quantity,
      edge_top: edgesLength >= 1,
      edge_bottom: edgesLength >= 2,
      edge_left: edgesWidth >= 1,
      edge_right: edgesWidth >= 2,
      name: cleanText(item?.name),
      note: cleanText(item?.note),
      work_milling: Boolean(item?.work_milling),
      work_lacquer: Boolean(item?.work_lacquer),
      uncertain: Boolean(item?.uncertain)
    });
  }

  return { rows, warnings };
}

export function rowsToCutText(rows) {
  return rows
    .map((row) => {
      const edgeD = (row.edge_top ? 1 : 0) + (row.edge_bottom ? 1 : 0);
      const edgeS = (row.edge_left ? 1 : 0) + (row.edge_right ? 1 : 0);
      const notes = [
        row.work_milling ? "frez" : "",
        row.work_lacquer ? "lakier" : "",
        row.name,
        row.note,
        row.uncertain ? "sprawdzic" : "",
        edgeD > 0 ? `oklD:${edgeD}` : "",
        edgeS > 0 ? `oklS:${edgeS}` : ""
      ].filter(Boolean);
      return `${formatNumber(row.length)} x ${formatNumber(row.width)} x ${formatNumber(row.quantity)}${notes.length ? ` ${notes.join(" ")}` : ""}`;
    })
    .join("\n");
}

function isLikelyPart(length, width, quantity) {
  return length >= MIN_PART_SIDE_MM
    && width >= MIN_PART_SIDE_MM
    && quantity > 0
    && quantity <= MAX_QUANTITY;
}

function toNumber(value) {
  const number = Number(String(value ?? "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}
