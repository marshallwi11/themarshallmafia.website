"use client"

import type React from "react"

import Link from "next/link"

interface ButtonProps {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  variant?: "primary" | "secondary"
  className?: string
}

export function Button({ href, onClick, children, variant = "primary", className = "" }: ButtonProps) {
  const baseStyles = "inline-block px-12 py-4 font-display text-lg tracking-wider transition-all duration-200"
  const variantStyles = {
    primary: "bg-white text-black hover:bg-white/90",
    secondary: "border-2 border-white text-white hover:bg-white hover:text-black",
  }

  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${className}`

  if (href) {
    return (
      <Link href={href} className={combinedStyles}>
        {children}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={combinedStyles}>
      {children}
    </button>
  )
}
