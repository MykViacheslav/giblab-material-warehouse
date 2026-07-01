export const DEFAULT_OFFCUT_STORAGE_LOCATIONS = [
  {
    code: "R1-DUZE",
    name: "Regal 1 - duze plyty",
    min_long_side: 1800,
    max_long_side: 10000,
    min_short_side: 0,
    max_short_side: 10000,
    sort_order: 10
  },
  {
    code: "R2-SREDNIE",
    name: "Regal 2 - srednie kawalki",
    min_long_side: 1000,
    max_long_side: 1799,
    min_short_side: 0,
    max_short_side: 10000,
    sort_order: 20
  },
  {
    code: "R3-MALE",
    name: "Regal 3 - male kawalki",
    min_long_side: 0,
    max_long_side: 999,
    min_short_side: 0,
    max_short_side: 10000,
    sort_order: 30
  },
  {
    code: "R4-WASKIE",
    name: "Regal 4 - waskie paski",
    min_long_side: 800,
    max_long_side: 10000,
    min_short_side: 0,
    max_short_side: 180,
    sort_order: 5
  }
];

export function chooseOffcutStorageLocation(offcut, locations = DEFAULT_OFFCUT_STORAGE_LOCATIONS) {
  const length = positiveNumber(offcut?.length);
  const width = positiveNumber(offcut?.width);
  if (!length || !width) return "";

  const longSide = Math.max(length, width);
  const shortSide = Math.min(length, width);
  const sortedLocations = [...locations]
    .filter((location) => Number(location.active ?? 1) !== 0)
    .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0));

  const match = sortedLocations.find((location) => {
    return longSide >= Number(location.min_long_side || 0)
      && longSide <= Number(location.max_long_side || Number.MAX_SAFE_INTEGER)
      && shortSide >= Number(location.min_short_side || 0)
      && shortSide <= Number(location.max_short_side || Number.MAX_SAFE_INTEGER);
  });

  return match?.code || "";
}

function positiveNumber(value) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) && number > 0 ? number : 0;
}
