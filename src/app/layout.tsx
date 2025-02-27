'use client'

import Navbar from '@/components/navbar'
import RootContextProvider from '@/contexts/root-context'
import SkinProvider, { SkinContext } from '@/contexts/skin-context'
import { Geist, Geist_Mono } from 'next/font/google'
import { useContext } from 'react'
import './globals.css'

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
      className={`${geistSans.variable} ${geistMono.variable} ${skin} antialiased`}
    >
      <header className="container">
        <Navbar />
      </header>
      <main>
        <RootContextProvider>{children}</RootContextProvider>
      </main>
    </body>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
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
