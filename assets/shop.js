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

    function bild(src, alt) {
        return el("img", {
            src: src || "images/project-placeholder.jpg",
            alt: alt || "",
            loading: "lazy",
            decoding: "async"
        });
    }

    /* ---------- Karten ---------- */

    function produktKarte(p, shop) {
        const badges = [];
        if (!p.verfuegbar) badges.push(el("span", { class: "badge", text: "Bald verfügbar" }));
        if (p.typ === "digital") badges.push(el("span", { class: "badge badge-muted", text: "Digital" }));
        if (p.beispiel && badges.length < 2) badges.push(el("span", { class: "badge badge-muted", text: "Beispiel" }));

        return el("a", { class: "card", href: "produkt.html?id=" + encodeURIComponent(p.id) }, [
            el("div", { class: "card-media" }, [bild(p.bilder && p.bilder[0], p.name)].concat(badges)),
            el("div", { class: "card-body" }, [
                el("span", { class: "card-kicker", text: p.kategorie }),
                el("h3", { text: p.name }),
                el("p", { text: p.kurz }),
                el("span", { class: "card-price", text: preis(p.preis, shop.waehrung) })
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
                return Number(b.verfuegbar) - Number(a.verfuegbar);
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

    function galerie(bilder, alt, badges) {
        const liste = bilder && bilder.length ? bilder : ["images/project-placeholder.jpg"];
        const haupt = el("img", { src: liste[0], alt: alt });
        const thumbs = el("div", { class: "thumbs" });

        if (liste.length > 1) {
            liste.forEach(function (src, i) {
                thumbs.appendChild(el("button", {
                    class: "thumb",
                    type: "button",
                    "aria-label": "Bild " + (i + 1) + " anzeigen",
                    "aria-current": i === 0 ? "true" : "false",
                    onclick: function (e) {
                        haupt.src = src;
                        Array.prototype.forEach.call(thumbs.children, function (t) {
                            t.setAttribute("aria-current", "false");
                        });
                        e.currentTarget.setAttribute("aria-current", "true");
                    }
                }, [el("img", { src: src, alt: "" })]));
            });
        }

        return el("div", {}, [
            el("div", { class: "gallery-main" }, [haupt].concat(badges || [])),
            liste.length > 1 ? thumbs : null
        ]);
    }

    function absaetze(texte) {
        return (Array.isArray(texte) ? texte : [texte]).filter(Boolean).map(function (t) {
            return el("p", { text: t });
        });
    }

    /* ---------- Produktdetail ---------- */

    function produktSeite() {
        const ziel = document.getElementById("produkt");
        const id = param("id");

        Promise.all([ladeShop(), ladeProdukte()]).then(function (r) {
            const shop = r[0];
            const p = r[1].find(function (e) { return e.id === id; });
            if (!p) {
                ziel.replaceChildren(
                    el("p", { class: "empty", text: "Dieses Produkt gibt es nicht (mehr)." }),
                    el("a", { class: "button", href: "shop.html", text: "Zum Shop" })
                );
                return;
            }

            document.title = p.name + " – L057 Shop";
            const digital = p.typ === "digital";
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
                        onchange: function (e) {
                            auswahl[name] = e.target.value;
                            knopfAktualisieren();
                        }
                    }, werte.map(function (w) { return el("option", { value: w, text: w }); }))
                ]));
            });

            const knopf = el("a", { class: "button button-primary button-block" });
            const hinweis = el("p", { class: "buy-hint" });

            function auswahlText() {
                return Object.keys(auswahl).map(function (k) { return k + ": " + auswahl[k]; }).join(", ");
            }

            function zahlungslink() {
                const link = p.zahlungslink;
                if (!link) return "";
                if (typeof link === "string") return link;
                /* Pro Variante ein eigener Link: { "M": "https://buy.stripe.com/..." } */
                const werte = Object.keys(auswahl).map(function (k) { return auswahl[k]; });
                const schluessel = werte.join(" / ");
                return link[schluessel] || link[werte[0]] || "";
            }

            function knopfAktualisieren() {
                const link = zahlungslink();
                knopf.removeAttribute("target");
                knopf.removeAttribute("rel");
                knopf.removeAttribute("aria-disabled");

                if (!p.verfuegbar) {
                    const betreff = "Benachrichtigung: " + p.name;
                    knopf.textContent = "Benachrichtigen, wenn verfügbar";
                    knopf.className = "button button-block";
                    knopf.href = "mailto:" + shop.email + "?subject=" + encodeURIComponent(betreff);
                    hinweis.textContent = "Dieses Produkt ist derzeit nicht erhältlich.";
                } else if (link) {
                    knopf.textContent = "Jetzt kaufen";
                    knopf.className = "button button-primary button-block";
                    knopf.href = link;
                    knopf.setAttribute("rel", "noopener");
                    hinweis.textContent = "Sichere Bezahlung, du wirst zur Kasse weitergeleitet.";
                } else {
                    const details = auswahlText();
                    const betreff = "Bestellanfrage: " + p.name + (details ? " (" + details + ")" : "");
                    const text =
                        "Hallo,\n\nich möchte folgendes bestellen:\n\n" +
                        p.name + (details ? "\n" + details : "") + "\nPreis: " + preis(p.preis, shop.waehrung) +
                        "\nMenge: 1\n\n" +
                        (digital ? "" : "Lieferadresse:\n\n") +
                        "Danke!";
                    knopf.textContent = "Bestellen per E-Mail";
                    knopf.className = "button button-primary button-block";
                    knopf.href = "mailto:" + shop.email + "?subject=" + encodeURIComponent(betreff) +
                        "&body=" + encodeURIComponent(text);
                    hinweis.textContent = "Du bekommst eine Bestätigung mit Zahlungsinfos per E-Mail.";
                }
            }
            knopfAktualisieren();

            const badges = p.beispiel ? [el("span", { class: "badge badge-muted", text: "Beispiel" })] : [];
            const fakten = [
                ["Kategorie", p.kategorie],
                ["Art", digital ? "Digitaler Download" : "Physisches Produkt"],
                digital ? null : ["Lieferzeit", shop.lieferzeit],
                digital ? null : ["Versand", shop.versandkosten]
            ].filter(Boolean);

            ziel.replaceChildren(
                el("nav", { class: "breadcrumb", "aria-label": "Brotkrümel" }, [
                    el("a", { href: "shop.html", text: "Shop" }), " / ",
                    el("a", { href: "shop.html?kategorie=" + encodeURIComponent(p.kategorie), text: p.kategorie }), " / ",
                    el("span", { text: p.name })
                ]),
                el("div", { class: "detail" }, [
                    galerie(p.bilder, p.name, badges),
                    el("div", { class: "detail-info" }, [
                        el("span", { class: "card-kicker", text: p.kategorie }),
                        el("h1", { text: p.name }),
                        el("p", { class: "price", text: preis(p.preis, shop.waehrung) }),
                        el("p", { class: "price-note" }, [
                            digital ? shop.preishinweis_digital : shop.preishinweis,
                            digital ? null : " · ",
                            digital ? null : el("a", { href: "versand.html", text: "Versand & Zahlung" })
                        ]),
                        el("div", {}, felder),
                        knopf,
                        hinweis,
                        el("div", { class: "description" }, absaetze(p.beschreibung)),
                        el("ul", { class: "facts" }, fakten.map(function (f) {
                            return el("li", {}, [el("span", { text: f[0] }), el("span", { text: f[1] })]);
                        }))
                    ])
                ])
            );
        }).catch(function () { fehler(ziel, "Produkt konnte nicht geladen werden."); });
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

    /* ---------- Start ---------- */

    const seiten = {
        start: startseite,
        shop: shopSeite,
        produkt: produktSeite,
        projekte: projekteSeite,
        projekt: projektSeite
    };

    document.querySelectorAll("[data-jahr]").forEach(function (n) {
        n.textContent = new Date().getFullYear();
    });

    const seite = document.body.dataset.seite;
    if (seiten[seite]) seiten[seite]();
})();
