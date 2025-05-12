import Image from 'next/image'
import Link from 'next/link'
import { Button, buttonVariants } from './ui/button'
import BallSvg from './ball'
import { Info } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="flex w-full flex-row items-center justify-between gap-1 bg-accent p-3 px-4">
      <div className="flex items-center gap-1">
        <Link
          href="/dogs-horses"
          className={buttonVariants({
            variant: 'navbar',
            size: 'sm',
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
            size: 'sm',
          })}
        >
          <Image
            src="/dog-image.png"
            alt="Dogs"
            width={40}
            height={20}
            className="object-contain"
          />
          <span className="text-xs font-bold">Ch1</span>
        </Link>

        <Button variant="navbar" size="sm" asChild>
          <Link
            href="/horses"
            className={buttonVariants({
              variant: 'navbar',
              size: 'sm',
            })}
          >
            <Image
              src="/horse-image.png"
              alt="Horses"
              width={40}
              height={20}
              className="object-contain"
            />
            <span className="text-xs font-bold">Ch3</span>
          </Link>
        </Button>

        <Link
          href="/retail"
          className={buttonVariants({
            variant: 'navbarSelected',
            size: 'sm',
            className: 'p-0 m-0',
          })}
        >
          <BallSvg className="size-full stroke-accent-foreground" />
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <Link
          href="/ticket-list"
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'sm',
          })}
        >
          <span className="font-bold">Ticket List</span>
        </Link>

        <Link
          href="/ticket-list"
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'sm',
          })}
        >
          <span className="font-bold">Ticket Check</span>
        </Link>

        <Link
          href="/info"
          className={buttonVariants({
            variant: 'ticketButton',
            size: 'sm',
          })}
        >
          <Info className="h-4 w-4" />
        </Link>
      </div>
    </nav>
  )
}
