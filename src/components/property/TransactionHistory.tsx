'use client';

import { TransactionRecord } from '@/types/property';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate, tenureLabel } from '@/lib/utils/formatting';

interface TransactionHistoryProps {
  transactions: TransactionRecord[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <Card title="Price History" status="unavailable">
        <p className="text-sm text-gray-500">No transaction records found in Land Registry data.</p>
      </Card>
    );
  }

  return (
    <Card title="Price History" subtitle={`${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} found`}>
      <div className="space-y-2">
        {transactions.map((tx, i) => (
          <div
            key={`${tx.date}-${tx.price}-${i}`}
            className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(tx.price)}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(tx.date)}
                {tx.tenure ? ` · ${tenureLabel(tx.tenure)}` : ''}
                {tx.newBuild ? ' · New build' : ''}
              </p>
            </div>
            {i === 0 && transactions.length > 1 && (
              <span className="text-xs text-gray-400">Latest</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
