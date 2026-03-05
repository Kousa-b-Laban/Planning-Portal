'use client';

import { NearbyPlanningApp } from '@/types/property';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/formatting';

interface NearbyPlanningProps {
  apps: NearbyPlanningApp[];
}

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const s = status.toLowerCase();
  if (s.includes('approved') || s.includes('granted') || s.includes('permitted')) return 'success';
  if (s.includes('refused') || s.includes('rejected') || s.includes('withdrawn')) return 'danger';
  if (s.includes('pending') || s.includes('registered') || s.includes('under')) return 'warning';
  return 'neutral';
}

export function NearbyPlanning({ apps }: NearbyPlanningProps) {
  if (apps.length === 0) {
    return (
      <Card title="Nearby Planning Applications" status="unavailable">
        <p className="text-sm text-gray-500">No recent planning applications found nearby.</p>
      </Card>
    );
  }

  return (
    <Card title="Nearby Planning Applications" subtitle={`${apps.length} in the last 90 days (within 500m)`}>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {apps.map((app) => (
          <div key={app.reference} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-900 line-clamp-2">{app.description}</p>
              <Badge label={app.status} variant={statusVariant(app.status)} />
            </div>
            <p className="mt-1 text-xs text-gray-500">{app.address}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
              <span>{formatDate(app.submittedDate)}</span>
              <span>{Math.round(app.distance)}m away</span>
              <span>{app.authority}</span>
              {app.url && (
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  View
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
