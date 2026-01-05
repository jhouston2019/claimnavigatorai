/**
 * Claim Navigator API Keys & Usage Module
 * Manages API keys, usage tracking, and quotas
 */

const API_KEYS_KEY = "cn_api_keys";
const API_USAGE_KEY = "cn_api_usage";

function getApiKeys() {
  return JSON.parse(localStorage.getItem(API_KEYS_KEY) || "[]");
}

function saveApiKeys(keys) {
  localStorage.setItem(API_KEYS_KEY, JSON.stringify(keys));
}

function createApiKey(label, plan = "dev") {
  const keys = getApiKeys();
  const key = "cnk_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  keys.push({
    label,
    key,
    plan,
    createdAt: Date.now(),
    active: true
  });
  saveApiKeys(keys);
  return key;
}

function revokeApiKey(key) {
  const keys = getApiKeys();
  const index = keys.findIndex(k => k.key === key);
  if (index !== -1) {
    keys[index].active = false;
    saveApiKeys(keys);
    return true;
  }
  return false;
}

function getApiUsage() {
  return JSON.parse(localStorage.getItem(API_USAGE_KEY) || "{}");
}

function saveApiUsage(usage) {
  localStorage.setItem(API_USAGE_KEY, JSON.stringify(usage));
}

function recordApiCall(apiName, plan = "dev") {
  const usage = getApiUsage();
  const today = new Date().toISOString().split('T')[0];
  
  if (!usage[apiName]) {
    usage[apiName] = {
      count: 0,
      lastCall: null,
      plan,
      daily: {}
    };
  }
  
  usage[apiName].count += 1;
  usage[apiName].lastCall = Date.now();
  usage[apiName].plan = plan;
  
  if (!usage[apiName].daily[today]) {
    usage[apiName].daily[today] = 0;
  }
  usage[apiName].daily[today] += 1;
  
  saveApiUsage(usage);
  
  // Log to analytics if available
  if (window.CNAnalytics) {
    CNAnalytics.log("api_call", { apiName, plan });
  }
}

function getUsageForPeriod(apiName, days = 30) {
  const usage = getApiUsage();
  if (!usage[apiName] || !usage[apiName].daily) {
    return 0;
  }
  
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  let total = 0;
  Object.entries(usage[apiName].daily).forEach(([date, count]) => {
    if (new Date(date) >= cutoff) {
      total += count;
    }
  });
  
  return total;
}

window.CNApi = {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getApiUsage,
  recordApiCall,
  getUsageForPeriod
};

