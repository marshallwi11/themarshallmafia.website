"use client"

import Image from "next/image"
import { useState, useEffect, useCallback, useRef } from "react"
import type { AnimationItem } from "lottie-web"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ── Lottie hero ───────────────────────────────────────────────────────────────
function LottieHero({ flipping, lightMode }: { flipping: boolean; lightMode: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    let cancelled = false
    import("lottie-web").then((lottie) => {
      if (cancelled || !containerRef.current) return
      animRef.current = lottie.default.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/tmm_hero.json",
      })
    })
    return () => {
      cancelled = true
      animRef.current?.destroy()
      animRef.current = null
    }
  }, [])

  const heroClass = [
    "select-none pointer-events-none w-full aspect-square hero-lottie",
    flipping ? "hero-flip-anim" : "",
  ].filter(Boolean).join(" ")

  // Wrap in a parent div for the invert — the heroFadeIn animation's `forwards`
  // fill locks filter on the inner element, so we isolate invert on the wrapper.
  return (
    <div style={lightMode && !flipping ? { filter: "invert(1)" } : undefined}>
      <div ref={containerRef} className={heroClass} aria-label="The Marshall Mafia" />
    </div>
  )
}

// ── Star rating ───────────────────────────────────────────────────────────────
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="star-rating" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} width="20" height="20" viewBox="0 0 20 20"
          fill={i < rating ? "#F8AC00" : "none"}
          stroke={i < rating ? "#F8AC00" : "rgba(255,255,255,0.25)"}
          strokeWidth="1.5"
        >
          <path d="M10 1.5l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.77l-4.78 2.51.91-5.32L2.27 7.12l5.34-.78z" />
        </svg>
      ))}
    </div>
  )
}

// ── Showcase info popup ───────────────────────────────────────────────────────
const SHOWCASE_INFO = [
  {
    img: 1,
    text: <>The <span className="text-tmm-red">Marshall Mafia</span> is a social deduction card game where players secretly take on the roles of <span className="text-tmm-red">Mafia</span> members or <span className="text-tmm-cream">Villagers</span>, and through rounds of sleeping, discussion and voting, the <span className="text-tmm-cream">Villagers</span> must identify and eliminate the <span className="text-tmm-red">Mafia</span> before they are outnumbered.</>,
  },
  {
    img: 2,
    text: <>Discover the hidden secrets of the game! — Learn how roles are assigned, master the rules of <span className="text-tmm-red">Mafia</span> vs. <span className="text-tmm-cream">Villagers</span>, and get familiar with the game{"'"}s core phases.</>,
  },
  {
    img: 3,
    text: <>From the silence of the Sleep Phase to the heated debates in Discussion, and the all-important Vote — sharpen your strategy to outsmart your rivals!</>,
  },
]

function InfoPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-backdrop" />
      <div className="modal-scroll-bare animate-modal-in">
        <div className="modal-content-pane" style={{display:"flex",flexDirection:"column",gap:"clamp(16px,4vw,28px)"}}>
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">ABOUT</span>
              <span className="play-block-subtitle">THE GAME</span>
            </div>
            {SHOWCASE_INFO.map((item, i) => (
              <div key={i} className="info-popup-item">
                <span className="info-popup-num">0{i + 1}</span>
                <p className="play-block-body" style={{margin:0}}>{item.text}</p>
              </div>
            ))}
          </div>
          <div className="play-card-pill" onClick={e => e.stopPropagation()}>
            <span className="play-block-title">the marshall mafia</span>
            <span className="play-block-subtitle">est. 2025</span>
          </div>
        </div>
      </div>
    </div>
  )
}

type ModalType = "play" | "showcase" | "music" | "collect" | "reviews" | null

const TESTIMONIALS = [
  { name: "Sophie R.", handle: "@sophieplays", rating: 5, title: "Best game night ever", body: "We played this with 10 people and couldn't stop laughing. The Mafia had us completely fooled for three rounds — pure chaos in the best way. Already ordered a second copy for friends." },
  { name: "James T.", handle: "@jamest_uk", rating: 5, title: "Instant classic", body: "The music card is a genius touch — it actually makes sleeping players stay quiet. Card quality is brilliant and the artwork is slick. Would give 6 stars if I could." },
  { name: "Priya K.", handle: "@priyakplays", rating: 4, title: "Incredibly addictive", body: "Played it at a birthday party and we went through 8 rounds before anyone wanted to stop. The Jester role is hilarious — someone actually won by convincing the village they were Mafia." },
  { name: "Liam O.", handle: "@liamoconnor", rating: 5, title: "High quality, high drama", body: "The art direction on the cards is stunning. Every role feels balanced and the rule card system means you can customise difficulty. Genuinely the best social deduction game I own." },
  { name: "Mia C.", handle: "@miac_games", rating: 5, title: "We played 12 rounds in one sitting", body: "That says everything. The pacing is perfect — sleep phase builds tension, discussion gets loud, voting is ruthless. Marshall role rotated every game and everyone loved being in control." },
]

export default function Home() {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [lightMode, setLightMode] = useState(false)
  const [logoFlipping, setLogoFlipping] = useState(false)
  const [cartShaking, setCartShaking] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const lastTapRef = useRef<number>(0)
  const swipeTouchStartX = useRef<number>(0)
  // Left-to-right swipe order for the pill nav
  const SWIPE_ORDER: ModalType[] = ["play", "music", null, "showcase", "reviews"]

  // Slider refs — only the 5 items IN the main nav pill
  const navInnerRef = useRef<HTMLDivElement>(null)
  const btnPlayRef  = useRef<HTMLButtonElement>(null)
  const btnMusicRef = useRef<HTMLButtonElement>(null)
  const btnHomeRef  = useRef<HTMLButtonElement>(null)
  const btnShowRef  = useRef<HTMLButtonElement>(null)
  const btnRevRef   = useRef<HTMLButtonElement>(null)
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 72 })
  const [sliderReady, setSliderReady] = useState(false)

  const measureSlider = useCallback((skipTransition = false) => {
    const inner = navInnerRef.current
    if (!inner) return
    const refMap: Record<string, React.RefObject<HTMLButtonElement | null>> = {
      play: btnPlayRef, music: btnMusicRef, home: btnHomeRef,
      showcase: btnShowRef, reviews: btnRevRef,
    }
    const key = activeModal === "collect" ? "home" : (activeModal ?? "home")
    const btn = refMap[key]?.current
    if (!btn) return
    const btnRect   = btn.getBoundingClientRect()
    const innerRect = inner.getBoundingClientRect()
    setSliderStyle({ left: btnRect.left - innerRect.left, width: btnRect.width })
    if (skipTransition) setTimeout(() => setSliderReady(true), 0)
  }, [activeModal])

  useEffect(() => { measureSlider(true) }, []) // eslint-disable-line
  useEffect(() => { if (sliderReady) measureSlider(false) }, [activeModal, sliderReady, measureSlider])
  useEffect(() => {
    const onResize = () => measureSlider(false)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [measureSlider])

  const handleLogoTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < 400) {
      setLogoFlipping(true)
      setTimeout(() => setLightMode(m => !m), 250)
      setTimeout(() => setLogoFlipping(false), 520)
    }
    lastTapRef.current = now
  }, [])

  // Cart shake every 10s unless collect is open
  useEffect(() => {
    const id = setInterval(() => {
      if (activeModal !== "collect") {
        setCartShaking(true)
        setTimeout(() => setCartShaking(false), 900)
      }
    }, 10000)
    return () => clearInterval(id)
  }, [activeModal])

  const openModal  = (m: ModalType) => { setInfoOpen(false); setActiveModal(m) }
  const closeModal = useCallback(() => setActiveModal(null), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeModal(); setInfoOpen(false) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [closeModal])

  useEffect(() => {
    document.body.style.overflow = activeModal ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [activeModal])

  useEffect(() => {
    if (activeModal === "collect" && !stripeClientSecret && !stripeLoading) {
      setStripeLoading(true)
      fetch("/api/checkout", { method: "POST" })
        .then(r => r.json())
        .then(d => { setStripeClientSecret(d.clientSecret); setStripeLoading(false) })
        .catch(() => setStripeLoading(false))
    }
    if (activeModal !== "collect") { setStripeClientSecret(null); setStripeLoading(false) }
  }, [activeModal])

  return (
    <>
      <div className={`tmm-backdrop${lightMode ? " tmm-backdrop--light" : ""}`} aria-hidden="true" />

      <main className={`site-canvas${lightMode ? " tmm-light" : ""}`}>

        <LottieHero flipping={logoFlipping} lightMode={lightMode} />

        {/* ── INFO POPUP ── */}
        <InfoPopup open={infoOpen} onClose={() => setInfoOpen(false)} />

        {/* ── NAV CLUSTER: ! info · main pill · cart pill ── */}
        <div className="nav-cluster">

        {/* ? / ! INFO BUTTON — left side of cluster */}
        <button
          className={`info-btn${infoOpen ? " info-btn--active" : ""}`}
          onClick={() => setInfoOpen(v => !v)}
          aria-label="About"
          aria-expanded={infoOpen}
        >
          <span className="info-btn-inner">{infoOpen ? "!" : "?"}</span>
        </button>

        {/* ── MAIN FLOATING PILL NAV ── */}
        <nav
          className="pill-nav"
          onTouchStart={(e) => { swipeTouchStartX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - swipeTouchStartX.current
            if (Math.abs(dx) < 48) return
            const current: ModalType = infoOpen ? null : (activeModal === "collect" ? null : activeModal)
            let cur = SWIPE_ORDER.indexOf(current)
            if (cur === -1) cur = 2 // fallback to home centre
            const idx = dx < 0
              ? Math.min(cur + 1, SWIPE_ORDER.length - 1)
              : Math.max(cur - 1, 0)
            const next = SWIPE_ORDER[idx]
            setInfoOpen(false)
            next === null ? closeModal() : openModal(next)
          }}
        >
          <div className="pill-nav-inner" ref={navInnerRef}>
            <span
              className="pill-nav-slider"
              style={{
                left: sliderStyle.left,
                width: sliderStyle.width,
                transition: sliderReady
                  ? "left 0.38s cubic-bezier(0.34,1.15,0.64,1), width 0.38s cubic-bezier(0.34,1.15,0.64,1)"
                  : "none",
              }}
              aria-hidden="true"
            />

            {/* PLAY */}
            <button ref={btnPlayRef}
              className={`pill-nav-item${activeModal === "play" ? " pill-nav-item--active" : ""}`}
              onClick={() => activeModal === "play" ? closeModal() : openModal("play")}
              aria-label="Play"
            >
              {activeModal === "play" ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="4" y="2" width="4.5" height="16" rx="1.5"/>
                  <rect x="11.5" y="2" width="4.5" height="16" rx="1.5"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 2.5L17.5 10 4 17.5V2.5Z"/>
                </svg>
              )}
            </button>

            {/* MUSIC */}
            <button ref={btnMusicRef}
              className={`pill-nav-item${activeModal === "music" ? " pill-nav-item--active" : ""}`}
              onClick={() => activeModal === "music" ? closeModal() : openModal("music")}
              aria-label="Music"
            >
              {activeModal === "music" ? (
                // Speaker with 3 sound waves — modal open / playing
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .905.184 1.768.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.06A6.5 6.5 0 0116.95 10a6.5 6.5 0 01-2.06 3.89.75.75 0 001.06 1.06A8 8 0 0018.45 10a8 8 0 00-2.5-4.95zM13.596 7.404a.75.75 0 00-1.06 1.06 3.5 3.5 0 010 4.95.75.75 0 001.06 1.06 5 5 0 000-7.07z"/>
                </svg>
              ) : (
                // Muted speaker — default state
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.547 3.062A.75.75 0 0110 3.75v12.5a.75.75 0 01-1.264.546L4.703 13H3.167a.75.75 0 01-.7-.48A6.985 6.985 0 012 10c0-.905.184-1.768.468-2.52a.75.75 0 01.699-.48h1.535l4.033-3.796a.75.75 0 01.812-.142zM13.28 7.22a.75.75 0 10-1.06 1.06L13.94 10l-1.72 1.72a.75.75 0 001.06 1.06L15 11.06l1.72 1.72a.75.75 0 101.06-1.06L16.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L15 8.94l-1.72-1.72z"/>
                </svg>
              )}
            </button>

            {/* HOME — eyes logo */}
            <button ref={btnHomeRef}
              className="pill-nav-item pill-nav-home"
              onClick={() => { closeModal(); handleLogoTap() }}
              aria-label="Home"
            >
              <img
                src="/tmm_themarshallmafia_logo.svg"
                alt="TMM"
                className={[
                  "pill-nav-home-logo",
                  logoFlipping ? "logo-flip-anim" : "",
                  !logoFlipping && lightMode ? "logo-flipped" : "",
                ].filter(Boolean).join(" ")}
                draggable={false}
              />
            </button>

            {/* SHOWCASE */}
            <button ref={btnShowRef}
              className={`pill-nav-item${activeModal === "showcase" ? " pill-nav-item--active" : ""}`}
              onClick={() => activeModal === "showcase" ? closeModal() : openModal("showcase")}
              aria-label="Showcase"
            >
              {activeModal === "showcase" ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                </svg>
              )}
            </button>

            {/* REVIEWS */}
            <button ref={btnRevRef}
              className={`pill-nav-item${activeModal === "reviews" ? " pill-nav-item--active" : ""}`}
              onClick={() => activeModal === "reviews" ? closeModal() : openModal("reviews")}
              aria-label="Reviews"
            >
              {activeModal === "reviews" ? (
                <svg width="21" height="21" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ) : (
                <svg width="21" height="21" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 110-2 1 1 0 010 2zM7 9a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2z"/>
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* ── CART PILL — right side of cluster ── */}
        <nav className="cart-pill-nav">
          <button
            className={`cart-pill-btn${activeModal === "collect" ? " cart-pill-btn--active" : ""}${cartShaking ? " cart-pill-btn--shake" : ""}`}
            onClick={() => activeModal === "collect" ? closeModal() : openModal("collect")}
            aria-label="Collect"
          >
            <span className="cart-pill-btn-inner">
              {activeModal === "collect" ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5v1h18v-1A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v5A1.5 1.5 0 002.5 15h15a1.5 1.5 0 001.5-1.5v-5zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M7 6V5a3 3 0 016 0v1h3.5A.5.5 0 0117 6.5l-1.5 10a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.45L3 6.5A.5.5 0 013.5 6H7zm2 0V5a1 1 0 012 0v1H9zm0 3a1 1 0 112 0 1 1 0 01-2 0z"/>
                </svg>
              )}
            </span>
            <span className="cart-pill-badge" aria-hidden="true" />
          </button>
        </nav>

        </div>{/* end .nav-cluster */}

        {/* ==================== PLAY MODAL ==================== */}
        {activeModal === "play" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-backdrop" />
            <div className="modal-scroll-bare animate-modal-in">
              <div className="modal-content-pane" style={{display:"flex",flexDirection:"column",gap:"clamp(24px,5vw,50px)"}}>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">HOW TO PLAY</span><span className="play-block-subtitle">INSTRUCTIONS</span></div>
                  <p className="play-block-body">In The Marshall Mafia, <span className="text-tmm-cream">Villagers</span> must Identify, expose and vote out all <span className="text-tmm-red">Mafia</span> members, while the <span className="text-tmm-red">Mafia{"'"}s</span> goal is to secretly eliminate all <span className="text-tmm-cream">Villagers</span> until they outnumber them.</p>
                  <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> hosts the game, managing the flow of the rounds and overseeing the distribution of roles and actions.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">SETUP</span><span className="play-block-subtitle">(SEE PLAY CARD*)</span></div>
                  <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> shuffles the character cards and hands one to each player. These determine whether a player is a <span className="text-tmm-cream">Villager</span>, <span className="text-tmm-red">Mafia</span>, or has a special role. All Players must keep their character roles secret.</p>
                  <p className="play-block-body">Use the (<span className="text-tmm-green">Music Card*</span>) for game ambience.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">RULES</span><span className="play-block-subtitle">(SEE RULES CARD*)</span></div>
                  <p className="play-block-body">At the start, players agree on selected (<span className="text-muted">Rule Cards*</span>). PLAYERS MUST CLOSE Their EYES & Remain Silent DURING THE SLEEP PHASE.</p>
                  <p className="play-block-body">DURING THE SLEEP PHASE The <span className="text-tmm-cream">MARSHALL</span> must not SPEAK Directly TOWARDS Each AWOKEN Player. AWOKEN Players SILENTLY POINT & CONFIRM Decisions by hand signals.</p>
                  <p className="play-block-body">Do not cheat. If you die, PICK a "<span className="text-tmm-red">DEATH CARD</span>" FROM THE PACK. Timed discussion period (3 minutes recommended). Voting order must switch each round. SCAN the "<span className="text-tmm-green">MUSIC CARD</span>" to make the GAME more enjoyable.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">CHARACTERS</span><span className="play-block-subtitle">(SEE EACH ROLE CARD*)</span></div>
                  <p className="play-block-body"><span className="text-tmm-cream">MARSHALL (1)</span> — The games host and all-seeing narrator.</p>
                  <p className="play-block-body"><span className="text-tmm-green">ANGEL (2)</span> — Pick player to save (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-blue">DETECTIVE (2)</span> — Guess if a player is Mafia, <span className="text-tmm-cream">Marshall</span> indicates Yes/No (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-green">DOCTOR (2)</span> — Save the mafia{"'"}s target Yes/No (Single Use).</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">JESTER (1)</span> — Get voted out to win.</p>
                  <p className="play-block-body"><span className="text-tmm-red">MAFIA (3)</span> — Pick player to kill (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">SILENCER (1)</span> — Pick player to silence (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-cream">VILLAGER (10)</span> — Vote out mafia to win.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASES</span><span className="play-block-subtitle">1, 2 & 3</span></div>
                  <p className="play-block-body">Each round: 1. SLEEP → 2. DISCUSSION → 3. VOTE.</p>
                  <p className="play-block-body">If games go too quickly, role groups (<span className="text-tmm-red">KILL</span>, <span className="text-tmm-blue">GUESS</span>, <span className="text-tmm-green">SAVE</span>, <span className="text-tmm-yellow">WILD</span>) must decide together on one player.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 1.</span><span className="play-block-subtitle">SLEEP</span></div>
                  <p className="play-block-body"><span className="text-tmm-red">KILL</span> — Mafia choose a player to eliminate.</p>
                  <p className="play-block-body"><span className="text-tmm-blue">GUESS</span> — Detective attempts to identify a player.</p>
                  <p className="play-block-body"><span className="text-tmm-green">SAVE</span> — Angel protects one player.</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">WILD</span> — Special roles perform their actions.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 2.</span><span className="play-block-subtitle">DISCUSSION</span></div>
                  <p className="play-block-body">All players open their eyes and debate. The <span className="text-tmm-cream">Marshall</span> sets a timer (3 min recommended). Players must not reveal their card.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 3.</span><span className="play-block-subtitle">VOTE</span></div>
                  <p className="play-block-body">Each player votes to eliminate someone. Most votes = eliminated. Ties trigger a re-vote.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">ROUNDS</span><span className="play-block-subtitle">REPEAT</span></div>
                  <p className="play-block-body">a. <span className="text-tmm-cream">Villagers</span> win by voting out all <span className="text-tmm-red">Mafia</span>.</p>
                  <p className="play-block-body">b. <span className="text-tmm-red">Mafia</span> wins by outnumbering <span className="text-tmm-cream">Villagers</span>.</p>
                  <p className="play-block-body">c. <span className="text-tmm-yellow">Wild</span> roles win by fulfilling unique conditions.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">Links</span><span className="play-block-subtitle">SNEAK PEAKS!</span></div>
                  <p className="play-block-body">Collect → <a href="https://linktr.ee/themarshallmafia" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">linktr.ee/themarshallmafia</a></p>
                  <p className="play-block-body">Music → <a href="https://linktr.ee/themarshallmafia.music" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">linktr.ee/themarshallmafia.music</a></p>
                  <p className="play-block-body">Developer → <a href="https://linktr.ee/marshallwi11" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">linktr.ee/marshallwi11</a></p>
                </div>
                <div className="play-card-pill" onClick={e => e.stopPropagation()}>
                  <span className="play-block-title">by marshallwi11</span>
                  <span className="play-block-subtitle">est. 2025</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SHOWCASE MODAL ==================== */}
        {activeModal === "showcase" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-backdrop" />
            <div className="modal-scroll-bare animate-modal-in">
              {/* Images only — no text cards */}
              <div className="showcase-list" onClick={e => e.stopPropagation()}>
                {[1,2,3,4,5,6,7].map(n => (
                  <div key={n} className="showcase-card">
                    <div className="showcase-img-well">
                      <Image
                        src={`/images/tmm_picture_${n}.jpg`}
                        alt={`The Marshall Mafia — image ${n}`}
                        width={1200} height={900}
                        loading={n === 1 ? "eager" : "lazy"}
                        priority={n === 1}
                        sizes="(max-width:600px) 100vw, 600px"
                        style={{width:"100%",height:"auto"}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== MUSIC MODAL ==================== */}
        {activeModal === "music" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-backdrop" />
            <div className="modal-scroll-bare animate-modal-in">
              <div className="modal-content-pane">
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="music-modal-header">
                    <span className="play-block-title">LISTEN</span>
                    <span className="play-block-subtitle" style={{fontSize:"14px"}}>play the full experience</span>
                  </div>
                  <div className="music-grid">
                    {[
                      { href:"https://open.spotify.com/playlist/3IciRcKF72CRT6MHI6C6Ry", src:"/images/tmm_music_spotify.jpg", label:"SPOTIFY" },
                      { href:"https://music.apple.com/gb/artist/marshallwi11/1844826623", src:"/images/tmm_music_apple_music.jpg", label:"APPLE MUSIC" },
                      { href:"https://tidal.com/playlist/5f88e8b6-cded-4806-9c94-b22894328454", src:"/images/tmm_music_tidal.jpg", label:"TIDAL" },
                      { href:"https://music.amazon.co.uk/artists/B0FV93YR78/marshallwi11", src:"/images/tmm_music_amazon_music.jpg", label:"AMAZON MUSIC" },
                      { href:"https://link.deezer.com/s/32Ea3kbAJwzVroL9cvbDM", src:"/images/tmm_music_deezer.jpg", label:"DEEZER" },
                      { href:"https://www.youtube.com/playlist?list=PLg6v-S6qo4anyKTHrD3zxMAnkHGrSLDlJ", src:"/images/tmm_music_youtube.jpg", label:"YOUTUBE" },
                    ].map(({ href, src, label }) => (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="music-tile">
                        <div className="music-tile-icon"><img src={src} alt={label} className="music-tile-img" loading="eager" /></div>
                        <span className="music-tile-label">{label}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Releases — right side matches left side font size */}
                <div className="play-card" onClick={e => e.stopPropagation()} style={{marginTop:"clamp(16px,4vw,32px)"}}>
                  <div className="play-card-header">
                    <span className="play-block-title">MUSIC</span>
                    <span className="play-block-subtitle">RELEASED</span>
                  </div>
                  <div className="releases-list">
                    <div className="release-row">
                      <span className="play-block-body">VOLUME 1</span>
                      <span className="play-block-body release-tag">EP</span>
                    </div>
                    <hr className="play-card-divider" />
                    <div className="release-row">
                      <span className="play-block-body">VOLUME 2</span>
                      <span className="play-block-body release-tag">ALBUM</span>
                    </div>
                    <hr className="play-card-divider" />
                    <div className="release-row">
                      <span className="play-block-body">VOLUME 3</span>
                      <span className="play-block-body release-tag">SOUNDTRACKS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== REVIEWS MODAL ==================== */}
        {activeModal === "reviews" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-backdrop" />
            <div className="modal-scroll-bare animate-modal-in">
              <div className="modal-content-pane" style={{display:"flex",flexDirection:"column",gap:"clamp(16px,4vw,28px)"}}>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">REVIEWS</span><span className="play-block-subtitle">WHAT THEY SAY</span></div>
                  <div className="reviews-summary">
                    <div className="reviews-score">
                      <span className="reviews-score-number">4.8</span>
                      <StarRating rating={5} />
                      <span className="play-block-subtitle" style={{fontSize:"12px"}}>out of 5 · {TESTIMONIALS.length} reviews</span>
                    </div>
                    <div className="reviews-bars">
                      {[5,4,3,2,1].map(n => {
                        const count = TESTIMONIALS.filter(t => t.rating === n).length
                        const pct = Math.round((count / TESTIMONIALS.length) * 100)
                        return (
                          <div key={n} className="review-bar-row">
                            <span className="review-bar-label">{n}</span>
                            <div className="review-bar-track"><div className="review-bar-fill" style={{width:`${pct}%`}} /></div>
                            <span className="review-bar-count">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="play-card" onClick={e => e.stopPropagation()}>
                    <div className="review-card-top">
                      <div className="review-avatar">{t.name[0]}</div>
                      <div>
                        <p className="play-block-body" style={{margin:0,lineHeight:1.2}}>{t.name}</p>
                        <span className="play-block-subtitle" style={{fontSize:"12px"}}>{t.handle}</span>
                      </div>
                      <div style={{marginLeft:"auto"}}><StarRating rating={t.rating} /></div>
                    </div>
                    <p className="play-block-body" style={{fontWeight:"bold",marginBottom:"-4px"}}>{t.title}</p>
                    <p className="play-block-body">{t.body}</p>
                  </div>
                ))}
                <div className="play-card-pill" onClick={e => e.stopPropagation()}>
                  <span className="play-block-title">verified purchases</span>
                  <span className="play-block-subtitle">tmm store</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== COLLECT MODAL ==================== */}
        {activeModal === "collect" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-backdrop" />
            <div className="modal-scroll-bare animate-modal-in">
              <div className="collect-list" onClick={e => e.stopPropagation()}>
                <div className="play-card">
                  <div className="play-card-header" style={{marginBottom:"20px"}}>
                    <span className="play-block-title">CHECKOUT</span>
                    <span className="play-block-subtitle">SECURE</span>
                  </div>
                  {stripeClientSecret ? (
                    <div style={{borderRadius:"16px", overflow:"hidden"}}>
                      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                        <EmbeddedCheckout />
                      </EmbeddedCheckoutProvider>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 gap-3">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span className="text-white/40 text-[13px]">Loading secure checkout...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </>
  )
}
