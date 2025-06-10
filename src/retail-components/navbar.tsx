import { cn } from '@/retail-lib/utils'
import { Info } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { buttonVariants } from './ui/button'
import { useTranslation } from 'react-i18next'

export default function Navbar() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const initCode = searchParams.get('init_code')
  return (
    <nav className="flex w-full flex-row items-center justify-start bg-accent p-3">
      <span className="whitespace-nowrap pl-14 text-center text-[16px] font-semibold text-background">
        {t('select_category')}
      </span>

      <div className="flex flex-row items-center gap-4 pl-[56px]">
        <Link
          href={`/dogs-horses${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant: 'navbar',
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
          href={`/dogs${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant: 'navbar',
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
          href={`/horses${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant: 'navbar',
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
          href={`/retail${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant: 'navbar',
              size: 'lg',
            }),
            'flex w-20 flex-row items-center justify-between',
          )}
        >
          <Image
            src="/icon-calcio.png"
            alt="Calcio"
            width={40}
            height={20}
            className="size-5 object-contain"
          />
          <span className="text-[16px] font-bold">{t('ch3')}</span>
        </Link>
      </div>

      <div className="flex w-full justify-end gap-4 mr-2">
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
            size: 'lg',
          })}
        >
          <span className="text-[16px] font-bold">{t('ticket_check')}</span>
        </Link>

        <Link
          href={`/info${initCode ? `?init_code=${initCode}` : ''}`}
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'default',
          })}
        >
          <Info style={{ scale: 1.5 }}/>
        </Link>
      </div>
    </nav>
  )
}
