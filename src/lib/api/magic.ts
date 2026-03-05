import { MagicDesignations } from '@/types/property';

// Natural England MAGIC Map API
// Uses the WFS (Web Feature Service) to query designations at a point
const MAGIC_WFS_URL = 'https://environment.data.gov.uk/spatialdata';

export async function getMagicDesignations(
  lat: number,
  lng: number
): Promise<MagicDesignations> {
  const result: MagicDesignations = {
    sssi: null,
    aonb: null,
    nationalPark: null,
    greenBelt: false,
    ancientWoodland: false,
    scheduledMonument: null,
    ramsar: null,
    specialProtectionArea: null,
    specialAreaOfConservation: null,
  };

  // Query multiple designation datasets in parallel
  const queries = [
    {
      dataset: 'Sites_of_Special_Scientific_Interest_England',
      handler: (features: GeoJSONFeature[]) => {
        if (features.length > 0) {
          result.sssi = {
            name: features[0].properties?.SSSI_NAME || features[0].properties?.NAME || 'Unknown',
            condition: features[0].properties?.CONDITION || 'Unknown',
          };
        }
      },
    },
    {
      dataset: 'Areas_of_Outstanding_Natural_Beauty_England',
      handler: (features: GeoJSONFeature[]) => {
        if (features.length > 0) {
          result.aonb = {
            name: features[0].properties?.AONB_NAME || features[0].properties?.NAME || 'Unknown',
          };
        }
      },
    },
    {
      dataset: 'National_Parks_England',
      handler: (features: GeoJSONFeature[]) => {
        if (features.length > 0) {
          result.nationalPark = {
            name: features[0].properties?.NAME || 'Unknown',
          };
        }
      },
    },
    {
      dataset: 'Green_Belt_England',
      handler: (features: GeoJSONFeature[]) => {
        result.greenBelt = features.length > 0;
      },
    },
    {
      dataset: 'Ancient_Woodland_England',
      handler: (features: GeoJSONFeature[]) => {
        result.ancientWoodland = features.length > 0;
      },
    },
    {
      dataset: 'Scheduled_Monuments',
      handler: (features: GeoJSONFeature[]) => {
        if (features.length > 0) {
          result.scheduledMonument = {
            name: features[0].properties?.NAME || 'Unknown',
          };
        }
      },
    },
  ];

  // Build a small bounding box around the point (~50m)
  const delta = 0.0005; // roughly 50m
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;

  const requests = queries.map(async ({ dataset, handler }) => {
    try {
      const url = `${MAGIC_WFS_URL}/${dataset}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=${dataset}&bbox=${bbox}&outputFormat=GEOJSON&count=1`;
      const res = await fetch(url, {
        next: { revalidate: 60 * 60 * 24 * 7 }, // Cache 7 days
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.features && Array.isArray(data.features)) {
        handler(data.features);
      }
    } catch {
      // Silently fail — designation will show as null/false
    }
  });

  await Promise.all(requests);
  return result;
}

interface GeoJSONFeature {
  type: string;
  properties: Record<string, string>;
  geometry: unknown;
}
