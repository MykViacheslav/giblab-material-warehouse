# START HERE — GibLab Klient

## Cel

Stworzyć prostą aplikację dla klienta, roboczo nazwaną **„GibLab Klient”** albo **„Klient + GibLab”**.

Ma być wyraźnie prostsza od obecnego „Magazyn GibLab”, ale zachować najcenniejsze funkcje związane z rozkrojem, resztkami i magazynem.

## Najważniejsza idea

Zlecenie nie musi być ręcznie przepisywane do dużej tabeli formatek.

Docelowy przepływ:

**Klient końcowy → Telegram / zdjęcie / PDF / Excel / tekst → AI → podgląd formatek → zatwierdzenie → GibLab → wynik rozkroju → resztki → półka → etykieta.**

## Ustalone już decyzje

- Resztki będą segregowane **jednocześnie według typu materiału i rozmiaru**.
- Każda resztka ma mieć przypisaną konkretną lokalizację/półkę.
- Do etykiet będzie używana **mała drukarka termiczna**.
- Etykieta ma podawać co najmniej:
  - materiał/dekor,
  - grubość,
  - wymiary resztki,
  - lokalizację/półkę,
  - identyfikator resztki,
  - opcjonalnie numer zlecenia,
  - QR/kod do szybkiego wyszukania.
- Moduł resztek powinien bazować na dobrych rozwiązaniach z obecnego „Magazyn GibLab”.
- GibLab ma możliwie działać „w tle”; użytkownik nie powinien być zmuszany do obsługi technicznych plików `.project`.
- AI nie powinno wysyłać nierozpoznanego zlecenia bez kontroli człowieka. Najpierw podgląd, potem zatwierdzenie.

## Proponowane główne menu

- Zlecenia
- Resztki
- Materiały
- Zakupy
- Klienci
- Płatności
- Ustawienia / GibLab

## Co zrobić dalej

Najpierw doprecyzować odpowiedzi z `QUESTIONS_OPEN.md`, potem zrobić makietę ekranów, a dopiero później kod.
