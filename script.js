const DATASETS = {
  cases: "data/cases.geojson",
  nativeLand: "data/native_land.geojson",
  tribalLands: "data/tribal_lands.geojson",
  landActs: "data/land_acts.geojson",
  counties: "data/counties.geojson",
};

const caseCountNode = document.getElementById("case-count");
const detailsNode = document.getElementById("feature-details");
const yearSlider = document.getElementById("year-slider");
const yearOutput = document.getElementById("year-output");
const yearMinNode = document.getElementById("year-min");
const yearMaxNode = document.getElementById("year-max");
const statusFilter = document.getElementById("status-filter");
const resetYearButton = document.getElementById("reset-year");
const contextTotalNode = document.getElementById("context-total");
const contextYearsNode = document.getElementById("context-years");
const contextPolicyNode = document.getElementById("context-policy");
const contextVisibilityNode = document.getElementById("context-visibility");
const contextVisibilityNoteNode = document.getElementById("context-visibility-note");
const contextJurisdictionNode = document.getElementById("context-jurisdiction");

const SAVANNAS_ACT_YEAR = 2020;

const state = {
  cases: null,
  filters: {
    year: null,
    status: "all",
  },
  years: [],
};

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      "osm-raster": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "osm-raster-layer",
        type: "raster",
        source: "osm-raster",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  center: [-122.7, 47.35],
  zoom: 6.1,
  maxBounds: [
    [-125.5, 45.2],
    [-116.2, 49.3],
  ],
});

map.scrollZoom.disable();

map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
map.addControl(new maplibregl.AttributionControl({ compact: true }));

init();

async function init() {
  try {
    const [cases, nativeLand, tribalLands, landActs, counties] = await Promise.all([
      fetchGeoJSON(DATASETS.cases),
      fetchGeoJSON(DATASETS.nativeLand),
      fetchGeoJSON(DATASETS.tribalLands),
      fetchGeoJSON(DATASETS.landActs),
      fetchGeoJSON(DATASETS.counties),
    ]);

    state.cases = cases;
    state.years = getSortedYears(cases.features);
    configureYearFilter(state.years);

    const setupMap = () => {
      addSources({ cases, nativeLand, tribalLands, landActs, counties });
      addLayers();
      bindMapInteractions();
      bindUiInteractions();
      applyCaseFilters();
      fitToCaseExtent(cases);
    };

    if (map.loaded()) {
      setupMap();
    } else {
      map.on("load", setupMap);
    }
  } catch (error) {
    console.error(error);
    detailsNode.classList.remove("empty-state");
    detailsNode.textContent =
      "Unable to load local GeoJSON files. Serve the folder with a static server instead of opening the page with a blocked file:// origin.";
  }
}

async function fetchGeoJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

function addSources({ cases, nativeLand, tribalLands, landActs, counties }) {
  map.addSource("cases", { type: "geojson", data: cases });
  map.addSource("native-land", { type: "geojson", data: nativeLand });
  map.addSource("tribal-lands", { type: "geojson", data: tribalLands });
  map.addSource("land-acts", { type: "geojson", data: landActs });
  map.addSource("counties", { type: "geojson", data: counties });
}

function addLayers() {
  map.addLayer({
    id: "native-land-fill",
    type: "fill",
    source: "native-land",
    paint: {
      "fill-color": "#b98543",
      "fill-opacity": 0.28,
    },
  });

  map.addLayer({
    id: "native-land-outline",
    type: "line",
    source: "native-land",
    paint: {
      "line-color": "#8f632f",
      "line-width": 1.25,
      "line-opacity": 0.9,
    },
  });

  map.addLayer({
    id: "native-land-labels",
    type: "symbol",
    source: "native-land",
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 5, 10, 8, 12],
      "text-letter-spacing": 0.04,
      "text-max-width": 10,
    },
    paint: {
      "text-color": "#6c4d23",
      "text-halo-color": "rgba(255, 250, 240, 0.95)",
      "text-halo-width": 1.2,
    },
  });

  map.addLayer({
    id: "tribal-lands-fill",
    type: "fill",
    source: "tribal-lands",
    paint: {
      "fill-color": "#2f6b62",
      "fill-opacity": 0.12,
    },
  });

  map.addLayer({
    id: "tribal-lands-outline",
    type: "line",
    source: "tribal-lands",
    paint: {
      "line-color": "#2f6b62",
      "line-width": 2,
      "line-dasharray": [2, 1],
    },
  });

  map.addLayer({
    id: "tribal-lands-labels",
    type: "symbol",
    source: "tribal-lands",
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 6, 10, 9, 12],
      "text-offset": [0, 0.1],
      "text-max-width": 10,
    },
    paint: {
      "text-color": "#1e4f48",
      "text-halo-color": "rgba(255, 250, 240, 0.95)",
      "text-halo-width": 1.1,
    },
  });

  map.addLayer({
    id: "land-acts-fill",
    type: "fill",
    source: "land-acts",
    paint: {
      "fill-color": [
        "match",
        ["get", "act_type"],
        "treaty cession",
        "#6b4e71",
        "allotment era",
        "#8d5a2b",
        "#6b4e71",
      ],
      "fill-opacity": 0.16,
    },
  });

  map.addLayer({
    id: "land-acts-outline",
    type: "line",
    source: "land-acts",
    paint: {
      "line-color": "#5c4061",
      "line-width": 1.8,
      "line-dasharray": [1.5, 1.1],
      "line-opacity": 0.92,
    },
  });

  map.addLayer({
    id: "land-acts-labels",
    type: "symbol",
    source: "land-acts",
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 5.5, 10, 8.5, 12],
      "text-max-width": 12,
    },
    paint: {
      "text-color": "#4d3452",
      "text-halo-color": "rgba(255, 250, 240, 0.94)",
      "text-halo-width": 1.1,
    },
  });

  map.addLayer({
    id: "counties-outline",
    type: "line",
    source: "counties",
    paint: {
      "line-color": "#8a8f95",
      "line-width": 1.15,
      "line-opacity": 0.75,
    },
  });

  map.addLayer({
    id: "cases-circle",
    type: "circle",
    source: "cases",
    paint: {
      "circle-color": [
        "match",
        ["get", "status"],
        "missing",
        "#c2552b",
        "murdered",
        "#7f1d1d",
        "unresolved",
        "#d97941",
        "#a63c2f",
      ],
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        5,
        8,
        8,
        11,
        11,
      ],
      "circle-stroke-color": "#fff8ee",
      "circle-stroke-width": 1.6,
      "circle-opacity": 0.92,
    },
  });
}

function bindUiInteractions() {
  document.querySelectorAll("[data-layer-toggle]").forEach((input) => {
    input.addEventListener("change", (event) => {
      toggleLayerGroup(event.target.dataset.layerToggle, event.target.checked);
    });
  });

  yearSlider.addEventListener("input", () => {
    const year = Number(yearSlider.value);
    state.filters.year = Number.isNaN(year) ? null : year;
    yearOutput.textContent = `${year} and earlier`;
    applyCaseFilters();
  });

  resetYearButton.addEventListener("click", () => {
    state.filters.year = null;
    yearSlider.value = yearSlider.max;
    yearOutput.textContent = "All years";
    applyCaseFilters();
  });

  statusFilter.addEventListener("change", () => {
    state.filters.status = statusFilter.value;
    applyCaseFilters();
  });
}

function bindMapInteractions() {
  map.on("click", handleMapClick);

  [
    "cases-circle",
    "native-land-fill",
    "tribal-lands-fill",
    "land-acts-fill",
    "counties-outline",
  ].forEach((layerId) => {
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  });
}

function handleMapClick(event) {
  const clickBox = [
    [event.point.x - 6, event.point.y - 6],
    [event.point.x + 6, event.point.y + 6],
  ];
  const features = map.queryRenderedFeatures(clickBox, {
    layers: [
      "cases-circle",
      "tribal-lands-fill",
      "native-land-fill",
      "land-acts-fill",
      "counties-outline",
    ],
  });

  if (!features.length) {
    return;
  }

  const caseFeature = features.find((feature) => feature.layer.id === "cases-circle");
  if (caseFeature) {
    handleCaseSelection(caseFeature);
    return;
  }

  const feature = features[0];
  if (feature.layer.id === "tribal-lands-fill") {
    renderPolygonDetails("Tribal land", feature.properties, [
      ["Name", "name"],
      ["Nation", "nation"],
      ["Type", "land_type"],
      ["Region", "region"],
      ["Status", "boundary_status"],
      ["Source note", "source_note"],
      ["Notes", "notes"],
    ]);
    return;
  }

  if (feature.layer.id === "native-land-fill") {
    renderPolygonDetails("Native Land territory", feature.properties, [
      ["Name", "name"],
      ["Nations", "nation_names"],
      ["Region", "region"],
      ["Layer type", "context_type"],
      ["Disclaimer", "disclaimer"],
      ["Context", "notes"],
    ]);
    return;
  }

  if (feature.layer.id === "land-acts-fill") {
    renderPolygonDetails("Historical land-act context", feature.properties, [
      ["Name", "name"],
      ["Year", "act_year"],
      ["Type", "act_type"],
      ["Nations", "nations"],
      ["Jurisdiction effect", "jurisdiction_effect"],
      ["Research relevance", "research_relevance"],
      ["Source note", "source_note"],
      ["Notes", "notes"],
    ]);
    return;
  }

  if (feature.layer.id === "counties-outline") {
    renderPolygonDetails("County boundary", feature.properties, [
      ["County", "name"],
      ["State", "state"],
      ["Notes", "notes"],
    ]);
  }
}

function handleCaseSelection(feature) {
  const coordinates = feature.geometry.coordinates.slice();
  const props = feature.properties;

  new maplibregl.Popup({ offset: 14 })
    .setLngLat(coordinates)
    .setHTML(renderCasePopup(props))
    .addTo(map);

  renderDetailPanel(
    "Case",
    [props.status, props.policy_era, props.location_precision],
    props.community_context,
    [
      ["Case ID", props.id],
      ["Name", props.name],
      ["Year", props.year],
      ["Status", props.status],
      ["County", props.county],
      ["Tribal / community context", props.tribal_affiliation],
      ["Jurisdiction setting", props.jurisdiction_context],
      ["Source", props.source],
      ["Source type", props.source_type],
      ["Confidence", props.confidence],
      ["Location precision", props.location_precision],
      ["Record visibility", props.record_visibility],
      ["Data gap", props.data_gap],
      ["Notes", props.notes],
    ],
  );
}

function renderPolygonDetails(title, properties, fields) {
  const pairs = fields.map(([label, key]) => [label, properties[key] || "-"]);
  renderDetailPanel(title, [], "", pairs);
}

function renderCasePopup(props) {
  return `
    <div>
      <h3 class="popup-title">${escapeHtml(props.name)}</h3>
      <ul class="popup-list">
        <li><strong>Year:</strong> ${escapeHtml(String(props.year))}</li>
        <li><strong>Status:</strong> ${escapeHtml(props.status)}</li>
        <li><strong>Policy era:</strong> ${escapeHtml(props.policy_era)}</li>
        <li><strong>County:</strong> ${escapeHtml(props.county)}</li>
        <li><strong>Jurisdiction:</strong> ${escapeHtml(props.jurisdiction_context)}</li>
        <li><strong>Source:</strong> ${escapeHtml(props.source)}</li>
        <li><strong>Visibility:</strong> ${escapeHtml(props.record_visibility)}</li>
      </ul>
    </div>
  `;
}

function renderDetailPanel(title, tags = [], subtitle = "", pairs) {
  detailsNode.classList.remove("empty-state");
  const rows = pairs
    .map(
      ([label, value]) => `
        <div class="detail-row">
          <div class="detail-term">${escapeHtml(label)}</div>
          <div>${escapeHtml(String(value || "-"))}</div>
        </div>
      `,
    )
    .join("");

  const tagMarkup = tags
    .filter(Boolean)
    .map((tag) => `<span class="detail-tag">${escapeHtml(String(tag))}</span>`)
    .join("");

  detailsNode.innerHTML = `
    <div class="detail-heading">
      <h3>${escapeHtml(title)}</h3>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    </div>
    ${tagMarkup ? `<div class="detail-tags">${tagMarkup}</div>` : ""}
    <div class="detail-grid">${rows}</div>
  `;
}

function configureYearFilter(years) {
  if (!years.length) {
    yearSlider.disabled = true;
    yearOutput.textContent = "No year data";
    return;
  }

  const minYear = years[0];
  const maxYear = years[years.length - 1];
  yearSlider.min = String(minYear);
  yearSlider.max = String(maxYear);
  yearSlider.step = "1";
  yearSlider.value = String(maxYear);
  yearMinNode.textContent = String(minYear);
  yearMaxNode.textContent = String(maxYear);
  yearOutput.textContent = "All years";
}

function applyCaseFilters() {
  if (!state.cases) {
    return;
  }

  const visibleFeatures = state.cases.features.filter((feature) => {
    const featureYear = Number(feature.properties.year);
    const matchesYear = state.filters.year === null || featureYear <= state.filters.year;
    const matchesStatus =
      state.filters.status === "all" || feature.properties.status === state.filters.status;

    return matchesYear && matchesStatus;
  });

  const filtered = {
    type: "FeatureCollection",
    features: visibleFeatures,
  };

  const source = map.getSource("cases");
  if (source) {
    source.setData(filtered);
  }
  caseCountNode.textContent = `${visibleFeatures.length} visible cases`;
  renderContextSummary(visibleFeatures);
}

function renderContextSummary(features) {
  contextTotalNode.textContent = String(features.length);

  if (!features.length) {
    contextYearsNode.textContent = "No cases match the current filters";
    contextPolicyNode.textContent = "0 pre / 0 post";
    contextVisibilityNode.textContent = "0 low-confidence";
    contextVisibilityNoteNode.textContent = "0 generalized locations";
    contextJurisdictionNode.textContent = "No cases selected";
    return;
  }

  const years = features.map((feature) => Number(feature.properties.year)).filter(Boolean);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const preSavannas = features.filter(
    (feature) => Number(feature.properties.year) < SAVANNAS_ACT_YEAR,
  ).length;
  const postSavannas = features.length - preSavannas;
  const lowConfidence = features.filter(
    (feature) => feature.properties.confidence === "low",
  ).length;
  const generalizedLocations = features.filter((feature) => {
    const precision = (feature.properties.location_precision || "").toLowerCase();
    return precision.includes("generalized") || precision.includes("approximate");
  }).length;

  const jurisdictionCounts = countBy(features, (feature) => feature.properties.jurisdiction_context);
  const leadingJurisdiction = Object.entries(jurisdictionCounts).sort((left, right) => right[1] - left[1])[0];

  contextYearsNode.textContent =
    minYear === maxYear ? `Visible year: ${minYear}` : `Visible years: ${minYear}-${maxYear}`;
  contextPolicyNode.textContent = `${preSavannas} pre / ${postSavannas} post`;
  contextVisibilityNode.textContent = `${lowConfidence} low-confidence`;
  contextVisibilityNoteNode.textContent = `${generalizedLocations} generalized locations`;
  contextJurisdictionNode.textContent = leadingJurisdiction
    ? `${leadingJurisdiction[0]} (${leadingJurisdiction[1]})`
    : "No jurisdiction notes";
}

function toggleLayerGroup(groupName, isVisible) {
  const visibility = isVisible ? "visible" : "none";
  const layerMap = {
    cases: ["cases-circle"],
    "native-land": ["native-land-fill", "native-land-outline", "native-land-labels"],
    "tribal-lands": ["tribal-lands-fill", "tribal-lands-outline", "tribal-lands-labels"],
    "land-acts": ["land-acts-fill", "land-acts-outline", "land-acts-labels"],
    counties: ["counties-outline"],
  };

  (layerMap[groupName] || []).forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility);
    }
  });
}

function fitToCaseExtent(cases) {
  if (!cases.features.length) {
    return;
  }

  const bounds = new maplibregl.LngLatBounds();
  cases.features.forEach((feature) => bounds.extend(feature.geometry.coordinates));
  map.fitBounds(bounds, { padding: 90, maxZoom: 8.5, duration: 0 });
}

function getSortedYears(features) {
  return [...new Set(features.map((feature) => Number(feature.properties.year)).filter(Boolean))].sort(
    (left, right) => left - right,
  );
}

function countBy(features, selector) {
  return features.reduce((counts, feature) => {
    const key = selector(feature) || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}