import { NextRequest, NextResponse } from 'next/server'
import { handleWebhook } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendPurchaseConfirmationEmail } from '@/lib/email'

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
        metadata: { 
          amount: session.amount_total / 100,
          source: session.metadata.source || 'unknown',
        },
      })

      // Check if this was a conversion from estimate scan
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      if (profile) {
        // Check for recent scans from this email
        const { data: recentScans } = await supabaseAdmin
          .from('estimate_scans')
          .select('id')
          .eq('email', profile.email)
          .eq('converted_to_paid', false)
          .order('created_at', { ascending: false })
          .limit(1)

        if (recentScans && recentScans.length > 0) {
          const scanId = recentScans[0].id

          // Mark scan as converted
          await supabaseAdmin
            .from('estimate_scans')
            .update({ converted_to_paid: true })
            .eq('id', scanId)

          // Record conversion
          await supabaseAdmin.from('scan_conversions').insert({
            scan_id: scanId,
            user_id: userId,
          })

          // Track conversion analytics
          await supabaseAdmin.from('analytics_events').insert({
            event_type: 'scan_to_paid_conversion',
            user_id: userId,
            metadata: { scan_id: scanId },
          })
        }

        // Send confirmation email
        await sendPurchaseConfirmationEmail(profile.email)
      }
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
