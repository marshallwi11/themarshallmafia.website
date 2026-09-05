"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Script from "next/script"
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
        /* Dark mode: scaleY(-1) puts eyes right-side-up (Lottie is natively inverted).
           Light mode: no flip — character is naturally the other way up, invert for colour. */
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

          {/* ── The Conundrum ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">CONUNDRUM</span>
            </div>
            <p className="play-block-body">On one suspiciously loud Marshall games night, we were playing Mafia. Or at least trying to. Using a standard deck of playing cards, everyone at the table seemed to know a different version of the same game. The characters were different. The names were different. The rules were different. Nobody could quite agree on how to play.</p>
          </div>

          {/* IMAGE — creation story 1 */}
          <div style={{borderRadius:"clamp(26px,5vw,40px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img loading="lazy" decoding="async" src="/images/tmm_creation_story_1.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── The Moment ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">MOMENT</span>
            </div>
            <p className="play-block-body">A Marshall, lost in that confusion, stopped listening and started thinking. There had to be a better way to play this. One deck. One set of rules. One game everyone could actually agree on, whether they were a child, a teenager, or an adult. Their first game or their last.</p>
          </div>

          {/* ── The Night ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">NIGHT</span>
            </div>
            <p className="play-block-body">The thought didn{"'"}t wait for light of day. The typing lasted long into the dark early hours of the morning. Once the first idea was created, it sparked a week of very little sleep and a lot of notes — roles, rules, characters, game-modes, written down as fast as they arrived, then crossed out, then written again. By the end of it, the first rule-set existed. It wasn{"'"}t complete yet. But the idea was inspiring…</p>
          </div>

          {/* IMAGE — creation story 2 */}
          <div style={{borderRadius:"clamp(26px,5vw,40px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img loading="lazy" decoding="async" src="/images/tmm_creation_story_2.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── The Philosophy ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">PHILOSOPHY</span>
            </div>
            <p className="play-block-body">Our aim was to make: {'"'}A world of games, that are suspiciously fun, told with a smile and a wink. Created for any player, all generations, every home.{'"'}</p>
          </div>

          {/* ── The World ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">WORLD</span>
            </div>
            <p className="play-block-body">We wondered what that games night should have looked like, and dreamed a world to accompany it. We imagined a mixed group of players... anyone and everyone, family and friends. Working together, or secretly against each other, around a table or across a collection of sofas.</p>
            <p className="play-block-body">The room is crisp with light suspicious fog, set in the summer cool of onsetting dusk, with everyone dressed up for a night of theatrical old fashioned games... with a new twist. We speculated art decking the walls while a band plays heartfelt downtempo music, taking off the formal edge, while putting a killer edge on. A room you would expect a spy to be seated in, a scripted movie with a story shaken up and stirred into real life.</p>
          </div>

          {/* IMAGE — creation story 3 */}
          <div style={{borderRadius:"clamp(26px,5vw,40px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img loading="lazy" decoding="async" src="/images/tmm_creation_story_3.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── The Artwork ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">ARTWORK</span>
            </div>
            <p className="play-block-body">Weeks of drawing followed the weeks of writing. Through sourcing from old detective novels and action thrillers, to the classic cheekiness of 2D shows like Pink Panther, a cast started to emerge.</p>
            <p className="play-block-body">The sharp <span className="text-tmm-red">Mafia</span>. The pointed <span className="text-tmm-brown">Villager</span>. The handy <span className="text-tmm-green">Angel</span>. The ballsy <span className="text-tmm-yellow">Jester</span>. The clued-up <span className="text-tmm-blue">Detective</span>. The ruling <span className="text-tmm-cream">Marshall</span> ;)</p>
            <p className="play-block-body">Each one faceless, but not nameless, each one anyone{"'"}s to become. Their colours were drawn from timeless pieces of history, old Nintendo and new Xbox consoles that remind generations to relive the joyful nostalgia of childhood games.</p>
          </div>

          {/* ── The Brand ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">BRAND</span>
            </div>
            <p className="play-block-body">The world had found its voice. But it needed to be instantly recognisable to anyone who plays. So we took the component that does not change across all characters — the eyes. The obvious choice. One we were too blind to see before.</p>
            <p className="play-block-body">It also captured the heart of the game: seeing what{"'"}s going on around you when you{"'"}re awake, and being in the dark when you{"'"}re asleep. The roles became united under a single mark. Eyes that are open, watching, even when they are closed. Awake while the table sleeps.</p>
          </div>

          {/* IMAGE — creation story 4 */}
          <div style={{borderRadius:"clamp(26px,5vw,40px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img loading="lazy" decoding="async" src="/images/tmm_creation_story_4.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── The Testing ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">TESTING</span>
            </div>
            <p className="play-block-body">The idea was only half the game. The rest came from demo packs and far too many rounds with friends and family. We played game after game, night after night, until we knew more about what didn{"'"}t work than what did.</p>
            <p className="play-block-body">Characters that caused complications, rather than cheeky confusion, were cut. Rule sets that created chaos were rebuilt, giving each group more freedom to choose how they played. The colour hues went through several revisions too. Every role needed to be easy to find, easy to understand, and easy to read, whether you were a child, a parent, or a grandparent.</p>
          </div>

          {/* ── The Mistake ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">MISTAKE</span>
            </div>
            <p className="play-block-body">Somewhere in the middle of finishing the standard pack, a whole expansion started to appear too. There were simply too many ideas to fit into one box. Once a suspicious little world exists, it{"'"}s very hard to stop building on it. People keep asking about it. It{"'"}s coming. Just not quite yet.</p>
          </div>

          {/* IMAGE — creation story 5 */}
          <div style={{borderRadius:"clamp(26px,5vw,40px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img loading="lazy" decoding="async" src="/images/tmm_creation_story_5.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── The Music ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">MUSIC</span>
            </div>
            <p className="play-block-body">We also realised something was missing. When we played, the room didn{"'"}t quite match the world we had imagined. Then, somewhere around midnight, we clocked it... The places that inspired the game all had theme tunes, soundtracks, or background music. So we spent the next few months composing three albums to sit alongside the game and complete the atmosphere.</p>
          </div>

          {/* ── The Name ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">NAME</span>
            </div>
            <p className="play-block-body">We weren{"'"}t quite sure what to call the game. Then we realised it had been staring us in the face all along, even when our eyes were closed. We{"'"}d been playing the Marshall{"'"}s version of Mafia. So we called it exactly that.</p>
          </div>

          {/* IMAGE — creation story 6 */}
          <div style={{borderRadius:"clamp(26px,5vw,40px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}} onClick={e => e.stopPropagation()}>
            <img loading="lazy" decoding="async" src="/images/tmm_creation_story_6.png" alt="The Marshall Mafia — creation story" style={{width:"100%",height:"auto",display:"block"}} />
          </div>

          {/* ── The Game ── */}
          <div className="play-card" onClick={e => e.stopPropagation()}>
            <div className="play-card-header">
              <span className="play-block-title">THE</span>
              <span className="play-block-subtitle">GAME</span>
            </div>
            <p className="play-block-body">What we made was called {'"'}The Marshall Mafia{'"'}, the sneakiest social deduction card game. A world of suspicious fun, crafted to be cheeky, cheerful and downright fun. Don{"'"}t believe us? Try it and see. We dare you to have as much fun as everyone else testifies ;)</p>
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
  { name: "Abi R",      age: 20, rating: 5, colorize: true,  body: "My experience is 10/10. I think the way the game is set up is really well organised. I can't even begin to explain the amount of games I've had, but the highlight would be when we finally stopped letting people expose their roles in any way if they were alive or dead. Me and my friend managed to deceive the last 2 villagers and won with 2 mafia still alive, most joyous moment of my entire mafia existence. I would say to someone considering their first night in the village… you can't trust anyone. Don't make alliances, it's every man for himself." },
  { name: "William M", age: 22, rating: 5, colorize: true,  body: "I'm a little biased, but I've always loved being a Marshall. I used to be so good as a Mafia but I'm a changed person, If I'm a Villager you better believe I'm catching them out. The cards are just as good in real life as they are in play. I took some photos of them see for yourself!", photos: ["/images/tmm_wm_testimonial_photo_1.png", "/images/tmm_wm_testimonial_photo_2.png", "/images/tmm_wm_testimonial_photo_3.png"] },
  { name: "Jessica M",  age: 24, rating: 5, colorize: false, body: "Love it, love it, love it! It was a very creative way to play mafia!" },
  { name: "Lucas M",    age: 14, rating: 5, colorize: false, body: "It's fun to play with friends. Great for bonding time with family. You get to know people better and know their lying faces!" },
  { name: "Katie R",    age: 21, rating: 5, colorize: false, body: "Highly recommend getting this game! It's so much fun to play with friends and the physical cards make it much easier to follow along. I love the character design and the music that comes with this pack. It is now the go to game in my friendship group and we can't get enough!" },
  { name: "Samuel A",   age: 30, rating: 5, colorize: false, body: "There is nothing like this game on the market. It's appeals to all ages, no-one is too young or too old to play… plus the background music makes the experience so much endless fun." },
  { name: "Ayanfe O",   age: 25, rating: 4, colorize: false, body: "Cards are really good quality, I like the different additions as well!" },
  { name: "Geoff S",    age: 34, rating: 5, colorize: false, body: "Great game, really enjoy the variety of cards in the pack. It's easy for someone new to pick up and understand and is a good game to play in larger groups which is generally hard to find." },
  { name: "Isabella M", age: 18, rating: 5, colorize: false, body: "The Marshall Mafia is amazing for group bonding, I played this game with my youth group and it was amazing... it really helped everyone to get to know each other and created fun memories!" },
  { name: "Lewis W",    age: 22, rating: 5, colorize: false, body: "The Marshall Mafia is always interesting no matter how many times we've played it. An ideal game to play with family or friends!" },
  { name: "Mia S",      age: 23, rating: 5, colorize: true,  body: "I was the Mafia and was getting by unscathed, killing people left, right and centre. My fellow mafias, 1 by 1, slowly getting caught... but there's still 1 left (ME). I get through 2 murders placing the blame on easy targets, who crack under pressure, then the dreaded words \"wait what about Mia?\" was said. Then it was wraps because everyone else was like \"Yeah what about Mia\". I immediately went into defence mode and then I was voted out :/ It was super fun, made the atmosphere super competitive... but in a friendly way! My family back home will love this! I will have to recommend it to them!" },
  { name: "Joseph G",  age: 21, rating: 5, colorize: true,  body: "I love the Detective card. I remember being given it and each round I guessed correctly. It made the game more enjoyable as I knew who the mafias were whilst trying to shine the light on them during voting, without giving my character away. Great social game at any place or time!" },
  { name: "Dyjon N",   age: 20, rating: 4, colorize: true,  body: "Played the game a few times before, what tends to be most memorable for me is when the Angel saves someone from a potential murdering or something of the sort. Just be prepared for anything, but not necessarily everything is a giveaway." },
  { name: "Julie C",   age: 75, rating: 5, colorize: false, body: "Great family game!!" },
  { name: "Graham C",  age: 72, rating: 5, colorize: false, body: "Perfect to play with my grandkids!" },
  { name: "Chester C", age: 27, rating: 5, colorize: true,  body: "The game was fantastic, so many laughs, the variety in different roles is brilliant and I felt such a sense of togetherness with my fellow villagers to find the Mafia. Everyone should play this game and let yourself embrace the character you've been given freely." },
  { name: "Alice B",   age: 28, rating: 5, colorize: false, body: "It's a game that in the same breath brings us all together, while we all turn on each other! My favourite two moments playing the marshall mafia, where when my friend fooled every single one of us, played the most believable and spectacular performance - it made me realise she needs to be an actress, my second favourite moment was when another friend pulled the wool over our eyes and won, despite not even being fluent in English. It reveals so much about everyone's character and makes you crave playing it, so you get your own back on all the times people have fooled you. I would highly recommend it to anyone who wants to bring some life back into their friendship groups or are bored of standard board games!" },
]

// Inline SVG for reviews panel (avoids img src loading issues)
function CharacterSVG({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="76" height="133" viewBox="0 0 76 133" fill="none" xmlns="http://www.w3.org/2000/svg" style={style} aria-hidden="true">
      <path d="M27.1808 121.066H34.9508V132.116H12.0008C11.8708 117.766 27.1808 124.516 27.1808 124.516V121.066Z" fill="white"/>
      <path d="M49.77 121.066H42V132.116H64.95C65.08 117.766 49.77 124.516 49.77 124.516V121.066Z" fill="white"/>
      <path d="M60 96.0658V115.066H17V101.066L40 94V83H33V81C33 79.5 31.5 76.5 28 77V83C21.15 81.74 13.44 75.2858 10.56 68.9258L10 67.6858L19 54.0658L38.83 58.8758L58 54.0658L70.67 71.8857L50.18 86.9058L60 96.0658Z" fill="white"/>
      <path d="M47.29 77.9158C47.16 77.9158 47.05 77.8758 46.97 77.7858L42.38 73.3558C42.38 73.3558 42.26 73.2558 42.18 73.1658C42.1 73.0758 41.96 72.9158 41.77 72.6858C41.58 72.4558 41.42 72.2158 41.27 71.9658C41.12 71.7158 40.99 71.4258 40.88 71.0758C40.76 70.7258 40.71 70.3858 40.71 70.0558C40.71 68.9758 41.02 68.1358 41.64 67.5258C42.26 66.9158 43.12 66.6158 44.22 66.6158C44.52 66.6158 44.83 66.6658 45.15 66.7758C45.47 66.8858 45.76 67.0258 46.03 67.2058C46.3 67.3858 46.54 67.5558 46.73 67.7058C46.93 67.8658 47.11 68.0258 47.29 68.2058C47.47 68.0258 47.65 67.8658 47.85 67.7058C48.05 67.5458 48.28 67.3758 48.55 67.2058C48.82 67.0358 49.12 66.8858 49.43 66.7758C49.74 66.6658 50.06 66.6158 50.36 66.6158C51.46 66.6158 52.32 66.9158 52.94 67.5258C53.56 68.1358 53.87 68.9758 53.87 70.0558C53.87 71.1358 53.31 72.2458 52.18 73.3658L47.6 77.7858C47.51 77.8758 47.4 77.9158 47.28 77.9158H47.29Z" fill="#E31C79"/>
      <path d="M48.61 42.3757C50.49 42.3157 51.82 43.6057 52.41 46.0657L56 46.0658C55.74 43.3158 54.54 41.2257 52.17 39.9357C49.51 38.4957 46.88 38.7657 44.42 40.4157C42.45 41.7357 41.41 43.6657 41.17 46.0657L44.8 46.0657C45.22 43.4057 47.04 42.4357 48.6 42.3757L48.61 42.3757Z" fill="white"/>
      <path d="M27.78 42.3757C29.66 42.3157 30.99 43.6057 31.58 46.0657L35.17 46.0658C34.91 43.3158 33.71 41.2257 31.34 39.9357C28.68 38.4957 26.05 38.7657 23.59 40.4157C21.62 41.7357 20.58 43.6657 20.34 46.0657L23.97 46.0657C24.39 43.4057 26.21 42.4357 27.77 42.3757L27.78 42.3757Z" fill="white"/>
      <path d="M38.1114 23.3439C29.8284 23.3516 22 21 22 21L6 27.4L37.8886 33L70 27.4L54 21C54 21 46.1716 23.3516 37.8886 23.3439" fill="white"/>
      <path d="M26.6601 0L23.1201 14.76C23.1201 14.76 36.7901 20.64 52.6701 14.76L49.1301 0L37.8901 6.23L26.6501 0H26.6601Z" fill="white"/>
    </svg>
  )
}

// Wrap character-name words in their role colour
function colorizeBody(text: string) {
  const ROLES = [
    { words: ["Mafia", "mafia", "Mafias", "mafias"],               color: "var(--tmm-red)" },
    { words: ["Villager", "villager", "Villagers", "villagers"],   color: "var(--tmm-brown)" },
    { words: ["Angel", "angel", "Angels", "angels"],               color: "var(--tmm-green)" },
    { words: ["Jester", "jester", "Jesters", "jesters"],           color: "var(--tmm-yellow)" },
    { words: ["Detective", "detective", "Detectives", "detectives"], color: "var(--tmm-blue)" },
    { words: ["Marshall", "marshall"],                             color: "var(--tmm-cream)" },
  ]
  const allWords = ROLES.flatMap(r => r.words)
  const pattern = new RegExp("\\b(" + allWords.join("|") + ")\\b", "g")
  const parts: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    const word = match[0]
    const role = ROLES.find(r => r.words.includes(word))
    parts.push(<span key={match.index} style={{color: role?.color, fontWeight: "bold"}}>{word}</span>)
    lastIndex = pattern.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return <>{parts}</>
}

export default function Home() {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState(false)
  const [lightMode, setLightMode] = useState(false)
  const [logoFading, setLogoFading] = useState(false)
  const [packSelected, setPackSelected] = useState<"standard" | "expansion" | null>(null)
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [openVolume, setOpenVolume] = useState<number | null>(null)
  const [cartShaking, setCartShaking] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [modalSwitching, setModalSwitching] = useState(false)
  const [cookieDismissed, setCookieDismissed] = useState(true) // start hidden; useEffect reveals if not yet accepted
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
    const t2 = setTimeout(() => setNavIntro(2), 1800)  // icons appear after overlay fades (~0.7s fade)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Cookie banner — check localStorage once on mount
  useEffect(() => {
    if (!localStorage.getItem("tmm_cookies_accepted")) setCookieDismissed(false)
  }, [])

  // Preload all modal images in the background so they're cached before the user opens anything
  useEffect(() => {
    const paths = [
      ...([1,2,3,4,5,6].map(i => `/images/tmm_creation_story_${i}.png`)),
      ...([1,2,3,4,5,6,7].map(i => `/images/tmm_product_render_${i}.png`)),
      "/images/tmm_wm_testimonial_photo_1.png",
      "/images/tmm_wm_testimonial_photo_2.png",
      "/images/tmm_wm_testimonial_photo_3.png",
      "/images/tmm_music_spotify.jpg",
      "/images/tmm_music_apple_music.jpg",
      "/images/tmm_music_tidal.jpg",
      "/images/tmm_music_amazon_music.jpg",
      "/images/tmm_music_deezer.jpg",
      "/images/tmm_music_youtube.jpg",
    ]
    paths.forEach(src => { const img = new window.Image(); img.src = src })
  }, [])

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
      setTimeout(() => { setActiveModal(m); setModalSwitching(false) }, 220)
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
    if (activeModal === "collect" && packSelected === "standard" && !stripeClientSecret && !stripeLoading && !stripeError) {
      setStripeLoading(true)
      fetch("/api/checkout", { method: "POST" })
        .then(r => r.json())
        .then(d => {
          if (d.clientSecret) {
            setStripeClientSecret(d.clientSecret)
          } else {
            setStripeError(true)
          }
          setStripeLoading(false)
        })
        .catch(() => { setStripeLoading(false); setStripeError(true) })
    }
    if (activeModal !== "collect") {
      setStripeClientSecret(null)
      setStripeLoading(false)
      setPackSelected(null)
      setStripeError(false)
    }
  }, [activeModal, packSelected])

  return (
    <>
      {/* ── Google Analytics ── */}
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-1TVZ9D5MWT" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-1TVZ9D5MWT');
      `}</Script>

      <style>{`
        .legal-email{color:var(--tmm-blue);transition:color 0.2s}.legal-email:hover{color:rgba(255,255,255,0.45)}

        /* ── Cookie banner ── */
        /* Outer wrapper: centering only — never transitions, so translateX(-50%) is never animated */
        .cookie-bar-wrap{
          position:fixed;bottom:clamp(14px,2.5vw,24px);left:50%;
          transform:translateX(-50%);
          z-index:9000;pointer-events:none;
        }
        /* Inner bar: animates only opacity + translateY — no compound transform, no Windows GPU flicker */
        .cookie-bar{
          display:flex;align-items:center;gap:clamp(10px,2vw,16px);
          padding:clamp(10px,1.5vw,14px) clamp(14px,2.5vw,22px);
          /* Solid fallback first — shown on Firefox/Windows where backdrop-filter is unsupported */
          background:rgba(10,10,16,0.94);
          border:1px solid rgba(255,255,255,0.09);border-radius:clamp(20px,4vw,32px);
          white-space:nowrap;pointer-events:auto;
          will-change:opacity,transform;
          transform:translateY(0) translateZ(0);
          opacity:1;
          transition:opacity 0.4s cubic-bezier(0.4,0,0.2,1),transform 0.4s cubic-bezier(0.4,0,0.2,1);
          font-family:inherit;
        }
        /* Apply blur only where supported (Chrome/Edge/Safari — all fine on Windows) */
        @supports (backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px)){
          .cookie-bar{background:rgba(12,12,18,0.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
        }
        .cookie-bar--hidden{opacity:0;transform:translateY(10px) translateZ(0);pointer-events:none}
        .cookie-bar__text{font-size:clamp(11px,1.5vw,13px);color:rgba(255,255,255,0.6);letter-spacing:0.04em;font-family:inherit}
        .cookie-bar__accept{
          background:none;border:none;color:rgba(255,255,255,0.75);cursor:pointer;
          padding:4px;display:flex;align-items:center;justify-content:center;
          transition:color 0.2s;flex-shrink:0;font-family:inherit;
        }
        .cookie-bar__accept:hover{color:#fff}

        /* ── Scroll-reveal fix: ensure cards always remain visible ── */
        .play-card,.play-card-pill{animation-fill-mode:both}
        .modal-scroll-bare .play-card,.modal-scroll-bare .play-card-pill{opacity:1!important;transform:none!important}

        /* ── Reviews summary: keep character + stats side-by-side at all widths ── */
        .reviews-summary{display:flex!important;flex-wrap:nowrap!important;align-items:flex-start;gap:clamp(10px,2vw,20px)}
        .reviews-score{flex-shrink:0}
        .reviews-avg{flex-shrink:0;min-width:0}
        .reviews-bars{flex:1;min-width:0}

        /* ── Pack selector: sliding segmented control ── */
        .pack-toggle{
          position:relative;display:flex;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.11);
          border-radius:clamp(16px,3vw,24px);
          padding:4px;
        }
        /* Sliding thumb — absolutely positioned, transitions between left positions */
        .pack-toggle__thumb{
          position:absolute;top:4px;bottom:4px;
          width:calc(50% - 4px);
          background:rgba(255,255,255,0.12);
          border:1px solid rgba(255,255,255,0.22);
          border-radius:clamp(12px,2.5vw,20px);
          transition:left 0.32s cubic-bezier(0.4,0,0.2,1);
          pointer-events:none;
        }
        .pack-toggle__thumb--standard{left:4px}
        .pack-toggle__thumb--expansion{left:50%}
        .pack-toggle__btn{
          flex:1;position:relative;z-index:1;
          background:none;border:none;cursor:pointer;
          padding:clamp(11px,2vw,15px) clamp(10px,2vw,16px);
          font-family:inherit;font-size:clamp(11px,1.9vw,14px);
          letter-spacing:0.08em;text-transform:uppercase;font-weight:700;
          transition:color 0.25s;text-align:center;white-space:nowrap;
        }
        .pack-toggle__btn--active{color:#fff}
        .pack-toggle__btn--inactive{color:rgba(255,255,255,0.38)}
      `}</style>

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
            <div className="pill-nav-inner">

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
              <button
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
              <button
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
              <button
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
                    <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .905.184 1.768.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.06A6.5 6.5 0 0116.95 10a6.5 6.5 0 01-2.06 3.89.75.75 0 001.06 1.06A8 8 0 0018.45 10a8 8 0 00-2.5-4.95zM13.596 6.47a.75.75 0 00-1.06 1.06 3.5 3.5 0 010 4.95.75.75 0 001.06 1.06 5 5 0 000-7.07z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.547 3.062A.75.75 0 0110 3.75v12.5a.75.75 0 01-1.264.546L4.703 13H3.167a.75.75 0 01-.7-.48A6.985 6.985 0 012 10c0-.905.184-1.768.468-2.52a.75.75 0 01.699-.48h1.535l4.033-3.796a.75.75 0 01.812-.142zM13.28 7.22a.75.75 0 10-1.06 1.06L13.94 10l-1.72 1.72a.75.75 0 001.06 1.06L15 11.06l1.72 1.72a.75.75 0 101.06-1.06L16.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L15 8.94l-1.72-1.72z"/>
                  </svg>
                )}
              </button>


              {/* HOME — wide text on desktop, 3-line stack on mobile; press to toggle light/dark */}
              <button
                className={`pill-nav-item pill-nav-home pill-nav-home--text${(activeModal === null && !infoOpen) ? " pill-nav-item--active" : ""}`}
                onClick={() => { closeModal(); setInfoOpen(false); setLightMode(m => !m) }}
                aria-label="Home"
              >
                <span className="pill-nav-home-wide">THE MARSHALL MAFIA</span>
                <span className="pill-nav-home-stack">
                  <span style={{display:"block"}}>THE</span>
                  <span style={{display:"block"}}>MARSHALL</span>
                  <span style={{display:"block"}}>MAFIA</span>
                </span>
                <span className="pill-nav-home-tmm">TMM</span>
              </button>

              {/* SHOWCASE */}
              <button
                className={`pill-nav-item${activeModal === "showcase" ? " pill-nav-item--active" : ""}`}
                onClick={() => activeModal === "showcase" ? closeModal() : openModal("showcase")}
                aria-label="Showcase"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 13.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                </svg>
              </button>

              {/* REVIEWS */}
              <button
                className={`pill-nav-item${activeModal === "reviews" ? " pill-nav-item--active" : ""}`}
                onClick={() => activeModal === "reviews" ? closeModal() : openModal("reviews")}
                aria-label="Reviews"
              >
                {activeModal === "reviews" ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 110-2 1 1 0 010 2zM7 9a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2z"/>
                  </svg>
                )}
              </button>

              {/* CART */}
              <button
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
                    <li className="play-block-body">SLEEP &gt; DISCUSSION &gt; VOTE</li>
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
                  <p className="play-block-body">There are Three Different game-modes that can be played!</p>
                  <p className="play-block-body" style={{marginTop:"10px"}}><span style={{color:"#ffffff",fontWeight:"bold"}}>STANDARD mode:</span></p>
                  <ul className="play-rules-list">
                    <li className="play-block-body">Players with the same role — silently point and agree on a <strong>SINGLE</strong> target together (EG. 2 <span className="text-tmm-red">Mafia</span>&apos;s &gt; 1 kill)</li>
                  </ul>
                  <p className="play-block-body" style={{marginTop:"10px"}}><span style={{color:"#ffffff",fontWeight:"bold"}}>GROUP MODE:</span></p>
                  <ul className="play-rules-list">
                    <li className="play-block-body">Players with the same role — silently point and agree on targets together = to the amount of their role (Eg. 2 <span className="text-tmm-red">Mafia</span>&apos;s &gt; 2 kills)</li>
                  </ul>
                  <p className="play-block-body" style={{marginTop:"10px"}}><span style={{color:"#ffffff",fontWeight:"bold"}}>CHAOS mode:</span></p>
                  <ul className="play-rules-list">
                    <li className="play-block-body">Each Player — Silently picks their own <strong>INDIVIDUAL</strong> target <strong>SEPARATELY</strong> (Eg. 1st <span className="text-tmm-red">Mafia</span> &gt; 1 kill / 2nd <span className="text-tmm-red">Mafia</span> &gt; 1 kill)</li>
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
                  <span className="play-block-subtitle">IMAGES</span>
                </div>
                {/* Product renders — card background matches other modal blocks */}
                {[1,2,3,4,5,6,7].map(i => (
                  <div key={i} className="play-card" style={{padding:0,overflow:"hidden",lineHeight:0}} onClick={e => e.stopPropagation()}>
                    <img
                      src={`/images/tmm_product_render_${i}.png`}
                      alt={`The Marshall Mafia — product render ${i}`}
                      loading="lazy"
                      decoding="async"
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

                {/* Releases — accordion */}
                <div className="play-card" onClick={e => e.stopPropagation()} style={{marginTop:"clamp(16px,4vw,32px)"}}>
                  <div className="play-card-header">
                    <span className="play-block-title">MUSIC</span>
                    <span className="play-block-subtitle">RELEASED</span>
                  </div>
                  <div className="releases-list">
                    {/* Volume 1 */}
                    <div>
                      <div className="release-row" style={{cursor:"pointer"}} onClick={() => setOpenVolume(openVolume === 1 ? null : 1)}>
                        <span className="play-block-body">VOLUME 1</span>
                        <span className="play-block-body release-tag" style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          Extended Playlist
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{opacity:0.45,transition:"transform 0.2s",transform:openVolume===1?"rotate(180deg)":"rotate(0deg)"}}><path d="M6 8L1 3h10L6 8z"/></svg>
                        </span>
                      </div>
                      {openVolume === 1 && (
                        <div style={{marginTop:"clamp(10px,2vw,14px)",display:"flex",flexDirection:"column",gap:"clamp(8px,1.5vw,12px)"}}>
                          <p className="play-block-body">The extended playlist for The Marshall Mafia is a cross-generational album crafted to blur the line between playful intrigue and cinematic suspense. The selection of six songs creates a soundscape environment that feels both nostalgic and freshly mischievous.</p>
                          <p className="play-block-body">Designed to engage audiences of all ages, the soundtrack balances retro charm with modern "ear candy" — crisp textures, sly bass lines, and playful melodic hooks that appeal to younger listeners while delighting adults with subtle nods to vintage spy scores. Drawing inspiration from the suave mystery of The Pink Panther and the timeless sophistication of classic James Bond themes, its flagship theme, The Marshall Mafia, anchors the collection with a distinct, memorable motif that defines the project's identity — equal parts shadowy and sophisticated.</p>
                          <p className="play-block-body">Each track extends this atmosphere, drawing its title and tone from in-game quotes and moments, forming an immersive sonic backdrop to the Marshall Mafia game world. Beyond serving as theme music, the album functions as a layer of sonic camouflage — a background that conceals "nightly activities" within the game's universe while enriching the player's experience through tone, rhythm, and narrative depth.</p>
                          <p className="play-block-body">Its aim... merging detective noir with childlike wonder, offering a musical experience that is equal parts mysterious, mischievous, and unmistakably memorable.</p>
                        </div>
                      )}
                    </div>
                    <hr className="play-card-divider" />
                    {/* Volume 2 */}
                    <div>
                      <div className="release-row" style={{cursor:"pointer"}} onClick={() => setOpenVolume(openVolume === 2 ? null : 2)}>
                        <span className="play-block-body">VOLUME 2</span>
                        <span className="play-block-body release-tag" style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          ALBUM
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{opacity:0.45,transition:"transform 0.2s",transform:openVolume===2?"rotate(180deg)":"rotate(0deg)"}}><path d="M6 8L1 3h10L6 8z"/></svg>
                        </span>
                      </div>
                      {openVolume === 2 && (
                        <div style={{marginTop:"clamp(10px,2vw,14px)",display:"flex",flexDirection:"column",gap:"clamp(8px,1.5vw,12px)"}}>
                          <p className="play-block-body">The first full album dubbed "volume 2" advances The Marshall Mafia's soundscape with a more immersive, narrative-driven musical experience. Building on the foundation of the first release, this collection deepens the project's cinematic identity, introducing richer atmospheres, heightened tension, and a refined sense of storytelling through sound.</p>
                          <p className="play-block-body">Each composition is crafted to enhance world-building, strengthen emotional engagement, and reflect the evolving tone of the game. The album moves with intent — shaping intrigue, intensifying drama, and reinforcing the project's unique blend of sophistication, suspense, and thematic continuity.</p>
                          <p className="play-block-body">Positioned not simply as a follow-up but as an expansion, volume 2 broadens the narrative scope of The Marshall Mafia, offering a deeper, more resonant musical environment for audiences to engage with.</p>
                        </div>
                      )}
                    </div>
                    <hr className="play-card-divider" />
                    {/* Volume 3 */}
                    <div>
                      <div className="release-row" style={{cursor:"pointer"}} onClick={() => setOpenVolume(openVolume === 3 ? null : 3)}>
                        <span className="play-block-body">VOLUME 3</span>
                        <span className="play-block-body release-tag" style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          SOUNDTRACKS
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{opacity:0.45,transition:"transform 0.2s",transform:openVolume===3?"rotate(180deg)":"rotate(0deg)"}}><path d="M6 8L1 3h10L6 8z"/></svg>
                        </span>
                      </div>
                      {openVolume === 3 && (
                        <div style={{marginTop:"clamp(10px,2vw,14px)",display:"flex",flexDirection:"column",gap:"clamp(8px,1.5vw,12px)"}}>
                          <p className="play-block-body">The Marshall Mafia's character soundtrack collection translates the essence of eight core characters, including the storyteller into targeted musical identities. Each short-format track functions as a sonic profile, capturing attitude, tone, and emotional presence in a concise and immediately recognisable way.</p>
                          <p className="play-block-body">Designed to support narrative immersion, these themes reinforce character identity, influence audience perception, and enhance a collective storytelling through atmosphere and mood. From the authority of certain characters and mischief of others, each piece serves as a distinct thematic signature within the wider game franchise.</p>
                          <p className="play-block-body">Collectively, the collection strengthens character depth, enriches player experience, and contributes to a cohesive, emotionally resonant creative ecosystem surrounding The Marshall Mafia.</p>
                        </div>
                      )}
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
                    const avgDisplay = avg.toFixed(1)
                    const avgRounded = Math.round(avg)
                    return (
                  <div className="reviews-summary">
                    <div className="reviews-score">
                      <CharacterSVG style={{height:"100%",width:"auto",display:"block"}} />
                    </div>
                    <div className="reviews-avg">
                      <span className="reviews-score-number">{avgDisplay}</span>
                      <StarRating rating={avgRounded} />
                      <span className="play-block-subtitle" style={{fontSize:"12px"}}>{TESTIMONIALS.length} reviews</span>
                      <a
                        href="https://forms.gle/eVJJUSfXr5nHSc8ZA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="play-block-body add-review-btn"
                        onClick={e => e.stopPropagation()}
                        style={{marginTop:0}}
                      >
                        add a review
                      </a>
                    </div>
                    <div className="reviews-bars">
                      {[5,4,3,2,1].map(n => {
                        const count = TESTIMONIALS.filter(t => t.rating === n).length
                        const pct = count > 0 ? Math.round((count / TESTIMONIALS.length) * 100) : 0
                        const isActive = filterRating === n && count > 0
                        const isDimmed = filterRating !== null && !isActive && count > 0
                        const isEmpty = count === 0
                        const labelStyle = { color: isActive ? "#ffffff" : "var(--tmm-yellow)", fontSize: "clamp(15px,2.4vw,17px)", opacity: isDimmed ? 0.35 : isEmpty ? 0.22 : 1, transition: "opacity 0.2s ease" }
                        return (
                          <div key={n}
                            className={`review-bar-row${!isEmpty ? " review-bar-row--clickable" : ""}${isActive ? " review-bar-row--active" : ""}`}
                            onClick={!isEmpty ? (e => { e.stopPropagation(); setFilterRating(filterRating === n ? null : n) }) : undefined}>
                            <span className="review-bar-label" style={labelStyle}>{n}</span>
                            <div className="review-bar-track" style={{opacity: isDimmed ? 0.35 : isEmpty ? 0.15 : 1, transition:"opacity 0.2s ease"}}>
                              <div className="review-bar-fill" style={{ width:`${pct}%`, background: isActive ? "#ffffff" : "var(--tmm-yellow)" }} />
                            </div>
                            <span className="review-bar-count" style={labelStyle}>{isEmpty ? "" : count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                    )
                  })()}
                </div>
                {(filterRating !== null ? TESTIMONIALS.filter(t => t.rating === filterRating) : TESTIMONIALS).map((t, i) => (
                  <div key={i} className="play-card" onClick={e => e.stopPropagation()}>
                    <div className="play-card-header" style={{alignItems:"flex-start"}}>
                      <div style={{display:"flex",flexDirection:"row",alignItems:"baseline",gap:"30px"}}>
                        <span className="play-block-title">{t.name}</span>
                        <span className="play-block-title" style={{opacity:0.5}}>{t.age}</span>
                      </div>
                      <StarRating rating={t.rating} />
                    </div>
                    <p className="play-block-body" style={{marginTop:"clamp(8px,2vw,12px)"}}>{t.colorize ? colorizeBody(t.body) : t.body}</p>
                    {(t as any).photos && (
                      <div style={{display:"flex",flexDirection:"row",gap:"clamp(10px,2vw,16px)",marginTop:"clamp(10px,2vw,16px)"}}>
                        {(t as any).photos.map((src: string, pi: number) => (
                          <div key={pi} style={{flex:1,borderRadius:"clamp(12px,2.5vw,18px)",overflow:"hidden",lineHeight:0,background:"rgba(0,0,0,0.10)"}}>
                            <img src={src} alt={`${t.name} photo ${pi+1}`} style={{width:"100%",height:"auto",display:"block"}} />
                          </div>
                        ))}
                      </div>
                    )}
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

                {/* ── Checkout / Secure pill — top, always visible ── */}
                <div className="play-card-pill">
                  <span className="play-block-title">CHECKOUT</span>
                  <span className="play-block-subtitle">SECURE</span>
                </div>

                {/* ── Pack selector — sliding segmented toggle ── */}
                <div className="pack-toggle">
                  <div className={`pack-toggle__thumb pack-toggle__thumb--${packSelected === "expansion" ? "expansion" : "standard"}`} />
                  <button
                    className={`pack-toggle__btn${packSelected !== "expansion" ? " pack-toggle__btn--active" : " pack-toggle__btn--inactive"}`}
                    onClick={() => { setPackSelected("standard"); setLightMode(false) }}
                  >
                    Standard Pack
                  </button>
                  <button
                    className={`pack-toggle__btn${packSelected === "expansion" ? " pack-toggle__btn--active" : " pack-toggle__btn--inactive"}`}
                    onClick={() => { setPackSelected("expansion"); setLightMode(true) }}
                  >
                    Expansion Pack
                  </button>
                </div>

                {/* ── Standard pack: stripe checkout ── */}
                {packSelected === "standard" && (
                  <div className="play-card">
                    {stripeClientSecret ? (
                      <div className="animate-fade-in" style={{borderRadius:"16px", overflow:"hidden"}}>
                        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                          <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                      </div>
                    ) : stripeError ? (
                      <div className="flex items-center justify-center py-8">
                        <span className="play-block-body" style={{opacity:0.45,textAlign:"center"}}>checkout unavailable — please try again shortly</span>
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

                {/* ── Cancellations ── */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">ORDER</span>
                    <span className="play-block-subtitle">CANCELLATIONS</span>
                  </div>
                  <p className="play-block-body">This is the formal bit, so forgive us for being less witty and more blunt :)</p>
                  <p className="play-block-body">You can cancel your order within 14 days without giving a reason. The period ends 14 days after the day you, or someone you nominate other than the courier, receives the goods.</p>
                  <p className="play-block-body">We hope you don't, let us know if there is anything we can do to help but if you have changed your mind? It happens, just tell us clearly before the period ends. Easiest is an email to <a href="mailto:info@themarshallmafia.com" className="legal-email">info@themarshallmafia.com</a> with your name, address, order number and date, so we can find your order quickly. There's also our <a href="https://forms.gle/wjRZERqxpgT19TGH8" target="_blank" rel="noopener noreferrer" className="legal-email">themarshallmafia.cancellations</a> form if you'd prefer, and any other clear message is good to us too!</p>
                  <p className="play-block-body">Send the box back within 14 days of telling us you are cancelling, to:</p>
                  <p className="play-block-body" style={{opacity:0.7}}>57 Parklawn Avenue, KT18 7SJ, Epsom, Surrey, United Kingdom.</p>
                  <p className="play-block-body"><span style={{color:"#F8007A",fontWeight:600}}>NOTE!</span> — You'll need to cover the cost of sending the deck back, this is to protect us from cheeky customers. Please do use a tracked service if you can, until the parcel has been recollected by us it's still your responsibility, and tracking saves a lot of mess if it goes astray. As soon as we have the box in our hands, we'll hand your refund back to you.</p>
                </div>

                {/* ── Refunds ── */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">REFUND</span>
                    <span className="play-block-subtitle">POLICY</span>
                  </div>
                  <p className="play-block-body">We will refund the price you paid, plus the standard outbound postage charge (if we delivered this). If you choose a faster or upgraded delivery option, we can only refund the standard rate. You send it, we will refund it. Within 14 days of receiving the deck, or of you proving it's on its way — whichever comes first. Your payment will return the way it came.</p>
                  <p className="play-block-body"><span style={{color:"#F8007A",fontWeight:600}}>NOTE!</span> — If the deck comes back having seen some action, we may have to reduce the refund to reflect the loss in value. Looking is fine. Touching, we would too. However unsealing and playing a full round or few is a different case ;)</p>
                  <p className="play-block-body">Faulty or misdescribed? That's on us — no games. Whether it was us or the postage service, we shouldn't play around with your package. Jokes aside, we are being serious and it's separate from your cancellation right: you have 30 days from delivery to reject faulty goods for a full refund. We cover return postage. Don't you worry.</p>
                  <p className="play-block-body">The Marshall Mafia is a family of players. But technically, who you're buying from is just one of us — our resident designer and artist.</p>
                  <p className="play-block-body" style={{color:"rgba(255,255,255,0.55)"}}>William Marshall (trading as marshallwi11), 57 Parklawn Avenue, Epsom, Surrey, KT18 7SJ, United Kingdom.</p>
                </div>

                {/* ── Legal Compliance intro — FIRST ── */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">LEGAL</span>
                    <span className="play-block-subtitle">COMPLIANCE</span>
                  </div>
                  <p className="play-block-body">We don't play games here, so you can. We push the paper, draw the lines, dot the fullstops and tick the boxes, so you can safely cross each other. The boxes have been tested several standards deep so you can put your friends 6ft under. We are EN 71 toy safety tested, UKCA and CE marked, GPSR labelled, FSC card stocked.</p>
                </div>

                {/* ── FSC ── */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">FSC®</span>
                    <span className="play-block-subtitle">SOURCING</span>
                  </div>
                  <p className="play-block-body">The paper and card stock used in The Marshall Mafia is produced by Ivory Graphics, an FSC® certified printer. FSC® (Forest Stewardship Council) certification means materials are sourced from responsibly managed forests. We do our due diligence with our print suppliers to ensure that our environmental commitments aren't just words — they're printed into every card onto every box.</p>
                </div>

                {/* ── UKCA ── */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">UKCA</span>
                    <span className="play-block-subtitle">CERTIFIED</span>
                  </div>
                  <p className="play-block-body">The Marshall Mafia carries the UKCA mark, the legal requirement for products sold in England, Scotland, and Wales. Our printer, Ivory Graphics, submits products for annual testing with an accredited laboratory. This confirms the game meets UK toy safety legislation.</p>
                </div>

                {/* ── CE & GPSR ── */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">CE</span>
                    <span className="play-block-subtitle">GPSR</span>
                  </div>
                  <p className="play-block-body" style={{marginBottom:"clamp(8px,1.5vw,12px)"}}>For customers in the EU, The Marshall Mafia is CE marked and compliant with the General Product Safety Regulation (GPSR), mandatory as of December 2024. Our EU Responsible Person for GPSR compliance:</p>
                  <p className="play-block-body" style={{color:"rgba(255,255,255,0.55)"}}>eucomply OÜ — Pärnu mnt. 139b–14, 11317 Tallinn, Estonia, European Union. <a href="mailto:hello@eucompliancepartner.com" className="legal-email">hello@eucompliancepartner.com</a></p>
                </div>

                {/* ── Ivory UK – Manufacturer ── */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">IVORY</span>
                    <span className="play-block-subtitle">UK</span>
                  </div>
                  <p className="play-block-body" style={{color:"rgba(255,255,255,0.55)"}}>Printed by Ivory Graphics Ltd, Unit 2, 55 Thorby Avenue, March, PE15 0AZ, England.</p>
                </div>

                {/* ── Producer ── */}
                <div className="play-card" onClick={e => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">THE</span>
                    <span className="play-block-subtitle">PRODUCER</span>
                  </div>
                  <p className="play-block-body">For inquiries regarding The Marshall Mafia please email: <a href="mailto:info@themarshallmafia.com" className="legal-email">info@themarshallmafia.com</a></p>
                  <p className="play-block-body">The Marshall Mafia is designed and published by William Marshall (t/a marshallwi11), operating as a sole trader in the United Kingdom.</p>
                  <p className="play-block-body" style={{color:"rgba(255,255,255,0.55)"}}>57 Parklawn Avenue, KT18 7SJ, Epsom, Surrey, United Kingdom. <a href="mailto:info@marshallwi11.com" className="legal-email">info@marshallwi11.com</a></p>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Cookie banner ── */}
      {/* Outer wrapper: centering only (translateX never animates → no Windows GPU flicker) */}
      <div className="cookie-bar-wrap">
        <div className={`cookie-bar${(cookieDismissed || activeModal !== null) ? " cookie-bar--hidden" : ""}`} role="region" aria-label="Cookie notice">
          {/* TMM eyes — same almond eye mark as the logo */}
          <svg width="34" height="14" viewBox="0 0 34 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flexShrink:0,opacity:0.8}}>
            {/* left eye */}
            <path d="M1 7C1 7 4 1 8.5 1C13 1 16 7 16 7C16 7 13 13 8.5 13C4 13 1 7 1 7Z" stroke="white" strokeWidth="1.4" fill="none"/>
            <circle cx="8.5" cy="7" r="2.8" fill="white"/>
            <circle cx="9.4" cy="6.1" r="1" fill="rgba(0,0,0,0.35)"/>
            {/* right eye */}
            <path d="M18 7C18 7 21 1 25.5 1C30 1 33 7 33 7C33 7 30 13 25.5 13C21 13 18 7 18 7Z" stroke="white" strokeWidth="1.4" fill="none"/>
            <circle cx="25.5" cy="7" r="2.8" fill="white"/>
            <circle cx="26.4" cy="6.1" r="1" fill="rgba(0,0,0,0.35)"/>
          </svg>
          <span className="cookie-bar__text">We use cookies to improve your experience.</span>
          {/* Tick button — unframed, nav icon style */}
          <button
            className="cookie-bar__accept"
            aria-label="Accept cookies"
            onClick={() => { localStorage.setItem("tmm_cookies_accepted","1"); setCookieDismissed(true) }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
