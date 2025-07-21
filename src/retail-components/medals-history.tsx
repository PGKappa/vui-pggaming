export default function MedalsHistory(props: { history: number[] }) {
  return props.history.map((position, idx) =>
    position === 1 || position === 2 || position === 3 ? (
      <div
        key={idx}
        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
          position === 1
            ? 'bg-yellow-400'
            : position === 2
              ? 'bg-gray-300'
              : position === 3
                ? 'bg-orange-500'
                : ''
        }`}
      >
        {position}
      </div>
    ) : (
      <div
        key={idx}
        className="flex h-5 w-5 items-center justify-center text-xs text-black"
      >
        X
      </div>
    ),
  )
}
