/** Borough-level configuration for enriched property data and AI context. */

export interface BoroughConfig {
  /** Official local authority name (must match Postcodes.io admin_district) */
  name: string;
  /** London borough code (e.g. 'hackney', 'camden') */
  slug: string;
  /** URL of the council's planning applications search */
  planningPortalUrl: string;
  /** CIL rate in £/m² for residential development (Zone 1 if zoned) */
  cilRateResidential: number;
  /** CIL rate in £/m² for other development */
  cilRateOther: number;
  /** Mayoral CIL rate in £/m² */
  mayoralCilRate: number;
  /** Key local plan policies relevant to householder applications */
  localPlanPolicies: LocalPlanPolicy[];
  /** Borough-wide Article 4 directions (area-specific ones come from the API) */
  article4Directions: Article4Direction[];
  /** Council-specific permitted development notes */
  pdNotes: string[];
  /** Conservation areas the council maintains — used for additional context */
  conservationAreaCount: number;
  /** Council contact for planning enquiries */
  planningContact: {
    phone?: string;
    email?: string;
    url: string;
  };
}

export interface LocalPlanPolicy {
  /** Policy reference (e.g. 'LP1', 'DM4') */
  ref: string;
  /** Short description */
  title: string;
  /** Key requirements relevant to householder applications */
  summary: string;
}

export interface Article4Direction {
  /** Area or street name covered */
  area: string;
  /** What PD rights are removed */
  rightsRemoved: string;
  /** Date the direction was confirmed */
  dateConfirmed?: string;
}
