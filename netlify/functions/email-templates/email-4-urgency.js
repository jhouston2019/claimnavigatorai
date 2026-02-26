/**
 * Email 4: Urgency (Day 6)
 * Analysis expires in 48 hours
 */

function generateEmail4(data) {
  const { email } = data;
  
  const subject = "Your Policy Analysis Expires in 48 Hours";
  
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#0B2545 0%,#123A63 100%);color:white;padding:30px 20px;text-align:center}.content{background:white;padding:30px 20px}.cta-button{display:inline-block;background:#17BEBB;color:white;padding:15px 30px;text-decoration:none;border-radius:6px;font-weight:600;margin:20px 0}.footer{background:#f9fafb;padding:20px;text-align:center;font-size:14px;color:#6b7280}</style></head>
<body>
  <div class="container">
    <div class="header"><h1 style="margin:0">⏰ Your Analysis Will Be Archived</h1><p style="margin:10px 0 0 0;opacity:0.9">48 Hours Remaining</p></div>
    <div class="content">
      <p>Hi,</p>
      <p><strong>Your free policy analysis will be archived in 48 hours.</strong></p>
      <p>After that, you'll need to:</p>
      <ul>
        <li>Re-upload your policy</li>
        <li>Wait for new analysis</li>
        <li>Risk losing your current findings</li>
      </ul>
      <div style="background:#fee2e2;border-left:4px solid #ef4444;padding:20px;margin:20px 0;border-radius:4px">
        <p style="margin:0;color:#991b1b"><strong>⚠️ Don't lose your coverage gap analysis</strong></p>
        <p style="margin:10px 0 0 0;color:#7f1d1d">Lock in your Premium Policy Intelligence now and keep your analysis forever.</p>
      </div>
      <p><strong>What you get with Premium:</strong></p>
      <div style="background:#f0fdfa;padding:20px;border-radius:8px;margin:20px 0">
        <p style="margin:0 0 10px 0"><strong>✓ 30+ field extraction</strong><br><span style="color:#6b7280">Dwelling, contents, ALE, deductibles, sublimits, endorsements</span></p>
        <p style="margin:10px 0"><strong>✓ Policy trigger analysis (10 types)</strong><br><span style="color:#6b7280">Ordinance, matching, depreciation, sublimits, coinsurance, and more</span></p>
        <p style="margin:10px 0"><strong>✓ Coinsurance validation</strong><br><span style="color:#6b7280">Prevents commercial property penalties</span></p>
        <p style="margin:10px 0"><strong>✓ Cross-reference with estimates</strong><br><span style="color:#6b7280">Identifies carrier tactics and underpayment</span></p>
        <p style="margin:10px 0 0 0"><strong>✓ Unlimited re-analysis</strong><br><span style="color:#6b7280">Analyze your policy as many times as needed</span></p>
      </div>
      <div style="text-align:center"><a href="https://claimcommandpro.com/app/pricing.html" class="cta-button">Upgrade Now - $197/year</a></div>
      <p style="margin-top:30px;font-size:14px;color:#6b7280;text-align:center"><strong>Questions?</strong> Reply to this email and we'll help.</p>
      <p style="font-size:12px;color:#ef4444;text-align:center;margin-top:20px"><strong>P.S.</strong> This is your last reminder. After 48 hours, your analysis will be permanently archived.</p>
    </div>
    <div class="footer"><p>Claim Command Pro<br>Professional Insurance Claim Management</p><p style="font-size:12px;margin-top:20px"><a href="https://claimcommandpro.com/unsubscribe?email=${encodeURIComponent(email)}" style="color:#6b7280">Unsubscribe</a></p></div>
  </div>
</body>
</html>`;
  
  const text = `Your Policy Analysis Expires in 48 Hours\n\nYour free analysis will be archived in 48 hours.\n\nLock in Premium Policy Intelligence:\n✓ 30+ field extraction\n✓ Policy trigger analysis (10 types)\n✓ Coinsurance validation\n✓ Unlimited re-analysis\n\nUpgrade: https://claimcommandpro.com/app/pricing.html\n\nP.S. This is your last reminder.`;
  
  return { subject, html, text };
}

module.exports = { generateEmail4 };
