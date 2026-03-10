'use client'

import Navbar from '@/virtual-components/navbar'
import { Toaster } from '@/virtual-components/ui/sonner'
import BetsContextProvider from '@/virtual-contexts/bets-context'
import CashierContextProvider from '@/virtual-contexts/cashier-context'
import EventsContextProvider from '@/virtual-contexts/events-context'
import RootContextProvider from '@/virtual-contexts/root-context'
import SkinProvider, { SkinContext } from '@/virtual-contexts/skin-context'
import { Geist, Geist_Mono } from 'next/font/google'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import '../../globals.css'
import '../../../virtual-lib/i18n'

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
        <CashierContextProvider>
          <EventsContextProvider>
            <RootContextProvider>
              <BetsContextProvider>{children}</BetsContextProvider>
            </RootContextProvider>
          </EventsContextProvider>
        </CashierContextProvider>
      </main>

      <Toaster
        position={
          typeof window !== 'undefined' && window.innerWidth >= 1024
            ? 'top-right'
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
