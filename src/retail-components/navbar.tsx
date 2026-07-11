'use client'

import { RootContext } from '@/retail-contexts/root-context'
import { cn } from '@/retail-lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { Button, buttonVariants } from './ui/button'

// Variabile a livello di modulo: sopravvive al rimount del componente causato da
// <EventsContextProvider key={pathname}> nel layout. Viene impostata prima della
// navigazione e consumata nel useEffect del componente rimontato sulla nuova pagina.
// In questo modo evitiamo il pattern router.push(openSearch=true) + router.replace()
// che in Next.js 15 App Router corrompe la history del browser.
let pendingOpenSearch = false

function NavbarContent() {
  const { t, i18n } = useTranslation()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const { eventResults, setSearchEventResults, userData } =
    useContext(RootContext)
  const isOperator = userData?.level === 1
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const isOnTicketPage =
    pathname.includes('/ticket-list') || pathname.includes('/ticket-check')

  useEffect(() => {
    setIsInfoOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isOnTicketPage) {
      // Flag impostato da closeTicketPageAndThen quando naviga da una pagina ticket.
      // Evitiamo il param openSearch nell'URL per non dover fare router.replace()
      // subito dopo il router.push(), che in Next.js 15 corrompe la history.
      if (pendingOpenSearch) {
        pendingOpenSearch = false
        setSearchEventResults(eventResults)
        return
      }

      // Gestione parametri URL (backward compat per link diretti/esterni)
      let needsReplace = false
      const params = new URLSearchParams(searchParams.toString())

      if (searchParams.get('openSearch') === 'true') {
        setSearchEventResults(eventResults)
        params.delete('openSearch')
        needsReplace = true
      }

      if (searchParams.get('openInfo') === 'true') {
        setIsInfoOpen(true)
        params.delete('openInfo')
        needsReplace = true
      }

      if (needsReplace) {
        const qs = params.toString()
        router.replace(`${pathname}${qs ? `?${qs}` : ''}`)
      }
    }
  }, [
    searchParams,
    isOnTicketPage,
    eventResults,
    pathname,
    router,
    setSearchEventResults,
  ])

  const buildHref = (path: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const queryString = params.toString()
    return `${path}${queryString ? `?${queryString}` : ''}`
  }

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

  const closeTicketPageAndThen = (openSearch = false, openInfo = false) => {
    if (openInfo) {
      // Apre l'overlay info direttamente senza navigare via dalla pagina corrente.
      // L'overlay è fixed full-screen quindi funziona sopra qualsiasi pagina.
      // Navigare via prima di aprirlo causava la perdita della pagina nella history.
      setIsInfoOpen(true)
      return
    }

    setIsInfoOpen(false)
    if (isOnTicketPage && (openSearch || openInfo)) {
      // Only navigate programmatically for Button elements (search/info)
      // that have no href — plain Link clicks let their own href handle it
      const params = new URLSearchParams(searchParams.toString())
      if (openSearch) params.set('openSearch', 'true')
      if (openInfo) params.set('openInfo', 'true')
      router.push(`${getDisciplineBasePath(pathname)}?${params.toString()}`)
    } else if (!isOnTicketPage) {
      if (openSearch) setSearchEventResults(eventResults)
      if (openInfo) setIsInfoOpen(true)
    }
  }

  const getInfoLink = () => {
    const lang = i18n.language || 'en'
    if (pathname.includes('/calcio')) {
      return `https://d190050z3qr0m1.cloudfront.net/public/Soccer_Gaming_manual_${lang}.html`
    } else {
      return `https://d190050z3qr0m1.cloudfront.net/public/RD-RH_Gamingmanual_${lang}.html`
    }
  }

  return (
    <>
      <div
        className="relative z-50 flex h-16 w-full flex-row items-center justify-start bg-navbarBg p-3"
        suppressHydrationWarning={true}
      >
        <div className="relative right-1 flex flex-row items-center space-x-2">
          <Link
            href={buildHref('/retail/dogs-horses')}
            onClick={() => closeTicketPageAndThen()}
            className={cn(
              'flex h-12 w-28 flex-row items-center justify-between px-4 py-1 text-foreground transition-colors',
              pathname.includes('/retail/dogs-horses')
                ? 'bg-tertiary'
                : 'bg-secondary hover:bg-navbarHover',
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
            onClick={() => closeTicketPageAndThen()}
            className={cn(
              'flex h-12 w-24 flex-row items-center justify-center px-4 py-1 text-foreground transition-colors',
              pathname.includes('/retail/dogs') &&
                !pathname.includes('/retail/dogs-horses')
                ? 'bg-tertiary'
                : 'bg-secondary hover:bg-navbarHover',
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
            onClick={() => closeTicketPageAndThen()}
            className={cn(
              'flex h-12 w-24 flex-row items-center justify-center px-4 py-1 text-foreground transition-colors',
              pathname.includes('/retail/horses')
                ? 'bg-tertiary'
                : 'bg-secondary hover:bg-navbarHover',
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
        </div>

        <div className="relative left-1 flex w-full justify-end space-x-2 bg-transparent">
          <button
            className="flex h-12 w-12 items-center justify-center bg-transparent border-0 outline-none"
            onClick={() => {
              if (isInfoOpen) {
                setIsInfoOpen(false)
              } else {
                router.back()
              }
            }}
          >
            <ChevronLeft className="size-8 text-searchResultText bg-transparent" strokeWidth={2.5} />
          </button>

          {isOperator && (
            <Link
              href={buildHref(
                `${getDisciplineBasePath(pathname)}/ticket-check`,
              )}
              onClick={() => {
                if (pathname.includes('/ticket-check')) setIsInfoOpen(false)
              }}
              className={cn(
                buttonVariants({ variant: 'ticketButton', size: 'lg' }),
                'h-12 w-[155px] p-[14px] pb-5 hover:bg-navbarHover min-[1400px]:w-[168px] min-[1400px]:p-[18px]',
              )}
            >
              <span className="text-[14px] font-semibold text-searchResultText">
                {t('ticket_check').toUpperCase()}
              </span>
            </Link>
          )}

          {isOperator && (
            <Link
              href={buildHref(`${getDisciplineBasePath(pathname)}/ticket-list`)}
              onClick={() => {
                if (pathname.includes('/ticket-list')) setIsInfoOpen(false)
              }}
              className={cn(
                buttonVariants({ variant: 'ticketButton', size: 'lg' }),
                'h-12 w-[155px] p-[14px] pb-5 hover:bg-navbarHover min-[1400px]:w-[168px] min-[1400px]:p-[18px]',
              )}
            >
              <span className="text-[14px] font-semibold text-searchResultText">
                {t('ticket_list').toUpperCase()}
              </span>
            </Link>
          )}

          <Button
            className="h-12 w-fit p-[17px] pb-5 hover:bg-navbarHover"
            variant="ticketButton"
            size="lg"
            onClick={() => closeTicketPageAndThen(true, false)}
          >
            <span className="text-[14px] font-semibold text-searchResultText">
              {t('search_results').toUpperCase()}
            </span>
          </Button>

          <Button
            className="h-12 w-12 text-[18px] text-searchResultText hover:bg-navbarHover"
            variant="ticketButton"
            size="lg"
            onClick={() => setIsInfoOpen((prev) => !prev)}
          >
            i
          </Button>
        </div>
      </div>

      {isInfoOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-[60] flex flex-col bg-accent">
          <div className="flex h-16 flex-shrink-0 items-center justify-center bg-secondary px-4 text-secondary-foreground">
            <span className="text-[16px] font-semibold uppercase">
              {t('game_rules').toUpperCase()}
            </span>
          </div>
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
