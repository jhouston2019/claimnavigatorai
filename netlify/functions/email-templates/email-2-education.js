/**
 * Email 2: Education (Day 2)
 * Why carriers don't volunteer coverage gaps
 */

function generateEmail2(data) {
  const { email, gaps } = data;
  
  const subject = "Why Insurance Companies Don't Volunteer These Gaps";
  
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#0B2545 0%,#123A63 100%);color:white;padding:30px 20px;text-align:center}.content{background:white;padding:30px 20px}.cta-button{display:inline-block;background:#17BEBB;color:white;padding:15px 30px;text-decoration:none;border-radius:6px;font-weight:600;margin:20px 0}.footer{background:#f9fafb;padding:20px;text-align:center;font-size:14px;color:#6b7280}</style></head>
<body>
  <div class="container">
    <div class="header"><h1 style="margin:0">The Coverage Gaps Carriers Won't Tell You About</h1></div>
    <div class="content">
      <p>Hi,</p>
      <p>Yesterday we identified <strong>${gaps.length} coverage gap${gaps.length !== 1 ? 's' : ''}</strong> in your policy.</p>
      <p><strong>Here's what most people don't know:</strong></p>
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:20px;margin:20px 0;border-radius:4px">
        <p style="margin:0"><strong>Insurance companies are NOT required to tell you about:</strong></p>
        <ul style="margin:10px 0 0 20px">
          <li>Missing endorsements that could save you thousands</li>
          <li>Sublimits that cap your recovery</li>
          <li>Settlement type issues (ACV vs RCV)</li>
          <li>Coinsurance penalties on commercial policies</li>
        </ul>
      </div>
      <p>They profit when you don't know what you're entitled to.</p>
      <p><strong>Our Premium Policy Intelligence Engine extracts 30+ fields your carrier won't explain:</strong></p>
      <ul>
        <li>Form-aware detection (HO, DP, CP, BOP policies)</li>
        <li>Policy trigger analysis (10 types)</li>
        <li>Coinsurance validation with penalty calculation</li>
        <li>Cross-reference with estimate discrepancies</li>
        <li>Actionable recommendations with recovery estimates</li>
      </ul>
      <div style="text-align:center"><a href="https://claimcommandpro.com/app/pricing.html" class="cta-button">See What You're Missing</a></div>
      <p style="margin-top:30px;font-size:14px;color:#6b7280"><strong>Real example:</strong> A homeowner discovered their policy had a $10,000 water damage sublimit. Their claim was $15,750. Without knowing this, they would have lost $5,750.</p>
    </div>
    <div class="footer"><p>Claim Command Pro<br>Professional Insurance Claim Management</p><p style="font-size:12px;margin-top:20px"><a href="https://claimcommandpro.com/unsubscribe?email=${encodeURIComponent(email)}" style="color:#6b7280">Unsubscribe</a></p></div>
  </div>
</body>
</html>`;
  
  const text = `Why Insurance Companies Don't Volunteer These Gaps\n\nYesterday we identified ${gaps.length} coverage gaps in your policy.\n\nInsurance companies are NOT required to tell you about:\n- Missing endorsements that could save you thousands\n- Sublimits that cap your recovery\n- Settlement type issues (ACV vs RCV)\n- Coinsurance penalties\n\nThey profit when you don't know what you're entitled to.\n\nUpgrade to Premium: https://claimcommandpro.com/app/pricing.html`;
  
  return { subject, html, text };
}

module.exports = { generateEmail2 };
