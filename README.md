# The Antikythera Shipwreck — A Searchable Gallery of the Finds

A single-page, dependency-free web gallery cataloguing 76 artefact entries from the
Antikythera shipwreck (c. 60 BC), held principally in the National Archaeological
Museum, Athens.

## Features

- **Search** across object names, museum inventory numbers, materials and notes
  (diacritic-insensitive)
- **Filters** by object type (statuary, the Mechanism, jewellery, cargo & ship's
  equipment), material (bronze, marble, glass, ceramic, gold, silver, and more) and
  recovery campaign (1900–01, 1976, 2012–14, 2015–22)
- **Per-object detail view** with inventory number, material, dating, recovery
  campaign and links to the official provenance record for every entry
- Light and dark themes; fully responsive from 375px up

## Running it

No build step. Open `index.html` directly, or serve the folder with any static
server (e.g. `python3 -m http.server`). All JavaScript is hand-written vanilla —
no frameworks, no dependencies, no tracking.

## Data sources

Every inventory number, dating and material description is drawn from official
records:

- National Archaeological Museum, Athens — exhibition *The Shipwreck of
  Antikythera: The Ship, the Treasures, the Mechanism* and its 2012 printed
  catalogue
- ODYSSEUS database, Hellenic Ministry of Culture
- Return to Antikythera project (antikythera.org.gr)
- Woods Hole Oceanographic Institution expedition releases
- NYU ISAW Mechanism fragment imaging archive
- Wikimedia Commons (open-licence photographs)

Entries without a verifiable open-licence image are labelled as such rather than
linked to unverifiable sources. Where sources conflict (e.g. the dating of the
Youth of Antikythera), the discrepancy is noted on the entry.

## Image credits and copyright

- Wikimedia Commons images are used under their respective open licences; each
  entry links to the Commons file page for attribution and licence details.
- Official project photographs (glass vessels, amphorae, lamps) are by
  **K. Xenikakis / Return to Antikythera** (antikythera.org.gr) and are
  reproduced here at reduced resolution for documentation purposes. If you
  republish this repository, review these images against your own reuse
  requirements and the project's terms.

## Structure

```
index.html    page structure
style.css     design tokens and components ("Aegean" palette)
base.css      reset and shared defaults
app.js        search, filter and modal logic
data.js       the dataset: 76 entries with provenance links
assets/       official project photographs (local copies)
```

Compiled September 2026.
