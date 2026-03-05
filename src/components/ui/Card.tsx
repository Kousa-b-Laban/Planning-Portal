'use client';

interface CardProps {
  title: string;
  subtitle?: string;
  status?: 'available' | 'unavailable' | 'loading';
  children: React.ReactNode;
}

export function Card({ title, subtitle, status, children }: CardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        {status === 'unavailable' && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            Unavailable
          </span>
        )}
        {status === 'loading' && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
            Loading...
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
