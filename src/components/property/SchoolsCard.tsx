'use client';

import { NearbySchool } from '@/types/property';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface SchoolsCardProps {
  schools: NearbySchool[];
}

export function SchoolsCard({ schools }: SchoolsCardProps) {
  if (schools.length === 0) {
    return (
      <Card title="Nearby Schools" status="unavailable">
        <p className="text-sm text-gray-500">No school data available.</p>
      </Card>
    );
  }

  const primary = schools.filter((s) => s.phase === 'Primary' || s.phase === 'Nursery');
  const secondary = schools.filter(
    (s) => s.phase === 'Secondary' || s.phase === 'Sixth Form' || s.phase === 'All-through'
  );
  const special = schools.filter((s) => s.phase === 'Special');

  return (
    <Card title="Nearby Schools" subtitle="DfE Get Information About Schools">
      <div className="space-y-4">
        {primary.length > 0 && (
          <SchoolGroup label="Primary" schools={primary} />
        )}
        {secondary.length > 0 && (
          <SchoolGroup label="Secondary" schools={secondary} />
        )}
        {special.length > 0 && (
          <SchoolGroup label="Special" schools={special} />
        )}
      </div>
    </Card>
  );
}

function SchoolGroup({ label, schools }: { label: string; schools: NearbySchool[] }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <div className="space-y-2">
        {schools.slice(0, 5).map((school) => (
          <div
            key={school.urn}
            className="flex items-start justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="text-sm text-gray-900 truncate">{school.name}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {school.ofstedRating && (
                  <Badge
                    label={school.ofstedRating}
                    variant={ofstedVariant(school.ofstedRating)}
                  />
                )}
                {school.ageRange && (
                  <span className="text-xs text-gray-400">
                    Ages {school.ageRange}
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 text-xs text-gray-400">
              {school.distance}m
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ofstedVariant(
  rating: string
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (rating) {
    case 'Outstanding':
      return 'success';
    case 'Good':
      return 'info';
    case 'Requires Improvement':
      return 'warning';
    case 'Inadequate':
      return 'danger';
    default:
      return 'neutral';
  }
}
