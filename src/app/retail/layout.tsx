'use client'

import Navbar from '@/retail-components/navbar'
import { Toaster } from '@/retail-components/ui/sonner'
import InactivityBridge from '@/retail-components/inactivity-bridge'
import BetsContextProvider from '@/retail-contexts/bets-context'
import CashierContextProvider from '@/retail-contexts/cashier-context'
import EventsContextProvider from '@/retail-contexts/events-context'
import RootContextProvider from '@/retail-contexts/root-context'
import SkinProvider, { SkinContext } from '@/retail-contexts/skin-context'
import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import '../globals.css'
import '../../retail-lib/i18n'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export default function RetailLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { i18n } = useTranslation()

  return (
    <html lang={i18n.language}>
      <head>
        <title>PG Gaming</title>
        <meta name="description" content="Gaming platform" />
      </head>
      <SkinProvider>
        <SkinBody>{children}</SkinBody>
      </SkinProvider>
    </html>
  )
}

function SkinBody({ children }: { children: React.ReactNode }) {
  const [skin] = useContext(SkinContext)
  const pathname = usePathname()

  console.log(`[Layout] Current pathname: ${pathname}`)

  return (
    <body
      className={`${inter.variable} ${skin} flex h-screen flex-col font-inter antialiased`}
    >
      <InactivityBridge />
      <CashierContextProvider>
        <EventsContextProvider key={pathname}>
          <RootContextProvider>
            <Navbar />
            <main className="h-full gap-2 overflow-hidden">
              <div className="p-2">
                <BetsContextProvider>{children}</BetsContextProvider>
              </div>
            </main>

            <Toaster
              position={
                typeof window !== 'undefined' && window.innerWidth >= 1024
                  ? 'bottom-right'
                  : 'top-center'
              }
            />
          </RootContextProvider>
        </EventsContextProvider>
      </CashierContextProvider>
    </body>
  )
}
