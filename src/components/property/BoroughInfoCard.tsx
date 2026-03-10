'use client';

import { BoroughInfo } from '@/types/property';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface BoroughInfoCardProps {
  borough: BoroughInfo | null;
}

export function BoroughInfoCard({ borough }: BoroughInfoCardProps) {
  if (!borough) return null;

  return (
    <Card title={`${borough.name} Council`} subtitle="Borough-specific planning info">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">CIL rate (residential)</p>
            <p className="text-sm font-medium text-gray-900">
              £{borough.cilRateResidential}/m²
            </p>
            <p className="text-xs text-gray-400">
              + £{borough.mayoralCilRate}/m² Mayoral CIL
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Conservation areas</p>
            <p className="text-sm font-medium text-gray-900">
              {borough.conservationAreaCount} in borough
            </p>
          </div>
        </div>

        {borough.article4Count > 0 && (
          <div className="flex items-center gap-2">
            <Badge label={`${borough.article4Count} Article 4 directions`} variant="warning" />
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={borough.planningPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 hover:underline"
          >
            Search planning applications
          </a>
          {borough.planningContact.email && (
            <>
              <span className="text-xs text-gray-300">|</span>
              <a
                href={`mailto:${borough.planningContact.email}`}
                className="text-xs text-primary-600 hover:underline"
              >
                Email planning team
              </a>
            </>
          )}
          {borough.planningContact.phone && (
            <>
              <span className="text-xs text-gray-300">|</span>
              <span className="text-xs text-gray-500">
                {borough.planningContact.phone}
              </span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
