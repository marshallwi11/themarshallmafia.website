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
          <div className="modal-scroll-bare animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-[675px] mx-auto space-y-[50px] py-[80px] px-6">

              <div className="play-card">
                <div className="play-card-header">
                  <span className="play-block-title">HOW TO PLAY</span>
                  <span className="play-block-subtitle">INSTRUCTIONS</span>
                </div>
                <p className="play-block-body">In The Marshall Mafia, <span className="text-tmm-cream">Villagers</span> must Identify, expose and vote out all <span className="text-tmm-red">Mafia</span> members, while the <span className="text-tmm-red">Mafia{"'"}s</span> goal is to secretly eliminate all <span className="text-tmm-cream">Villagers</span> until they outnumber them.</p>
                <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> hosts the game, managing the flow of the rounds and overseeing the distribution of roles and actions.</p>
              </div>

              <div className="play-card">
                <div className="play-card-header">
                  <span className="play-block-title">SETUP</span>
                  <span className="play-block-subtitle">(SEE PLAY CARD*)</span>
                </div>
                <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> shuffles the character cards (chosen by the players*) and hands one to each player. These cards determine whether a player is a <span className="text-tmm-cream">Villager</span>, <span className="text-tmm-red">Mafia</span>, or has a special role (see <span className="text-muted">Character Cards*</span> for details on each character{"'"}s abilities).</p>
                <p className="play-block-body">Note — all Players must keep their character roles secret.</p>
                <p className="play-block-body">Use the (<span className="text-tmm-green">Music Card*</span>) as an added bonus, it is used for the game ambience (stopping voting on players that make noise while asleep & puts players in the mood to continue playing).</p>
              </div>

              <div className="play-card">
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

              <div className="play-card">
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

              <div className="play-card">
                <div className="play-card-header">
                  <span className="play-block-title">PHASES</span>
                  <span className="play-block-subtitle">1, 2 & 3</span>
                </div>
                <p className="play-block-body">Each round in The Marshall Mafia consists of three phases. 1. SLEEP → 2. DISCUSSION → 3. VOTE.</p>
                <p className="play-block-body">If the games go too quickly or too many players are getting eliminated each night, the role groups (e.g. if there are 2+ <span className="text-tmm-green">Angels</span>, 2+ <span className="text-tmm-red">Mafia</span>, 2+ <span className="text-tmm-blue">Detectives</span>) each type of role (<span className="text-tmm-red">KILL</span>, <span className="text-tmm-blue">GUESS</span>, <span className="text-tmm-green">SAVE</span>, <span className="text-tmm-yellow">WILD</span>) must decide one player to do their action on.</p>
              </div>

              <div className="play-card">
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

              <div className="play-card">
                <div className="play-card-header">
                  <span className="play-block-title">PHASE 2.</span>
                  <span className="play-block-subtitle">DISCUSSION</span>
                </div>
                <p className="play-block-body">All players open their eyes and begin arguing, accusing, or defending themselves based on what they believe has happened during the Sleep Phase.</p>
                <p className="play-block-body">The <span className="text-tmm-cream">Marshall</span> should set a timer (Recommended 3 minutes) for this phase, they can also stop the discussions at a natural moment to keep the phase concise and intense.</p>
                <p className="play-block-body">Players are free to speculate, but players must not reveal their card (if a player is caught showing their card to another player, they are instantly eliminated).</p>
              </div>

              <div className="play-card">
                <div className="play-card-header">
                  <span className="play-block-title">PHASE 3.</span>
                  <span className="play-block-subtitle">VOTE</span>
                </div>
                <p className="play-block-body">After the discussion, players proceed straight to the voting. Each <span className="text-tmm-cream">Villager</span> role votes to eliminate someone they suspect is <span className="text-tmm-red">Mafia</span>, while the <span className="text-tmm-red">Mafia</span> aim to deceive <span className="text-tmm-cream">Villagers</span> into voting out their own.</p>
                <p className="play-block-body">Each player is allowed to make a single vote, on anyone they choose. When a player casts a vote for another player — the player who has been voted for must hold up a finger for each vote received.</p>
                <p className="play-block-body">If the vote ties, a re-vote occurs between the tied players (depending on chosen <span className="text-muted">Rule Cards*</span>). The player with the most votes is immediately eliminated from the game, and their character is revealed (also depending on chosen <span className="text-muted">Rule Cards*</span>).</p>
              </div>

              <div className="play-card">
                <div className="play-card-header">
                  <span className="play-block-title">ROUNDS</span>
                  <span className="play-block-subtitle">REPEAT</span>
                </div>
                <p className="play-block-body">The game continues through the Sleep, Discussion, and Vote phases until one of the following conditions is achieved:</p>
                <p className="play-block-body">a. <span className="text-tmm-cream">Villagers</span> win by successfully voting out all <span className="text-tmm-red">Mafia</span> members.</p>
                <p className="play-block-body">b. <span className="text-tmm-red">Mafia</span> wins by eliminating enough <span className="text-tmm-cream">Villagers</span> to outnumber them.</p>
                <p className="play-block-body">c. <span className="text-tmm-yellow">Wild</span> role wins by fulfilling the unique conditions tied to their abilities.</p>
              </div>

              <div className="play-card">
                <div className="play-card-header">
                  <span className="play-block-title">Links</span>
                  <span className="play-block-subtitle">SNEAK PEAKS!</span>
                </div>
                <p className="play-block-body">Collect → <a href="https://linktr.ee/themarshallmafia" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">linktr.ee/themarshallmafia</a></p>
                <p className="play-block-body">Music → <a href="https://linktr.ee/themarshallmafia.music" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">linktr.ee/themarshallmafia.music</a></p>
                <p className="play-block-body">Developer → <a href="https://linktr.ee/marshallwi11" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">linktr.ee/marshallwi11</a></p>
              </div>

              <div className="play-card">
                <div className="play-card-header">
                  <span className="play-block-title">by marshallwi11</span>
                  <span className="play-block-subtitle">est. 2025</span>
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
          <div className="modal-scroll-bare animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-[650px] mx-auto space-y-[40px] py-[80px] px-6">
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
      )}

      {/* ==================== MUSIC MODAL ==================== */}
      {activeModal === "music" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-backdrop" />
          <div className="modal-scroll-bare animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-[500px] mx-auto px-6 py-[80px] space-y-[40px]">

              <h2 className="text-[22px] text-center">Play the Full Experience</h2>

              {/* Platform Icons — proper brand SVGs */}
              <div className="play-card flex items-center justify-center gap-6 !py-8">

                {/* Spotify */}
                <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Spotify">
                  <div className="w-14 h-14 rounded-2xl bg-[#1DB954] flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  </div>
                </a>

                {/* Apple Music */}
                <a href="https://music.apple.com" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Apple Music">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#fc5c7d] to-[#6a3093] flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.726-.53c-.444-.062-.89-.096-1.335-.12-.07-.004-.28-.067-.338.013H8.812c-.08-.08-.303-.01-.36-.013-.５ .023-.954.056-1.404.12A4.94 4.94 0 0 0 5.32.88C4.207 1.615 3.462 2.61 3.147 3.912a9.05 9.05 0 0 0-.242 2.19C2.876 6.507 2.87 6.91 2.87 7.314v9.372c0 .404.006.808.035 1.212.061.749.232 1.51.61 2.176.67 1.18 1.71 1.88 3.03 2.102.54.092 1.089.13 1.636.145.35.01.7.01 1.05.01H15.7c.35 0 .7 0 1.05-.01.547-.015 1.096-.053 1.636-.145 1.32-.222 2.36-.923 3.03-2.102.378-.666.549-1.427.61-2.176.03-.404.035-.808.035-1.212V7.314c0-.404-.006-.807-.067-1.19zM12 17.5c-3.038 0-5.5-2.463-5.5-5.5s2.462-5.5 5.5-5.5 5.5 2.463 5.5 5.5-2.462 5.5-5.5 5.5zm5.75-9.978a1.286 1.286 0 1 1 0-2.572 1.286 1.286 0 0 1 0 2.572zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>
                  </div>
                </a>

                {/* Tidal */}
                <a href="https://tidal.com" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Tidal">
                  <div className="w-14 h-14 rounded-2xl bg-black border border-white/20 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004 4.004-4.004 4.004 4.004 4.004-4.004zM8.008 12l-4.004 4.004L8.008 20l4.004-4.004zm7.996 0l-4.004 4.004 4.004 4.004L20 16.004z"/></svg>
                  </div>
                </a>

                {/* Amazon Music */}
                <a href="https://music.amazon.com" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="Amazon Music">
                  <div className="w-14 h-14 rounded-2xl bg-[#232F3E] flex items-center justify-center">
                    <svg width="28" height="20" viewBox="0 0 103 31" fill="white"><path d="M58.545 24.177c-5.515 4.068-13.51 6.237-20.4 6.237-9.648 0-18.337-3.566-24.91-9.497-.516-.467-.054-1.103.565-.74 7.09 4.123 15.855 6.603 24.905 6.603 6.105 0 12.816-1.265 18.993-3.882.932-.396 1.712.613.847 1.279z"/><path d="M60.826 21.564c-.703-.902-4.656-.426-6.432-.215-.54.066-.622-.404-.136-.742 3.15-2.214 8.313-1.575 8.916-.833.603.746-.157 5.922-3.118 8.393-.454.381-.888.178-.686-.327.666-1.661 2.159-5.374 1.456-6.276z"/><path d="M54.684 3.442V1.209A.37.37 0 0 1 55.054.84h9.865a.37.37 0 0 1 .373.373v1.906c-.004.212-.18.49-.494.928l-5.112 7.298c1.9-.047 3.908.238 5.632 1.209.388.218.494.538.523.852v2.384c0 .319-.351.692-.72.499-3.008-1.578-7.005-1.749-10.333.017-.34.183-.695-.187-.695-.506V12.48c0-.354.005-.959.363-1.497l5.922-8.494h-5.154a.37.37 0 0 1-.374-.373v-.674zM19.78 16.31H17.41a.376.376 0 0 1-.356-.337V1.243c0-.204.17-.366.38-.366h2.211c.207.008.373.174.38.38v1.948h.044C20.612 1.48 21.727.84 23.23.84c1.524 0 2.477.641 3.162 2.365.641-1.724 2.097-2.365 3.532-2.365.071 0 4.244-.034 4.244 5.582V15.958c0 .204-.17.366-.38.366h-2.365a.374.374 0 0 1-.357-.366V7.185c0-1.817-.159-4.826-1.97-4.826-1.682 0-2.097 1.817-2.097 4.826v8.773a.374.374 0 0 1-.357.366H25.28a.374.374 0 0 1-.357-.366V7.185c0-1.817-.158-4.826-1.97-4.826-1.681 0-2.096 1.817-2.096 4.826v8.773a.376.376 0 0 1-.38.366h-.697zM71.967.84c4.597 0 7.088 3.948 7.088 8.969 0 4.853-2.75 8.7-7.088 8.7-4.512 0-6.973-3.948-6.973-8.87C64.994 4.721 67.484.84 71.967.84zm.026 3.215c-2.282 0-2.423 3.108-2.423 5.045s-.026 6.074 2.397 6.074c2.394 0 2.509-3.343 2.509-5.382 0-1.343-.054-2.951-.497-4.225-.381-1.107-1.139-1.512-1.986-1.512zm13.028 12.255H82.65a.374.374 0 0 1-.357-.366l-.006-14.73c.017-.195.184-.35.38-.35h2.203c.179.009.327.134.363.3v2.253h.044c.738-1.918 1.772-2.837 3.593-2.837 1.184 0 2.336.427 3.075 1.598.686 1.073.686 2.876.686 4.174V15.959a.38.38 0 0 1-.38.351h-2.374a.376.376 0 0 1-.35-.351V7.487c0-1.784-.207-4.39-2.052-4.39-.8 0-1.531.538-1.897 1.343-.464 1.011-.527 2.019-.527 3.047v8.522a.382.382 0 0 1-.38.351h-.177zM47.24 9.208v-.607c-2.403 0-4.942.514-4.942 3.329 0 1.428.741 2.396 2.011 2.396.931 0 1.765-.574 2.291-1.508.647-1.151.64-2.232.64-3.61zm3.258 7.877a.677.677 0 0 1-.765.077c-1.074-.893-1.268-1.308-1.857-2.161-1.776 1.813-3.034 2.354-5.338 2.354-2.726 0-4.843-1.682-4.843-5.045 0-2.628 1.424-4.415 3.451-5.29 1.757-.773 4.21-.911 6.085-1.124v-.42c0-.776.06-1.693-.396-2.364-.397-.601-1.157-.852-1.83-.852-1.243 0-2.353.638-2.625 1.96-.056.294-.272.584-.568.599l-3.178-.344c-.268-.06-.564-.274-.488-.682C39.19 1.243 42.569 0 45.595 0c1.549 0 3.573.413 4.793 1.587 1.549 1.445 1.401 3.37 1.401 5.467v4.951c0 1.489.617 2.142 1.198 2.946.203.285.248.628-.012.842-.651.544-1.807 1.553-2.443 2.119l-.034-.827zM8.59 9.208v-.607c-2.403 0-4.942.514-4.942 3.329 0 1.428.741 2.396 2.011 2.396.931 0 1.765-.574 2.291-1.508.647-1.151.64-2.232.64-3.61zm3.258 7.877a.677.677 0 0 1-.765.077c-1.074-.893-1.268-1.308-1.857-2.161-1.776 1.813-3.034 2.354-5.338 2.354C1.162 17.355 0 15.673 0 12.31c0-2.628 1.424-4.415 3.451-5.29 1.757-.773 4.21-.911 6.085-1.124v-.42c0-.776.06-1.693-.396-2.364C8.743 2.511 7.983 2.26 7.31 2.26c-1.243 0-2.353.638-2.625 1.96-.056.294-.272.584-.568.599L.94 4.475c-.268-.06-.564-.274-.488-.682C1.541 1.243 4.92 0 7.945 0c1.549 0 3.573.413 4.793 1.587 1.549 1.445 1.401 3.37 1.401 5.467v4.951c0 1.489.617 2.142 1.198 2.946.203.285.248.628-.012.842-.651.544-1.807 1.553-2.443 2.119l-.034-.827z"/></svg>
                  </div>
                </a>

                {/* YouTube */}
                <a href="https://www.youtube.com/watch?v=rDAGxCTx-28" target="_blank" rel="noopener noreferrer" className="music-icon-wrapper" aria-label="YouTube">
                  <div className="w-14 h-14 rounded-2xl bg-[#FF0000] flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </div>
                </a>

              </div>

              <div className="play-card text-center !py-8 space-y-2">
                <p className="text-[16px] text-white/80">The Marshall Mafia</p>
                <p className="text-[13px] text-white/35">Official Soundtrack — Coming Soon</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==================== COLLECT MODAL ==================== */}
      {activeModal === "collect" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-backdrop" />
          <div className="modal-scroll-bare animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-[650px] mx-auto space-y-[40px] py-[80px] px-6">

              <div className="glass-block">
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

              <div className="glass-block space-y-5">
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

              <div className="glass-block space-y-5">
                <span className="play-block-title text-[18px]">Contact</span>
                <input type="email" placeholder="Email address" className="collect-input" />
                <input type="tel" placeholder="Phone number (optional)" className="collect-input" />
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-white" defaultChecked />
                  <span className="text-[13px] text-white/50">Email me with new releases and sneaky extra content</span>
                </label>
              </div>

              <div className="glass-block space-y-5">
                <span className="play-block-title text-[18px]">Delivery</span>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="First name" className="collect-input" />
                  <input type="text" placeholder="Last name" className="collect-input" />
                </div>
                <input type="text" placeholder="Address" className="collect-input" />
                <input type="text" placeholder="Postcode" className="collect-input" />
              </div>

              <div className="glass-block space-y-5">
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

              <div className="glass-block space-y-5">
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
