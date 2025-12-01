/**
 * k6 Load Test Script: Compliance Analyze Endpoint
 * 
 * Usage:
 *   k6 run --env API_BASE_URL=https://your-site.netlify.app/.netlify/functions/api --env API_KEY=your_key compliance-analyze-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const complianceAnalyzeDuration = new Trend('compliance_analyze_duration');
const complianceAnalyzeSuccess = new Counter('compliance_analyze_success');
const complianceAnalyzeFailure = new Counter('compliance_analyze_failure');

// Configuration - AI processing, expect higher latency
export const options = {
  stages: [
    { duration: '1m', target: 25 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // AI processing takes time
    'errors': ['rate<0.01'],
    'compliance_analyze_duration': ['p(95)<3000'],
  },
};

const API_BASE_URL = __ENV.API_BASE_URL || 'https://your-site.netlify.app/.netlify/functions/api';
const API_KEY = __ENV.API_KEY || '';

// Test data
const states = ['CA', 'TX', 'FL', 'NY'];
const carriers = ['State Farm', 'Allstate', 'Farmers'];

export default function () {
  const state = states[Math.floor(Math.random() * states.length)];
  const carrier = carriers[Math.floor(Math.random() * carriers.length)];
  
  const payload = {
    state: state,
    carrier: carrier,
    claimType: 'Property',
    events: [
      {
        date: '2025-01-15',
        name: 'Date of Loss',
        description: 'Water damage occurred'
      },
      {
        date: '2025-01-16',
        name: 'Claim Reported',
        description: 'Claim reported to carrier'
      }
    ]
  };

  const url = `${API_BASE_URL}/compliance/analyze`;
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
  };

  const startTime = Date.now();
  const response = http.post(url, JSON.stringify(payload), params);
  const duration = Date.now() - startTime;

  complianceAnalyzeDuration.add(duration);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has analysis': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && body.data.risk_score !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (success) {
    complianceAnalyzeSuccess.add(1);
  } else {
    complianceAnalyzeFailure.add(1);
    errorRate.add(1);
    console.error(`Compliance Analyze failed: ${response.status} - ${response.body}`);
  }

  sleep(2); // Longer sleep for AI processing endpoint
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'compliance-analyze-results.json': JSON.stringify(data),
  };
}


