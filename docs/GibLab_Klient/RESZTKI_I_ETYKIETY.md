# Moduł Resztki + Półki + Etykiety

## 1. Cel

Każda użyteczna resztka po rozkroju powinna:
1. zostać automatycznie wykryta,
2. dostać lokalizację,
3. dostać etykietę,
4. być łatwa do znalezienia,
5. zostać uwzględniona przy następnym rozkroju.

## 2. Klasyfikacja lokalizacji

Ustalono:

**Lokalizacja zależy zarówno od typu materiału, jak i od rozmiaru resztki.**

Przykładowy układ:
- LAMINAT / małe
- LAMINAT / średnie
- LAMINAT / duże
- MDF / małe
- MDF / średnie
- MDF / duże
- SKLEJKA / małe
- SKLEJKA / średnie
- SKLEJKA / duże
- FORNIR / osobna grupa

Konkretny kod półki może wyglądać np.:
- `LAM-S-01`
- `LAM-M-02`
- `MDF-L-01`

## 3. Reguły automatycznego przydziału półki

Administrator definiuje reguły:
- typ materiału,
- minimalny dłuższy bok,
- maksymalny dłuższy bok,
- minimalny krótszy bok,
- maksymalny krótszy bok,
- opcjonalnie minimalna powierzchnia,
- docelowa półka.

Program po odebraniu wyniku GibLab sam proponuje półkę. Użytkownik może ją zmienić ręcznie.

## 4. Minimalna resztka

System powinien mieć parametry:
- minimalny krótszy bok,
- minimalny dłuższy bok,
- minimalna powierzchnia.

Jeżeli resztka jest mniejsza od minimum:
- status `Odpad`,
- brak etykiety magazynowej,
- nie trafia na listę dostępnych resztek.

Wartości będą konfigurowalne.

## 5. Statusy resztki

- Dostępna
- Zarezerwowana
- Wydana do rozkroju
- Zużyta
- Przeniesiona
- Odpad
- Nieznaleziona / do wyjaśnienia

## 6. Dane resztki

- ID
- kod QR
- materiał
- producent
- dekor
- struktura
- grubość
- długość
- szerokość
- powierzchnia
- półka
- status
- źródłowe zlecenie
- data powstania
- data ostatniego ruchu
- uwagi

## 7. Etykieta termiczna

Ustalono użycie **małej drukarki termicznej etykiet**.

Rekomendowana zawartość:
- materiał/dekor, np. `EGGER U702 ST9`
- grubość, np. `18 mm`
- wymiar, np. `1250 × 620 mm`
- lokalizacja, np. `PÓŁKA: LAM-M-02`
- ID, np. `R-000184`
- źródło, np. `ZAM-2026-0187`
- QR otwierający kartę resztki.

## 8. Przepływ po rozkroju

1. Wynik wraca z GibLab.
2. System odczytuje resztki.
3. Odrzuca odpady poniżej minimum.
4. Dla każdej resztki proponuje półkę.
5. Tworzy rekord.
6. Generuje etykietę.
7. Pracownik drukuje etykietę.
8. Odkłada resztkę na wskazaną półkę.
9. Stan jest widoczny natychmiast.

## 9. Użycie w kolejnym zleceniu

Przed wysłaniem nowego zlecenia do GibLab:
- system szuka pasujących resztek,
- pokazuje dostępne rozmiary i półkę,
- użytkownik może zarezerwować resztkę,
- rezerwacja wiąże ją ze zleceniem.

Przykład:

Potrzeba: `900 × 500 U702 18 mm`

System:
> Dostępna resztka 1250 × 620 mm — półka LAM-M-02.

## 10. Telefon / QR

Po zeskanowaniu QR użytkownik widzi:
- dane resztki,
- półkę,
- status,
- zlecenie rezerwujące,
- przyciski:
  - Rezerwuj
  - Zużyto
  - Przenieś
  - Zgłoś brak
