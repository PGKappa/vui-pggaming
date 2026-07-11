'use client'

import InactivityBridge from '@/retail-components/inactivity-bridge'
import Navbar from '@/retail-components/navbar'
import { Toaster } from '@/retail-components/ui/sonner'
import UrlDebugBar from '@/retail-components/url-debug-bar'
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
    <html lang={i18n.language} className="retail-app">
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
                justify-content: center;
                background: white;
                width: 100%;
                height: 100%;
              }
              #static-splash .splash-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 32px;
              }
              #static-splash .splash-logo {
                display: none;
                width: 400px;
                height: 200px;
                object-fit: contain;
              }
              #static-splash.has-image .splash-logo {
                display: block;
              }
              #static-splash .splash-spinner {
                position: absolute;
                top: 50%;
                left: 50%;
                margin-top: -32px;
                margin-left: -32px;
                width: 64px;
                height: 64px;
                border: 4px solid #1e3a5f;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              #static-splash.has-image .splash-spinner {
                position: static;
                margin-top: 0;
                margin-left: 0;
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
      {/* Splash screen statico inline - appare ISTANTANEAMENTE */}
      <div id="static-splash">
        <div className="splash-content">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/splashscreen-empty.png"
            alt=""
            className="splash-logo"
            style={{ objectFit: 'contain', width: 600, height: 400 }}
          />
          <div className="splash-spinner"></div>
        </div>
      </div>
      {/* Toaster globale - visibile anche durante lo splash screen */}
      <Toaster position="top-right" />
      <InactivityBridge />
      <ZoomBlocker />
      <CashierContextProvider>
        <EventsContextProvider key={pathname}>
          {/* Barra di debug — visibile SOLO con debug=1 nell'URL.*/}
          <UrlDebugBar />
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
    isLoadingCashier,
    upcomingEvents,
    eventResults,
    getSplashscreen,
  } = useContext(RootContext)

  // Carica splash personalizzato dall'API, se presente
  useEffect(() => {
    const splashscreenImage = getSplashscreen?.() || 'splashscreen-empty.png'
    const logoElement = document.querySelector(
      '#static-splash .splash-logo',
    ) as HTMLImageElement
    const splashElement = document.getElementById('static-splash')

    const hasRealImage =
      splashscreenImage && !splashscreenImage.includes('empty')

    if (logoElement && hasRealImage) {
      const isAbsoluteUrl = /^https?:\/\//i.test(splashscreenImage)
      const imagePath = isAbsoluteUrl
        ? splashscreenImage
        : splashscreenImage.startsWith('/')
          ? splashscreenImage
          : `/${splashscreenImage}`
      const preloadImg = new Image()
      preloadImg.onload = () => {
        logoElement.src = imagePath
        splashElement?.classList.add('has-image')
      }
      preloadImg.src = imagePath
    } else if (logoElement) {
      logoElement.style.display = 'none'
    }
  }, [isLoadingCashier, getSplashscreen])

  useEffect(() => {
    // Solo al primo caricamento
    if (
      !hasAppLoaded &&
      !isLoadingEvents &&
      !isLoadingCashier &&
      ((upcomingEvents?.length ?? 0) > 0 || (eventResults?.length ?? 0) > 0)
    ) {
      hasAppLoaded = true

      // Breve pausa prima di nascondere lo splash
      setTimeout(() => {
        // Nasconde lo splash screen statico
        const splash = document.getElementById('static-splash')
        if (splash) {
          splash.classList.add('hidden')
        }
      }, 900)
    }
  }, [isLoadingEvents, isLoadingCashier, upcomingEvents, eventResults])

  return (
    <>
      <Navbar />
      <main className="retail-main-scroll h-full min-w-[1280px] gap-2 overflow-hidden">
        <div className="retail-main-inner h-full p-2">
          <BetsContextProvider>{children}</BetsContextProvider>
        </div>
      </main>
    </>
  )
}
