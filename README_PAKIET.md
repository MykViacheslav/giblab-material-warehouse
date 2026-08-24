# Magazyn GibLab - pakiet przenosny

Utworzono: 2026-07-23

Pakiet zawiera kod programu oraz kopie bazy danych:
`data\\warehouse.sqlite`

Nie zawiera:
- folderu `.git`
- pliku `.env` ani kluczy AI

## Uruchomienie na drugim komputerze

1. Skopiuj caly folder `MagazynGibLab` na drugi komputer, najlepiej do `D:\\MagazynGibLab`.
2. Zainstaluj Node.js LTS.
3. Uruchom plik `URUCHOM_PAKIET.cmd`.
4. Jezeli przegladarka nie otworzy sie sama, wejdz na `http://127.0.0.1:3080`.

## AI

Na drugim komputerze utworz plik `.env` na podstawie `.env.example` i wpisz swoj klucz AI.
Nie wysylaj pliku `.env` na GitHub.

## Wazne

To jest migawka danych z dnia utworzenia pakietu. Dane z obu komputerow nie
beda synchronizowaly sie automatycznie. Do pracy kilku komputerow jednoczesnie
potrzebny jest wspolny serwer i wspolna baza danych. Nie kopiuj recznie tej
samej bazy miedzy komputerami podczas pracy programu.
