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

  const { eventResults, setSearchEventResults } = useContext(RootContext)
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)

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
      return `https://d190050z3qr0m1.cloudfront.net/public/Gaming_manual_${lang}.html`
    }
  }

  return (
    <div
      className="flex h-16 w-full flex-row items-center justify-start bg-accent p-3"
      suppressHydrationWarning={true}
    >
      <div className="relative left-[8px] flex flex-row items-center space-x-2">
        <Link
          href={buildHref('/retail/dogs-horses')}
          className={cn(
            'flex h-12 w-28 flex-row items-center justify-between px-4 py-1 text-foreground transition-colors hover:opacity-90',
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

        <Link
          href={buildHref('/retail/dogs')}
          className={cn(
            'flex h-12 w-24 flex-row items-center justify-center px-4 py-1 text-foreground transition-colors hover:opacity-90',
            pathname.includes('/retail/dogs') &&
              !pathname.includes('/retail/dogs-horses') &&
              !pathname.includes('/retail/dogs8')
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
        </Link>

        <Link
          href={buildHref('/retail/dogs8')}
          className={cn(
            'flex h-12 w-28 flex-row items-center justify-center gap-1 px-3 py-1 text-foreground transition-colors hover:opacity-90',
            pathname.includes('/retail/dogs8') ? 'bg-tertiary' : 'bg-secondary',
          )}
        >
          <Image
            src="/dog.png"
            alt="Dogs 8"
            width={40}
            height={20}
            className="size-8 object-contain"
          />
          <span className="text-sm font-bold text-white">8</span>
        </Link>

        <Link
          href={buildHref('/retail/horses')}
          className={cn(
            'hover:*opacity-90 flex h-12 w-24 flex-row items-center justify-center px-4 py-1 text-foreground transition-colors',
            pathname.includes('/retail/horses')
              ? 'bg-tertiary'
              : 'bg-secondary',
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
    <Suspense fallback={<div className="bg-navbarTop flex h-16 w-full" />}>
      <NavbarContent />
    </Suspense>
  )
}
