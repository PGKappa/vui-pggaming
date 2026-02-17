'use client'

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
import { useContext, useEffect } from 'react'
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
                opacity: 0;
                transition: opacity 0.2s ease-in;
              }
              #static-splash .splash-version.loaded {
                opacity: 1;
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/splashscreen.png"
            alt="PGV Virtual"
            className="splash-logo"
            style={{ objectFit: 'contain', width: 400, height: 150 }}
          />
          <div className="splash-spinner"></div>
        </div>
        <span className="splash-version"></span>
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
      {/* Toaster globale - visibile anche durante lo splash screen */}
      <Toaster position="top-right" />
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

// Flag globale per tracciare se l'app è già stata caricata una volta
let hasAppLoaded = false

function RetailShell({ children }: { children: React.ReactNode }) {
  const {
    isLoadingEvents,
    upcomingEvents,
    eventResults,
    getVersion,
    getSplashscreen,
  } = useContext(RootContext)

  // Update splash screen with API data
  useEffect(() => {
    const version = getVersion?.() || 'v0.1.0'
    const splashscreenImage = getSplashscreen?.() || 'splashscreen.png'

    // Update version text
    const versionElement = document.querySelector(
      '#static-splash .splash-version',
    )
    if (versionElement) {
      versionElement.textContent = version
      versionElement.classList.add('loaded')
    }

    // Update splash image
    const logoElement = document.querySelector(
      '#static-splash .splash-logo',
    ) as HTMLImageElement
    if (logoElement && splashscreenImage) {
      // Handle case where path may or may not start with /
      const imagePath = splashscreenImage.startsWith('/')
        ? splashscreenImage
        : `/${splashscreenImage}`
      logoElement.src = imagePath
    }
  }, [getVersion, getSplashscreen])

  useEffect(() => {
    // Solo al primo caricamento
    if (
      !hasAppLoaded &&
      !isLoadingEvents &&
      ((upcomingEvents?.length ?? 0) > 0 || (eventResults?.length ?? 0) > 0)
    ) {
      hasAppLoaded = true

      // Nasconde lo splash screen statico
      const splash = document.getElementById('static-splash')
      if (splash) {
        splash.classList.add('hidden')
      }
    }
  }, [isLoadingEvents, upcomingEvents, eventResults])

  return (
    <>
      <Navbar />
      <main className="h-full gap-2 overflow-hidden">
        <div className="p-2">
          <BetsContextProvider>{children}</BetsContextProvider>
        </div>
      </main>
    </>
  )
}
