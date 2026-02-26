/**
 * Email 3: Case Study (Day 4)
 * Real claim reduced by $38,000 (preventable)
 */

function generateEmail3(data) {
  const { email } = data;
  
  const subject = "Real Claim Reduced by $38,000 (Preventable)";
  
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#0B2545 0%,#123A63 100%);color:white;padding:30px 20px;text-align:center}.content{background:white;padding:30px 20px}.cta-button{display:inline-block;background:#17BEBB;color:white;padding:15px 30px;text-decoration:none;border-radius:6px;font-weight:600;margin:20px 0}.footer{background:#f9fafb;padding:20px;text-align:center;font-size:14px;color:#6b7280}</style></head>
<body>
  <div class="container">
    <div class="header"><h1 style="margin:0">$38,000 Left on the Table</h1><p style="margin:10px 0 0 0;opacity:0.9">A Preventable Underpayment</p></div>
    <div class="content">
      <p>Hi,</p>
      <p><strong>Last month, a homeowner filed a $125,000 claim.</strong></p>
      <p>The carrier offered $87,000.</p>
      <p style="font-size:24px;color:#ef4444;font-weight:700;margin:20px 0">Total underpayment: $38,000</p>
      <p><strong>Why? Three coverage gaps they didn't know about:</strong></p>
      <div style="background:#fee2e2;border-left:4px solid #ef4444;padding:20px;margin:20px 0;border-radius:4px">
        <ol style="margin:0;padding-left:20px">
          <li><strong>Missing Ordinance & Law coverage</strong> — $22,000 in code upgrades denied</li>
          <li><strong>No matching endorsement</strong> — $11,000 for matching materials denied</li>
          <li><strong>Water damage sublimit</strong> — $5,000 cap they didn't know existed</li>
        </ol>
      </div>
      <p><strong>All three gaps were preventable with proper policy intelligence.</strong></p>
      <p>Your free analysis identified similar structural gaps.</p>
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:20px;margin:20px 0;border-radius:4px">
        <p style="margin:0;color:#92400e"><strong>Don't let this happen to you.</strong></p>
        <p style="margin:10px 0 0 0;color:#78350f">Our Premium Policy Intelligence Engine would have caught all three gaps before the claim was filed.</p>
      </div>
      <p><strong>What Premium includes:</strong></p>
      <ul>
        <li>30+ field extraction (dwelling, contents, ALE, deductibles, sublimits)</li>
        <li>Form-aware detection (automatically identifies HO, DP, CP, BOP policies)</li>
        <li>10 policy trigger types (ordinance, matching, depreciation, sublimits, etc.)</li>
        <li>Coinsurance validation (prevents commercial property penalties)</li>
        <li>Cross-reference with estimates (identifies carrier tactics)</li>
        <li>Unlimited policy reviews (analyze as many times as needed)</li>
      </ul>
      <div style="text-align:center"><a href="https://claimcommandpro.com/app/pricing.html" class="cta-button">Get Full Policy Intelligence - $197/year</a></div>
      <p style="margin-top:30px;font-size:14px;color:#6b7280;font-style:italic">Investment: $197/year. Average recovery increase: $12,000-$47,000. ROI: 60x-240x</p>
    </div>
    <div class="footer"><p>Claim Command Pro<br>Professional Insurance Claim Management</p><p style="font-size:12px;margin-top:20px"><a href="https://claimcommandpro.com/unsubscribe?email=${encodeURIComponent(email)}" style="color:#6b7280">Unsubscribe</a></p></div>
  </div>
</body>
</html>`;
  
  const text = `Real Claim Reduced by $38,000 (Preventable)\n\nLast month, a homeowner filed a $125,000 claim.\nThe carrier offered $87,000.\nTotal underpayment: $38,000\n\nWhy? Three coverage gaps:\n1. Missing Ordinance & Law coverage — $22,000\n2. No matching endorsement — $11,000\n3. Water damage sublimit — $5,000\n\nAll preventable with proper policy intelligence.\n\nUpgrade: https://claimcommandpro.com/app/pricing.html`;
  
  return { subject, html, text };
}

module.exports = { generateEmail3 };
