import { CrimeSummary } from '@/types/property';

const BASE_URL = 'https://data.police.uk/api';

/**
 * Police.uk API — street-level crime data near a point.
 * Free, no authentication required.
 * Returns crimes within a 1-mile radius for the latest available month.
 */
export async function getCrimeSummary(
  lat: number,
  lng: number
): Promise<CrimeSummary | null> {
  try {
    // Get street-level crimes at this point (latest month)
    const res = await fetch(
      `${BASE_URL}/crimes-street/all-crime?lat=${lat}&lng=${lng}`,
      { next: { revalidate: 60 * 60 * 24 * 7 } } // Cache 7 days
    );

    if (!res.ok) return null;

    const crimes: { category: string; month: string }[] = await res.json();
    if (!Array.isArray(crimes) || crimes.length === 0) return null;

    // Count by category
    const counts = new Map<string, number>();
    let period = '';
    for (const crime of crimes) {
      period = crime.month; // All should be same month
      counts.set(crime.category, (counts.get(crime.category) || 0) + 1);
    }

    const categories = Array.from(counts.entries())
      .map(([category, count]) => ({
        category: formatCrimeCategory(category),
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalCrimes: crimes.length,
      period,
      categories,
    };
  } catch {
    return null;
  }
}

function formatCrimeCategory(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
