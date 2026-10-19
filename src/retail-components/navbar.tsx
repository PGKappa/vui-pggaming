'use client'

import { RootContext } from '@/retail-contexts/root-context'
import { cn } from '@/retail-lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

function NavbarContent() {
  const { t, i18n } = useTranslation()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const { eventResults, setSearchEventResults, getNavbarConfig } =
    useContext(RootContext)
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)

  const navCfg = getNavbarConfig?.() ?? {
    showDogs6: true,
    showDogs8: true,
    showHorses: true,
    showMix: true,
    showFootball: true,
    order: ['DOGS6', 'DOGS8', 'HORSES', 'FOOTBALL'] as const,
  }

  // Helper per creare link preservando TUTTI i parametri URL
  const buildHref = (path: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const queryString = params.toString()
    return `${path}${queryString ? `?${queryString}` : ''}`
  }

  // Helper per determinare il link info basato sulla pagina e lingua
  const getInfoLink = () => {
    const lang = i18n.language || 'en'

    if (pathname.includes('/calcio')) {
      // Link per il calcio
      return `https://d190050z3qr0m1.cloudfront.net/public/Soccer_Gaming_manual_${lang}.html`
    } else {
      // Per cani e cavalli
      return `https://d190050z3qr0m1.cloudfront.net/public/RD-RH_Gamingmanual_${lang}.html`
    }
  }

  return (
    <div
      className="flex h-16 w-full flex-row items-center justify-start bg-accent p-3"
      suppressHydrationWarning={true}
    >
      <div className="relative left-[8px] flex flex-row items-center space-x-2">
        {navCfg.showMix && (
          <Link
            href={buildHref('/retail/dogs-horses')}
            className={cn(
              'flex h-12 w-24 flex-row items-center justify-between px-4 py-1 text-foreground transition-colors hover:opacity-90',
              pathname.includes('/retail/dogs-horses')
                ? 'bg-tertiary'
                : 'bg-secondary',
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
        )}

        {/* Pulsanti disciplina: renderizzati nell'ORDINE reale restituito
            dall'API per questo operatore (navCfg.order), non in un ordine
            fisso — ma ciascuno resta collegato in modo univoco alla sua
            pagina, quindi riordinare i canali non può mai far aprire la
            disciplina sbagliata. */}
        {navCfg.order.map((key) => {
          const button = {
            DOGS6: {
              show: navCfg.showDogs6,
              href: '/retail/dogs',
              active:
                pathname.includes('/retail/dogs') &&
                !pathname.includes('/retail/dogs-horses') &&
                !pathname.includes('/retail/dogs8'),
              gapClass: 'gap-1 hover:opacity-90',
              content: (
                <>
                  <Image
                    src="/dog.png"
                    alt="Dogs"
                    width={40}
                    height={20}
                    className="size-8 object-contain"
                  />
                  <span className="text-base font-bold text-secondary-foreground !text-[22px] relative left-[2px]">
                    6
                  </span>
                </>
              ),
            },
            DOGS8: {
              show: navCfg.showDogs8,
              href: '/retail/dogs8',
              active: pathname.includes('/retail/dogs8'),
              gapClass: 'gap-1 hover:opacity-90',
              content: (
                <>
                  <Image
                    src="/dog.png"
                    alt="Dogs 8"
                    width={40}
                    height={20}
                    className="size-8 object-contain"
                  />
                  <span className="text-base font-bold text-secondary-foreground !text-[22px] relative left-[2px]">
                    8
                  </span>
                </>
              ),
            },
            HORSES: {
              show: navCfg.showHorses,
              href: '/retail/horses',
              active: pathname.includes('/retail/horses'),
              gapClass: 'gap-1 hover:opacity-90',
              content: (
                <>
                  <Image
                    src="/horse.png"
                    alt="Horses"
                    width={40}
                    height={20}
                    className="size-8 object-contain"
                  />
                  <span className="text-base font-bold text-secondary-foreground !text-[22px] relative left-[2px]">
                    6
                  </span>
                </>
              ),
            },
            FOOTBALL: {
              show: navCfg.showFootball,
              href: '/retail/calcio',
              active: pathname.includes('/retail/calcio'),
              gapClass: 'gap-2',
              content: (
                <Image
                  src="/soccer.png"
                  alt="Calcio"
                  width={40}
                  height={20}
                  className="size-8 object-contain brightness-0 invert filter"
                />
              ),
            },
          }[key]

          if (!button.show) return null

          return (
            <Link
              key={key}
              href={buildHref(button.href)}
              className={cn(
                `flex h-12 w-24 flex-row items-center justify-center ${button.gapClass} px-3 py-1 text-foreground transition-colors`,
                button.active ? 'bg-tertiary' : 'bg-secondary',
              )}
            >
              {button.content}
            </Link>
          )
        })}
      </div>

      <div className="relative right-2 flex w-full justify-end space-x-2">
        <Button
          className="h-12 w-fit p-[18px] hover:opacity-95"
          variant="ticketButton"
          size="lg"
          onClick={() => {
            setSearchEventResults(eventResults)
          }}
        >
          <span className="text-[15px] font-semibold">
            {t('search_results').toUpperCase()}
          </span>
        </Button>

        <Button
          className="h-12 w-12 text-[18px] hover:opacity-95"
          variant="ticketButton"
          size="lg"
          onClick={() => setIsInfoDialogOpen(true)}
        >
          i
        </Button>

        {/* <Link
          href={`/retail/calcio/ticket-list${initCode ? `?init_code=${initCode}` : ''}`}
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'lg',
          })}
        >
          <span className="text-[16px] font-bold">{t('ticket_list')}</span>
        </Link>

        <Link
          href={`/retail/calcio/ticket-check${initCode ? `?init_code=${initCode}` : ''}`}
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'lg',
          })}
        >
          <span className="text-[16px] font-bold">{t('ticket_check')}</span>
        </Link> */}
      </div>

      {/* Dialog per le informazioni sul gioco - cambia contenuto per disciplina */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="h-full w-full overflow-hidden bg-accent">
          <DialogHeader className="bg-secondary text-secondary-foreground">
            <DialogTitle>{t('game_rules').toUpperCase()}</DialogTitle>
          </DialogHeader>
          <div className="h-[1020px] w-full">
            <iframe
              src={getInfoLink()}
              className="h-full w-full border-0"
              title="Game Rules"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="flex h-16 w-full bg-navbarTop" />}>
      <NavbarContent />
    </Suspense>
  )
}
