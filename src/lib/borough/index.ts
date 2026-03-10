import { BoroughConfig } from './types';
import { hackney } from './hackney';

/**
 * Borough config registry.
 * Keyed by local authority name as returned by Postcodes.io admin_district.
 * Add new boroughs by creating a config file and registering it here.
 */
const boroughRegistry: Record<string, BoroughConfig> = {
  Hackney: hackney,
};

/**
 * Look up borough-specific config by local authority name.
 * Returns null for boroughs not yet configured (graceful fallback).
 */
export function getBoroughConfig(
  localAuthority: string
): BoroughConfig | null {
  return boroughRegistry[localAuthority] || null;
}

/**
 * Check if a local authority has borough-specific config available.
 */
export function hasBoroughConfig(localAuthority: string): boolean {
  return localAuthority in boroughRegistry;
}

export type { BoroughConfig, LocalPlanPolicy, Article4Direction } from './types';
