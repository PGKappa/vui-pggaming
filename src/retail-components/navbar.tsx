import { cn } from '@/retail-lib/utils'
import { Info } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from './ui/button'

export default function Navbar() {
  return (
    <nav className="flex w-full flex-row items-center justify-start bg-accent p-3">
      <span className="whitespace-nowrap pl-14 text-center text-[16px] font-semibold text-background">
        Select the category:
      </span>

      <div className="flex flex-row items-center gap-4 pl-[68px]">
        <Link
          href="/dogs-horses"
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
          href="/dogs"
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
          <span className="text-[16px] font-bold">Ch1</span>
        </Link>

        <Link
          href="/horses"
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
          <span className="text-[16px] font-bold">Ch2</span>
        </Link>

        <Link
          href="/retail"
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
          <span className="text-[16px] font-bold">Ch3</span>
        </Link>
      </div>

      <div className="flex w-full justify-end gap-4">
        <Link
          href="/retail/ticket-list"
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'lg',
          })}
        >
          <span className="text-[16px] font-bold">Ticket List</span>
        </Link>

        <Link
          href="/retail/ticket-check"
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'lg',
          })}
        >
          <span className="text-[16px] font-bold">Ticket Check</span>
        </Link>

        <Link
          href="/info"
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'default',
          })}
        >
          <Info />
        </Link>
      </div>
    </nav>
  )
}
