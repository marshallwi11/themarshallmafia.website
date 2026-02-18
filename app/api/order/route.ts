import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, phone, firstName, lastName, address, postcode, giftAmount, total, paymentMethod } = body

    // Google Sheets API via Apps Script Web App
    // The sheet ID: 1msIH4d0AfwF2MmyVnx8DjeSNE12rIiOfFg7AxFNzQkY
    // We use a simple fetch to a Google Apps Script web app endpoint
    // For now, we append to the sheet using the Google Sheets API v4 with API key
    
    const SHEET_ID = "1msIH4d0AfwF2MmyVnx8DjeSNE12rIiOfFg7AxFNzQkY"
    const API_KEY = process.env.GOOGLE_SHEETS_API_KEY

    if (API_KEY) {
      // Use Google Sheets API to append
      const range = "Sheet1!A:J"
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`
      
      const timestamp = new Date().toISOString()
      const values = [[
        timestamp,
        email || "",
        phone || "",
        firstName || "",
        lastName || "",
        address || "",
        postcode || "",
        paymentMethod || "",
        giftAmount ? `£${Number(giftAmount).toFixed(2)}` : "£0.00",
        `£${Number(total).toFixed(2)}`,
      ]]

      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      })
    }

    // For payment processing, we log the order and return success
    // Real payment would integrate Stripe/PayPal SDK here
    return NextResponse.json({ 
      success: true, 
      message: "Order received",
      orderId: `MM-${Date.now().toString(36).toUpperCase()}`
    })
  } catch (error) {
    console.error("Order error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to process order" },
      { status: 500 }
    )
  }
}
