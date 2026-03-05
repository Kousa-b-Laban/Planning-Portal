// Raw API response types for external APIs

export interface PostcodesIOResponse {
  status: number;
  result: {
    postcode: string;
    latitude: number;
    longitude: number;
    admin_district: string;
    parliamentary_constituency: string;
    region: string;
    country: string;
    codes: {
      admin_district: string;
      parish: string;
    };
  } | null;
}

export interface EPCSearchResponse {
  'column-names': string[];
  rows: EPCRow[];
  'search-results': {
    'search-count': number;
  };
}

export interface EPCRow {
  'lmk-key': string;
  address: string;
  'address1': string;
  'address2': string;
  'address3': string;
  postcode: string;
  'building-reference-number': string;
  'current-energy-rating': string;
  'current-energy-efficiency': string;
  'potential-energy-rating': string;
  'potential-energy-efficiency': string;
  'property-type': string;
  'built-form': string;
  'inspection-date': string;
  'lodgement-date': string;
  'transaction-type': string;
  'total-floor-area': string;
  'construction-age-band': string;
  tenure: string;
  'walls-description': string;
  'roof-description': string;
  'windows-description': string;
  'mainheat-description': string;
  'hot-water-description': string;
  'floor-description': string;
  'co2-emissions-current': string;
  'co2-emiss-curr-per-floor-area': string;
  'local-authority-label': string;
  [key: string]: string;
}

export interface LandRegistryPPDResult {
  'result': {
    'items': Array<{
      'pricePaid': number;
      'transactionDate': string;
      'propertyAddress': {
        'paon': string;
        'saon': string;
        'street': string;
        'town': string;
        'postcode': string;
      };
      'propertyType': { 'prefLabel': string[] };
      'newBuild': boolean;
      'estateType': { 'prefLabel': string[] };
      'transactionCategory': { 'prefLabel': string[] };
    }>;
  };
}

export interface FloodMonitoringResponse {
  items: Array<{
    '@id': string;
    severity: string;
    severityLevel: number;
    description: string;
    floodArea: {
      label: string;
    };
    timeRaised: string;
  }>;
}

export interface FloodStationResponse {
  items: Array<{
    stationReference: string;
    label: string;
    riverName: string;
    lat: number;
    long: number;
    measures: Array<{
      latestReading: {
        value: number;
        dateTime: string;
      };
      unitName: string;
    }>;
  }>;
}

export interface PlanItResponse {
  applications: Array<{
    uid: string;
    description: string;
    address: string;
    status: string;
    decision_date: string | null;
    received_date: string;
    url: string | null;
    authority_name: string;
    distance: number;
  }>;
}
