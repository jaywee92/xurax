# xurax.de

Eine Sammlung von Tipps & Tricks für Claude (Claude.ai, Claude Code, API), auf Deutsch.

## Tech-Stack

- **[Astro](https://astro.build)** als Static-Site-Generator: baut reines HTML, kein Server und keine Datenbank nötig.
- **`src/data/tips.json`** ist die einzige Datenquelle (150 Tipps, 17 Kategorien, Level, Quellen).
- **Suche & Level-Filter** laufen mit ein paar Zeilen Vanilla-JS direkt im Browser.
- **Eine Seite pro Kategorie** unter `/kategorie/<id>/` (gut für Google).
- **Deploy:** GitHub Actions baut bei jedem Push auf `main` und kopiert `dist/` per `rsync` auf den VPS. Dort liefert Caddy oder nginx die Dateien aus (Beispiele in `deploy/`).

## Lokal starten

Benötigt Node.js 24 (oder ≥ 22.23.4).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # fertige Seite in dist/
```

## Tipps ändern

`src/data/tips.json` bearbeiten, committen, pushen. Die Seite wird automatisch neu gebaut.

## Deploy einrichten

Im GitHub-Repo unter *Settings → Secrets and variables → Actions* anlegen:

| Secret | Beispiel |
| --- | --- |
| `VPS_HOST` | `xurax.de` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | privater SSH-Schlüssel (der öffentliche liegt auf dem VPS in `~/.ssh/authorized_keys`) |
| `VPS_PATH` | optional, Standard `/var/www/xurax.de` |

Solange die Secrets fehlen, wird nur gebaut und der Deploy-Schritt übersprungen.
