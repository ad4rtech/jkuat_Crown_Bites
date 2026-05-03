import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const orderId = url.searchParams.get('orderId')
    const tableId = url.searchParams.get('tableId')

    const body = await req.json()
    console.log("M-Pesa Callback received:", JSON.stringify(body))

    const callback = body.Body.stkCallback

    // Safaricom expects a success response regardless of the actual payment result
    const successResponse = new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

    if (callback.ResultCode === 0) {
      console.log(`Payment successful callback received. CheckoutRequestID: ${callback.CheckoutRequestID}`)

      // Initialize Supabase admin client to bypass RLS
      const supabaseUrl = 'https://phovguaxtfuvtzdpobqj.supabase.co'
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (!supabaseUrl || !supabaseServiceKey) {
        return new Response("DEBUG: Missing SUPABASE_SERVICE_ROLE_KEY", { status: 200 })
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Extract transaction details
      const items = callback.CallbackMetadata.Item
      const amount = items.find((i: any) => i.Name === "Amount")?.Value
      const receiptNo = items.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value
      const phone = items.find((i: any) => i.Name === "PhoneNumber")?.Value

      // Try to find the order ID if Safaricom stripped it from the query parameters
      let targetOrderId = orderId
      let targetTableId = tableId

      if (!targetOrderId) {
        // Query the database using the checkout_request_id
        const { data: orderData, error: lookupError } = await supabase
          .from('orders')
          .select('id, table_id')
          .eq('checkout_request_id', callback.CheckoutRequestID)
          .single()

        if (orderData) {
          targetOrderId = orderData.id
          targetTableId = orderData.table_id
        } else {
          return new Response(`DEBUG: Could not find order for CheckoutRequestID: ${callback.CheckoutRequestID} Error: ${JSON.stringify(lookupError)}`, { status: 200 })
        }
      }

      if (targetOrderId) {
        // 1. Update order status
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_method: 'M-Pesa',
            mpesa_receipt: receiptNo
          })
          .eq('id', targetOrderId)

        if (orderError) {
          return new Response(`DEBUG: Error updating order: ${JSON.stringify(orderError)}`, { status: 200 })
        }

        // 2. Free up the table
        if (targetTableId) {
          const { error: tableError } = await supabase
            .from('tables')
            .update({ status: 'available' })
            .eq('id', targetTableId)

          if (tableError) console.error("Error freeing table:", tableError)
        }
      }
    } else {
      console.log(`Payment failed or cancelled: ${callback.ResultDesc}`)
      // Extract CheckoutRequestID even if failed
      const checkoutRequestID = callback.CheckoutRequestID || body?.Body?.stkCallback?.CheckoutRequestID

      if (checkoutRequestID) {
        // Initialize Supabase admin client to bypass RLS
        const supabaseUrl = 'https://phovguaxtfuvtzdpobqj.supabase.co'
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          await supabase
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('checkout_request_id', checkoutRequestID)
        }
      }
    }

    return successResponse

  } catch (error) {
    console.error("Error in callback:", error)
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Error processing callback" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
