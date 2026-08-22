# LESSONS — czego nauczył nas obecny Magazyn GibLab

## L1. Jedno źródło prawdy
Nie wolno tworzyć kilku niezależnych baz, które mają reprezentować ten sam magazyn.

## L2. SQLite jest dobre, ale w odpowiednim miejscu
Dla jednej centralnej instancji jest proste i skuteczne.
Dla większej liczby aktywnych użytkowników można później przejść na PostgreSQL.

## L3. Nie pokazuj użytkownikowi technicznych szczegółów
Plik `.project`, foldery wymiany i parsery powinny działać możliwie w tle.

## L4. Resztka bez lokalizacji praktycznie nie istnieje
Sama informacja „mamy resztkę 1250×620” nie wystarcza.
Trzeba wiedzieć dokładnie, gdzie leży.

## L5. Etykieta zamyka pętlę cyfrowo-fizyczną
Dane w bazie + fizyczna etykieta + półka = realnie użyteczny magazyn.

## L6. AI nie może być ostatnim etapem przed maszyną
AI może przyspieszyć wprowadzanie danych, ale niepewne dane produkcyjne muszą być zatwierdzone.

## L7. Nie duplikować ręcznej pracy
Jeśli klient już wysłał listę formatek, aplikacja ma ją odczytać, a nie wymagać przepisywania.

## L8. Najpierw cały workflow, potem funkcje poboczne
Ważniejsze jest działające:
zlecenie → GibLab → wynik → resztka
niż 20 niedokończonych modułów.

## L9. Backup od początku
Baza produkcyjna musi mieć automatyczny backup i bezpieczny restore.

## L10. Historia ruchów jest ważniejsza niż samo „stan = 5”
Dla magazynu, płatności i resztek warto przechowywać historię operacji.

## L11. Uproszczony produkt powinien mieć osobne repozytorium
Nie warto budować nowego klienta jako zestawu ukrytych ekranów w dużym Magazyn GibLab.

## L12. Moduły obecnego GibLab można reuse'ować
Szczególnie:
- logikę resztek,
- parsery `.project`,
- integrację folderową,
- materiały,
- backup,
- wybrane testy.
Ale UI i przepływ użytkownika powinny być zaprojektowane od nowa.
