'use client';

import { CrimeSummary } from '@/types/property';
import { Card } from '@/components/ui/Card';

interface CrimeCardProps {
  crime: CrimeSummary | null;
}

export function CrimeCard({ crime }: CrimeCardProps) {
  if (!crime) {
    return (
      <Card title="Local Crime" status="unavailable">
        <p className="text-sm text-gray-500">Crime data unavailable.</p>
      </Card>
    );
  }

  const periodFormatted = formatPeriod(crime.period);

  return (
    <Card title="Local Crime" subtitle={`Police.uk \u2014 ${periodFormatted}`}>
      <div className="space-y-3">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{crime.totalCrimes}</span> reported
          crimes within approx. 1 mile
        </p>

        <div className="space-y-1.5">
          {crime.categories.slice(0, 8).map((cat) => (
            <div key={cat.category} className="flex items-center justify-between">
              <span className="text-xs text-gray-600 truncate mr-2">
                {cat.category}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-1.5 rounded-full bg-gray-200 w-20">
                  <div
                    className="h-1.5 rounded-full bg-blue-500"
                    style={{
                      width: `${Math.min(100, (cat.count / crime.categories[0].count) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-6 text-right">
                  {cat.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function formatPeriod(period: string): string {
  if (!period) return '';
  const [year, month] = period.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
