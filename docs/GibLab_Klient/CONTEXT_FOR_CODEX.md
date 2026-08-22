# CONTEXT FOR CODEX — GibLab Klient

Przed rozpoczęciem pracy przeczytaj w tej kolejności:
1. `START_HERE.md`
2. `GIBLAB_KLIENT_MASTER.md`
3. `DECISIONS.md`
4. `LESSONS.md`
5. `RESZTKI_I_ETYKIETY.md`
6. `ROADMAP.md`
7. `QUESTIONS_OPEN.md`

## Ważne

- To jest nowa, uproszczona aplikacja dla klienta.
- Nie należy bezrefleksyjnie kopiować UI obecnego `Magazyn GibLab`.
- Można reuse'ować logikę i parsery z obecnego projektu, szczególnie resztki, `.project`, materiały i backup.
- Główny workflow v1 powinien być: **zlecenie → GibLab → wynik → resztka → etykieta → półka**.
- Resztki mają być klasyfikowane jednocześnie według typu materiału i rozmiaru.
- Każda użyteczna resztka ma mieć lokalizację/półkę i etykietę z QR.
- Planowana jest mała drukarka termiczna.
- Telegram + AI ma służyć do przyjmowania list formatek od klientów, ale AI nie może wysyłać niepewnych danych do produkcji bez zatwierdzenia człowieka.

## Zasada implementacyjna

Najpierw zaproponuj plan i zakres najmniejszego działającego MVP. Nie rozbudowuj projektu w ERP bez wyraźnej decyzji użytkownika.
