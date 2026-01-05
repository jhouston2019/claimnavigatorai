/**
 * Claim Navigator Organization Management Module
 * Handles organization identity, team members, and seat licensing
 */

const ORG_KEY = "cn_org_data";

function getOrg() {
  return JSON.parse(localStorage.getItem(ORG_KEY) || "{}");
}

function saveOrg(data) {
  localStorage.setItem(ORG_KEY, JSON.stringify(data));
}

function createOrg(name) {
  const org = {
    name,
    plan: "enterprise",
    seats: 5,
    usedSeats: 1,
    members: [
      { email: "admin@org.com", role: "admin" }
    ],
    createdAt: Date.now()
  };
  saveOrg(org);
  return org;
}

function addMember(email, role = "member") {
  const org = getOrg();
  if (!org.members) {
    org.members = [];
  }
  
  // Check if member already exists
  if (org.members.some(m => m.email === email)) {
    return false; // Member already exists
  }
  
  // Check seat limits
  if (org.usedSeats >= org.seats) {
    return false; // Max seats reached
  }
  
  org.members.push({ email, role, addedAt: Date.now() });
  org.usedSeats = org.members.length;
  saveOrg(org);
  return true;
}

function removeMember(email) {
  const org = getOrg();
  if (!org.members) {
    return false;
  }
  
  org.members = org.members.filter(m => m.email !== email);
  org.usedSeats = org.members.length;
  saveOrg(org);
  return true;
}

function updateSeats(count) {
  const org = getOrg();
  org.seats = count;
  saveOrg(org);
  return org;
}

function getOrgClaims() {
  return JSON.parse(localStorage.getItem("cn_org_claims") || "[]");
}

function saveOrgClaims(claims) {
  localStorage.setItem("cn_org_claims", JSON.stringify(claims));
}

function addOrgClaim(claim) {
  const claims = getOrgClaims();
  claims.push({
    ...claim,
    id: Date.now().toString(),
    createdAt: Date.now()
  });
  saveOrgClaims(claims);
  return claims;
}

window.CNOrg = {
  getOrg,
  saveOrg,
  createOrg,
  addMember,
  removeMember,
  updateSeats,
  getOrgClaims,
  saveOrgClaims,
  addOrgClaim
};

