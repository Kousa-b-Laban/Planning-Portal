export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatAddress(address: string): string {
  // Normalize address: title case, clean up extra whitespace
  return address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(', ');
}

export function getEPCRatingClass(rating: string): string {
  const r = rating.toUpperCase();
  const classes: Record<string, string> = {
    A: 'epc-a',
    B: 'epc-b',
    C: 'epc-c',
    D: 'epc-d',
    E: 'epc-e',
    F: 'epc-f',
    G: 'epc-g',
  };
  return classes[r] || 'bg-gray-400';
}

export function propertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    D: 'Detached',
    S: 'Semi-detached',
    T: 'Terraced',
    F: 'Flat/Maisonette',
    O: 'Other',
  };
  return labels[type] || type;
}

export function tenureLabel(tenure: string): string {
  const labels: Record<string, string> = {
    F: 'Freehold',
    L: 'Leasehold',
    U: 'Unknown',
  };
  return labels[tenure] || tenure;
}
