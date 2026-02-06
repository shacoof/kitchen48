import { useTranslation } from 'react-i18next'
import ChefCard from './ChefCard'

const chefs = [
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuHnKOmfDUV6thSXfxLvRHCaFnueB-5Nzjm3GtpSH7rYFxBfp8XhpnHIRiph9SL6trbxmxiqJAFWelXP48hqpqEYW0-_VW4zcFMz7FldaxIiuJq7hw2Cma9UVdvxnND4fOdDTwQcI4bTXSslajflqcif9DFLRksuHFaymbnW6k0JXkDaUI830_f0uBWYDcWMvHfGG9J2oSxAZwbfpAcIIp1llrXA8gF59PGSRGu91vzt-H03r98gThpS8gZb6hi5aQongmLcQb9F0",
    name: "Mario Batali",
    specialty: "Italian Fusion",
    verified: true,
    rotateDirection: 'right' as const,
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA87WiGPzwsit1mwHfEExpnWdLyvzqDh9kQg7oZVylg_RbtMwe1uhtFjGLLJ8Tw44h_EjzVAXrHjR1BAmjryTaiNWblCKOcrUqDdAQWud4jwIxP0tEIVd7c2OuHboudj_mX7xmg-1rWUodkIHMLtrw5UzqxnYS3MfbCTvGsINQlE_XxFl_13UPOZO2_8_1gEXpWdvSpsC4JHIDZpfuKj_Wn6wyqwvleO7rEl0gWxen3uJlGiffAAfdZNLaBWs9Or_F8Pj-cpJMlHoc",
    name: "Sarah Jenkins",
    specialty: "Pastry Expert",
    verified: false,
    rotateDirection: 'left' as const,
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaYsdklEBdIYrdTIFFWXP2E5Hayk9RhKAZSLgE2EE6XhL-lw6_fVcVJM0eUXW0vqMpxs5aD7gj0VWCdqSsJ_pKC4mHOBsbHZItL_F6eja8eMjjJusX28Jql5cf3fx_ZLI_D9kug5zlES3hOnL_wGNZ8ZWIgJYhNWcyaUCMonnybEPmb2FnUhBAIO78O0gncYa7c-6NOVpWFPvYYtsJ5WINIh_upRRdOTqS9y1kxB4CVTUq4i8zjr348QrfmVvZdTrQQ9FP75n29RA",
    name: "Kenji Lopez",
    specialty: "Modernist Cuisine",
    verified: true,
    rotateDirection: 'right' as const,
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCy_zo00H5Q_rHcWk7y936SUOB_oHethhm4s95VjusyWP5agI8h1qSg_ofdd0lWd78I5Ck294sUGIQh9vxybUl3E_btMj1Z3kJs92nQtWP2S8KO-ub-ymqZCHZbV-DV3luuspy7eu17cSBZCc26GSin7-HQIARxvE4TkOvsSBfaNDsuyRv83xDBgSXrOZOFI4UtTXHs4CwOWaqltYnjOdWMxCLGD1OVogQM1LipdbZs7JA8G0mmDCHYB5Z74MaaH4LtM0NOHuPR4x0",
    name: "Elena Rodriguez",
    specialty: "Tapas Specialist",
    verified: false,
    rotateDirection: 'left' as const,
  },
]

export default function MeetOurMasters() {
  const { t } = useTranslation('landing')

  return (
    <section className="bg-primary/40 rounded-[2rem] p-12">
      <div className="text-center mb-12">
        <h2 className="font-display text-4xl font-bold text-white mb-2">{t('meet_our_masters.title')}</h2>
        <p className="text-slate-400">{t('meet_our_masters.subtitle')}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-12">
        {chefs.map((chef, index) => (
          <ChefCard key={index} {...chef} />
        ))}
      </div>
    </section>
  )
}
