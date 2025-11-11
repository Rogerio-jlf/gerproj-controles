import type { Metadata, Viewport } from 'next';
import { Kodchasan } from 'next/font/google';
import { ClientProviders } from '../app/ClientProvider'; // importe correto
import './globals.css';

const kodchasan = Kodchasan({
  variable: '--font-kodchasan',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// ✅ Export de metadata (sem themeColor)
export const metadata: Metadata = {
  title: 'Solutii - Dashboard Cliente',
  description: 'Painel de controle para clientes da Solutii',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/icon1.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
    other: [
      {
        rel: 'mask-icon',
        url: '/icon0.svg',
        color: '#ffffff',
      },
    ],
  },
};

// ✅ Novo export para o tema da barra de status do navegador
export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${kodchasan.variable} antialiased`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
