import { useTranslation } from 'react-i18next'
import TrendingCard from './TrendingCard'

const trendingRecipes = [
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHbs0ltbP54P_slcLAbGGDiQtODG7oxl5OBmf_f-dBmaeCyThsoEIYLm4mfBjnHJvoE8UIWw8aQaGdTRayAxr9bzRvjnquHshjtMgY4PnE8-WdbiUeXZQbvO5f3e7hKkK7GI3yNhT34UyKhq_mT3fJ0aI0PU84PD9YhsCaBUucYG_v79sZEzkZsEaQG1Jkxfj29OU4MHwi7RrT-0KHC2WvplZcuakIdZXQ_djcEq1F33u71G4XtRNFEJ2-OQHpbz-kVlbg1EdB_5M",
    title: "Authentic Neapolitan Pizza",
    tags: ["TRENDING", "SPICY"],
    likes: "12.4k",
    comments: "342",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVuplc26jwPMezFlPNt2i2EexAALD6Bg1xqVdOErYlh8djlDi9Bygk49R-yN_o2x3qxlj_oOUTL5Z9O940dVkNmKExW_PNIK2yd4A16sdkMp3xmlVI-SFw3Gby5hDBO6ZOynHKUfRSqmXf6N4XbsV8x_2iBlsrCACAKbxDFdBEaPDMJTclTduC-DA9eEF2Z7IxHdlbUERd49yfbz4dD94kykCA47OdJBmGASG4Czna_gQnlKQ0GyrEqHEpj_1R3M9V5pU9Jam19BY",
    title: "Tomahawk Steak with Chimichurri",
    tags: ["TRENDING", "PREMIUM"],
    likes: "8.9k",
    comments: "128",
  },
]

export default function WhatsHot() {
  const { t } = useTranslation('landing')

  return (
    <section>
      <div className="flex items-center gap-4 mb-8">
        <span className="material-symbols-outlined text-accent-orange">trending_up</span>
        <h2 className="font-display text-3xl font-bold text-white">{t('whats_hot.title')}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {trendingRecipes.map((recipe, index) => (
          <TrendingCard key={index} {...recipe} />
        ))}
      </div>
    </section>
  )
}
