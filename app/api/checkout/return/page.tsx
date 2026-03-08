"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function ReturnContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    if (!sessionId) { setStatus("error"); return }

    fetch(`/api/checkout/status?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "complete") {
          setStatus("success")
          setEmail(data.customer_email)
        } else {
          setStatus("error")
        }
      })
      .catch(() => setStatus("error"))
  }, [searchParams])

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'MarkerBold', sans-serif",
    }}>
      <div style={{
        background: "rgba(52,52,52,0.25)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "50px",
        padding: "clamp(28px,6vw,60px)",
        maxWidth: "560px",
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}>
        {status === "loading" && (
          <>
            <div style={{ width: 40, height: 40, border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Confirming your order…</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ fontSize: 48 }}>🃏</div>
            <h1 style={{ color: "#fff", fontSize: "clamp(20px,4vw,28px)", margin: 0 }}>ORDER CONFIRMED</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "clamp(13px,2.5vw,16px)", lineHeight: 1.6, margin: 0 }}>
              Thanks for ordering <span style={{ color: "#DBAB7F" }}>The Marshall Mafia</span>!
              {email && <> A confirmation has been sent to <span style={{ color: "white" }}>{email}</span>.</>}
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0 }}>
              Your 1st Edition card game will be dispatched within 3–5 working days.
            </p>
            <a href="/" style={{
              marginTop: 8,
              display: "inline-block",
              color: "#DBAB7F",
              fontSize: 14,
              textDecoration: "none",
              letterSpacing: "0.06em",
            }}>← BACK TO THE SITE</a>
          </>
        )}
        {status === "error" && (
          <>
            <h1 style={{ color: "#fff", fontSize: 24, margin: 0 }}>SOMETHING WENT WRONG</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: 0 }}>
              We couldn't confirm your order. Please contact us if payment was taken.
            </p>
            <a href="/" style={{ color: "#DBAB7F", fontSize: 14, textDecoration: "none" }}>← BACK TO THE SITE</a>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function ReturnPage() {
  return (
    <Suspense>
      <ReturnContent />
    </Suspense>
  )
}
