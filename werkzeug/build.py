"""
L057 – Seitenbaukasten

Erzeugt alle HTML-Seiten auf Deutsch und Englisch mit einheitlichem Kopf,
Fuß, Sprachschalter und hreflang-Angaben – für zwei Marken:

    L057         Vorlagen: werkzeug/seiten/de|en/*.html              → /  und /en/
    Nebelzikade  Vorlagen: werkzeug/seiten/nebelzikade/de|en/*.html  → /nebelzikade/ und /nebelzikade/en/

Aufruf (im Repository-Ordner):  python3 werkzeug/build.py
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
QUELLEN = ROOT / "werkzeug" / "seiten"
DOMAIN = "https://l057.at"

WARENKORB_SVG = ('<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" '
                 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8z"/>'
                 '<path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>')

# ---------------------------------------------------------------------------
# L057
# ---------------------------------------------------------------------------

L057_TEXTE = {
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
L057_SPRACH_SCRIPT = """<script>
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


def l057_kopf(m, t, aktiv, schalter):
    return f"""<header class="site-header">
    <div class="header-inner">
        <a href="index.html" class="brand" aria-label="{t['start']}">
            <img src="/assets/logo-mark.png" alt="" width="28" height="25">
            <span>L057</span>
        </a>
        <nav class="main-nav" aria-label="{t['hauptnav']}">
            <a href="shop.html"{aktiv('shop', 'produkt')}>{t['werke']}</a>
            <a href="projekte.html"{aktiv('projekte', 'projekt')}>{t['projekte']}</a>
            <a href="mailto:{m['email']}" class="nav-contact">{t['kontakt']}</a>
            {schalter}
            <a href="warenkorb.html" class="cart-link" aria-label="{t['warenkorb']}"{aktiv('warenkorb')}>
                {WARENKORB_SVG}
                <span class="cart-count" data-korb-anzahl hidden>0</span>
            </a>
        </nav>
    </div>
</header>
"""


def l057_fuss(m, t):
    return f"""<div class="footer-col">
            <a href="index.html" class="brand"><img src="/assets/logo-mark.png" alt="" width="28" height="25"><span>L057</span></a>
            <p>{t['claim']}</p>
        </div>
        <nav class="footer-col" aria-label="{t['werke']}">
            <h2>{t['werke']}</h2>
            <ul>
                <li><a href="shop.html">{t['alle_werke']}</a></li>
                <li><a href="projekte.html">{t['projekte']}</a></li>
                <li><a href="versand.html">{t['versand']}</a></li>
                <li><a href="mailto:{m['email']}">{t['kontakt']}</a></li>
            </ul>
        </nav>"""


L057 = {
    "name": "L057",
    "basis": "/",
    "quellen": QUELLEN,
    "ziel": ROOT,
    "email": "l057.design@gmail.com",
    "texte": L057_TEXTE,
    "nur_de": {"verwaltung.html"},
    "sprach_script": L057_SPRACH_SCRIPT,
    "theme": "#0d0d0d",
    "og_bild": "/logo-square-512.png",
    "icons": """<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">""",
    "manifest": "/site.webmanifest",
    "css": ["/styles.css"],
    "body_extra": "",
    "script_vor": None,
    "kopf": l057_kopf,
    "fuss": l057_fuss,
    "entwurf": False,
    "sitemap": True,
}

# ---------------------------------------------------------------------------
# Nebelzikade (hell, unter /nebelzikade/)
# ---------------------------------------------------------------------------

NZ_TEXTE = {
    "de": {
        "locale": "de_AT",
        "start": "Nebelzikade Startseite",
        "hauptnav": "Hauptnavigation",
        "werke": "Schmuck",
        "ueber": "Über",
        "musik": "Musik",
        "wunsch": "Wunschstück",
        "pflege": "Pflege &amp; Größe",
        "ueber_mich": "Über mich",
        "marke": "Nebelzikade",
        "kontakt": "Kontakt",
        "warenkorb": "Warenkorb",
        "sprache_ziel": "EN",
        "sprache_label": "English version",
        "claim": "Handgefädelt bei Mondlicht.<br>Armreifen, Talismane und kleiner Zauber aus Perlen, Stein und Silber.",
        "alle_werke": "Alle Stücke",
        "versand": "Versand &amp; Zahlung",
        "folgen": "Folgen",
        "recht": "Rechtliches",
        "impressum": "Impressum",
        "datenschutz": "Datenschutz",
        "agb": "AGB",
        "widerruf": "Widerrufsbelehrung",
        "widerrufen": "Vertrag widerrufen",
        "fuss": "Alle Preise sind Endpreise.",
    },
    "en": {
        "locale": "en_GB",
        "start": "Nebelzikade home",
        "hauptnav": "Main navigation",
        "werke": "Jewellery",
        "ueber": "About",
        "musik": "Music",
        "wunsch": "Custom piece",
        "pflege": "Care &amp; size",
        "ueber_mich": "About me",
        "marke": "Nebelzikade",
        "kontakt": "Contact",
        "warenkorb": "Cart",
        "sprache_ziel": "DE",
        "sprache_label": "Deutsche Version",
        "claim": "Strung by moonlight.<br>Bracelets, talismans and small magic made of beads, stone and silver.",
        "alle_werke": "All pieces",
        "versand": "Shipping &amp; payment",
        "folgen": "Follow",
        "recht": "Legal",
        "impressum": "Imprint",
        "datenschutz": "Privacy",
        "agb": "Terms",
        "widerruf": "Right of withdrawal",
        "widerrufen": "Withdraw from contract",
        "fuss": "All prices are final prices.",
    },
}

# Wie bei L057, nur innerhalb von /nebelzikade/
NZ_SPRACH_SCRIPT = """<script>
(function () {
    try {
        if (/bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent)) return;
        var B = "/nebelzikade";
        var pfad = location.pathname;
        if (pfad.indexOf(B) !== 0) return;
        var rest = pfad.slice(B.length);
        var aufEn = rest.indexOf("/en/") === 0 || rest === "/en";
        var gewaehlt = localStorage.getItem("l057-sprache");
        var browser = (navigator.languages && navigator.languages[0]) || navigator.language || "de";
        if (!gewaehlt && aufEn) return;
        var ziel = gewaehlt || (/^de/i.test(browser) ? "de" : "en");
        var datei = rest.replace(/^\\/en(\\/|$)/, "/").replace(/^\\/?$/, "/index.html");
        if (ziel === "en" && !aufEn) location.replace(B + "/en" + (datei === "/index.html" ? "/" : datei) + location.search + location.hash);
        if (ziel === "de" && aufEn) location.replace(B + (datei === "/index.html" ? "/" : datei) + location.search + location.hash);
    } catch (e) { /* ohne Speicher bleibt die aktuelle Sprache */ }
})();
</script>"""

# Wörter, die shop.js für Nebelzikade anders sagt als für L057 ("Werk" → "Stück")
NZ_WORTE = {
    "de": {
        "Dieses Werk gibt es nicht (mehr).": "Dieses Stück gibt es nicht (mehr).",
        "Alle Werke": "Alle Stücke",
        "Ähnliches Werk anfragen": "Ähnliches Stück anfragen",
        "Dieses Werk ist bereits verkauft.": "Dieses Stück ist bereits verkauft.",
        "Frage zum Werk": "Frage zum Stück",
        "Werke": "Schmuck",
        "Werk konnte nicht geladen werden.": "Stück konnte nicht geladen werden.",
        "Produkte konnten nicht geladen werden.": "Stücke konnten nicht geladen werden.",
        "Künstler: ": "Handgemacht von: ",
    },
    "en": {
        "Dieses Werk gibt es nicht (mehr).": "This piece does not exist (anymore).",
        "Alle Werke": "All pieces",
        "Ähnliches Werk anfragen": "Ask for a similar piece",
        "Dieses Werk ist bereits verkauft.": "This piece has already been sold.",
        "Frage zum Werk": "Question about a piece",
        "Werke": "Jewellery",
        "Werk konnte nicht geladen werden.": "Piece could not be loaded.",
        "Produkte konnten nicht geladen werden.": "Pieces could not be loaded.",
        "Künstler: ": "Handmade by: ",
    },
}


def nz_kopf(m, t, aktiv, schalter):
    return f"""<header class="site-header">
    <div class="header-inner">
        <a href="index.html" class="brand" aria-label="{t['start']}">
            <img src="/nebelzikade/assets/logo-klein.png" alt="" width="34" height="34">
            <span>Nebelzikade</span>
        </a>
        <nav class="main-nav" aria-label="{t['hauptnav']}">
            <a href="shop.html"{aktiv('shop', 'produkt')}>{t['werke']}</a>
            <a href="ueber.html"{aktiv('ueber')}>{t['ueber']}</a>
            <a href="musik.html"{aktiv('musik')}>{t['musik']}</a>
            <a href="mailto:{m['email']}" class="nav-contact">{t['kontakt']}</a>
            {schalter}
            <a href="warenkorb.html" class="cart-link" aria-label="{t['warenkorb']}"{aktiv('warenkorb')}>
                {WARENKORB_SVG}
                <span class="cart-count" data-korb-anzahl hidden>0</span>
            </a>
        </nav>
    </div>
</header>
"""


def nz_fuss(m, t):
    return f"""<div class="footer-col">
            <a href="index.html" class="brand"><img src="/nebelzikade/assets/logo-klein.png" alt="" width="34" height="34"><span>Nebelzikade</span></a>
            <p>{t['claim']}</p>
        </div>
        <nav class="footer-col" aria-label="{t['werke']}">
            <h2>{t['werke']}</h2>
            <ul>
                <li><a href="shop.html">{t['alle_werke']}</a></li>
                <li><a href="wunschstueck.html">{t['wunsch']}</a></li>
                <li><a href="pflege.html">{t['pflege']}</a></li>
                <li><a href="versand.html">{t['versand']}</a></li>
            </ul>
        </nav>
        <nav class="footer-col" aria-label="{t['marke']}">
            <h2>{t['marke']}</h2>
            <ul>
                <li><a href="ueber.html">{t['ueber_mich']}</a></li>
                <li><a href="musik.html">{t['musik']}</a></li>
                <li><a href="mailto:{m['email']}">{t['kontakt']}</a></li>
            </ul>
        </nav>"""


def nz_worte(lang):
    return "<script>window.MARKE_TEXTE = " + json.dumps(NZ_WORTE[lang], ensure_ascii=False) + ";</script>\n"


NEBELZIKADE = {
    "name": "Nebelzikade",
    "basis": "/nebelzikade/",
    "quellen": QUELLEN / "nebelzikade",
    "ziel": ROOT / "nebelzikade",
    # Vorläufig: Bestellungen und Kontakt gehen an die L057-Adresse, bis Nebelzikade eine eigene hat
    "email": "l057.design@gmail.com",
    "texte": NZ_TEXTE,
    "nur_de": set(),
    "sprach_script": NZ_SPRACH_SCRIPT,
    "theme": "#faf8f4",
    "og_bild": "/nebelzikade/assets/logo-teilen.png",
    "icons": """<link rel="icon" href="/nebelzikade/assets/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/nebelzikade/assets/apple-touch-icon.png" sizes="180x180">""",
    "manifest": "/nebelzikade/site.webmanifest",
    "css": ["/styles.css", "/nebelzikade/nebelzikade.css"],
    "body_extra": (' data-basis="/nebelzikade/" data-marke="Nebelzikade" '
                   'data-korb="nebelzikade-warenkorb" data-website="l057.at/nebelzikade"'),
    "script_vor": nz_worte,
    "kopf": nz_kopf,
    "fuss": nz_fuss,
    # Entwurf: nicht in Suchmaschinen und nicht in der Sitemap
    "entwurf": True,
    "sitemap": False,
}

MARKEN = [L057, NEBELZIKADE]

# ---------------------------------------------------------------------------


def url(m, lang, datei):
    name = "" if datei == "index.html" else datei
    return DOMAIN + m["basis"] + ("en/" if lang == "en" else "") + name


def lies(m, lang, datei):
    text = (m["quellen"] / lang / datei).read_text(encoding="utf-8")
    kopf, inhalt = text.split("\n---\n", 1)
    meta = dict(zeile.split(": ", 1) for zeile in kopf.strip().splitlines())
    return meta, inhalt


def seite(m, lang, datei):
    meta, inhalt = lies(m, lang, datei)
    inhalt = inhalt.replace("{{email}}", m["email"])
    t = m["texte"][lang]
    s = meta["seite"]
    zweisprachig = datei not in m["nur_de"]
    anderes = "de" if lang == "en" else "en"

    def aktiv(*namen):
        return ' aria-current="page"' if s in namen else ""

    alternates = ""
    schalter = ""
    if zweisprachig:
        alternates = (
            f'<link rel="alternate" hreflang="de" href="{url(m, "de", datei)}">\n'
            f'<link rel="alternate" hreflang="en" href="{url(m, "en", datei)}">\n'
            f'<link rel="alternate" hreflang="x-default" href="{url(m, "de", datei)}">\n'
        )
        ziel = m["basis"] + ("en/" if anderes == "en" else "") + ("" if datei == "index.html" else datei)
        schalter = (f'<a href="{ziel}" class="lang-switch" data-lang-switch="{anderes}" hreflang="{anderes}" '
                    f'lang="{anderes}" aria-label="{t["sprache_label"]}">{t["sprache_ziel"]}</a>')

    titel = html.escape(meta["title"], quote=True)
    desc = html.escape(meta["desc"], quote=True)
    robots = "noindex, nofollow" if m["entwurf"] else meta["robots"]
    manifest = f'<link rel="manifest" href="{m["manifest"]}">'
    extra = ""
    if datei == "verwaltung.html":
        manifest = '<link rel="manifest" href="/verwaltung.webmanifest">'
        extra = ('<meta name="mobile-web-app-capable" content="yes">\n'
                 '<meta name="apple-mobile-web-app-capable" content="yes">\n'
                 '<meta name="apple-mobile-web-app-title" content="L057 Admin">\n')
    css = "\n".join(f'<link rel="stylesheet" href="{c}">' for c in m["css"])

    kopf = f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{titel}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="{m['theme']}">
<meta name="robots" content="{robots}">
{m['sprach_script'] if zweisprachig else ''}
<link rel="canonical" href="{url(m, lang, datei)}">
{alternates}
<meta property="og:title" content="{titel}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{DOMAIN}{m['og_bild']}">
<meta property="og:url" content="{url(m, lang, datei)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="{t['locale']}">
<meta name="twitter:card" content="summary">

{m['icons']}
{manifest}
{extra}
{css}
</head>
<body data-seite="{s}"{m['body_extra']}>

{m['kopf'](m, t, aktiv, schalter)}"""

    vor = m["script_vor"](lang) if m["script_vor"] else ""
    fuss = f"""
<footer class="site-footer">
    <div class="footer-inner">
        {m['fuss'](m, t)}
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
    <div class="footer-bottom">© <span data-jahr>2026</span> {m['name']} · {t['fuss']}</div>
</footer>

{vor}<script src="/assets/shop.js" defer></script>
</body>
</html>
"""
    kopf = re.sub(r"\n{3,}", "\n\n", kopf)
    ziel = m["ziel"] / ("en" if lang == "en" else "") / datei
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ziel.write_text(kopf + inhalt.strip("\n") + "\n" + fuss, encoding="utf-8")


def sitemap():
    zeilen = ['<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for m in MARKEN:
        if not m["sitemap"]:
            continue
        for datei in sorted(p.name for p in (m["quellen"] / "de").glob("*.html")):
            meta, _ = lies(m, "de", datei)
            if datei in m["nur_de"] or "noindex" in meta["robots"]:
                continue
            for lang in ("de", "en"):
                zeilen.append("  <url>")
                zeilen.append(f"    <loc>{url(m, lang, datei)}</loc>")
                for alt in ("de", "en"):
                    zeilen.append(f'    <xhtml:link rel="alternate" hreflang="{alt}" href="{url(m, alt, datei)}"/>')
                zeilen.append("  </url>")
    zeilen.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(zeilen) + "\n", encoding="utf-8")


def main():
    for m in MARKEN:
        if not (m["quellen"] / "de").is_dir():
            continue
        dateien = sorted(p.name for p in (m["quellen"] / "de").glob("*.html"))
        for datei in dateien:
            seite(m, "de", datei)
            if datei not in m["nur_de"]:
                if not (m["quellen"] / "en" / datei).exists():
                    raise SystemExit(f"Englische Fassung fehlt: {m['quellen'] / 'en' / datei}")
                seite(m, "en", datei)
        print(f"{m['name']}: {len(dateien)} Seiten erzeugt (Deutsch + Englisch).")
    sitemap()


if __name__ == "__main__":
    main()
