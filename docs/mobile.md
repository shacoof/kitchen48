When presenting on mobile the main screen needs to be designed as follows 

## 1) Top bar (header) 8% of screen hight 

**What it contains (Home feed):**

* Left: logo 
* Center/top area: Kitchen48
* Right: icons  **Inbox** (show as envelop), **Create** (show as + sign), **favorites** (show as heart), **profile** (show as person icon)

**How it behaves:**

* **Visible when you’re at the top of the feed**
* As you **scroll down**, the top bar  **collapses/hides** to give more vertical space
* When you **scroll slightly up** (even a little), it  **reappears** (“scroll up = show chrome” behavior)

## 2) “People” row at the top (Stories / avatars) 15%

This is the row of **circular profile pictures** sitting **below the top bar** and **above the first post**.

**How it behaves:**

* It’s **only at the top of the feed**
* The moment you **start scrolling**, it **scrolls away** with the content (it’s not sticky)
* It **returns only when you scroll back up** near the top


## 3) Middle area (main content) 67%

This is the primary “canvas” that changes depending on the tab:

* **Home:** featured recipies, currently just the latest 5 
* **favorites:** when favorites selected you see all your recipies 
* **Search/Explore:** grid/mosaic, search field at top
* **Reels:** full-screen vertical video
* **Profile:** grid, highlights, profile header
* **DM/Inbox:** list of conversations

**How it behaves:**

* It’s a **scrollable region** (vertical)
* maximize this area by **hiding the top bar** during downward scroll
* Content is  edge-to-edge, with safe-area padding around notches/home indicators

## 4) Bottom bar (tab bar / navigation) 10%

Typically 5 icons (common pattern):

* Home
* Search/Explore
* Create (+)
* Reels
* Profile

**How it behaves:**

* Usually **persistent (always visible)** across most main screens
* On some screens/modes (e.g., certain full-screen viewers), it can **temporarily hide** to reduce clutter, but it typically comes back immediately when you exit full-screen content

## 5) What’s “sticky” vs “scrolls away” (key idea)

* **Scrolls away with content:** Stories row (“people”), the first posts, feed items
* **Often hides on scroll down / shows on scroll up:** Top bar (header)
* **Mostly stays visible:** Bottom navigation bar

## 6) Common scroll behavior rule of thumb

* **Scroll down:** hide UI chrome (especially the top bar) to show more content
* **Scroll up:** reveal UI chrome so you can navigate/search/message

If you tell me which screen you mean (Home feed vs Reels vs Profile), I can describe that exact layout too — each one is slightly different (e.g., Reels has overlay controls on the right, Profile has a sticky-ish header behavior, etc.).
