import { BoroughConfig } from './types';

/** Hackney borough configuration — London Borough of Hackney Local Plan 2033 */
export const hackney: BoroughConfig = {
  name: 'Hackney',
  slug: 'hackney',
  planningPortalUrl: 'https://planning.hackney.gov.uk/planning/search-applications',
  cilRateResidential: 190, // £/m² (Zone 1 — most of Hackney)
  cilRateOther: 15,
  mayoralCilRate: 80, // Band 2
  localPlanPolicies: [
    {
      ref: 'LP1',
      title: 'Design Quality and Local Character',
      summary:
        'Development must be of high quality, respond positively to local character, and protect amenity of neighbours. Extensions should be subordinate to the host building.',
    },
    {
      ref: 'LP2',
      title: 'Development and Amenity',
      summary:
        'No unacceptable impacts on daylight, sunlight, privacy, outlook, or noise. Rear extensions must maintain a minimum 10.5m back-to-back distance.',
    },
    {
      ref: 'LP4',
      title: 'Biodiversity and Green Infrastructure',
      summary:
        'Urban greening factor applies: new development must achieve a UGF score of 0.4 (residential). Green roofs and planting encouraged.',
    },
    {
      ref: 'LP47',
      title: 'Housing Extensions and Alterations',
      summary:
        'Extensions must be subordinate in scale and form to the original dwelling. Roof extensions must not significantly alter the roofline. Basements must comply with LP48.',
    },
    {
      ref: 'LP48',
      title: 'Basement Development',
      summary:
        'Basements must not exceed 50% of the garden footprint or extend under the public highway. Structural methodology statement required. Maximum one storey below ground.',
    },
    {
      ref: 'LP52',
      title: 'Trees and Landscaping',
      summary:
        'Mature trees must be retained where possible. Replacement planting required if removal is justified. Tree surveys needed for applications near significant trees.',
    },
  ],
  article4Directions: [
    {
      area: 'Borough-wide (flats)',
      rightsRemoved:
        'Change of use from C3 (dwelling) to C4 (HMO) without planning permission',
      dateConfirmed: '2012-04-01',
    },
    {
      area: 'Dalston, Hackney Central, Stoke Newington',
      rightsRemoved:
        'Removal of PD rights for commercial-to-residential conversion (Class MA) in designated town centres',
      dateConfirmed: '2022-07-01',
    },
    {
      area: 'Multiple conservation areas',
      rightsRemoved:
        'Removal of PD rights for alterations to front elevations, boundary treatments, painting, and satellite dishes in conservation areas',
    },
  ],
  pdNotes: [
    'Hackney has 29 conservation areas — check if the property is within one, as PD rights are significantly restricted.',
    'Hackney requires planning permission for basement extensions in most cases (Local Plan policy LP48).',
    'The borough has a 10.5m minimum back-to-back privacy distance (LP2) which may constrain rear extensions even under PD.',
    'Hackney applies the Urban Greening Factor (UGF) to extensions that require planning permission — green roofs and planting may be conditions.',
  ],
  conservationAreaCount: 29,
  planningContact: {
    email: 'planning@hackney.gov.uk',
    phone: '020 8356 8062',
    url: 'https://hackney.gov.uk/planning',
  },
};
