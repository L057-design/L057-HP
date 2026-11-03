# Seitenbaukasten

Die HTML-Seiten werden aus den Vorlagen in `werkzeug/seiten/de/` und
`werkzeug/seiten/en/` erzeugt. Kopf, Fußzeile, Sprachschalter und
hreflang-Angaben kommen aus `werkzeug/build.py`.

Nach einer Änderung an einer Vorlage im Repository-Ordner ausführen:

    python3 werkzeug/build.py

Werke, Projekte und Einstellungen werden **nicht** hier gepflegt, sondern
in der Verwaltung (`/verwaltung.html`) bzw. in `data/*.json`.
