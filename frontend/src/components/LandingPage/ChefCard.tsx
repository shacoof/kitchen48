interface ChefCardProps {
  image: string
  name: string
  specialty: string
  verified?: boolean
  rotateDirection?: 'left' | 'right'
}

export default function ChefCard({ image, name, specialty, verified = false, rotateDirection = 'right' }: ChefCardProps) {
  const rotateClass = rotateDirection === 'right' ? 'group-hover:rotate-12' : 'group-hover:-rotate-12'

  return (
    <div className="text-center group">
      <div className="relative mb-4">
        <div className={`w-32 h-32 rounded-full border-4 border-accent-orange p-1 ${rotateClass} transition-transform duration-300`}>
          <img
            alt={name}
            className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all"
            src={image}
          />
        </div>
        {verified && (
          <div className="absolute -bottom-1 right-2 bg-accent-orange rounded-full p-1 border-2 border-primary">
            <span className="material-symbols-outlined text-white text-[14px] block">verified</span>
          </div>
        )}
      </div>
      <h4 className="font-bold text-white">{name}</h4>
      <p className="text-xs text-slate-500 uppercase tracking-wider">{specialty}</p>
    </div>
  )
}
