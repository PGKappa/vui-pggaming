export default function UpcomingRaceCard(props: { id: number }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Upcoming {props.id}</h1>
    </div>
  )
}
