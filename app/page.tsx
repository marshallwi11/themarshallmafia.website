"use client"

import Image from "next/image"
import { useState, useEffect, useCallback } from "react"

type ModalType = "play" | "showcase" | "music" | "collect" | null

export default function Home() {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [giftAmount, setGiftAmount] = useState("")
  const [comingSoonVisible, setComingSoonVisible] = useState(false)

  const gamePrice = 25
  const deliveryPrice = 5
  const giftAmountNum = Number.parseFloat(giftAmount) || 0
  const totalPrice = gamePrice + deliveryPrice + giftAmountNum

  const openModal = (modal: ModalType) => { setActiveModal(modal); setComingSoonVisible(false) }
  const closeModal = useCallback(() => setActiveModal(null), [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal() }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closeModal])

  useEffect(() => {
    document.body.style.overflow = activeModal ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [activeModal])

  return (
    <main className="h-screen w-screen overflow-hidden bg-black relative flex flex-col items-center justify-center">

      {/* ===== TEXT NAV BAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center h-[70px]">
        <div className="flex items-center gap-8 md:gap-12">
          <button onClick={() => openModal("play")} className="nav-link">PLAY</button>
          <button onClick={() => openModal("showcase")} className="nav-link">SHOWCASE</button>
          <span className="nav-title">THE MARSHALL MAFIA</span>
          <button onClick={() => openModal("music")} className="nav-link">MUSIC</button>
          <button onClick={() => openModal("collect")} className="nav-link">COLLECT</button>
        </div>
      </nav>

      {/* ===== EYES HERO ===== */}
      <div className="select-none pointer-events-none">
        <Image
          src="/images/asset-logo-motion-graphic.gif"
          alt="The Marshall Mafia"
          width={1175}
          height={1175}
          className="w-[84vw] max-w-[1175px] h-auto"
          priority
          unoptimized
        />
      </div>

      {/* ==================== PLAY MODAL ==================== */}
      {activeModal === "play" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-backdrop" />
          {/* Scroll container — click passes through to overlay */}
          <div className="modal-scroll-bare animate-modal-in">
            {/* Inner width-constrained column — clicks on gaps close modal */}
            <div className="max-w-[675px] mx-auto space-y-[50px] py-[80px] px-6">

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
                <p className="play-block-body">If the vote ties, a re-vote occurs between the tied players (depending on chosen <span className="text-muted">Rule Cards*</span>). The player with the most votes is immediately eliminated from the game, and their character is revealed (also depending on chosen <span className="text-muted">Rule Cards*</span>).</p>
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
            <div className="max-w-[650px] mx-auto space-y-[40px] py-[80px] px-6">
              {["tmm_picture_1","tmm_picture_2","tmm_picture_3","tmm_picture_4","tmm_picture_5","tmm_picture_6","tmm_picture_7"].map((name, i) => (
                <div key={i} className="showcase-card" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={`/images/${name}.png`}
                    alt={`The Marshall Mafia ${i + 1}`}
                    className="w-full block select-none"
                    style={{ display: "block" }}
                    draggable={false}
                    loading={i === 0 ? "eager" : "lazy"}
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.src = `/images/${name}.jpg`
                    }}
                  />
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
            <div className="w-full max-w-[560px] mx-auto px-6 py-[80px]">

              <div className="play-card" onClick={(e) => e.stopPropagation()}>
                <div className="play-card-header">
                  <span className="play-block-title">PLAY THE FULL EXPERIENCE</span>
                </div>

                <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">

                  {/* Spotify — using local icon */}
                  <a href="https://open.spotify.com/playlist/3IciRcKF72CRT6MHI6C6Ry" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Spotify">
                    <div className="music-platform-icon overflow-hidden">
                      <img src="/images/spotify-icon.png" alt="Spotify" className="w-full h-full object-cover" />
                    </div>
                  </a>

                  {/* Apple Music — using local icon */}
                  <a href="https://music.apple.com/gb/artist/marshallwi11/1844826623" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Apple Music">
                    <div className="music-platform-icon overflow-hidden">
                      <img src="/images/apple-music-icon.png" alt="Apple Music" className="w-full h-full object-cover" />
                    </div>
                  </a>

                  {/* Tidal — using local icon */}
                  <a href="https://tidal.com/artist/68027124" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Tidal">
                    <div className="music-platform-icon overflow-hidden">
                      <img src="/images/tidal-icon.png" alt="Tidal" className="w-full h-full object-cover" />
                    </div>
                  </a>

                  {/* Amazon Music — using local icon */}
                  <a href="https://music.amazon.co.uk/artists/B0FV93YR78/marshallwi11" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Amazon Music">
                    <div className="music-platform-icon overflow-hidden">
                      <img src="/images/amazon-music-icon.png" alt="Amazon Music" className="w-full h-full object-cover" />
                    </div>
                  </a>

                  {/* Deezer — SVG fallback (no local icon found) */}
                  <a href="https://www.deezer.com/en/artist/349863202" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Deezer">
                    <div className="music-platform-icon" style={{background:"linear-gradient(135deg,#a238ff,#ef5466,#ff8c00)"}}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M18.944 17.236h2.387v1.072h-2.387zM3.67 17.236h2.387v1.072H3.67zm5.087 0h2.387v1.072H8.757zm5.087 0h2.387v1.072h-2.387zM18.944 14.91h2.387v1.073h-2.387zm-5.1 0h2.387v1.073h-2.387zM8.757 14.91h2.387v1.073H8.757zm-5.087 0h2.387v1.073H3.67zm15.274-2.326h2.387v1.072h-2.387zm-5.1 0h2.387v1.072h-2.387zM8.757 12.584h2.387v1.072H8.757zM18.944 10.26h2.387v1.071h-2.387zm-5.1 0h2.387v1.071h-2.387zm10.187-2.326h2.387v1.072H24.031V7.934zm-5.087 0h2.387v1.072h-2.387z"/></svg>
                    </div>
                  </a>

                  {/* YouTube — SVG (no local icon) */}
                  <a href="https://www.youtube.com/playlist?list=PLg6v-S6qo4anyKTHrD3zxMAnkHGrSLDlJ" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="YouTube">
                    <div className="music-platform-icon bg-[#FF0000]">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </div>
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
          <div className="modal-scroll-bare animate-modal-in">
            <div className="max-w-[650px] mx-auto space-y-[40px] py-[80px] px-6">

              <div className="glass-block" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-5 items-start">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                    <Image src="/images/asset-image-1.png" alt="Limited 1st Edition" width={96} height={96} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[20px] leading-tight">Limited 1st Edition</p>
                    <p className="text-[14px] text-white/40 mt-2">The complete standard game set with first release limited card.</p>
                  </div>
                  <p className="text-[20px] flex-shrink-0">{"£"}25.00</p>
                </div>
              </div>

              <div className="glass-block space-y-5" onClick={(e) => e.stopPropagation()}>
                <p className="text-[13px] text-white/40 text-center">Express checkout</p>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setComingSoonVisible(true)} className="checkout-btn bg-[#FFC439] text-black">
                    <span className="text-[13px] font-bold">PayPal</span>
                  </button>
                  <button onClick={() => setComingSoonVisible(true)} className="checkout-btn bg-white text-black">
                    <svg width="14" height="14" viewBox="0 0 814 1000" fill="currentColor" className="mr-1"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-38.8-165.8-131.5c-69-101.9-121.5-256.2-121.5-361.6 0-212.1 137.4-324.3 272.5-324.3 70.4 0 128.9 46.4 173.1 46.4 42.8 0 109.6-49.1 190.5-49.1 45.1 0 155.8 3.9 228.6 111.8zm-167.6-123.3c33.1-39.5 56.4-94.1 56.4-148.7 0-7.7-.6-15.4-1.9-21.8-53.5 2-116.6 35.8-155.2 80.6-30.5 35.1-59.6 89.7-59.6 145.6 0 8.4 1.3 16.7 1.9 19.5 3.2.6 8.4 1.3 13.6 1.3 47.8 0 107.8-32.5 144.8-76.5z"/></svg>
                    <span className="text-[13px]">Pay</span>
                  </button>
                  <button onClick={() => setComingSoonVisible(true)} className="checkout-btn bg-white text-black">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20" stroke="currentColor" strokeWidth="2"/></svg>
                    <span className="text-[13px]">Card</span>
                  </button>
                </div>
                {comingSoonVisible && (
                  <p className="text-[13px] text-white/50 text-center">Payments coming soon — check back shortly! 🖤</p>
                )}
              </div>

              <div className="glass-block space-y-5" onClick={(e) => e.stopPropagation()}>
                <span className="play-block-title text-[18px]">Contact</span>
                <input type="email" placeholder="Email address" className="collect-input" />
                <input type="tel" placeholder="Phone number (optional)" className="collect-input" />
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-white" defaultChecked />
                  <span className="text-[13px] text-white/50">Email me with new releases and sneaky extra content</span>
                </label>
              </div>

              <div className="glass-block space-y-5" onClick={(e) => e.stopPropagation()}>
                <span className="play-block-title text-[18px]">Delivery</span>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="First name" className="collect-input" />
                  <input type="text" placeholder="Last name" className="collect-input" />
                </div>
                <input type="text" placeholder="Address" className="collect-input" />
                <input type="text" placeholder="Postcode" className="collect-input" />
              </div>

              <div className="glass-block space-y-5" onClick={(e) => e.stopPropagation()}>
                <span className="play-block-title text-[18px]">Support the Project</span>
                <div className="flex items-center gap-2 collect-input">
                  <span className="text-white/35 text-[16px]">{"£"}</span>
                  <input
                    type="number"
                    placeholder="Gift amount (optional)"
                    value={giftAmount}
                    onChange={(e) => setGiftAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder:text-white/25"
                  />
                </div>
              </div>

              <div className="glass-block space-y-5" onClick={(e) => e.stopPropagation()}>
                <span className="play-block-title text-[18px]">Order Summary</span>
                <div className="space-y-3 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-white/40">Subtotal</span>
                    <span>{"£"}{gamePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Shipping</span>
                    <span>{"£"}{deliveryPrice.toFixed(2)}</span>
                  </div>
                  {giftAmountNum > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Gift</span>
                      <span>{"£"}{giftAmountNum.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="h-px bg-white/[0.06]" />
                <div className="flex justify-between items-baseline">
                  <span className="text-[18px]">Total</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] text-white/30">GBP</span>
                    <span className="text-[22px]">{"£"}{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={() => setComingSoonVisible(true)} className="w-full py-4 bg-white text-black rounded-2xl text-[16px] hover:bg-white/90 transition-colors">
                  Complete Order
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  )
}
