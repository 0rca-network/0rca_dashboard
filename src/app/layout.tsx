import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from '@/lib/query-client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orca-network.vercel.app'),
  title: {
    default: 'Orca Network - AI Agent Marketplace',
    template: '%s | Orca Network',
  },
  description: 'Comprehensive AI agent marketplace built with Next.js 14. Create, deploy, and monetize AI agents. Execute complex tasks with agent orchestration, DAO governance, and token staking.',
  keywords: ['AI agents', 'marketplace', 'orchestration', 'DAO', 'blockchain', 'Next.js', 'TypeScript', 'Supabase', 'agent network', 'AI automation'],
  authors: [{ name: 'Orca Network' }],
  creator: 'Orca Network',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://orca-network.vercel.app',
    title: 'Orca Network - AI Agent Marketplace',
    description: 'Create, deploy, and monetize AI agents. Execute complex tasks with intelligent agent orchestration.',
    siteName: 'Orca Network',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Orca Network Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orca Network - AI Agent Marketplace',
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
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}