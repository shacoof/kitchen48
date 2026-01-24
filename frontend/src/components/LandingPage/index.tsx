import Header from './Header'
import YourRecipes from './YourRecipes'
import MeetOurMasters from './MeetOurMasters'
import WhatsHot from './WhatsHot'
import Newsletter from './Newsletter'
import Footer from './Footer'

export default function LandingPage() {
  return (
    <div className="bg-background-dark text-slate-100 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">
        <YourRecipes />
        <MeetOurMasters />
        <WhatsHot />
        <Newsletter />
      </main>
      <Footer />
    </div>
  )
}
