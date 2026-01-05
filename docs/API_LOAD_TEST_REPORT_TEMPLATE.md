# API Load Test Report Template
## Claim Navigator API Layer

**Test Date:** [YYYY-MM-DD]  
**Test Duration:** [Duration]  
**Test Engineer:** [Name]  
**Environment:** [Staging/Production]

---

## Executive Summary

**Overall Result:** [PASS/FAIL/WARN]

**Key Findings:**
- [Brief summary of results]
- [Critical issues found]
- [Performance highlights]

---

## Methodology

### Test Tools
- **Tool:** [k6/Artillery/Apache Bench]
- **Version:** [Version]
- **Configuration:** [Brief description]

### Test Environment
- **API Base URL:** [URL]
- **Database:** [Supabase instance]
- **Netlify Functions:** [Region/Configuration]
- **Test Data:** [Description of test data used]

### Test Scenarios Executed
1. [Scenario name] - [Target load] - [Duration]
2. [Scenario name] - [Target load] - [Duration]
3. [Scenario name] - [Target load] - [Duration]

---

## Environment

### Infrastructure
- **Netlify Functions:** [Details]
- **Supabase:** [Instance details]
- **CDN:** [If applicable]
- **Rate Limiting:** [Configuration]

### Test Configuration
- **Concurrent Users:** [Number]
- **Ramp-up Strategy:** [Description]
- **Test Duration:** [Duration]
- **Total Requests:** [Number]

---

## Results Per Endpoint

### 1. POST /api/fnol/create

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 Latency | < 500ms | [Value] | [PASS/FAIL] |
| p95 Latency | < 2,000ms | [Value] | [PASS/FAIL] |
| p99 Latency | < 3,000ms | [Value] | [PASS/FAIL] |
| Error Rate | < 0.5% | [Value]% | [PASS/FAIL] |
| Throughput | [Target] RPS | [Value] RPS | [PASS/FAIL] |

**Notes:**
- [Observations]
- [Issues encountered]
- [Performance characteristics]

---

### 2. POST /api/deadlines/check

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 Latency | < 300ms | [Value] | [PASS/FAIL] |
| p95 Latency | < 800ms | [Value] | [PASS/FAIL] |
| p99 Latency | < 1,500ms | [Value] | [PASS/FAIL] |
| Error Rate | < 0.5% | [Value]% | [PASS/FAIL] |
| Throughput | [Target] RPS | [Value] RPS | [PASS/FAIL] |

**Notes:**
- [Observations]

---

### 3. POST /api/compliance/analyze

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 Latency | < 1,500ms | [Value] | [PASS/FAIL] |
| p95 Latency | < 3,000ms | [Value] | [PASS/FAIL] |
| p99 Latency | < 5,000ms | [Value] | [PASS/FAIL] |
| Error Rate | < 0.5% | [Value]% | [PASS/FAIL] |
| Throughput | [Target] RPS | [Value] RPS | [PASS/FAIL] |

**Notes:**
- [Observations]

---

### 4. GET /api/alerts/list

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 Latency | < 300ms | [Value] | [PASS/FAIL] |
| p95 Latency | < 600ms | [Value] | [PASS/FAIL] |
| p99 Latency | < 1,000ms | [Value] | [PASS/FAIL] |
| Error Rate | < 0.5% | [Value]% | [PASS/FAIL] |
| Throughput | [Target] RPS | [Value] RPS | [PASS/FAIL] |

**Notes:**
- [Observations]

---

### 5. POST /api/evidence/upload

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 Latency | < 2,000ms | [Value] | [PASS/FAIL] |
| p95 Latency | < 5,000ms | [Value] | [PASS/FAIL] |
| p99 Latency | < 10,000ms | [Value] | [PASS/FAIL] |
| Error Rate | < 0.5% | [Value]% | [PASS/FAIL] |
| Throughput | [Target] RPS | [Value] RPS | [PASS/FAIL] |

**Notes:**
- [File size tested]
- [Upload performance]

---

### 6. POST /api/estimate/interpret

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 Latency | < 4,000ms | [Value] | [PASS/FAIL] |
| p95 Latency | < 8,000ms | [Value] | [PASS/FAIL] |
| p99 Latency | < 15,000ms | [Value] | [PASS/FAIL] |
| Error Rate | < 0.5% | [Value]% | [PASS/FAIL] |
| Throughput | [Target] RPS | [Value] RPS | [PASS/FAIL] |

**Notes:**
- [File processing performance]

---

### 7. POST /api/settlement/calc

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 Latency | < 500ms | [Value] | [PASS/FAIL] |
| p95 Latency | < 1,500ms | [Value] | [PASS/FAIL] |
| p99 Latency | < 3,000ms | [Value] | [PASS/FAIL] |
| Error Rate | < 0.5% | [Value]% | [PASS/FAIL] |
| Throughput | [Target] RPS | [Value] RPS | [PASS/FAIL] |

**Notes:**
- [Observations]

---

### 8. POST /api/policy/compare

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 Latency | < 2,000ms | [Value] | [PASS/FAIL] |
| p95 Latency | < 4,000ms | [Value] | [PASS/FAIL] |
| p99 Latency | < 8,000ms | [Value] | [PASS/FAIL] |
| Error Rate | < 0.5% | [Value]% | [PASS/FAIL] |
| Throughput | [Target] RPS | [Value] RPS | [PASS/FAIL] |

**Notes:**
- [Observations]

---

### 9. GET /api/history/query

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 Latency | < 400ms | [Value] | [PASS/FAIL] |
| p95 Latency | < 1,000ms | [Value] | [PASS/FAIL] |
| p99 Latency | < 2,000ms | [Value] | [PASS/FAIL] |
| Error Rate | < 0.5% | [Value]% | [PASS/FAIL] |
| Throughput | [Target] RPS | [Value] RPS | [PASS/FAIL] |

**Notes:**
- [Burst test results]

---

### 10. GET /api/expert/find

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 Latency | < 300ms | [Value] | [PASS/FAIL] |
| p95 Latency | < 800ms | [Value] | [PASS/FAIL] |
| p99 Latency | < 1,500ms | [Value] | [PASS/FAIL] |
| Error Rate | < 0.5% | [Value]% | [PASS/FAIL] |
| Throughput | [Target] RPS | [Value] RPS | [PASS/FAIL] |

**Notes:**
- [Observations]

---

### 11. POST /api/checklist/generate

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 Latency | < 1,000ms | [Value] | [PASS/FAIL] |
| p95 Latency | < 2,000ms | [Value] | [PASS/FAIL] |
| p99 Latency | < 4,000ms | [Value] | [PASS/FAIL] |
| Error Rate | < 0.5% | [Value]% | [PASS/FAIL] |
| Throughput | [Target] RPS | [Value] RPS | [PASS/FAIL] |

**Notes:**
- [Observations]

---

## Bottlenecks

### Identified Bottlenecks

1. **[Bottleneck Name]**
   - **Location:** [Endpoint/Component]
   - **Impact:** [High/Medium/Low]
   - **Description:** [Details]
   - **Recommendation:** [Action items]

2. **[Bottleneck Name]**
   - **Location:** [Endpoint/Component]
   - **Impact:** [High/Medium/Low]
   - **Description:** [Details]
   - **Recommendation:** [Action items]

### Database Performance
- **Query Performance:** [Observations]
- **Connection Pool:** [Status]
- **Index Usage:** [Observations]

### Function Execution
- **Cold Start Impact:** [Observations]
- **Memory Usage:** [Observations]
- **Timeout Issues:** [If any]

---

## Recommendations

### Immediate Actions (Priority: High)
1. [Action item]
2. [Action item]
3. [Action item]

### Short-term Improvements (Priority: Medium)
1. [Action item]
2. [Action item]

### Long-term Optimizations (Priority: Low)
1. [Action item]
2. [Action item]

### Infrastructure Recommendations
- [Infrastructure changes]
- [Scaling recommendations]
- [Monitoring improvements]

---

## Appendices

### A. Test Scripts Used
- [List of scripts]
- [Configuration files]

### B. Raw Metrics
- [Link to detailed metrics]
- [Charts/graphs]

### C. Error Logs
- [Summary of errors]
- [Error patterns]

### D. System Logs
- [Relevant system logs]
- [Performance snapshots]

---

**Report Generated:** [Date]  
**Next Review:** [Date]


