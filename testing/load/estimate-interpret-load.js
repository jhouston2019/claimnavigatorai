/**
 * k6 Load Test Script: Estimate Interpret Endpoint
 * 
 * Usage:
 *   k6 run --env API_BASE_URL=https://your-site.netlify.app/.netlify/functions/api --env API_KEY=your_key estimate-interpret-load.js
 * 
 * Note: This test uses a file URL. In real testing, you would upload files first or use test file URLs.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const estimateInterpretDuration = new Trend('estimate_interpret_duration');
const estimateInterpretSuccess = new Counter('estimate_interpret_success');
const estimateInterpretFailure = new Counter('estimate_interpret_failure');

// Configuration - File processing, expect higher latency
export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 40 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<8000'], // OCR + AI processing
    'errors': ['rate<0.01'],
    'estimate_interpret_duration': ['p(95)<8000'],
  },
};

const API_BASE_URL = __ENV.API_BASE_URL || 'https://your-site.netlify.app/.netlify/functions/api';
const API_KEY = __ENV.API_KEY || '';
const TEST_FILE_URL = __ENV.TEST_FILE_URL || 'https://example.com/test-estimate.pdf';

export default function () {
  const payload = {
    file_url: TEST_FILE_URL,
    loss_type: 'Water Damage',
    severity: 'moderate',
    areas: ['kitchen', 'bathroom']
  };

  const url = `${API_BASE_URL}/estimate/interpret`;
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
  };

  const startTime = Date.now();
  const response = http.post(url, JSON.stringify(payload), params);
  const duration = Date.now() - startTime;

  estimateInterpretDuration.add(duration);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has interpretation': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && body.data.interpretation_id;
      } catch (e) {
        return false;
      }
    },
  });

  if (success) {
    estimateInterpretSuccess.add(1);
  } else {
    estimateInterpretFailure.add(1);
    errorRate.add(1);
    console.error(`Estimate Interpret failed: ${response.status} - ${response.body}`);
  }

  sleep(3); // Longer sleep for file processing endpoint
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'estimate-interpret-results.json': JSON.stringify(data),
  };
}


