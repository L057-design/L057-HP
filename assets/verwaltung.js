/* ==========================================================
   L057 – Verwaltung
   Werke, Projekte und Einstellungen bearbeiten, Fotos hochladen.
   Daten: data/produkte.json, data/projekte.json, data/shop.json
   Gespeichert wird alles zusammen als ein Commit im GitHub-Repository.
   Der Zugangsschlüssel (GitHub-Token) bleibt nur in diesem Browser.
   ========================================================== */

(function () {
    "use strict";

    const REPO = "L057-design/L057-HP";
    const DATEIEN = {
        werke: "data/produkte.json",
        projekte: "data/projekte.json",
        shop: "data/shop.json"
    };
    const BILD_ORDNER = { werke: "images/werke/", projekte: "images/projekte/" };
    const SPEICHER = "l057-verwaltung";
    const MAX_BILD = 1600;

    const root = document.getElementById("verwaltung");
    let einstellungen = ladeEinstellungen();

    let daten = { werke: [], projekte: [], shop: {} };
    let original = { werke: "", projekte: "", shop: "" };
    let dateiSha = { werke: "", projekte: "", shop: "" };
    let uploads = {};            /* Pfad -> { base64, url } */
    let protokoll = [];          /* Beschreibung der Änderungen für den Commit */
    let ansicht = { tab: "werke", bearbeiten: null };
    let leiste = null;
    let statusZeile = null;

    /* ---------- Allgemeine Hilfen ---------- */

    function ladeEinstellungen() {
        try {
            return JSON.parse(localStorage.getItem(SPEICHER) || "{}");
        } catch (e) {
            return {};
        }
    }

    function sichereEinstellungen() {
        try {
            localStorage.setItem(SPEICHER, JSON.stringify(einstellungen));
        } catch (e) { /* ohne Speicher muss der Schlüssel jedes Mal eingegeben werden */ }
    }

    function el(tag, attrs, kinder) {
        const node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (k) {
            const v = attrs[k];
            if (v === null || v === undefined || v === false) return;
            if (k === "text") node.textContent = v;
            else if (k === "class") node.className = v;
            else if (k === "value") node.value = v;
            else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
            else node.setAttribute(k, v === true ? "" : v);
        });
        (kinder || []).forEach(function (kind) {
            if (kind) node.appendChild(typeof kind === "string" ? document.createTextNode(kind) : kind);
        });
        return node;
    }

    function base64Decode(text) {
        const bin = atob(text.replace(/\s/g, ""));
        return new TextDecoder().decode(Uint8Array.from(bin, function (c) { return c.charCodeAt(0); }));
    }

    function json(wert) {
        return JSON.stringify(wert, null, 2) + "\n";
    }

    function kopie(wert) {
        return JSON.parse(JSON.stringify(wert));
    }

    function slug(text) {
        return String(text || "")
            .toLowerCase()
            .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
            .normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 50) || "werk";
    }

    function eindeutigeId(basis, liste, ausser) {
        let id = basis;
        let n = 2;
        while (liste.some(function (e) { return e !== ausser && e.id === id; })) {
            id = basis + "-" + n++;
        }
        return id;
    }

    function preis(betrag) {
        return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(betrag || 0);
    }

    function nummer(n) {
        return "#" + String(n).padStart(2, "0");
    }

    function istUnikat(w) {
        return !w.auflage || w.auflage === "Unikat" || w.auflage === 1;
    }

    function hatExemplare(w) {
        return Array.isArray(w.exemplare) && w.exemplare.length > 0;
    }

    function bestand(w) {
        if (hatExemplare(w)) return w.exemplare.filter(function (x) { return !x.verkauft; }).length;
        return typeof w.bestand === "number" ? w.bestand : (w.verfuegbar ? 1 : 0);
    }

    function titel(e) {
        return e.name || e.titel || "(ohne Titel)";
    }

    function bildUrl(pfad) {
        if (!pfad) return "images/project-placeholder.jpg";
        if (uploads[pfad]) return uploads[pfad].url;
        if (/^https?:/.test(pfad)) return pfad;
        return "https://raw.githubusercontent.com/" + REPO + "/" +
            encodeURIComponent(einstellungen.branch || "main") + "/" + pfad.split("/").map(encodeURIComponent).join("/");
    }

    function notiere(text) {
        if (protokoll.indexOf(text) === -1) protokoll.push(text);
        leisteAktualisieren();
        if (statusZeile) statusZeile.textContent = "";
    }

    function geaendert() {
        return Object.keys(DATEIEN).some(function (k) { return json(daten[k]) !== original[k]; }) ||
            Object.keys(uploads).length > 0;
    }

    /* ---------- GitHub ---------- */

    function api(pfad, optionen) {
        optionen = optionen || {};
        return fetch("https://api.github.com/repos/" + REPO + pfad, {
            method: optionen.method || "GET",
            cache: "no-store",
            headers: Object.assign({
                "Accept": "application/vnd.github+json",
                "Authorization": "Bearer " + einstellungen.token,
                "X-GitHub-Api-Version": "2022-11-28"
            }, optionen.body ? { "Content-Type": "application/json" } : {}),
            body: optionen.body ? JSON.stringify(optionen.body) : undefined
        }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (antwort) {
                if (!r.ok) {
                    const fehler = new Error(antwort.message || ("Fehler " + r.status));
                    fehler.status = r.status;
                    throw fehler;
                }
                return antwort;
            });
        });
    }

    function branch() {
        return einstellungen.branch || "main";
    }

    function dateiLaden(pfad) {
        return api("/contents/" + pfad + "?ref=" + encodeURIComponent(branch()));
    }

    /* ---------- Fotos verkleinern ---------- */

    function bildLaden(datei) {
        if (window.createImageBitmap) {
            return createImageBitmap(datei, { imageOrientation: "from-image" }).catch(function () {
                return bildPerElement(datei);
            });
        }
        return bildPerElement(datei);
    }

    function bildPerElement(datei) {
        return new Promise(function (ok, fehler) {
            const url = URL.createObjectURL(datei);
            const img = new Image();
            img.onload = function () { ok(img); };
            img.onerror = function () { fehler(new Error("Bild konnte nicht gelesen werden")); };
            img.src = url;
        });
    }

    function verkleinern(datei) {
        return bildLaden(datei).then(function (bild) {
            const b = bild.width;
            const h = bild.height;
            const faktor = Math.min(1, MAX_BILD / Math.max(b, h));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(b * faktor);
            canvas.height = Math.round(h * faktor);
            canvas.getContext("2d").drawImage(bild, 0, 0, canvas.width, canvas.height);
            return new Promise(function (ok) {
                canvas.toBlob(ok, "image/jpeg", 0.82);
            });
        }).then(function (blob) {
            return new Promise(function (ok) {
                const leser = new FileReader();
                leser.onload = function () {
                    ok({ base64: String(leser.result).split(",")[1], url: URL.createObjectURL(blob) });
                };
                leser.readAsDataURL(blob);
            });
        });
    }

    function fotosHinzufuegen(dateien, ordner, basisName) {
        const liste = Array.prototype.slice.call(dateien || []);
        const stempel = Date.now().toString(36);
        return Promise.all(liste.map(function (datei, i) {
            return verkleinern(datei).then(function (ergebnis) {
                const pfad = ordner + basisName + "-" + stempel + "-" + (i + 1) + ".jpg";
                uploads[pfad] = ergebnis;
                return pfad;
            });
        }));
    }

    function fotoKnopf(text, mehrere, beiAuswahl) {
        const eingabe = el("input", {
            type: "file",
            accept: "image/*",
            multiple: mehrere,
            class: "sr-only",
            onchange: function (e) {
                const dateien = e.target.files;
                if (!dateien || !dateien.length) return;
                knopf.textContent = "Verarbeite …";
                beiAuswahl(dateien).catch(function (fehler) {
                    window.alert("Foto konnte nicht verarbeitet werden: " + fehler.message);
                }).then(function () { knopf.textContent = text; });
                e.target.value = "";
            }
        });
        const knopf = el("span", { text: text });
        return el("label", { class: "button admin-upload" }, [eingabe, knopf]);
    }

    /* ---------- Anmeldung ---------- */

    function anmeldung(meldung) {
        const token = el("input", { class: "input", id: "token", type: "password", autocomplete: "off", placeholder: "github_pat_…" });
        const branchFeld = el("input", { class: "input", id: "branch", value: einstellungen.branch || "main" });
        const status = el("p", { class: "buy-hint", "aria-live": "polite", text: meldung || "" });

        root.replaceChildren(
            el("header", { class: "page-head" }, [
                el("h1", { text: "Verwaltung" }),
                el("p", { text: "Werke, Projekte und Einstellungen bearbeiten, Fotos hochladen. Änderungen werden auf GitHub gespeichert und sind nach wenigen Minuten online." })
            ]),
            el("form", {
                class: "withdraw-form admin-login",
                onsubmit: function (e) {
                    e.preventDefault();
                    einstellungen.token = token.value.trim();
                    einstellungen.branch = branchFeld.value.trim() || "main";
                    if (!einstellungen.token) {
                        status.textContent = "Bitte den Schlüssel eingeben.";
                        return;
                    }
                    sichereEinstellungen();
                    start();
                }
            }, [
                el("div", { class: "field" }, [el("label", { for: "token", text: "GitHub-Schlüssel (Token)" }), token]),
                el("div", { class: "field" }, [el("label", { for: "branch", text: "Branch" }), branchFeld]),
                el("button", { class: "button button-primary button-block", type: "submit", text: "Anmelden" }),
                status
            ]),
            el("details", { class: "admin-help" }, [
                el("summary", { text: "Wie bekomme ich einen Schlüssel?" }),
                el("ol", {}, [
                    el("li", { text: "Auf github.com einloggen → Profilbild → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token." }),
                    el("li", { text: "Name z. B. „L057 Verwaltung“, Ablaufdatum wählen (z. B. 1 Jahr)." }),
                    el("li", { text: "Repository access: Only select repositories → L057-design/L057-HP." }),
                    el("li", { text: "Permissions → Repository permissions → Contents: Read and write. Sonst nichts." }),
                    el("li", { text: "Generate token, den Schlüssel kopieren und hier einfügen. Er wird nur in diesem Browser gespeichert." })
                ])
            ])
        );
    }

    /* ---------- Laden ---------- */

    function start() {
        if (!einstellungen.token) {
            anmeldung();
            return;
        }
        root.replaceChildren(el("p", { class: "empty", text: "Lade Daten …" }));
        const schluessel = Object.keys(DATEIEN);
        Promise.all(schluessel.map(function (k) { return dateiLaden(DATEIEN[k]); }))
            .then(function (antworten) {
                schluessel.forEach(function (k, i) {
                    dateiSha[k] = antworten[i].sha;
                    original[k] = base64Decode(antworten[i].content);
                    daten[k] = JSON.parse(original[k]);
                    original[k] = json(daten[k]);
                });
                Object.keys(uploads).forEach(function (p) { URL.revokeObjectURL(uploads[p].url); });
                uploads = {};
                protokoll = [];
                ansicht.bearbeiten = null;
                zeichnen();
            })
            .catch(function (e) {
                if (e.status === 401 || e.status === 403) {
                    delete einstellungen.token;
                    sichereEinstellungen();
                    anmeldung("Der Schlüssel wurde nicht akzeptiert. Bitte prüfe ihn und die Berechtigung „Contents: Read and write“.");
                } else if (e.status === 404) {
                    anmeldung("Daten oder Branch nicht gefunden. Stimmt der Branch?");
                } else {
                    anmeldung("Laden fehlgeschlagen: " + e.message);
                }
            });
    }

    /* ---------- Rahmen: Kopf, Tabs, Speicherleiste ---------- */

    function leisteAktualisieren() {
        if (!leiste) return;
        const offen = geaendert();
        leiste.replaceChildren(
            el("span", { text: offen ? "Ungespeicherte Änderungen" : "Alles gespeichert" }),
            el("button", {
                class: "button button-primary",
                type: "button",
                disabled: !offen,
                text: "Speichern",
                onclick: speichern
            })
        );
        leiste.classList.toggle("admin-bar-dirty", offen);
    }

    function zeichnen() {
        leiste = el("div", { class: "admin-bar" });
        statusZeile = statusZeile || el("p", { class: "buy-hint admin-status-line", "aria-live": "polite" });

        const tabs = el("nav", { class: "filters admin-tabs", "aria-label": "Bereiche" }, [
            ["werke", "Werke (" + daten.werke.length + ")"],
            ["projekte", "Projekte (" + daten.projekte.length + ")"],
            ["shop", "Einstellungen"]
        ].map(function (t) {
            return el("button", {
                class: "filter",
                type: "button",
                "aria-pressed": String(ansicht.tab === t[0]),
                text: t[1],
                onclick: function () {
                    ansicht = { tab: t[0], bearbeiten: null };
                    zeichnen();
                    window.scrollTo(0, 0);
                }
            });
        }));

        let inhalt;
        if (ansicht.bearbeiten) inhalt = editor();
        else if (ansicht.tab === "werke") inhalt = werkListe();
        else if (ansicht.tab === "projekte") inhalt = projektListe();
        else inhalt = shopEditor();

        root.replaceChildren(
            el("header", { class: "page-head" }, [
                el("h1", { text: "Verwaltung" }),
                el("p", {}, [
                    "Branch „" + branch() + "“ · ",
                    el("a", { href: "#", text: "Neu laden", onclick: function (e) {
                        e.preventDefault();
                        if (geaendert() && !window.confirm("Ungespeicherte Änderungen verwerfen und neu laden?")) return;
                        start();
                    } }),
                    " · ",
                    el("a", { href: "#", text: "Abmelden", onclick: function (e) {
                        e.preventDefault();
                        if (geaendert() && !window.confirm("Ungespeicherte Änderungen verwerfen?")) return;
                        einstellungen = { branch: einstellungen.branch };
                        sichereEinstellungen();
                        anmeldung("Abgemeldet.");
                    } })
                ])
            ]),
            leiste,
            statusZeile,
            tabs,
            inhalt
        );
        leisteAktualisieren();
    }

    function verschieben(liste, index, richtung, name) {
        const ziel = index + richtung;
        if (ziel < 0 || ziel >= liste.length) return;
        const eintrag = liste.splice(index, 1)[0];
        liste.splice(ziel, 0, eintrag);
        notiere(name + ": Reihenfolge geändert");
        zeichnen();
    }

    function sortierKnoepfe(liste, index, name) {
        return el("div", { class: "admin-sort" }, [
            el("button", { type: "button", class: "admin-mini", "aria-label": "Nach oben", text: "↑", disabled: index === 0,
                onclick: function () { verschieben(liste, index, -1, name); } }),
            el("button", { type: "button", class: "admin-mini", "aria-label": "Nach unten", text: "↓", disabled: index === liste.length - 1,
                onclick: function () { verschieben(liste, index, 1, name); } })
        ]);
    }

    /* ---------- Werke: Liste mit Schnellbearbeitung ---------- */

    function werkListe() {
        return el("div", {}, [
            el("button", {
                class: "button button-primary admin-new",
                type: "button",
                text: "+ Neues Werk",
                onclick: function () {
                    const neu = {
                        id: "", name: "", kategorie: (daten.shop.kategorien || [""])[0], jahr: String(new Date().getFullYear()),
                        kurz: "", technik: "", masse: "", auflage: "Unikat", bestand: 1, preis: 0,
                        signiert: "Signiert", zertifikat: true, beschreibung: [], bilder: [], hervorgehoben: true
                    };
                    daten.werke.unshift(neu);
                    ansicht.bearbeiten = { typ: "werke", eintrag: neu, neu: true };
                    zeichnen();
                    window.scrollTo(0, 0);
                }
            }),
            el("div", { class: "admin-list" }, daten.werke.map(function (w, i) { return werkKarte(w, i); }))
        ]);
    }

    function werkKarte(w, index) {
        const statusText = el("span", { class: "admin-status" });

        function statusAktualisieren() {
            const n = bestand(w);
            statusText.textContent = n === 0 ? "Verkauft" : istUnikat(w) ? "Verfügbar" : n + " von " + w.auflage + " verfügbar";
            statusText.classList.toggle("admin-status-sold", n === 0);
        }

        const steuerung = [];
        if (hatExemplare(w)) {
            steuerung.push(el("p", { class: "admin-label", text: "Exemplare – antippen zum Umschalten (durchgestrichen = verkauft)" }));
            steuerung.push(el("div", { class: "admin-chips" }, w.exemplare.map(function (x) {
                const chip = el("button", {
                    type: "button",
                    class: "admin-chip",
                    "aria-pressed": String(!!x.verkauft),
                    text: nummer(x.nr),
                    onclick: function () {
                        x.verkauft = !x.verkauft;
                        chip.setAttribute("aria-pressed", String(x.verkauft));
                        statusAktualisieren();
                        notiere(titel(w) + ": Verfügbarkeit");
                    }
                });
                return chip;
            })));
        } else if (istUnikat(w)) {
            const schalter = el("input", {
                type: "checkbox",
                onchange: function (e) {
                    w.bestand = e.target.checked ? 0 : 1;
                    delete w.verfuegbar;
                    statusAktualisieren();
                    notiere(titel(w) + ": " + (e.target.checked ? "verkauft" : "verfügbar"));
                }
            });
            schalter.checked = bestand(w) === 0;
            steuerung.push(el("label", { class: "check admin-toggle" }, [schalter, el("span", { text: "Verkauft" })]));
        } else {
            const anzeige = el("span", { class: "admin-count" });
            const setze = function (n) {
                w.bestand = Math.max(0, Math.min(Number(w.auflage) || 99, n));
                delete w.verfuegbar;
                anzeige.textContent = w.bestand + " verfügbar";
                statusAktualisieren();
                notiere(titel(w) + ": Bestand");
            };
            anzeige.textContent = bestand(w) + " verfügbar";
            steuerung.push(el("div", { class: "qty" }, [
                el("button", { type: "button", "aria-label": "Einer weniger", text: "−", onclick: function () { setze(bestand(w) - 1); } }),
                anzeige,
                el("button", { type: "button", "aria-label": "Einer mehr", text: "+", onclick: function () { setze(bestand(w) + 1); } })
            ]));
        }
        statusAktualisieren();

        return el("article", { class: "admin-card" }, [
            el("img", { class: "admin-thumb", src: bildUrl(w.bilder && w.bilder[0]), alt: "", loading: "lazy" }),
            el("div", { class: "admin-body" }, [
                el("div", { class: "admin-head" }, [
                    el("div", {}, [
                        el("h2", { text: titel(w) }),
                        el("span", { class: "admin-meta", text: (w.kategorie || "–") + " · " + (istUnikat(w) ? "Unikat" : "Auflage " + w.auflage) + " · " + preis(w.preis) })
                    ]),
                    statusText
                ]),
                el("div", {}, steuerung),
                el("div", { class: "admin-row" }, [
                    el("button", { class: "button admin-edit", type: "button", text: "Bearbeiten", onclick: function () {
                        ansicht.bearbeiten = { typ: "werke", eintrag: w };
                        zeichnen();
                        window.scrollTo(0, 0);
                    } }),
                    sortierKnoepfe(daten.werke, index, titel(w)),
                    el("a", { class: "admin-link", href: "produkt.html?id=" + encodeURIComponent(w.id), target: "_blank", text: "Ansehen ↗" })
                ])
            ])
        ]);
    }

    /* ---------- Projekte: Liste ---------- */

    function projektListe() {
        return el("div", {}, [
            el("button", {
                class: "button button-primary admin-new",
                type: "button",
                text: "+ Neues Projekt",
                onclick: function () {
                    const neu = { id: "", titel: "", kategorie: "", jahr: String(new Date().getFullYear()), kurz: "", text: [], bilder: [], produkt: "" };
                    daten.projekte.unshift(neu);
                    ansicht.bearbeiten = { typ: "projekte", eintrag: neu, neu: true };
                    zeichnen();
                    window.scrollTo(0, 0);
                }
            }),
            el("div", { class: "admin-list" }, daten.projekte.map(function (p, i) {
                return el("article", { class: "admin-card" }, [
                    el("img", { class: "admin-thumb", src: bildUrl(p.bilder && p.bilder[0]), alt: "", loading: "lazy" }),
                    el("div", { class: "admin-body" }, [
                        el("div", { class: "admin-head" }, [
                            el("div", {}, [
                                el("h2", { text: titel(p) }),
                                el("span", { class: "admin-meta", text: (p.kategorie || "–") + (p.jahr ? " · " + p.jahr : "") })
                            ])
                        ]),
                        el("div", { class: "admin-row" }, [
                            el("button", { class: "button admin-edit", type: "button", text: "Bearbeiten", onclick: function () {
                                ansicht.bearbeiten = { typ: "projekte", eintrag: p };
                                zeichnen();
                                window.scrollTo(0, 0);
                            } }),
                            sortierKnoepfe(daten.projekte, i, titel(p)),
                            el("a", { class: "admin-link", href: "projekt.html?id=" + encodeURIComponent(p.id), target: "_blank", text: "Ansehen ↗" })
                        ])
                    ])
                ]);
            }))
        ]);
    }

    /* ---------- Formular-Bausteine ---------- */

    let feldZaehler = 0;

    function feld(label, eingabe, hilfe) {
        const id = "f" + (++feldZaehler);
        eingabe.id = id;
        return el("div", { class: "field" }, [
            el("label", { for: id, text: label }),
            eingabe,
            hilfe ? el("span", { class: "admin-hint", text: hilfe }) : null
        ]);
    }

    function textFeld(obj, key, label, opt) {
        opt = opt || {};
        const eingabe = el("input", {
            class: "input",
            type: "text",
            value: obj[key] == null ? "" : String(obj[key]),
            placeholder: opt.placeholder,
            list: opt.liste,
            oninput: function (e) {
                obj[key] = e.target.value;
                if (opt.beiAenderung) opt.beiAenderung(e.target.value);
                notiere(opt.name + ": bearbeitet");
            }
        });
        return feld(label, eingabe, opt.hilfe);
    }

    function zahlFeld(obj, key, label, opt) {
        opt = opt || {};
        const eingabe = el("input", {
            class: "input",
            type: "number",
            inputmode: "decimal",
            min: "0",
            step: opt.step || "1",
            value: obj[key] == null ? "" : String(obj[key]),
            oninput: function (e) {
                const wert = e.target.value === "" ? null : Number(String(e.target.value).replace(",", "."));
                if (wert !== null && isNaN(wert)) return;
                obj[key] = wert === null ? (opt.leer !== undefined ? opt.leer : 0) : wert;
                if (opt.beiAenderung) opt.beiAenderung(obj[key]);
                notiere(opt.name + ": bearbeitet");
            }
        });
        return feld(label, eingabe, opt.hilfe);
    }

    function absatzFeld(obj, key, label, opt) {
        opt = opt || {};
        const wert = Array.isArray(obj[key]) ? obj[key].join("\n\n") : (obj[key] || "");
        const eingabe = el("textarea", {
            class: "input",
            rows: opt.zeilen || 6,
            value: wert,
            oninput: function (e) {
                obj[key] = opt.einfach ? e.target.value : e.target.value.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
                notiere(opt.name + ": bearbeitet");
            }
        });
        return feld(label, eingabe, opt.einfach ? opt.hilfe : (opt.hilfe || "Absätze mit einer Leerzeile trennen."));
    }

    function hakenFeld(obj, key, label, opt) {
        opt = opt || {};
        const box = el("input", {
            type: "checkbox",
            onchange: function (e) {
                obj[key] = e.target.checked;
                notiere(opt.name + ": bearbeitet");
                if (opt.neuZeichnen) zeichnen();
            }
        });
        box.checked = !!obj[key];
        return el("label", { class: "check" }, [box, el("span", { text: label })]);
    }

    function auswahlFeld(label, optionen, aktuell, beiAenderung) {
        const sel = el("select", {
            class: "select",
            onchange: function (e) { beiAenderung(e.target.value); }
        }, optionen.map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
        sel.value = aktuell;
        return feld(label, sel);
    }

    function abschnitt(text) {
        return el("h2", { class: "admin-section", text: text });
    }

    /* Bilderverwaltung: hochladen, sortieren, entfernen. Erstes Bild = Titelbild. */
    function bilderFeld(obj, typ, name) {
        obj.bilder = obj.bilder || [];
        const raster = el("div", { class: "admin-images" }, obj.bilder.map(function (pfad, i) {
            return el("figure", { class: "admin-image" }, [
                el("img", { src: bildUrl(pfad), alt: "" }),
                i === 0 ? el("span", { class: "admin-image-tag", text: "Titelbild" }) : null,
                el("div", { class: "admin-image-actions" }, [
                    el("button", { type: "button", class: "admin-mini", "aria-label": "Nach vorne", text: "←", disabled: i === 0,
                        onclick: function () {
                            obj.bilder.splice(i - 1, 0, obj.bilder.splice(i, 1)[0]);
                            notiere(name + ": Fotos sortiert");
                            zeichnen();
                        } }),
                    el("button", { type: "button", class: "admin-mini", "aria-label": "Nach hinten", text: "→", disabled: i === obj.bilder.length - 1,
                        onclick: function () {
                            obj.bilder.splice(i + 1, 0, obj.bilder.splice(i, 1)[0]);
                            notiere(name + ": Fotos sortiert");
                            zeichnen();
                        } }),
                    el("button", { type: "button", class: "admin-mini admin-danger", "aria-label": "Foto entfernen", text: "✕",
                        onclick: function () {
                            if (!window.confirm("Dieses Foto entfernen?")) return;
                            const pfad2 = obj.bilder.splice(i, 1)[0];
                            if (uploads[pfad2]) {
                                URL.revokeObjectURL(uploads[pfad2].url);
                                delete uploads[pfad2];
                            }
                            notiere(name + ": Foto entfernt");
                            zeichnen();
                        } })
                ])
            ]);
        }));

        return el("div", { class: "field" }, [
            el("span", { class: "admin-field-label", text: "Fotos" }),
            raster,
            fotoKnopf("+ Fotos hinzufügen", true, function (dateien) {
                return fotosHinzufuegen(dateien, BILD_ORDNER[typ], obj.id || slug(titel(obj))).then(function (pfade) {
                    obj.bilder = obj.bilder.concat(pfade);
                    notiere(name + ": " + pfade.length + " Foto(s) hinzugefügt");
                    zeichnen();
                });
            }),
            el("span", { class: "admin-hint", text: "Fotos werden vor dem Hochladen automatisch verkleinert. Das erste Foto ist das Titelbild." })
        ]);
    }

    function kategorieListe() {
        const alle = (daten.shop.kategorien || []).slice();
        daten.werke.concat(daten.projekte).forEach(function (e) {
            if (e.kategorie && alle.indexOf(e.kategorie) === -1) alle.push(e.kategorie);
        });
        return el("datalist", { id: "admin-kategorien" }, alle.map(function (k) { return el("option", { value: k }); }));
    }

    /* ---------- Editor für ein Werk oder Projekt ---------- */

    function editor() {
        const b = ansicht.bearbeiten;
        const e = b.eintrag;
        const liste = daten[b.typ];
        const name = function () { return (b.typ === "werke" ? "Werk „" : "Projekt „") + titel(e) + "“"; };

        function fertig() {
            if (!titel(e) || titel(e) === "(ohne Titel)") {
                window.alert("Bitte einen Titel eingeben.");
                return;
            }
            if (!e.id) e.id = eindeutigeId(slug(titel(e)), liste, e);
            if (b.neu) notiere(name() + " angelegt");
            ansicht.bearbeiten = null;
            zeichnen();
            window.scrollTo(0, 0);
        }

        function loeschen() {
            if (!window.confirm(titel(e) + " wirklich löschen? Das lässt sich nach dem Speichern nur über GitHub rückgängig machen.")) return;
            const i = liste.indexOf(e);
            if (i >= 0) liste.splice(i, 1);
            if (!b.neu) notiere(name() + " gelöscht");
            ansicht.bearbeiten = null;
            zeichnen();
            window.scrollTo(0, 0);
        }

        function abbrechenNeu() {
            const i = liste.indexOf(e);
            if (i >= 0) liste.splice(i, 1);
            ansicht.bearbeiten = null;
            zeichnen();
        }

        const kopf = el("div", { class: "admin-editor-head" }, [
            el("button", { type: "button", class: "text-link admin-back", text: "← Zurück zur Liste", onclick: b.neu && !titel(e).trim() ? abbrechenNeu : fertig }),
            el("h2", { text: b.neu ? (b.typ === "werke" ? "Neues Werk" : "Neues Projekt") : "Bearbeiten: " + titel(e) })
        ]);

        const felder = b.typ === "werke" ? werkFelder(e, name) : projektFelder(e, name);

        return el("div", { class: "admin-editor" }, [
            kategorieListe(),
            kopf,
            el("div", { class: "withdraw-form" }, felder),
            el("div", { class: "admin-editor-actions" }, [
                el("button", { type: "button", class: "button button-primary", text: "Fertig", onclick: fertig }),
                el("button", { type: "button", class: "button admin-danger-button", text: b.neu ? "Verwerfen" : "Löschen", onclick: b.neu ? abbrechenNeu : loeschen })
            ]),
            el("p", { class: "admin-hint", text: "„Fertig“ übernimmt die Änderungen in die Liste. Online gehen sie erst mit „Speichern“ oben." })
        ]);
    }

    function werkFelder(w, name) {
        const n = function () { return name(); };
        const teile = [];

        teile.push(abschnitt("Grunddaten"));
        teile.push(textFeld(w, "name", "Titel", { name: n() }));
        teile.push(textFeld(w, "kategorie", "Kategorie", { name: n(), liste: "admin-kategorien", hilfe: "Vorhandene Kategorie wählen oder neue eintippen." }));
        teile.push(textFeld(w, "jahr", "Jahr", { name: n() }));
        teile.push(textFeld(w, "kurz", "Kurzbeschreibung (für die Kachel)", { name: n() }));
        teile.push(absatzFeld(w, "beschreibung", "Beschreibung", { name: n() }));

        teile.push(abschnitt("Fotos"));
        teile.push(bilderFeld(w, "werke", n()));

        teile.push(abschnitt("Details"));
        teile.push(textFeld(w, "technik", "Technik / Material", { name: n() }));
        teile.push(textFeld(w, "masse", "Maße", { name: n(), placeholder: "z. B. 30 × 40 cm" }));
        teile.push(textFeld(w, "gewicht", "Gewicht (optional)", { name: n() }));
        teile.push(textFeld(w, "signiert", "Signatur", { name: n(), placeholder: "z. B. Signiert und nummeriert" }));
        teile.push(hakenFeld(w, "zertifikat", "Echtheitszertifikat liegt bei", { name: n() }));
        teile.push(textFeld(w, "pflege", "Pflegehinweis (optional)", { name: n() }));
        teile.push(absatzFeld(w, "hinweise", "Hinweise, z. B. Sicherheit (optional)", { name: n(), einfach: true, zeilen: 2 }));

        teile.push(abschnitt("Auflage & Verfügbarkeit"));
        const unikat = istUnikat(w);
        teile.push(auswahlFeld("Art", [["unikat", "Unikat"], ["serie", "Kleinserie (nummeriert)"]], unikat ? "unikat" : "serie", function (wert) {
            if (wert === "unikat") {
                w.auflage = "Unikat";
                delete w.exemplare;
                w.bestand = 1;
            } else {
                w.auflage = Number(w.auflage) > 1 ? Number(w.auflage) : 10;
                w.bestand = w.auflage;
            }
            notiere(n() + ": Auflage");
            zeichnen();
        }));

        if (unikat) {
            const box = el("input", {
                type: "checkbox",
                onchange: function (e) {
                    w.bestand = e.target.checked ? 0 : 1;
                    notiere(n() + ": Verfügbarkeit");
                }
            });
            box.checked = bestand(w) === 0;
            teile.push(el("label", { class: "check" }, [box, el("span", { text: "Verkauft" })]));
        } else {
            teile.push(zahlFeld(w, "auflage", "Auflagenhöhe", {
                name: n(),
                beiAenderung: function (wert) {
                    if (hatExemplare(w)) exemplareAnpassen(w, wert);
                }
            }));
            const mitExemplaren = el("input", {
                type: "checkbox",
                onchange: function (e) {
                    if (e.target.checked) {
                        exemplareAnpassen(w, Number(w.auflage) || 1);
                        delete w.bestand;
                    } else {
                        w.bestand = bestand(w);
                        delete w.exemplare;
                    }
                    notiere(n() + ": Exemplare");
                    zeichnen();
                }
            });
            mitExemplaren.checked = hatExemplare(w);
            teile.push(el("label", { class: "check" }, [mitExemplaren, el("span", { text: "Exemplare einzeln auswählbar (mit eigenem Foto)" })]));

            if (hatExemplare(w)) {
                teile.push(exemplarEditor(w, n));
            } else {
                teile.push(zahlFeld(w, "bestand", "Noch verfügbar", { name: n() }));
            }
        }

        teile.push(abschnitt("Preis & Versand"));
        teile.push(zahlFeld(w, "preis", "Preis (€)", { name: n(), step: "0.01" }));

        const versandArt = w.versand === "anfrage" ? "anfrage" : (w.versand && typeof w.versand === "object" ? "eigen" : "standard");
        teile.push(auswahlFeld("Versand", [
            ["standard", "Standardpreise (" + (daten.shop.versandkosten || "") + ")"],
            ["eigen", "Eigener Versandpreis"],
            ["anfrage", "Auf Anfrage (z. B. sehr groß oder zerbrechlich)"]
        ], versandArt, function (wert) {
            if (wert === "standard") delete w.versand;
            else if (wert === "anfrage") w.versand = "anfrage";
            else w.versand = { "Österreich": 9.9, "EU-Land": 19.9 };
            notiere(n() + ": Versand");
            zeichnen();
        }));
        if (versandArt === "eigen") {
            teile.push(zahlFeld(w.versand, "Österreich", "Versand Österreich (€)", { name: n(), step: "0.01" }));
            teile.push(zahlFeld(w.versand, "EU-Land", "Versand EU (€)", { name: n(), step: "0.01" }));
        }

        teile.push(abschnitt("Anzeige"));
        teile.push(hakenFeld(w, "hervorgehoben", "Auf der Startseite zeigen", { name: n() }));
        teile.push(hakenFeld(w, "beispiel", "Als „Beispiel“ markieren", { name: n() }));
        return teile;
    }

    function exemplareAnpassen(w, anzahl) {
        anzahl = Math.max(1, Math.min(200, Number(anzahl) || 1));
        const vorhanden = (w.exemplare || []).filter(function (x) { return x.nr <= anzahl; });
        for (let nr = 1; nr <= anzahl; nr++) {
            if (!vorhanden.some(function (x) { return x.nr === nr; })) vorhanden.push({ nr: nr, bild: "", verkauft: false });
        }
        vorhanden.sort(function (a, b) { return a.nr - b.nr; });
        w.exemplare = vorhanden;
    }

    function exemplarEditor(w, n) {
        return el("div", { class: "admin-exemplare" }, w.exemplare.map(function (x) {
            const verkauft = el("input", {
                type: "checkbox",
                onchange: function (e) {
                    x.verkauft = e.target.checked;
                    notiere(n() + ": Verfügbarkeit");
                }
            });
            verkauft.checked = !!x.verkauft;
            return el("div", { class: "admin-exemplar" }, [
                el("strong", { text: nummer(x.nr) }),
                x.bild ? el("img", { src: bildUrl(x.bild), alt: "" }) : el("span", { class: "admin-noimg", text: "kein Foto" }),
                fotoKnopf(x.bild ? "Foto ändern" : "+ Foto", false, function (dateien) {
                    return fotosHinzufuegen(dateien, BILD_ORDNER.werke, (w.id || slug(titel(w))) + "-" + String(x.nr).padStart(2, "0"))
                        .then(function (pfade) {
                            if (uploads[x.bild]) {
                                URL.revokeObjectURL(uploads[x.bild].url);
                                delete uploads[x.bild];
                            }
                            x.bild = pfade[0];
                            notiere(n() + ": Foto für " + nummer(x.nr));
                            zeichnen();
                        });
                }),
                el("label", { class: "check admin-toggle" }, [verkauft, el("span", { text: "verkauft" })])
            ]);
        }));
    }

    function projektFelder(p, name) {
        const n = function () { return name(); };
        const werkOptionen = [["", "– kein Werk –"]].concat(daten.werke.map(function (w) { return [w.id, titel(w)]; }));
        return [
            abschnitt("Grunddaten"),
            textFeld(p, "titel", "Titel", { name: n() }),
            textFeld(p, "kategorie", "Kategorie", { name: n(), liste: "admin-kategorien" }),
            textFeld(p, "jahr", "Jahr", { name: n() }),
            textFeld(p, "kurz", "Kurzbeschreibung", { name: n() }),
            absatzFeld(p, "text", "Text", { name: n(), zeilen: 8 }),
            abschnitt("Fotos"),
            bilderFeld(p, "projekte", n()),
            abschnitt("Verknüpfung"),
            auswahlFeld("Zugehöriges Werk im Shop (optional)", werkOptionen, p.produkt || "", function (wert) {
                p.produkt = wert;
                notiere(n() + ": Verknüpfung");
            }),
            hakenFeld(p, "beispiel", "Als „Beispiel“ markieren", { name: n() })
        ];
    }

    /* ---------- Einstellungen ---------- */

    function shopEditor() {
        const s = daten.shop;
        const name = "Einstellungen";
        const teile = [];

        teile.push(abschnitt("Kontakt & Kategorien"));
        teile.push(textFeld(s, "email", "E-Mail für Bestellungen", { name: name }));
        const kategorien = el("input", {
            class: "input",
            value: (s.kategorien || []).join(", "),
            oninput: function (e) {
                s.kategorien = e.target.value.split(",").map(function (k) { return k.trim(); }).filter(Boolean);
                notiere(name + ": Kategorien");
            }
        });
        teile.push(feld("Kategorien (Reihenfolge der Filter)", kategorien, "Mit Komma trennen, z. B. Objekte, Licht, Druckgrafik"));

        teile.push(abschnitt("Versand"));
        teile.push(textFeld(s, "lieferzeit", "Lieferzeit (Text)", { name: name }));
        teile.push(textFeld(s, "versandkosten", "Versandkosten (Text auf Werkseiten)", { name: name }));
        (s.versandzonen || []).forEach(function (z) {
            if (z.preis === null || z.abholung) return;
            teile.push(zahlFeld(z, "preis", "Versandpreis " + z.name + " (€)", { name: name, step: "0.01" }));
        });
        teile.push(zahlFeld(s, "versandfrei_ab", "Gratisversand ab (€, 0 = nie)", { name: name, step: "1" }));

        teile.push(abschnitt("Zahlung"));
        const zahlung = el("input", {
            class: "input",
            value: (s.zahlungsarten || []).join(", "),
            oninput: function (e) {
                s.zahlungsarten = e.target.value.split(",").map(function (k) { return k.trim(); }).filter(Boolean);
                notiere(name + ": Zahlungsarten");
            }
        });
        teile.push(feld("Zahlungsarten", zahlung, "Mit Komma trennen"));

        teile.push(abschnitt("Social Media"));
        s.social = s.social || {};
        Object.keys(s.social).forEach(function (k) {
            teile.push(textFeld(s.social, k, k + " (Link, leer = ausblenden)", { name: name }));
        });

        return el("div", { class: "admin-editor" }, [el("div", { class: "withdraw-form" }, teile)]);
    }

    /* ---------- Speichern: alles in einem Commit ---------- */

    function referenzen(werte) {
        const pfade = new Set();
        werte.werke.forEach(function (w) {
            (w.bilder || []).forEach(function (b) { pfade.add(b); });
            (w.exemplare || []).forEach(function (x) { if (x.bild) pfade.add(x.bild); });
        });
        werte.projekte.forEach(function (p) { (p.bilder || []).forEach(function (b) { pfade.add(b); }); });
        return pfade;
    }

    /* Kurze, verständliche Beschreibung für den GitHub-Verlauf */
    function commitText() {
        let liste = protokoll.filter(function (t) { return t.indexOf("(ohne Titel)") === -1; });
        const ganz = liste.filter(function (t) { return / (angelegt|gelöscht)$/.test(t); });
        ganz.forEach(function (t) {
            const praefix = t.replace(/ (angelegt|gelöscht)$/, "") + ":";
            liste = liste.filter(function (x) { return x.indexOf(praefix) !== 0; });
        });
        if (!liste.length) return "Daten aktualisiert";
        return liste.slice(0, 10).join("; ") + (liste.length > 10 ? " …" : "");
    }

    function speichern() {
        if (ansicht.bearbeiten) {
            const e = ansicht.bearbeiten.eintrag;
            if (!titel(e) || titel(e) === "(ohne Titel)") {
                window.alert("Bitte zuerst einen Titel eingeben.");
                return;
            }
            if (!e.id) e.id = eindeutigeId(slug(titel(e)), daten[ansicht.bearbeiten.typ], e);
            if (ansicht.bearbeiten.neu) notiere((ansicht.bearbeiten.typ === "werke" ? "Werk „" : "Projekt „") + titel(e) + "“ angelegt");
            ansicht.bearbeiten.neu = false;
        }
        /* Leere neue Einträge ohne Titel nicht speichern */
        ["werke", "projekte"].forEach(function (k) {
            daten[k] = daten[k].filter(function (e) { return titel(e) && titel(e) !== "(ohne Titel)"; });
            daten[k].forEach(function (e) { if (!e.id) e.id = eindeutigeId(slug(titel(e)), daten[k], e); });
        });

        const geaenderteDateien = Object.keys(DATEIEN).filter(function (k) { return json(daten[k]) !== original[k]; });
        const vorher = referenzen({ werke: JSON.parse(original.werke), projekte: JSON.parse(original.projekte) });
        const nachher = referenzen(daten);

        /* Fotos, die nirgends mehr verwendet werden, aus den eigenen Ordnern löschen */
        const loeschen = Array.from(vorher).filter(function (p) {
            return !nachher.has(p) && (p.indexOf(BILD_ORDNER.werke) === 0 || p.indexOf(BILD_ORDNER.projekte) === 0);
        });
        /* Nur Uploads speichern, die noch verwendet werden */
        const neueBilder = Object.keys(uploads).filter(function (p) { return nachher.has(p); });

        statusZeile.textContent = "Speichere …";
        leiste.querySelector("button").disabled = true;

        let kopfSha;
        api("/git/ref/heads/" + encodeURIComponent(branch()))
            .then(function (ref) {
                kopfSha = ref.object.sha;
                /* Wurde eine der Dateien inzwischen woanders geändert? */
                return Promise.all(geaenderteDateien.map(function (k) { return dateiLaden(DATEIEN[k]); }));
            })
            .then(function (aktuell) {
                const konflikt = aktuell.some(function (d, i) { return d.sha !== dateiSha[geaenderteDateien[i]]; });
                if (konflikt) {
                    const fehler = new Error("konflikt");
                    fehler.status = 409;
                    throw fehler;
                }
                return api("/git/commits/" + kopfSha);
            })
            .then(function (commit) {
                const blobs = neueBilder.map(function (pfad) {
                    return api("/git/blobs", { method: "POST", body: { content: uploads[pfad].base64, encoding: "base64" } })
                        .then(function (b) { return { path: pfad, mode: "100644", type: "blob", sha: b.sha }; });
                }).concat(geaenderteDateien.map(function (k) {
                    return api("/git/blobs", { method: "POST", body: { content: json(daten[k]), encoding: "utf-8" } })
                        .then(function (b) { return { path: DATEIEN[k], mode: "100644", type: "blob", sha: b.sha }; });
                }));
                return Promise.all(blobs).then(function (eintraege) {
                    loeschen.forEach(function (p) { eintraege.push({ path: p, mode: "100644", type: "blob", sha: null }); });
                    return api("/git/trees", { method: "POST", body: { base_tree: commit.tree.sha, tree: eintraege } });
                });
            })
            .then(function (baum) {
                const text = commitText();
                return api("/git/commits", { method: "POST", body: { message: "Verwaltung: " + text, tree: baum.sha, parents: [kopfSha] } });
            })
            .then(function (neu) {
                return api("/git/refs/heads/" + encodeURIComponent(branch()), { method: "PATCH", body: { sha: neu.sha } });
            })
            .then(function () {
                const bearbeitet = ansicht.bearbeiten;
                return Promise.all(Object.keys(DATEIEN).map(function (k) { return dateiLaden(DATEIEN[k]); }))
                    .then(function (antworten) {
                        Object.keys(DATEIEN).forEach(function (k, i) {
                            dateiSha[k] = antworten[i].sha;
                            original[k] = json(daten[k]);
                        });
                        /* Hochgeladene Fotos bleiben bis zum Neuladen als Vorschau sichtbar */
                        const vorschau = uploads;
                        uploads = {};
                        protokoll = [];
                        statusZeile.textContent = "Gespeichert. Die Website zeigt die Änderungen in wenigen Minuten.";
                        Object.keys(vorschau).forEach(function (p) { vorschauCache[p] = vorschau[p].url; });
                        ansicht.bearbeiten = bearbeitet;
                        zeichnen();
                    });
            })
            .catch(function (e) {
                if (e.status === 409 || e.status === 422) {
                    statusZeile.textContent = "Die Daten wurden inzwischen woanders geändert. Bitte „Neu laden“ und die Änderung noch einmal machen.";
                } else if (e.status === 401 || e.status === 403) {
                    statusZeile.textContent = "Keine Schreibberechtigung. Der Schlüssel braucht „Contents: Read and write“.";
                } else {
                    statusZeile.textContent = "Speichern fehlgeschlagen: " + e.message;
                }
                leisteAktualisieren();
            });
    }

    /* Nach dem Speichern sind neue Fotos erst nach ein paar Minuten öffentlich abrufbar */
    const vorschauCache = {};
    const bildUrlOriginal = bildUrl;
    bildUrl = function (pfad) {
        if (pfad && vorschauCache[pfad] && !uploads[pfad]) return vorschauCache[pfad];
        return bildUrlOriginal(pfad);
    };

    window.addEventListener("beforeunload", function (e) {
        if (daten.werke.length && geaendert()) {
            e.preventDefault();
            e.returnValue = "";
        }
    });

    start();
})();
