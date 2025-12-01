/**
 * k6 Load Test Script: History Query Endpoint (Burst Test)
 * 
 * Usage:
 *   k6 run --env API_BASE_URL=https://your-site.netlify.app/.netlify/functions/api --env API_KEY=your_key history-query-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const historyQueryDuration = new Trend('history_query_duration');
const historyQuerySuccess = new Counter('history_query_success');
const historyQueryFailure = new Counter('history_query_failure');

// Configuration - Burst test for read-heavy endpoint
export const options = {
  stages: [
    { duration: '10s', target: 1000 },  // Rapid ramp up
    { duration: '1m', target: 5000 },   // Burst to 5000 RPS
    { duration: '30s', target: 0 },     // Rapid ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // Should be fast
    'errors': ['rate<0.01'],
    'history_query_duration': ['p(95)<1000'],
  },
};

const API_BASE_URL = __ENV.API_BASE_URL || 'https://your-site.netlify.app/.netlify/functions/api';
const API_KEY = __ENV.API_KEY || '';

// Test data - vary query parameters
const carriers = ['State Farm', 'Allstate', 'Farmers', 'USAA', 'Progressive', null];
const states = ['CA', 'TX', 'FL', 'NY', 'IL', null];
const claimTypes = ['Property', 'Auto', 'Business', null];

export default function () {
  const carrier = carriers[Math.floor(Math.random() * carriers.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
  
  // Build query string
  const params_obj = { limit: 50 };
  if (carrier) params_obj.carrier = carrier;
  if (state) params_obj.state = state;
  if (claimType) params_obj.claim_type = claimType;
  
  const queryString = new URLSearchParams(params_obj).toString();
  const url = `${API_BASE_URL}/history/query?${queryString}`;
  
  const params = {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const duration = Date.now() - startTime;

  historyQueryDuration.add(duration);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has settlements': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && Array.isArray(body.data.settlements);
      } catch (e) {
        return false;
      }
    },
  });

  if (success) {
    historyQuerySuccess.add(1);
  } else {
    historyQueryFailure.add(1);
    errorRate.add(1);
    console.error(`History Query failed: ${response.status} - ${response.body}`);
  }

  sleep(0.1); // Very short sleep for burst test
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'history-query-results.json': JSON.stringify(data),
  };
}


