interface RecipeCardProps {
  image: string
  tag: string
  time: string
  title: string
  description: string
}

export default function RecipeCard({ image, tag, time, title, description }: RecipeCardProps) {
  return (
    <div className="group cursor-pointer flex-shrink-0 w-72">
      <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[4/5]">
        <img
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={image}
        />
        <span className="absolute top-4 left-4 bg-accent-green text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
          {tag}
        </span>
        <div className="absolute bottom-4 right-4 bg-primary/90 backdrop-blur-md p-2 rounded-lg text-white text-xs flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">schedule</span> {time}
        </div>
      </div>
      <h3 className="font-bold text-xl text-white group-hover:text-accent-orange transition-colors">
        {title}
      </h3>
      <p className="text-slate-500 text-sm mt-1">{description}</p>
    </div>
  )
}
