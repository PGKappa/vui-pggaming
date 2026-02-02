'use client'

import Image from 'next/image'
import InactivityBridge from '@/retail-components/inactivity-bridge'
import Navbar from '@/retail-components/navbar'
import { Toaster } from '@/retail-components/ui/sonner'
import ZoomBlocker from '@/retail-components/zoom-blocker'
import BetsContextProvider from '@/retail-contexts/bets-context'
import CashierContextProvider from '@/retail-contexts/cashier-context'
import EventsContextProvider from '@/retail-contexts/events-context'
import RootContextProvider, {
  RootContext,
} from '@/retail-contexts/root-context'
import SkinProvider, { SkinContext } from '@/retail-contexts/skin-context'
import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../../retail-lib/i18n'
import '../globals.css'

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

  useEffect(() => {
    localStorage.clear()
  }, [])

  return (
    <html lang={i18n.language}>
      <head>
        <title>PG Gaming</title>
        <meta name="description" content="Gaming platform" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        {/* Inline CSS per splash screen istantaneo - viene caricato PRIMA di React */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #static-splash {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: center;
                background: white;
                width: 1920px;
                height: 1020px;
              }
              #static-splash .splash-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
              }
              #static-splash .splash-logo {
                width: 400px;
                height: 150px;
                object-fit: contain;
              }
              #static-splash .splash-spinner {
                width: 64px;
                height: 64px;
                border: 4px solid #1e3a5f;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              #static-splash .splash-version {
                position: absolute;
                bottom: 32px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 14px;
                color: #6b7280;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              #static-splash.hidden {
                display: none !important;
              }
            `,
          }}
        />
      </head>
      {/* Splash screen statico inline - appare ISTANTANEAMENTE */}
      <div id="static-splash">
        <div className="splash-content">
          <Image
            src="/splashscreen.png"
            alt="PGV Virtual"
            width={400}
            height={150}
            priority
            style={{ objectFit: 'contain' }}
          />
          <div className="splash-spinner"></div>
        </div>
        <span className="splash-version">v0.1.0</span>
      </div>
      <SkinProvider>
        <SkinBody>{children}</SkinBody>
      </SkinProvider>
    </html>
  )
}

function SkinBody({ children }: { children: React.ReactNode }) {
  const [skin] = useContext(SkinContext)
  const pathname = usePathname()

  return (
    <body
      className={`${inter.variable} ${skin} flex h-screen flex-col overflow-hidden font-inter antialiased`}
    >
      <InactivityBridge />
      <ZoomBlocker />
      <CashierContextProvider>
        <EventsContextProvider key={pathname}>
          <RootContextProvider>
            <RetailShell>{children}</RetailShell>
          </RootContextProvider>
        </EventsContextProvider>
      </CashierContextProvider>
    </body>
  )
}

function RetailShell({ children }: { children: React.ReactNode }) {
  const { isLoadingEvents, upcomingEvents, eventResults } =
    useContext(RootContext)
  const [hasStartedLoading, setHasStartedLoading] = useState(false)
  const [hasInitialData, setHasInitialData] = useState(false)

  useEffect(() => {
    if (isLoadingEvents) {
      setHasStartedLoading(true)
    }
  }, [isLoadingEvents])

  useEffect(() => {
    if (
      hasStartedLoading &&
      !isLoadingEvents &&
      ((upcomingEvents?.length ?? 0) > 0 || (eventResults?.length ?? 0) > 0)
    ) {
      setHasInitialData(true)
    }
  }, [hasStartedLoading, isLoadingEvents, upcomingEvents, eventResults])

  // Nasconde lo splash screen statico quando i dati sono pronti
  useEffect(() => {
    if (hasInitialData) {
      const splash = document.getElementById('static-splash')
      if (splash) {
        splash.classList.add('hidden')
      }
    }
  }, [hasInitialData])

  const showContent = hasInitialData

  return (
    <>
      {showContent && (
        <>
          <Navbar />
          <main className="h-full gap-2 overflow-hidden">
            <div className="p-2">
              <BetsContextProvider>{children}</BetsContextProvider>
            </div>
          </main>

          <Toaster
            position={
              typeof window !== 'undefined' && window.innerWidth >= 1024
                ? 'top-right'
                : 'top-center'
            }
          />
        </>
      )}
    </>
  )
}
