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

  const openModal = (modal: ModalType) => setActiveModal(modal)
  const closeModal = useCallback(() => setActiveModal(null), [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closeModal])

  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
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
          <div className="modal-content animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-scroll">
              <div className="max-w-[675px] mx-auto space-y-[50px] py-[60px] px-6">

                {/* BLOCK 1 - HOW TO PLAY */}
                <div className="play-card">
                  <div className="play-card-header">
                    <span className="play-block-title">HOW TO PLAY</span>
                    <span className="play-block-subtitle">INSTRUCTIONS</span>
                  </div>
                  <p className="play-block-body">
                    In The Marshall Mafia, Villagers must Identify, expose and vote out all Mafia members, while the Mafia{"'"}s goal is to secretly eliminate all Villagers until they outnumber them.
                  </p>
                  <p className="play-block-body">
                    The Marshall hosts the game, managing the flow of the rounds and overseeing the distribution of roles and actions.
                  </p>
                </div>

                {/* BLOCK 2 - SETUP */}
                <div className="play-card">
                  <div className="play-card-header">
                    <span className="play-block-title">SETUP</span>
                    <span className="play-block-subtitle">(SEE PLAY CARD*)</span>
                  </div>
                  <p className="play-block-body">
                    The Marshall shuffles the character cards (chosen by the players*) and hands one to each player. These cards determine whether a player is a Villager, Mafia, or has a special role (see Character Cards* for details on each character{"'"}s abilities).
                  </p>
                  <p className="play-block-body">
                    Note — all Players must keep their character roles secret.
                  </p>
                  <p className="play-block-body">
                    Use the (Music Card*) as an added bonus, it is used for the game ambience (stopping voting on players that make noise while asleep & puts players in the mood to continue playing).
                  </p>
                </div>

                {/* BLOCK 3 - RULES */}
                <div className="play-card">
                  <div className="play-card-header">
                    <span className="play-block-title">RULES</span>
                    <span className="play-block-subtitle">(SEE RULES CARD*)</span>
                  </div>
                  <p className="play-block-body">At the start of the game, players agree on selected (Rule Cards*). This allows for players who have played different rules to agree on how the game will be played.</p>
                  <p className="play-block-body">PLAYERS MUST CLOSE Their EYES & Remain Silent DURING THE SLEEP PHASE.</p>
                  <p className="play-block-body">DURING THE SLEEP PHASE The MARSHALL ROLE must not SPEAK Directly TOWARDS Each AWOKEN Player, otherwise all players know which role a player has.</p>
                  <p className="play-block-body">AWOKEN Players SILENTLY POINT & CONFIRM Decisions WITH THE MARSHALL, by hand signals or mouthing their choice to the Marshall overseeing the game.</p>
                  <p className="play-block-body">Do not cheat. If you die, PICK a {'"'}DEATH CARD{'"'} FROM THE PACK, hold it to show other players you are eliminated from the game.</p>
                  <p className="play-block-body">Timed discussion period (3 minutes recommended, though it does not have to be*), to keep the rounds short and allow the game to be more decisive.</p>
                  <p className="play-block-body">Voting order must switch each round, to avoid the same players voting last, stopping them having an advantage.</p>
                  <p className="play-block-body">The MARSHALL role SHOULD change each GAME, so all players have a chance at playing.</p>
                  <p className="play-block-body">SCAN the {'"'}MUSIC CARD{'"'} to make the GAME more enjoyable (helps the restless {'"'}sleeping{'"'} of players in the night).</p>
                </div>

                {/* BLOCK 4 - CHARACTERS */}
                <div className="play-card">
                  <div className="play-card-header">
                    <span className="play-block-title">CHARACTERS</span>
                    <span className="play-block-subtitle">(SEE EACH ROLE CARD*)</span>
                  </div>
                  <p className="play-block-body"><span className="text-ally">MARSHALL (1)</span> — The games host and all-seeing narrator. Players with roles wake up during the (Sleep Phase) and open their eyes — in the order called by Marshall (detailed above*), player then does their role action before closing their eyes again.</p>
                  <p className="play-block-body"><span className="text-save">ANGEL (2)</span> — Pick player to save (Each Round).</p>
                  <p className="play-block-body"><span className="text-guess">DETECTIVE (2)</span> — Pick player to guess if they are a mafia, Marshall indicates Yes/No (Each Round).</p>
                  <p className="play-block-body"><span className="text-save">DOCTOR (2)</span> — Marshall shows who the mafia killed, save them Yes/No (Single Use).</p>
                  <p className="play-block-body"><span className="text-wild">JESTER (1)</span> — Get voted out to win the game.</p>
                  <p className="play-block-body"><span className="text-kill">MAFIA (3)</span> — Pick player to kill (Each Round).</p>
                  <p className="play-block-body"><span className="text-wild">SILENCER (1)</span> — Pick player to silence (Each Round).</p>
                  <p className="play-block-body"><span className="text-save">VILLAGER (10)</span> — Vote out mafia to win.</p>
                </div>

                {/* BLOCK 5 - PHASES */}
                <div className="play-card">
                  <div className="play-card-header">
                    <span className="play-block-title">PHASES</span>
                    <span className="play-block-subtitle">1, 2 & 3</span>
                  </div>
                  <p className="play-block-body">
                    Each round in The Marshall Mafia consists of three phases. 1. SLEEP → 2. DISCUSSION → 3. VOTE.
                  </p>
                  <p className="play-block-body">
                    If the games go too quickly or too many players are getting eliminated each night, the role groups (e.g. if there are 2+ Angels, 2+ Mafia, 2+ Detectives) each type of role (<span className="text-kill">KILL</span>, <span className="text-guess">GUESS</span>, <span className="text-save">SAVE</span>, <span className="text-wild">WILD</span>) must decide one player to do their action on.
                  </p>
                </div>

                {/* BLOCK 6 - PHASE 1 SLEEP */}
                <div className="play-card">
                  <div className="play-card-header">
                    <span className="play-block-title">PHASE 1.</span>
                    <span className="play-block-subtitle">SLEEP</span>
                  </div>
                  <p className="play-block-body">This is the secretive action phase. All players close their eyes, and the Marshall calls specific character roles to perform their actions in a set order:</p>
                  <p className="play-block-body"><span className="text-kill">KILL</span> — The Mafia choose a player to eliminate.</p>
                  <p className="play-block-body"><span className="text-guess">GUESS</span> — The Detective (or similar roles) attempt to discover another player{"'"}s identity.</p>
                  <p className="play-block-body"><span className="text-save">SAVE</span> — The Angel (or similar roles) can protect one player from elimination.</p>
                  <p className="play-block-body"><span className="text-wild">WILD</span> — Any other special roles perform their actions (depending on game customisation).</p>
                  <p className="play-block-body">After all actions are completed, the Marshall announces the result of the night{"'"}s activities (who has been eliminated, if anyone was saved... without naming the player of course, etc.).</p>
                </div>

                {/* BLOCK 7 - PHASE 2 DISCUSSION */}
                <div className="play-card">
                  <div className="play-card-header">
                    <span className="play-block-title">PHASE 2.</span>
                    <span className="play-block-subtitle">DISCUSSION</span>
                  </div>
                  <p className="play-block-body">All players open their eyes and begin arguing, accusing, or defending themselves based on what they believe has happened during the Sleep Phase.</p>
                  <p className="play-block-body">The Marshall should set a timer (Recommended 3 minutes) for this phase, they can also stop the discussions at a natural moment to keep the phase concise and intense.</p>
                  <p className="play-block-body">Players are free to speculate, but players must not reveal their card (if a player is caught showing their card to another player, they are instantly eliminated).</p>
                </div>

                {/* BLOCK 8 - PHASE 3 VOTE */}
                <div className="play-card">
                  <div className="play-card-header">
                    <span className="play-block-title">PHASE 3.</span>
                    <span className="play-block-subtitle">VOTE</span>
                  </div>
                  <p className="play-block-body">After the discussion, players proceed straight to the voting. Each VILLAGER ROLE votes to eliminate someone they suspect is Mafia, while the Mafia aim to deceive Villagers into voting out their own.</p>
                  <p className="play-block-body">Each player is allowed to make a single vote, on anyone they choose. When a player casts a vote for another player — the player who has been voted for must hold up a finger for each vote received.</p>
                  <p className="play-block-body">If the vote ties, a re-vote occurs between the tied players (depending on chosen Rule Cards*). The player with the most votes is immediately eliminated from the game, and their character is revealed (also depending on chosen Rule Cards*).</p>
                </div>

                {/* BLOCK 9 - ROUNDS REPEAT */}
                <div className="play-card">
                  <div className="play-card-header">
                    <span className="play-block-title">ROUNDS</span>
                    <span className="play-block-subtitle">REPEAT</span>
                  </div>
                  <p className="play-block-body">The game continues through the Sleep, Discussion, and Vote phases until one of the following conditions is achieved:</p>
                  <p className="play-block-body">a. <span className="text-save">Villagers</span> win by successfully voting out all Mafia members.</p>
                  <p className="play-block-body">b. <span className="text-kill">Mafia</span> wins by eliminating enough Villagers to outnumber them.</p>
                  <p className="play-block-body">c. <span className="text-wild">Wild role</span> wins by fulfilling the unique conditions tied to their abilities.</p>
                </div>

                {/* BLOCK 10 - LINKS */}
                <div className="play-card">
                  <div className="play-card-header">
                    <span className="play-block-title">Links</span>
                    <span className="play-block-subtitle">SNEAK PEAKS!</span>
                  </div>
                  <p className="play-block-body">Collect → <a href="https://linktr.ee/themarshallmafia" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">linktr.ee/themarshallmafia</a></p>
                  <p className="play-block-body">Music → <a href="https://linktr.ee/themarshallmafia.music" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">linktr.ee/themarshallmafia.music</a></p>
                  <p className="play-block-body">Developer → <a href="https://linktr.ee/marshallwi11" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">linktr.ee/marshallwi11</a></p>
                </div>

                {/* BLOCK 11 - FOOTER */}
                <div className="play-card">
                  <div className="play-card-header">
                    <span className="play-block-title">by marshallwi11</span>
                    <span className="play-block-subtitle">est. 2025</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SHOWCASE MODAL ==================== */}
      {activeModal === "showcase" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-backdrop" />
          <div className="modal-content animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-scroll">
              <div className="max-w-[650px] mx-auto space-y-[40px] py-[60px] px-6">
                {[
                  { src: "/images/showcase-1.png", alt: "Angel, Jester and Detective character cards" },
                  { src: "/images/showcase-2.png", alt: "Game box open with Marshall and Character cards" },
                  { src: "/images/showcase-3.png", alt: "Doctor, Silencer and 1st Edition cards" },
                  { src: "/images/showcase-4.png", alt: "Doctor, Silencer and 1st Edition cards alternate view" },
                ].map((img, i) => (
                  <div key={i} className="glass-block-showcase">
                    <div className="showcase-image-wrapper">
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-cover rounded-[17.5px] select-none"
                        draggable={false}
                        loading={i === 0 ? "eager" : "lazy"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MUSIC MODAL ==================== */}
      {activeModal === "music" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-backdrop" />
          <div className="modal-content animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-scroll flex items-center justify-center">
              <div className="w-full max-w-[500px] mx-auto px-6 py-16 space-y-[40px]">

                <h2 className="text-[22px] text-center">Play the Full Experience</h2>

                {/* Platform Icons */}
                <div className="glass-block flex items-center justify-center gap-8 py-8">
                  <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Spotify">
                    <img src="/images/spotify-icon.png" alt="Spotify" className="w-14 h-14 rounded-2xl" draggable={false} />
                  </a>
                  <a href="https://music.apple.com" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Apple Music">
                    <img src="/images/apple-music-icon.png" alt="Apple Music" className="w-14 h-14 rounded-2xl" draggable={false} />
                  </a>
                  <a href="https://tidal.com" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Tidal">
                    <img src="/images/tidal-icon.png" alt="Tidal" className="w-14 h-14 rounded-2xl" draggable={false} />
                  </a>
                  <a href="https://music.amazon.com" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Amazon Music">
                    <img src="/images/amazon-music-icon.png" alt="Amazon Music" className="w-14 h-14 rounded-2xl" draggable={false} />
                  </a>
                  <a href="https://www.youtube.com/watch?v=rDAGxCTx-28" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="YouTube">
                    <div className="w-14 h-14 rounded-2xl bg-[#FF0000] flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </div>
                  </a>
                </div>

                {/* Coming soon note */}
                <div className="glass-block text-center space-y-2 py-8">
                  <p className="text-[16px] text-white/80">The Marshall Mafia</p>
                  <p className="text-[13px] text-white/35">Official Soundtrack — Coming Soon</p>
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
          <div className="modal-content animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-scroll">
              <div className="max-w-[650px] mx-auto space-y-[40px] py-[60px] px-6">

                {/* BLOCK - Product */}
                <div className="glass-block">
                  <div className="flex gap-5 items-start">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                      <Image
                        src="/images/asset-image-1.png"
                        alt="Limited 1st Edition"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[20px] leading-tight">Limited 1st Edition</p>
                      <p className="text-[14px] text-white/40 mt-2">The complete standard game set with first release limited card.</p>
                    </div>
                    <p className="text-[20px] flex-shrink-0">{"£"}25.00</p>
                  </div>
                </div>

                {/* BLOCK - Express Checkout */}
                <div className="glass-block space-y-5">
                  <p className="text-[13px] text-white/40 text-center">Express checkout</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setComingSoonVisible(true)} className="checkout-btn bg-[#FFC439] text-black">
                      <span className="text-[13px] font-bold">PayPal</span>
                    </button>
                    <button onClick={() => setComingSoonVisible(true)} className="checkout-btn bg-white text-black">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
                      <span className="text-[13px]">Pay</span>
                    </button>
                    <button onClick={() => setComingSoonVisible(true)} className="checkout-btn bg-white text-black">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1"><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M6.75 14.5a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3zm5 0a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5z" fill="white" /></svg>
                      <span className="text-[13px]">Card</span>
                    </button>
                  </div>
                  {comingSoonVisible && (
                    <p className="text-[13px] text-white/50 text-center animate-fadeIn">
                      Payments coming soon — check back shortly! 🖤
                    </p>
                  )}
                </div>

                {/* BLOCK - Contact */}
                <div className="glass-block space-y-5">
                  <div className="play-block-header mb-0">
                    <span className="play-block-title text-[18px]">Contact</span>
                  </div>
                  <input type="email" placeholder="Email address" className="collect-input" />
                  <input type="tel" placeholder="Phone number (optional)" className="collect-input" />
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded accent-white" defaultChecked />
                    <span className="text-[13px] text-white/50">Email me with new releases and sneaky extra content</span>
                  </label>
                </div>

                {/* BLOCK - Delivery */}
                <div className="glass-block space-y-5">
                  <div className="play-block-header mb-0">
                    <span className="play-block-title text-[18px]">Delivery</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="First name" className="collect-input" />
                    <input type="text" placeholder="Last name" className="collect-input" />
                  </div>
                  <input type="text" placeholder="Address" className="collect-input" />
                  <input type="text" placeholder="Postcode" className="collect-input" />
                </div>

                {/* BLOCK - Support */}
                <div className="glass-block space-y-5">
                  <div className="play-block-header mb-0">
                    <span className="play-block-title text-[18px]">Support the Project</span>
                  </div>
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

                {/* BLOCK - Order Summary */}
                <div className="glass-block space-y-5">
                  <div className="play-block-header mb-0">
                    <span className="play-block-title text-[18px]">Order Summary</span>
                  </div>
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
        </div>
      )}

    </main>
  )
}
