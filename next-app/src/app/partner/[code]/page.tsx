import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function PartnerLandingPage({ params }: { params: { code: string } }) {
  const { data: partner } = await supabaseAdmin
    .from('partners')
    .select('*')
    .eq('referral_code', params.code)
    .single()

  if (!partner) {
    redirect('/')
  }

  // Track referral in cookie
  cookies().set('referral_code', params.code, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  // Redirect to home page
  redirect('/')
}
