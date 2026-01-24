import RecipeCard from './RecipeCard'

const recipes = [
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLxd9mw3pky6hxeLqYISqQkeCym4EdENUEKK3QH9etCq4_f2Kz1pVDqoWv1ckNOH7Yr8-xvbTnjYnXGlGxo4oozfwZ8idSNKNl0UmAzUKe4Mb3FepprjQahnBRd6RBqcSsm-_rMgkjnUISRMwWXdh_kei4z1_fXE7pGHaZCYTlaBx3O3_mWDYxFRGGEXltZM93QEJFSk4EcbC6Al9bEDlK2wMbrnyU7qe8QnIMpmMG4rlpWyxbhbkv4EMpnd8FCNk_wMKlI4xdfSo",
    tag: "Healthy",
    time: "20m",
    title: "Tuna Poke Bowl with Avocado",
    description: "Fresh, vibrant, and packed with protein.",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD4UpeMauocXn7wO2w_Mrf4Yx9PjX1kiHzynAnnGoKfC9NOml99uH9ec-GUBhj2vAQWeI09z7YoPeynjbBqLdCXZL4-ePhQ7sgaCDoiGzdiB0XKeRZhZy5KhDMrM3p9E_mDlsGyY5GNy-aAwq1r_IX0T4mfbH0fjbSXa92lL9zysKPk9Rtxmr_fy11UkLfi8PgoGh3BL3Mnk0Nf7I6o9tgYyztq9edsXtxBaIR3hUlJAskJR_a9953Zhfk6CimcD3nltH8cM3GN0Y0",
    tag: "Breakfast",
    time: "15m",
    title: "Fluffy Maple Pancakes",
    description: "The classic morning comfort food.",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZFXvEDbO5bIfmTTJGISHycBzlQBuPzlalJO5r9R7BmZGAMsY3hrb5e8ZP-3-IS1UtzOSDjS3Ui59QX1Bk-vyBCSVdIQ535Q2IdWMpU4herf-263aSqZH1nsGEE5qxuIciOyIwlVEa9XcsJiqSXwdisUubUi4vZJKLWeGMQB_cyaeICOK8n7lhWpK1rVjScRj-PPS05IgmZMFlEZIRdbdgSSXlXUeIROFLAsdUKhZP_vVaEczZBFBYwjTH37tfS4_Hm3JChauZx5c",
    tag: "Dinner",
    time: "45m",
    title: "Mediterranean Herb Chicken",
    description: "Slow roasted with rosemary and thyme.",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHsKGuaxDNu3rhU8yAEV7Bbl-mgQ3C_LC4q4llBUBCusUqvADoHWEjE1smHbalSB5pl3ZkvcNFZalorBxY1mJPZp60QlaXci89sA0o2HeBYHyxFZt11IHF3Gr0nEt5MnFmlfZxgeH16BFzbTL6mJKXW-1zIrBf0CM8O7lChZVik9QPDfSkC0ckT8mbG267Bxpldt4Eh3MjNOu283E06BQTkOw1cgKDCilDJ-VR1kbD3ZzntxEWKlObsvWYlTOuBfkP5hA6IrBOErg",
    tag: "Vegan",
    time: "10m",
    title: "Zen Garden Salad",
    description: "Light vinaigrette and seasonal greens.",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHbs0ltbP54P_slcLAbGGDiQtODG7oxl5OBmf_f-dBmaeCyThsoEIYLm4mfBjnHJvoE8UIWw8aQaGdTRayAxr9bzRvjnquHshjtMgY4PnE8-WdbiUeXZQbvO5f3e7hKkK7GI3yNhT34UyKhq_mT3fJ0aI0PU84PD9YhsCaBUucYG_v79sZEzkZsEaQG1Jkxfj29OU4MHwi7RrT-0KHC2WvplZcuakIdZXQ_djcEq1F33u71G4XtRNFEJ2-OQHpbz-kVlbg1EdB_5M",
    tag: "Italian",
    time: "30m",
    title: "Authentic Neapolitan Pizza",
    description: "Classic sourdough with fresh basil.",
  },
]

export default function YourRecipes() {
  return (
    <section>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl font-bold text-white">Your Recipes</h2>
          <p className="text-slate-400 mt-2">Personalized collection based on your taste</p>
        </div>
        <a className="text-accent-orange font-semibold flex items-center gap-1 hover:underline" href="#">
          View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
      </div>
      <div className="flex overflow-x-auto gap-8 pb-6 custom-scrollbar scroll-smooth">
        {recipes.map((recipe, index) => (
          <RecipeCard key={index} {...recipe} />
        ))}
      </div>
    </section>
  )
}
