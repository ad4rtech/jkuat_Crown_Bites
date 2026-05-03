import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, amount, orderId, tableId } = await req.json()

    if (!phone || !amount) {
      throw new Error('Phone and amount are required.')
    }

    // Format phone: 0712345678 → 254712345678
    let formattedPhone = phone;
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }

    // Credentials from environment variables
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')
    const shortcode = Deno.env.get('MPESA_SHORTCODE') || '174379'
    const passkey = Deno.env.get('MPESA_PASSKEY')
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL') // Ensure this is set to your Supabase Edge Function URL

    if (!consumerKey || !consumerSecret || !passkey) {
      throw new Error('M-Pesa credentials are not fully configured in Edge Function secrets.')
    }

    // 1. Generate OAuth Access Token
    const auth = btoa(`${consumerKey}:${consumerSecret}`)
    const tokenResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    )
    if (!tokenResponse.ok) throw new Error('Failed to fetch M-Pesa token.')
    const { access_token } = await tokenResponse.json()

    // 2. Generate Password & Timestamp
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0') +
      date.getSeconds().toString().padStart(2, '0')

    const password = btoa(`${shortcode}${passkey}${timestamp}`)

    // 3. Send STK Push Request
    const baseUrl = callbackUrl || 'https://phovguaxtfuvtzdpobqj.supabase.co/functions/v1/mpesa-callback';
    const finalCallbackUrl = `${baseUrl}?orderId=${encodeURIComponent(orderId || '')}&tableId=${encodeURIComponent(tableId || '')}`;

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: finalCallbackUrl,
      AccountReference: orderId ? `Order ${orderId.slice(0, 5)}` : "Crown Bites",
      TransactionDesc: `Payment for Table ${tableId || 'Walk-in'}`
    }

    console.log("Sending STK Push:", stkPayload)

    const pushResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stkPayload)
      }
    )

    const data = await pushResponse.json()

    if (pushResponse.ok && data.ResponseCode === "0") {
      // Create a temporary record in our database if needed, or simply let the app wait.
      // The callback function will finalize the transaction.
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      console.error("STK Push failed:", data)
      throw new Error(data.errorMessage || 'STK Push failed.')
    }
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
