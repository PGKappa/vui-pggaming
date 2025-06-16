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
    <nav className="flex h-[56.69px] w-full flex-row items-center justify-start bg-accent">
      <div className="flex flex-row items-center gap-[10px] pl-[20px]">
        <Link
          href={`/dogs-horses${initCode ? `?init_code=${initCode}` : ''}`}
          className={cn(
            buttonVariants({
              variant: 'navbar',
            }),
            'flex h-[45px] w-[100px] px-7 flex-row items-center',
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
          href={`/dogs${initCode ? `?init_code=${initCode}` : ''}`}
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
          href={`/horses${initCode ? `?init_code=${initCode}` : ''}`}
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
              variant: 'navbar',
            }),
            'flex h-[45px] w-[100px] flex-row items-center',
          )}
        >
          <Image
            src="/icon-calcio.png"
            alt="Calcio"
            width={36}
            height={21}
            className="size-5 object-contain"
          />
          <span className="text-[20px] font-bold">Ch4</span>
        </Link>
      </div>

      <div className="mr-7 gap-1 flex w-full justify-end">
        <Link
          href={`/retail/ticket-list${initCode ? `?init_code=${initCode}` : ''}`}
          className={buttonVariants({
            variant: 'ticketButton',
            className: 'h-[45px] w-[129px]'
          })}
        >
          <span className="text-[16px] font-bold px-[7px]">{t('ticket_list')}</span>
        </Link>

        <Link
          href={`/retail/ticket-check${initCode ? `?init_code=${initCode}` : ''}`}
          className={buttonVariants({
            variant: 'ticketButton',
            className: 'h-[45px] w-[129px]'
          })}
        >
          <span className="text-[16px] font-bold px-[7px]">{t('ticket_check')}</span>
        </Link>

        <Link
          href={`/info${initCode ? `?init_code=${initCode}` : ''}`}
          className={buttonVariants({
            variant: 'ticketButton',
            className: 'h-[45px] w-[45px]'
          })}
        >
          <Info style={{ scale: 1.5 }} />
        </Link>
      </div>
    </nav>
  )
}
