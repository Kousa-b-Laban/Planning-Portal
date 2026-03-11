import { PlanningConstraints, NearbyPlanningApp } from '@/types/property';

// Historic England ArcGIS FeatureServer — free, no auth, production-ready
// NHLE layer 0 = Listed Building points
const HE_LISTED_BUILDINGS_URL =
  'https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/ArcGIS/rest/services/National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer/0/query';
// Conservation Areas polygons
const HE_CONSERVATION_AREAS_URL =
  'https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/Conservation_Areas/FeatureServer/0/query';

// DLUHC Planning Data Platform — free, no auth, beta but broadest dataset coverage
const PLANNING_DATA_URL = 'https://www.planning.data.gov.uk';

// PlanIt — nearby planning applications
const PLANIT_URL = 'https://www.planit.org.uk/api';

/**
 * Query a Historic England ArcGIS FeatureServer layer by point.
 * Returns feature attributes or null on failure.
 */
async function queryHEArcGIS(
  url: string,
  lng: number,
  lat: number,
  outFields: string,
  bufferMetres: number = 0
): Promise<Record<string, unknown> | null> {
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields,
    returnGeometry: 'false',
    resultRecordCount: '1',
    f: 'json',
  });
  if (bufferMetres > 0) {
    params.set('distance', String(bufferMetres));
    params.set('units', 'esriSRUnit_Meter');
  }

  try {
    const res = await fetch(`${url}?${params}`, {
      next: { revalidate: 60 * 60 * 24 * 7 }, // Cache 7 days
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].attributes;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Query DLUHC Planning Data Platform for a dataset at a given point.
 * Returns the first matching entity or null.
 */
async function queryPlanningData(
  dataset: string,
  lng: number,
  lat: number
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(
      `${PLANNING_DATA_URL}/api/v1/entity.json?dataset=${dataset}&longitude=${lng}&latitude=${lat}&limit=1`,
      { next: { revalidate: 60 * 60 * 24 * 7 } } // Cache 7 days
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.entities && data.entities.length > 0) {
      return data.entities[0];
    }
    return null;
  } catch {
    return null;
  }
}

export async function getPlanningConstraints(
  lat: number,
  lng: number
): Promise<PlanningConstraints> {
  const constraints: PlanningConstraints = {
    conservationArea: false,
    conservationAreaName: null,
    listedBuilding: false,
    listedBuildingGrade: null,
    treePreservationOrder: false,
    article4Direction: false,
    article4Details: null,
    greenBelt: false,
    sssi: false,
    sssiName: null,
    aonb: false,
    aonbName: null,
    floodZone2Or3: false,
  };

  await Promise.all([
    // ── Historic England: Listed Buildings ──
    // Try exact point first, then 50m buffer (listed building point may not
    // align exactly with the property coordinates)
    (async () => {
      let attrs = await queryHEArcGIS(
        HE_LISTED_BUILDINGS_URL, lng, lat, 'Grade,Name,ListEntry'
      );
      if (!attrs) {
        attrs = await queryHEArcGIS(
          HE_LISTED_BUILDINGS_URL, lng, lat, 'Grade,Name,ListEntry', 50
        );
      }
      if (attrs) {
        constraints.listedBuilding = true;
        constraints.listedBuildingGrade = attrs.Grade ? String(attrs.Grade) : null;
      }
    })(),

    // ── Historic England: Conservation Areas (polygon — point-in-polygon) ──
    (async () => {
      const attrs = await queryHEArcGIS(
        HE_CONSERVATION_AREAS_URL, lng, lat, 'NAME'
      );
      if (attrs) {
        constraints.conservationArea = true;
        constraints.conservationAreaName = attrs.NAME ? String(attrs.NAME) : null;
      }
    })(),

    // ── DLUHC: Tree Preservation Order ──
    (async () => {
      const entity = await queryPlanningData('tree-preservation-zone', lng, lat);
      if (entity) {
        constraints.treePreservationOrder = true;
      }
    })(),

    // ── DLUHC: Article 4 Direction Area ──
    (async () => {
      const entity = await queryPlanningData('article-4-direction-area', lng, lat);
      if (entity) {
        constraints.article4Direction = true;
        constraints.article4Details =
          (entity.name as string) || (entity.description as string) || null;
      }
    })(),

    // ── DLUHC: Green Belt ──
    (async () => {
      const entity = await queryPlanningData('green-belt', lng, lat);
      if (entity) {
        constraints.greenBelt = true;
      }
    })(),

    // ── DLUHC: SSSI ──
    (async () => {
      const entity = await queryPlanningData(
        'site-of-special-scientific-interest', lng, lat
      );
      if (entity) {
        constraints.sssi = true;
        constraints.sssiName = (entity.name as string) || null;
      }
    })(),

    // ── DLUHC: AONB (now National Landscapes) ──
    (async () => {
      const entity = await queryPlanningData(
        'area-of-outstanding-natural-beauty', lng, lat
      );
      if (entity) {
        constraints.aonb = true;
        constraints.aonbName = (entity.name as string) || null;
      }
    })(),

    // ── DLUHC: Flood Risk Zone 2/3 ──
    (async () => {
      const [zone2, zone3] = await Promise.all([
        queryPlanningData('flood-risk-zone', lng, lat),
        queryPlanningData('flood-zone-3', lng, lat),
      ]);
      if (zone2 || zone3) {
        constraints.floodZone2Or3 = true;
      }
    })(),
  ]);

  return constraints;
}

export async function getNearbyPlanningApps(
  lat: number,
  lng: number,
  radiusMetres: number = 500
): Promise<NearbyPlanningApp[]> {
  try {
    // PlanIt API: search by point and radius
    const res = await fetch(
      `${PLANIT_URL}/applics/json?lat=${lat}&lng=${lng}&radius=${radiusMetres}&recent=90&sort=-received_date&pg_sz=20`,
      { next: { revalidate: 60 * 60 } } // Cache 1 hour
    );

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.records) return [];

    return data.records.map((app: Record<string, unknown>) => ({
      reference: String(app.uid || app.altid || ''),
      description: String(app.description || ''),
      address: String(app.address || ''),
      status: String(app.status || ''),
      decisionDate: app.decision_date ? String(app.decision_date) : null,
      submittedDate: String(app.received_date || app.start_date || ''),
      distance: Number(app.distance) || 0,
      url: app.url ? String(app.url) : null,
      authority: String(app.authority_name || ''),
    }));
  } catch {
    return [];
  }
}
