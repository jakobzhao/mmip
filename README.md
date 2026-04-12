# MMIP Washington Web Map

Lightweight static prototype for a research-oriented web map on Missing and Murdered Indigenous Peoples in Washington State, especially Western Washington.

## Stack

- HTML
- CSS
- Vanilla JavaScript
- MapLibre GL JS
- OpenStreetMap raster basemap
- Local GeoJSON files in `data/`

## Included MVP Features

- Full-page interactive map
- Layer toggles for cases, Native Land, tribal lands, historical land acts, and counties
- Clickable case points with popup and detail panel
- Simple year filter and status filter
- Context summary cards for policy timing, data visibility, and jurisdiction setting
- Research framing, legend, and data limitation notes

## Run Locally

Because browsers often block `fetch()` from `file://` origins, serve the folder with a static server.

### Option 1: Python

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

### Option 2: VS Code Live Server

Open the folder in VS Code and run a static server extension.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository settings, enable GitHub Pages.
3. Deploy from the `main` branch root.

## Replace Sample Data

The files in `data/` are simplified placeholders for demonstration. Before public use:

- replace sample case records with research-validated data
- generalize or mask sensitive locations as needed
- document the provenance and uncertainty of each layer
- verify that Native Land is clearly labeled as contextual, not legal jurisdiction
- verify that any historical land-act layers are explicitly marked as interpretive unless they are sourced from authoritative historical GIS work

The bundled `native_land.geojson` and `tribal_lands.geojson` now use denser illustrative geometries, multiple Western Washington features, and richer contextual fields so the prototype reads more like a real thematic map. They are still placeholders and should be replaced with authoritative data before publication.

The bundled `land_acts.geojson` adds illustrative treaty and allotment-era context so users can compare MMIP cases against the longer territorial changes that shaped present-day jurisdictional fragmentation. It is an interpretive layer and should be replaced with research-validated historical GIS before publication.

The sample `cases.geojson` schema now includes contextual fields such as `tribal_affiliation`, `community_context`, `jurisdiction_context`, `policy_era`, `location_precision`, `record_visibility`, and `data_gap` so the map can communicate more than point location alone.

## Basemap Note

The prototype uses OpenStreetMap raster tiles as a more detailed public basemap. This improves road, place-name, and hydrography context without requiring a backend service. For production use, review tile usage limits and consider switching to a dedicated tile provider if traffic grows.