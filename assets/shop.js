/* ==========================================================
   L057 – Shop & Projekte
   Liest die Einträge aus data/*.json und baut daraus die Seiten.
   Neue Produkte/Projekte: nur die JSON-Dateien bearbeiten.
   ========================================================== */

(function () {
    "use strict";

    /* ---------- Sprache ---------- */

    const SPRACHE = document.documentElement.lang === "en" ? "en" : "de";

    /* Marke: L057 (Wurzel) oder eine zweite Marke in einem Unterordner, z. B. /nebelzikade/.
       Die Seite gibt das über data-Attribute am <body> an (siehe werkzeug/build.py). */
    const MARKE = document.body.dataset.marke || "L057";
    const BASIS = document.body.dataset.basis || "/";
    const WEBSITE = document.body.dataset.website || "l057.at";
    const WORTE = window.MARKE_TEXTE || {};
    const UEBERSETZUNG = {
        "An: ": "To: ",
        "Warenkorb, ": "Cart, ",
        " Artikel": " items",
        "Kleinserie, Auflage ": "Limited edition of ",
        "Verkauft": "Sold",
        "Verfügbar": "Available",
        "Edition /": "Edition /",
        "Beispiel": "Example",
        "Produkte konnten nicht geladen werden.": "Works could not be loaded.",
        "Projekte konnten nicht geladen werden.": "Projects could not be loaded.",
        "In dieser Kategorie gibt es noch keine Einträge.": "Nothing in this category yet.",
        "auf Anfrage, Abholung möglich": "on request, pickup possible",
        "auf Anfrage": "on request",
        "Dieses Werk gibt es nicht (mehr).": "This work does not exist (anymore).",
        "Alle Werke": "All works",
        "Exemplar ": "Copy ",
        " – verkauft": " – sold",
        "Exemplar wählen": "Choose your copy",
        "Anfrage zu: ": "Enquiry about: ",
        "Ähnliches Werk anfragen": "Ask about a similar work",
        "Dieses Werk ist bereits verkauft.": "This work has been sold.",
        "In den Warenkorb": "Add to cart",
        " liegt schon im Warenkorb. ": " is already in your cart. ",
        "Zum Warenkorb →": "Go to cart →",
        "Dieses Unikat liegt schon im Warenkorb. ": "This unique piece is already in your cart. ",
        "Alle verfügbaren Exemplare liegen schon im Warenkorb. ": "All available copies are already in your cart. ",
        "✓ Im Warenkorb · ": "✓ Added to cart · ",
        "Frage zum Werk": "Ask about this work",
        "Jahr": "Year",
        "Technik / Material": "Technique / material",
        "Maße": "Dimensions",
        "Gewicht": "Weight",
        "Auflage": "Edition",
        "Verfügbarkeit": "Availability",
        "Signatur": "Signature",
        "Echtheitszertifikat": "Certificate of authenticity",
        "liegt bei": "included",
        "Pflege": "Care",
        "Lieferzeit": "Delivery time",
        "Versand": "Shipping",
        "Brotkrümel": "Breadcrumb",
        "Werke": "Works",
        "Versand & Zahlung": "Shipping & payment",
        "Hinweise": "Notes",
        "Künstler: ": "Artist: ",
        "14 Tage Widerrufsrecht. ": "14-day right of withdrawal. ",
        "Widerrufsbelehrung": "Right of withdrawal",
        "Werk konnte nicht geladen werden.": "Work could not be loaded.",
        "Dieses Projekt gibt es nicht (mehr).": "This project does not exist (anymore).",
        "Alle Projekte": "All projects",
        " – L057 Projekte": " – L057 Projects",
        "Projekte": "Projects",
        "Im Shop ansehen": "View in shop",
        "Projekt konnte nicht geladen werden.": "Project could not be loaded.",
        "Hallo,": "Hello,",
        "ich möchte folgendes bestellen:": "I would like to order:",
        "Zwischensumme: ": "Subtotal: ",
        "Lieferung: ": "Delivery: ",
        "Lieferland: ": "Destination: ",
        "Versand: ": "Shipping: ",
        "keiner (Abholung)": "none (pickup)",
        "bitte um Angebot": "please send a quote",
        "Gesamt: ": "Total: ",
        " zzgl. Versand": " plus shipping",
        "Zahlung: ": "Payment: ",
        "Name: ": "Name: ",
        "Lieferadresse:\n": "Shipping address:\n",
        "Telefon / Kontakt für die Abholung: ": "Phone / contact for pickup: ",
        "\nAnmerkung:\n": "\nNote:\n",
        "\nAGB und Widerrufsbelehrung gelesen: ja": "\nTerms and withdrawal policy read: yes",
        "Danke!": "Thank you!",
        "Warenkorb": "Cart",
        "Dein Warenkorb ist leer.": "Your cart is empty.",
        "Zum Shop": "To the shop",
        " / Exemplar": " / copy",
        "Eins weniger": "One less",
        "Eins mehr": "One more",
        "Entfernen": "Remove",
        "Abholung": "Pickup",
        "Lieferland": "Destination",
        "Zahlungsart": "Payment method",
        "Bitte Name und Lieferadresse ausfüllen.": "Please enter your name and shipping address.",
        "Bitte deinen Namen ausfüllen.": "Please enter your name.",
        "Bitte bestätige, dass du AGB und Widerrufsbelehrung gelesen hast.": "Please confirm that you have read the terms and the withdrawal policy.",
        "Bestellung über ": "Order via ",
        "Dein Mailprogramm öffnet sich. Bitte die Mail dort noch absenden.": "Your email app will open. Please send the email from there.",
        "Bestellung kopiert. Füge sie in eine Mail an ": "Order copied. Paste it into an email to ",
        "Kopieren nicht möglich. Bitte schreib an ": "Copying not possible. Please write to ",
        "Bestellung": "Order",
        "Zwischensumme": "Subtotal",
        "Gesamt": "Total",
        " + Versand": " + shipping",
        "Name": "Name",
        "Telefon oder Hinweis zur Abholung (optional)": "Phone or note for pickup (optional)",
        "Lieferadresse": "Shipping address",
        "Anmerkung (optional)": "Note (optional)",
        "Ich habe die ": "I have read the ",
        "AGB": "terms",
        " und die ": " and the ",
        " gelesen.": ".",
        "Bestellung per E-Mail senden": "Send order by email",
        "Bestellung kopieren": "Copy order",
        "Du bekommst eine Bestätigung mit den Zahlungsinfos per E-Mail. Erst damit ist die Bestellung verbindlich.": "You will receive a confirmation with payment details by email. The order is only binding once confirmed.",
        "Warenkorb konnte nicht geladen werden.": "Cart could not be loaded.",
        "Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über den Kauf der folgenden Waren:": "I hereby withdraw from my contract for the purchase of the following goods:",
        "(alle Artikel der Bestellung)": "(all items of the order)",
        "Bestellt am / Bestellung: ": "Ordered on / order: ",
        "Erhalten am: ": "Received on: ",
        "E-Mail: ": "Email: ",
        "Datum der Erklärung: ": "Date of declaration: ",
        "Bitte Name, E-Mail und Bestellung (Datum oder Nummer) angeben.": "Please enter your name, email and order (date or number).",
        "Vertrag widerrufen – ": "Withdrawal from contract – ",
        "Dein Mailprogramm öffnet sich mit der fertigen Widerrufserklärung. ": "Your email app will open with the prepared withdrawal notice. ",
        "Bitte sende die Mail ab. Du bekommst eine Eingangsbestätigung per E-Mail.": "Please send the email. You will receive a confirmation of receipt by email.",
        "\nBetreff: Vertrag widerrufen\n\n": "\nSubject: Withdrawal from contract\n\n",
        "Widerrufserklärung kopiert. Füge sie in eine Mail an ": "Withdrawal notice copied. Paste it into an email to ",
        " ein.": ".",
        "Alle": "All",
        "Unikat": "Unique piece",
        "Benachrichtigung: ": "Notification: "
    };

    function t(text) {
        if (Object.prototype.hasOwnProperty.call(WORTE, text)) return WORTE[text];
        return SPRACHE === "en" && Object.prototype.hasOwnProperty.call(UEBERSETZUNG, text) ? UEBERSETZUNG[text] : text;
    }

    /* Englische Felder ("name_en" usw.) verwenden, wenn vorhanden */
    function lokal(eintrag) {
        if (SPRACHE !== "en" || !eintrag || typeof eintrag !== "object") return eintrag;
        const kopie = Object.assign({}, eintrag);
        Object.keys(eintrag).forEach(function (k) {
            if (!/_en$/.test(k)) return;
            const wert = eintrag[k];
            const leer = wert === "" || wert == null || (Array.isArray(wert) && !wert.length);
            if (!leer) kopie[k.slice(0, -3)] = wert;
        });
        return kopie;
    }

    let kategorieNamen = {};

    function kat(name) {
        return SPRACHE === "en" && kategorieNamen[name] ? kategorieNamen[name] : name;
    }

    function zoneName(zone) {
        return SPRACHE === "en" && zone.name_en ? zone.name_en : zone.name;
    }

    /* Pfade immer ab Seitenwurzel, damit /en/-Seiten dieselben Dateien nutzen */
    function pfad(src) {
        if (!src) return "/images/project-placeholder.jpg";
        return /^(https?:|\/|data:|blob:)/.test(src) ? src : BASIS + src;
    }

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

    const ladeShop = function () {
        return laden(BASIS + "data/shop.json").then(function (shop) {
            kategorieNamen = shop.kategorien_englisch || {};
            return lokal(shop);
        });
    };
    const ladeProdukte = function () { return laden(BASIS + "data/produkte.json").then(function (l) { return l.map(lokal); }); };
    const ladeProjekte = function () { return laden(BASIS + "data/projekte.json").then(function (l) { return l.map(lokal); }); };

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
        return new Intl.NumberFormat(SPRACHE === "en" ? "en-IE" : "de-AT", {
            style: "currency",
            currency: waehrung || "EUR"
        }).format(betrag);
    }

    function param(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    /* ---------- Warenkorb (bleibt im Browser des Kunden gespeichert) ---------- */

    const KORB_SCHLUESSEL = document.body.dataset.korb || "l057-warenkorb";
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
            n.setAttribute("aria-label", t("Warenkorb, ") + anzahl + (anzahl === 1 ? t(" Artikel") : t(" Artikel")));
        });
    }

    window.addEventListener("storage", function (e) {
        if (e.key === KORB_SCHLUESSEL) korbAnzeigen();
    });

    function bild(src, alt) {
        return el("img", {
            src: pfad(src),
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
        return istUnikat(p) ? t("Unikat") : t("Kleinserie, Auflage ") + p.auflage;
    }

    function verfuegbarText(p) {
        const n = bestand(p);
        if (n === 0) return t("Verkauft");
        if (istUnikat(p)) return t("Verfügbar");
        return SPRACHE === "en" ? n + " of " + p.auflage + " available" : "Noch " + n + " von " + p.auflage + " verfügbar";
    }

    /* ---------- Karten ---------- */

    function produktKarte(p, shop) {
        const badges = [];
        if (!verfuegbar(p)) badges.push(el("span", { class: "badge", text: t("Verkauft") }));
        else badges.push(el("span", { class: "badge badge-muted", text: istUnikat(p) ? t("Unikat") : t("Edition /") + p.auflage }));
        if (p.beispiel) badges.push(el("span", { class: "badge badge-muted", text: t("Beispiel") }));

        return el("a", { class: "card" + (verfuegbar(p) ? "" : " card-sold"), href: "produkt.html?id=" + encodeURIComponent(p.id) }, [
            el("div", { class: "card-media" }, [bild(p.bilder && p.bilder[0], p.name)].concat(badges)),
            el("div", { class: "card-body" }, [
                el("span", { class: "card-kicker", text: kat(p.kategorie) + (p.jahr ? " · " + p.jahr : "") }),
                el("h3", { text: p.name }),
                el("p", { text: p.kurz }),
                el("span", { class: "card-price", text: verfuegbar(p) ? preis(p.preis, shop.waehrung) : t("Verkauft") })
            ])
        ]);
    }

    function projektKarte(p) {
        const badges = p.beispiel ? [el("span", { class: "badge badge-muted", text: t("Beispiel") })] : [];
        return el("a", { class: "card", href: "projekt.html?id=" + encodeURIComponent(p.id) }, [
            el("div", { class: "card-media" }, [bild(p.bilder && p.bilder[0], p.titel)].concat(badges)),
            el("div", { class: "card-body" }, [
                el("span", { class: "card-kicker", text: kat(p.kategorie) + (p.jahr ? " · " + p.jahr : "") }),
                el("h3", { text: p.titel }),
                el("p", { text: p.kurz })
            ])
        ]);
    }

    function fehler(ziel, text) {
        ziel.replaceChildren(el("p", { class: "empty", text: text }));
    }

    /* ---------- Startseite ---------- */

    /* Handy (kein Hover): Karte in der Bildschirmmitte bekommt Farbe */
    const fokusBeobachter = window.IntersectionObserver && window.matchMedia && window.matchMedia("(hover: none)").matches
        ? new IntersectionObserver(function (eintraege) {
            eintraege.forEach(function (e) { e.target.classList.toggle("im-fokus", e.isIntersecting); });
        }, { rootMargin: "-35% 0px -35% 0px" })
        : null;

    function fokusBeobachten(ziel) {
        if (!fokusBeobachter) return;
        Array.prototype.forEach.call(ziel.querySelectorAll(".card"), function (karte) { fokusBeobachter.observe(karte); });
    }

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
            fokusBeobachten(produktZiel);
        }).catch(function (e) { console.error(e); fehler(produktZiel, t("Produkte konnten nicht geladen werden.")); });

        if (projektZiel) ladeProjekte().then(function (liste) {
            projektZiel.replaceChildren.apply(projektZiel, liste.slice(0, 3).map(projektKarte));
            fokusBeobachten(projektZiel);
        }).catch(function (e) { console.error(e); fehler(projektZiel, t("Projekte konnten nicht geladen werden.")); });
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
                fehler(gitter, t("In dieser Kategorie gibt es noch keine Einträge."));
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
                text: k === "Alle" ? t("Alle") : kat(k),
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
        }).catch(function (e) { console.error(e); fehler(gitter, t("Produkte konnten nicht geladen werden.")); });
    }

    function projekteSeite() {
        const gitter = document.getElementById("projekt-liste");
        Promise.all([ladeShop(), ladeProjekte()]).then(function (r) {
            const kategorien = r[0].kategorien.slice();
            r[1].forEach(function (p) {
                if (kategorien.indexOf(p.kategorie) === -1) kategorien.push(p.kategorie);
            });
            uebersicht(r[1], kategorien, gitter, document.getElementById("filter"), projektKarte);
        }).catch(function (e) { console.error(e); fehler(gitter, t("Projekte konnten nicht geladen werden.")); });
    }

    /* ---------- Galerie ---------- */

    /* Pfeil im Stil ">" mit 120° Öffnung */
    function pfeil(richtung) {
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        const linie = document.createElementNS(ns, "polyline");
        linie.setAttribute("points", richtung > 0 ? "10,3.3 15,12 10,20.7" : "14,3.3 9,12 14,20.7");
        svg.appendChild(linie);
        return svg;
    }

    /* Galerie mit Pfeilen, Wischen, Tastatur und Vorschaubildern.
       Rückgabe: Element mit .zeige(src, markierung) zum Springen auf ein Bild.
       optionen.beiWechsel(src) meldet jeden Bildwechsel,
       optionen.markierungen[src] zeigt eine Markierung (z. B. "#06 / 20") am Bild. */
    function galerie(bilder, alt, badges, optionen) {
        optionen = optionen || {};
        const liste = bilder && bilder.length ? bilder : ["images/project-placeholder.jpg"];
        const mehrere = liste.length > 1;
        const haupt = el("img", { src: pfad(liste[0]), alt: alt, draggable: "false" });
        const markierung = el("span", { class: "exemplar-tag", hidden: true });
        const zaehler = el("span", { class: "gallery-count", "aria-live": "polite" });
        const thumbs = el("div", { class: "thumbs" });
        let index = 0;

        function anzeigen(i, text, melden) {
            index = (i + liste.length) % liste.length;
            const src = liste[index];
            if (haupt.getAttribute("src") !== pfad(src)) {
                haupt.classList.add("wechsel");
                const neu = new Image();
                neu.onload = neu.onerror = function () {
                    haupt.src = pfad(src);
                    requestAnimationFrame(function () { haupt.classList.remove("wechsel"); });
                };
                setTimeout(function () { neu.src = pfad(src); }, 120);
            }
            Array.prototype.forEach.call(thumbs.children, function (t, k) {
                t.setAttribute("aria-current", String(k === index));
            });
            const tag = text || (optionen.markierungen && optionen.markierungen[src]) || "";
            markierung.textContent = tag;
            markierung.hidden = !tag;
            zaehler.textContent = (index + 1) + " / " + liste.length;
            const thumb = thumbs.children[index];
            if (thumb && thumbs.scrollWidth > thumbs.clientWidth) {
                thumbs.scrollTo({ left: thumb.offsetLeft - thumbs.clientWidth / 2 + thumb.clientWidth / 2, behavior: "smooth" });
            }
            if (melden && optionen.beiWechsel) optionen.beiWechsel(src);
        }

        if (mehrere) {
            liste.forEach(function (src, i) {
                thumbs.appendChild(el("button", {
                    class: "thumb",
                    type: "button",
                    "data-src": src,
                    "aria-label": (optionen.beschriftung && optionen.beschriftung[src]) ||
                        (SPRACHE === "en" ? "Show image " + (i + 1) : "Bild " + (i + 1) + " anzeigen"),
                    "aria-current": i === 0 ? "true" : "false",
                    onclick: function () { anzeigen(i, null, true); }
                }, [el("img", { src: pfad(src), alt: "", loading: "lazy" })]));
            });
        }

        const buehne = el("div", { class: "gallery-main", tabindex: mehrere ? "0" : null }, [haupt, markierung].concat(badges || []));

        if (mehrere) {
            buehne.appendChild(el("button", {
                class: "gallery-arrow gallery-prev", type: "button",
                "aria-label": SPRACHE === "en" ? "Previous image" : "Vorheriges Bild",
                onclick: function () { anzeigen(index - 1, null, true); }
            }, [pfeil(-1)]));
            buehne.appendChild(el("button", {
                class: "gallery-arrow gallery-next", type: "button",
                "aria-label": SPRACHE === "en" ? "Next image" : "Nächstes Bild",
                onclick: function () { anzeigen(index + 1, null, true); }
            }, [pfeil(1)]));
            buehne.appendChild(zaehler);
            zaehler.textContent = "1 / " + liste.length;

            /* Wischen mit dem Finger */
            let startX = null, startY = null;
            buehne.addEventListener("touchstart", function (e) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });
            buehne.addEventListener("touchend", function (e) {
                if (startX === null) return;
                const dx = e.changedTouches[0].clientX - startX;
                const dy = e.changedTouches[0].clientY - startY;
                startX = null;
                if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) anzeigen(index + (dx < 0 ? 1 : -1), null, true);
            }, { passive: true });

            /* Pfeiltasten am PC */
            buehne.addEventListener("keydown", function (e) {
                if (e.key === "ArrowRight") { anzeigen(index + 1, null, true); e.preventDefault(); }
                if (e.key === "ArrowLeft") { anzeigen(index - 1, null, true); e.preventDefault(); }
            });
        }

        const wrapper = el("div", {}, [buehne, mehrere ? thumbs : null]);

        wrapper.zeige = function (src, text) {
            const i = liste.indexOf(src);
            if (i === -1) return;
            anzeigen(i, text, false);
            const box = buehne.getBoundingClientRect();
            if (box.top < 0 || box.bottom > window.innerHeight) {
                buehne.scrollIntoView({ behavior: "smooth", block: "start" });
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
        if (p.versand === "anfrage") return t("auf Anfrage, Abholung möglich");
        if (p.versand && typeof p.versand === "object") {
            return Object.keys(p.versand).map(function (zone) {
                const wert = p.versand[zone];
                return (SPRACHE === "en" ? ({ "Österreich": "Austria", "EU-Land": "EU" }[zone] || zone) : zone.replace("-Land", "")) + " " + (wert === null ? t("auf Anfrage") : preis(wert, shop.waehrung));
            }).join(" · ");
        }
        return shop.versandkosten;
    }

    /* Kompakte Auswahlliste (statt nativem Dropdown, das am Handy den ganzen Bildschirm füllt).
       Rückgabe: { element, value } – value lässt sich lesen und setzen. */
    function auswahlListe(id, eintraege, start, beiAenderung) {
        let wert = start;
        const knopfText = el("span", { class: "picker-value" });
        const knopf = el("button", {
            class: "select picker-button",
            id: id,
            type: "button",
            "aria-haspopup": "listbox",
            "aria-expanded": "false",
            "aria-labelledby": id + "-label " + id
        }, [knopfText]);
        const liste = el("ul", { class: "picker-list", role: "listbox", tabindex: "-1" });
        const daumen = el("span", { class: "picker-thumb" });
        const spur = el("span", { class: "picker-track", "aria-hidden": "true" }, [daumen]);
        const panel = el("div", { class: "picker-panel" }, [liste, spur]);
        const box = el("div", { class: "picker" }, [knopf, panel]);

        /* Eigene, immer sichtbare Scrollleiste (Android blendet die normale aus) */
        function leisteSetzen() {
            const sicht = liste.clientHeight;
            const gesamt = liste.scrollHeight;
            if (gesamt <= sicht + 1) {
                spur.hidden = true;
                return;
            }
            spur.hidden = false;
            const hoehe = Math.max(28, sicht * sicht / gesamt);
            const weg = (sicht - 16 - hoehe) * liste.scrollTop / (gesamt - sicht);
            daumen.style.height = hoehe + "px";
            daumen.style.transform = "translateY(" + weg + "px)";
        }
        liste.addEventListener("scroll", leisteSetzen, { passive: true });

        function zeichneListe() {
            liste.replaceChildren.apply(liste, eintraege.map(function (e) {
                return el("li", {
                    role: "option",
                    class: "picker-option",
                    "data-wert": e.wert,
                    "aria-selected": String(e.wert === wert),
                    "aria-disabled": e.gesperrt ? "true" : null,
                    onclick: function () {
                        if (e.gesperrt) return;
                        setze(e.wert, true);
                        schliessen();
                        knopf.focus();
                    }
                }, [el("span", { text: e.text }), e.zusatz ? el("span", { class: "picker-extra", text: e.zusatz }) : null]);
            }));
        }

        function setze(neu, melden) {
            wert = neu;
            const e = eintraege.find(function (x) { return x.wert === neu; });
            knopfText.textContent = e ? e.text : neu;
            Array.prototype.forEach.call(liste.children, function (li) {
                li.setAttribute("aria-selected", String(li.dataset.wert === neu));
            });
            if (melden) beiAenderung(neu);
        }

        function oeffnen() {
            box.classList.add("offen");
            knopf.setAttribute("aria-expanded", "true");
            const aktiv = liste.querySelector('[aria-selected="true"]');
            if (aktiv) liste.scrollTop = aktiv.offsetTop - liste.clientHeight / 2 + aktiv.clientHeight / 2;
            leisteSetzen();
            setTimeout(function () { document.addEventListener("click", aussen); }, 0);
        }

        function schliessen() {
            box.classList.remove("offen");
            knopf.setAttribute("aria-expanded", "false");
            document.removeEventListener("click", aussen);
        }

        function aussen(e) {
            if (!box.contains(e.target)) schliessen();
        }

        function blaettern(richtung) {
            const frei = eintraege.filter(function (e) { return !e.gesperrt; });
            const i = frei.findIndex(function (e) { return e.wert === wert; });
            const neu = frei[Math.max(0, Math.min(frei.length - 1, i + richtung))];
            if (neu && neu.wert !== wert) setze(neu.wert, true);
        }

        knopf.addEventListener("click", function () {
            if (box.classList.contains("offen")) schliessen(); else oeffnen();
        });
        box.addEventListener("keydown", function (e) {
            if (e.key === "Escape") { schliessen(); knopf.focus(); }
            if (e.key === "ArrowDown") { blaettern(1); e.preventDefault(); }
            if (e.key === "ArrowUp") { blaettern(-1); e.preventDefault(); }
        });

        zeichneListe();
        setze(start, false);

        return {
            element: box,
            get value() { return wert; },
            set value(neu) { setze(neu, false); }
        };
    }

    function produktSeite() {
        const ziel = document.getElementById("produkt");
        const id = param("id");

        Promise.all([ladeShop(), ladeProdukte()]).then(function (r) {
            const shop = r[0];
            const p = r[1].find(function (e) { return e.id === id; });
            if (!p) {
                ziel.replaceChildren(
                    el("p", { class: "empty", text: t("Dieses Werk gibt es nicht (mehr).") }),
                    el("a", { class: "button", href: "shop.html", text: t("Alle Werke") })
                );
                return;
            }

            document.title = p.name + " – " + MARKE;
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
            const markierungen = {};
            if (hatExemplare(p)) {
                p.exemplare.forEach(function (x) {
                    if (!x.bild) return;
                    if (bilderAlle.indexOf(x.bild) === -1) bilderAlle.push(x.bild);
                    bildZuNr[x.bild] = x;
                    markierungen[x.bild] = exemplarName(p, x.nr);
                    beschriftung[x.bild] = SPRACHE === "en" ? "Show copy " + exemplarName(p, x.nr) : "Exemplar " + exemplarName(p, x.nr) + " anzeigen";
                });
            }
            let exemplarSelect = null;
            if (hatExemplare(p) && verfuegbar(p)) {
                const frei = freieExemplare(p);
                auswahl.Exemplar = exemplarName(p, frei[0].nr);
                exemplarSelect = auswahlListe("exemplar", p.exemplare.map(function (x) {
                    return {
                        wert: exemplarName(p, x.nr),
                        text: exemplarName(p, x.nr),
                        zusatz: x.verkauft ? t(" – verkauft").replace(" – ", "") : "",
                        gesperrt: !!x.verkauft
                    };
                }), auswahl.Exemplar, function (wert) {
                    const x = p.exemplare.find(function (y) { return exemplarName(p, y.nr) === wert; });
                    auswahl.Exemplar = wert;
                    hinweis.textContent = "";
                    if (x && x.bild && galerieEl) galerieEl.zeige(x.bild, exemplarName(p, x.nr));
                });
                felder.unshift(el("div", { class: "field" }, [
                    el("label", { id: "exemplar-label", for: "exemplar", text: t("Exemplar wählen") }),
                    exemplarSelect.element
                ]));
            }

            const kaufBereich = el("div", { class: "buy-area" });
            const hinweis = el("p", { class: "buy-hint", "aria-live": "polite" });
            const anfrageLink = "mailto:" + shop.email + "?subject=" + encodeURIComponent(t("Anfrage zu: ") + p.name);

            function imKorb() {
                return korbLesen().filter(function (e) { return e.id === p.id; })
                    .reduce(function (s, e) { return s + e.menge; }, 0);
            }

            if (!verfuegbar(p)) {
                kaufBereich.replaceChildren(el("a", {
                    class: "button button-block",
                    href: anfrageLink,
                    text: t("Ähnliches Werk anfragen")
                }));
                hinweis.textContent = t("Dieses Werk ist bereits verkauft.");
            } else {
                kaufBereich.replaceChildren(
                    el("button", {
                        class: "button button-primary button-block",
                        type: "button",
                        text: t("In den Warenkorb"),
                        onclick: function () {
                            if (hatExemplare(p) && korbLesen().some(function (e) {
                                return e.id === p.id && e.varianten && e.varianten.Exemplar === auswahl.Exemplar;
                            })) {
                                hinweis.replaceChildren(
                                    t("Exemplar ") + auswahl.Exemplar + t(" liegt schon im Warenkorb. "),
                                    el("a", { href: "warenkorb.html", text: t("Zum Warenkorb →") })
                                );
                                return;
                            }
                            if (imKorb() >= bestand(p)) {
                                hinweis.replaceChildren(
                                    istUnikat(p) ? t("Dieses Unikat liegt schon im Warenkorb. ") : t("Alle verfügbaren Exemplare liegen schon im Warenkorb. "),
                                    el("a", { href: "warenkorb.html", text: t("Zum Warenkorb →") })
                                );
                                return;
                            }
                            korbHinzufuegen(p.id, Object.assign({}, auswahl), 1);
                            hinweis.replaceChildren(
                                t("✓ Im Warenkorb · "),
                                el("a", { href: "warenkorb.html", text: t("Zum Warenkorb →") })
                            );
                        }
                    }),
                    el("a", { class: "button button-block", href: anfrageLink, text: t("Frage zum Werk") })
                );
            }

            const badges = [];
            if (!verfuegbar(p)) badges.push(el("span", { class: "badge", text: t("Verkauft") }));
            if (p.beispiel) badges.push(el("span", { class: "badge badge-muted", text: t("Beispiel") }));

            const fakten = [
                p.jahr ? [t("Jahr"), p.jahr] : null,
                p.technik ? [t("Technik / Material"), p.technik] : null,
                p.masse ? [t("Maße"), p.masse] : null,
                p.gewicht ? [t("Gewicht"), p.gewicht] : null,
                [t("Auflage"), auflageText(p)],
                [t("Verfügbarkeit"), verfuegbarText(p)],
                p.signiert ? [t("Signatur"), p.signiert] : null,
                p.zertifikat ? [t("Echtheitszertifikat"), t("liegt bei")] : null,
                p.pflege ? [t("Pflege"), p.pflege] : null,
                verfuegbar(p) ? [t("Lieferzeit"), shop.lieferzeit] : null,
                verfuegbar(p) ? [t("Versand"), versandText(p, shop)] : null
            ].filter(Boolean);

            ziel.replaceChildren(
                el("nav", { class: "breadcrumb", "aria-label": t("Brotkrümel") }, [
                    el("a", { href: "shop.html", text: t("Werke") }), " / ",
                    el("a", { href: "shop.html?kategorie=" + encodeURIComponent(p.kategorie), text: kat(p.kategorie) }), " / ",
                    el("span", { text: p.name })
                ]),
                el("div", { class: "detail" }, [
                    (galerieEl = galerie(bilderAlle, p.name, badges, {
                        beschriftung: beschriftung,
                        markierungen: markierungen,
                        beiWechsel: function (src) {
                            const x = bildZuNr[src];
                            if (x && !x.verkauft && exemplarSelect) {
                                exemplarSelect.value = exemplarName(p, x.nr);
                                auswahl.Exemplar = exemplarSelect.value;
                            }
                        }
                    })),
                    el("div", { class: "detail-info" }, [
                        el("span", { class: "card-kicker", text: kat(p.kategorie) + (p.jahr ? " · " + p.jahr : "") }),
                        el("h1", { text: p.name }),
                        el("p", { class: "price", text: verfuegbar(p) ? preis(p.preis, shop.waehrung) : t("Verkauft") }),
                        verfuegbar(p) ? el("p", { class: "price-note" }, [
                            shop.preishinweis, " · ",
                            el("a", { href: "versand.html", text: t("Versand & Zahlung") })
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
                            el("h2", { text: t("Hinweise") }),
                            el("p", { text: p.hinweise })
                        ]) : null,
                        el("p", { class: "maker" }, [
                            el("span", { text: t("Künstler: ") }), shop.hersteller || ""
                        ]),
                        verfuegbar(p) ? el("p", { class: "maker" }, [
                            t("14 Tage Widerrufsrecht. "),
                            el("a", { href: "widerruf.html", text: t("Widerrufsbelehrung") })
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
        }).catch(function (e) { console.error(e); fehler(ziel, t("Werk konnte nicht geladen werden.")); });
    }

    /* ---------- Projektdetail ---------- */

    function projektSeite() {
        const ziel = document.getElementById("projekt");
        const id = param("id");

        Promise.all([ladeProjekte(), ladeProdukte()]).then(function (r) {
            const p = r[0].find(function (e) { return e.id === id; });
            if (!p) {
                ziel.replaceChildren(
                    el("p", { class: "empty", text: t("Dieses Projekt gibt es nicht (mehr).") }),
                    el("a", { class: "button", href: "projekte.html", text: t("Alle Projekte") })
                );
                return;
            }
            document.title = p.titel + t(" – L057 Projekte");
            const produkt = p.produkt && r[1].find(function (e) { return e.id === p.produkt; });
            const badges = p.beispiel ? [el("span", { class: "badge badge-muted", text: t("Beispiel") })] : [];

            ziel.replaceChildren(
                el("nav", { class: "breadcrumb", "aria-label": t("Brotkrümel") }, [
                    el("a", { href: "projekte.html", text: t("Projekte") }), " / ",
                    el("span", { text: p.titel })
                ]),
                el("article", { class: "project-body" }, [
                    el("p", { class: "project-meta", text: kat(p.kategorie) + (p.jahr ? " · " + p.jahr : "") }),
                    el("h1", { text: p.titel }),
                    galerie(p.bilder, p.titel, badges),
                    el("div", { class: "description" }, absaetze(p.text)),
                    produkt ? el("div", { class: "button-group", style: "justify-content:flex-start" }, [
                        el("a", {
                            class: "button button-primary",
                            href: "produkt.html?id=" + encodeURIComponent(produkt.id),
                            text: t("Im Shop ansehen")
                        })
                    ]) : null
                ])
            );
        }).catch(function (e) { console.error(e); fehler(ziel, t("Projekt konnte nicht geladen werden.")); });
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
                return Object.keys(v || {}).map(function (k) { return (k === "Exemplar" ? t("Exemplar ").trim() : k) + ": " + v[k]; }).join(", ");
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
                    anfrage: anfrage, zone: zoneName(zone), gesamt: zwischensumme + versand
                };
            }

            function bestelltext(liste, summe) {
                const zeilen = liste.map(function (x) {
                    const v = variantenText(x.eintrag.varianten);
                    return "• " + x.eintrag.menge + " × " + x.produkt.name + (v ? " (" + v + ")" : "") +
                        " – " + preis(x.produkt.preis * x.eintrag.menge, shop.waehrung);
                });
                return [
                    t("Hallo,"),
                    "",
                    t("ich möchte folgendes bestellen:"),
                    "",
                    zeilen.join("\n"),
                    "",
                    t("Zwischensumme: ") + preis(summe.zwischensumme, shop.waehrung),
                    summe.physisch ? (summe.abholung ? t("Lieferung: ") : t("Lieferland: ")) + summe.zone : null,
                    summe.physisch ? t("Versand: ") + (summe.abholung ? t("keiner (Abholung)") : summe.anfrage ? t("bitte um Angebot") : preis(summe.versand, shop.waehrung)) : null,
                    t("Gesamt: ") + preis(summe.gesamt, shop.waehrung) + (summe.anfrage ? t(" zzgl. Versand") : ""),
                    t("Zahlung: ") + (formular.zahlung || (shop.zahlungsarten || [""])[0]),
                    "",
                    t("Name: ") + (formular.name || ""),
                    summe.physisch && !summe.abholung ? t("Lieferadresse:\n") + (formular.adresse || "") : null,
                    summe.abholung ? t("Telefon / Kontakt für die Abholung: ") + (formular.adresse || "") : null,
                    formular.notiz ? t("\nAnmerkung:\n") + formular.notiz : null,
                    formular.agb ? t("\nAGB und Widerrufsbelehrung gelesen: ja") : null,
                    "",
                    t("Danke!")
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
                        el("header", { class: "page-head" }, [el("h1", { text: t("Warenkorb") })]),
                        el("p", { class: "empty", text: t("Dein Warenkorb ist leer.") }),
                        el("a", { class: "button", href: "shop.html", text: t("Zum Shop") })
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
                            el("span", { class: "cart-variant", text: auflageText(x.produkt) + " · " + preis(x.produkt.preis, shop.waehrung) + (istUnikat(x.produkt) ? "" : t(" / Exemplar")) }),
                            el("div", { class: "qty" }, [
                                el("button", { type: "button", "aria-label": t("Eins weniger"), text: "−", onclick: function () { menge(i, x.eintrag.menge - 1); } }),
                                el("span", { "aria-live": "polite", text: String(x.eintrag.menge) }),
                                el("button", {
                                    type: "button", "aria-label": t("Eins mehr"), text: "+",
                                    disabled: hatExemplare(x.produkt) || korbLesen().filter(function (e) { return e.id === x.produkt.id; })
                                        .reduce(function (s, e) { return s + e.menge; }, 0) >= bestand(x.produkt),
                                    onclick: function () { menge(i, x.eintrag.menge + 1); }
                                }),
                                el("button", { type: "button", class: "cart-remove", text: t("Entfernen"), onclick: function () { menge(i, 0); } })
                            ])
                        ]),
                        el("span", { class: "cart-line-price", text: preis(x.produkt.preis * x.eintrag.menge, shop.waehrung) })
                    ]);
                });

                function summenZeile(label, wert, stark) {
                    return el("li", { class: stark ? "total" : null }, [el("span", { text: label }), el("span", { text: wert })]);
                }

                const versandText = !summe.physisch ? null :
                    (summe.abholung ? t("Abholung") : summe.anfrage ? t("auf Anfrage") : (summe.versand === 0 ? "kostenlos" : preis(summe.versand, shop.waehrung)));

                function auswahlFeld(name, label, optionen, onchange) {
                    const id = "feld-" + name;
                    const sel = el("select", { class: "select", id: id, onchange: onchange },
                        optionen.map(function (o, i) { return el("option", { value: String(i), text: o }); }));
                    return { feld: el("div", { class: "field" }, [el("label", { for: id, text: label }), sel]), select: sel };
                }

                const landWahl = summe.physisch && (shop.versandzonen || []).length ? auswahlFeld(
                    "zone", t("Lieferland"),
                    shop.versandzonen.map(function (z) {
                        return zoneName(z) + (z.preis === null ? "" : " – " + preis(z.preis, shop.waehrung));
                    }),
                    function (e) { formular.zone = Number(e.target.value); zeichnen(); }
                ) : null;
                if (landWahl) landWahl.select.value = String(formular.zone || 0);

                const zahlWahl = (shop.zahlungsarten || []).length > 1 ? auswahlFeld(
                    "zahlung", t("Zahlungsart"), shop.zahlungsarten,
                    function (e) { formular.zahlung = shop.zahlungsarten[Number(e.target.value)]; }
                ) : null;
                if (zahlWahl) zahlWahl.select.value = String(Math.max(0, shop.zahlungsarten.indexOf(formular.zahlung)));

                function absenden() {
                    if (!formular.name || (summe.physisch && !summe.abholung && !formular.adresse)) {
                        status.textContent = summe.physisch
                            ? t("Bitte Name und Lieferadresse ausfüllen.")
                            : t("Bitte deinen Namen ausfüllen.");
                        return;
                    }
                    if (!formular.agb) {
                        status.textContent = t("Bitte bestätige, dass du AGB und Widerrufsbelehrung gelesen hast.");
                        return;
                    }
                    const betreff = t("Bestellung über ") + WEBSITE + " (" + preis(summe.gesamt, shop.waehrung) + ")";
                    window.location.href = "mailto:" + shop.email +
                        "?subject=" + encodeURIComponent(betreff) +
                        "&body=" + encodeURIComponent(bestelltext(liste, summe));
                    status.textContent = t("Dein Mailprogramm öffnet sich. Bitte die Mail dort noch absenden.");
                }

                function kopieren() {
                    const text = t("An: ") + shop.email + "\n\n" + bestelltext(liste, summe);
                    const ok = function () { status.textContent = t("Bestellung kopiert. Füge sie in eine Mail an ") + shop.email + t(" ein."); };
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text).then(ok, function () {
                            status.textContent = t("Kopieren nicht möglich. Bitte schreib an ") + shop.email + ".";
                        });
                    } else {
                        status.textContent = t("Kopieren nicht möglich. Bitte schreib an ") + shop.email + ".";
                    }
                }

                ziel.replaceChildren(
                    el("header", { class: "page-head" }, [el("h1", { text: t("Warenkorb") })]),
                    el("div", { class: "cart" }, [
                        el("ul", { class: "cart-list" }, zeilen),
                        el("aside", { class: "cart-summary" }, [
                            el("h2", { text: t("Bestellung") }),
                            el("ul", { class: "facts" }, [
                                summenZeile(t("Zwischensumme"), preis(summe.zwischensumme, shop.waehrung)),
                                versandText ? summenZeile(t("Versand"), versandText) : null,
                                summenZeile(t("Gesamt"), preis(summe.gesamt, shop.waehrung) + (summe.anfrage ? t(" + Versand") : ""), true)
                            ]),
                            el("p", { class: "price-note", style: "margin-top:10px" }, [
                                (shop.steuerhinweis || "") + " ",
                                summe.physisch ? el("a", { href: "versand.html", text: t("Versand & Zahlung") }) : null
                            ]),
                            el("form", {
                                class: "cart-form",
                                novalidate: true,
                                onsubmit: function (e) { e.preventDefault(); absenden(); }
                            }, [
                                landWahl ? landWahl.feld : null,
                                eingabe("name", t("Name"), false, true),
                                summe.physisch ? eingabe("adresse", summe.abholung ? t("Telefon oder Hinweis zur Abholung (optional)") : t("Lieferadresse"), true, !summe.abholung) : null,
                                zahlWahl ? zahlWahl.feld : null,
                                eingabe("notiz", t("Anmerkung (optional)"), true, false),
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
                                        t("Ich habe die "),
                                        el("a", { href: "agb.html", target: "_blank", text: t("AGB") }),
                                        t(" und die "),
                                        el("a", { href: "widerruf.html", target: "_blank", text: t("Widerrufsbelehrung") }),
                                        t(" gelesen.")
                                    ])
                                ]),
                                el("button", { class: "button button-primary button-block", type: "submit", text: t("Bestellung per E-Mail senden") }),
                                el("button", { class: "button button-block", type: "button", style: "margin-top:10px", text: t("Bestellung kopieren"), onclick: kopieren })
                            ]),
                            status,
                            el("p", { class: "buy-hint" }, [
                                t("Du bekommst eine Bestätigung mit den Zahlungsinfos per E-Mail. Erst damit ist die Bestellung verbindlich.")
                            ])
                        ])
                    ])
                );
            }

            zeichnen();
        }).catch(function (e) { console.error(e); fehler(ziel, t("Warenkorb konnte nicht geladen werden.")); });
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
                t("Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über den Kauf der folgenden Waren:"),
                "",
                w.artikel || t("(alle Artikel der Bestellung)"),
                "",
                t("Bestellt am / Bestellung: ") + w.bestellung,
                t("Erhalten am: ") + (w.erhalten || "-"),
                t("Name: ") + w.name,
                t("E-Mail: ") + w.email,
                t("Datum der Erklärung: ") + new Date().toLocaleDateString(SPRACHE === "en" ? "en-GB" : "de-AT")
            ].join("\n");
        }

        ladeShop().then(function (shop) {
            form.addEventListener("submit", function (e) {
                e.preventDefault();
                const w = werte();
                if (!w.name || !w.email || !w.bestellung) {
                    status.textContent = t("Bitte Name, E-Mail und Bestellung (Datum oder Nummer) angeben.");
                    return;
                }
                window.location.href = "mailto:" + shop.email +
                    "?subject=" + encodeURIComponent(t("Vertrag widerrufen – ") + w.name + " (" + w.bestellung + ")") +
                    "&body=" + encodeURIComponent(text(w));
                status.textContent = t("Dein Mailprogramm öffnet sich mit der fertigen Widerrufserklärung. ") +
                    t("Bitte sende die Mail ab. Du bekommst eine Eingangsbestätigung per E-Mail.");
            });

            document.getElementById("widerruf-kopieren").addEventListener("click", function () {
                const w = werte();
                const fertig = t("An: ") + shop.email + t("\nBetreff: Vertrag widerrufen\n\n") + text(w);
                const fehlt = function () {
                    status.textContent = t("Kopieren nicht möglich. Bitte schreib an ") + shop.email + ".";
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(fertig).then(function () {
                        status.textContent = t("Widerrufserklärung kopiert. Füge sie in eine Mail an ") + shop.email + t(" ein.");
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

    /* Sprachschalter: gleiche Seite in der anderen Sprache, Auswahl merken */
    document.querySelectorAll("[data-lang-switch]").forEach(function (link) {
        link.href = link.getAttribute("href") + window.location.search + window.location.hash;
        link.addEventListener("click", function () {
            try {
                localStorage.setItem("l057-sprache", link.dataset.langSwitch);
            } catch (e) { /* ohne Speicher gilt die Wahl nur für diesen Besuch */ }
        });
    });

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
