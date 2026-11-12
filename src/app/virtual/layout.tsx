'use client'

import Navbar from '@/virtual-components/navbar'
import { Toaster } from '@/virtual-components/ui/sonner'
import BetsContextProvider from '@/virtual-contexts/bets-context'
import RootContextProvider from '@/virtual-contexts/root-context'
import SkinProvider, { SkinContext } from '@/virtual-contexts/skin-context'
import { Geist, Geist_Mono } from 'next/font/google'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import '../globals.css'
import '../../virtual-lib/i18n'

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
      <main className="flex-1">
        {/* la navbar sta dentro il provider per leggere i prossimi eventi
            (timer di inizio gara accanto a ogni disciplina) */}
        <RootContextProvider>
          <header className="container">
            <Navbar />
          </header>
          <BetsContextProvider>{children}</BetsContextProvider>
        </RootContextProvider>
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

// Layout unico per tutte le discipline: con un layout radice per gruppo
// (cani, cavalli, calcio) Next.js ricaricava l'intera pagina a ogni cambio di
// disciplina. Così provider, dati in cache e schedina restano montati.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { i18n } = useTranslation()

  return (
    // thin-scrollbar: barra di scorrimento della pagina sottile, come quella
    // degli ultimi risultati
    <html lang={i18n.language} className="thin-scrollbar">
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
