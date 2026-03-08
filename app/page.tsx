"use client"

import Image from "next/image"
import Script from "next/script"
import { useState, useEffect, useCallback, useRef } from "react"

type ModalType = "play" | "showcase" | "music" | "collect" | null

export default function Home() {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [paypalReady, setPaypalReady] = useState(false)
  const [collectKey, setCollectKey] = useState(0)
  const paypalRenderedRef = useRef(false)

  const openModal = (modal: ModalType) => {
    setMobileMenuOpen(false)
    if (modal === "collect") {
      setCollectKey(k => k + 1)
      paypalRenderedRef.current = false
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

  // Render PayPal when collect modal mounts
  useEffect(() => {
    if (activeModal === "collect" && paypalReady && !paypalRenderedRef.current) {
      const container = document.getElementById("paypal-container-7FQPC38SRM8BN")
      if (container && container.children.length === 0) {
        paypalRenderedRef.current = true
        try {
          // @ts-ignore
          paypal.HostedButtons({ hostedButtonId: "7FQPC38SRM8BN" }).render("#paypal-container-7FQPC38SRM8BN")
        } catch (e) {
          console.error("PayPal render error:", e)
          paypalRenderedRef.current = false
        }
      }
    }
  }, [activeModal, paypalReady, collectKey])

  const navItems: { label: string; modal: ModalType }[] = [
    { label: "PLAY", modal: "play" },
    { label: "SHOWCASE", modal: "showcase" },
    { label: "MUSIC", modal: "music" },
    { label: "COLLECT", modal: "collect" },
  ]

  return (
    <>
      <Script
        src="https://www.paypal.com/sdk/js?client-id=BAAHLKdlCHkITDXSJJ2L4OwBggnZscg77Oqj9XSptYrHLbdiEtjbQCD2KD-i3obFsLes3m7WcyDyMnez4I&components=hosted-buttons&disable-funding=venmo&currency=GBP"
        strategy="afterInteractive"
        onReady={() => setPaypalReady(true)}
      />

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
              <div className="max-w-[675px] mx-auto space-y-[50px] pb-[80px] px-6">

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
                  <p className="play-block-body">Each round in The Marshall Mafia consists of three phases. 1. SLEEP → 2. DISCUSSION → 3. VOTE.</p>
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
                {[1,2,3,4,5,6,7].map((n) => (
                  <div key={n} className="showcase-card">
                    <div className="showcase-card-header">
                      <span className="play-block-title" style={{fontSize:"15px"}}>LIMITED - 1ST EDITION</span>
                      <span className="play-block-subtitle" style={{fontSize:"15px"}}>STANDARD PACK</span>
                    </div>
                    <div className="showcase-img-well">
                      <img
                        src={`/images/tmm_picture_${n}.png`}
                        alt={`The Marshall Mafia — image ${n}`}
                        loading={n === 1 ? "eager" : "lazy"}
                        onError={(e) => {
                          const t = e.target as HTMLImageElement
                          t.src = `/images/tmm_picture_${n}.jpg`
                          t.onerror = () => { t.parentElement!.style.minHeight = "200px" }
                        }}
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
              <div className="w-full max-w-[600px] mx-auto px-6 pb-[80px]">
                <div className="play-card" onClick={(e) => e.stopPropagation()}>
                  <div className="play-card-header">
                    <span className="play-block-title">PLAY THE FULL EXPERIENCE</span>
                  </div>

                  <div className="music-grid">

                    {/* Spotify */}
                    <a href="https://open.spotify.com/playlist/3IciRcKF72CRT6MHI6C6Ry" target="_blank" rel="noopener noreferrer" className="music-tile" aria-label="Spotify">
                      <div className="music-tile-icon bg-[#1DB954]">
                        <img src="/images/tmm_music_spotify.png" alt="" className="music-tile-img"
                          onError={(e) => { (e.target as HTMLImageElement).style.display="none" }} />
                        <svg className="music-tile-fallback" width="44" height="44" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                      </div>
                      <span className="music-tile-label">SPOTIFY</span>
                    </a>

                    {/* Apple Music */}
                    <a href="https://music.apple.com/gb/artist/marshallwi11/1844826623" target="_blank" rel="noopener noreferrer" className="music-tile" aria-label="Apple Music">
                      <div className="music-tile-icon" style={{background:"linear-gradient(145deg,#fc5c7d,#6a3093)"}}>
                        <img src="/images/tmm_music_apple_music.png" alt="" className="music-tile-img"
                          onError={(e) => { (e.target as HTMLImageElement).style.display="none" }} />
                        <svg className="music-tile-fallback" width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 5.5l-5 2V15c-.552-.35-1.208-.5-1.899-.326C7.45 14.938 7 15.74 7 16.551c0 .81.45 1.449 1.101 1.449.652 0 1.235-.486 1.449-1.224.07-.245.099-.5.099-.776V11.8l3-1v2.7c-.552-.35-1.208-.5-1.899-.326C9.45 13.438 9 14.24 9 15.051c0 .81.45 1.449 1.101 1.449.652 0 1.235-.486 1.449-1.224.07-.245.099-.5.099-.776V7.5z"/></svg>
                      </div>
                      <span className="music-tile-label">APPLE MUSIC</span>
                    </a>

                    {/* Tidal */}
                    <a href="https://tidal.com/playlist/5f88e8b6-cded-4806-9c94-b22894328454" target="_blank" rel="noopener noreferrer" className="music-tile" aria-label="Tidal">
                      <div className="music-tile-icon" style={{background:"#000", border:"1px solid rgba(255,255,255,0.15)"}}>
                        <img src="/images/tmm_music_tidal.png" alt="" className="music-tile-img"
                          onError={(e) => { (e.target as HTMLImageElement).style.display="none" }} />
                        <svg className="music-tile-fallback" width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004 4.004-4.004 4.004 4.004 4.004-4.004zM8.008 12l-4.004 4.004L8.008 20l4.004-4.004zm7.996 0l-4.004 4.004 4.004 4.004L20 16.004z"/></svg>
                      </div>
                      <span className="music-tile-label">TIDAL</span>
                    </a>

                    {/* Amazon Music */}
                    <a href="https://music.amazon.co.uk/artists/B0FV93YR78/marshallwi11" target="_blank" rel="noopener noreferrer" className="music-tile" aria-label="Amazon Music">
                      <div className="music-tile-icon bg-[#232F3E]">
                        <img src="/images/tmm_music_amazon_music.png" alt="" className="music-tile-img"
                          onError={(e) => { (e.target as HTMLImageElement).style.display="none" }} />
                        <svg className="music-tile-fallback" width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M15.93 17.09c-.16.12-.38.13-.56.03-1.77-1.09-2.35-1.59-3.46-2.62-1.04.98-1.78 1.28-2.96 1.28-1.48 0-2.63-.92-2.63-2.75 0-1.45.78-2.43 1.9-2.91.97-.43 2.33-.51 3.37-.62v-.23c0-.43.03-.94-.22-1.31-.22-.33-.64-.47-1.01-.47-.69 0-1.3.35-1.45 1.08-.03.16-.15.32-.31.33l-1.75-.19c-.15-.03-.31-.15-.27-.38.4-2.11 2.3-2.74 4.01-2.74.87 0 2.01.23 2.7.89.87.81.79 1.9.79 3.08v2.79c0 .84.35 1.21.67 1.66.12.16.14.35-.01.47-.36.3-1.01.87-1.37 1.19l-.45-.57z"/><path d="M17.5 19.26c-2.31 1.7-5.65 2.6-8.53 2.6-4.04 0-7.67-1.49-10.42-3.97-.22-.19-.02-.46.24-.31 2.97 1.73 6.63 2.76 10.43 2.76 2.56 0 5.37-.53 7.95-1.63.39-.17.72.26.33.55z"/></svg>
                      </div>
                      <span className="music-tile-label">AMAZON MUSIC</span>
                    </a>

                    {/* Deezer */}
                    <a href="https://link.deezer.com/s/32Ea3kbAJwzVroL9cvbDM" target="_blank" rel="noopener noreferrer" className="music-tile" aria-label="Deezer">
                      <div className="music-tile-icon" style={{background:"linear-gradient(135deg,#a238ff,#ef5466,#ff8c00)"}}>
                        <img src="/images/tmm_music_deezer.png" alt="" className="music-tile-img"
                          onError={(e) => { (e.target as HTMLImageElement).style.display="none" }} />
                        <svg className="music-tile-fallback" width="38" height="38" viewBox="0 0 24 24" fill="white"><path d="M18.944 17.236h2.387v1.072h-2.387zM3.67 17.236h2.387v1.072H3.67zm5.087 0h2.387v1.072H8.757zm5.087 0h2.387v1.072h-2.387zM18.944 14.91h2.387v1.073h-2.387zm-5.1 0h2.387v1.073h-2.387zM8.757 14.91h2.387v1.073H8.757zm-5.087 0h2.387v1.073H3.67zm15.274-2.326h2.387v1.072h-2.387zm-5.1 0h2.387v1.072h-2.387zM8.757 12.584h2.387v1.072H8.757zM18.944 10.26h2.387v1.071h-2.387zm-5.1 0h2.387v1.071h-2.387zm10.187-2.326h2.387v1.072H24.031V7.934zm-5.087 0h2.387v1.072h-2.387z"/></svg>
                      </div>
                      <span className="music-tile-label">DEEZER</span>
                    </a>

                    {/* YouTube */}
                    <a href="https://www.youtube.com/playlist?list=PLg6v-S6qo4anyKTHrD3zxMAnkHGrSLDlJ" target="_blank" rel="noopener noreferrer" className="music-tile" aria-label="YouTube">
                      <div className="music-tile-icon bg-[#FF0000]">
                        <img src="/images/tmm_music_youtube.png" alt="" className="music-tile-img"
                          onError={(e) => { (e.target as HTMLImageElement).style.display="none" }} />
                        <svg className="music-tile-fallback" width="44" height="44" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </div>
                      <span className="music-tile-label">YOUTUBE</span>
                    </a>

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
            <div className="collect-centered animate-modal-in" onClick={(e) => e.stopPropagation()}>

              <div className="play-card w-full">
                <div className="play-card-header" style={{marginBottom:"20px"}}>
                  <span className="play-block-title">CHECKOUT</span>
                  <span className="play-block-subtitle">SECURE PAYMENT</span>
                </div>
                {paypalReady ? (
                  <div key={collectKey} id="paypal-container-7FQPC38SRM8BN" />
                ) : (
                  <div className="flex items-center justify-center py-10 gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-white/40 text-[13px]">Loading secure checkout...</span>
                  </div>
                )}
              </div>

              <div className="play-card-pill w-full" style={{marginTop:"20px"}}>
                <span className="play-block-body" style={{color:"rgba(255,255,255,0.45)",fontSize:"13px"}}>UK delivery included</span>
                <span className="play-block-subtitle" style={{fontSize:"13px"}}>£5 international</span>
              </div>

            </div>
          </div>
        )}

      </main>
    </>
  )
}
