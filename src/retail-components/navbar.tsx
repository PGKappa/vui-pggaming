'use client'

import { RootContext } from '@/retail-contexts/root-context'
import { cn } from '@/retail-lib/utils'
import { Info, SearchIcon } from 'lucide-react'
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

  const { roundResults, setSearchRoundResults } = useContext(RootContext)

  return (
    <div className="flex w-full flex-row items-center justify-start bg-accent p-3">
      <span className="whitespace-nowrap pl-14 text-center text-[16px] font-semibold text-background">
        {t('select_category')}
      </span>

  const navigateParent = () => {
    window.parent.postMessage(
      {
        tipo: 'CAMBIA_IFRAME_1',
        nuovoUrl: `https://test.pgvirtual.eu/?${searchParams.toString()}`
      },
      'https://demo.pgvirtual.eu/Retail-Blockotech.html'
    );
  }
  return (
    <>
      {!!withTopShell && <div className="h-[60px]"></div>}
      <nav className="flex h-[56.69px] w-full flex-row items-center justify-start bg-accent">
        <div className="flex flex-row items-center gap-[10px] pl-[20px]">
          <Link
            href="#"
            onClick={navigateParent} 
            className={cn(
              buttonVariants({
                variant: 'navbar',
              }),
              'flex h-[45px] w-[100px] flex-row items-center px-7',
            )}
          >
            <Image
              src="/dog-image.png"
              alt="Dogs"
              width={36}
              height={21}
              className="object-contain"
            />
            <Image
              src="/horse-image.png"
              alt="Horses"
              width={36}
              height={21}
              className="object-contain"
            />
          </Link>

          <Link
            href="#"
            onClick={navigateParent} 
            className={cn(
              buttonVariants({
                variant: 'navbar',
              }),
              'flex h-[45px] w-[100px] flex-row items-center',
            )}
          >
            <Image
              src="/dog-image.png"
              alt="Dogs"
              width={36}
              height={21}
              className="object-contain"
            />
            <span className="text-[20px] font-bold">{t('ch1')}</span>
          </Link>

          <Link
            href="#"
            onClick={navigateParent} 
            className={cn(
              buttonVariants({
                variant: 'navbar',
              }),
              'flex h-[45px] w-[100px] flex-row items-center',
            )}
          >
            <Image
              src="/horse-image.png"
              alt="Horses"
              width={36}
              height={21}
              className="object-contain"
            />
            <span className="text-[20px] font-bold">{t('ch3')}</span>
          </Link>

        <Link
          href={`/retail${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant: 'navbarSelected',
              size: 'lg',
            }),
            'flex w-20 flex-row items-center justify-between',
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
          variant="navbar"
          className="text-background hover:bg-transparent"
          onClick={() => {
            setSearchRoundResults(roundResults)
          }}
        >
          <SearchIcon style={{ scale: 1.5 }} />
        </Button>

        <Link
          href={`/retail/ticket-list${initCode ? `?init_code=${initCode}` : ''}`}
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'lg',
          })}
        >
          <span className="text-[16px] font-bold">{t('ticket_list')}</span>
        </Link>

          <Link
            href={`/retail/ticket-check${initCode ? `?init_code=${initCode}` : ''}`}
            className={buttonVariants({
              variant: 'ticketButton',
              className: 'h-[45px] w-[129px]',
            })}
          >
            <span className="px-[7px] text-[16px] font-bold">
              {t('ticket_check')}
            </span>
          </Link>

        <Link
          href={`/info${initCode ? `?init_code=${initCode}` : ''}`}
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'default',
          })}
        >
          <Info style={{ scale: 1.5 }} />
        </Link>
      </div>
    </div>
  )
}
