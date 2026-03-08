import { PlanningConstraints, NearbyPlanningApp } from '@/types/property';

const PLANNING_DATA_URL = 'https://www.planning.data.gov.uk';
const PLANIT_URL = 'https://www.planit.org.uk/api';

// Historic England ArcGIS FeatureServer — free, no auth, production-ready
const HE_LISTED_BUILDINGS_URL =
  'https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/ArcGIS/rest/services/National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer/0/query';
const HE_CONSERVATION_AREAS_URL =
  'https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/Conservation_Areas/FeatureServer/0/query';

interface ArcGISFeature {
  attributes: Record<string, unknown>;
}

interface ArcGISResponse {
  features?: ArcGISFeature[];
}

/**
 * Query a Historic England ArcGIS FeatureServer layer by point.
 */
async function queryArcGIS(
  url: string,
  lng: number,
  lat: number,
  outFields: string = '*',
  distance: number = 0
): Promise<ArcGISResponse | null> {
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    spatialRel: distance > 0 ? 'esriSpatialRelIntersects' : 'esriSpatialRelIntersects',
    distance: String(distance),
    units: 'esriSRUnit_Meter',
    outFields,
    returnGeometry: 'false',
    resultRecordCount: '1',
    f: 'json',
  });
  try {
    const res = await fetch(`${url}?${params}`, {
      next: { revalidate: 60 * 60 * 24 * 7 }, // Cache 7 days
    });
    if (!res.ok) return null;
    return await res.json();
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

  // 1. Historic England: listed buildings (point intersect, then 50m buffer fallback)
  const listedBuildingRequest = async () => {
    // First: exact point query
    let data = await queryArcGIS(HE_LISTED_BUILDINGS_URL, lng, lat, 'Grade,Name,ListEntry');
    if (data?.features && data.features.length > 0) {
      constraints.listedBuilding = true;
      constraints.listedBuildingGrade = String(data.features[0].attributes.Grade || '') || null;
      return;
    }
    // Fallback: 50m buffer — listed building point may not exactly overlap the property point
    data = await queryArcGIS(HE_LISTED_BUILDINGS_URL, lng, lat, 'Grade,Name,ListEntry', 50);
    if (data?.features && data.features.length > 0) {
      constraints.listedBuilding = true;
      constraints.listedBuildingGrade = String(data.features[0].attributes.Grade || '') || null;
    }
  };

  // 2. Historic England: conservation areas (polygon — point-in-polygon)
  const conservationAreaRequest = async () => {
    const data = await queryArcGIS(HE_CONSERVATION_AREAS_URL, lng, lat, 'DESIGNATION,NAME');
    if (data?.features && data.features.length > 0) {
      constraints.conservationArea = true;
      constraints.conservationAreaName = String(data.features[0].attributes.NAME || '') || null;
    }
  };

  // 3. planning.data.gov.uk for other constraints (TPO, Article 4)
  const planningDatasets = [
    { dataset: 'tree-preservation-order', key: 'treePreservationOrder' as const },
    { dataset: 'article-4-direction-area', key: 'article4Direction' as const },
  ];

  const planningRequests = planningDatasets.map(async ({ dataset, key }) => {
    try {
      const res = await fetch(
        `${PLANNING_DATA_URL}/api/v1/entity.json?dataset=${dataset}&longitude=${lng}&latitude=${lat}&geometry_relation=intersects&limit=1`,
        { next: { revalidate: 60 * 60 * 24 * 7 } }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.entities && data.entities.length > 0) {
        const entity = data.entities[0];
        switch (key) {
          case 'treePreservationOrder':
            constraints.treePreservationOrder = true;
            break;
          case 'article4Direction':
            constraints.article4Direction = true;
            constraints.article4Details = entity.name || entity.description || null;
            break;
        }
      }
    } catch {
      // Silently fail
    }
  });

  await Promise.all([
    listedBuildingRequest(),
    conservationAreaRequest(),
    ...planningRequests,
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
