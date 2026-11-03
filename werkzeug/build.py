"""
L057 – Seitenbaukasten

Erzeugt alle HTML-Seiten auf Deutsch (Wurzel) und Englisch (/en/) mit
einheitlichem Kopf, Fuß, Sprachschalter und hreflang-Angaben.

Inhalte der Seiten: werkzeug/seiten/de/*.html und werkzeug/seiten/en/*.html
Aufruf (im Repository-Ordner):  python3 werkzeug/build.py
"""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
QUELLEN = ROOT / "werkzeug" / "seiten"
DOMAIN = "https://l057.at"
EMAIL = "l057.design@gmail.com"
ETSY = "https://www.etsy.com/at/shop/L057shop"

# Seiten nur auf Deutsch (kein Sprachschalter, nicht in der Sitemap)
NUR_DE = {"verwaltung.html"}

TEXTE = {
    "de": {
        "locale": "de_AT",
        "start": "L057 Startseite",
        "hauptnav": "Hauptnavigation",
        "werke": "Werke",
        "projekte": "Projekte",
        "kontakt": "Kontakt",
        "warenkorb": "Warenkorb",
        "sprache_ziel": "EN",
        "sprache_label": "English version",
        "claim": "Something Lost. Found Form.<br>Einzelstücke und Kleinserien aus Beton, Licht und Druck. Kapfenberg, Österreich.",
        "alle_werke": "Alle Werke",
        "etsy": "Serienprodukte (Etsy)",
        "versand": "Versand &amp; Zahlung",
        "folgen": "Folgen",
        "recht": "Rechtliches",
        "impressum": "Impressum",
        "datenschutz": "Datenschutz",
        "agb": "AGB",
        "widerruf": "Widerrufsbelehrung",
        "widerrufen": "Vertrag widerrufen",
        "fuss": "Alle Preise sind Endpreise. Gemäß § 6 Abs. 1 Z 27 UStG wird keine Umsatzsteuer ausgewiesen.",
    },
    "en": {
        "locale": "en_GB",
        "start": "L057 home",
        "hauptnav": "Main navigation",
        "werke": "Works",
        "projekte": "Projects",
        "kontakt": "Contact",
        "warenkorb": "Cart",
        "sprache_ziel": "DE",
        "sprache_label": "Deutsche Version",
        "claim": "Something Lost. Found Form.<br>Unique pieces and small editions in concrete, light and print. Kapfenberg, Austria.",
        "alle_werke": "All works",
        "etsy": "Series products (Etsy)",
        "versand": "Shipping &amp; payment",
        "folgen": "Follow",
        "recht": "Legal",
        "impressum": "Imprint",
        "datenschutz": "Privacy",
        "agb": "Terms",
        "widerruf": "Right of withdrawal",
        "widerrufen": "Withdraw from contract",
        "fuss": "All prices are final prices. No VAT is charged under the Austrian small business exemption (§ 6 (1) 27 UStG).",
    },
}

# Leitet beim ersten Besuch je nach Browsersprache auf Deutsch oder Englisch.
# Eine selbst gewählte Sprache (Schalter) hat Vorrang. Suchmaschinen werden nicht umgeleitet.
SPRACH_SCRIPT = """<script>
(function () {
    try {
        if (/bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent)) return;
        var pfad = location.pathname;
        var aufEn = pfad.indexOf("/en/") === 0 || pfad === "/en";
        var gewaehlt = localStorage.getItem("l057-sprache");
        var browser = (navigator.languages && navigator.languages[0]) || navigator.language || "de";
        if (!gewaehlt && aufEn) return;
        var ziel = gewaehlt || (/^de/i.test(browser) ? "de" : "en");
        var datei = pfad.replace(/^\\/en(\\/|$)/, "/").replace(/^\\/$/, "/index.html");
        if (ziel === "en" && !aufEn) location.replace("/en" + (datei === "/index.html" ? "/" : datei) + location.search + location.hash);
        if (ziel === "de" && aufEn) location.replace((datei === "/index.html" ? "/" : datei) + location.search + location.hash);
    } catch (e) { /* ohne Speicher bleibt die aktuelle Sprache */ }
})();
</script>"""

WARENKORB_SVG = ('<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" '
                 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8z"/>'
                 '<path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>')


def url(lang, datei):
    name = "" if datei == "index.html" else datei
    return DOMAIN + ("/en/" if lang == "en" else "/") + name


def lies(lang, datei):
    text = (QUELLEN / lang / datei).read_text(encoding="utf-8")
    kopf, inhalt = text.split("\n---\n", 1)
    meta = dict(zeile.split(": ", 1) for zeile in kopf.strip().splitlines())
    return meta, inhalt


def seite(lang, datei):
    meta, inhalt = lies(lang, datei)
    t = TEXTE[lang]
    s = meta["seite"]
    zweisprachig = datei not in NUR_DE
    anderes = "de" if lang == "en" else "en"

    def aktiv(*namen):
        return ' aria-current="page"' if s in namen else ""

    alternates = ""
    schalter = ""
    if zweisprachig:
        alternates = (
            f'<link rel="alternate" hreflang="de" href="{url("de", datei)}">\n'
            f'<link rel="alternate" hreflang="en" href="{url("en", datei)}">\n'
            f'<link rel="alternate" hreflang="x-default" href="{url("de", datei)}">\n'
        )
        ziel = ("/en/" if anderes == "en" else "/") + ("" if datei == "index.html" else datei)
        schalter = (f'<a href="{ziel}" class="lang-switch" data-lang-switch="{anderes}" hreflang="{anderes}" '
                    f'lang="{anderes}" aria-label="{t["sprache_label"]}">{t["sprache_ziel"]}</a>')

    titel = html.escape(meta["title"], quote=True)
    desc = html.escape(meta["desc"], quote=True)
    manifest = '<link rel="manifest" href="/site.webmanifest">'
    extra = ""
    if datei == "verwaltung.html":
        manifest = '<link rel="manifest" href="/verwaltung.webmanifest">'
        extra = ('<meta name="mobile-web-app-capable" content="yes">\n'
                 '<meta name="apple-mobile-web-app-capable" content="yes">\n'
                 '<meta name="apple-mobile-web-app-title" content="L057 Admin">\n')

    kopf = f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{titel}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0d0d0d">
<meta name="robots" content="{meta['robots']}">
{SPRACH_SCRIPT if zweisprachig else ''}
<link rel="canonical" href="{url(lang, datei)}">
{alternates}
<meta property="og:title" content="{titel}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{DOMAIN}/logo-square-512.png">
<meta property="og:url" content="{url(lang, datei)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="{t['locale']}">
<meta name="twitter:card" content="summary">

<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
{manifest}
{extra}
<link rel="stylesheet" href="/styles.css">
</head>
<body data-seite="{s}">

<header class="site-header">
    <div class="header-inner">
        <a href="index.html" class="brand" aria-label="{t['start']}">
            <img src="/assets/logo-mark.png" alt="" width="28" height="25">
            <span>L057</span>
        </a>
        <nav class="main-nav" aria-label="{t['hauptnav']}">
            <a href="shop.html"{aktiv('shop', 'produkt')}>{t['werke']}</a>
            <a href="projekte.html"{aktiv('projekte', 'projekt')}>{t['projekte']}</a>
            <a href="mailto:{EMAIL}" class="nav-contact">{t['kontakt']}</a>
            {schalter}
            <a href="warenkorb.html" class="cart-link" aria-label="{t['warenkorb']}"{aktiv('warenkorb')}>
                {WARENKORB_SVG}
                <span class="cart-count" data-korb-anzahl hidden>0</span>
            </a>
        </nav>
    </div>
</header>
"""

    fuss = f"""
<footer class="site-footer">
    <div class="footer-inner">
        <div class="footer-col">
            <a href="index.html" class="brand"><img src="/assets/logo-mark.png" alt="" width="28" height="25"><span>L057</span></a>
            <p>{t['claim']}</p>
        </div>
        <nav class="footer-col" aria-label="{t['werke']}">
            <h2>{t['werke']}</h2>
            <ul>
                <li><a href="shop.html">{t['alle_werke']}</a></li>
                <li><a href="{ETSY}" rel="noopener" target="_blank">{t['etsy']}</a></li>
                <li><a href="projekte.html">{t['projekte']}</a></li>
                <li><a href="versand.html">{t['versand']}</a></li>
                <li><a href="mailto:{EMAIL}">{t['kontakt']}</a></li>
            </ul>
        </nav>
        <nav class="footer-col" aria-label="Social Media" data-social hidden>
            <h2>{t['folgen']}</h2>
            <ul></ul>
        </nav>
        <nav class="footer-col" aria-label="{t['recht']}">
            <h2>{t['recht']}</h2>
            <ul>
                <li><a href="impressum.html">{t['impressum']}</a></li>
                <li><a href="datenschutz.html">{t['datenschutz']}</a></li>
                <li><a href="agb.html">{t['agb']}</a></li>
                <li><a href="widerruf.html">{t['widerruf']}</a></li>
                <li><a href="widerruf.html#widerrufen" class="withdraw-link">{t['widerrufen']}</a></li>
            </ul>
        </nav>
    </div>
    <div class="footer-bottom">© <span data-jahr>2026</span> L057 · {t['fuss']}</div>
</footer>

<script src="/assets/shop.js" defer></script>
</body>
</html>
"""
    kopf = re.sub(r"\n{3,}", "\n\n", kopf)
    ziel = ROOT / ("en" if lang == "en" else "") / datei
    ziel.parent.mkdir(exist_ok=True)
    ziel.write_text(kopf + inhalt.strip("\n") + "\n" + fuss, encoding="utf-8")


def sitemap(dateien):
    zeilen = ['<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for datei in dateien:
        meta, _ = lies("de", datei)
        if datei in NUR_DE or "noindex" in meta["robots"]:
            continue
        for lang in ("de", "en"):
            zeilen.append("  <url>")
            zeilen.append(f"    <loc>{url(lang, datei)}</loc>")
            for alt in ("de", "en"):
                zeilen.append(f'    <xhtml:link rel="alternate" hreflang="{alt}" href="{url(alt, datei)}"/>')
            zeilen.append("  </url>")
    zeilen.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(zeilen) + "\n", encoding="utf-8")


def main():
    dateien = sorted(p.name for p in (QUELLEN / "de").glob("*.html"))
    for datei in dateien:
        seite("de", datei)
        if datei not in NUR_DE:
            if not (QUELLEN / "en" / datei).exists():
                raise SystemExit(f"Englische Fassung fehlt: werkzeug/seiten/en/{datei}")
            seite("en", datei)
    sitemap(dateien)
    print(f"{len(dateien)} Seiten erzeugt (Deutsch + Englisch).")


if __name__ == "__main__":
    main()
