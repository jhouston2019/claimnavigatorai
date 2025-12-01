/**
 * k6 Load Test Script: FNOL Create Endpoint
 * 
 * Usage:
 *   k6 run --env API_BASE_URL=https://your-site.netlify.app/.netlify/functions/api --env API_KEY=your_key fnol-create-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const fnolCreateDuration = new Trend('fnol_create_duration');
const fnolCreateSuccess = new Counter('fnol_create_success');
const fnolCreateFailure = new Counter('fnol_create_failure');

// Configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% of requests should be below 2s
    'errors': ['rate<0.01'],              // Error rate should be less than 1%
    'fnol_create_duration': ['p(95)<2000'],
  },
};

const API_BASE_URL = __ENV.API_BASE_URL || 'https://your-site.netlify.app/.netlify/functions/api';
const API_KEY = __ENV.API_KEY || '';

// Test data
const fnolPayload = {
  policyholder: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    address: '123 Main St, City, State 12345'
  },
  policy: {
    policyNumber: 'POL-123456',
    carrier: 'State Farm'
  },
  loss: {
    date: '2025-01-15',
    type: 'Water Damage',
    description: 'Water damage from burst pipe in kitchen'
  },
  property: {
    address: '123 Main St',
    type: 'Residential',
    squareFootage: 2000
  },
  damage: {
    description: 'Kitchen and bathroom affected',
    areas: ['kitchen', 'bathroom'],
    estimatedCost: 25000
  },
  impact: {
    habitable: false,
    injuries: false
  },
  evidenceFiles: {
    photos: [],
    reports: [],
    estimates: []
  }
};

export default function () {
  const url = `${API_BASE_URL}/fnol/create`;
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
  };

  const startTime = Date.now();
  const response = http.post(url, JSON.stringify(fnolPayload), params);
  const duration = Date.now() - startTime;

  // Record metrics
  fnolCreateDuration.add(duration);
  
  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'response has fnol_id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && body.data.fnol_id;
      } catch (e) {
        return false;
      }
    },
  });

  if (success) {
    fnolCreateSuccess.add(1);
  } else {
    fnolCreateFailure.add(1);
    errorRate.add(1);
    console.error(`FNOL Create failed: ${response.status} - ${response.body}`);
  }

  sleep(1); // Wait 1 second between requests
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'fnol-create-results.json': JSON.stringify(data),
  };
}


