# Telegram → AI → GibLab

## 1. Cel

Klient końcowy może wysłać zlecenie bez logowania do aplikacji.

Kanał wejściowy: Telegram bot.

## 2. Obsługiwane wiadomości

- zwykły tekst,
- zdjęcie kartki,
- screenshot,
- PDF,
- Excel,
- opcjonalnie plik CSV.

## 3. Przepływ

1. Klient wysyła wiadomość do bota.
2. Bot rozpoznaje nadawcę.
3. Załącznik trafia do modułu AI/parsera.
4. AI zwraca strukturalne dane.
5. Powstaje szkic zlecenia.
6. Właściciel/pracownik widzi:
   - liczbę pozycji,
   - materiał,
   - błędy,
   - poziom niepewności.
7. Użytkownik zatwierdza.
8. Program generuje dane do GibLab.
9. Zlecenie otrzymuje status „Wysłane do GibLab”.
10. Po zakończeniu można wysłać klientowi komunikat „Gotowe”.

## 4. Dane rozpoznawane przez AI

Minimum:
- długość,
- szerokość,
- ilość.

Docelowo:
- materiał,
- grubość,
- nazwa elementu,
- krawędzie,
- kierunek struktury,
- uwagi.

## 5. Zasada bezpieczeństwa

**AI nie może samodzielnie zatwierdzić niepewnych danych produkcyjnych.**

Każde zlecenie przechodzi przez podgląd.

Pozycje niepewne:
- oznaczone kolorem,
- pokazany oryginalny fragment,
- użytkownik poprawia tylko te pozycje.

## 6. Odpowiedzi bota

Przykłady:
- „Zlecenie odebrane. Rozpoznano 23 formatki.”
- „Brakuje informacji o materiale.”
- „Zlecenie zostało przyjęte do realizacji.”
- „Rozkrój gotowy do odbioru.”

## 7. Identyfikacja klienta

Do wyboru:
- przypisanie Telegram user ID do klienta,
- jednorazowy kod zaproszenia,
- ręczne zatwierdzenie pierwszego kontaktu.

Najbezpieczniej:
**kod zaproszenia + później stałe powiązanie konta Telegram z kartą klienta.**
