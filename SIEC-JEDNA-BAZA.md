# Jedna baza dla kilku komputerow

Komputer glowny:

- nazwa: `DESKTOP-OQ1K2KT`
- adres programu w sieci: `http://192.168.8.186:3080/`
- baza SQLite zostaje tylko na komputerze glownym w `C:\MagazynGibLab\data\warehouse.sqlite`

Nie otwieramy pliku `warehouse.sqlite` bezposrednio z kilku komputerow. Inne komputery maja laczyc sie przez przegladarke z programem uruchomionym na komputerze glownym.

## Na komputerze glownym

1. Uruchom `URUCHOM JAKO SERWER W SIECI.cmd`.
2. Jesli Windows zapyta o administratora, potwierdz. To pozwala innym komputerom wejsc na port `3080`.
3. Nie zamykaj okna serwera, kiedy inni pracuja w programie.

## Na drugim komputerze

Najprosciej otworzyc w przegladarce:

```text
http://192.168.8.186:3080/
```

Albo skopiowac caly folder programu i uruchomic:

```text
Magazyn GibLab - klient sieciowy.cmd
```

W trybie klienta nie uruchamiaj osobnego serwera i nie tworz osobnej bazy.

## Komputery widoczne w sieci

- `DESKTOP-MQBAC93` - `192.168.8.100`
- `KMBT805718` - `192.168.8.145`
- `DESKTOP-OQ1K2KT` - komputer glowny, `192.168.8.186`

## Folder wspolny

Folder `C:\Baza` jest udostepniony w sieci jako:

```text
\\DESKTOP-OQ1K2KT\Baza
\\192.168.8.186\Baza
```

Ten folder sluzy do plikow: backupy, eksporty, importy, etykiety i dokumenty.
Nie przenosimy tam aktywnego pliku `warehouse.sqlite` do pracy z kilku komputerow.

## GibLab i resztki na kilku komputerach

Kazdy GibLab powinien laczyc sie z glownym serwerem, ale z wlasna nazwa stanowiska.

Przyklady adresow do ustawienia w GibLab:

```text
http://192.168.8.186:3080/giblab/remainders?station=DESKTOP-OQ1K2KT
http://192.168.8.186:3080/giblab/remainders?station=DESKTOP-MQBAC93
http://192.168.8.186:3080/giblab/remainders?station=KMBT805718
```

Program odroznia stanowiska po parametrze `station`.
Resztka zarezerwowana przez jedno stanowisko nie jest wysylana jako wolna dla innego stanowiska.
Wlasna zarezerwowana resztka jest dalej widoczna dla tego samego stanowiska.

## Jak sprawdzic

1. Na drugim komputerze otworz `http://192.168.8.186:3080/`.
2. Otworz `\\192.168.8.186\Baza` w Eksploratorze Windows.
3. W zakladce `Resztki` wpisz nazwe stanowiska.
4. Zaznacz resztke i kliknij `REZERWUJ`.
5. Na innym komputerze ta sama resztka nie powinna byc dostepna jako wolna.
