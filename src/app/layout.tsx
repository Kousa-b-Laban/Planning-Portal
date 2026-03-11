import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Planning Portal - UK Property Intelligence',
  description: 'Look up any property in England. Get energy ratings, price history, flood risk, planning constraints, and AI-powered planning permission guidance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary-700">
                  PlanningPortal
                </span>
                <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                  Beta
                </span>
              </a>
              <p className="hidden text-sm text-gray-500 sm:block">
                England only &middot; Guidance, not professional advice
              </p>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-gray-200 bg-white mt-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-gray-400">
              Data from HM Land Registry, EPC Register, Environment Agency, planning.data.gov.uk, PlanIt, Natural England, TfL, Police.uk, Ofcom, DfE.
              This is guidance only &mdash; always verify with your local planning authority.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
