import { TransactionRecord } from '@/types/property';

const SPARQL_ENDPOINT = 'https://landregistry.data.gov.uk/landregistry/query';

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
      const typeLabels = (item.propertyType as { prefLabel?: string[] })?.prefLabel;
      const estateLabels = (item.estateType as { prefLabel?: string[] })?.prefLabel;
      const catLabels = (item.transactionCategory as { prefLabel?: string[] })?.prefLabel;

      return {
        price: Number(item.pricePaid) || 0,
        date: String(item.transactionDate || ''),
        address: [addr?.paon, addr?.street, addr?.town].filter(Boolean).join(', '),
        propertyType: typeLabels?.[0] || '',
        newBuild: Boolean(item.newBuild),
        tenure: estateLabels?.[0] || '',
        category: catLabels?.[0] || '',
      };
    })
    .sort((a: TransactionRecord, b: TransactionRecord) => b.date.localeCompare(a.date));
}
