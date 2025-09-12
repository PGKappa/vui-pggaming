'use client'

import { RootContext } from '@/retail-contexts/root-context'
import { cn } from '@/retail-lib/utils'
import { Info } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, buttonVariants } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

export default function Navbar() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const initCode = searchParams.get('init_code')

  const { eventResults, setSearchEventResults } = useContext(RootContext)
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)

  // Helper per determinare il link info basato sulla pagina
  const getInfoLink = () => {
    if (pathname.includes('/calcio')) {
      // Link per il calcio (per ora fake)
      return 'https://d190050z3qr0m1.cloudfront.net/public/Soccer_manual_fake.html'
    } else {
      // Per cani e cavalli
      return 'https://d190050z3qr0m1.cloudfront.net/public/RD-RH_Gaming_manual_en.html'
    }
  }

  return (
    <div
      className="flex w-full flex-row items-center justify-start bg-accent p-3"
      suppressHydrationWarning={true}
    >
      <span className="whitespace-nowrap pl-14 text-center text-[16px] font-semibold text-background">
        {t('select_category')}
      </span>
      <div className="flex flex-row items-center gap-4 pl-[90px]">
        <Link
          href={`/retail/dogs-horses${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant:
                pathname === '/retail/dogs-horses'
                  ? 'navbarSelected'
                  : 'navbar',
              size: 'lg',
            }),
            'flex w-28 flex-row items-center justify-between',
          )}
        >
          <Image
            src="/dog-image.png"
            alt="Dogs"
            width={40}
            height={20}
            className="object-contain"
          />
          <Image
            src="/horse-image.png"
            alt="Horses"
            width={40}
            height={20}
            className="object-contain"
          />
        </Link>

        <Link
          href={`/retail/dogs${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant:
                pathname === '/retail/dogs' ? 'navbarSelected' : 'navbar',
              size: 'lg',
            }),
            'flex w-24 flex-row items-center justify-between',
          )}
        >
          <Image
            src="/dog-image.png"
            alt="Dogs"
            width={40}
            height={20}
            className="object-contain"
          />
          <span className="text-[16px] font-bold">{t('ch1')}</span>
        </Link>

        <Link
          href={`/retail/horses${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant:
                pathname === '/retail/horses' ? 'navbarSelected' : 'navbar',
              size: 'lg',
            }),
            'flex w-24 flex-row items-center justify-between',
          )}
        >
          <Image
            src="/horse-image.png"
            alt="Horses"
            width={40}
            height={20}
            className="object-contain"
          />
          <span className="text-[16px] font-bold">{t('ch3')}</span>
        </Link>

        <Link
          href={`/retail/calcio${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant:
                pathname === '/retail/calcio' ? 'navbarSelected' : 'navbar',
              size: 'lg',
            }),
            'flex w-24 flex-row items-center justify-center gap-3',
          )}
        >
          <Image
            src="/soccer.png"
            alt="Calcio"
            width={40}
            height={20}
            className="size-7 object-contain brightness-0 invert filter"
          />
          <span className="text-[16px] font-bold">{t('ch4')}</span>
        </Link>
      </div>

      <div className="mr-2 flex w-full justify-end gap-4">
        <Button
          variant="ticketButton"
          size="lg"
          onClick={() => {
            setSearchEventResults(eventResults)
          }}
        >
          <span className="text-[16px] font-bold">{t('search_results')}</span>
        </Button>

        {/* Pulsante Info - sempre visibile con dialog diversi per calcio vs racing */}
        <Button
          className="w-10"
          variant="ticketButton"
          size="lg"
          onClick={() => setIsInfoDialogOpen(true)}
        >
          <Info style={{ scale: 1.5 }} />
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
        <DialogContent className="w-full overflow-hidden bg-accent">
          <DialogHeader className="bg-secondary text-secondary-foreground">
            <DialogTitle>{t('game_rules')}</DialogTitle>
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
