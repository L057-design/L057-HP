# Seitenbaukasten

Die HTML-Seiten werden aus den Vorlagen in `werkzeug/seiten/de/` und
`werkzeug/seiten/en/` erzeugt. Kopf, Fußzeile, Sprachschalter und
hreflang-Angaben kommen aus `werkzeug/build.py`.

Nach einer Änderung an einer Vorlage im Repository-Ordner ausführen:

    python3 werkzeug/build.py

Werke, Projekte und Einstellungen werden **nicht** hier gepflegt, sondern
in der Verwaltung (`/verwaltung.html`) bzw. in `data/*.json`.

## Zweite Marke: Nebelzikade (`/nebelzikade/`)

Helles Design, gleiche Technik wie L057.

- Vorlagen: `werkzeug/seiten/nebelzikade/de/` und `.../en/`
- Daten: `nebelzikade/data/*.json`, Bilder: `nebelzikade/images/`
- Design: `nebelzikade/nebelzikade.css` (lädt nach `/styles.css`)
- Einstellungen der Marke (Texte, Kopf, Fuß, E-Mail): `NEBELZIKADE` in `build.py`
- Solange `entwurf: True` gesetzt ist, sind die Seiten `noindex` und nicht in der Sitemap.
