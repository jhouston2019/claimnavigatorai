import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, name?: string) {
  try {
    await resend.emails.send({
      from: 'Claim Command Pro <noreply@claimcommandpro.com>',
      to: email,
      subject: 'Welcome to Claim Command Pro',
      html: `
        <h1>Welcome to Claim Command Pro!</h1>
        <p>Hi ${name || 'there'},</p>
        <p>Thank you for joining Claim Command Pro. We're here to help you get the full settlement you deserve.</p>
        <p>Your free policy analysis is ready. Log in to access your dashboard and explore our tools.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Go to Dashboard</a></p>
        <p>Best regards,<br>The Claim Command Pro Team</p>
      `,
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}

export async function sendPolicyAnalysisEmail(email: string, analysisId: string) {
  try {
    await resend.emails.send({
      from: 'Claim Command Pro <noreply@claimcommandpro.com>',
      to: email,
      subject: 'Your Policy Analysis is Ready',
      html: `
        <h1>Your Policy Analysis is Complete</h1>
        <p>We've analyzed your insurance policy and identified key coverage requirements and potential dispute risks.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/policy-analysis/results?id=${analysisId}">View Your Results</a></p>
        <p>Want to take the next step? Upgrade to Claim Command Pro for:</p>
        <ul>
          <li>Full claim gap report</li>
          <li>Documentation packet builder</li>
          <li>AI strategy advisor</li>
          <li>Unlimited analyses</li>
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing">Upgrade Now - $299</a></p>
      `,
    })
  } catch (error) {
    console.error('Failed to send policy analysis email:', error)
  }
}

export async function sendPurchaseConfirmationEmail(email: string, name?: string) {
  try {
    await resend.emails.send({
      from: 'Claim Command Pro <noreply@claimcommandpro.com>',
      to: email,
      subject: 'Welcome to Claim Command Pro!',
      html: `
        <h1>Thank You for Your Purchase!</h1>
        <p>Hi ${name || 'there'},</p>
        <p>Your payment was successful. You now have full access to all Claim Command Pro features:</p>
        <ul>
          <li>✓ Underpayment Detector</li>
          <li>✓ Estimate Analyzer</li>
          <li>✓ Documentation Packet Builder</li>
          <li>✓ AI Strategy Advisor</li>
          <li>✓ Claim Dashboard</li>
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Access Your Dashboard</a></p>
        <p>Need help? Reply to this email or visit our support center.</p>
        <p>Best regards,<br>The Claim Command Pro Team</p>
      `,
    })
  } catch (error) {
    console.error('Failed to send purchase confirmation:', error)
  }
}
