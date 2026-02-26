/**
 * Email 1: Immediate Results (Within 5 minutes)
 * Triggered: Immediately after free policy analysis
 */

function generateEmail1(data) {
  const { email, name, riskCategory, gaps, analysisUrl } = data;
  
  const subject = `Your Policy Analysis Results - ${riskCategory} Risk Detected`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0B2545 0%, #123A63 100%); color: white; padding: 30px 20px; text-align: center; }
    .content { background: white; padding: 30px 20px; }
    .risk-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .risk-box.moderate { background: #fef3c7; border-color: #f59e0b; }
    .risk-box.significant { background: #fed7aa; border-color: #ea580c; }
    .gap-item { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 3px solid #17BEBB; }
    .cta-button { display: inline-block; background: #17BEBB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Your Policy Analysis is Ready</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Claim Command Pro</p>
    </div>
    
    <div class="content">
      <p>Hi${name ? ` ${name}` : ''},</p>
      
      <p>We've completed your free policy analysis and identified <strong>${gaps.length} coverage gap${gaps.length !== 1 ? 's' : ''}</strong> that could impact your claim.</p>
      
      <div class="risk-box ${riskCategory.toLowerCase()}">
        <h3 style="margin-top: 0; color: #991b1b;">⚠️ Risk Level: ${riskCategory.toUpperCase()}</h3>
        <p style="margin-bottom: 0;">Policies with similar structural gaps often result in substantial claim underpayment.</p>
      </div>
      
      <h3>Key Findings:</h3>
      ${gaps.slice(0, 3).map(gap => `
        <div class="gap-item">
          <strong>${gap.name}</strong><br>
          <span style="color: #6b7280;">${gap.impact}</span>
        </div>
      `).join('')}
      
      ${gaps.length > 3 ? `<p style="color: #6b7280; font-style: italic;">+ ${gaps.length - 3} more gap${gaps.length - 3 !== 1 ? 's' : ''} identified</p>` : ''}
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <h4 style="margin-top: 0; color: #92400e;">⚠️ Critical: Structural Validation Required</h4>
        <p style="color: #78350f; margin-bottom: 0;">
          Without detailed policy intelligence, carriers routinely reduce payouts by identifying coverage limitations you didn't know existed. Our Premium Policy Intelligence Engine provides the 30+ field extraction and trigger analysis needed to prevent underpayment.
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${analysisUrl || 'https://claimcommandpro.com/app/pricing.html'}" class="cta-button">
          View Full Analysis
        </a>
        <br>
        <a href="https://claimcommandpro.com/app/pricing.html" class="cta-button" style="background: #0B2545;">
          Upgrade to Premium - $197/year
        </a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        <strong>What's included in Premium:</strong><br>
        ✓ 30+ field extraction<br>
        ✓ Policy trigger analysis (10 types)<br>
        ✓ Coinsurance validation<br>
        ✓ Cross-reference with estimates<br>
        ✓ Unlimited policy reviews
      </p>
    </div>
    
    <div class="footer">
      <p>Claim Command Pro<br>
      Professional Insurance Claim Management</p>
      <p style="font-size: 12px; margin-top: 20px;">
        <a href="https://claimcommandpro.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #6b7280;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
  
  const text = `
Your Policy Analysis is Ready

Hi${name ? ` ${name}` : ''},

We've completed your free policy analysis and identified ${gaps.length} coverage gap${gaps.length !== 1 ? 's' : ''} that could impact your claim.

Risk Level: ${riskCategory.toUpperCase()}
Policies with similar structural gaps often result in substantial claim underpayment.

Key Findings:
${gaps.slice(0, 3).map((gap, i) => `${i + 1}. ${gap.name}\n   ${gap.impact}`).join('\n\n')}

${gaps.length > 3 ? `+ ${gaps.length - 3} more gap${gaps.length - 3 !== 1 ? 's' : ''} identified\n` : ''}

⚠️ Critical: Structural Validation Required
Without detailed policy intelligence, carriers routinely reduce payouts by identifying coverage limitations you didn't know existed.

View Full Analysis: ${analysisUrl || 'https://claimcommandpro.com/app/pricing.html'}

Upgrade to Premium: https://claimcommandpro.com/app/pricing.html

What's included in Premium:
✓ 30+ field extraction
✓ Policy trigger analysis (10 types)
✓ Coinsurance validation
✓ Cross-reference with estimates
✓ Unlimited policy reviews

---
Claim Command Pro
Professional Insurance Claim Management

Unsubscribe: https://claimcommandpro.com/unsubscribe?email=${encodeURIComponent(email)}
  `;
  
  return { subject, html, text };
}

module.exports = { generateEmail1 };
