import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from '@/lib/query-client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orca-network.vercel.app'),
  title: {
    default: '0rca Cronos - AI Agent Marketplace',
    template: '%s | 0rca Cronos',
  },
  description: 'Comprehensive AI agent marketplace built with Next.js 14. Create, deploy, and monetize AI agents. Execute complex tasks with agent orchestration, DAO governance, and token staking.',
  keywords: ['AI agents', 'marketplace', 'orchestration', 'DAO', 'blockchain', 'Next.js', 'TypeScript', 'Supabase', 'agent network', 'AI automation'],
  authors: [{ name: '0rca Cronos' }],
  creator: '0rca Cronos',
  icons: {
    icon: '/0rca_white.png',
    shortcut: '/0rca_white.png',
    apple: '/0rca_white.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://orca-network.vercel.app',
    title: '0rca Cronos - AI Agent Marketplace',
    description: 'Create, deploy, and monetize AI agents. Execute complex tasks with intelligent agent orchestration.',
    siteName: '0rca Cronos',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: '0rca Cronos Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '0rca Cronos - AI Agent Marketplace',
    description: 'Create, deploy, and monetize AI agents with intelligent orchestration.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/0rca_white.png" type="image/png" sizes="64x64" />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}