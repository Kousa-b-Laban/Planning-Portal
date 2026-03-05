import { PlanningConstraints, NearbyPlanningApp } from '@/types/property';

const PLANNING_DATA_URL = 'https://www.planning.data.gov.uk';
const PLANIT_URL = 'https://www.planit.org.uk/api';

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

  // Query planning.data.gov.uk for constraints near this point
  const datasets = [
    { dataset: 'conservation-area', key: 'conservationArea' as const },
    { dataset: 'listed-building-outline', key: 'listedBuilding' as const },
    { dataset: 'tree-preservation-order', key: 'treePreservationOrder' as const },
    { dataset: 'article-4-direction-area', key: 'article4Direction' as const },
  ];

  const requests = datasets.map(async ({ dataset, key }) => {
    try {
      const res = await fetch(
        `${PLANNING_DATA_URL}/api/v1/entity.json?dataset=${dataset}&longitude=${lng}&latitude=${lat}&limit=1`,
        { next: { revalidate: 60 * 60 * 24 * 7 } } // Cache 7 days
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.entities && data.entities.length > 0) {
        const entity = data.entities[0];
        switch (key) {
          case 'conservationArea':
            constraints.conservationArea = true;
            constraints.conservationAreaName = entity.name || null;
            break;
          case 'listedBuilding':
            constraints.listedBuilding = true;
            constraints.listedBuildingGrade = entity['listed-building-grade'] || null;
            break;
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
      // Silently fail — show "unknown" in UI
    }
  });

  await Promise.all(requests);
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
