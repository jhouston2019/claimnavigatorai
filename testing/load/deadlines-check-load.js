/**
 * k6 Load Test Script: Deadlines Check Endpoint
 * 
 * Usage:
 *   k6 run --env API_BASE_URL=https://your-site.netlify.app/.netlify/functions/api --env API_KEY=your_key deadlines-check-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const deadlinesCheckDuration = new Trend('deadlines_check_duration');
const deadlinesCheckSuccess = new Counter('deadlines_check_success');
const deadlinesCheckFailure = new Counter('deadlines_check_failure');

// Configuration - Read-heavy endpoint, can handle more load
export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<800'],  // Should be fast (read-heavy)
    'errors': ['rate<0.005'],            // Very low error rate expected
    'deadlines_check_duration': ['p(95)<800'],
  },
};

const API_BASE_URL = __ENV.API_BASE_URL || 'https://your-site.netlify.app/.netlify/functions/api';
const API_KEY = __ENV.API_KEY || '';

// Test data - vary state and carrier
const states = ['CA', 'TX', 'FL', 'NY', 'IL'];
const carriers = ['State Farm', 'Allstate', 'Farmers', 'USAA', 'Progressive'];

export default function () {
  const state = states[Math.floor(Math.random() * states.length)];
  const carrier = carriers[Math.floor(Math.random() * carriers.length)];
  
  const payload = {
    state: state,
    carrier: carrier,
    claimType: 'Property',
    dateOfLoss: '2025-01-15'
  };

  const url = `${API_BASE_URL}/deadlines/check`;
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
  };

  const startTime = Date.now();
  const response = http.post(url, JSON.stringify(payload), params);
  const duration = Date.now() - startTime;

  deadlinesCheckDuration.add(duration);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has deadlines': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && Array.isArray(body.data.statutory);
      } catch (e) {
        return false;
      }
    },
  });

  if (success) {
    deadlinesCheckSuccess.add(1);
  } else {
    deadlinesCheckFailure.add(1);
    errorRate.add(1);
    console.error(`Deadlines Check failed: ${response.status} - ${response.body}`);
  }

  sleep(0.5); // Shorter sleep for read-heavy endpoint
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'deadlines-check-results.json': JSON.stringify(data),
  };
}


