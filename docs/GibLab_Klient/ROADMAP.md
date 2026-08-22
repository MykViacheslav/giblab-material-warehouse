# Roadmap — GibLab Klient

## Etap 0 — decyzje
- ustalić finalną nazwę,
- doprecyzować użytkowników i role,
- ustalić format etykiet i model drukarki,
- ustalić reguły minimalnej resztki,
- ustalić zakres danych przesyłanych do GibLab.

## Etap 1 — fundament
- nowe repozytorium,
- backend,
- baza,
- podstawowe UI,
- klient,
- zlecenie,
- materiały.

## Etap 2 — GibLab
- eksport zlecenia,
- identyfikacja zlecenia,
- lokalny folder wymiany,
- import wyniku,
- test round-trip.

## Etap 3 — resztki
- odczyt resztek z wyniku,
- reguły półek,
- karta resztki,
- rezerwacja,
- zużycie,
- historia,
- filtrowanie.

## Etap 4 — etykiety
- szablon etykiety,
- konfiguracja drukarki termicznej,
- QR,
- druk 1 kliknięciem,
- test w magazynie.

## Etap 5 — zakupy i płatności
- stany,
- braki,
- lista zakupowa,
- historia wpłat,
- saldo klienta/zlecenia.

## Etap 6 — Telegram
- bot,
- powiązanie klienta,
- odbiór załączników,
- statusy.

## Etap 7 — AI
- parser tekstu,
- parser zdjęć/PDF,
- confidence/warnings,
- ekran zatwierdzania,
- uczenie reguł na realnych przykładach.

## Etap 8 — stabilizacja
- backup,
- log zdarzeń,
- role,
- testy,
- instalator/launcher,
- dokumentacja klienta.

## Zasada

Nie wdrażamy od razu wszystkich funkcji obecnego Magazyn GibLab.
Najpierw jeden kompletny przepływ:

**zlecenie → GibLab → wynik → resztka → etykieta → półka.**
