'use client'

import { RootContext } from '@/retail-contexts/root-context'
import { cn } from '@/retail-lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, buttonVariants } from './ui/button'
import { X } from 'lucide-react'

function NavbarContent() {
  const { t, i18n } = useTranslation()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const { eventResults, setSearchEventResults, userData } =
    useContext(RootContext)
  const isOperator = userData?.level === 1
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  // Helper per creare link preservando TUTTI i parametri URL
  const buildHref = (path: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const queryString = params.toString()
    return `${path}${queryString ? `?${queryString}` : ''}`
  }

  // Helper per ottenere il base path della disciplina corrente
  const getDisciplineBasePath = (path: string) => {
    const p = path.toLowerCase()
    if (p.includes('dogs-horses') || p.includes('cani-cavalli'))
      return '/retail/dogs-horses'
    if (p.includes('dogs') || p.includes('cani')) return '/retail/dogs'
    if (p.includes('horses') || p.includes('cavalli')) return '/retail/horses'
    if (p.includes('calcio') || p.includes('football') || p.includes('soccer'))
      return '/retail/calcio'
    return '/retail/dogs-horses'
  }

  // Helper per determinare il link info basato sulla pagina e lingua
  const getInfoLink = () => {
    const lang = i18n.language || 'en'

    if (pathname.includes('/calcio')) {
      return `https://d190050z3qr0m1.cloudfront.net/public/Soccer_Gaming_manual_${lang}.html`
    } else {
      return `https://d190050z3qr0m1.cloudfront.net/public/Gaming_manual_${lang}.html`
    }
  }

  return (
    <>
      {/* NAVBAR — z-50 così rimane sempre sopra il pannello info */}
      <div
        className="relative z-50 flex h-16 w-full flex-row items-center justify-start bg-navbarBg p-3"
        suppressHydrationWarning={true}
      >
        <div className="relative right-1 flex flex-row items-center space-x-2">
          <Link
            href={buildHref('/retail/dogs-horses')}
            className={cn(
              'flex h-12 w-28 flex-row items-center justify-between px-4 py-1 text-foreground transition-colors',
              pathname.includes('/retail/dogs-horses')
                ? 'bg-tertiary'
                : 'bg-secondary hover:bg-[#46474d]',
            )}
          >
            <Image
              src="/dog.png"
              alt="Dogs"
              width={40}
              height={20}
              className="size-8 object-contain"
            />
            <Image
              src="/horse.png"
              alt="Horses"
              width={40}
              height={20}
              className="size-8 object-contain"
            />
          </Link>

          <Link
            href={buildHref('/retail/dogs')}
            className={cn(
              'flex h-12 w-24 flex-row items-center justify-center px-4 py-1 text-foreground transition-colors',
              pathname.includes('/retail/dogs') &&
                !pathname.includes('/retail/dogs-horses')
                ? 'bg-tertiary'
                : 'bg-secondary hover:bg-[#46474d]',
            )}
          >
            <Image
              src="/dog.png"
              alt="Dogs"
              width={40}
              height={20}
              className="size-8 object-contain"
            />
          </Link>

          <Link
            href={buildHref('/retail/horses')}
            className={cn(
              'flex h-12 w-24 flex-row items-center justify-center px-4 py-1 text-foreground transition-colors',
              pathname.includes('/retail/horses')
                ? 'bg-tertiary'
                : 'bg-secondary hover:bg-[#46474d]',
            )}
          >
            <Image
              src="/horse.png"
              alt="Horses"
              width={40}
              height={20}
              className="size-8 object-contain"
            />
          </Link>
          {/**
          <Link
            href={buildHref('/retail/calcio')}
            className={cn(
              'flex h-12 w-24 flex-row items-center justify-center gap-3 px-4 py-1 text-foreground transition-colors',
              pathname.includes('/retail/calcio')
                ? 'bg-tertiary'
                : 'bg-secondary',
            )}
          >
            <Image
              src="/soccer.png"
              alt="Calcio"
              width={40}
              height={20}
              className="size-8 object-contain brightness-0 invert filter"
            />
          </Link>
          */}
        </div>

        <div className="relative left-1 flex w-full justify-end space-x-2">
          {isOperator && (
            <Link
              href={buildHref(
                `${getDisciplineBasePath(pathname)}/ticket-check`,
              )}
              className={cn(
                buttonVariants({ variant: 'ticketButton', size: 'lg' }),
                'h-12 w-[168px] p-[18px] pb-5 hover:bg-[#46474d]',
              )}
            >
              <span className="text-[14px] font-semibold text-searchResultText">
                {t('ticket_check').toUpperCase()}
              </span>
            </Link>
          )}

          {isOperator && (
            <Link
              href={buildHref(
                `${getDisciplineBasePath(pathname)}/ticket-list`,
              )}
              className={cn(
                buttonVariants({ variant: 'ticketButton', size: 'lg' }),
                'h-12 w-[168px] p-[18px] pb-5 hover:bg-[#46474d]',
              )}
            >
              <span className="text-[14px] font-semibold text-searchResultText">
                {t('ticket_list').toUpperCase()}
              </span>
            </Link>
          )}

          <Button
            className="h-12 w-fit p-[17px] pb-5 hover:bg-[#46474d]"
            variant="ticketButton"
            size="lg"
            onClick={() => {
              setSearchEventResults(eventResults)
            }}
          >
            <span className="text-[14px] font-semibold text-searchResultText">
              {t('search_results').toUpperCase()}
            </span>
          </Button>

          <Button
            className="h-12 w-12 text-[18px] text-searchResultText hover:bg-[#46474d]"
            variant="ticketButton"
            size="lg"
            onClick={() => setIsInfoOpen((prev) => !prev)}
          >
            i
          </Button>
        </div>
      </div>

      {/*
        PANNELLO INFO — fixed sotto la navbar, senza nessun overlay.
        z-40 < z-50 della navbar: la navbar rimane completamente cliccabile.
        Nessun backdrop/overlay → i click sulla navbar passano normalmente.
      */}
      {isInfoOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col bg-accent">
          {/* Header con titolo e tasto chiudi */}
          <div className="flex h-12 flex-shrink-0 items-center justify-center bg-secondary px-4 text-secondary-foreground">
            <span className="text-[14px] font-semibold">
              {t('game_rules').toUpperCase()}
            </span>
            <button
              onClick={() => setIsInfoOpen(false)}
              className="relative left-[880px] flex h-8 w-8 items-center rounded hover:bg-[#46474d]"
              aria-label="Chiudi"
            >
              <X className="h-5 w-5 text-searchResultText" />
            </button>
          </div>

          {/* Iframe contenuto */}
          <div className="flex-1 bg-black">
            <iframe
              src={getInfoLink()}
              className="h-full w-full border-0"
              title="Game Rules"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="flex h-16 w-full bg-navbarTop" />}>
      <NavbarContent />
    </Suspense>
  )
}