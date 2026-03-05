'use client';

import { PlanningConstraints as PlanningConstraintsType, MagicDesignations } from '@/types/property';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface PlanningConstraintsProps {
  constraints: PlanningConstraintsType | null;
  magic: MagicDesignations | null;
}

export function PlanningConstraintsCard({ constraints, magic }: PlanningConstraintsProps) {
  if (!constraints && !magic) {
    return (
      <Card title="Planning Constraints" status="unavailable">
        <p className="text-sm text-gray-500">Planning constraint data unavailable.</p>
      </Card>
    );
  }

  const items: Array<{ label: string; active: boolean; detail?: string; variant: 'danger' | 'warning' | 'success' }> = [];

  if (constraints) {
    items.push({
      label: 'Conservation Area',
      active: constraints.conservationArea,
      detail: constraints.conservationAreaName || undefined,
      variant: constraints.conservationArea ? 'danger' : 'success',
    });
    items.push({
      label: 'Listed Building',
      active: constraints.listedBuilding,
      detail: constraints.listedBuildingGrade ? `Grade ${constraints.listedBuildingGrade}` : undefined,
      variant: constraints.listedBuilding ? 'danger' : 'success',
    });
    items.push({
      label: 'Article 4 Direction',
      active: constraints.article4Direction,
      detail: constraints.article4Details || undefined,
      variant: constraints.article4Direction ? 'warning' : 'success',
    });
    items.push({
      label: 'Tree Preservation Order',
      active: constraints.treePreservationOrder,
      variant: constraints.treePreservationOrder ? 'warning' : 'success',
    });
    items.push({
      label: 'Green Belt',
      active: constraints.greenBelt,
      variant: constraints.greenBelt ? 'warning' : 'success',
    });
  }

  if (magic) {
    if (magic.sssi) {
      items.push({ label: 'SSSI', active: true, detail: magic.sssi.name, variant: 'danger' });
    }
    if (magic.aonb) {
      items.push({ label: 'AONB / National Landscape', active: true, detail: magic.aonb.name, variant: 'warning' });
    }
    if (magic.nationalPark) {
      items.push({ label: 'National Park', active: true, detail: magic.nationalPark.name, variant: 'warning' });
    }
    if (magic.ancientWoodland) {
      items.push({ label: 'Ancient Woodland', active: true, variant: 'warning' });
    }
    if (magic.scheduledMonument) {
      items.push({ label: 'Scheduled Monument', active: true, detail: magic.scheduledMonument.name, variant: 'danger' });
    }
  }

  return (
    <Card title="Planning Constraints" subtitle="planning.data.gov.uk + Natural England MAGIC">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{item.label}</span>
            <div className="flex items-center gap-2">
              {item.detail && (
                <span className="text-xs text-gray-500">{item.detail}</span>
              )}
              <Badge
                label={item.active ? 'Yes' : 'No'}
                variant={item.variant}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Data may be incomplete. Always verify constraints with your local planning authority.
      </p>
    </Card>
  );
}
