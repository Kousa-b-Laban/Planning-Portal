import { TransactionRecord } from '@/types/property';

const SPARQL_ENDPOINT = 'https://landregistry.data.gov.uk/landregistry/query';

/**
 * Extract a human-readable label from a Land Registry linked data object.
 * The API returns prefLabel as either a string, an array of strings,
 * or an array of {_value, _lang} objects.
 */
function extractPrefLabel(obj: unknown): string {
  if (!obj || typeof obj !== 'object') return '';
  const linked = obj as Record<string, unknown>;
  const label = linked.prefLabel;
  if (!label) return '';
  if (typeof label === 'string') return label;
  if (Array.isArray(label)) {
    const first = label[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      return String((first as Record<string, unknown>)._value || (first as Record<string, unknown>).value || first);
    }
  }
  return String(label);
}

export async function getTransactionHistory(
  postcode: string,
  addressParts: string
): Promise<TransactionRecord[]> {
  // Normalize the address parts for matching
  const normalizedParts = addressParts.toUpperCase().trim();

  // Use the REST API for simpler queries
  const encodedPostcode = encodeURIComponent(postcode.trim());
  const res = await fetch(
    `https://landregistry.data.gov.uk/data/ppi/transaction-record.json?propertyAddress.postcode=${encodedPostcode}&_pageSize=50&_sort=-transactionDate`,
    {
      next: { revalidate: 60 * 60 * 24 }, // Cache 24 hours
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const items = data?.result?.items;
  if (!Array.isArray(items)) return [];

  // Filter to matching address and map
  return items
    .filter((item: Record<string, unknown>) => {
      const addr = item.propertyAddress as Record<string, unknown> | undefined;
      if (!addr) return false;
      const paon = String(addr.paon || '').toUpperCase();
      const street = String(addr.street || '').toUpperCase();
      // Match if the normalizedParts contains the house number/name
      return normalizedParts.includes(paon) || paon.includes(normalizedParts.split(',')[0]?.trim() || '');
    })
    .map((item: Record<string, unknown>) => {
      const addr = item.propertyAddress as Record<string, string>;

      return {
        price: Number(item.pricePaid) || 0,
        date: String(item.transactionDate || ''),
        address: [addr?.paon, addr?.street, addr?.town].filter(Boolean).join(', '),
        propertyType: extractPrefLabel(item.propertyType) || '',
        newBuild: Boolean(item.newBuild),
        tenure: extractPrefLabel(item.estateType) || '',
        category: extractPrefLabel(item.transactionCategory) || '',
      };
    })
    .sort((a: TransactionRecord, b: TransactionRecord) => b.date.localeCompare(a.date));
}
