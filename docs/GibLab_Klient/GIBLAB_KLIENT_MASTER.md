# GibLab Klient — główna specyfikacja

## 1. Wizja produktu

„GibLab Klient” ma być lekką aplikacją dla małej stolarni, punktu rozkroju lub firmy meblowej.

Nie ma zastępować pełnego ERP. Ma rozwiązywać kilka codziennych problemów bardzo dobrze:

- przyjmowanie zleceń do rozkroju,
- szybkie rozpoznanie formatek z różnych źródeł,
- wysłanie rozkroju do GibLab,
- odebranie wyniku,
- prowadzenie resztek płyt,
- łatwe fizyczne odnalezienie resztki,
- prosty stan materiałów i lista zakupowa,
- uproszczona baza klientów,
- kontrola należności i wpłat.

## 2. Zasada projektowa

**Im mniej ręcznego przepisywania, tym lepiej.**

Użytkownik powinien pracować głównie na zleceniach i wyjątkach, nie na technicznych danych.

## 3. Zakres wersji 1.0

### 3.1 Zlecenia
Każde zlecenie:
- numer,
- klient,
- data przyjęcia,
- termin,
- status,
- materiał,
- źródło danych,
- liczba pozycji,
- wartość,
- zapłacono,
- pozostało,
- powiązanie z GibLab.

Statusy przykładowe:
- Nowe
- Do sprawdzenia
- Gotowe do GibLab
- Wysłane do GibLab
- W rozkroju
- Gotowe
- Odebrane
- Zamknięte

### 3.2 Import zlecenia
Źródła:
- Telegram,
- zdjęcie,
- PDF,
- Excel,
- tekst,
- opcjonalnie ręczne dodanie pojedynczej pozycji.

AI/parser ma rozpoznawać:
- długość,
- szerokość,
- ilość,
- materiał,
- grubość,
- kierunek struktury,
- krawędzie, jeśli są podane,
- opis/nazwę elementu.

### 3.3 Kontrola przed wysłaniem
Obowiązkowy ekran podglądu:
- błędne lub niepewne pozycje są zaznaczone,
- użytkownik może poprawić,
- dopiero po zatwierdzeniu powstaje plik/zlecenie do GibLab.

### 3.4 Integracja GibLab
Program ma:
- generować/eksportować dane do GibLab,
- nadawać zleceniu jednoznaczny identyfikator,
- odbierać wynik rozkroju,
- odczytywać wykorzystane płyty i resztki,
- aktualizować stan magazynowy,
- utworzyć nowe resztki.

### 3.5 Resztki
Resztki są pełnoprawnym stanem magazynowym.

Każda resztka:
- ma materiał,
- grubość,
- wymiary,
- lokalizację,
- status,
- pochodzenie,
- etykietę,
- QR/kod,
- historię użycia/przenosin.

### 3.6 Materiały
Prosty katalog:
- producent,
- kod dekoru,
- nazwa,
- struktura,
- rodzaj materiału,
- grubość,
- format płyty,
- dostawca,
- stan pełnych płyt,
- stan dostępny,
- minimum magazynowe.

### 3.7 Zakupy
Lista zakupowa:
- materiał,
- stan,
- zapotrzebowanie,
- sugerowana ilość do zakupu,
- dostawca,
- status zamówienia.

Pierwsza wersja może działać jako prosta tabela, bez pełnego modułu zamówień do dostawcy.

### 3.8 Klienci
Minimalne dane:
- nazwa,
- telefon,
- e-mail,
- NIP opcjonalnie,
- uwagi,
- historia zleceń,
- saldo.

### 3.9 Płatności
Rekomendowany wariant:
- historia realnych wpłat,
- data,
- kwota,
- forma,
- uwaga,
- automatyczne saldo.

Dzięki temu status „Zaliczka / Zapłacono / Nie zapłacono” wynika z danych, a nie tylko z ręcznego pola.

## 4. Architektura rekomendowana

### Aplikacja
- Web app / PWA
- dobra obsługa Windows + telefon + tablet

### Backend
- Node.js + Express lub podobny lekki backend
- API oddzielone od UI

### Baza
- SQLite dla jednej instalacji / małej liczby stanowisk
- PostgreSQL jako wariant późniejszy dla większej liczby użytkowników

### GibLab Connector
Lokalny moduł na Windows:
- obserwuje folder GibLab,
- zapisuje `.project`,
- wykrywa wynik,
- przesyła wynik do aplikacji.

### Telegram
Bot jako kanał wejściowy:
- identyfikuje klienta,
- przyjmuje załącznik/tekst,
- tworzy szkic zlecenia,
- nie uruchamia produkcji bez zatwierdzenia.

## 5. Czego nie budować w pierwszej wersji

- pełnej księgowości,
- pełnego CRM,
- rozbudowanego planowania pracowników,
- zaawansowanego ERP,
- dziesiątek ekranów konfiguracji,
- ręcznej wielkiej tabeli formatek jako głównego sposobu pracy.

## 6. Przewaga produktu

Największa wartość nie leży w „jeszcze jednym magazynie”, tylko w połączeniu:

**zlecenie klienta → AI → GibLab → resztka → fizyczna półka → następne zlecenie.**

To jest rdzeń produktu.
