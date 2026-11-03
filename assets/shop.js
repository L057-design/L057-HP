/* ==========================================================
   L057 – Shop & Projekte
   Liest die Einträge aus data/*.json und baut daraus die Seiten.
   Neue Produkte/Projekte: nur die JSON-Dateien bearbeiten.
   ========================================================== */

(function () {
    "use strict";

    const cache = {};

    function laden(datei) {
        if (!cache[datei]) {
            cache[datei] = fetch(datei, { cache: "no-cache" }).then(function (r) {
                if (!r.ok) throw new Error(datei + " konnte nicht geladen werden");
                return r.json();
            });
        }
        return cache[datei];
    }

    const ladeShop = function () { return laden("data/shop.json"); };
    const ladeProdukte = function () { return laden("data/produkte.json"); };
    const ladeProjekte = function () { return laden("data/projekte.json"); };

    /* Kleines Hilfsmittel zum Erzeugen von Elementen */
    function el(tag, attrs, kinder) {
        const node = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (k) {
                const v = attrs[k];
                if (v === null || v === undefined || v === false) return;
                if (k === "text") node.textContent = v;
                else if (k === "class") node.className = v;
                else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
                else node.setAttribute(k, v === true ? "" : v);
            });
        }
        (kinder || []).forEach(function (kind) {
            if (kind) node.appendChild(typeof kind === "string" ? document.createTextNode(kind) : kind);
        });
        return node;
    }

    function preis(betrag, waehrung) {
        return new Intl.NumberFormat("de-AT", {
            style: "currency",
            currency: waehrung || "EUR"
        }).format(betrag);
    }

    function param(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    /* ---------- Warenkorb (bleibt im Browser des Kunden gespeichert) ---------- */

    const KORB_SCHLUESSEL = "l057-warenkorb";
    let korbErsatz = [];

    function korbLesen() {
        try {
            const daten = JSON.parse(localStorage.getItem(KORB_SCHLUESSEL) || "[]");
            return Array.isArray(daten) ? daten : [];
        } catch (e) {
            return korbErsatz;
        }
    }

    function korbSpeichern(korb) {
        korbErsatz = korb;
        try {
            localStorage.setItem(KORB_SCHLUESSEL, JSON.stringify(korb));
        } catch (e) { /* ohne Speicher gilt der Korb nur für diese Seite */ }
        korbAnzeigen();
    }

    function gleicheAuswahl(a, b) {
        return JSON.stringify(a || {}) === JSON.stringify(b || {});
    }

    function korbHinzufuegen(id, varianten, menge) {
        const korb = korbLesen();
        const eintrag = korb.find(function (e) { return e.id === id && gleicheAuswahl(e.varianten, varianten); });
        if (eintrag) eintrag.menge = Math.min(99, eintrag.menge + menge);
        else korb.push({ id: id, varianten: varianten, menge: menge });
        korbSpeichern(korb);
    }

    function korbAnzeigen() {
        const anzahl = korbLesen().reduce(function (s, e) { return s + (e.menge || 0); }, 0);
        document.querySelectorAll("[data-korb-anzahl]").forEach(function (n) {
            n.textContent = anzahl;
            n.hidden = anzahl === 0;
        });
        document.querySelectorAll(".cart-link").forEach(function (n) {
            n.setAttribute("aria-label", "Warenkorb, " + anzahl + (anzahl === 1 ? " Artikel" : " Artikel"));
        });
    }

    window.addEventListener("storage", function (e) {
        if (e.key === KORB_SCHLUESSEL) korbAnzeigen();
    });

    function bild(src, alt) {
        return el("img", {
            src: src || "images/project-placeholder.jpg",
            alt: alt || "",
            loading: "lazy",
            decoding: "async"
        });
    }

    /* ---------- Werke: Unikat, Kleinserie, Bestand ---------- */

    /* Optional bei Kleinserien: "exemplare": [{ "nr": 6, "bild": "...", "verkauft": false }] */
    function hatExemplare(p) {
        return Array.isArray(p.exemplare) && p.exemplare.length > 0;
    }

    function exemplarName(p, nr) {
        return "#" + String(nr).padStart(2, "0") + " / " + p.auflage;
    }

    function freieExemplare(p) {
        return hatExemplare(p) ? p.exemplare.filter(function (x) { return !x.verkauft; }) : [];
    }

    function bestand(p) {
        if (hatExemplare(p)) return freieExemplare(p).length;
        if (typeof p.bestand === "number") return Math.max(0, p.bestand);
        return p.verfuegbar ? 1 : 0;
    }

    function verfuegbar(p) {
        return bestand(p) > 0;
    }

    function istUnikat(p) {
        return !p.auflage || p.auflage === "Unikat" || p.auflage === 1;
    }

    function auflageText(p) {
        return istUnikat(p) ? "Unikat" : "Kleinserie, Auflage " + p.auflage;
    }

    function verfuegbarText(p) {
        const n = bestand(p);
        if (n === 0) return "Verkauft";
        if (istUnikat(p)) return "Verfügbar";
        return "Noch " + n + " von " + p.auflage + " verfügbar";
    }

    /* ---------- Karten ---------- */

    function produktKarte(p, shop) {
        const badges = [];
        if (!verfuegbar(p)) badges.push(el("span", { class: "badge", text: "Verkauft" }));
        else badges.push(el("span", { class: "badge badge-muted", text: istUnikat(p) ? "Unikat" : "Edition /" + p.auflage }));
        if (p.beispiel) badges.push(el("span", { class: "badge badge-muted", text: "Beispiel" }));

        return el("a", { class: "card" + (verfuegbar(p) ? "" : " card-sold"), href: "produkt.html?id=" + encodeURIComponent(p.id) }, [
            el("div", { class: "card-media" }, [bild(p.bilder && p.bilder[0], p.name)].concat(badges)),
            el("div", { class: "card-body" }, [
                el("span", { class: "card-kicker", text: p.kategorie + (p.jahr ? " · " + p.jahr : "") }),
                el("h3", { text: p.name }),
                el("p", { text: p.kurz }),
                el("span", { class: "card-price", text: verfuegbar(p) ? preis(p.preis, shop.waehrung) : "Verkauft" })
            ])
        ]);
    }

    function projektKarte(p) {
        const badges = p.beispiel ? [el("span", { class: "badge badge-muted", text: "Beispiel" })] : [];
        return el("a", { class: "card", href: "projekt.html?id=" + encodeURIComponent(p.id) }, [
            el("div", { class: "card-media" }, [bild(p.bilder && p.bilder[0], p.titel)].concat(badges)),
            el("div", { class: "card-body" }, [
                el("span", { class: "card-kicker", text: p.kategorie + (p.jahr ? " · " + p.jahr : "") }),
                el("h3", { text: p.titel }),
                el("p", { text: p.kurz })
            ])
        ]);
    }

    function fehler(ziel, text) {
        ziel.replaceChildren(el("p", { class: "empty", text: text }));
    }

    /* ---------- Startseite ---------- */

    function startseite() {
        const produktZiel = document.getElementById("home-produkte");
        const projektZiel = document.getElementById("home-projekte");

        Promise.all([ladeShop(), ladeProdukte()]).then(function (r) {
            const shop = r[0];
            let liste = r[1].filter(function (p) { return p.hervorgehoben; });
            if (!liste.length) liste = r[1];
            produktZiel.replaceChildren.apply(produktZiel, liste.slice(0, 3).map(function (p) {
                return produktKarte(p, shop);
            }));
        }).catch(function () { fehler(produktZiel, "Produkte konnten nicht geladen werden."); });

        ladeProjekte().then(function (liste) {
            projektZiel.replaceChildren.apply(projektZiel, liste.slice(0, 3).map(projektKarte));
        }).catch(function () { fehler(projektZiel, "Projekte konnten nicht geladen werden."); });
    }

    /* ---------- Filterbare Übersicht (Shop und Projekte) ---------- */

    function uebersicht(liste, kategorien, gitter, filterLeiste, karte) {
        let aktiv = param("kategorie") || "Alle";
        const vorhanden = ["Alle"].concat(kategorien.filter(function (k) {
            return liste.some(function (e) { return e.kategorie === k; });
        }));
        if (vorhanden.indexOf(aktiv) === -1) aktiv = "Alle";

        function zeichnen() {
            const gefiltert = liste.filter(function (e) {
                return aktiv === "Alle" || e.kategorie === aktiv;
            });
            if (!gefiltert.length) {
                fehler(gitter, "In dieser Kategorie gibt es noch keine Einträge.");
            } else {
                gitter.replaceChildren.apply(gitter, gefiltert.map(karte));
            }
            Array.prototype.forEach.call(filterLeiste.children, function (b) {
                b.setAttribute("aria-pressed", String(b.dataset.kategorie === aktiv));
            });
        }

        filterLeiste.replaceChildren.apply(filterLeiste, vorhanden.map(function (k) {
            return el("button", {
                class: "filter",
                type: "button",
                "data-kategorie": k,
                text: k,
                onclick: function () {
                    aktiv = k;
                    const url = new URL(window.location.href);
                    if (k === "Alle") url.searchParams.delete("kategorie");
                    else url.searchParams.set("kategorie", k);
                    history.replaceState(null, "", url);
                    zeichnen();
                }
            });
        }));
        zeichnen();
    }

    function shopSeite() {
        const gitter = document.getElementById("produkt-liste");
        Promise.all([ladeShop(), ladeProdukte()]).then(function (r) {
            const shop = r[0];
            const liste = r[1].slice().sort(function (a, b) {
                return Number(verfuegbar(b)) - Number(verfuegbar(a));
            });
            uebersicht(liste, shop.kategorien, gitter, document.getElementById("filter"), function (p) {
                return produktKarte(p, shop);
            });
        }).catch(function () { fehler(gitter, "Produkte konnten nicht geladen werden."); });
    }

    function projekteSeite() {
        const gitter = document.getElementById("projekt-liste");
        Promise.all([ladeShop(), ladeProjekte()]).then(function (r) {
            const kategorien = r[0].kategorien.slice();
            r[1].forEach(function (p) {
                if (kategorien.indexOf(p.kategorie) === -1) kategorien.push(p.kategorie);
            });
            uebersicht(r[1], kategorien, gitter, document.getElementById("filter"), projektKarte);
        }).catch(function () { fehler(gitter, "Projekte konnten nicht geladen werden."); });
    }

    /* ---------- Galerie ---------- */

    /* Galerie mit Vorschaubildern. Rückgabe: Element mit .zeige(src, markierung)
       zum Springen auf ein bestimmtes Bild; optionen.beiWechsel(src) meldet Klicks. */
    function galerie(bilder, alt, badges, optionen) {
        optionen = optionen || {};
        const liste = bilder && bilder.length ? bilder : ["images/project-placeholder.jpg"];
        const haupt = el("img", { src: liste[0], alt: alt });
        const markierung = el("span", { class: "exemplar-tag", hidden: true });
        const thumbs = el("div", { class: "thumbs" });

        function aktiv(src) {
            Array.prototype.forEach.call(thumbs.children, function (t) {
                t.setAttribute("aria-current", String(t.dataset.src === src));
            });
        }

        if (liste.length > 1) {
            liste.forEach(function (src, i) {
                thumbs.appendChild(el("button", {
                    class: "thumb",
                    type: "button",
                    "data-src": src,
                    "aria-label": (optionen.beschriftung && optionen.beschriftung[src]) || "Bild " + (i + 1) + " anzeigen",
                    "aria-current": i === 0 ? "true" : "false",
                    onclick: function () {
                        haupt.src = src;
                        aktiv(src);
                        markierung.hidden = true;
                        if (optionen.beiWechsel) optionen.beiWechsel(src);
                    }
                }, [el("img", { src: src, alt: "" })]));
            });
        }

        const wrapper = el("div", {}, [
            el("div", { class: "gallery-main" }, [haupt, markierung].concat(badges || [])),
            liste.length > 1 ? thumbs : null
        ]);

        wrapper.zeige = function (src, text) {
            if (!src) return;
            haupt.src = src;
            aktiv(src);
            markierung.textContent = text || "";
            markierung.hidden = !text;
            const thumb = Array.prototype.find.call(thumbs.children, function (t) { return t.dataset.src === src; });
            if (thumb && thumb.scrollIntoView) thumb.scrollIntoView({ block: "nearest", inline: "nearest" });
            const main = wrapper.firstChild;
            const box = main.getBoundingClientRect();
            if (box.top < 0 || box.bottom > window.innerHeight) {
                main.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        };
        return wrapper;
    }

    function absaetze(texte) {
        return (Array.isArray(texte) ? texte : [texte]).filter(Boolean).map(function (t) {
            return el("p", { text: t });
        });
    }

    /* ---------- Produktdetail ---------- */

    function versandText(p, shop) {
        if (p.versand === "anfrage") return "auf Anfrage, Abholung möglich";
        if (p.versand && typeof p.versand === "object") {
            return Object.keys(p.versand).map(function (zone) {
                const wert = p.versand[zone];
                return zone.replace("-Land", "") + " " + (wert === null ? "auf Anfrage" : preis(wert, shop.waehrung));
            }).join(" · ");
        }
        return shop.versandkosten;
    }

    function produktSeite() {
        const ziel = document.getElementById("produkt");
        const id = param("id");

        Promise.all([ladeShop(), ladeProdukte()]).then(function (r) {
            const shop = r[0];
            const p = r[1].find(function (e) { return e.id === id; });
            if (!p) {
                ziel.replaceChildren(
                    el("p", { class: "empty", text: "Dieses Werk gibt es nicht (mehr)." }),
                    el("a", { class: "button", href: "shop.html", text: "Alle Werke" })
                );
                return;
            }

            document.title = p.name + " – L057";
            const auswahl = {};
            const felder = [];

            Object.keys(p.varianten || {}).forEach(function (name) {
                const werte = p.varianten[name];
                if (!werte || !werte.length) return;
                auswahl[name] = werte[0];
                const feldId = "variante-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                felder.push(el("div", { class: "field" }, [
                    el("label", { for: feldId, text: name }),
                    el("select", {
                        class: "select",
                        id: feldId,
                        onchange: function (e) { auswahl[name] = e.target.value; }
                    }, werte.map(function (w) { return el("option", { value: w, text: w }); }))
                ]));
            });

            /* Exemplar-Auswahl bei nummerierten Kleinserien */
            let galerieEl = null;
            const bilderAlle = (p.bilder || []).slice();
            const bildZuNr = {};
            const beschriftung = {};
            if (hatExemplare(p)) {
                p.exemplare.forEach(function (x) {
                    if (!x.bild) return;
                    if (bilderAlle.indexOf(x.bild) === -1) bilderAlle.push(x.bild);
                    bildZuNr[x.bild] = x;
                    beschriftung[x.bild] = "Exemplar " + exemplarName(p, x.nr) + " anzeigen";
                });
            }
            let exemplarSelect = null;
            if (hatExemplare(p) && verfuegbar(p)) {
                const frei = freieExemplare(p);
                auswahl.Exemplar = exemplarName(p, frei[0].nr);
                exemplarSelect = el("select", {
                    class: "select",
                    id: "exemplar",
                    onchange: function (e) {
                        const x = p.exemplare.find(function (y) { return exemplarName(p, y.nr) === e.target.value; });
                        auswahl.Exemplar = e.target.value;
                        hinweis.textContent = "";
                        if (x && x.bild && galerieEl) galerieEl.zeige(x.bild, exemplarName(p, x.nr));
                    }
                }, p.exemplare.map(function (x) {
                    return el("option", {
                        value: exemplarName(p, x.nr),
                        disabled: !!x.verkauft,
                        text: exemplarName(p, x.nr) + (x.verkauft ? " – verkauft" : "")
                    });
                }));
                exemplarSelect.value = auswahl.Exemplar;
                felder.unshift(el("div", { class: "field" }, [
                    el("label", { for: "exemplar", text: "Exemplar wählen" }),
                    exemplarSelect
                ]));
            }

            const kaufBereich = el("div", { class: "buy-area" });
            const hinweis = el("p", { class: "buy-hint", "aria-live": "polite" });
            const anfrageLink = "mailto:" + shop.email + "?subject=" + encodeURIComponent("Anfrage zu: " + p.name);

            function imKorb() {
                return korbLesen().filter(function (e) { return e.id === p.id; })
                    .reduce(function (s, e) { return s + e.menge; }, 0);
            }

            if (!verfuegbar(p)) {
                kaufBereich.replaceChildren(el("a", {
                    class: "button button-block",
                    href: anfrageLink,
                    text: "Ähnliches Werk anfragen"
                }));
                hinweis.textContent = "Dieses Werk ist bereits verkauft.";
            } else {
                kaufBereich.replaceChildren(
                    el("button", {
                        class: "button button-primary button-block",
                        type: "button",
                        text: "In den Warenkorb",
                        onclick: function () {
                            if (hatExemplare(p) && korbLesen().some(function (e) {
                                return e.id === p.id && e.varianten && e.varianten.Exemplar === auswahl.Exemplar;
                            })) {
                                hinweis.replaceChildren(
                                    "Exemplar " + auswahl.Exemplar + " liegt schon im Warenkorb. ",
                                    el("a", { href: "warenkorb.html", text: "Zum Warenkorb →" })
                                );
                                return;
                            }
                            if (imKorb() >= bestand(p)) {
                                hinweis.replaceChildren(
                                    istUnikat(p) ? "Dieses Unikat liegt schon im Warenkorb. " : "Alle verfügbaren Exemplare liegen schon im Warenkorb. ",
                                    el("a", { href: "warenkorb.html", text: "Zum Warenkorb →" })
                                );
                                return;
                            }
                            korbHinzufuegen(p.id, Object.assign({}, auswahl), 1);
                            hinweis.replaceChildren(
                                "✓ Im Warenkorb · ",
                                el("a", { href: "warenkorb.html", text: "Zum Warenkorb →" })
                            );
                        }
                    }),
                    el("a", { class: "button button-block", href: anfrageLink, text: "Frage zum Werk" })
                );
            }

            const badges = [];
            if (!verfuegbar(p)) badges.push(el("span", { class: "badge", text: "Verkauft" }));
            if (p.beispiel) badges.push(el("span", { class: "badge badge-muted", text: "Beispiel" }));

            const fakten = [
                p.jahr ? ["Jahr", p.jahr] : null,
                p.technik ? ["Technik / Material", p.technik] : null,
                p.masse ? ["Maße", p.masse] : null,
                p.gewicht ? ["Gewicht", p.gewicht] : null,
                ["Auflage", auflageText(p)],
                ["Verfügbarkeit", verfuegbarText(p)],
                p.signiert ? ["Signatur", p.signiert] : null,
                p.zertifikat ? ["Echtheitszertifikat", "liegt bei"] : null,
                p.pflege ? ["Pflege", p.pflege] : null,
                verfuegbar(p) ? ["Lieferzeit", shop.lieferzeit] : null,
                verfuegbar(p) ? ["Versand", versandText(p, shop)] : null
            ].filter(Boolean);

            ziel.replaceChildren(
                el("nav", { class: "breadcrumb", "aria-label": "Brotkrümel" }, [
                    el("a", { href: "shop.html", text: "Werke" }), " / ",
                    el("a", { href: "shop.html?kategorie=" + encodeURIComponent(p.kategorie), text: p.kategorie }), " / ",
                    el("span", { text: p.name })
                ]),
                el("div", { class: "detail" }, [
                    (galerieEl = galerie(bilderAlle, p.name, badges, {
                        beschriftung: beschriftung,
                        beiWechsel: function (src) {
                            const x = bildZuNr[src];
                            if (x && !x.verkauft && exemplarSelect) {
                                exemplarSelect.value = exemplarName(p, x.nr);
                                auswahl.Exemplar = exemplarSelect.value;
                            }
                        }
                    })),
                    el("div", { class: "detail-info" }, [
                        el("span", { class: "card-kicker", text: p.kategorie + (p.jahr ? " · " + p.jahr : "") }),
                        el("h1", { text: p.name }),
                        el("p", { class: "price", text: verfuegbar(p) ? preis(p.preis, shop.waehrung) : "Verkauft" }),
                        verfuegbar(p) ? el("p", { class: "price-note" }, [
                            shop.preishinweis, " · ",
                            el("a", { href: "versand.html", text: "Versand & Zahlung" })
                        ]) : el("p", { class: "price-note", text: auflageText(p) }),
                        el("p", { class: "availability", text: auflageText(p) + " · " + verfuegbarText(p) }),
                        el("div", {}, verfuegbar(p) ? felder : []),
                        kaufBereich,
                        hinweis,
                        el("div", { class: "description" }, absaetze(p.beschreibung)),
                        el("ul", { class: "facts" }, fakten.map(function (f) {
                            return el("li", {}, [el("span", { text: f[0] }), el("span", { text: f[1] })]);
                        })),
                        p.hinweise ? el("div", { class: "notice" }, [
                            el("h2", { text: "Hinweise" }),
                            el("p", { text: p.hinweise })
                        ]) : null,
                        el("p", { class: "maker" }, [
                            el("span", { text: "Künstler: " }), shop.hersteller || ""
                        ]),
                        verfuegbar(p) ? el("p", { class: "maker" }, [
                            "14 Tage Widerrufsrecht. ",
                            el("a", { href: "widerruf.html", text: "Widerrufsbelehrung" })
                        ]) : null
                    ])
                ])
            );
            const ausgewaehlt = hatExemplare(p) && p.exemplare.find(function (x) {
                return exemplarName(p, x.nr) === auswahl.Exemplar;
            });
            const startExemplar = ausgewaehlt;
            if (startExemplar && startExemplar.bild && (p.bilder || []).length === 0) {
                galerieEl.zeige(startExemplar.bild, exemplarName(p, startExemplar.nr));
            }
        }).catch(function () { fehler(ziel, "Werk konnte nicht geladen werden."); });
    }

    /* ---------- Projektdetail ---------- */

    function projektSeite() {
        const ziel = document.getElementById("projekt");
        const id = param("id");

        Promise.all([ladeProjekte(), ladeProdukte()]).then(function (r) {
            const p = r[0].find(function (e) { return e.id === id; });
            if (!p) {
                ziel.replaceChildren(
                    el("p", { class: "empty", text: "Dieses Projekt gibt es nicht (mehr)." }),
                    el("a", { class: "button", href: "projekte.html", text: "Alle Projekte" })
                );
                return;
            }
            document.title = p.titel + " – L057 Projekte";
            const produkt = p.produkt && r[1].find(function (e) { return e.id === p.produkt; });
            const badges = p.beispiel ? [el("span", { class: "badge badge-muted", text: "Beispiel" })] : [];

            ziel.replaceChildren(
                el("nav", { class: "breadcrumb", "aria-label": "Brotkrümel" }, [
                    el("a", { href: "projekte.html", text: "Projekte" }), " / ",
                    el("span", { text: p.titel })
                ]),
                el("article", { class: "project-body" }, [
                    el("p", { class: "project-meta", text: p.kategorie + (p.jahr ? " · " + p.jahr : "") }),
                    el("h1", { text: p.titel }),
                    galerie(p.bilder, p.titel, badges),
                    el("div", { class: "description" }, absaetze(p.text)),
                    produkt ? el("div", { class: "button-group", style: "justify-content:flex-start" }, [
                        el("a", {
                            class: "button button-primary",
                            href: "produkt.html?id=" + encodeURIComponent(produkt.id),
                            text: "Im Shop ansehen"
                        })
                    ]) : null
                ])
            );
        }).catch(function () { fehler(ziel, "Projekt konnte nicht geladen werden."); });
    }

    /* ---------- Warenkorb-Seite ---------- */

    function warenkorbSeite() {
        const ziel = document.getElementById("warenkorb");
        const formular = {};

        Promise.all([ladeShop(), ladeProdukte()]).then(function (r) {
            const shop = r[0];
            const produkte = r[1];

            /* Einträge, die es nicht mehr gibt oder nicht verfügbar sind, entfernen */
            const bereinigt = korbLesen().filter(function (e) {
                const p = produkte.find(function (x) { return x.id === e.id; });
                if (p && hatExemplare(p)) {
                    const nr = e.varianten && e.varianten.Exemplar;
                    if (!freieExemplare(p).some(function (x) { return exemplarName(p, x.nr) === nr; })) return false;
                }
                return p && verfuegbar(p) && e.menge > 0;
            }).map(function (e) {
                const p = produkte.find(function (x) { return x.id === e.id; });
                return Object.assign({}, e, { menge: Math.min(e.menge, bestand(p)) });
            });
            korbSpeichern(bereinigt);

            function positionen() {
                return korbLesen().map(function (e) {
                    return { eintrag: e, produkt: produkte.find(function (x) { return x.id === e.id; }) };
                }).filter(function (x) { return x.produkt; });
            }

            function variantenText(v) {
                return Object.keys(v || {}).map(function (k) { return k + ": " + v[k]; }).join(", ");
            }

            function menge(index, neu) {
                const korb = korbLesen();
                if (neu <= 0) {
                    korb.splice(index, 1);
                } else {
                    const p = produkte.find(function (x) { return x.id === korb[index].id; });
                    const andere = korb.reduce(function (s, e, i) {
                        return s + (i !== index && e.id === korb[index].id ? e.menge : 0);
                    }, 0);
                    korb[index].menge = hatExemplare(p) ? 1 : Math.max(1, Math.min(neu, bestand(p) - andere));
                }
                korbSpeichern(korb);
                zeichnen();
            }

            function berechnen(liste) {
                const zwischensumme = liste.reduce(function (s, x) { return s + x.produkt.preis * x.eintrag.menge; }, 0);
                const physisch = liste.some(function (x) { return x.produkt.typ !== "digital"; });
                const frei = shop.versandfrei_ab > 0 && zwischensumme >= shop.versandfrei_ab;
                const zonen = shop.versandzonen || [];
                const zone = zonen[formular.zone || 0] || { name: "", preis: 0 };
                const abholung = !!zone.abholung;
                /* Versand pro Bestellung: der höchste Versandpreis der enthaltenen Werke */
                let anfrage = physisch && !frei && !abholung && zone.preis === null;
                let versand = 0;
                if (physisch && !frei && !abholung && !anfrage) {
                    liste.forEach(function (x) {
                        const v = x.produkt.versand;
                        if (v === "anfrage") { anfrage = true; return; }
                        const eigen = v && typeof v === "object" ? v[zone.name] : undefined;
                        if (eigen === null) { anfrage = true; return; }
                        versand = Math.max(versand, typeof eigen === "number" ? eigen : zone.preis);
                    });
                    if (anfrage) versand = 0;
                }
                return {
                    zwischensumme: zwischensumme, versand: versand, physisch: physisch, abholung: abholung,
                    anfrage: anfrage, zone: zone.name, gesamt: zwischensumme + versand
                };
            }

            function bestelltext(liste, summe) {
                const zeilen = liste.map(function (x) {
                    const v = variantenText(x.eintrag.varianten);
                    return "• " + x.eintrag.menge + " × " + x.produkt.name + (v ? " (" + v + ")" : "") +
                        " – " + preis(x.produkt.preis * x.eintrag.menge, shop.waehrung);
                });
                return [
                    "Hallo,",
                    "",
                    "ich möchte folgendes bestellen:",
                    "",
                    zeilen.join("\n"),
                    "",
                    "Zwischensumme: " + preis(summe.zwischensumme, shop.waehrung),
                    summe.physisch ? (summe.abholung ? "Lieferung: " : "Lieferland: ") + summe.zone : null,
                    summe.physisch ? "Versand: " + (summe.abholung ? "keiner (Abholung)" : summe.anfrage ? "bitte um Angebot" : preis(summe.versand, shop.waehrung)) : null,
                    "Gesamt: " + preis(summe.gesamt, shop.waehrung) + (summe.anfrage ? " zzgl. Versand" : ""),
                    "Zahlung: " + (formular.zahlung || (shop.zahlungsarten || [""])[0]),
                    "",
                    "Name: " + (formular.name || ""),
                    summe.physisch && !summe.abholung ? "Lieferadresse:\n" + (formular.adresse || "") : null,
                    summe.abholung ? "Telefon / Kontakt für die Abholung: " + (formular.adresse || "") : null,
                    formular.notiz ? "\nAnmerkung:\n" + formular.notiz : null,
                    formular.agb ? "\nAGB und Widerrufsbelehrung gelesen: ja" : null,
                    "",
                    "Danke!"
                ].filter(function (z) { return z !== null; }).join("\n");
            }

            function eingabe(name, label, mehrzeilig, pflicht) {
                const id = "feld-" + name;
                const feld = el(mehrzeilig ? "textarea" : "input", {
                    class: "input",
                    id: id,
                    name: name,
                    rows: mehrzeilig ? 3 : null,
                    type: mehrzeilig ? null : "text",
                    autocomplete: name === "name" ? "name" : (name === "adresse" ? "street-address" : "off"),
                    required: pflicht,
                    oninput: function (e) { formular[name] = e.target.value; }
                });
                feld.value = formular[name] || "";
                return el("div", { class: "field" }, [el("label", { for: id, text: label }), feld]);
            }

            function zeichnen() {
                const liste = positionen();

                if (!liste.length) {
                    ziel.replaceChildren(
                        el("header", { class: "page-head" }, [el("h1", { text: "Warenkorb" })]),
                        el("p", { class: "empty", text: "Dein Warenkorb ist leer." }),
                        el("a", { class: "button", href: "shop.html", text: "Zum Shop" })
                    );
                    return;
                }

                const summe = berechnen(liste);
                const status = el("p", { class: "buy-hint", "aria-live": "polite" });

                const zeilen = liste.map(function (x, i) {
                    const v = variantenText(x.eintrag.varianten);
                    return el("li", { class: "cart-item" }, [
                        el("a", { class: "cart-thumb", href: "produkt.html?id=" + encodeURIComponent(x.produkt.id) }, [
                            bild(x.produkt.bilder && x.produkt.bilder[0], x.produkt.name)
                        ]),
                        el("div", { class: "cart-info" }, [
                            el("a", { class: "cart-name", href: "produkt.html?id=" + encodeURIComponent(x.produkt.id), text: x.produkt.name }),
                            v ? el("span", { class: "cart-variant", text: v }) : null,
                            el("span", { class: "cart-variant", text: auflageText(x.produkt) + " · " + preis(x.produkt.preis, shop.waehrung) + (istUnikat(x.produkt) ? "" : " / Exemplar") }),
                            el("div", { class: "qty" }, [
                                el("button", { type: "button", "aria-label": "Eins weniger", text: "−", onclick: function () { menge(i, x.eintrag.menge - 1); } }),
                                el("span", { "aria-live": "polite", text: String(x.eintrag.menge) }),
                                el("button", {
                                    type: "button", "aria-label": "Eins mehr", text: "+",
                                    disabled: hatExemplare(x.produkt) || korbLesen().filter(function (e) { return e.id === x.produkt.id; })
                                        .reduce(function (s, e) { return s + e.menge; }, 0) >= bestand(x.produkt),
                                    onclick: function () { menge(i, x.eintrag.menge + 1); }
                                }),
                                el("button", { type: "button", class: "cart-remove", text: "Entfernen", onclick: function () { menge(i, 0); } })
                            ])
                        ]),
                        el("span", { class: "cart-line-price", text: preis(x.produkt.preis * x.eintrag.menge, shop.waehrung) })
                    ]);
                });

                function summenZeile(label, wert, stark) {
                    return el("li", { class: stark ? "total" : null }, [el("span", { text: label }), el("span", { text: wert })]);
                }

                const versandText = !summe.physisch ? null :
                    (summe.abholung ? "Abholung" : summe.anfrage ? "auf Anfrage" : (summe.versand === 0 ? "kostenlos" : preis(summe.versand, shop.waehrung)));

                function auswahlFeld(name, label, optionen, onchange) {
                    const id = "feld-" + name;
                    const sel = el("select", { class: "select", id: id, onchange: onchange },
                        optionen.map(function (o, i) { return el("option", { value: String(i), text: o }); }));
                    return { feld: el("div", { class: "field" }, [el("label", { for: id, text: label }), sel]), select: sel };
                }

                const landWahl = summe.physisch && (shop.versandzonen || []).length ? auswahlFeld(
                    "zone", "Lieferland",
                    shop.versandzonen.map(function (z) {
                        return z.name + (z.preis === null ? "" : " – " + preis(z.preis, shop.waehrung));
                    }),
                    function (e) { formular.zone = Number(e.target.value); zeichnen(); }
                ) : null;
                if (landWahl) landWahl.select.value = String(formular.zone || 0);

                const zahlWahl = (shop.zahlungsarten || []).length > 1 ? auswahlFeld(
                    "zahlung", "Zahlungsart", shop.zahlungsarten,
                    function (e) { formular.zahlung = shop.zahlungsarten[Number(e.target.value)]; }
                ) : null;
                if (zahlWahl) zahlWahl.select.value = String(Math.max(0, shop.zahlungsarten.indexOf(formular.zahlung)));

                function absenden() {
                    if (!formular.name || (summe.physisch && !summe.abholung && !formular.adresse)) {
                        status.textContent = summe.physisch
                            ? "Bitte Name und Lieferadresse ausfüllen."
                            : "Bitte deinen Namen ausfüllen.";
                        return;
                    }
                    if (!formular.agb) {
                        status.textContent = "Bitte bestätige, dass du AGB und Widerrufsbelehrung gelesen hast.";
                        return;
                    }
                    const betreff = "Bestellung über l057.at (" + preis(summe.gesamt, shop.waehrung) + ")";
                    window.location.href = "mailto:" + shop.email +
                        "?subject=" + encodeURIComponent(betreff) +
                        "&body=" + encodeURIComponent(bestelltext(liste, summe));
                    status.textContent = "Dein Mailprogramm öffnet sich. Bitte die Mail dort noch absenden.";
                }

                function kopieren() {
                    const text = "An: " + shop.email + "\n\n" + bestelltext(liste, summe);
                    const ok = function () { status.textContent = "Bestellung kopiert. Füge sie in eine Mail an " + shop.email + " ein."; };
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text).then(ok, function () {
                            status.textContent = "Kopieren nicht möglich. Bitte schreib an " + shop.email + ".";
                        });
                    } else {
                        status.textContent = "Kopieren nicht möglich. Bitte schreib an " + shop.email + ".";
                    }
                }

                ziel.replaceChildren(
                    el("header", { class: "page-head" }, [el("h1", { text: "Warenkorb" })]),
                    el("div", { class: "cart" }, [
                        el("ul", { class: "cart-list" }, zeilen),
                        el("aside", { class: "cart-summary" }, [
                            el("h2", { text: "Bestellung" }),
                            el("ul", { class: "facts" }, [
                                summenZeile("Zwischensumme", preis(summe.zwischensumme, shop.waehrung)),
                                versandText ? summenZeile("Versand", versandText) : null,
                                summenZeile("Gesamt", preis(summe.gesamt, shop.waehrung) + (summe.anfrage ? " + Versand" : ""), true)
                            ]),
                            el("p", { class: "price-note", style: "margin-top:10px" }, [
                                (shop.steuerhinweis || "") + " ",
                                summe.physisch ? el("a", { href: "versand.html", text: "Versand & Zahlung" }) : null
                            ]),
                            el("form", {
                                class: "cart-form",
                                novalidate: true,
                                onsubmit: function (e) { e.preventDefault(); absenden(); }
                            }, [
                                landWahl ? landWahl.feld : null,
                                eingabe("name", "Name", false, true),
                                summe.physisch ? eingabe("adresse", summe.abholung ? "Telefon oder Hinweis zur Abholung (optional)" : "Lieferadresse", true, !summe.abholung) : null,
                                zahlWahl ? zahlWahl.feld : null,
                                eingabe("notiz", "Anmerkung (optional)", true, false),
                                el("label", { class: "check" }, [
                                    (function () {
                                        const box = el("input", {
                                            type: "checkbox",
                                            name: "agb",
                                            onchange: function (e) { formular.agb = e.target.checked; }
                                        });
                                        box.checked = !!formular.agb;
                                        return box;
                                    })(),
                                    el("span", {}, [
                                        "Ich habe die ",
                                        el("a", { href: "agb.html", target: "_blank", text: "AGB" }),
                                        " und die ",
                                        el("a", { href: "widerruf.html", target: "_blank", text: "Widerrufsbelehrung" }),
                                        " gelesen."
                                    ])
                                ]),
                                el("button", { class: "button button-primary button-block", type: "submit", text: "Bestellung per E-Mail senden" }),
                                el("button", { class: "button button-block", type: "button", style: "margin-top:10px", text: "Bestellung kopieren", onclick: kopieren })
                            ]),
                            status,
                            el("p", { class: "buy-hint" }, [
                                "Du bekommst eine Bestätigung mit den Zahlungsinfos per E-Mail. Erst damit ist die Bestellung verbindlich."
                            ])
                        ])
                    ])
                );
            }

            zeichnen();
        }).catch(function () { fehler(ziel, "Warenkorb konnte nicht geladen werden."); });
    }

    /* ---------- Widerrufsfunktion (§ 13a FAGG) ---------- */

    function widerrufSeite() {
        const form = document.getElementById("widerruf-form");
        const status = document.getElementById("widerruf-status");
        if (!form) return;

        function werte() {
            const d = new FormData(form);
            return {
                name: (d.get("name") || "").trim(),
                email: (d.get("email") || "").trim(),
                bestellung: (d.get("bestellung") || "").trim(),
                artikel: (d.get("artikel") || "").trim(),
                erhalten: (d.get("erhalten") || "").trim()
            };
        }

        function text(w) {
            return [
                "Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über den Kauf der folgenden Waren:",
                "",
                w.artikel || "(alle Artikel der Bestellung)",
                "",
                "Bestellt am / Bestellung: " + w.bestellung,
                "Erhalten am: " + (w.erhalten || "-"),
                "Name: " + w.name,
                "E-Mail: " + w.email,
                "Datum der Erklärung: " + new Date().toLocaleDateString("de-AT")
            ].join("\n");
        }

        ladeShop().then(function (shop) {
            form.addEventListener("submit", function (e) {
                e.preventDefault();
                const w = werte();
                if (!w.name || !w.email || !w.bestellung) {
                    status.textContent = "Bitte Name, E-Mail und Bestellung (Datum oder Nummer) angeben.";
                    return;
                }
                window.location.href = "mailto:" + shop.email +
                    "?subject=" + encodeURIComponent("Vertrag widerrufen – " + w.name + " (" + w.bestellung + ")") +
                    "&body=" + encodeURIComponent(text(w));
                status.textContent = "Dein Mailprogramm öffnet sich mit der fertigen Widerrufserklärung. " +
                    "Bitte sende die Mail ab. Du bekommst eine Eingangsbestätigung per E-Mail.";
            });

            document.getElementById("widerruf-kopieren").addEventListener("click", function () {
                const w = werte();
                const fertig = "An: " + shop.email + "\nBetreff: Vertrag widerrufen\n\n" + text(w);
                const fehlt = function () {
                    status.textContent = "Kopieren nicht möglich. Bitte schreib an " + shop.email + ".";
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(fertig).then(function () {
                        status.textContent = "Widerrufserklärung kopiert. Füge sie in eine Mail an " + shop.email + " ein.";
                    }, fehlt);
                } else {
                    fehlt();
                }
            });
        });
    }

    /* ---------- Start ---------- */

    const seiten = {
        start: startseite,
        shop: shopSeite,
        produkt: produktSeite,
        projekte: projekteSeite,
        projekt: projektSeite,
        warenkorb: warenkorbSeite,
        widerruf: widerrufSeite
    };

    korbAnzeigen();

    /* Social-Media-Links aus data/shop.json (leere Einträge werden ausgeblendet) */
    ladeShop().then(function (shop) {
        const links = Object.keys(shop.social || {}).filter(function (k) { return shop.social[k]; });
        if (!links.length) return;
        document.querySelectorAll("[data-social]").forEach(function (nav) {
            const liste = nav.querySelector("ul");
            liste.replaceChildren.apply(liste, links.map(function (k) {
                return el("li", {}, [el("a", { href: shop.social[k], rel: "noopener me", target: "_blank", text: k })]);
            }));
            nav.hidden = false;
        });
    }).catch(function () { /* Fußzeile bleibt ohne Social Links */ });

    document.querySelectorAll("[data-jahr]").forEach(function (n) {
        n.textContent = new Date().getFullYear();
    });

    const seite = document.body.dataset.seite;
    if (seiten[seite]) seiten[seite]();
})();
