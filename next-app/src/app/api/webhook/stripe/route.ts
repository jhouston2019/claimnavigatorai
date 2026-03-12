import { NextRequest, NextResponse } from 'next/server'
import { handleWebhook } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    const event = await handleWebhook(body, signature)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const userId = session.metadata.userId

      // Update user profile
      await supabaseAdmin
        .from('profiles')
        .update({
          is_paid: true,
          stripe_customer_id: session.customer,
          subscription_status: 'active',
        })
        .eq('id', userId)

      // Record payment
      await supabaseAdmin.from('payments').insert({
        user_id: userId,
        stripe_payment_id: session.payment_intent,
        amount: session.amount_total / 100,
        status: 'completed',
      })

      // Track analytics
      await supabaseAdmin.from('analytics_events').insert({
        event_type: 'purchase_completed',
        user_id: userId,
        metadata: { amount: session.amount_total / 100 },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
