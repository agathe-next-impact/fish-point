# Handoff — FishSpot (PWA desktop + mobile)

## Overview
FishSpot is a French web app / installable **PWA** for finding authorised fishing spots in France: an interactive map, a filterable spot directory, detailed spot sheets (with regulation + weather), a personal **carnet de prises** (catch log), stats, and a profile. This package documents an animated, high‑fidelity design reference covering the core screens on **both desktop and mobile**.

This handoff is **self‑sufficient**: a developer who was not in the original session can rebuild the UI from this README alone. The HTML files in `reference/` are there to disambiguate, not to ship.

## About the design files
The files in `reference/` are **design references authored in HTML/React‑via‑Babel** — runnable prototypes that show the intended look, layout, copy and motion. They are **not production code to copy verbatim**. The job is to **recreate these designs in the target codebase's real environment** (e.g. Next.js + React, Vue/Nuxt, SwiftUI, Flutter…) using that project's established component library, routing, state and styling conventions. If no codebase exists yet, **Next.js (App Router) + TypeScript + CSS variables/Tailwind** is a natural fit for a PWA and is recommended.

How to run the reference: open `reference/FishSpot Mockups.html` in a browser (it loads React/Babel from a CDN; needs internet on first load). It renders a desktop browser frame + an iPhone frame side by side with a self‑playing tour. Device frames (`frames/*.jsx`) and `tweaks-panel.jsx` are **presentation scaffolding only** — do not port them; build real responsive layouts + real device behaviour instead.

## Fidelity
**High‑fidelity.** Colours, typography, spacing, radii, shadows, copy and animation timings are final and listed below. Recreate pixel‑faithfully using the codebase's primitives. The one thing that is *mock* is data (8 sample spots, 4 sample catches) and the "map" — see **Map implementation** below.

---

## Design tokens

All tokens live in `reference/app.css` under `:root`. Reproduce them as CSS variables / theme tokens.

### Colour
| Token | Hex | Use |
|---|---|---|
| `--abyss` | `#08303a` | Deep teal‑navy. Hero bg, map water (dark), dark surfaces |
| `--abyss-2` | `#0c3b46` | Hero gradient stop |
| `--teal` | `#0e8c7f` | **Default primary / accent** |
| `--teal-deep` | `#0a6b61` | Primary hover / accent‑deep |
| `--aqua` | `#5fc9b8` | Light accent, highlights, stats numerals on dark |
| `--aqua-soft` | `#d7efe9` | Soft fills (icon chips, selected pills bg, dropzones) |
| `--amber` | `#f2a93b` | Warm accent (mid scores, sun) |
| `--amber-deep` | `#d98a1c` | Mid‑score text, size numerals |
| `--ink` | `#122a2f` | Primary text |
| `--muted` | `#5d757b` | Secondary text |
| `--faint` | `#8aa0a4` | Tertiary text / disabled chevrons |
| `--paper` | `#f3f7f5` | App background (cool off‑white) |
| `--card` | `#ffffff` | Card surface |
| `--line` | `rgba(18,42,47,0.10)` | Borders |
| `--line-soft` | `rgba(18,42,47,0.06)` | Hairline borders |

**Accent is themeable.** `--accent` / `--accent-deep` default to the teal pair. The design ships 4 accent options (used by the Tweaks demo control — you can expose this as a theme setting or drop it):
- Lac (teal) `#0e8c7f` / `#0a6b61` *(default)*
- Océan (blue) `#1d6fa5` / `#155a86`
- Forêt (green) `#2f8f5b` / `#226e44`
- Coucher (amber) `#d98a1c` / `#b06f12`

Score → colour rule: **score ≥ 80 = green `#1f9d6b`** (bg `rgba(31,157,107,0.12)`); **< 80 = amber `--amber-deep`** (bg `rgba(217,138,28,0.14)`).

### Typography
Two Google fonts:
- **Display** — `"Bricolage Grotesque"` (opsz 12–96; weights 400/600/700/800). Used for headings, titles, numerals, brand. `letter-spacing: -0.02em; line-height: 1.02`.
- **UI / body** — `"Hanken Grotesque"` (weights 400/500/600/700/800). Everything else. Base `letter-spacing: -0.01em`.

Approx type scale in use (px): hero h1 **54/800**, section h2 **36/800**, page h1 **32/800**, card title **17–20/700**, large mobile title **30/800**, body **15–18/400‑500**, label/caption **11–14/600‑700**, uppercase eyebrow **12‑13/700 letter‑spacing .04–.05em**.

### Spacing, radii, shadows
- Radii: `--r-sm 10` · `--r-md 14` · `--r-lg 20` · `--r-xl 28` (px); pills `999px`; iOS list cards `26`.
- Shadows: `--sh-sm 0 1px 2px rgba(8,48,58,.06), 0 2px 6px rgba(8,48,58,.05)` · `--sh-md 0 4px 14px rgba(8,48,58,.08), 0 10px 30px rgba(8,48,58,.07)` · `--sh-lg 0 14px 40px rgba(8,48,58,.14)`.
- Primary button shadow: `0 4px 14px rgba(14,140,127,0.30)` (recolour with accent).
- Spacing: informal 4‑based scale; common gaps 6/8/10/12/14/18/20/22/26 px.

### Reusable element styles (see `app.css`)
- **`.btn`** family: `btn-primary` (accent fill, white), `btn-ghost` (translucent white on dark), `btn-soft` (`--aqua-soft` bg, `--teal-deep` text), `btn-outline` (1.5px inset border, accent on hover). Padding `12px 20px`, radius `--r-md`, weight 600. `:active { transform: translateY(1px) scale(.985) }`.
- **`.chip`**: pill, `7px 13px`, 13px/600, white bg + `inset 0 0 0 1.5px --line`; **`.chip.on`** = accent fill, white.
- **`.score`**: square badge, display font 700, radius ~9‑12.

---

## Screens / Views

> Coordinates/sizes below are the reference values. Treat them as ratios to reproduce, not hard pixels, except where they define a component's intrinsic look (radii, padding, type).

### A. Desktop (target ~1160×752 content inside browser chrome)
Shared **top nav** (height 64, white, bottom `--line`): brand (28–34px rounded‑10 accent tile with fish glyph + "FishSpot" in display 20/800) · nav links *Carte · Spots · Par département · Réglementation* (active link = `--aqua-soft` bg, `--accent-deep` text, radius 9) · right side *Connexion* (text button) + *Inscription* (`btn-primary`).

**A1 — Landing (`home`)**
- **Hero**: full‑width gradient `linear-gradient(160deg,#0c4350,#08303a 60%,#06262e)`, white text, padding `76px 56px 86px`, max text width 640. A decorative dark **MapCanvas** sits in the right ~46% behind a left‑to‑right fade. Contents: eyebrow pill ("Spots autorisés vérifiés en France", aqua on translucent aqua), h1 54/800 "Trouvez les meilleurs spots de pêche en France", 18px lead paragraph (copy below), two CTAs (`Voir la carte` primary + `Créer un compte gratuit` ghost), then a stat row (3 items, display 28/800 in `--aqua` + caption): **12 400+** spots cartographiés · **98** départements · **45 000** pêcheurs actifs.
- **Features**: centered h2 36/800 "Tout ce dont vous avez besoin pour pêcher sereinement", then a **4‑column grid** of cards (`--sh-sm`, padding 26×22): icon in 50×50 rounded‑14 `--aqua-soft` tile, title 19/700, 14.5px muted copy. The four: **Carte Interactive / Réglementation / Carnet de Prises / Communauté** (copy below).
- **CTA band**: rounded‑`--r-xl` panel, gradient `120deg,--teal-deep,--teal`, white, centered; big faint fish glyph decoration top‑right; h2 34/800 "Prêt à découvrir de nouveaux spots ?", lead, white button "Explorer la carte".
- **Footer**: `#06262e`, 4 columns (brand blurb + Explorer / Communauté / Légal link lists) + "© 2026 FishSpot. Tous droits réservés."

**A2 — Map (`map`)**: full‑bleed split. Left **FilterRail** (268px, see below). Right: dark **MapCanvas** filling the area, a floating **search bar** top‑left (max 420px, white, rounded‑13, `--sh-md`, search icon + placeholder "Rechercher un spot, une ville…"), and a **floating active‑spot card** bottom‑right (330px, `--sh-lg`): 130px photo header with score badge top‑right + name/dept overlaid bottom (white, text‑shadow), body with AccessTag + water chip, 13.5px description, `Voir la fiche` primary + heart `btn-outline`.

**A3 — Spots list (`spots`)**: left **FilterRail** + right scroll area. Header row: h1 32/800 "Spots de pêche" + "8 spots correspondent à vos filtres"; right side "Trier : Score" + a grid/map view segmented toggle (accent fill on active). Body: **3‑column card grid** (gap 20) of **SpotCardD** (see Components).

**FilterRail** (width 268, bg `#fbfdfc`, right border `--line`, scrolls): header "Filtres" (display 18/700) + "Réinitialiser" (teal text). Sections (12px/700 uppercase faint label each):
- *Département*: faux select row (pin icon + "Tous les départements" + chevron‑down).
- *Type d'eau*: wrap of chips — Rivière, Lac, Étang, Mer, Canal, Ruisseau (Lac on by default).
- *Type de poisson*: wrap of chips — Carnassier, Salmonidé, Cyprinidé, Silure, Marin, Crustacé, Autre (Carnassier on).
- *Accès*: checkbox list — Libre, Carte de pêche, AAPPMA spécifique, Payant (first two checked: 19px rounded‑6 accent box w/ white shield check).
- *Score minimum*: range slider (accent), labels 0 / **70+** / 100.

### B. Mobile PWA (390–402px wide; reference frame 402×874)
Persistent **bottom tab bar** (height 84 incl. safe‑area, frosted `rgba(255,255,255,.86)` + `blur(18px)`, top hairline): **Carte (map) · Prises (fish) · [＋ centre] · Stats (chart) · Profil (user)**. Active = accent; the centre **＋** is a 54×54 accent rounded‑18 FAB lifted −22px with `0 8px 20px rgba(14,140,127,.4)`. Status‑bar clearance constant **SB = 54px** (content starts below the iOS status bar / notch).

**B1 — Map (`map`, dark status bar)**: full‑screen dark **MapCanvas**. Top overlay (at SB): white search bar (rounded‑14, `--sh-md`, search + filter‑tile) and a horizontal scroll of quick‑filter chips (*À proximité* on, *Carnassier, Score 80+, Accès libre*). Floating round **locate** button (46, white, `--sh-md`, teal location icon). **Bottom sheet** (rounded‑top‑24, `0 -10px 40px` shadow): drag handle + header "8 spots à proximité" / "Triés par score · rayon 30 km" + chevron; expands on tap. List rows = 58px photo thumb + name + (water · distance) + AccessTag + small ScoreBadge; active row bg `--aqua-soft`.

**B2 — Spot detail** (pushed from map/list): 300px **photo hero** with top/bottom scrim; circular back (chevron‑left) + like (heart, toggles to `#e0556a`) buttons at SB; overlaid bottom: AccessTag (dark variant) + name (display 30/800, text‑shadow) + dept (pin icon). Body: 3 stat cards (Score / Catégorie / water type — these show a **skeleton shimmer for ~700ms** then animate in), description paragraph, **Espèces présentes** (aqua‑soft fish chips), **Conditions du jour** card (badge "Favorable" + 4 weather chips: sun 19°C, wind 12 km/h, water "Niveau bas", clock "Aube ★"), **Réglementation** card (left 4px teal border, shield icon, regulation copy), and CTA row: `Itinéraire` primary + `Noter une prise` soft.

**B3 — Prises (`catches`)**: large title "Mes prises" + "Saison 2026 · 24 prises enregistrées". 3 mini stat cards (24 Prises / 4,1 kg Record / 7 Espèces). List of **catch cards**: 84px photo (date chip bottom‑left) + fish name (display 18/700) + size (ruler icon, amber) + spot + weather/weight chips.

**B4 — Add catch (`add`, modal‑style, no tab bar)**: header *Annuler* / "Nouvelle prise". Photo **dropzone** (170px, `--aqua-soft`, 2px dashed teal, camera icon + "Ajouter une photo"). *Espèce* = horizontal chip scroller (Brochet…Bar, single‑select). *Taille* = range slider with live "{n} cm" in display 22/800 teal. *Spot* = picker row (thumb + name + dept + chevron). *Météo capturée automatiquement* info card (sun tile + "19°C · Ensoleillé · Vent 12 km/h"). Full‑width `Enregistrer la prise` primary.

**B5 — Stats (`stats`)**: title "Statistiques". Weekly **bar chart** card (7 bars L–D, bars grow via `rise` animation, current day = teal, others `--aqua-soft`, "+18%" label). Two stat cards (trophy "Record / Brochet 82 cm", fish "Top espèce / Carnassier"). "Spots favoris" ranked list (rank numeral + thumb + name + ScoreBadge).

**B6 — Profile (`profile`)**: dark gradient header (`160deg,#0c4350,#08303a`, rounded‑bottom‑26): 68px avatar (aqua→teal gradient, initials "JL"), name (display 24/800), "Annecy · Membre depuis 2024", stat row (24 Prises / 12 Spots / 340 Points). Below: settings list rows (icon tile + label + value + chevron): Mes prises, Mes spots, Carte de pêche (Valide 2026), Notifications, Mode hors‑ligne (PWA).

---

## Components (reusable)

- **ScoreBadge** — rounded square, display 700, sizes sm 38 / md 46 / lg 60; bg + text follow the score colour rule above.
- **AccessTag** — pill, 12/600, icon (leaf if "Libre" else shield) + label. Light variant: green if free else neutral `rgba(18,42,47,.06)`. `dark` variant: `rgba(255,255,255,.16)` bg, white text (over photos).
- **WeatherChip** — icon (teal) + label, 13/600 muted. Icons: sun, cloud, wind, water, clock, thermo, fish, ruler.
- **SpotCardD** (desktop) — card, 140px photo header (gradient‑scrim, ScoreBadge top‑right, AccessTag dark bottom‑left), body: name (display 17/700, ellipsis), dept row (pin), two chips (water = aqua‑soft, fish = outline). Hover: `translateY(-4px)` + `--sh-md`, 0.2s.
- **MapCanvas** — see below.
- **Icon set** — single inline‑SVG component (`FSIcon`, 24×24 viewBox, `stroke=currentColor`, `fill` flag for solids). Names used: fish, pin, map, water, book, users, shield, plus, chart, user, search, filter, star, heart, chevron/chevL/chevD, close, camera, cloud, sun, thermo, wind, location, clock, trophy, ruler, download, bell, home, leaf. **Recreate with the codebase's icon library** (Lucide/Phosphor etc.) — match the stroke‑1.9, round‑cap style; only `fish` and `pin` are bespoke (a simple lens‑shaped fish with tail notches; a teardrop map pin).

### Map implementation
The reference map is a **stylised placeholder**, not a real map: a radial water gradient + a faint 46px grid pattern + abstract "land" blobs (SVG) + teardrop pins positioned by `%`. **In production, replace with a real map** (MapLibre/Leaflet + vector tiles, or IGN/Mapbox). Keep the **pin visual** and the **drop animation**: teardrop = `border-radius:50% 50% 50% 0; rotate(-45deg)`, white 2.5px border, fill = score colour (active = accent + a pulsing ping ring), score number rotated back upright inside. Pins animate in with the `pin-drop` keyframe, staggered ~80ms.

---

## Interactions & behaviour

- **Navigation**: desktop = single‑page with `home / map / spots` views (router routes `/`, `/map`, `/spots`, plus real `/explore`, `/regulations`, `/community`, `/spots/new`, `/catches`, `/catches/new`, `/dashboard`, `/profile`, `/login`, `/register` per the live IA). Mobile = bottom‑tab navigation; spot detail is a pushed route; Add catch is a modal route (hides tab bar). Switching tabs clears any open detail.
- **Spot open** shows a **~700ms skeleton** (shimmer) on the detail stat cards before content animates in — simulate real fetch latency with your loading state.
- **Micro‑interactions**: buttons press `translateY(1px) scale(.985)`; cards hover‑lift; chips toggle selected (accent fill); like/heart toggles colour; filter checkboxes; range sliders (size, score) update live values.
- **Bottom sheet** (mobile map) expands/collapses on handle tap with `transform .4s cubic-bezier(.2,.8,.3,1)`.

### Animation catalogue (port these exactly — all in `app.css`)
| Name | Keyframe | Default usage |
|---|---|---|
| `rise` | opacity 0 + `translateY(14px)` → 0 | `.anim-rise` `.55s cubic-bezier(.2,.7,.3,1)`; staggered via `animation-delay` (≈0.05–0.08s per item) for lists/grids/feature cards; also chart bars |
| `fade` | opacity 0→1 | `.anim-fade` / `.screen-enter` `.35s ease` — replayed on every screen/route change (key the wrapper by route) |
| `pop` | scale .9→1.02→1, opacity in | `.anim-pop` `.45s cubic-bezier(.2,.8,.3,1.2)` — floating spot card appear |
| `pin-drop` | drop from `translateY(-60px) scale(.6)` with overshoot/settle | map pins, `.6s cubic-bezier(.2,.8,.3,1.1)`, staggered |
| `ping` | scale .6→2.6, opacity .6→0 | active‑pin pulse ring, `1.6s ease-out infinite` |
| `sk-shimmer` | bg‑position sweep | `.sk` skeleton, `1.25s ease-in-out infinite` |
| `float-y`, `sweep` | gentle bob / rotate | available, optional |

Respect `@media (prefers-reduced-motion: reduce)` → disable entrance animations (already in `app.css`).

> **Note on the screenshot tool quirk:** these entrance animations use `both` fill; DOM‑cloning screenshotters can rasterise them at opacity 0. Irrelevant to production — they play once and settle visible. No action needed.

---

## State management
Per‑app local state is enough (no global store required for the UI):
- **Desktop**: current `page`; FilterRail selections (`water[]`, `fish[]`, access checks, score min); active spot id (map).
- **Mobile**: current `tab`; open `spot` id (detail) + its `loading` flag; active map pin id; bottom‑sheet expanded bool; Add‑catch form (`fish`, `size`, photo, spot, auto weather).
- **Data fetching**: spots list (with filter query params), single spot (detail + regulation + live weather), user's catches + stats, profile. Wire the skeleton/loading states to these.

## Assets
- **Photos**: the reference uses CSS gradient placeholders (`PHOTOS` map in `fishspot-data.jsx`: alpine/forest/river/sea/pond/canal/dusk). Replace with real spot photography (`object-fit: cover`). Keep the dark bottom scrim used for overlaid text.
- **Icons**: inline SVG in the reference; swap for your icon library (see Icon set).
- **Fonts**: Bricolage Grotesque + Hanken Grotesque via Google Fonts (or self‑host).
- **No raster brand assets** — the logo is an accent tile + fish glyph, reproducible in code.
- **Sample data**: 8 spots + 4 catches in `fishspot-data.jsx` are placeholders; the live product is data‑driven.

## Exact copy
- Hero h1: "Trouvez les meilleurs spots de pêche en France"
- Hero lead: "Carte interactive, réglementation en temps réel, conditions météo et carnet de prises. Rejoignez la communauté des pêcheurs."
- Features h2: "Tout ce dont vous avez besoin pour pêcher sereinement"
- Carte Interactive — "Des milliers de spots géolocalisés avec filtres avancés et vue satellite."
- Réglementation — "Données réglementaires à jour par département, espèce et cours d'eau."
- Carnet de Prises — "Loggez vos prises avec photos, conditions météo et statistiques."
- Communauté — "Partagez vos spots, avis et échangez avec d'autres pêcheurs."
- CTA: "Prêt à découvrir de nouveaux spots ?" / "Rejoignez des milliers de pêcheurs qui utilisent FishSpot pour trouver les meilleurs coins." / button "Explorer la carte"
- Footer: "Les meilleurs spots de pêche autorisés en France. Carte interactive, réglementation et conditions en temps réel." · "© 2026 FishSpot. Tous droits réservés."
- Filter taxonomy — Type d'eau: Rivière, Lac, Étang, Mer, Canal, Ruisseau · Type de poisson: Carnassier, Salmonidé, Cyprinidé, Silure, Marin, Crustacé, Autre · Catégorie: 1ère/2ème catégorie · Accès: Libre, Carte de pêche, AAPPMA spécifique, Payant, Membres uniquement, Restreint, Privé · Score buckets: 0‑20 … 80‑100.

## PWA requirements
It's an installable PWA: add a web app manifest (name "FishSpot", theme `#08303a`, standalone display, maskable icons), a service worker for offline shell + cached map tiles/spot data ("Mode hors‑ligne" in profile), and safe‑area insets (`env(safe-area-inset-*)`) for the mobile tab bar.

## Files in this bundle
```
reference/
  FishSpot Mockups.html     ← entry: showcase stage (browser + iPhone frames, tour, Tweaks)
  app.css                   ← design tokens + .btn/.chip/.card + all @keyframes  ★ port this
  fishspot-data.jsx         ← FSIcon icon set, sample SPOTS/CATCHES, taxonomies, gradient PHOTOS
  fishspot-shared.jsx       ← ScoreBadge, AccessTag, WeatherChip, MapCanvas
  fishspot-mobile.jsx       ← all mobile screens + bottom TabBar (MobileApp)
  fishspot-desktop.jsx      ← TopNav, FilterRail, SpotCardD, landing/map/spots (DesktopApp)
  frames/ios-frame.jsx      ← iPhone bezel — PRESENTATION ONLY, do not port
  frames/browser-window.jsx ← browser chrome — PRESENTATION ONLY, do not port
  tweaks-panel.jsx          ← demo tweak panel — PRESENTATION ONLY, do not port
```
Start from `app.css` (tokens + animations), then `fishspot-shared.jsx` + the two app files for layout/behaviour. Ignore the frame/tweak scaffolding.
