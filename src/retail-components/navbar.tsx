'use client'

import { RootContext } from '@/retail-contexts/root-context'
import { cn } from '@/retail-lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, buttonVariants } from './ui/button'

export default function Navbar() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const initCode = searchParams.get('init_code')

  const {
    eventResults: roundResults,
    setSearchEventResults: setSearchRoundResults,
  } = useContext(RootContext)

  return (
    <div className="flex w-full flex-row items-center justify-start bg-accent p-3">
      <span className="whitespace-nowrap pl-14 text-center text-[16px] font-semibold text-background">
        {t('select_category')}
      </span>
      <div className="flex flex-row items-center gap-4 pl-[90px]">
        <Link
          href={`/retail/dogs-horses${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant: window.location.pathname.includes('/retail/dogs-horses')
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
              variant: window.location.pathname.includes('/retail/dogs')
                ? 'navbarSelected'
                : 'navbar',
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
              variant: window.location.pathname.includes('/retail/horses')
                ? 'navbarSelected'
                : 'navbar',
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
          <span className="text-[16px] font-bold">{t('ch2')}</span>
        </Link>

        <Link
          href={`/retail/calcio${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant: window.location.pathname.includes('/retail/calcio')
                ? 'navbarSelected'
                : 'navbar',
              size: 'lg',
            }),
            'flex w-24 flex-row items-center justify-center gap-3',
          )}
        >
          <Image
            src="/soccer.svg"
            alt="Calcio"
            width={40}
            height={20}
            className="size-5 object-contain brightness-0 invert filter"
          />
          <span className="text-[16px] font-bold">{t('ch3')}</span>
        </Link>
      </div>

      <div className="mr-2 flex w-full justify-end gap-4">
        <Button
          variant="ticketButton"
          size="lg"
          onClick={() => {
            setSearchRoundResults(roundResults)
          }}
        >
          <span className="text-[16px] font-bold">{t('search_results')}</span>
        </Button>

        <Link
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
        </Link>
      </div>
    </div>
  )
}
