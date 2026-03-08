"use client"

import Image from "next/image"
import { useState, useEffect, useCallback, useRef } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type ModalType = "play" | "showcase" | "music" | "collect" | null

export default function Home() {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [collectKey, setCollectKey] = useState(0)

  const openModal = (modal: ModalType) => {
    setMobileMenuOpen(false)
    if (modal === "collect") {
      setCollectKey(k => k + 1)
    }
    setActiveModal(modal)
  }
  const closeModal = useCallback(() => setActiveModal(null), [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") { closeModal(); setMobileMenuOpen(false) } }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closeModal])

  useEffect(() => {
    document.body.style.overflow = (activeModal || mobileMenuOpen) ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [activeModal, mobileMenuOpen])

  // Fetch Stripe client secret when collect modal opens
  useEffect(() => {
    if (activeModal === "collect" && !stripeClientSecret && !stripeLoading) {
      setStripeLoading(true)
      fetch("/api/checkout", { method: "POST" })
        .then((r) => r.json())
        .then((data) => { setStripeClientSecret(data.clientSecret); setStripeLoading(false) })
        .catch(() => setStripeLoading(false))
    }
    if (activeModal !== "collect") {
      setStripeClientSecret(null)
      setStripeLoading(false)
    }
  }, [activeModal])
  const navItems: { label: string; modal: ModalType }[] = [
    { label: "PLAY", modal: "play" },
    { label: "SHOWCASE", modal: "showcase" },
    { label: "MUSIC", modal: "music" },
    { label: "COLLECT", modal: "collect" },
  ]

  return (
    <>
      <main className="h-screen w-screen overflow-hidden bg-black relative flex flex-col items-center justify-center">

        {/* ===== DESKTOP NAV ===== */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center h-[70px]">
          {/* Desktop: all items in a row */}
          <div className="hidden md:flex items-center gap-8 md:gap-12">
            <button onClick={() => openModal("play")} className="nav-link">PLAY</button>
            <button onClick={() => openModal("showcase")} className="nav-link">SHOWCASE</button>
            <span className="nav-title">THE MARSHALL MAFIA</span>
            <button onClick={() => openModal("music")} className="nav-link">MUSIC</button>
            <button onClick={() => openModal("collect")} className="nav-link">COLLECT</button>
          </div>

          {/* Mobile: title + hamburger */}
          <div className="flex md:hidden items-center justify-between w-full px-5">
            <span className="nav-title" style={{fontSize:"clamp(10px,3.5vw,18px)"}}>THE MARSHALL MAFIA</span>
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="flex flex-col gap-[5px] p-2"
              aria-label="Menu"
            >
              <span className={`mobile-bar ${mobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
              <span className={`mobile-bar ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`mobile-bar ${mobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
            </button>
          </div>
        </nav>

        {/* ===== MOBILE DROPDOWN MENU ===== */}
        {mobileMenuOpen && (
          <div className="mobile-menu" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-menu-inner" onClick={(e) => e.stopPropagation()}>
              {navItems.map(({ label, modal }) => (
                <button key={label} onClick={() => openModal(modal)} className="mobile-menu-item">
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== HERO ===== */}
        <div className="select-none pointer-events-none">
          <Image src="/images/asset-logo-motion-graphic.gif" alt="The Marshall Mafia"
            width={1175} height={1175} className="w-[84vw] max-w-[1175px] h-auto" priority unoptimized />
        </div>

        {/* ==================== PLAY MODAL ==================== */}
        {activeModal === "play" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-backdrop" />
            <div className="modal-scroll-bare animate-modal-in">
              <div className="max-w-[675px] mx-auto pb-[80px] px-4 sm:px-6" style={{display:"flex",flexDirection:"column",gap:"clamp(24px,5vw,50px)"}}>

                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">HOW TO PLAY</span>
                    <span className="play-block-subtitle">INSTRUCTIONS</span>
                  </div>
                  <p className="play-block-body">In The Marshall Mafia, <span className="text-tmm-cream">Villagers</span> must Identify, expose and vote out all <span className="text-tmm-red">Mafia</span> members, while the <span className="text-tmm-red">Mafia{"'"}s</span> goal is to secretly eliminate all <span className="text-tmm-cream">Villagers</span> until they outnumber them.</p>
                  <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> hosts the game, managing the flow of the rounds and overseeing the distribution of roles and actions.</p>
                </div>

                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">SETUP</span>
                    <span className="play-block-subtitle">(SEE PLAY CARD*)</span>
                  </div>
                  <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> shuffles the character cards (chosen by the players*) and hands one to each player. These cards determine whether a player is a <span className="text-tmm-cream">Villager</span>, <span className="text-tmm-red">Mafia</span>, or has a special role (see <span className="text-muted">Character Cards*</span> for details on each character{"'"}s abilities).</p>
                  <p className="play-block-body">Note — all Players must keep their character roles secret.</p>
                  <p className="play-block-body">Use the (<span className="text-tmm-green">Music Card*</span>) as an added bonus, it is used for the game ambience (stopping voting on players that make noise while asleep & puts players in the mood to continue playing).</p>
                </div>

                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">RULES</span>
                    <span className="play-block-subtitle">(SEE RULES CARD*)</span>
                  </div>
                  <p className="play-block-body">At the start of the game, players agree on selected (<span className="text-muted">Rule Cards*</span>). This allows for players who have played different rules to agree on how the game will be played.</p>
                  <p className="play-block-body">PLAYERS MUST CLOSE Their EYES & Remain Silent DURING THE SLEEP PHASE.</p>
                  <p className="play-block-body">DURING THE SLEEP PHASE The <span className="text-tmm-cream">MARSHALL</span> ROLE must not SPEAK Directly TOWARDS Each AWOKEN Player, otherwise all players know which role a player has.</p>
                  <p className="play-block-body">AWOKEN Players SILENTLY POINT & CONFIRM Decisions WITH THE <span className="text-tmm-cream">MARSHALL</span>, by hand signals or mouthing their choice to the <span className="text-tmm-cream">Marshall</span> overseeing the game.</p>
                  <p className="play-block-body">Do not cheat. If you die, PICK a "<span className="text-tmm-red">DEATH CARD</span>" FROM THE PACK, hold it to show other players you are eliminated from the game.</p>
                  <p className="play-block-body">Timed discussion period (3 minutes recommended, though it does not have to be*), to keep the rounds short and allow the game to be more decisive.</p>
                  <p className="play-block-body">Voting order must switch each round, to avoid the same players voting last, stopping them having an advantage.</p>
                  <p className="play-block-body">The <span className="text-tmm-cream">MARSHALL</span> role SHOULD change each GAME, so all players have a chance at playing.</p>
                  <p className="play-block-body">SCAN the "<span className="text-tmm-green">MUSIC CARD</span>" to make the GAME more enjoyable (helps the restless "sleeping" of players in the night).</p>
                </div>

                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">CHARACTERS</span>
                    <span className="play-block-subtitle">(SEE EACH ROLE CARD*)</span>
                  </div>
                  <p className="play-block-body"><span className="text-tmm-cream">MARSHALL (1)</span> — The games host and all-seeing narrator. Players with roles wake up during the (Sleep Phase) and open their eyes — in the order called by <span className="text-tmm-cream">Marshall</span> (detailed above*), player then does their role action before closing their eyes again.</p>
                  <p className="play-block-body"><span className="text-tmm-green">ANGEL (2)</span> — Pick player to save (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-blue">DETECTIVE (2)</span> — Pick player to guess if they are a mafia, <span className="text-tmm-cream">Marshall</span> indicates Yes/No (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-green">DOCTOR (2)</span> — <span className="text-tmm-cream">Marshall</span> shows who the mafia killed, save them Yes/No (Single Use).</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">JESTER (1)</span> — Get voted out to win the game.</p>
                  <p className="play-block-body"><span className="text-tmm-red">MAFIA (3)</span> — Pick player to kill (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">SILENCER (1)</span> — Pick player to silence (Each Round).</p>
                  <p className="play-block-body"><span className="text-tmm-cream">VILLAGER (10)</span> — Vote out mafia to win.</p>
                </div>

                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">PHASES</span>
                    <span className="play-block-subtitle">1, 2 & 3</span>
                  </div>
                  <p className="play-block-body">Each round in The Marshall Mafia consists of three phases.</p>
                  <p className="play-block-body">1. SLEEP → 2. DISCUSSION → 3. VOTE.</p>
                  <p className="play-block-body">If the games go too quickly or too many players are getting eliminated each night, the role groups (e.g. if there are 2+ <span className="text-tmm-green">Angels</span>, 2+ <span className="text-tmm-red">Mafia</span>, 2+ <span className="text-tmm-blue">Detectives</span>) each type of role (<span className="text-tmm-red">KILL</span>, <span className="text-tmm-blue">GUESS</span>, <span className="text-tmm-green">SAVE</span>, <span className="text-tmm-yellow">WILD</span>) must decide one player to do their action on.</p>
                </div>

                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">PHASE 1.</span>
                    <span className="play-block-subtitle">SLEEP</span>
                  </div>
                  <p className="play-block-body">This is the secretive action phase. All players close their eyes, and the <span className="text-tmm-cream">Marshall</span> calls specific character roles to perform their actions in a set order:</p>
                  <p className="play-block-body"><span className="text-tmm-red">KILL</span> — The <span className="text-tmm-red">Mafia</span> choose a player to eliminate.</p>
                  <p className="play-block-body"><span className="text-tmm-blue">GUESS</span> — The <span className="text-tmm-blue">Detective</span> (or similar roles) attempt to discover another player{"'"}s identity.</p>
                  <p className="play-block-body"><span className="text-tmm-green">SAVE</span> — The <span className="text-tmm-green">Angel</span> (or similar roles) can protect one player from elimination.</p>
                  <p className="play-block-body"><span className="text-tmm-yellow">WILD</span> — Any other special roles perform their actions (depending on game customisation).</p>
                  <p className="play-block-body">After all actions are completed, the <span className="text-tmm-cream">Marshall</span> announces the result of the night{"'"}s activities (who has been eliminated, if anyone was saved... without naming the player of course, etc.).</p>
                </div>

                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">PHASE 2.</span>
                    <span className="play-block-subtitle">DISCUSSION</span>
                  </div>
                  <p className="play-block-body">All players open their eyes and begin arguing, accusing, or defending themselves based on what they believe has happened during the Sleep Phase.</p>
                  <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> should set a timer (Recommended 3 minutes) for this phase, they can also stop the discussions at a natural moment to keep the phase concise and intense.</p>
                  <p className="play-block-body">Players are free to speculate, but players must not reveal their card (if a player is caught showing their card to another player, they are instantly eliminated).</p>
                </div>

                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">PHASE 3.</span>
                    <span className="play-block-subtitle">VOTE</span>
                  </div>
                  <p className="play-block-body">After the discussion, players proceed straight to the voting.</p>
                  <p className="play-block-body">Each <span className="text-tmm-cream">Villager</span> role votes to eliminate someone they suspect is <span className="text-tmm-red">Mafia</span>, while the <span className="text-tmm-red">Mafia</span> aim to deceive <span className="text-tmm-cream">Villagers</span> into voting out their own.</p>
                  <p className="play-block-body">Each player is allowed to make a single vote, on anyone they choose. When a player casts a vote for another player — the player who has been voted for must hold up a finger for each vote received.</p>
                  <p className="play-block-body">If the vote ties, a re-vote occurs between the tied players (depending on chosen <span className="text-muted">Rule Cards*</span>). The player with the most votes is immediately eliminated, and their character is revealed (also depending on chosen <span className="text-muted">Rule Cards*</span>).</p>
                </div>

                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">ROUNDS</span>
                    <span className="play-block-subtitle">REPEAT</span>
                  </div>
                  <p className="play-block-body">The game continues through the Sleep, Discussion, and Vote phases until one of the following conditions is achieved:</p>
                  <p className="play-block-body">a. <span className="text-tmm-cream">Villagers</span> win by successfully voting out all <span className="text-tmm-red">Mafia</span> members.</p>
                  <p className="play-block-body">b. <span className="text-tmm-red">Mafia</span> wins by eliminating enough <span className="text-tmm-cream">Villagers</span> to outnumber them.</p>
                  <p className="play-block-body">c. <span className="text-tmm-yellow">Wild</span> role wins by fulfilling the unique conditions tied to their abilities.</p>
                </div>

                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">Links</span>
                    <span className="play-block-subtitle">SNEAK PEAKS!</span>
                  </div>
                  <p className="play-block-body">Collect → <a href="https://linktr.ee/themarshallmafia" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">https://linktr.ee/themarshallmafia</a></p>
                  <p className="play-block-body">Music → <a href="https://linktr.ee/themarshallmafia.music" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">https://linktr.ee/themarshallmafia.music</a></p>
                  <p className="play-block-body">Developer → <a href="https://linktr.ee/marshallwi11" target="_blank" rel="noopener noreferrer" className="text-tmm-blue hover:text-white underline underline-offset-2 transition-colors">https://linktr.ee/marshallwi11</a></p>
                </div>

                <div className="play-card-pill" onClick={(e) => e.stopPropagation()}>
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
              <div className="showcase-list" onClick={(e) => e.stopPropagation()}>

                {/* Image 1 */}
                <div className="showcase-card">
                  <div className="showcase-img-well">
                    <img src="/images/tmm_picture_1.png" alt="The Marshall Mafia" loading="eager"
                      onError={(e) => { const t=e.target as HTMLImageElement; t.onerror=null; t.parentElement!.style.minHeight="200px" }} />
                  </div>
                </div>

                {/* Info 1 */}
                <div className="play-card">
                  <p className="play-block-body">The <span className="text-tmm-red">Marshall Mafia</span> is a social deduction card game where players secretly take on the roles of <span className="text-tmm-red">Mafia</span> members or <span className="text-tmm-cream">Villagers</span>, and through rounds of sleeping, discussion and voting, the <span className="text-tmm-cream">Villagers</span> must identify and eliminate the <span className="text-tmm-red">Mafia</span> before they are outnumbered.</p>
                </div>

                {/* Image 2 */}
                <div className="showcase-card">
                  <div className="showcase-img-well">
                    <img src="/images/tmm_picture_2.png" alt="The Marshall Mafia" loading="lazy"
                      onError={(e) => { const t=e.target as HTMLImageElement; t.onerror=null; t.parentElement!.style.minHeight="200px" }} />
                  </div>
                </div>

                {/* Info 2 */}
                <div className="play-card">
                  <p className="play-block-body">Discover the hidden secrets of the game! — Learn how roles are assigned, master the rules of <span className="text-tmm-red">Mafia</span> vs. <span className="text-tmm-cream">Villagers</span>, and get familiar with the game{"'"}s core phases.</p>
                </div>

                {/* Image 3 */}
                <div className="showcase-card">
                  <div className="showcase-img-well">
                    <img src="/images/tmm_picture_3.png" alt="The Marshall Mafia" loading="lazy"
                      onError={(e) => { const t=e.target as HTMLImageElement; t.onerror=null; t.parentElement!.style.minHeight="200px" }} />
                  </div>
                </div>

                {/* Info 3 */}
                <div className="play-card">
                  <p className="play-block-body">From the silence in the Sleep Phase to the heated debates in the Discussion Phase, and the all-important Vote Phase... where eliminations happen — understand how the <span className="text-tmm-cream">Marshall</span> hands out roles and sharpen your strategy to outsmart your rivals, whether you{"'"}re a sneaky <span className="text-tmm-red">Mafia</span> or a watchful <span className="text-tmm-cream">Villager</span>!</p>
                </div>

                {/* Images 4–7 */}
                {[4,5,6,7].map((n) => (
                  <div key={n} className="showcase-card">
                    <div className="showcase-img-well">
                      <img src={`/images/tmm_picture_${n}.png`} alt={`The Marshall Mafia — image ${n}`} loading="lazy"
                        onError={(e) => { const t=e.target as HTMLImageElement; t.onerror=null; t.parentElement!.style.minHeight="200px" }} />
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
              <div className="w-full max-w-[600px] mx-auto px-4 sm:px-6 pb-[80px]">
                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="music-modal-header">
                    <span className="play-block-title">LISTEN</span>
                    <span className="play-block-subtitle" style={{fontSize:"14px",color:"rgba(255,255,255,0.4)"}}>play the full experience</span>
                  </div>

                  <div className="music-grid">

                    <a href="https://open.spotify.com/playlist/3IciRcKF72CRT6MHI6C6Ry" target="_blank" rel="noopener noreferrer" className="music-tile">
                      <div className="music-tile-icon">
                        <img src="/images/tmm_music_spotify.png" alt="Spotify" className="music-tile-img" loading="eager" />
                      </div>
                      <span className="music-tile-label">SPOTIFY</span>
                    </a>

                    <a href="https://music.apple.com/gb/artist/marshallwi11/1844826623" target="_blank" rel="noopener noreferrer" className="music-tile">
                      <div className="music-tile-icon">
                        <img src="/images/tmm_music_apple_music.png" alt="Apple Music" className="music-tile-img" loading="eager" />
                      </div>
                      <span className="music-tile-label">APPLE MUSIC</span>
                    </a>

                    <a href="https://tidal.com/playlist/5f88e8b6-cded-4806-9c94-b22894328454" target="_blank" rel="noopener noreferrer" className="music-tile">
                      <div className="music-tile-icon">
                        <img src="/images/tmm_music_tidal.png" alt="Tidal" className="music-tile-img" loading="eager" />
                      </div>
                      <span className="music-tile-label">TIDAL</span>
                    </a>

                    <a href="https://music.amazon.co.uk/artists/B0FV93YR78/marshallwi11" target="_blank" rel="noopener noreferrer" className="music-tile">
                      <div className="music-tile-icon">
                        <img src="/images/tmm_music_amazon_music.png" alt="Amazon Music" className="music-tile-img" loading="eager" />
                      </div>
                      <span className="music-tile-label">AMAZON MUSIC</span>
                    </a>

                    <a href="https://link.deezer.com/s/32Ea3kbAJwzVroL9cvbDM" target="_blank" rel="noopener noreferrer" className="music-tile">
                      <div className="music-tile-icon">
                        <img src="/images/tmm_music_deezer.png" alt="Deezer" className="music-tile-img" loading="eager" />
                      </div>
                      <span className="music-tile-label">DEEZER</span>
                    </a>

                    <a href="https://www.youtube.com/playlist?list=PLg6v-S6qo4anyKTHrD3zxMAnkHGrSLDlJ" target="_blank" rel="noopener noreferrer" className="music-tile">
                      <div className="music-tile-icon">
                        <img src="/images/tmm_music_youtube.png" alt="YouTube" className="music-tile-img" loading="eager" />
                      </div>
                      <span className="music-tile-label">YOUTUBE</span>
                    </a>

                  </div>
                </div>

                {/* Releases card */}
                <div className="play-card" onClick={(e) => e.stopPropagation()} style={{marginTop:"clamp(16px,4vw,32px)"}}>
                  <div className="play-card-header">
                    <span className="play-block-title">RELEASES</span>
                    <span className="play-block-subtitle">ALBUMS</span>
                  </div>
                  <div className="releases-list">
                    <div className="release-row">
                      <span className="play-block-body">THE MARSHALL MAFIA</span>
                      <span className="play-block-subtitle release-tag">EP&nbsp;&nbsp;&nbsp;RELEASED</span>
                    </div>
                    <hr className="play-card-divider" />
                    <div className="release-row">
                      <span className="play-block-body">THE MARSHALL MAFIA</span>
                      <span className="play-block-subtitle release-tag">ALBUM&nbsp;&nbsp;&nbsp;RELEASED</span>
                    </div>
                    <hr className="play-card-divider" />
                    <div className="release-row">
                      <span className="play-block-body">THE MARSHALL MAFIA</span>
                      <span className="play-block-subtitle release-tag">SOUNDTRACKS&nbsp;&nbsp;&nbsp;RELEASED</span>
                    </div>
                  </div>
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
              <div className="collect-list" onClick={(e) => e.stopPropagation()}>

                {/* Checkout card */}
                <div className="play-card">
                  <div className="play-card-header" style={{marginBottom:"20px"}}>
                    <span className="play-block-title">CHECKOUT</span>
                    <span className="play-block-subtitle">SECURE</span>
                  </div>
                  {stripeClientSecret ? (
                    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
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
