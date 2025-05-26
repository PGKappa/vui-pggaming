import { Info } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import BallSvg from './ball'
import { buttonVariants } from './ui/button'

export default function Navbar() {
  return (
    <nav className="flex w-full flex-row items-center justify-between gap-1 bg-accent p-3 px-4">
      <div className="flex items-center gap-1">
        <Link
          href="/dogs-horses"
          className={buttonVariants({
            variant: 'navbar',
            size: 'lg',
          })}
        >
          <Image
            src="/dog-image.png"
            alt="Dogs"
            width={40}
            height={20}
            className="h-5 w-full object-contain"
          />
          <Image
            src="/horse-image.png"
            alt="Horses"
            width={40}
            height={20}
            className="h-6 w-full object-contain"
          />
        </Link>

        <Link
          href="/dogs"
          className={buttonVariants({
            variant: 'navbar',
            size: 'lg',
          })}
        >
          <Image
            src="/dog-image.png"
            alt="Dogs"
            width={40}
            height={20}
            className="object-contain"
          />
          <span className="text-sm font-bold">Ch1</span>
        </Link>

        <Link
          href="/horses"
          className={buttonVariants({
            variant: 'navbar',
            size: 'lg',
          })}
        >
          <Image
            src="/horse-image.png"
            alt="Horses"
            width={40}
            height={20}
            className="object-contain"
          />
          <span className="text-sm font-bold">Ch3</span>
        </Link>

        <Link
          href="/retail"
          className="flex h-10 w-10 items-center justify-center bg-tertiary text-tertiary-foreground"
        >
          <BallSvg className="h-6 w-6 stroke-accent-foreground" />
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <Link
          href="/retail/ticket-list"
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'lg',
          })}
        >
          <span className="text-[13px] font-bold">Ticket List</span>
        </Link>

        <Link
          href="/retail/ticket-check"
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'lg',
          })}
        >
          <span className="text-[13px] font-bold">Ticket Check</span>
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
