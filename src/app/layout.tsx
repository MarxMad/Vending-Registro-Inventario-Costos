import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';

import '~/app/globals.css';
import { Providers } from '~/app/providers';
import { APP_NAME, APP_DESCRIPTION, APP_URL } from '~/lib/constants';

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: {
    icon: [
      { url: '/VendingLogo3D.png', sizes: 'any' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/VendingLogo3D.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/VendingLogo3D.png',
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    images: [
      {
        url: '/VendingLogo3D.png',
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ['/VendingLogo3D.png'],
  },
  manifest: '/manifest.json',
  metadataBase: new URL(APP_URL),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
