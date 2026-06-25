# Magazyn materiałów GibLab

Lokalna aplikacja do obsługi katalogu materiałów, klientów, zamówień, wyceny, formatek, stanów i resztek dla GibLab.

## Uruchomienie

```powershell
npm install
npm start
```

Aplikacja działa pod adresem:

```text
http://localhost:3080/
```

## Uruchomienie jako normalne okno programu

Na głównym komputerze uruchom:

```powershell
npm run app
```

Albo kliknij:

```text
Magazyn GibLab.cmd
```

Skrypt startuje serwer w tle i otwiera aplikację w osobnym oknie Microsoft Edge (`--app`), bez zwykłych kart przeglądarki.

## Skrót na pulpit

Jednorazowo uruchom:

```powershell
.\create-desktop-shortcut.ps1
```

Na pulpicie pojawi się skrót `Magazyn GibLab`.

## Jeden wspólny magazyn na dwa komputery

Najbezpieczniejszy układ:

1. Jeden komputer jest główny i uruchamia serwer aplikacji.
2. Baza SQLite `data\warehouse.sqlite` jest używana tylko przez ten jeden serwer.
3. Drugi komputer nie uruchamia własnego serwera i własnej bazy. Łączy się przez przeglądarkę z komputerem głównym.

Na drugim komputerze otwórz:

```text
http://IP-GLOWNEGO-KOMPUTERA:3080/
```

Przykład:

```text
http://192.168.1.10:3080/
```

Możesz też użyć skryptu:

```powershell
.\start-warehouse-client.ps1 -ServerUrl http://192.168.1.10:3080/
```

Nie należy uruchamiać dwóch osobnych lokalnych kopii z dwiema bazami, bo stany magazynu i resztki rozejdą się między komputerami. Nie należy też używać jednego pliku SQLite bezpośrednio z dwóch procesów po udziale sieciowym. Jeżeli będzie potrzebna praca wielu stanowisk na stałe, kolejnym krokiem jest przejście z SQLite na PostgreSQL.

## Dostęp z drugiego komputera w sieci

Na komputerze głównym można dodać regułę zapory:

```powershell
.\allow-firewall-3080.ps1
```

Potem sprawdź adres IP komputera głównego:

```powershell
ipconfig
```

## Stock rules

Physical stock, reserved stock and available stock are handled separately.

Available stock is calculated as:

```text
available = quantity - reserved
```

Normal `use` can only consume available stock. Reserved material must be consumed explicitly with the `use_reserved` operation.

Stock movement history is stored in `stock_events` and can be read with:

```text
GET /api/stock/:materialId/events
```

## Tests

```bash
npm test
```

Tests use temporary data and do not modify `data/warehouse.sqlite`.

## Material catalog fields

The material catalog stores woodworking details used by warehouse, cutting and future invoice/OCR matching:

- producer
- decor code and decor name
- structure
- material type
- supplier
- warehouse location
- minimum stock
- active/inactive flag

Existing material fields such as code, name, unit, price, thickness, length and width are preserved.

## Material catalog import

The material catalog can be imported from Excel/CSV files.

Supported formats:

- `.xlsx`
- `.xls`
- `.csv`

The import updates only material catalog data.

It does not change warehouse stock quantities and does not create stock events.

Import preview allows selecting only specific valid rows before committing the import.

Invalid rows are never imported.

Material catalog import does not change stock quantities and does not create stock events.

Import modes:

- add new
- update existing
- upsert
- skip duplicates

## GibLab

Przyciski integracyjne są schowane pod `Narzędzia GibLab`, żeby nie zajmowały miejsca w codziennej pracy. Są tam funkcje importu katalogu, eksportu `goods.xls` i zapisu do folderu GibLab.

Eksport formatek do GibLab zapisuje plik Excel w:

```text
C:\GibLabLocal\projects\warehouse-formatki
```

W GibLab wybierz `Import z Excel` i wskaż wygenerowany plik. Po rozkroju importuj wynik `.project` w zakładce `Formatki` przyciskiem `Odbierz wynik .project`.

## Polskie znaki

Pliki aplikacji są zapisane w UTF-8, a serwer wyłącza cache dla HTML, CSS i JavaScript. Jeżeli przeglądarka nadal pokazuje stare znaki, zamknij okno aplikacji, uruchom ponownie `npm run app` i użyj `Ctrl+F5`.
