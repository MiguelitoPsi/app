import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { SuspensionCheck } from '@/components/SuspensionCheck'
import { TRPCProvider } from '@/lib/trpc/Provider'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
}

export const metadata: Metadata = {
  title: 'Nepsis - TCC Gamificada',
  description: 'Aplicativo de bem-estar psicológico gamificado para acompanhamento terapêutico',
  applicationName: 'Nepsis',
  authors: [{ name: 'Nepsis' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nepsis',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/ios/32.png', sizes: '32x32', type: 'image/png' },
      { url: '/ios/64.png', sizes: '64x64', type: 'image/png' },
      { url: '/ios/192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/ios/64.png',
    apple: [
      { url: '/ios/180.png', sizes: '180x180', type: 'image/png' },
      { url: '/ios/152.png', sizes: '152x152', type: 'image/png' },
      { url: '/ios/120.png', sizes: '120x120', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='pt-BR'>
      <body className={inter.className}>
        <TRPCProvider>
          <SuspensionCheck />
          <ServiceWorkerRegister />
          {children}
        </TRPCProvider>
      </body>
    </html>
  )
}
