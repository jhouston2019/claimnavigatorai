# SDK Usage Guide
## Claim Navigator API Client Libraries

**Date:** 2025-01-28  
**Version:** 1.0

---

## Overview

This document provides usage examples for the Claim Navigator SDKs in JavaScript, Python, and PHP.

---

## JavaScript SDK

### Installation

**Browser:**
```html
<script src="https://your-site.netlify.app/sdk/js/claimnavigator.js"></script>
```

**Node.js:**
```javascript
const ClaimNavigator = require('./sdk/js/claimnavigator.js');
```

**ES Modules:**
```javascript
import ClaimNavigator from './sdk/js/claimnavigator.js';
```

### Basic Usage

```javascript
// Initialize client
const client = new ClaimNavigator({
  apiKey: 'cn_your_api_key_here',
  baseUrl: 'https://your-site.netlify.app/.netlify/functions/api',
  timeout: 30000
});

// Create FNOL
const fnol = await client.createFNOL({
  policyholder: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    address: '123 Main St'
  },
  policy: {
    policyNumber: 'POL-123456',
    carrier: 'State Farm'
  },
  loss: {
    date: '2025-01-15',
    type: 'Water Damage'
  }
});

console.log('FNOL ID:', fnol.fnol_id);
console.log('PDF URL:', fnol.pdf_url);

// Check deadlines
const deadlines = await client.checkDeadlines({
  state: 'CA',
  carrier: 'State Farm',
  claimType: 'Property',
  dateOfLoss: '2025-01-15'
});

console.log('Statutory deadlines:', deadlines.statutory);
console.log('Carrier deadlines:', deadlines.carrier);

// Analyze compliance
const compliance = await client.analyzeCompliance({
  state: 'CA',
  carrier: 'State Farm',
  claimType: 'Property',
  events: [
    { date: '2025-01-15', name: 'Date of Loss' }
  ]
});

console.log('Risk score:', compliance.risk_score);
console.log('Violations:', compliance.violations);

// Upload evidence
const evidence = await client.uploadEvidence({
  file_url: 'https://example.com/photo.jpg',
  file_name: 'damage-photo.jpg',
  file_size: 1024000,
  mime_type: 'image/jpeg',
  category: 'photos'
});

console.log('Evidence ID:', evidence.evidence_id);

// Interpret estimate
const estimate = await client.interpretEstimate({
  file_url: 'https://example.com/estimate.pdf',
  loss_type: 'Water Damage',
  severity: 'moderate',
  areas: ['kitchen', 'bathroom']
});

console.log('Estimate total:', estimate.estimate_total);
console.log('ROM range:', estimate.rom_range);

// Error handling
try {
  const result = await client.createFNOL(fnolData);
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error
}
```

---

## Python SDK

### Installation

```bash
# Copy claimnavigator.py to your project
cp sdk/python/claimnavigator.py /path/to/your/project/
```

### Basic Usage

```python
from claimnavigator import ClaimNavigator

# Initialize client
client = ClaimNavigator(
    api_key='cn_your_api_key_here',
    base_url='https://your-site.netlify.app/.netlify/functions/api',
    timeout=30
)

# Create FNOL
fnol_data = {
    'policyholder': {
        'name': 'John Doe',
        'email': 'john@example.com',
        'phone': '+1-555-0123',
        'address': '123 Main St'
    },
    'policy': {
        'policyNumber': 'POL-123456',
        'carrier': 'State Farm'
    },
    'loss': {
        'date': '2025-01-15',
        'type': 'Water Damage'
    }
}

fnol = client.create_fnol(fnol_data)
print(f"FNOL ID: {fnol['fnol_id']}")
print(f"PDF URL: {fnol['pdf_url']}")

# Check deadlines
deadlines = client.check_deadlines(
    state='CA',
    carrier='State Farm',
    claim_type='Property',
    date_of_loss='2025-01-15'
)
print(f"Statutory deadlines: {deadlines['statutory']}")

# Analyze compliance
compliance = client.analyze_compliance(
    state='CA',
    carrier='State Farm',
    claim_type='Property',
    events=[
        {'date': '2025-01-15', 'name': 'Date of Loss'}
    ]
)
print(f"Risk score: {compliance['risk_score']}")

# Upload evidence
evidence = client.upload_evidence(
    file_url='https://example.com/photo.jpg',
    file_name='damage-photo.jpg',
    file_size=1024000,
    mime_type='image/jpeg',
    category='photos'
)
print(f"Evidence ID: {evidence['evidence_id']}")

# Interpret estimate
estimate = client.interpret_estimate(
    file_url='https://example.com/estimate.pdf',
    loss_type='Water Damage',
    severity='moderate',
    areas=['kitchen', 'bathroom']
)
print(f"Estimate total: ${estimate['estimate_total']}")

# Error handling
try:
    result = client.create_fnol(fnol_data)
except Exception as e:
    print(f"API Error: {e}")
    # Handle error
```

---

## PHP SDK

### Installation

```php
// Include the SDK file
require_once 'sdk/php/ClaimNavigator.php';
```

### Basic Usage

```php
<?php
// Initialize client
$client = new ClaimNavigator([
    'apiKey' => 'cn_your_api_key_here',
    'baseUrl' => 'https://your-site.netlify.app/.netlify/functions/api',
    'timeout' => 30
]);

// Create FNOL
$fnolData = [
    'policyholder' => [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'phone' => '+1-555-0123',
        'address' => '123 Main St'
    ],
    'policy' => [
        'policyNumber' => 'POL-123456',
        'carrier' => 'State Farm'
    ],
    'loss' => [
        'date' => '2025-01-15',
        'type' => 'Water Damage'
    ]
];

$fnol = $client->createFNOL($fnolData);
echo "FNOL ID: " . $fnol['fnol_id'] . "\n";
echo "PDF URL: " . $fnol['pdf_url'] . "\n";

// Check deadlines
$deadlines = $client->checkDeadlines(
    'CA',
    'State Farm',
    'Property',
    '2025-01-15'
);
echo "Statutory deadlines: " . count($deadlines['statutory']) . "\n";

// Analyze compliance
$compliance = $client->analyzeCompliance(
    'CA',
    'State Farm',
    'Property',
    [
        ['date' => '2025-01-15', 'name' => 'Date of Loss']
    ]
);
echo "Risk score: " . $compliance['risk_score'] . "\n";

// Upload evidence
$evidence = $client->uploadEvidence(
    'https://example.com/photo.jpg',
    'damage-photo.jpg',
    1024000,
    'image/jpeg',
    'photos'
);
echo "Evidence ID: " . $evidence['evidence_id'] . "\n";

// Interpret estimate
$estimate = $client->interpretEstimate(
    'https://example.com/estimate.pdf',
    'Water Damage',
    'moderate',
    ['kitchen', 'bathroom']
);
echo "Estimate total: $" . $estimate['estimate_total'] . "\n";

// Error handling
try {
    $result = $client->createFNOL($fnolData);
} catch (Exception $e) {
    echo "API Error: " . $e->getMessage() . "\n";
    // Handle error
}
?>
```

---

## Common Patterns

### Error Handling

All SDKs throw exceptions on errors. Handle them appropriately:

**JavaScript:**
```javascript
try {
  const result = await client.createFNOL(data);
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Handle rate limit
  } else if (error.message.includes('Validation')) {
    // Handle validation error
  } else {
    // Handle other errors
  }
}
```

**Python:**
```python
try:
    result = client.create_fnol(data)
except Exception as e:
    if 'Rate limit' in str(e):
        # Handle rate limit
    elif 'Validation' in str(e):
        # Handle validation error
    else:
        # Handle other errors
```

**PHP:**
```php
try {
    $result = $client->createFNOL($data);
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Rate limit') !== false) {
        // Handle rate limit
    } elseif (strpos($e->getMessage(), 'Validation') !== false) {
        // Handle validation error
    } else {
        // Handle other errors
    }
}
```

### Retry Logic

Implement retry logic for transient errors:

**JavaScript:**
```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

const result = await withRetry(() => client.createFNOL(data));
```

---

## Best Practices

1. **Store API Keys Securely:**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Handle Errors Gracefully:**
   - Implement retry logic
   - Log errors appropriately
   - Provide user-friendly error messages

3. **Respect Rate Limits:**
   - Implement exponential backoff
   - Monitor rate limit headers
   - Cache responses when possible

4. **Validate Input:**
   - Validate data before sending
   - Check required fields
   - Validate data types

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-01-28


