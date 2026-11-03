/* ==========================================================
   L057 – Verwaltung
   Liest data/produkte.json direkt aus dem GitHub-Repository,
   zeigt alle Werke an und speichert Änderungen als Commit.
   Der Zugangsschlüssel (GitHub-Token) bleibt nur in diesem Browser.
   ========================================================== */

(function () {
    "use strict";

    const REPO = "L057-design/L057-HP";
    const DATEI = "data/produkte.json";
    const SPEICHER = "l057-verwaltung";

    const root = document.getElementById("verwaltung");
    let einstellungen = laden();
    let werke = [];
    let original = "";
    let sha = "";

    /* ---------- Hilfsfunktionen ---------- */

    function laden() {
        try {
            return JSON.parse(localStorage.getItem(SPEICHER) || "{}");
        } catch (e) {
            return {};
        }
    }

    function sichern() {
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
        const bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
        return new TextDecoder().decode(bytes);
    }

    function base64Encode(text) {
        const bytes = new TextEncoder().encode(text);
        let bin = "";
        bytes.forEach(function (b) { bin += String.fromCharCode(b); });
        return btoa(bin);
    }

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
            return r.json().catch(function () { return {}; }).then(function (daten) {
                if (!r.ok) {
                    const fehler = new Error(daten.message || ("Fehler " + r.status));
                    fehler.status = r.status;
                    throw fehler;
                }
                return daten;
            });
        });
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

    function geaendert() {
        return JSON.stringify(werke, null, 2) + "\n" !== original;
    }

    /* ---------- Anmeldung ---------- */

    function anmeldung(meldung) {
        const token = el("input", { class: "input", id: "token", type: "password", autocomplete: "off", placeholder: "github_pat_…" });
        const branch = el("input", { class: "input", id: "branch", value: einstellungen.branch || "main" });
        const status = el("p", { class: "buy-hint", "aria-live": "polite", text: meldung || "" });

        root.replaceChildren(
            el("header", { class: "page-head" }, [
                el("h1", { text: "Verwaltung" }),
                el("p", { text: "Hier änderst du Verfügbarkeit, Exemplare und Preise deiner Werke. Änderungen werden direkt auf GitHub gespeichert und sind nach wenigen Minuten online." })
            ]),
            el("form", {
                class: "withdraw-form admin-login",
                onsubmit: function (e) {
                    e.preventDefault();
                    einstellungen.token = token.value.trim();
                    einstellungen.branch = branch.value.trim() || "main";
                    if (!einstellungen.token) {
                        status.textContent = "Bitte den Schlüssel eingeben.";
                        return;
                    }
                    sichern();
                    start();
                }
            }, [
                el("div", { class: "field" }, [el("label", { for: "token", text: "GitHub-Schlüssel (Token)" }), token]),
                el("div", { class: "field" }, [el("label", { for: "branch", text: "Branch" }), branch]),
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
        root.replaceChildren(el("p", { class: "empty", text: "Lade Werke …" }));
        api("/contents/" + DATEI + "?ref=" + encodeURIComponent(einstellungen.branch || "main"))
            .then(function (daten) {
                sha = daten.sha;
                original = base64Decode(daten.content);
                werke = JSON.parse(original);
                zeichnen();
            })
            .catch(function (e) {
                if (e.status === 401 || e.status === 403) {
                    delete einstellungen.token;
                    sichern();
                    anmeldung("Der Schlüssel wurde nicht akzeptiert. Bitte prüfe ihn und die Berechtigung „Contents: Read and write“.");
                } else if (e.status === 404) {
                    anmeldung("Datei oder Branch nicht gefunden. Stimmt der Branch?");
                } else {
                    anmeldung("Laden fehlgeschlagen: " + e.message);
                }
            });
    }

    /* ---------- Anzeige ---------- */

    function zeichnen() {
        const leiste = el("div", { class: "admin-bar" });
        const status = el("p", { class: "buy-hint", "aria-live": "polite" });

        function leisteAktualisieren() {
            const offen = geaendert();
            leiste.replaceChildren(
                el("span", { text: offen ? "Ungespeicherte Änderungen" : "Alles gespeichert" }),
                el("button", {
                    class: "button button-primary",
                    type: "button",
                    disabled: !offen,
                    text: "Speichern",
                    onclick: function () { speichern(status, leisteAktualisieren); }
                })
            );
            leiste.classList.toggle("admin-bar-dirty", offen);
        }

        function aenderung() {
            leisteAktualisieren();
            status.textContent = "";
        }

        const karten = werke.map(function (w) { return werkKarte(w, aenderung); });

        root.replaceChildren(
            el("header", { class: "page-head" }, [
                el("h1", { text: "Verwaltung" }),
                el("p", {}, [
                    werke.length + " Werke · Branch „" + (einstellungen.branch || "main") + "“ · ",
                    el("a", { href: "#", text: "Neu laden", onclick: function (e) { e.preventDefault(); verwerfen(); } }),
                    " · ",
                    el("a", { href: "#", text: "Abmelden", onclick: function (e) {
                        e.preventDefault();
                        if (geaendert() && !window.confirm("Ungespeicherte Änderungen verwerfen?")) return;
                        einstellungen = { branch: einstellungen.branch };
                        sichern();
                        anmeldung("Abgemeldet.");
                    } })
                ])
            ]),
            leiste,
            status,
            el("div", { class: "admin-list" }, karten)
        );
        leisteAktualisieren();
    }

    function verwerfen() {
        if (geaendert() && !window.confirm("Ungespeicherte Änderungen verwerfen und neu laden?")) return;
        start();
    }

    function werkKarte(w, aenderung) {
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
                        aenderung();
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
                    aenderung();
                }
            });
            schalter.checked = bestand(w) === 0;
            steuerung.push(el("label", { class: "check admin-toggle" }, [schalter, el("span", { text: "Verkauft" })]));
        } else {
            const anzeige = el("span", { class: "admin-count" });
            function setze(n) {
                w.bestand = Math.max(0, Math.min(Number(w.auflage) || 99, n));
                delete w.verfuegbar;
                anzeige.textContent = w.bestand + " verfügbar";
                statusAktualisieren();
                aenderung();
            }
            anzeige.textContent = bestand(w) + " verfügbar";
            steuerung.push(el("div", { class: "qty" }, [
                el("button", { type: "button", "aria-label": "Einer weniger", text: "−", onclick: function () { setze(bestand(w) - 1); } }),
                anzeige,
                el("button", { type: "button", "aria-label": "Einer mehr", text: "+", onclick: function () { setze(bestand(w) + 1); } })
            ]));
        }

        const preisFeld = el("input", {
            class: "input admin-price",
            type: "number",
            inputmode: "decimal",
            min: "0",
            step: "1",
            value: String(w.preis),
            onchange: function (e) {
                const wert = Number(String(e.target.value).replace(",", "."));
                if (!isNaN(wert) && wert >= 0) {
                    w.preis = wert;
                    aenderung();
                } else {
                    e.target.value = String(w.preis);
                }
            }
        });

        const startseite = el("input", {
            type: "checkbox",
            onchange: function (e) {
                w.hervorgehoben = e.target.checked;
                aenderung();
            }
        });
        startseite.checked = !!w.hervorgehoben;

        statusAktualisieren();

        return el("article", { class: "admin-card" }, [
            el("img", { class: "admin-thumb", src: (w.bilder && w.bilder[0]) || "images/project-placeholder.jpg", alt: "" }),
            el("div", { class: "admin-body" }, [
                el("div", { class: "admin-head" }, [
                    el("div", {}, [
                        el("h2", { text: w.name }),
                        el("span", { class: "admin-meta", text: w.kategorie + " · " + (istUnikat(w) ? "Unikat" : "Auflage " + w.auflage) })
                    ]),
                    statusText
                ]),
                el("div", {}, steuerung),
                el("div", { class: "admin-row" }, [
                    el("label", { class: "admin-price-label" }, ["Preis (€) ", preisFeld]),
                    el("label", { class: "check admin-toggle" }, [startseite, el("span", { text: "Auf Startseite" })]),
                    el("a", { class: "admin-link", href: "produkt.html?id=" + encodeURIComponent(w.id), target: "_blank", text: "Ansehen ↗" })
                ])
            ])
        ]);
    }

    /* ---------- Speichern ---------- */

    function zusammenfassung(alt, neu) {
        const teile = [];
        neu.forEach(function (w) {
            const vorher = alt.find(function (a) { return a.id === w.id; });
            if (!vorher || JSON.stringify(vorher) === JSON.stringify(w)) return;
            if (bestand(vorher) !== bestand(w)) teile.push(w.name + ": " + bestand(w) + " verfügbar");
            if (vorher.preis !== w.preis) teile.push(w.name + ": Preis " + preis(w.preis));
            if (!!vorher.hervorgehoben !== !!w.hervorgehoben) teile.push(w.name + (w.hervorgehoben ? ": auf Startseite" : ": nicht auf Startseite"));
        });
        return teile.length ? teile.join(", ") : "Werke aktualisiert";
    }

    function speichern(status, fertig) {
        const inhalt = JSON.stringify(werke, null, 2) + "\n";
        const nachricht = "Verwaltung: " + zusammenfassung(JSON.parse(original), werke);
        status.textContent = "Speichere …";

        api("/contents/" + DATEI, {
            method: "PUT",
            body: {
                message: nachricht,
                content: base64Encode(inhalt),
                sha: sha,
                branch: einstellungen.branch || "main"
            }
        }).then(function (daten) {
            sha = daten.content && daten.content.sha;
            original = inhalt;
            status.textContent = "Gespeichert. Die Website zeigt die Änderung in wenigen Minuten.";
            fertig();
        }).catch(function (e) {
            if (e.status === 409 || e.status === 422) {
                status.textContent = "Die Datei wurde inzwischen woanders geändert. Bitte „Neu laden“ und die Änderung noch einmal machen.";
            } else if (e.status === 401 || e.status === 403) {
                status.textContent = "Keine Schreibberechtigung. Der Schlüssel braucht „Contents: Read and write“.";
            } else {
                status.textContent = "Speichern fehlgeschlagen: " + e.message;
            }
        });
    }

    window.addEventListener("beforeunload", function (e) {
        if (werke.length && geaendert()) {
            e.preventDefault();
            e.returnValue = "";
        }
    });

    start();
})();
