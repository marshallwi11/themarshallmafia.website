"use client"

import Image from "next/image"
import { useState, useEffect, useCallback, useRef } from "react"
import type { AnimationItem } from "lottie-web"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ── Lottie hero ───────────────────────────────────────────────────────────────
function LottieHero({ lightMode }: { lightMode: boolean }) {
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

  // Dark mode: flip eyes right-side up. Light mode: invert colours only.
  return (
    <div style={lightMode ? { filter: "invert(1)" } : { transform: "scaleY(-1)" }}>
      <div ref={containerRef} className="select-none pointer-events-none w-full aspect-square hero-lottie" aria-label="The Marshall Mafia" />
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
function InfoPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-backdrop" />
      <div className="modal-scroll-bare animate-modal-in">
        <div className="modal-content-pane" style={{display:"flex",flexDirection:"column",gap:"clamp(16px,4vw,28px)"}}>
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">OBJECTIVE</span>
              <span className="play-block-subtitle">INFORMATION</span>
            </div>
            <p className="play-block-body" style={{margin:0}}>
              The <span className="text-tmm-cream">Marshall</span> <span className="text-tmm-red">Mafia</span> is a social deduction card game where players secretly take on the roles of <span className="text-tmm-red">Mafia</span> members or <span className="text-tmm-brown">Villagers</span>, and through rounds of sleeping, discussion and voting, the <span className="text-tmm-brown">Villagers</span> must identify and eliminate the <span className="text-tmm-red">Mafia</span> before they are outnumbered.
            </p>
          </div>
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">READY</span>
              <span className="play-block-subtitle">click play*</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"clamp(14px,3vw,22px)"}}>
              <p className="play-block-body" style={{margin:0}}>
                Discover the hidden secrets of the game! — Learn how roles are assigned, master the rules of <span className="text-tmm-red">Mafia</span> vs. <span className="text-tmm-brown">Villagers</span>, and get familiar with the game{"'"}s core phases.
              </p>
              <p className="play-block-body" style={{margin:0}}>
                From the silence of the Sleep Phase to the heated debates in Discussion, and the all-important Vote — sharpen your strategy to outsmart your rivals!
              </p>
            </div>
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
  { name: "Isabella M", handle: "@ella_m", rating: 5, title: "Amazing for group bonding", body: "The Marshall Mafia is amazing for group bonding, I played this game with my youth group and it was amazing... it really helped everyone to get to know each other and created fun memories!" },
]

export default function Home() {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [lightMode, setLightMode] = useState(false)
  const [logoFlipping, setLogoFlipping] = useState(false)
  const [cartShaking, setCartShaking] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  // 0 = intro text showing | 1 = text fading out | 2 = nav visible
  const [navIntro, setNavIntro] = useState(0)
  const lastTapRef = useRef<number>(0)
  const swipeTouchStartX = useRef<number>(0)
  // Left-to-right swipe order for the pill nav (middle 5 items)
  const SWIPE_ORDER: ModalType[] = ["play", "music", null, "showcase", "reviews"]

  // Site-load intro: text pill → fade → nav icons
  useEffect(() => {
    const t1 = setTimeout(() => setNavIntro(1), 2200)
    const t2 = setTimeout(() => setNavIntro(2), 3800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Slider refs — all 7 items in the unified pill
  const navInnerRef = useRef<HTMLDivElement>(null)
  const btnInfoRef  = useRef<HTMLButtonElement>(null)
  const btnPlayRef  = useRef<HTMLButtonElement>(null)
  const btnMusicRef = useRef<HTMLButtonElement>(null)
  const btnHomeRef  = useRef<HTMLButtonElement>(null)
  const btnShowRef  = useRef<HTMLButtonElement>(null)
  const btnRevRef   = useRef<HTMLButtonElement>(null)
  const btnCartRef  = useRef<HTMLButtonElement>(null)
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 52 })
  const [sliderReady, setSliderReady] = useState(false)

  const measureSlider = useCallback((skipTransition = false) => {
    const inner = navInnerRef.current
    if (!inner) return
    const refMap: Record<string, React.RefObject<HTMLButtonElement | null>> = {
      info: btnInfoRef, play: btnPlayRef, music: btnMusicRef, home: btnHomeRef,
      showcase: btnShowRef, reviews: btnRevRef, cart: btnCartRef,
    }
    let key: string
    if (infoOpen) key = "info"
    else if (activeModal === "collect") key = "cart"
    else key = activeModal ?? "home"
    const btn = refMap[key]?.current
    if (!btn) return
    const btnRect   = btn.getBoundingClientRect()
    const innerRect = inner.getBoundingClientRect()
    setSliderStyle({ left: btnRect.left - innerRect.left, width: btnRect.width })
    if (skipTransition) setTimeout(() => setSliderReady(true), 0)
  }, [activeModal, infoOpen])

  useEffect(() => { measureSlider(true) }, []) // eslint-disable-line
  useEffect(() => { if (sliderReady) measureSlider(false) }, [activeModal, infoOpen, sliderReady, measureSlider])
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

        <LottieHero lightMode={lightMode} />

        {/* ── INFO POPUP ── */}
        <InfoPopup open={infoOpen} onClose={() => setInfoOpen(false)} />

        {/* ── NAV CLUSTER: unified pill — all 7 items ── */}
        <div className="nav-cluster">
          <nav
            className="pill-nav"
            style={{ pointerEvents: navIntro < 2 ? "none" : undefined }}

            onTouchStart={(e) => { swipeTouchStartX.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - swipeTouchStartX.current
              if (Math.abs(dx) < 48) return
              const current: ModalType = infoOpen ? null : (activeModal === "collect" ? null : activeModal)
              let cur = SWIPE_ORDER.indexOf(current)
              if (cur === -1) cur = 2
              const idx = dx < 0
                ? Math.min(cur + 1, SWIPE_ORDER.length - 1)
                : Math.max(cur - 1, 0)
              const next = SWIPE_ORDER[idx]
              setInfoOpen(false)
              next === null ? closeModal() : openModal(next)
            }}
          >
            <div className="pill-nav-inner" ref={navInnerRef}>

              {/* ── Sliding glass indicator ── */}
              <span
                className="pill-nav-slider"
                style={{
                  left: sliderStyle.left,
                  width: sliderStyle.width,
                  opacity: navIntro < 2 ? 0 : 1,
                  transition: sliderReady
                    ? "left 0.72s cubic-bezier(0.65,0,0.35,1), width 0.72s cubic-bezier(0.65,0,0.35,1), opacity 0.9s cubic-bezier(0.65,0,0.35,1)"
                    : "opacity 0.9s cubic-bezier(0.65,0,0.35,1)",
                }}
                aria-hidden="true"
              />

              {/* ── Intro text overlay — blurs icons behind, fades out to reveal them ── */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 2,
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  borderRadius: "1000px",
                  opacity: navIntro < 2 ? 1 : 0,
                  transition: "opacity 1.4s cubic-bezier(0.65,0,0.35,1)",
                }}
              >
                <span className="nav-intro-text">THE MARSHALL MAFIA</span>
              </div>

              {/* ── All icon buttons — fade in after intro text fades out ── */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                opacity: navIntro < 2 ? 0 : 1,
                transition: "opacity 1.2s cubic-bezier(0.65,0,0.35,1)",
              }}>

              {/* INFO — ℹ️ circle (default) / ❕ exclamation circle (active) */}
              <button ref={btnInfoRef}
                className={`pill-nav-item${infoOpen ? " pill-nav-item--active" : ""}`}
                onClick={() => { closeModal(); setInfoOpen(v => !v) }}
                aria-label="About"
                aria-expanded={infoOpen}
              >
                {infoOpen ? (
                  // Exclamation circle — active state
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"/>
                  </svg>
                ) : (
                  // Info circle — default state
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"/>
                  </svg>
                )}
              </button>

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
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .905.184 1.768.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.06A6.5 6.5 0 0116.95 10a6.5 6.5 0 01-2.06 3.89.75.75 0 001.06 1.06A8 8 0 0018.45 10a8 8 0 00-2.5-4.95zM13.596 7.404a.75.75 0 00-1.06 1.06 3.5 3.5 0 010 4.95.75.75 0 001.06 1.06 5 5 0 000-7.07z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.547 3.062A.75.75 0 0110 3.75v12.5a.75.75 0 01-1.264.546L4.703 13H3.167a.75.75 0 01-.7-.48A6.985 6.985 0 012 10c0-.905.184-1.768.468-2.52a.75.75 0 01.699-.48h1.535l4.033-3.796a.75.75 0 01.812-.142zM13.28 7.22a.75.75 0 10-1.06 1.06L13.94 10l-1.72 1.72a.75.75 0 001.06 1.06L15 11.06l1.72 1.72a.75.75 0 101.06-1.06L16.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L15 8.94l-1.72-1.72z"/>
                  </svg>
                )}
              </button>

              {/* HOME — eyes logo */}
              <button ref={btnHomeRef}
                className={`pill-nav-item pill-nav-home${(activeModal === null && !infoOpen) ? " pill-nav-item--active" : ""}`}
                onClick={() => { closeModal(); setInfoOpen(false); handleLogoTap() }}
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

              {/* CART */}
              <button ref={btnCartRef}
                className={`pill-nav-item${activeModal === "collect" ? " pill-nav-item--active" : ""}${cartShaking ? " pill-nav-item--shake" : ""}`}
                onClick={() => activeModal === "collect" ? closeModal() : openModal("collect")}
                aria-label="Collect"
                style={{ position: "relative" }}
              >
                {activeModal === "collect" ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5v1h18v-1A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v5A1.5 1.5 0 002.5 15h15a1.5 1.5 0 001.5-1.5v-5zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M7 6V5a3 3 0 016 0v1h3.5A.5.5 0 0117 6.5l-1.5 10a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.45L3 6.5A.5.5 0 013.5 6H7zm2 0V5a1 1 0 012 0v1H9zm0 3a1 1 0 112 0 1 1 0 01-2 0z"/>
                  </svg>
                )}
                <span className="cart-pill-badge" aria-hidden="true" />
              </button>

              </div>{/* end buttons wrapper */}
            </div>{/* end pill-nav-inner */}
          </nav>
        </div>{/* end .nav-cluster */}

        {/* ==================== PLAY MODAL ==================== */}
        {activeModal === "play" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-backdrop" />
            <div className="modal-scroll-bare animate-modal-in">
              <div className="modal-content-pane" style={{display:"flex",flexDirection:"column",gap:"clamp(24px,5vw,50px)"}}>
                {/* BOX 1 — HOW TO PLAY */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">HOW TO PLAY</span><span className="play-block-subtitle">INSTRUCTIONS</span></div>
                  <p className="play-block-body">In The <span className="text-tmm-cream">Marshall</span> <span className="text-tmm-red">Mafia</span>, <span className="text-tmm-brown">Villagers</span> must Identify, expose and vote out all <span className="text-tmm-red">Mafia</span> members, while the <span className="text-tmm-red">Mafia{"'"}s</span> goal is to secretly eliminate all <span className="text-tmm-brown">Villagers</span> until they outnumber them. The <span className="text-tmm-cream">Marshall</span> hosts the game, managing the flow of the rounds and overseeing the distribution of roles and actions.</p>
                </div>

                {/* BOX 2 — SETUP */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">SETUP</span><span className="play-block-subtitle">(SEE PLAY CARD*)</span></div>
                  <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> shuffles the character cards (chosen by the players*) and hands one to each player. These cards determine whether a player is a <span className="text-tmm-brown">Villager</span>, <span className="text-tmm-red">Mafia</span>, or has a special role (see Character Cards* for details on each character{"'"}s abilities). Note - all Players must keep their character roles secret. Use the (<span className="text-tmm-yellow">Music Card*</span>) as an added bonus, it is used for the game ambience (stopping voting on players that make noise while asleep &amp; puts players in the mood to continue playing).</p>
                </div>

                {/* BOX 3 — RULES */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">RULES</span><span className="play-block-subtitle">(SEE RULES CARD*)</span></div>
                  <p className="play-block-body">At the start of the game, players agree on selected (Rule Cards*), This allows for players who have played different rules to agree on how the game will be played.</p>
                  <p className="play-block-body">PLAYERS MUST CLOSE Their EYES &amp; Remain Silent DURING THE SLEEP PHASE</p>
                  <p className="play-block-body">DURING THE SLEEP PHASE The <span className="text-tmm-cream">MARSHALL</span> ROLE must not SPEAK Directly TOWARDS Each AWOKEN Player, otherwise all players know which role a player has.</p>
                  <p className="play-block-body">AWOKEN Players SILENTLY POINT &amp; CONFIRM Decisions WITH THE <span className="text-tmm-cream">MARSHALL</span>, by hand signals or mouthing their choice to the <span className="text-tmm-cream">Marshall</span> overseeing the game.</p>
                  <p className="play-block-body">Do not cheat If you die, PICK a "DEATH CARD" FROM THE PACK, hold it to show other players you are eliminated from the game.</p>
                  <p className="play-block-body">Timed discussion period (3 minutes recommended, though it does not have to be*), to keep the rounds short and allow the game to be more decisive.</p>
                  <p className="play-block-body">Voting order must switch each round, to avoid the same players voting last, stopping them having an advantage.</p>
                  <p className="play-block-body">The <span className="text-tmm-cream">MARSHALL</span> role SHOULD change each GAME, so all players have a chance at playing.</p>
                  <p className="play-block-body">SCAN the "<span className="text-tmm-yellow">MUSIC CARD</span>" to make the GAME more enjoyable (helps the restless "sleeping" of players in the night)</p>
                </div>

                {/* BOX 4 — CHARACTERS */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">CHARACTERS</span><span className="play-block-subtitle">(SEE EACH ROLE CARD*)</span></div>
                  <p className="play-block-body"><span className="text-tmm-cream">MARSHALL (1)</span> — The games host and all-seeing narrator. Players with roles wake up during the (Sleep Phase) and open their eyes - in the order called by <span className="text-tmm-cream">Marshall</span> (detailed above*), player then does their role action before closing their eyes again.</p>
                  <p className="play-block-body"><span className="text-tmm-green">ANGEL (2)</span> — Pick player to save (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-blue">DETECTIVE (2)</span> — Pick player to guess if they are a <span className="text-tmm-red">mafia</span>, <span className="text-tmm-cream">Marshall</span> indicates Yes/No (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-green">DOCTOR (2)</span> — <span className="text-tmm-cream">Marshall</span> shows who the <span className="text-tmm-red">mafia</span> killed, save them Yes/No (Single Use).</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">JESTER (1)</span> — Get voted out to win the game.</p>
                  <p className="play-block-body"><span className="text-tmm-red">MAFIA (3)</span> — Pick player to kill (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">SILENCER (1)</span> — Pick player to silence (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-brown">VILLAGER (10)</span> — Vote out <span className="text-tmm-red">mafia</span> to win.</p>
                </div>

                {/* BOX 5 — PHASES */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASES</span><span className="play-block-subtitle">1, 2 &amp; 3</span></div>
                  <p className="play-block-body">Each round in The <span className="text-tmm-cream">Marshall</span> <span className="text-tmm-red">Mafia</span> consists of three phases.</p>
                  <p className="play-block-body">1. SLEEP → 2. DiscussioN → 3. Vote</p>
                  <p className="play-block-body">If the games go to quickly or too many players are getting eliminated each night, the role groups (e.g. if there are 2+ <span className="text-tmm-green">Angels</span>, 2+ <span className="text-tmm-red">Mafia</span>, 2+ <span className="text-tmm-blue">Detectives</span>) each type of role (<span className="text-tmm-red">KILL</span>, <span className="text-tmm-blue">GUESS</span>, <span className="text-tmm-green">SAVE</span>, <span className="text-tmm-yellow">WILD</span>) must decide one player to do their action on.</p>
                </div>

                {/* BOX 6 — PHASE 1. SLEEP */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 1.</span><span className="play-block-subtitle">SLEEP</span></div>
                  <p className="play-block-body">This is the secretive action phase. All players close their eyes, and the <span className="text-tmm-cream">Marshall</span> calls specific character roles to perform their actions in a set order:</p>
                  <p className="play-block-body"><span className="text-tmm-red">KILL</span> — The <span className="text-tmm-red">Mafia</span> choose a player to eliminate.</p>
                  <p className="play-block-body"><span className="text-tmm-blue">GUESS</span> — The <span className="text-tmm-blue">Detective</span> (or similar roles) attempt to discover another player{"'"}s identity.</p>
                  <p className="play-block-body"><span className="text-tmm-green">SAVE</span> — The <span className="text-tmm-green">Angel</span> (or similar roles) can protect one player from elimination.</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">WILD</span> — Any other special roles perform their actions (depending on game customisation).</p>
                  <p className="play-block-body">After all actions are completed, the <span className="text-tmm-cream">Marshall</span> announces the result of the night{"'"}s activities (who has been eliminated, if anyone was saved... without naming the player of course, etc.).</p>
                </div>

                {/* BOX 7 — PHASE 2. DISCUSSION */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 2.</span><span className="play-block-subtitle">discussion</span></div>
                  <p className="play-block-body">All players open their eyes and begin arguing, accusing, or defending themselves based on what they believe has happened during the Sleep Phase. The <span className="text-tmm-cream">Marshall</span> should set a timer (Recommended 3 minutes) for this phase, they can also stop the discussions at a natural moment to keep the phase concise and intense.</p>
                  <p className="play-block-body">Players are free to speculate, but players must not reveal their card (if a player is caught showing their card to another player, they are instantly eliminated.</p>
                </div>

                {/* BOX 8 — PHASE 3. VOTE */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 3.</span><span className="play-block-subtitle">VOTE</span></div>
                  <p className="play-block-body">After the discussion, players proceed straight to the voting. Each <span className="text-tmm-brown">VILLAGER</span> ROLE votes to eliminate someone they suspect is <span className="text-tmm-red">Mafia</span>, while the <span className="text-tmm-red">Mafia</span> aim to deceive <span className="text-tmm-brown">Villagers</span> into voting out their own.</p>
                  <p className="play-block-body">Each player is allowed to make a single vote, on anyone they choose. when a player casts a vote for another player - the player who has been voted for must hold up a finger for each vote received.</p>
                  <p className="play-block-body">If the vote ties, a re-vote occurs between the tied players (depending on chosen Rule Cards*). The player with the most votes is immediately eliminated from the game, and their character is revealed (also depending on chosen Rule Cards*).</p>
                </div>

                {/* BOX 9 — ROUNDS */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">ROUNDS</span><span className="play-block-subtitle">REPEAT</span></div>
                  <p className="play-block-body">The game continues through the Sleep, Discussion, and Vote phases until one of the following conditions is achieved:</p>
                  <p className="play-block-body">a. <span className="text-tmm-brown">Villagers</span> win by successfully voting out all <span className="text-tmm-red">Mafia</span> members.</p>
                  <p className="play-block-body">b. <span className="text-tmm-red">Mafia</span> wins by eliminating enough <span className="text-tmm-brown">Villagers</span> to outnumber them.</p>
                  <p className="play-block-body">c. <span className="text-tmm-yellow">Wild</span> role wins by fulfilling the unique conditions tied to their abilities.</p>
                </div>

                {/* BOX 10 — LINKS */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">Links</span><span className="play-block-subtitle">SNEEK PEAKS!</span></div>
                  <p className="play-block-body">Collect → <a href="https://linktr.ee/themarshallmafia" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">https://linktr.ee/themarshallmafia</a></p>
                  <p className="play-block-body">music → <a href="https://linktr.ee/themarshallmafia.music" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">https://linktr.ee/themarshallmafia.music</a></p>
                  <p className="play-block-body">Developer → <a href="https://linktr.ee/marshallwi11" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">https://linktr.ee/marshallwi11</a></p>
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
                    <span className="play-block-subtitle">play the full experience</span>
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
                      <div className="review-avatar" style={{background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {/* flipped = happy eyes (correct orientation), unflipped = sad — mirrors hero dark mode fix */}
                        <img
                          src="/tmm_themarshallmafia_logo.svg"
                          alt=""
                          style={{width:"22px",height:"auto",display:"block",transform: t.rating > 3 ? "scaleY(-1)" : "none"}}
                        />
                      </div>
                      <div style={{minWidth:0,flex:"1 1 0"}}>
                        <p className="play-block-body" style={{margin:0,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.name}</p>
                        <span className="play-block-subtitle" style={{fontSize:"12px"}}>{t.handle}</span>
                      </div>
                      <div style={{flexShrink:0}}><StarRating rating={t.rating} /></div>
                    </div>
                    <p className="play-block-body"><span style={{fontWeight:"bold"}}>{t.title},</span> {t.body}</p>
                  </div>
                ))}
                <div className="play-card-pill" onClick={e => e.stopPropagation()}>
                  <span className="play-block-title">purchases</span>
                  <span className="play-block-subtitle">verified</span>
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
