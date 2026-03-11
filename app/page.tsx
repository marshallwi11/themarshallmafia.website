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
    "select-none pointer-events-none w-[84vw] max-w-[1175px] aspect-square hero-lottie",
    flipping ? "hero-flip-anim" : "",
    lightMode && !flipping ? "hero-lottie--light" : "",
  ].filter(Boolean).join(" ")

  return (
    <div
      ref={containerRef}
      className={heroClass}
      aria-label="The Marshall Mafia"
    />
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
  const lastTapRef = useRef<number>(0)

  // Slider refs — only the 5 items IN the nav pill
  const navInnerRef  = useRef<HTMLDivElement>(null)
  const btnPlayRef   = useRef<HTMLButtonElement>(null)
  const btnMusicRef  = useRef<HTMLButtonElement>(null)
  const btnHomeRef   = useRef<HTMLButtonElement>(null)
  const btnShowRef   = useRef<HTMLButtonElement>(null)
  const btnRevRef    = useRef<HTMLButtonElement>(null)
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
    const btnRect  = btn.getBoundingClientRect()
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

  // Double-tap logo → toggle light mode
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
        setTimeout(() => setCartShaking(false), 700)
      }
    }, 10000)
    return () => clearInterval(id)
  }, [activeModal])

  const openModal  = (m: ModalType) => setActiveModal(m)
  const closeModal = useCallback(() => setActiveModal(null), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal() }
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

      <main className={`h-screen w-screen overflow-hidden relative flex flex-col items-center justify-center${lightMode ? " tmm-light" : ""}`}>

        <LottieHero flipping={logoFlipping} lightMode={lightMode} />

        {/* ── FLOATING CART DOT — separate pill to the left of the nav ── */}
        <button
          className={`cart-dot${activeModal === "collect" ? " cart-dot--active" : ""}${cartShaking ? " cart-dot--shake" : ""}`}
          onClick={() => activeModal === "collect" ? closeModal() : openModal("collect")}
          aria-label="Collect"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M7 6V5a3 3 0 016 0v1h3.5A.5.5 0 0117 6.5l-1.5 10a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.45L3 6.5A.5.5 0 013.5 6H7zm2 0V5a1 1 0 012 0v1H9zm0 3a1 1 0 112 0 1 1 0 01-2 0z"/>
          </svg>
          <span className="cart-dot-badge" aria-hidden="true" />
        </button>

        {/* ── FLOATING PILL NAV ── */}
        <nav className="pill-nav">
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 2.5L17.5 10 4 17.5V2.5Z"/>
              </svg>
            </button>

            {/* MUSIC */}
            <button ref={btnMusicRef}
              className={`pill-nav-item${activeModal === "music" ? " pill-nav-item--active" : ""}`}
              onClick={() => activeModal === "music" ? closeModal() : openModal("music")}
              aria-label="Music"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="3" width="13" height="2.5" rx="1.25"/>
                <rect x="6" y="3" width="2.5" height="11" rx="1.25"/>
                <rect x="16.5" y="3" width="2.5" height="9" rx="1.25"/>
                <ellipse cx="8" cy="16.5" rx="3.5" ry="2.5"/>
                <ellipse cx="18.5" cy="14.5" rx="3.5" ry="2.5"/>
              </svg>
            </button>

            {/* HOME — eyes logo, centre */}
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect x="2" y="2" width="7" height="7" rx="1"/>
                <rect x="11" y="2" width="7" height="7" rx="1"/>
                <rect x="2" y="11" width="7" height="7" rx="1"/>
                <rect x="11" y="11" width="7" height="7" rx="1"/>
              </svg>
            </button>

            {/* REVIEWS — star */}
            <button ref={btnRevRef}
              className={`pill-nav-item${activeModal === "reviews" ? " pill-nav-item--active" : ""}`}
              onClick={() => activeModal === "reviews" ? closeModal() : openModal("reviews")}
              aria-label="Reviews"
            >
              <svg width="21" height="21" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 1.5l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.77l-4.78 2.51.91-5.32L2.27 7.12l5.34-.78z"/>
              </svg>
            </button>

          </div>
        </nav>

        {/* ==================== PLAY MODAL ==================== */}
        {activeModal === "play" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-backdrop" />
            <div className="modal-scroll-bare animate-modal-in">
              <div className="max-w-[675px] mx-auto pb-[80px] px-4 sm:px-6" style={{display:"flex",flexDirection:"column",gap:"clamp(24px,5vw,50px)"}}>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">HOW TO PLAY</span><span className="play-block-subtitle">INSTRUCTIONS</span></div>
                  <p className="play-block-body">In The Marshall Mafia, <span className="text-tmm-cream">Villagers</span> must Identify, expose and vote out all <span className="text-tmm-red">Mafia</span> members, while the <span className="text-tmm-red">Mafia{"'"}s</span> goal is to secretly eliminate all <span className="text-tmm-cream">Villagers</span> until they outnumber them.</p>
                  <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> hosts the game, managing the flow of the rounds and overseeing the distribution of roles and actions.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">SETUP</span><span className="play-block-subtitle">(SEE PLAY CARD*)</span></div>
                  <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> shuffles the character cards (chosen by the players*) and hands one to each player. These cards determine whether a player is a <span className="text-tmm-cream">Villager</span>, <span className="text-tmm-red">Mafia</span>, or has a special role (see <span className="text-muted">Character Cards*</span> for details on each character{"'"}s abilities).</p>
                  <p className="play-block-body">Note — all Players must keep their character roles secret.</p>
                  <p className="play-block-body">Use the (<span className="text-tmm-green">Music Card*</span>) as an added bonus, it is used for the game ambience.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">RULES</span><span className="play-block-subtitle">(SEE RULES CARD*)</span></div>
                  <p className="play-block-body">At the start of the game, players agree on selected (<span className="text-muted">Rule Cards*</span>). This allows for players who have played different rules to agree on how the game will be played.</p>
                  <p className="play-block-body">PLAYERS MUST CLOSE Their EYES & Remain Silent DURING THE SLEEP PHASE.</p>
                  <p className="play-block-body">DURING THE SLEEP PHASE The <span className="text-tmm-cream">MARSHALL</span> ROLE must not SPEAK Directly TOWARDS Each AWOKEN Player, otherwise all players know which role a player has.</p>
                  <p className="play-block-body">AWOKEN Players SILENTLY POINT & CONFIRM Decisions WITH THE <span className="text-tmm-cream">MARSHALL</span>, by hand signals or mouthing their choice.</p>
                  <p className="play-block-body">Do not cheat. If you die, PICK a "<span className="text-tmm-red">DEATH CARD</span>" FROM THE PACK, hold it to show other players you are eliminated.</p>
                  <p className="play-block-body">Timed discussion period (3 minutes recommended). Voting order must switch each round. The <span className="text-tmm-cream">MARSHALL</span> role SHOULD change each GAME.</p>
                  <p className="play-block-body">SCAN the "<span className="text-tmm-green">MUSIC CARD</span>" to make the GAME more enjoyable.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">CHARACTERS</span><span className="play-block-subtitle">(SEE EACH ROLE CARD*)</span></div>
                  <p className="play-block-body"><span className="text-tmm-cream">MARSHALL (1)</span> — The games host and all-seeing narrator.</p>
                  <p className="play-block-body"><span className="text-tmm-green">ANGEL (2)</span> — Pick player to save (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-blue">DETECTIVE (2)</span> — Pick player to guess if they are a mafia, <span className="text-tmm-cream">Marshall</span> indicates Yes/No (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-green">DOCTOR (2)</span> — <span className="text-tmm-cream">Marshall</span> shows who the mafia killed, save them Yes/No (Single Use).</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">JESTER (1)</span> — Get voted out to win the game.</p>
                  <p className="play-block-body"><span className="text-tmm-red">MAFIA (3)</span> — Pick player to kill (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">SILENCER (1)</span> — Pick player to silence (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-cream">VILLAGER (10)</span> — Vote out mafia to win.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASES</span><span className="play-block-subtitle">1, 2 & 3</span></div>
                  <p className="play-block-body">Each round consists of three phases: 1. SLEEP → 2. DISCUSSION → 3. VOTE.</p>
                  <p className="play-block-body">If games go too quickly, role groups (<span className="text-tmm-red">KILL</span>, <span className="text-tmm-blue">GUESS</span>, <span className="text-tmm-green">SAVE</span>, <span className="text-tmm-yellow">WILD</span>) must decide one player to act on together.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 1.</span><span className="play-block-subtitle">SLEEP</span></div>
                  <p className="play-block-body">All players close their eyes. The <span className="text-tmm-cream">Marshall</span> calls roles in order:</p>
                  <p className="play-block-body"><span className="text-tmm-red">KILL</span> — The <span className="text-tmm-red">Mafia</span> choose a player to eliminate.</p>
                  <p className="play-block-body"><span className="text-tmm-blue">GUESS</span> — The <span className="text-tmm-blue">Detective</span> attempts to identify a player.</p>
                  <p className="play-block-body"><span className="text-tmm-green">SAVE</span> — The <span className="text-tmm-green">Angel</span> protects one player.</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">WILD</span> — Special roles perform their actions.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 2.</span><span className="play-block-subtitle">DISCUSSION</span></div>
                  <p className="play-block-body">All players open their eyes and debate. The <span className="text-tmm-cream">Marshall</span> sets a timer (3 min recommended). Players must not reveal their card.</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 3.</span><span className="play-block-subtitle">VOTE</span></div>
                  <p className="play-block-body">Each player votes to eliminate someone. Voted players hold up a finger per vote. Most votes = eliminated. Ties trigger a re-vote (depending on chosen <span className="text-muted">Rule Cards*</span>).</p>
                </div>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">ROUNDS</span><span className="play-block-subtitle">REPEAT</span></div>
                  <p className="play-block-body">a. <span className="text-tmm-cream">Villagers</span> win by voting out all <span className="text-tmm-red">Mafia</span>.</p>
                  <p className="play-block-body">b. <span className="text-tmm-red">Mafia</span> wins by outnumbering <span className="text-tmm-cream">Villagers</span>.</p>
                  <p className="play-block-body">c. <span className="text-tmm-yellow">Wild</span> roles win by fulfilling their unique conditions.</p>
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
              <div className="showcase-list" onClick={e => e.stopPropagation()}>
                <div className="showcase-card"><div className="showcase-img-well"><Image src="/images/tmm_picture_1.jpg" alt="The Marshall Mafia" width={1200} height={900} priority sizes="(max-width:600px) 100vw, 600px" style={{width:"100%",height:"auto"}} /></div></div>
                <div className="play-card"><p className="play-block-body">The <span className="text-tmm-red">Marshall Mafia</span> is a social deduction card game where players secretly take on the roles of <span className="text-tmm-red">Mafia</span> members or <span className="text-tmm-cream">Villagers</span>, and through rounds of sleeping, discussion and voting, the <span className="text-tmm-cream">Villagers</span> must identify and eliminate the <span className="text-tmm-red">Mafia</span> before they are outnumbered.</p></div>
                <div className="showcase-card"><div className="showcase-img-well"><Image src="/images/tmm_picture_2.jpg" alt="Roles and rules" width={1200} height={900} loading="lazy" sizes="(max-width:600px) 100vw, 600px" style={{width:"100%",height:"auto"}} /></div></div>
                <div className="play-card"><p className="play-block-body">Discover the hidden secrets of the game! — Learn how roles are assigned, master the rules of <span className="text-tmm-red">Mafia</span> vs. <span className="text-tmm-cream">Villagers</span>, and get familiar with the game{"'"}s core phases.</p></div>
                <div className="showcase-card"><div className="showcase-img-well"><Image src="/images/tmm_picture_3.jpg" alt="Game phases" width={1200} height={900} loading="lazy" sizes="(max-width:600px) 100vw, 600px" style={{width:"100%",height:"auto"}} /></div></div>
                <div className="play-card"><p className="play-block-body">From the silence of the Sleep Phase to the heated debates in Discussion, and the all-important Vote — sharpen your strategy to outsmart your rivals!</p></div>
                {[4,5,6,7].map(n => (
                  <div key={n} className="showcase-card"><div className="showcase-img-well"><Image src={`/images/tmm_picture_${n}.jpg`} alt={`TMM image ${n}`} width={1200} height={900} loading="lazy" sizes="(max-width:600px) 100vw, 600px" style={{width:"100%",height:"auto"}} /></div></div>
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
              <div className="w-full max-w-[600px] mx-auto px-4 sm:px-6 pb-[80px]">
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
                <div className="play-card" onClick={e => e.stopPropagation()} style={{marginTop:"clamp(16px,4vw,32px)"}}>
                  <div className="play-card-header"><span className="play-block-title">MUSIC</span><span className="play-block-subtitle">RELEASED</span></div>
                  <div className="releases-list">
                    <div className="release-row"><span className="play-block-body">VOLUME 1</span><span className="release-tag">EP</span></div>
                    <hr className="play-card-divider" />
                    <div className="release-row"><span className="play-block-body">VOLUME 2</span><span className="release-tag">ALBUM</span></div>
                    <hr className="play-card-divider" />
                    <div className="release-row"><span className="play-block-body">VOLUME 3</span><span className="release-tag">SOUNDTRACKS</span></div>
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
              <div className="max-w-[600px] mx-auto px-4 sm:px-6 pb-[80px]" style={{display:"flex",flexDirection:"column",gap:"clamp(16px,4vw,28px)"}}>
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
