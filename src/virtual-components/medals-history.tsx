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
            className="flex h-6 w-6 items-center justify-center text-[20px] text-white"
          >
            X
          </div>
        )
    }

    return (
      <div
        key={idx}
        className="relative flex h-6 w-6 items-center justify-center"
      >
        <Image
          src={imageSrc}
          alt={alt}
          width={64}
          height={64}
          className="absolute"
        />
        <span className="absolute inset-0 z-10 flex items-center justify-center pb-[4px] text-[14px] font-bold text-black">
          {position}
        </span>
      </div>
    )
  })
}
