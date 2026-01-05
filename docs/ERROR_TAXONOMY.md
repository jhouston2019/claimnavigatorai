# Error Taxonomy
## Claim Navigator API Layer

**Date:** 2025-01-28  
**Version:** 1.0

---

## Overview

This document defines the standardized error code system for the Claim Navigator API. All API endpoints use these error codes consistently to provide clear, actionable error information.

---

## Error Code Format

Error codes follow the pattern: `CN-XXXX`

Where:
- `CN` = ClaimNavigator prefix
- `XXXX` = 4-digit numeric code

---

## Error Code Categories

### CN-1000 Series: Validation Errors

| Code | Description | HTTP Status | Example |
|------|-------------|-------------|---------|
| CN-1000 | Validation error | 400 | Missing required field |
| CN-1001 | Invalid file type / payload size | 400 | File exceeds size limit |
| CN-1002 | Invalid date format | 400 | Date must be ISO 8601 |
| CN-1003 | Invalid email format | 400 | Email format invalid |
| CN-1004 | Invalid phone format | 400 | Phone format invalid |
| CN-1005 | Invalid URL format | 400 | URL must use HTTPS |

### CN-2000 Series: Compliance Engine Errors

| Code | Description | HTTP Status | Example |
|------|-------------|-------------|---------|
| CN-2000 | Compliance engine input error | 400 | Missing state or carrier |
| CN-2001 | Compliance analysis failed | 500 | AI processing error |
| CN-2002 | Deadline calculation failed | 500 | State rules not found |

### CN-3000 Series: Timeline Sync Errors

| Code | Description | HTTP Status | Example |
|------|-------------|-------------|---------|
| CN-3000 | Timeline sync failure | 500 | Failed to add timeline event |
| CN-3001 | Timeline event validation failed | 400 | Invalid event type |

### CN-4000 Series: Rate Limiting & Abuse

| Code | Description | HTTP Status | Example |
|------|-------------|-------------|---------|
| CN-4000 | Rate limit exceeded | 429 | Too many requests |
| CN-4001 | Temporarily blocked | 429 | IP blocked for 5 minutes |
| CN-4002 | Burst limit exceeded | 429 | Too many requests in short window |

### CN-5000 Series: Internal Server Errors

| Code | Description | HTTP Status | Example |
|------|-------------|-------------|---------|
| CN-5000 | Internal server error | 500 | Unexpected error occurred |
| CN-5001 | Database error | 500 | Query failed |
| CN-5002 | External service error | 500 | OpenAI API error |
| CN-5003 | File processing error | 500 | PDF parsing failed |

### CN-6000 Series: Authentication & Authorization

| Code | Description | HTTP Status | Example |
|------|-------------|-------------|---------|
| CN-6000 | Unauthorized | 401 | Invalid or missing token |
| CN-6001 | Token expired | 401 | Token has expired |
| CN-6002 | Insufficient permissions | 403 | API key lacks required permissions |
| CN-6003 | API key inactive | 401 | API key is inactive |

### CN-7000 Series: Resource Errors

| Code | Description | HTTP Status | Example |
|------|-------------|-------------|---------|
| CN-7000 | Resource not found | 404 | Alert not found |
| CN-7001 | Resource already exists | 409 | API key already exists |
| CN-7002 | Resource conflict | 409 | Concurrent modification |

### CN-8000 Series: Configuration Errors

| Code | Description | HTTP Status | Example |
|------|-------------|-------------|---------|
| CN-8000 | Configuration error | 500 | Database not configured |
| CN-8001 | Missing environment variable | 500 | OPENAI_API_KEY not set |
| CN-8002 | Invalid configuration | 500 | Invalid rate limit setting |

### CN-9000 Series: Critical System Failures

| Code | Description | HTTP Status | Example |
|------|-------------|-------------|---------|
| CN-9000 | Critical system failure | 503 | System unavailable |
| CN-9001 | Service degraded | 503 | Partial service outage |
| CN-9002 | Maintenance mode | 503 | System under maintenance |

---

## Error Response Format

All errors follow this standardized format:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CN-1000",
    "message": "Validation error: Missing required field 'state'",
    "details": {
      "field": "state",
      "reason": "required"
    }
  }
}
```

### Error Response Fields

- **success**: Always `false` for errors
- **data**: Always `null` for errors
- **error.code**: Standardized error code (CN-XXXX)
- **error.message**: Human-readable error message
- **error.details**: Optional additional context (object)

---

## Error Code Usage Guidelines

### When to Use Each Category

1. **CN-1000 Series**: Use for all input validation failures
2. **CN-2000 Series**: Use for compliance engine specific errors
3. **CN-3000 Series**: Use for timeline synchronization errors
4. **CN-4000 Series**: Use for rate limiting and abuse protection
5. **CN-5000 Series**: Use for unexpected internal errors
6. **CN-6000 Series**: Use for authentication/authorization failures
7. **CN-7000 Series**: Use for resource-related errors
8. **CN-8000 Series**: Use for configuration issues
9. **CN-9000 Series**: Use for critical system failures

### Error Message Best Practices

1. **Be Specific**: Include the field or resource that caused the error
2. **Be Actionable**: Tell the user what they can do to fix it
3. **Don't Leak Secrets**: Never include API keys, tokens, or internal details
4. **Use Consistent Language**: Follow the same tone and style

### Examples

**Good Error Message:**
```json
{
  "error": {
    "code": "CN-1000",
    "message": "Validation error: Missing required field 'state'",
    "details": {
      "field": "state",
      "reason": "required"
    }
  }
}
```

**Bad Error Message:**
```json
{
  "error": {
    "code": "CN-5000",
    "message": "Error in /api/compliance/analyze: Cannot read property 'state' of undefined at line 45"
  }
}
```

---

## Error Handling Implementation

### In API Endpoints

All endpoints should:

1. **Catch errors**: Wrap critical sections in try/catch
2. **Use error codes**: Always use standardized error codes
3. **Provide context**: Include relevant details in error.details
4. **Log errors**: Log errors with full context (but don't expose in response)

### Example Implementation

```javascript
try {
  // Critical operation
  const result = await criticalOperation();
  return sendSuccess(result);
} catch (error) {
  console.error('Operation failed:', error);
  
  // Determine error code based on error type
  if (error.name === 'ValidationError') {
    return sendError(error.message, 'CN-1000', 400, { field: error.field });
  } else if (error.name === 'DatabaseError') {
    return sendError('Database operation failed', 'CN-5001', 500);
  } else {
    return sendError('Internal server error', 'CN-5000', 500);
  }
}
```

---

## Error Code Reference

### Quick Reference by HTTP Status

**400 Bad Request:**
- CN-1000, CN-1001, CN-1002, CN-1003, CN-1004, CN-1005
- CN-2000, CN-3001

**401 Unauthorized:**
- CN-6000, CN-6001, CN-6003

**403 Forbidden:**
- CN-6002

**404 Not Found:**
- CN-7000

**409 Conflict:**
- CN-7001, CN-7002

**429 Too Many Requests:**
- CN-4000, CN-4001, CN-4002

**500 Internal Server Error:**
- CN-5000, CN-5001, CN-5002, CN-5003
- CN-2001, CN-2002, CN-3000
- CN-8000, CN-8001, CN-8002

**503 Service Unavailable:**
- CN-9000, CN-9001, CN-9002

---

## Error Monitoring

### Error Tracking

All errors are logged to:
- `api_logs` table (with error_message and status_code)
- `api_event_logs` table (with error_code and status)

### Error Analytics

Monitor:
- Error rate by code
- Error rate by endpoint
- Error rate by API key
- Error trends over time

### Alerting

Set up alerts for:
- CN-9000 series (critical failures)
- High error rates (> 1%)
- Unusual error patterns

---

## Migration Notes

### Legacy Error Codes

If migrating from legacy error codes:
1. Map old codes to new CN-XXXX format
2. Update all endpoints to use new codes
3. Update documentation
4. Notify API consumers of changes

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-01-28


