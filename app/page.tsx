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
        /* Dark mode: scaleY(-1) is the brand aesthetic (intentionally inverted eyes).
           Light mode: eyes should be right-side-up/happy — no flip, just invert for colour. */
        transform: lightMode ? undefined : "scaleY(-1)",
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

          {/* ── Step 1: the conundrum ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">Step 1</span>
              <span className="play-block-subtitle">the conundrum</span>
            </div>
            <p className="play-block-body">On a normal Marshall games night, a standard deck of cards was placed down.</p>
            <p className="play-block-body">We were playing Mafia… or trying to.</p>
            <p className="play-block-body">Except each person at the table knew a separate version of the same game — different characters, names and rules nobody had agreed on.</p>
            <p className="play-block-body">Somewhere in that confusion, a Marshall stopped listening and started thinking: there had to be a better way to play this.</p>
            <p className="play-block-body">One deck. One set of rules for all. One game everyone could actually agree on — child or adult, their first game or their last.</p>
          </div>

          {/* IMAGE — creation story 1 */}
          <div style={{borderRadius:"clamp(14px,3vw,22px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img src="/images/tmm_creation_story_1.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── Step 2: the night ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">Step 2</span>
              <span className="play-block-subtitle">the night</span>
            </div>
            <p className="play-block-body">The thought didn{"'"}t wait for light of morning.</p>
            <p className="play-block-body">What followed was a week of very little sleep and a lot of notes — roles, rules, characters, game-modes, written down as fast as they arrived, then crossed out, then written again.</p>
            <p className="play-block-body">By the end of it, a first game existed.</p>
            <p className="play-block-body">It wasn{"'"}t complete yet. But it was an idea.</p>
          </div>

          {/* IMAGE — creation story 2 */}
          <div style={{borderRadius:"clamp(14px,3vw,22px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img src="/images/tmm_creation_story_2.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── Step 3: the world ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">Step 3</span>
              <span className="play-block-subtitle">the world</span>
            </div>
            <p className="play-block-body">Weeks of drawing followed the weeks of writing — sourcing from old detective novels and spy thrillers to the classy cheekiness of Pink Panther — until a cast started to emerge.</p>
            <p className="play-block-body">The Mafia. The Villager. The Jester. The Detective. The Marshall ;)</p>
            <p className="play-block-body">Each one faceless, but not nameless — each one anyone{"'"}s to become.</p>
            <p className="play-block-body">Their pigments were drawn from old and new consoles, from Nintendo to Xbox, to help people relive the joy of childhood games.</p>
            <p className="play-block-body">To unify all the roles under a banner of a brand is a logo — eyes that are open, watching, even when they are closed. Awake while the table sleeps.</p>
          </div>

          {/* IMAGE — creation story 3 */}
          <div style={{borderRadius:"clamp(14px,3vw,22px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img src="/images/tmm_creation_story_3.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── Step 4: the testing ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">Step 4</span>
              <span className="play-block-subtitle">the testing</span>
            </div>
            <p className="play-block-body">The idea was only half of a game.</p>
            <p className="play-block-body">The rest came from demo packs, and far too many rounds with friends and family — round after round, night after night, until we knew more about what didn{"'"}t work than what did.</p>
            <p className="play-block-body">Characters that caused complications, not cheeky confusion were cut. The rule-set that only worked one way was rebuilt to work many ways instead.</p>
            <p className="play-block-body">The colours were inspired to help all understand and see easily, and several revisions were needed, to make sure your kids and grandparents can read them.</p>
          </div>

          {/* IMAGE — creation story 4 */}
          <div style={{borderRadius:"clamp(14px,3vw,22px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img src="/images/tmm_creation_story_4.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── Step 5: the mistake ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">Step 5</span>
              <span className="play-block-subtitle">the mistake</span>
            </div>
            <p className="play-block-body">Somewhere in the middle of finishing the standard pack, an additional entire expansion pack got started anyway.</p>
            <p className="play-block-body">Because once a suspicious little world exists, it{"'"}s very hard to stop building on it.</p>
            <p className="play-block-body">Everyone has been asking about it… it{"'"}s coming but it will take a little while.</p>
          </div>

          {/* IMAGE — creation story 5 */}
          <div style={{borderRadius:"clamp(14px,3vw,22px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img src="/images/tmm_creation_story_5.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── Step 6: the philosophy ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">Step 6</span>
              <span className="play-block-subtitle">the philosophy</span>
            </div>
            <p className="play-block-body">Our aim was to make:</p>
            <p className="play-block-body">{'"'}A world of games, that are suspiciously fun, told with a smile and a wink. Created for any player, all generations, every home.{'"'}</p>
          </div>

          {/* IMAGE — creation story 6 */}
          <div style={{borderRadius:"clamp(14px,3vw,22px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img src="/images/tmm_creation_story_6.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── Step 7: the game ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">Step 7</span>
              <span className="play-block-subtitle">the game</span>
            </div>
            <p className="play-block-body">What was made was called {'"'}The Marshall Mafia{'"'}, the sneakiest social deduction card game.</p>
            <p className="play-block-body">A world of suspicious fun, crafted to be cheeky, cheerful and downright fun.</p>
            <p className="play-block-body">Don{"'"}t believe us? Try it and see.</p>
            <p className="play-block-body">We dare you to have as much fun as everyone else ;)</p>
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
  { name: "Isabella M", rating: 5, title: "Amazing for group bonding", body: "The Marshall Mafia is amazing for group bonding, I played this game with my youth group and it was amazing... it really helped everyone to get to know each other and created fun memories!" },
  { name: "Samuel A", rating: 5, title: "There is nothing like this game on the market", body: "There is nothing like this game on the market. It's appeals to all ages, no-one is too young or too old to play… plus the background music makes the experience so much endless fun." },
  { name: "Lewis W", rating: 5, title: "Always interesting no matter how many times we've played", body: "The Marshall Mafia is always interesting no matter how many times we've played it. An ideal game to play with family or friends!" },
  { name: "Jessica M", rating: 5, title: "Love it, love it, love it!", body: "Love it, love it, love it! It was a very creative way to play mafia!" },
  { name: "Ayanfe O", rating: 4, title: "Cards are really good quality", body: "Cards are really good quality, I like the different additions as well!" },
  { name: "Geoff S", rating: 5, title: "Great game, really enjoy the variety", body: "Great game, really enjoy the variety of cards in the pack. It's easy for someone new to pick up and understand and is a good game to play in larger groups which is generally hard to find." },
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
  const [infoOpen, setInfoOpen] = useState(false)
  const [modalSwitching, setModalSwitching] = useState(false)
  // 0 = intro text showing | 1 = text fading out | 2 = nav visible
  const [navIntro, setNavIntro] = useState(0)
  const lastTapRef = useRef<number>(0)
  const swipeTouchStartX = useRef<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const musicEverStarted = useRef(false)
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
      info: btnInfoRef, play: btnPlayRef, music: btnMusicRef,
      showcase: btnShowRef, reviews: btnRevRef, cart: btnCartRef,
    }
    let key: string
    if (infoOpen) key = "info"
    else if (activeModal === "collect") key = "cart"
    else key = activeModal
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

  // Theme tune — loaded silently; playback starts only on first music-button press
  useEffect(() => {
    const audio = new Audio("/marshallwi11_themarshallmafia_song.mp3")
    audio.volume = 0.5
    audio.loop = true
    audioRef.current = audio
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
    // Auto-select standard pack when collect modal opens
    if (activeModal === "collect" && packSelected === null) {
      setPackSelected("standard")
    }
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
                    : (activeModal === null && !infoOpen) ? 0
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
                onClick={() => {
                  if (activeModal === "music") {
                    closeModal()
                  } else {
                    openModal("music")
                    // First press: start the audio
                    if (!musicEverStarted.current && audioRef.current) {
                      musicEverStarted.current = true
                      audioRef.current.play().catch(() => {})
                    }
                  }
                }}
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

                {/* BOX 1 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">INSTRUCTIONS</span><span className="play-block-subtitle">OBJECTIVE</span></div>
                  <p className="play-block-body">In <span style={{color:"#ffffff"}}>The Marshall Mafia</span>, <span className="text-tmm-brown">Villagers</span> must identify, expose and vote out all <span className="text-tmm-red">Mafia</span> members, while the <span className="text-tmm-red">Mafia{"'"}s</span> goal is to secretly eliminate all <span className="text-tmm-brown">Villagers</span> until they outnumber them. The <span className="text-tmm-cream">Marshall</span> hosts the game, managing the flow of rounds and overseeing the distribution of roles and actions.</p>
                </div>

                {/* BOX 2 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">HOW To PLAY?</span><span className="play-block-subtitle">(play card*)</span></div>
                  <p className="play-block-body">Appoint one player to be the <span className="text-tmm-cream">Marshall</span>. Shuffle the CHARACTER cards and deal one face down to each player — check the <span className="text-muted">ROLES card*</span> for the correct card count. All players must keep their CHARACTER CARD secret.</p>
                  <p className="play-block-body">Each game is played in rounds of 3 consecutive phases:</p>
                  <ul className="play-rules-list">
                    <li className="play-block-body">SLEEP → DISCUSSION → VOTE</li>
                  </ul>
                  <p className="play-block-body">Sleep phase — the <span className="text-tmm-cream">Marshall</span> wakes each role in order:</p>
                  <ul className="play-rules-list">
                    <li className="play-block-body"><span className="text-tmm-red">KILL</span> — Mafia choose a target</li>
                    <li className="play-block-body"><span className="text-tmm-blue">GUESS</span> — Detective guesses a role</li>
                    <li className="play-block-body"><span className="text-tmm-green">SAVE</span> — Angel saves a player</li>
                    <li className="play-block-body"><span className="text-tmm-yellow">WILD</span> — Special roles act</li>
                  </ul>
                  <p className="play-block-body">Discussion phase — all players debate for a timed period.</p>
                  <p className="play-block-body">Vote phase — each player votes to eliminate someone. The player with the most votes is removed.</p>
                  <p className="play-block-body">Scan the <span className="text-tmm-green">Music Card*</span> for ambience — helps keep sleeping players calm and sets the mood.</p>
                </div>

                {/* BOX 3 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">what are the roles?</span><span className="play-block-subtitle">(roles card*)</span></div>
                  <p className="play-block-body">Aim for half as many roles as players. See the <span className="text-muted">CHARACTER card*</span> for in-depth role definitions.</p>
                  <ul className="play-rules-list">
                    <li className="play-block-body">6 or fewer players — Not Recommended</li>
                    <li className="play-block-body">7 players — 1 <span className="text-tmm-cream">Marshall</span>, 3 <span className="text-tmm-brown">Villagers</span>, 3 roles (1 <span className="text-tmm-red">Kill</span>, 1 <span className="text-tmm-blue">Guess</span>, 1 <span className="text-tmm-green">Save</span>)</li>
                    <li className="play-block-body">9 players — 1 <span className="text-tmm-cream">Marshall</span>, 4 <span className="text-tmm-brown">Villagers</span>, 4 roles (1 <span className="text-tmm-red">Kill</span>, 1 <span className="text-tmm-blue">Guess</span>, 1 <span className="text-tmm-green">Save</span>, 1 <span className="text-tmm-yellow">Wild</span>)</li>
                    <li className="play-block-body">11 players — 1 <span className="text-tmm-cream">Marshall</span>, 5 <span className="text-tmm-brown">Villagers</span>, 5 roles (2 <span className="text-tmm-red">Kill</span>, 1 <span className="text-tmm-blue">Guess</span>, 1 <span className="text-tmm-green">Save</span>, 1 <span className="text-tmm-yellow">Wild</span>)</li>
                    <li className="play-block-body">13 players — 1 <span className="text-tmm-cream">Marshall</span>, 6 <span className="text-tmm-brown">Villagers</span>, 6 roles (2 <span className="text-tmm-red">Kill</span>, 1 <span className="text-tmm-blue">Guess</span>, 2 <span className="text-tmm-green">Save</span>, 1 <span className="text-tmm-yellow">Wild</span>)</li>
                    <li className="play-block-body">15 players — 1 <span className="text-tmm-cream">Marshall</span>, 7 <span className="text-tmm-brown">Villagers</span>, 7 roles (3 <span className="text-tmm-red">Kill</span>, 1 <span className="text-tmm-blue">Guess</span>, 2 <span className="text-tmm-green">Save</span>, 1 <span className="text-tmm-yellow">Wild</span>)</li>
                    <li className="play-block-body">17 players — 1 <span className="text-tmm-cream">Marshall</span>, 8 <span className="text-tmm-brown">Villagers</span>, 8 roles (3 <span className="text-tmm-red">Kill</span>, 2 <span className="text-tmm-blue">Guess</span>, 2 <span className="text-tmm-green">Save</span>, 1 <span className="text-tmm-yellow">Wild</span>)</li>
                  </ul>
                  <p className="play-block-body"><span style={{color:"#F8007A"}}>Note!</span> — freely experiment with your own numbers, though these are our tested suggestions. You can even remove certain roles (except <span className="text-tmm-brown">Villager</span> &amp; <span className="text-tmm-red">Mafia</span> ;).</p>
                  <p className="play-block-body">Read the <span className="text-muted">gamemode card*</span> for 3 ways to run sleep phase actions.</p>
                </div>

                {/* BOX 4 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">There are gamemodes?</span><span className="play-block-subtitle">(gamemode card*)</span></div>
                  <p className="play-block-body">Three different game-modes can be played:</p>
                  <ul className="play-rules-list">
                    <li className="play-block-body"><span style={{color:"#ffffff"}}>STANDARD</span> — Players with the same role silently agree on a single target (e.g. 2 <span className="text-tmm-red">Mafia</span> = 1 kill)</li>
                    <li className="play-block-body"><span style={{color:"#ffffff"}}>GROUP</span> — Players with the same role each pick a separate target, equal to their count (e.g. 2 <span className="text-tmm-red">Mafia</span> = 2 kills)</li>
                    <li className="play-block-body"><span style={{color:"#ffffff"}}>CHAOS</span> — Each player picks their own individual target separately (e.g. 1 <span className="text-tmm-red">Mafia</span> = 1 kill / 1 <span className="text-tmm-red">Mafia</span> = 1 kill)</li>
                  </ul>
                  <p className="play-block-body"><span style={{color:"#F8007A"}}>Note!</span> — these changes only alter role actions in the sleep phase.</p>
                </div>

                {/* BOX 5 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">What are the rules?</span><span className="play-block-subtitle">(rules card*)</span></div>
                  <p className="play-block-body">Before the game, decide which <span className="text-muted">rule cards*</span> to play. The standard ruleset includes rules #1, #2, #3.</p>
                  <ul className="play-rules-list">
                    <li className="play-block-body">Players must close their eyes and remain silent during the sleep phase</li>
                    <li className="play-block-body">The <span className="text-tmm-cream">Marshall</span> must not speak directly to awoken players — use hand signals or mouthing only</li>
                    <li className="play-block-body">Awoken players silently point and confirm decisions with the <span className="text-tmm-cream">Marshall</span></li>
                    <li className="play-block-body">Timed discussion — 3 minutes recommended, to keep rounds short and decisive</li>
                    <li className="play-block-body">Clockwise voting reverses each round — each player raises a finger per vote received</li>
                    <li className="play-block-body">When eliminated — pick a <span className="text-tmm-red">DEATH CARD*</span> and hold it up to show you{"'"}re out</li>
                    <li className="play-block-body">The <span className="text-tmm-cream">Marshall</span> role should rotate each game so everyone gets a turn</li>
                    <li className="play-block-body">Scan the <span className="text-tmm-green">MUSIC CARD*</span> for game ambience</li>
                  </ul>
                </div>

                {/* BOX 6 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">Even More RULES...</span><span className="play-block-subtitle">(rule card*)</span></div>
                  <p className="play-block-body"><span style={{color:"#F8007A"}}>Note!</span> — these rules let players who know different versions agree on how the game is played.</p>
                  <ul className="play-rules-list">
                    <li className="play-block-body"><span className="text-tmm-cream">1#</span> — Players cannot reveal their own role. You can pretend to be other roles — {"don't"} get caught!</li>
                    <li className="play-block-body"><span className="text-tmm-cream">2#</span> — If a non-awoken player repeatedly sleep-talks or sleep-walks, they are eliminated</li>
                    <li className="play-block-body"><span className="text-tmm-cream">3#</span> — Any player voted out must reveal their card — as theatrical as you like!</li>
                    <li className="play-block-body"><span className="text-tmm-cream">4#</span> — If a player is killed, they must reveal their card to the village</li>
                    <li className="play-block-body"><span className="text-tmm-cream">5#</span> — Save roles cannot save themselves or other save roles</li>
                    <li className="play-block-body"><span className="text-tmm-cream">6#</span> — If a vote ties, the tied players play Rock Paper Scissors (best of 1 or 3)</li>
                    <li className="play-block-body"><span className="text-tmm-cream">7#</span> — If a majority skips the vote, no player is eliminated and a new sleep phase begins</li>
                    <li className="play-block-body"><span className="text-tmm-cream">8#</span> — Save roles can only save the same player once per cycle, until all players have been saved once</li>
                  </ul>
                </div>

                {/* BOX 7 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">are there Characters?</span><span className="play-block-subtitle">(role card*)</span></div>
                  <p className="play-block-body">Each role{"'"}s description reveals their objective:</p>
                  <ul className="play-rules-list">
                    <li className="play-block-body"><span className="text-tmm-cream">MARSHALL (1)</span> — The game{"'"}s host and all-seeing narrator. Rotate this role each game</li>
                    <li className="play-block-body"><span className="text-tmm-green">ANGEL (3)</span> — Pick one player to save each round</li>
                    <li className="play-block-body"><span className="text-tmm-blue">DETECTIVE (3)</span> — Pick a player to guess if they are <span className="text-tmm-red">Mafia</span> — the <span className="text-tmm-cream">Marshall</span> indicates Yes/No</li>
                    <li className="play-block-body"><span className="text-tmm-yellow">JESTER (1)</span> — Get voted out to win the game</li>
                    <li className="play-block-body"><span className="text-tmm-red">MAFIA (3)</span> — Kill and vote out all other players. Pick a player to kill each round</li>
                    <li className="play-block-body"><span className="text-tmm-brown">VILLAGER (11)</span> — Vote out all the <span className="text-tmm-red">Mafia</span> to win</li>
                  </ul>
                  <p className="play-block-body">The <span className="text-tmm-red">Mafia</span> tribe battles against the <span className="text-tmm-brown">Villager</span> members — <span className="text-tmm-green">Angels</span>, <span className="text-tmm-blue">Detectives</span> and <span className="text-tmm-brown">Villagers</span> — while the tribeless <span className="text-tmm-yellow">Jester</span> aims for a solo victory.</p>
                </div>

                {/* BOX 8 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">What are the PHASES?</span><span className="play-block-subtitle">1, 2 &amp; 3</span></div>
                  <p className="play-block-body">Each round consists of three consecutive phases:</p>
                  <ul className="play-rules-list">
                    <li className="play-block-body">1 <span style={{color:"#ffffff"}}>SLEEP</span></li>
                    <li className="play-block-body">2 <span style={{color:"#ffffff"}}>DISCUSSION</span></li>
                    <li className="play-block-body">3 <span style={{color:"#ffffff"}}>VOTE</span></li>
                  </ul>
                  <p className="play-block-body">Standard mode — each role type (<span className="text-tmm-red">Kill</span>, <span className="text-tmm-blue">Guess</span>, <span className="text-tmm-green">Save</span>, <span className="text-tmm-yellow">Wild</span>) must decide on one player to act on.</p>
                  <p className="play-block-body"><span style={{color:"#F8007A"}}>Note!</span> — if games finish too quickly, switch up the sleep phase playstyle. See the <span className="text-muted">GAMEMODE CARD*</span>.</p>
                </div>

                {/* BOX 9 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 1</span><span className="play-block-subtitle">SLEEP</span></div>
                  <p className="play-block-body">The secretive action phase. All players close their eyes and the <span className="text-tmm-cream">Marshall</span> calls each role in order:</p>
                  <ul className="play-rules-list">
                    <li className="play-block-body"><span className="text-tmm-red">KILL</span> — The <span className="text-tmm-red">Mafia</span> choose a player to eliminate</li>
                    <li className="play-block-body"><span className="text-tmm-blue">GUESS</span> — The <span className="text-tmm-blue">Detective</span> tries to discover a player{"'"}s identity</li>
                    <li className="play-block-body"><span className="text-tmm-green">SAVE</span> — The <span className="text-tmm-green">Angel</span> protects one player from elimination</li>
                    <li className="play-block-body"><span className="text-tmm-yellow">WILD</span> — Special roles perform their actions</li>
                  </ul>
                  <p className="play-block-body">After all actions, the <span className="text-tmm-cream">Marshall</span> announces results — who was eliminated, if anyone was saved — without naming who did it.</p>
                </div>

                {/* BOX 10 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 2</span><span className="play-block-subtitle">discussion</span></div>
                  <p className="play-block-body">All players open their eyes and begin arguing, accusing, or defending themselves based on what they believe happened during the sleep phase.</p>
                  <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> sets a timer — 3 minutes recommended. They can stop discussions at a natural moment to keep the phase sharp and intense.</p>
                  <p className="play-block-body">Players can speculate freely — but must not reveal their card. Caught showing your card = instant elimination.</p>
                </div>

                {/* BOX 11 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">PHASE 3</span><span className="play-block-subtitle">VOTE</span></div>
                  <p className="play-block-body">After discussion, players proceed straight to voting. Each player casts a single vote — the voted player holds up a finger per vote received.</p>
                  <ul className="play-rules-list">
                    <li className="play-block-body"><span className="text-tmm-brown">Villagers</span> — vote to eliminate suspected <span className="text-tmm-red">Mafia</span></li>
                    <li className="play-block-body"><span className="text-tmm-red">Mafia</span> — aim to deceive <span className="text-tmm-brown">Villagers</span> into voting out their own</li>
                  </ul>
                  <p className="play-block-body">If the vote ties, a re-vote occurs between tied players (see chosen <span className="text-muted">Rule Cards*</span>). The player with the most votes is eliminated and their character revealed.</p>
                </div>

                {/* BOX 12 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">How many ROUNDS?</span><span className="play-block-subtitle">REPEAT</span></div>
                  <p className="play-block-body">The game continues until one of the following conditions is met:</p>
                  <ul className="play-rules-list">
                    <li className="play-block-body">a. <span className="text-tmm-brown">Villagers</span> win — successfully vote out all <span className="text-tmm-red">Mafia</span> members</li>
                    <li className="play-block-body">b. <span className="text-tmm-red">Mafia</span> wins — eliminate enough <span className="text-tmm-brown">Villagers</span> to outnumber them</li>
                    <li className="play-block-body">c. <span className="text-tmm-yellow">Wild</span> role wins — fulfils their unique win condition</li>
                  </ul>
                </div>

                {/* BOX 13 */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header"><span className="play-block-title">Links</span><span className="play-block-subtitle">SNEEK PEAKS!</span></div>
                  <p className="play-block-body">Collect → <a href="https://linktr.ee/themarshallmafia" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">linktr.ee/themarshallmafia</a></p>
                  <p className="play-block-body">music → <a href="https://linktr.ee/themarshallmafia.music" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">linktr.ee/themarshallmafia.music</a></p>
                  <p className="play-block-body">Developer → <a href="https://linktr.ee/marshallwi11" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">linktr.ee/marshallwi11</a></p>
                </div>

                {/* BOX 14 */}
                <div className="play-card-pill" onClick={e => e.stopPropagation()}>
                  <span className="play-block-title">by marshallwi11</span>
                  <span className="play-block-subtitle">est . 2025</span>
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
              <div className="modal-content-pane" style={{display:"flex",flexDirection:"column",gap:"clamp(16px,4vw,28px)"}}>
                {/* Single title pill */}
                <div className="play-card-pill" onClick={e => e.stopPropagation()}>
                  <span className="play-block-title">SHOWCASE</span>
                  <span className="play-block-subtitle">PNG 1–8</span>
                </div>
                {/* 8 plain images — no individual card headers */}
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} style={{borderRadius:"clamp(14px,3vw,22px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
                    <img
                      src={`/images/tmm_product_shot_${i}.png`}
                      alt={`The Marshall Mafia — product shot ${i}`}
                      style={{width:"100%",height:"auto",display:"block"}}
                    />
                  </div>
                ))}
                <div className="play-card-pill" onClick={e => e.stopPropagation()}>
                  <span className="play-block-title">the marshall mafia</span>
                  <span className="play-block-subtitle">gallery</span>
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
                      {[5,4,3,2,1].filter(n => TESTIMONIALS.filter(t => t.rating === n).length > 0).map(n => {
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
                    <div className="play-card-header">
                      <span className="play-block-title">{t.name}</span>
                      <StarRating rating={t.rating} />
                    </div>
                    <p className="play-block-body" style={{marginTop:"clamp(8px,2vw,12px)"}}>{t.body}</p>
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
