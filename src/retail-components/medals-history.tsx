import Image from 'next/image'

export default function MedalsHistory(props: { history: number[] }) {
  return props.history.map((position, idx) => {
    let imageSrc = ''
    let alt = ''

    switch (position) {
      case 1:
        imageSrc = '/cockade_gold.png'
        alt = '1'
        break
      case 2:
        imageSrc = '/cockade_silver.png'
        alt = '2'
        break
      case 3:
        imageSrc = '/cockade_bronze.png'
        alt = '3'
        break
      default:
        return (
          <div
            key={idx}
<<<<<<< HEAD
            className="flex h-8 w-8 items-center justify-center text-[20px] text-black"
=======
            className="flex h-8 w-7 items-center justify-center text-[20px] text-black"
>>>>>>> origin/00-inizio-cassa-retaiò
          >
            X
          </div>
        )
    }

    return (
      <div
        key={idx}
<<<<<<< HEAD
        className="relative flex h-8 w-8 items-center justify-center"
=======
        className="relative flex h-8 w-7 items-center justify-center"
>>>>>>> origin/00-inizio-cassa-retaiò
      >
        <Image
          src={imageSrc}
          alt={alt}
          width={64}
          height={64}
          className="absolute"
        />
<<<<<<< HEAD
        <span className="relative inset-0 pb-[8px] text-[16px] font-bold text-black">
=======
        <span className="relative inset-0 pb-[7.5px] text-[16px] font-bold text-black">
>>>>>>> origin/00-inizio-cassa-retaiò
          {position}
        </span>
      </div>
    )
  })
}
