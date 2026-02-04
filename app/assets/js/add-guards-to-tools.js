/**
 * GUARD INJECTION SNIPPET
 * 
 * This snippet should be added to the <head> of all protected tool pages
 * Add immediately after opening <head> tag, before any other scripts
 */

const GUARD_SNIPPET = `
  <!-- CRITICAL: Access guard must load first -->
  <script src="/app/assets/js/supabase-client.js"></script>
  <script src="/app/assets/js/auth.js" type="module"></script>
  <script src="/app/assets/js/access-guard.js"></script>
`;

/**
 * Protected pages that require access guards:
 * - All resource-center tools
 * - All claim-analysis-tools
 * - All document generators
 * - Financial summary
 * - Step-by-step guide
 * - Claim control center
 * - CN Agent
 * - Evidence organizer
 * - Letter generator
 * - Negotiation tools
 * - ROM tools
 * - Settlement pages
 * - Timeline pages
 * - Trackers
 */

console.log('Guard snippet for manual addition to protected pages:');
console.log(GUARD_SNIPPET);



