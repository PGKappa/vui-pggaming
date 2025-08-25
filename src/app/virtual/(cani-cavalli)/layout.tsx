'use client'

import Navbar from '@/components/navbar'
import { Toaster } from '@/components/ui/sonner'
import BetsContextProvider from '@/contexts/bets-context'
import RootContextProvider from '@/contexts/root-context'
import SkinProvider, { SkinContext } from '@/contexts/skin-context'
import { Geist, Geist_Mono } from 'next/font/google'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import '../../globals.css'
import './i18n'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const metadata = {
  title: 'PG Gaming',
  description: 'Gaming platform',
}

function AppContent({ children }: { children: React.ReactNode }) {
  const [skin] = useContext(SkinContext)
  return (
    <body
      className={`${geistSans.variable} ${geistMono.variable} ${skin} flex h-screen flex-col antialiased`}
    >
      <header className="container">
        <Navbar />
      </header>
      <main className="flex-1">
        <RootContextProvider>
          <BetsContextProvider>{children}</BetsContextProvider>
        </RootContextProvider>
      </main>

      <Toaster
        position={
          typeof window !== 'undefined' && window.innerWidth >= 1024
            ? 'bottom-right'
            : 'top-center'
        }
      />
    </body>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { i18n } = useTranslation()

  return (
    <html lang={i18n.language}>
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <SkinProvider>
        <AppContent>{children}</AppContent>
      </SkinProvider>
    </html>
  )
}
