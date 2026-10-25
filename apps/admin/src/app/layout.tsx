import type { Metadata } from 'next';
import { siteName } from '@levelup/shared';
import './globals.css';

export const metadata: Metadata = {
  title: `${siteName()} — Panel`,
  description: 'Panel de administración de recargas',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
