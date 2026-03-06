// Core property types used across the application

export interface PostcodeLookup {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district: string; // Local authority name
  parliamentary_constituency: string;
  region: string;
  country: string;
  codes: {
    admin_district: string;
    parish: string;
  };
}

export interface AddressResult {
  uprn: string; // OS Places unique property reference number
  lmkKey?: string; // EPC unique identifier (only if EPC exists)
  address: string;
  postcode: string;
  propertyType: string;
  builtForm: string;
  latitude?: number;
  longitude?: number;
}

export interface EPCData {
  lmkKey: string;
  address: string;
  postcode: string;
  currentEnergyRating: string; // A-G
  currentEnergyEfficiency: number;
  potentialEnergyRating: string;
  potentialEnergyEfficiency: number;
  propertyType: string; // Detached, Semi-Detached, Terraced, Flat, etc.
  builtForm: string;
  floorArea: number; // m²
  constructionAgeBand: string;
  tenure: string; // owner-occupied, rental, etc.
  wallsDescription: string;
  roofDescription: string;
  windowsDescription: string;
  heatingDescription: string;
  hotWaterDescription: string;
  floorDescription: string;
  co2Emissions: number;
  co2EmissionsCurrent: number;
  inspectionDate: string;
  lodgementDate: string;
  localAuthorityLabel: string;
}

export interface TransactionRecord {
  price: number;
  date: string;
  address: string;
  propertyType: string; // D=Detached, S=Semi, T=Terraced, F=Flat, O=Other
  newBuild: boolean;
  tenure: string; // F=Freehold, L=Leasehold
  category: string;
}

export interface FloodRiskData {
  floodZone: string; // 1, 2, 3, or 3b
  floodWarnings: FloodWarning[];
  nearestStation: FloodStation | null;
}

export interface FloodWarning {
  severity: string;
  severityLevel: number;
  description: string;
  area: string;
  timeRaised: string;
}

export interface FloodStation {
  stationReference: string;
  label: string;
  riverName: string;
  latestReading: {
    value: number;
    dateTime: string;
    unit: string;
  } | null;
}

export interface PlanningConstraints {
  conservationArea: boolean;
  conservationAreaName: string | null;
  listedBuilding: boolean;
  listedBuildingGrade: string | null;
  treePreservationOrder: boolean;
  article4Direction: boolean;
  article4Details: string | null;
  greenBelt: boolean;
  sssi: boolean;
  sssiName: string | null;
  aonb: boolean;
  aonbName: string | null;
  floodZone2Or3: boolean;
}

export interface NearbyPlanningApp {
  reference: string;
  description: string;
  address: string;
  status: string;
  decisionDate: string | null;
  submittedDate: string;
  distance: number; // metres from property
  url: string | null;
  authority: string;
}

export interface PropertyProfile {
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  localAuthority: string;
  uprn?: string; // OS Places unique property reference number
  epc: EPCData | null;
  transactions: TransactionRecord[];
  floodRisk: FloodRiskData | null;
  planningConstraints: PlanningConstraints | null;
  nearbyPlanningApps: NearbyPlanningApp[];
  magicDesignations: MagicDesignations | null;
}

export interface MagicDesignations {
  sssi: { name: string; condition: string } | null;
  aonb: { name: string } | null;
  nationalPark: { name: string } | null;
  greenBelt: boolean;
  ancientWoodland: boolean;
  scheduledMonument: { name: string } | null;
  ramsar: { name: string } | null;
  specialProtectionArea: { name: string } | null;
  specialAreaOfConservation: { name: string } | null;
}
