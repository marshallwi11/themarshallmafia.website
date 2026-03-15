"use client"

import Image from "next/image"
import { useState, useEffect, useCallback, useRef } from "react"
import type { AnimationItem } from "lottie-web"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ── Mesh Gradient Background (pure WebGL — no external deps) ─────────────────
// Replaces the old CSS animated linear-gradient backdrop.
// Old CSS version is preserved (commented out) in globals.css under "LEGACY BACKDROP".
function MeshGradient({ lightMode }: { lightMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lightRef  = useRef(lightMode)
  useEffect(() => { lightRef.current = lightMode }, [lightMode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", {
      antialias: false, alpha: false, powerPreference: "low-power",
    })
    if (!gl) return

    // Minimal vertex shader — full-screen triangle strip
    const vsrc = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

    // Fragment shader — organic mesh gradient via fbm warp + gaussian blobs
    // Uses mix-based blending so colours look rich on both dark AND light backgrounds
    const fsrc = `precision mediump float;
uniform float u_t;
uniform float u_str; // blend strength (0-1) — tuned per mode
uniform vec2  u_r;
uniform vec3  u_bg;
uniform vec3  u_a;
uniform vec3  u_b;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
float n(vec2 p){
  vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*n(p);p*=2.;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/u_r;
  float t=u_t;
  // Organic warp using fractional Brownian motion
  vec2 d=vec2(fbm(uv*1.8+vec2(t*.08,t*.06)),fbm(uv*1.8+vec2(t*.06+3.7,t*.08+2.3)))*.3-.15;
  vec2 w=clamp(uv+d,0.,1.);
  // Corner anchors pushed well off-canvas so colour stays at edges, centre stays black
  vec2 pA=vec2(-.40,1.10)+vec2(sin(t*.12)*.12,cos(t*.09)*.10); // top-left corner
  vec2 pB=vec2(1.40,-.10)+vec2(cos(t*.09)*.12,sin(t*.12)*.10); // bottom-right corner
  // Higher falloff (3.6) = tighter blobs that don't bleed into the centre
  float wA=clamp(exp(-dot(w-pA,w-pA)*3.6),0.,u_str);
  float wB=clamp(exp(-dot(w-pB,w-pB)*3.6),0.,u_str);
  // Mix-based blend: works on any background colour without overflow
  vec3 col=mix(mix(u_bg,u_a,wA),u_b,wB);
  gl_FragColor=vec4(col,1.);
}`

    function mkShader(type: number, src: string) {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src); gl.compileShader(s); return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER,   vsrc))
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fsrc))
    gl.linkProgram(prog); gl.useProgram(prog)

    // Full-screen quad (triangle strip)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
    const aP = gl.getAttribLocation(prog, "p")
    gl.enableVertexAttribArray(aP)
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0)

    const uT   = gl.getUniformLocation(prog, "u_t")
    const uStr = gl.getUniformLocation(prog, "u_str")
    const uR   = gl.getUniformLocation(prog, "u_r")
    const uBg  = gl.getUniformLocation(prog, "u_bg")
    const uA   = gl.getUniformLocation(prog, "u_a")
    const uB   = gl.getUniformLocation(prog, "u_b")

    // Render at half CSS resolution for GPU performance
    function resize() {
      canvas.width  = Math.max(1, Math.floor(window.innerWidth  / 2))
      canvas.height = Math.max(1, Math.floor(window.innerHeight / 2))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener("resize", resize)

    const t0 = performance.now()
    let raf = 0
    function frame() {
      // speed factor 0.5 — slow, meditative drift
      const t = (performance.now() - t0) * 0.001 * 0.5
      gl.uniform1f(uT, t)
      gl.uniform2f(uR, canvas.width, canvas.height)
      if (lightRef.current) {
        // Light mode: near-white base — muted TMM green TL, muted TMM yellow BR
        gl.uniform1f(uStr, 0.42)            // 42% — edges vibrant, centre stays near-white
        gl.uniform3f(uBg,  0.97, 0.97, 0.97)
        gl.uniform3f(uA,   0.14, 0.68, 0.25) // muted green (top-left)
        gl.uniform3f(uB,   0.95, 0.58, 0.0 ) // muted yellow (bottom-right)
      } else {
        // Dark mode: black base — muted TMM blue TL, muted TMM red BR
        gl.uniform1f(uStr, 0.65)            // 65% — strong colour at edges, black centre
        gl.uniform3f(uBg,  0.0,  0.0,  0.0 )
        gl.uniform3f(uA,   0.02, 0.20, 0.52) // muted blue (top-left)
        gl.uniform3f(uB,   0.44, 0.02, 0.02) // muted red  (bottom-right)
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      try { gl.deleteProgram(prog); gl.deleteBuffer(buf) } catch (_) {}
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0,
        width: "100%", height: "100%",
        zIndex: 0, pointerEvents: "none", display: "block",
      }}
    />
  )
}

// ── Lottie hero ───────────────────────────────────────────────────────────────
function LottieHero({ lightMode, logoFading }: { lightMode: boolean; logoFading: boolean }) {
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

  // Opacity fades to 0 while logoFading; transform/filter swap while invisible.
  return (
    <div className="hero-rise-wrapper">
      <div style={{
        transform: "scaleY(-1)",
        filter: lightMode ? "invert(1)" : undefined,
        opacity: logoFading ? 0 : 1,
        transition: "opacity 0.18s linear",
      }}>
        <div ref={containerRef} className="select-none pointer-events-none w-full aspect-square hero-lottie" aria-label="The Marshall Mafia" />
      </div>
    </div>
  )
}

// ── Music Player ─────────────────────────────────────────────────────────────
function MusicPlayer({ audioRef, lightMode }: { audioRef: { current: HTMLAudioElement | null }; lightMode: boolean }) {
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)       // 0..1
  const [elapsed,  setElapsed]  = useState(0)       // seconds
  const [duration, setDuration] = useState(0)       // seconds

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime  = () => { setElapsed(a.currentTime); if (a.duration) setProgress(a.currentTime / a.duration) }
    const onMeta  = () => { if (!isNaN(a.duration)) setDuration(a.duration) }
    const onPlay  = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    a.addEventListener("timeupdate",     onTime)
    a.addEventListener("loadedmetadata", onMeta)
    a.addEventListener("durationchange", onMeta)
    a.addEventListener("play",           onPlay)
    a.addEventListener("pause",          onPause)
    setPlaying(!a.paused)
    setElapsed(a.currentTime)
    if (!isNaN(a.duration)) { setDuration(a.duration); if (a.duration) setProgress(a.currentTime / a.duration) }
    return () => {
      a.removeEventListener("timeupdate",     onTime)
      a.removeEventListener("loadedmetadata", onMeta)
      a.removeEventListener("durationchange", onMeta)
      a.removeEventListener("play",           onPlay)
      a.removeEventListener("pause",          onPause)
    }
  }, [audioRef])

  const toggle = () => { const a = audioRef.current; if (!a) return; a.paused ? a.play().catch(() => {}) : a.pause() }
  const seek   = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current; if (!a || !a.duration) return
    const v = +e.target.value; a.currentTime = v * a.duration; setProgress(v)
  }
  const fmt = (s: number) => (!s || isNaN(s)) ? "0:00" : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`

  const seekPct = `${(progress * 100).toFixed(1)}%`

  return (
    <div className="play-card" onClick={e => e.stopPropagation()} style={{marginTop:"clamp(16px,4vw,32px)"}}>
      {/* Header */}
      <div className="play-card-header">
        <span className="play-block-title">ARTIST</span>
        <span className="play-block-subtitle">SONG</span>
      </div>

      {/* Controls — above seek bar, skip buttons greyed (single looping track) */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"clamp(22px,5vw,34px)"}}>
        <button className="music-ctrl-btn music-ctrl-btn--disabled" aria-label="Previous track" aria-disabled="true">
          {/* Skip-back: vertical bar left + left-pointing triangle */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
          </svg>
        </button>
        <button className="music-ctrl-btn music-ctrl-btn--play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing
            ? <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            : <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          }
        </button>
        <button className="music-ctrl-btn music-ctrl-btn--disabled" aria-label="Next track" aria-disabled="true">
          {/* Skip-forward: exact mirror of skip-back */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <g transform="scale(-1,1) translate(-24,0)">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
            </g>
          </svg>
        </button>
      </div>

      {/* Seek / progress bar — white */}
      <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
        <input
          type="range" min="0" max="1" step="0.001" value={progress}
          onChange={seek} className={`music-range${lightMode ? " music-range--light" : ""}`}
          style={{"--pct": seekPct, "--track-fill": lightMode ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.90)"} as React.CSSProperties}
          aria-label="Seek"
        />
        {/* Timestamps — bigger */}
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span className="play-block-body" style={{fontSize:"clamp(13px,2.5vw,15px)",color: lightMode ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.55)"}}>{fmt(elapsed)}</span>
          <span className="play-block-body" style={{fontSize:"clamp(13px,2.5vw,15px)",color: lightMode ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.55)"}}>{fmt(duration)}</span>
        </div>
      </div>

      {/* Track info — artist LEFT, song RIGHT, same line */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:"12px"}}>
        <p className="play-block-body" style={{margin:0,color: lightMode ? "#111111" : "#ffffff",whiteSpace:"nowrap"}}>marshallwi11</p>
        <p className="play-block-body" style={{margin:0,fontSize:"clamp(11px,2vw,13px)",color: lightMode ? "rgba(0,0,0,0.40)" : "rgba(255,255,255,0.38)",textAlign:"right"}}>the marshall mafia (theme tune)</p>
      </div>
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
              <span style={{color:"#ffffff"}}>The Marshall Mafia</span> is a social deduction card game where players secretly take on the roles of <span className="text-tmm-red">Mafia</span> members or <span className="text-tmm-brown">Villagers</span>, and through rounds of sleeping, discussion and voting, the <span className="text-tmm-brown">Villagers</span> must identify and eliminate the <span className="text-tmm-red">Mafia</span> before they are outnumbered.
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
  const [logoFading, setLogoFading] = useState(false)
  const [packSelected, setPackSelected] = useState<"standard" | "expansion" | null>(null)
  const [reviewComing, setReviewComing] = useState(false)
  const [cartShaking, setCartShaking] = useState(false)
  const [homeHovered, setHomeHovered] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [modalSwitching, setModalSwitching] = useState(false)
  const [showcaseIdx, setShowcaseIdx] = useState(0)
  // 0 = intro text showing | 1 = text fading out | 2 = nav visible
  const [navIntro, setNavIntro] = useState(0)
  const lastTapRef = useRef<number>(0)
  const swipeTouchStartX = useRef<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Left-to-right swipe order for the pill nav (middle 5 items)
  const SWIPE_ORDER: ModalType[] = ["play", "music", null, "showcase", "reviews"]

  // Site-load intro: text pill → fade → nav icons
  useEffect(() => {
    const t1 = setTimeout(() => setNavIntro(1), 1000)  // text starts fading (1s hold)
    const t2 = setTimeout(() => setNavIntro(2), 1800)  // icons appear only after text is fully gone (~0.7s fade)
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
      // Fade out → swap mode while invisible → fade back in
      setLogoFading(true)
      setTimeout(() => {
        setLightMode(m => !m)
        setLogoFading(false)
      }, 200)
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
    }, 5000)
    return () => clearInterval(id)
  }, [activeModal])

  // Theme tune — autoplay at 50% vol; falls back to first interaction if browser blocks
  useEffect(() => {
    const audio = new Audio("/marshallwi11_themarshallmafia_song.mp3")
    audio.volume = 0.5
    audio.loop = true
    audioRef.current = audio
    const p = audio.play()
    if (p !== undefined) {
      p.catch(() => {
        // Autoplay blocked — unlock on first user touch/click/key
        const unlock = () => { audio.play().catch(() => {}) }
        document.addEventListener("click",      unlock, { once: true })
        document.addEventListener("touchstart", unlock, { once: true })
        document.addEventListener("keydown",    unlock, { once: true })
      })
    }
    return () => { audio.pause(); audio.src = ""; audioRef.current = null }
  }, [])

  const openModal = (m: ModalType) => {
    setInfoOpen(false)
    if (activeModal !== null && activeModal !== m) {
      // Switching between modals — brief blur pulse to mask the swap
      setModalSwitching(true)
      setTimeout(() => { setActiveModal(m); setModalSwitching(false) }, 420)
    } else {
      setActiveModal(m)
    }
  }
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

  // Shake the cart nav icon when the collect modal is first opened
  useEffect(() => {
    if (activeModal === "collect") {
      setCartShaking(true)
      const t = setTimeout(() => setCartShaking(false), 900)
      return () => clearTimeout(t)
    }
  }, [activeModal])

  useEffect(() => {
    if (activeModal === "collect" && packSelected === "standard" && !stripeClientSecret && !stripeLoading) {
      setStripeLoading(true)
      fetch("/api/checkout", { method: "POST" })
        .then(r => r.json())
        .then(d => { setStripeClientSecret(d.clientSecret); setStripeLoading(false) })
        .catch(() => setStripeLoading(false))
    }
    if (activeModal !== "collect") {
      setStripeClientSecret(null)
      setStripeLoading(false)
      setPackSelected(null)
    }
  }, [activeModal, packSelected])

  return (
    <>
      {/* WebGL mesh gradient backdrop — replaces old CSS animated linear-gradient */}
      <MeshGradient lightMode={lightMode} />
      {/* OLD CSS backdrop (kept for easy revert — re-enable in globals.css "LEGACY BACKDROP" section too):
      <div className={`tmm-backdrop${lightMode ? " tmm-backdrop--light" : ""}`} aria-hidden="true" />
      */}

      {/* Modal switching: fade/blur handled via .modal-content-out on each modal's scroll container */}

      <main className={`site-canvas${lightMode ? " tmm-light" : ""}`}>

        <LottieHero lightMode={lightMode} logoFading={logoFading} />

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
              {/* Hides when home is the passive default (no modal open, not hovered) */}
              <span
                className="pill-nav-slider"
                style={{
                  left: sliderStyle.left,
                  width: sliderStyle.width,
                  opacity: navIntro < 2 ? 0
                    : (activeModal === null && !infoOpen && !homeHovered) ? 0
                    : 1,
                  transition: sliderReady
                    ? "left 0.36s cubic-bezier(0.34,1.18,0.64,1), width 0.36s cubic-bezier(0.34,1.18,0.64,1), opacity 0.3s ease"
                    : "opacity 0.3s ease",
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
                  transition: "opacity 0.7s cubic-bezier(0.65,0,0.35,1)",
                }}
              >
                <span className="nav-intro-text">THE MARSHALL MAFIA</span>
              </div>

              {/* ── All icon buttons — fade in after intro text fades out ── */}
              <div className="pill-nav-buttons" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                opacity: navIntro < 2 ? 0 : 1,
                transition: "opacity 0.7s cubic-bezier(0.65,0,0.35,1)",
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
                    <path d="M5.5 2.5L19 10 5.5 17.5V2.5Z"/>
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

              {/* HOME — text logo; ring only visible on hover/press */}
              {/* Grid overlay trick: both texts stack in the same grid cell so the
                  button width is always driven by the WIDER text — no layout shift */}
              <button ref={btnHomeRef}
                className={`pill-nav-item pill-nav-home pill-nav-home--text${(activeModal === null && !infoOpen) ? " pill-nav-item--active" : ""}`}
                onClick={() => { closeModal(); setInfoOpen(false); handleLogoTap(); setHomeHovered(false) }}
                onPointerEnter={() => setHomeHovered(true)}
                onPointerLeave={() => setHomeHovered(false)}
                aria-label="Home / double-tap to switch mode"
              >
                {/* Text — desktop only (CSS hides on mobile) */}
                <span className="pill-nav-home-text" style={{display:"grid"}}>
                  {/* Default text — always rendered (drives button width) */}
                  <span style={{gridArea:"1/1", opacity: homeHovered ? 0 : 1, transition:"opacity 0.45s ease", whiteSpace:"nowrap"}}>
                    THE MARSHALL MAFIA
                  </span>
                  {/* Hover text — overlays in the same cell */}
                  <span style={{gridArea:"1/1", opacity: homeHovered ? 1 : 0, transition:"opacity 0.45s ease", whiteSpace:"nowrap", textAlign:"center"}}>
                    NIGHT / DAY SWITCH
                  </span>
                </span>
                {/* Eyes logo — mobile only (CSS shows on mobile, hidden on desktop) */}
                <img
                  src="/tmm_themarshallmafia_logo.svg"
                  alt=""
                  className="pill-nav-home-logo"
                  style={{
                    transform: "scaleY(-1)",
                    filter: lightMode ? "invert(1)" : undefined,
                  }}
                  draggable={false}
                />
              </button>

              {/* ── ALTERNATIVE: eyes logo version (keep for easy revert) ──
              <button ref={btnHomeRef}
                className={`pill-nav-item pill-nav-home${(activeModal === null && !infoOpen) ? " pill-nav-item--active" : ""}`}
                onClick={() => { closeModal(); setInfoOpen(false); handleLogoTap() }}
                aria-label="Home"
              >
                <div style={{
                  transform: lightMode ? "scaleY(-1)" : undefined,
                  filter: lightMode ? "invert(1)" : undefined,
                  opacity: logoFading ? 0 : 1,
                  transition: "opacity 0.18s linear",
                  lineHeight: 0,
                }}>
                  <img
                    src="/tmm_themarshallmafia_logo.svg"
                    alt="TMM"
                    className="pill-nav-home-logo"
                    draggable={false}
                  />
                </div>
              </button>
              ── END ALTERNATIVE ── */}

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
                <span className={`cart-pill-badge${cartShaking ? " cart-pill-badge--pulse" : ""}`} aria-hidden="true" />
              </button>

              </div>{/* end buttons wrapper */}
            </div>{/* end pill-nav-inner */}
          </nav>
        </div>{/* end .nav-cluster */}

        {/* ==================== PLAY MODAL ==================== */}
        {activeModal === "play" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-backdrop" />
            <div className={`modal-scroll-bare animate-modal-in${modalSwitching ? " modal-content-out" : ""}`}>
              <div className="modal-content-pane" style={{display:"flex",flexDirection:"column",gap:"clamp(16px,4vw,28px)"}}>
                {/* BOX 1 — HOW TO PLAY */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">HOW TO PLAY</span><span className="play-block-subtitle">INSTRUCTIONS</span></div>
                  <p className="play-block-body"><span style={{color:"#ffffff"}}>In The Marshall Mafia</span>, <span className="text-tmm-brown">Villagers</span> must Identify, expose and vote out all <span className="text-tmm-red">Mafia</span> members, while the <span className="text-tmm-red">Mafia{"'"}s</span> goal is to secretly eliminate all <span className="text-tmm-brown">Villagers</span> until they outnumber them. The <span className="text-tmm-cream">Marshall</span> hosts the game, managing the flow of the rounds and overseeing the distribution of roles and actions.</p>
                </div>

                {/* BOX 2 — SETUP */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">SETUP</span><span className="play-block-subtitle">(SEE PLAY CARD*)</span></div>
                  <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> shuffles the character cards (chosen by the players*) and hands one to each player. These cards determine whether a player is a <span className="text-tmm-brown">Villager</span>, <span className="text-tmm-red">Mafia</span>, or has a special role (see <span className="text-muted">Character Cards*</span> for details on each character{"'"}s abilities).</p>
                  <ul className="play-rules-list" style={{marginTop:"clamp(8px,2vw,12px)"}}>
                    <li className="play-block-body">All Players must keep their character roles secret.</li>
                  </ul>
                  <p className="play-block-body" style={{marginTop:"clamp(8px,2vw,12px)"}}>Use the (<span className="text-tmm-green">Music Card*</span>) as an added bonus, it is used for the game ambience (stopping voting on players that make noise while asleep &amp; puts players in the mood to continue playing).</p>
                </div>

                {/* BOX 3 — RULES */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">RULES</span><span className="play-block-subtitle">(SEE RULES CARD*)</span></div>
                  <p className="play-block-body">At the start of the game, players agree on selected (<span className="text-muted">Rule Cards*</span>), This allows for players who have played different rules to agree on how the game will be played.</p>
                  <ul className="play-block-body play-rules-list">
                    <li>PLAYERS MUST CLOSE Their EYES &amp; Remain Silent DURING THE SLEEP PHASE</li>
                    <li>DURING THE SLEEP PHASE The <span className="text-tmm-cream">MARSHALL</span> ROLE must not SPEAK Directly TOWARDS Each AWOKEN Player, otherwise all players know which role a player has.</li>
                    <li>AWOKEN Players SILENTLY POINT &amp; CONFIRM Decisions WITH THE <span className="text-tmm-cream">MARSHALL</span>, by hand signals or mouthing their choice to the <span className="text-tmm-cream">Marshall</span> overseeing the game.</li>
                    <li>Do not cheat If you die, PICK a {'"'}<span className="text-tmm-red">DEATH CARD</span>{'"'} FROM THE PACK, hold it to show other players you are eliminated from the game.</li>
                    <li>Timed discussion period (3 minutes recommended, though it does not have to be*), to keep the rounds short and allow the game to be more decisive.</li>
                    <li>Voting order must switch each round, to avoid the same players voting last, stopping them having an advantage.</li>
                    <li>The <span className="text-tmm-cream">MARSHALL</span> role SHOULD change each GAME, so all players have a chance at playing.</li>
                    <li>SCAN the {'"'}<span className="text-tmm-green">MUSIC CARD</span>{'"'} to make the GAME more enjoyable (helps the restless {'"'}sleeping{'"'} of players in the night)</li>
                  </ul>
                </div>

                {/* BOX 4 — CHARACTERS */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">CHARACTERS</span><span className="play-block-subtitle">(SEE EACH ROLE CARD*)</span></div>
                  <ul className="play-block-body play-rules-list">
                    <li><span className="text-tmm-cream">MARSHALL (1)</span> — The games host and all-seeing narrator.</li>
                  </ul>
                  <p className="play-block-body">Players with roles wake up during the (Sleep Phase) and open their eyes - in the order called by <span className="text-tmm-cream">Marshall</span> (detailed above*), player then does their role action before closing their eyes again.</p>
                  <ul className="play-block-body play-rules-list">
                    <li><span className="text-tmm-green">ANGEL (2)</span> — Pick player to save (Each Round).</li>
                    <li><span className="text-tmm-blue">DETECTIVE (2)</span> — Pick player to guess if they are a <span className="text-tmm-red">mafia</span>, <span className="text-tmm-cream">Marshall</span> indicates Yes/No (Each Round).</li>
                    <li><span className="text-tmm-green">DOCTOR (2)</span> — <span className="text-tmm-cream">Marshall</span> shows who the <span className="text-tmm-red">mafia</span> killed, save them Yes/No (Single Use).</li>
                    <li><span className="text-tmm-yellow">JESTER (1)</span> — Get voted out to win the game.</li>
                    <li><span className="text-tmm-red">MAFIA (3)</span> — Pick player to kill (Each Round).</li>
                    <li><span className="text-tmm-yellow">SILENCER (1)</span> — Pick player to silence (Each Round).</li>
                    <li><span className="text-tmm-brown">VILLAGER (10)</span> — Vote out <span className="text-tmm-red">mafia</span> to win.</li>
                  </ul>
                </div>

                {/* BOX 5 — PHASES */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASES</span><span className="play-block-subtitle">1, 2 &amp; 3</span></div>
                  <p className="play-block-body">Each round in The <span className="text-tmm-cream">Marshall</span> <span className="text-tmm-red">Mafia</span> consists of three phases.</p>
                  <p className="play-block-body">1. SLEEP → 2. DiscussioN → 3. Vote</p>
                  <p className="play-block-body">If the games go to quickly or too many players are getting eliminated each night, the role groups (e.g. if there are 2+ <span className="text-tmm-green">Angels</span>, 2+ <span className="text-tmm-red">Mafia</span>, 2+ <span className="text-tmm-blue">Detectives</span>)</p>
                  <p className="play-block-body" style={{marginTop:"clamp(8px,2vw,12px)"}}>each type of role (<span className="text-tmm-red">KILL</span>, <span className="text-tmm-blue">GUESS</span>, <span className="text-tmm-green">SAVE</span>, <span className="text-tmm-yellow">WILD</span>) must decide one player to do their action on.</p>
                </div>

                {/* BOX 6 — PHASE 1. SLEEP */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 1.</span><span className="play-block-subtitle">SLEEP</span></div>
                  <p className="play-block-body">This is the secretive action phase. All players close their eyes, and the <span className="text-tmm-cream">Marshall</span> calls specific character roles to perform their actions in a set order:</p>
                  <ul className="play-block-body play-rules-list">
                    <li><span className="text-tmm-red">KILL</span> — The <span className="text-tmm-red">Mafia</span> choose a player to eliminate.</li>
                    <li><span className="text-tmm-blue">GUESS</span> — The <span className="text-tmm-blue">Detective</span> (or similar roles) attempt to discover another player{"'"}s identity.</li>
                    <li><span className="text-tmm-green">SAVE</span> — The <span className="text-tmm-green">Angel</span> (or similar roles) can protect one player from elimination.</li>
                    <li><span className="text-tmm-yellow">WILD</span> — Any other special roles perform their actions (depending on game customisation).</li>
                  </ul>
                  <p className="play-block-body">After all actions are completed, the <span className="text-tmm-cream">Marshall</span> announces the result of the night{"'"}s activities (who has been eliminated, if anyone was saved... without naming the player of course, etc.).</p>
                </div>

                {/* BOX 7 — PHASE 2. DISCUSSION */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 2.</span><span className="play-block-subtitle">discussion</span></div>
                  <p className="play-block-body">All players open their eyes and begin arguing, accusing, or defending themselves based on what they believe has happened during the Sleep Phase.</p>
                  <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> should set a timer (Recommended 3 minutes) for this phase. They can also stop the discussions at a natural moment to keep the phase concise and intense.</p>
                  <p className="play-block-body">Players are free to speculate, but players must not reveal their card (if a player is caught showing their card to another player, they are instantly eliminated.</p>
                </div>

                {/* BOX 8 — PHASE 3. VOTE */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 3.</span><span className="play-block-subtitle">VOTE</span></div>
                  <p className="play-block-body">After the discussion, players proceed straight to the voting.</p>
                  <p className="play-block-body">Each <span className="text-tmm-brown">VILLAGER</span> role votes to eliminate someone they suspect is <span className="text-tmm-red">Mafia</span>, while the <span className="text-tmm-red">Mafia</span> aim to deceive <span className="text-tmm-brown">Villagers</span> into voting out their own.</p>
                  <p className="play-block-body">Each player is allowed to make a single vote, on anyone they choose. When a player casts a vote for another player - the player who has been voted for must hold up a finger for each vote received.</p>
                  <p className="play-block-body">If the vote ties, a re-vote occurs between the tied players (depending on chosen <span className="text-muted">Rule Cards*</span>).</p>
                  <p className="play-block-body">The player with the most votes is immediately eliminated from the game, and their character is revealed (also depending on chosen <span className="text-muted">Rule Cards*</span>).</p>
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
            <div className={`modal-scroll-bare animate-modal-in${modalSwitching ? " modal-content-out" : ""}`}>
              <div className="modal-content-pane">
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">SHOWCASE</span>
                    <span className="play-block-subtitle">gallery</span>
                  </div>
                  {/* Main large image — fixed 4:3 container, contain so full image is always visible */}
                  <div className="showcase-img-well" style={{borderRadius:"clamp(8px,1.5vw,14px)"}}>
                    <Image
                      src={`/images/tmm_picture_${showcaseIdx + 1}.png`}
                      alt={`The Marshall Mafia — image ${showcaseIdx + 1}`}
                      fill
                      priority
                      sizes="(max-width:600px) 100vw, 600px"
                      style={{objectFit:"contain"}}
                    />
                  </div>
                  {/* Thumbnail strip */}
                  <div className="showcase-thumbs">
                    {[0,1,2,3,4,5,6].map(i => (
                      <button
                        key={i}
                        onClick={() => setShowcaseIdx(i)}
                        className={`showcase-thumb${showcaseIdx === i ? " showcase-thumb--active" : ""}`}
                        aria-label={`View image ${i + 1}`}
                      >
                        <Image
                          src={`/images/tmm_picture_${i + 1}.png`}
                          alt={`Thumbnail ${i + 1}`}
                          width={200} height={150}
                          loading="lazy"
                          sizes="80px"
                          style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MUSIC MODAL ==================== */}
        {activeModal === "music" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-backdrop" />
            <div className={`modal-scroll-bare animate-modal-in${modalSwitching ? " modal-content-out" : ""}`}>
              <div className="modal-content-pane">
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="music-modal-header">
                    <span className="play-block-title">LISTEN</span>
                    <span className="play-block-subtitle">experience</span>
                  </div>
                  <div className="music-grid">
                    {[
                      { href:"https://open.spotify.com/playlist/3IciRcKF72CRT6MHI6C6Ry", src:"/images/tmm_music_spotify.jpg", label:"SPOTIFY" },
                      { href:"https://music.apple.com/gb/artist/marshallwi11/1844826623", src:"/images/tmm_music_apple_music.jpg", label:"APPLE MUSIC", imgScale: 1.28 },
                      { href:"https://tidal.com/playlist/5f88e8b6-cded-4806-9c94-b22894328454", src:"/images/tmm_music_tidal.jpg", label:"TIDAL" },
                      { href:"https://music.amazon.co.uk/artists/B0FV93YR78/marshallwi11", src:"/images/tmm_music_amazon_music.jpg", label:"AMAZON MUSIC" },
                      { href:"https://link.deezer.com/s/32Ea3kbAJwzVroL9cvbDM", src:"/images/tmm_music_deezer.jpg", label:"DEEZER" },
                      { href:"https://www.youtube.com/playlist?list=PLg6v-S6qo4anyKTHrD3zxMAnkHGrSLDlJ", src:"/images/tmm_music_youtube.jpg", label:"YOUTUBE" },
                    ].map(({ href, src, label, imgScale }) => (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="music-tile" aria-label={label}>
                        <div className="music-tile-icon">
                          <img src={src} alt={label} className="music-tile-img" loading="eager"
                            style={imgScale ? { transform: `scale(${imgScale})` } : undefined} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* ── Music player — controls the autoplay theme tune ── */}
                <MusicPlayer audioRef={audioRef} lightMode={lightMode} />

                {/* Releases — right side matches left side font size */}
                <div className="play-card" onClick={e => e.stopPropagation()} style={{marginTop:"clamp(16px,4vw,32px)"}}>
                  <div className="play-card-header">
                    <span className="play-block-title">MUSIC</span>
                    <span className="play-block-subtitle">RELEASED</span>
                  </div>
                  <div className="releases-list">
                    <div className="release-row">
                      <span className="play-block-body">VOLUME 1</span>
                      <span className="play-block-body release-tag">Extended Playlist</span>
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
            <div className={`modal-scroll-bare animate-modal-in${modalSwitching ? " modal-content-out" : ""}`}>
              <div className="modal-content-pane" style={{display:"flex",flexDirection:"column",gap:"clamp(16px,4vw,28px)"}}>
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">REVIEWS</span><span className="play-block-subtitle">RATING</span></div>
                  {(() => {
                    const avg = TESTIMONIALS.reduce((s, t) => s + t.rating, 0) / TESTIMONIALS.length
                    const avgDisplay = avg % 1 === 0 ? avg.toFixed(1) : avg.toFixed(1)
                    const avgRounded = Math.round(avg)
                    return (
                  <div className="reviews-summary">
                    <div className="reviews-score">
                      <span className="reviews-score-number">{avgDisplay}</span>
                      <StarRating rating={avgRounded} />
                      <span className="play-block-subtitle" style={{fontSize:"12px"}}>{TESTIMONIALS.length} reviews</span>
                    </div>
                    <div className="reviews-divider" aria-hidden="true" />
                    <div className="reviews-bars">
                      {[1,2,3,4,5].filter(n => TESTIMONIALS.filter(t => t.rating === n).length > 0).map(n => {
                        const count = TESTIMONIALS.filter(t => t.rating === n).length
                        const pct = Math.round((count / TESTIMONIALS.length) * 100)
                        // Both label and count share yellow + same font size across all visible bars
                        const labelStyle = { color: "var(--tmm-yellow)", fontSize: "clamp(15px,2.4vw,17px)" }
                        return (
                          <div key={n} className="review-bar-row">
                            <span className="review-bar-label" style={labelStyle}>{n}</span>
                            <div className="review-bar-track">
                              <div className="review-bar-fill" style={{ width:`${pct}%`, background:"var(--tmm-yellow)" }} />
                            </div>
                            <span className="review-bar-count" style={labelStyle}>{count}</span>
                          </div>
                        )
                      })}
                      <button
                        className="play-block-body add-review-btn"
                        style={{marginTop:"auto"}}
                        onClick={e => { e.stopPropagation(); setReviewComing(true) }}
                      >
                        {reviewComing ? "COMING SOON!" : "+ add a review"}
                      </button>
                    </div>
                  </div>
                    )
                  })()}
                </div>
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="play-card" onClick={e => e.stopPropagation()}>
                    <div className="review-card-top" style={{alignItems:"flex-start",gap:"clamp(16px,3.5vw,22px)"}}>
                      <div className="review-avatar" style={{background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <img
                          src="/tmm_themarshallmafia_logo.svg"
                          alt=""
                          style={{width:"29px",height:"auto",display:"block",transform: t.rating > 3 ? "scaleY(-1)" : "none", filter: lightMode ? "invert(1)" : "none"}}
                        />
                      </div>
                      <div style={{minWidth:0,flex:"1 1 0",display:"flex",flexDirection:"column",justifyContent:"space-between",height:"47px"}}>
                        <p className="play-block-body" style={{margin:0,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.name}</p>
                        <span className="play-block-subtitle" style={{fontSize:"12px"}}>{t.handle}</span>
                      </div>
                      <div style={{flexShrink:0,paddingTop:"2px"}}><StarRating rating={t.rating} /></div>
                    </div>
                    <p className="play-block-body" style={{marginTop:"clamp(14px,3vw,20px)"}}>{t.body}</p>
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
            <div className={`modal-scroll-bare animate-modal-in${modalSwitching ? " modal-content-out" : ""}`}>
              <div className="collect-list" onClick={e => e.stopPropagation()}>

                {/* ── Pack selector — two separate pills ── */}
                <div className="pack-pills-row">
                  <button
                    className={`pack-pill-btn${packSelected === "standard" ? " pack-pill-btn--active" : ""}`}
                    onClick={() => { setPackSelected("standard"); setLightMode(false) }}
                  >
                    STANDARD PACK
                  </button>
                  <button
                    className={`pack-pill-btn${packSelected === "expansion" ? " pack-pill-btn--active" : ""}`}
                    onClick={() => { setPackSelected("expansion"); setLightMode(true) }}
                  >
                    EXPANSION PACK
                  </button>
                </div>

                {/* ── Standard pack: stripe checkout ── */}
                {packSelected === "standard" && (
                  <div className="play-card">
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
                )}

                {/* ── Expansion pack: coming soon ── */}
                {packSelected === "expansion" && (
                  <div className="play-card-pill" style={{justifyContent:"center"}}>
                    <span className="play-block-title">COMING SOON!</span>
                  </div>
                )}

                {/* ── Checkout / Secure pill — always visible ── */}
                <div className="play-card-pill">
                  <span className="play-block-title">CHECKOUT</span>
                  <span className="play-block-subtitle">SECURE</span>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>
    </>
  )
}
