import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ["GB"],
      },
      mode: "payment",
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      custom_text: {
        submit: { message: "Your order will be shipped within 3–5 working days." },
      },
    })

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (err) {
    console.error("Stripe session error:", err)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
