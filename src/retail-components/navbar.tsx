import { Info } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from './ui/button'

export default function Navbar() {
  return (
    <nav className="grid w-full grid-cols-12 items-center justify-between gap-4 bg-accent p-3">
      <div className="col-span-2 flex justify-center">
        <span className="whitespace-nowrap text-[16px] font-semibold text-background">
          Select the category:
        </span>
      </div>

      <div className='col-span-7 flex items-center gap-4'>
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
          <span className="text-[16px] font-bold">Ch1</span>
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
          <span className="text-[16px] font-bold">Ch3</span>
        </Link>

        <Link
          href="/retail"
          className={buttonVariants({
            variant: 'navbar',
            size: 'lg',
          })}
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

      <div className="col-span-3 flex justify-end gap-4">
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
