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
                justify-content: center;
                background: white;
                width: 1920px;
                height: 1020px;
              }
              #static-splash .splash-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
              }
              #static-splash .splash-logo {
                width: 400px;
                height: 150px;
                object-fit: contain;
                opacity: 0;
                transition: opacity 0.2s ease-in;
              }
              #static-splash .splash-logo.loaded {
                opacity: 1;
              }
              #static-splash .splash-spinner {
                position: absolute;
                top: 60%;
                left: 48%;
                width: 64px;
                height: 64px;
                border: 4px solid #1e3a5f;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              #static-splash .splash-versions {
                position: absolute;
                bottom: 32px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                font-size: 14px;
                color: #6b7280;
                opacity: 0;
                transition: opacity 0.2s ease-in;
              }
              #static-splash .splash-versions.loaded {
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
            alt="PGV Virtual"
            className="splash-logo"
            style={{ objectFit: 'contain', width: 400, height: 150 }}
          />
          <div className="splash-spinner"></div>
        </div>
        <span className="splash-version"></span>
      </div>
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
    isLoadingCashier,
    upcomingEvents,
    eventResults,
    getVersion,
    getSplashscreen,
  } = useContext(RootContext)

  const feVersion = process.env.NEXT_PUBLIC_FE_VERSION || 'dev'

  // Update splash screen with API data
  useEffect(() => {
    const apiVersion = getVersion?.() || 'v1.0'
    const splashscreenImage = getSplashscreen?.() || 'splashscreen-empty.png'

    // Update version text
    const versionsContainer = document.querySelector(
      '#static-splash .splash-versions',
    )
    const apiVersionEl = document.querySelector(
      '#static-splash .splash-version-api',
    )
    const feVersionEl = document.querySelector(
      '#static-splash .splash-version-fe',
    )

    // Update splash image
    const logoElement = document.querySelector(
      '#static-splash .splash-logo',
    ) as HTMLImageElement

    // Check if we have a non-empty splashscreen image
    const hasRealImage =
      splashscreenImage && !splashscreenImage.includes('empty')

    if (logoElement && hasRealImage) {
      // Handle case where path may or may not start with /
      const imagePath = splashscreenImage.startsWith('/')
        ? splashscreenImage
        : `/${splashscreenImage}`
      const preloadImg = new Image()
      preloadImg.onload = () => {
        logoElement.src = imagePath
        logoElement.classList.add('loaded')
        if (apiVersionEl) apiVersionEl.textContent = `API: ${apiVersion}`
        if (feVersionEl) feVersionEl.textContent = `FE: ${feVersion}`
        if (versionsContainer) versionsContainer.classList.add('loaded')
      }
      preloadImg.onerror = () => {
        if (apiVersionEl) apiVersionEl.textContent = `API: ${apiVersion}`
        if (feVersionEl) feVersionEl.textContent = `FE: ${feVersion}`
        if (versionsContainer) versionsContainer.classList.add('loaded')
      }
      preloadImg.src = imagePath
    } else {
      if (apiVersionEl) apiVersionEl.textContent = `API: ${apiVersion}`
      if (feVersionEl) feVersionEl.textContent = `FE: ${feVersion}`
      if (versionsContainer) versionsContainer.classList.add('loaded')
    }
  }, [isLoadingCashier, getVersion, getSplashscreen, feVersion])

  useEffect(() => {
    // Solo al primo caricamento
    if (
      !hasAppLoaded &&
      !isLoadingEvents &&
      !isLoadingCashier &&
      ((upcomingEvents?.length ?? 0) > 0 || (eventResults?.length ?? 0) > 0)
    ) {
      hasAppLoaded = true

      // Aspetta un minimo di tempo per mostrare versione e logo
      setTimeout(() => {
        // Nasconde lo splash screen statico
        const splash = document.getElementById('static-splash')
        if (splash) {
          splash.classList.add('hidden')
        }
      }, 900) // 900ms per dare tempo di vedere versione e logo
    }
  }, [isLoadingEvents, isLoadingCashier, upcomingEvents, eventResults])

  return (
    <>
      <Navbar />
      <main className="h-full gap-2 overflow-hidden">
        <div className="h-full p-2">
          <BetsContextProvider>{children}</BetsContextProvider>
        </div>
      </main>
    </>
  )
}
