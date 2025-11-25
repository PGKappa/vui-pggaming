'use client'

import Navbar from '@/retail-components/navbar'
/* import ResolutionGate from '@/retail-components/resolution-gate'
 */ import { Toaster } from '@/retail-components/ui/sonner'
import BetsContextProvider from '@/retail-contexts/bets-context'
import RootContextProvider from '@/retail-contexts/root-context'
import SkinProvider, { SkinContext } from '@/retail-contexts/skin-context'
import { Inter } from 'next/font/google'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import '../../globals.css'
import '../../../retail-lib/i18n'

const inter = Inter({
  variable: '--font-inter',
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
      className={`${inter.variable} ${skin} flex h-screen flex-col font-inter antialiased`}
    >
      {/* <ResolutionGate> */}
      <RootContextProvider>
        <header>
          {/* <div className="h-[60px]"></div> */}
          <Navbar />
        </header>
        <main className="h-full overflow-hidden">
          <BetsContextProvider>{children}</BetsContextProvider>
        </main>
      </RootContextProvider>

      <Toaster
        position={
          typeof window !== 'undefined' && window.innerWidth >= 1024
            ? 'bottom-right'
            : 'top-center'
        }
      />
      {/* </ResolutionGate> */}
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
