# Workflow Tools AI - Developer Integration Guide

## 📚 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Adding New Tools](#adding-new-tools)
3. [Customizing AI Behavior](#customizing-ai-behavior)
4. [Backend Configuration](#backend-configuration)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### Component Structure
```
┌─────────────────────────────────────────────┐
│           workflow-tool.html                │
│  (Universal tool page with AI interface)    │
└────────────────┬────────────────────────────┘
                 │
                 ├─► workflow-tools-ai.js
                 │   (Frontend AI logic)
                 │
                 ├─► workflow-tools-ai.css
                 │   (AI interface styling)
                 │
                 └─► tool-registry.js
                     (Tool routing configuration)
                     
Frontend Request ──► Netlify Function ──► OpenAI API
                     (workflow-tool-ai.js)
```

### Data Flow
```
User Input
    ↓
AI Chat Interface (workflow-tools-ai.js)
    ↓
Claim Context Injection (localStorage)
    ↓
HTTP POST to /.netlify/functions/workflow-tool-ai
    ↓
OpenAI API Call (GPT-4o-mini)
    ↓
Response Formatting
    ↓
Display in Chat Interface
```

---

## ➕ Adding New Tools

### Step 1: Add Tool Metadata
**File:** `workflow-tool.html`

Add tool metadata to the `TOOL_METADATA` object:

```javascript
const TOOL_METADATA = {
  // ... existing tools ...
  
  'your-new-tool-id': {
    title: 'Your Tool Name',
    description: 'Brief description of what this tool does.',
    step: 5,  // Which step this tool belongs to
    classification: 'Required'  // or 'Optional'
  }
};
```

### Step 2: Add AI Configuration
**File:** `app/assets/js/workflow-tools-ai.js`

Add AI configuration to `WORKFLOW_TOOL_AI_CONFIGS`:

```javascript
const WORKFLOW_TOOL_AI_CONFIGS = {
  // ... existing configs ...
  
  'your-new-tool-id': {
    systemPrompt: `You are an expert in [domain]. Help users:
- [Key capability 1]
- [Key capability 2]
- [Key capability 3]
- [Key capability 4]
- [Key capability 5]`,
    
    placeholder: 'Ask about [tool purpose]...',
    
    suggestedQuestions: [
      'Question 1 about the tool?',
      'Question 2 about the tool?',
      'Question 3 about the tool?',
      'Question 4 about the tool?'
    ]
  }
};
```

### Step 3: Register Tool
**File:** `app/assets/js/tool-registry.js`

Add tool to the registry:

```javascript
const TOOL_REGISTRY = {
  // ... existing tools ...
  
  'your-new-tool-id': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 5
  }
};
```

### Step 4: Add Tool to Step Guide
**File:** `step-by-step-claim-guide.html`

Add tool reference in the appropriate step's data structure:

```javascript
const stepData = {
  // ... existing steps ...
  
  5: {
    // ... step configuration ...
    additionalTools: [
      // ... existing tools ...
      { id: 'your-new-tool-id', title: 'Your Tool Name' }
    ]
  }
};
```

### Step 5: Test
1. Navigate to the step guide
2. Click on your new tool
3. Verify tool page loads correctly
4. Test AI assistant functionality
5. Verify suggested questions work
6. Test custom questions

---

## 🎨 Customizing AI Behavior

### System Prompt Best Practices

#### Structure
```javascript
systemPrompt: `You are an expert in [domain]. Help users:
- [Capability 1] - Be specific
- [Capability 2] - Focus on user needs
- [Capability 3] - Include edge cases
- [Capability 4] - Mention limitations
- [Capability 5] - Provide context`,
```

#### Good Example
```javascript
systemPrompt: `You are an expert in Additional Living Expenses (ALE) coverage. Help users:
- Understand ALE eligibility requirements and coverage limits
- Track and categorize ALE expenses by type (housing, meals, etc.)
- Identify which expenses are covered vs. non-covered
- Calculate remaining ALE benefits based on policy limits
- Document expenses properly for maximum recovery
- Understand time limits and reasonableness standards`,
```

#### Bad Example (Too Vague)
```javascript
systemPrompt: `You are an ALE expert. Help users with their expenses.`,
```

### Suggested Questions Guidelines

#### Good Questions
- ✅ Specific and actionable
- ✅ Cover common user pain points
- ✅ Progressive complexity (basic to advanced)
- ✅ Encourage exploration

```javascript
suggestedQuestions: [
  'What expenses are covered under ALE?',           // Basic
  'How long can I claim ALE benefits?',             // Timing
  'Are restaurant meals covered?',                  // Specific
  'How do I calculate my remaining ALE limit?'      // Advanced
]
```

#### Bad Questions
- ❌ Too vague: "How does this work?"
- ❌ Too complex: "Explain the entire ALE coverage framework"
- ❌ Not actionable: "Tell me about ALE"

### Adjusting AI Temperature

**File:** `netlify/functions/workflow-tool-ai.js`

```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  temperature: 0.7,  // Adjust between 0.0 (deterministic) and 1.0 (creative)
  max_tokens: 1000,  // Adjust response length
  // ...
});
```

**Temperature Guide:**
- `0.0-0.3`: Very consistent, factual responses (good for policy interpretation)
- `0.4-0.7`: Balanced creativity and consistency (recommended for most tools)
- `0.8-1.0`: More creative, varied responses (use cautiously)

### Adjusting Response Length

```javascript
max_tokens: 1000  // Adjust based on tool needs
```

**Token Guide:**
- `500`: Short, concise responses
- `1000`: Standard responses (recommended)
- `2000`: Detailed, comprehensive responses
- `4000`: Very detailed responses (use sparingly, higher cost)

---

## ⚙️ Backend Configuration

### Environment Variables
**File:** `.env` (not in repo)

```bash
OPENAI_API_KEY=sk-...your-key-here...
```

### Netlify Function Configuration
**File:** `netlify.toml`

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[redirects]]
  from = "/.netlify/functions/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Adding Custom Headers

**File:** `netlify/functions/workflow-tool-ai.js`

```javascript
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  // Add custom headers here
  'X-Custom-Header': 'value'
};
```

### Adding Request Validation

```javascript
// Validate inputs
if (!toolId || !userMessage || !systemPrompt) {
  return {
    statusCode: 400,
    headers,
    body: JSON.stringify({ 
      error: 'Missing required fields',
      required: ['toolId', 'userMessage', 'systemPrompt']
    })
  };
}

// Add custom validation
if (userMessage.length > 1000) {
  return {
    statusCode: 400,
    headers,
    body: JSON.stringify({ 
      error: 'Message too long',
      maxLength: 1000
    })
  };
}
```

### Adding Usage Logging

```javascript
// Log usage for monitoring
console.log('AI Request:', {
  toolId,
  userMessageLength: userMessage.length,
  responseLength: aiResponse.length,
  tokensUsed: completion.usage?.total_tokens || 0,
  timestamp: new Date().toISOString(),
  userId: extractUserId(event)  // Implement this function
});
```

---

## 🧪 Testing

### Unit Testing AI Configurations

```javascript
// test/workflow-tools-ai.test.js

describe('Workflow Tools AI Configurations', () => {
  test('All tools have valid configurations', () => {
    Object.keys(WORKFLOW_TOOL_AI_CONFIGS).forEach(toolId => {
      const config = WORKFLOW_TOOL_AI_CONFIGS[toolId];
      
      expect(config.systemPrompt).toBeDefined();
      expect(config.systemPrompt.length).toBeGreaterThan(50);
      
      expect(config.placeholder).toBeDefined();
      expect(config.placeholder.length).toBeGreaterThan(10);
      
      expect(config.suggestedQuestions).toBeInstanceOf(Array);
      expect(config.suggestedQuestions.length).toBeGreaterThanOrEqual(3);
    });
  });
  
  test('System prompts follow best practices', () => {
    Object.values(WORKFLOW_TOOL_AI_CONFIGS).forEach(config => {
      expect(config.systemPrompt).toContain('You are an expert');
      expect(config.systemPrompt).toContain('Help users');
    });
  });
});
```

### Integration Testing

```javascript
// test/workflow-tool-ai-integration.test.js

describe('AI Backend Integration', () => {
  test('AI endpoint responds to valid requests', async () => {
    const response = await fetch('/.netlify/functions/workflow-tool-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        toolId: 'ale-tracker',
        userMessage: 'What expenses are covered?',
        systemPrompt: WORKFLOW_TOOL_AI_CONFIGS['ale-tracker'].systemPrompt,
        claimContext: mockClaimContext
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.response).toBeDefined();
  });
  
  test('AI endpoint rejects invalid requests', async () => {
    const response = await fetch('/.netlify/functions/workflow-tool-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    expect(response.status).toBe(400);
  });
});
```

### Manual Testing Checklist

- [ ] Tool page loads correctly
- [ ] AI interface appears in bottom-right
- [ ] Suggested questions display properly
- [ ] Clicking suggested questions works
- [ ] Typing custom questions works
- [ ] Ctrl+Enter sends message
- [ ] AI responses are relevant
- [ ] Collapse/expand works
- [ ] Mobile responsive design works
- [ ] Error handling works gracefully

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] All tools have AI configurations
- [ ] System prompts are professional and accurate
- [ ] Suggested questions are helpful
- [ ] Environment variables are set
- [ ] Backend function is tested
- [ ] Frontend code is minified (optional)
- [ ] CORS headers are configured
- [ ] Error handling is comprehensive

### Deployment Steps

1. **Commit Changes**
```bash
git add .
git commit -m "Add AI functionality to workflow tools"
```

2. **Push to Repository**
```bash
git push origin main
```

3. **Netlify Auto-Deploy**
- Netlify automatically deploys on push to main
- Monitor build logs for errors
- Verify deployment success

4. **Verify Deployment**
- Test AI functionality on production
- Check all tools load correctly
- Verify API key is working
- Monitor error logs

### Environment Variables (Netlify)

1. Go to Netlify Dashboard
2. Select your site
3. Go to Site Settings → Environment Variables
4. Add: `OPENAI_API_KEY` = `sk-...`
5. Redeploy site

### Rollback Procedure

If issues occur:

1. **Immediate Rollback**
```bash
git revert HEAD
git push origin main
```

2. **Netlify Dashboard**
- Go to Deploys
- Find last working deployment
- Click "Publish deploy"

---

## 🔧 Troubleshooting

### Common Issues

#### AI Not Responding

**Symptoms:** AI interface loads but no responses

**Possible Causes:**
1. Missing or invalid OpenAI API key
2. CORS issues
3. Network connectivity
4. Rate limiting

**Solutions:**
```javascript
// Check API key in Netlify environment variables
// Verify CORS headers in backend function
// Check browser console for errors
// Monitor OpenAI API status
```

#### Tool Not Found Error

**Symptoms:** "Tool not found" message

**Possible Causes:**
1. Tool ID mismatch
2. Missing tool metadata
3. Missing AI configuration

**Solutions:**
```javascript
// Verify tool ID matches across all files:
// - workflow-tool.html (TOOL_METADATA)
// - workflow-tools-ai.js (WORKFLOW_TOOL_AI_CONFIGS)
// - tool-registry.js (TOOL_REGISTRY)
```

#### Incorrect AI Responses

**Symptoms:** AI gives irrelevant or wrong answers

**Possible Causes:**
1. Poor system prompt
2. Missing context
3. Wrong tool configuration

**Solutions:**
```javascript
// Improve system prompt specificity
// Add more context to claim data
// Review and update suggested questions
// Adjust temperature setting
```

### Debugging Tools

#### Browser Console
```javascript
// Enable debug logging
localStorage.setItem('debug_ai', 'true');

// View AI requests
console.log('AI Request:', {
  toolId,
  userMessage,
  systemPrompt
});
```

#### Network Tab
- Monitor API requests
- Check request/response payloads
- Verify authentication headers
- Check response times

#### Netlify Function Logs
```bash
# View function logs
netlify functions:log workflow-tool-ai

# Real-time logs
netlify dev
```

---

## 📊 Monitoring & Analytics

### Track AI Usage

```javascript
// Add to netlify/functions/workflow-tool-ai.js

// Log to analytics service
await logAnalytics({
  event: 'ai_request',
  toolId: toolId,
  userId: user.id,
  tokensUsed: completion.usage.total_tokens,
  responseTime: Date.now() - startTime,
  success: true
});
```

### Monitor Costs

```javascript
// Track token usage
const tokenCost = {
  'gpt-4o-mini': {
    input: 0.00015,   // per 1K tokens
    output: 0.0006    // per 1K tokens
  }
};

const cost = (
  (completion.usage.prompt_tokens / 1000) * tokenCost['gpt-4o-mini'].input +
  (completion.usage.completion_tokens / 1000) * tokenCost['gpt-4o-mini'].output
);

console.log(`Request cost: $${cost.toFixed(4)}`);
```

### Error Tracking

```javascript
// Add error tracking service (e.g., Sentry)
try {
  // AI request logic
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      toolId: toolId,
      function: 'workflow-tool-ai'
    }
  });
  
  throw error;
}
```

---

## 🎓 Best Practices

### System Prompt Design
1. **Be Specific:** Define exact capabilities
2. **Set Boundaries:** Clarify what AI should NOT do
3. **Provide Context:** Include domain knowledge
4. **Use Examples:** Show desired response format
5. **Iterate:** Test and refine based on responses

### Performance Optimization
1. **Cache Responses:** For common questions
2. **Optimize Tokens:** Keep prompts concise
3. **Lazy Load:** Load AI interface only when needed
4. **Debounce Input:** Prevent excessive API calls
5. **Monitor Latency:** Track and optimize slow responses

### Security
1. **Validate Input:** Sanitize all user input
2. **Rate Limiting:** Prevent abuse
3. **Authentication:** Require valid tokens
4. **Data Privacy:** Never log sensitive information
5. **API Key Security:** Use environment variables

### User Experience
1. **Fast Responses:** Aim for < 3 seconds
2. **Clear Errors:** Provide helpful error messages
3. **Graceful Degradation:** Work without AI if needed
4. **Mobile Friendly:** Test on all devices
5. **Accessibility:** Support keyboard navigation

---

## 📚 Additional Resources

### OpenAI Documentation
- [API Reference](https://platform.openai.com/docs/api-reference)
- [Best Practices](https://platform.openai.com/docs/guides/best-practices)
- [Safety Guidelines](https://platform.openai.com/docs/guides/safety)

### Netlify Functions
- [Functions Overview](https://docs.netlify.com/functions/overview/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Build Configuration](https://docs.netlify.com/configure-builds/overview/)

### Related Files
- `workflow-tools-ai.js` - Frontend AI logic
- `workflow-tools-ai.css` - AI interface styling
- `workflow-tool-ai.js` - Backend function
- `workflow-tool.html` - Universal tool page
- `tool-registry.js` - Tool routing

---

## 🤝 Contributing

### Adding Features
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

### Reporting Issues
Include:
- Tool ID
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/device info
- Console errors

### Code Style
- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Follow existing naming conventions
- Write descriptive commit messages

---

## 📝 Change Log

### Version 1.0 (January 6, 2026)
- ✅ Initial implementation
- ✅ 37 tools with AI functionality
- ✅ Universal AI chat interface
- ✅ Backend Netlify function
- ✅ Comprehensive documentation

### Future Versions
- 🔜 Chat history persistence
- 🔜 Multi-turn conversations
- 🔜 Document analysis
- 🔜 Voice input support

---

## 📞 Support

### Developer Support
- **Email:** dev@claimnavigator.com
- **Slack:** #ai-development
- **Documentation:** /docs/ai-integration

### Emergency Contact
- **On-Call:** 1-800-XXX-XXXX
- **Escalation:** CTO@claimnavigator.com

---

**Last Updated:** January 6, 2026  
**Version:** 1.0  
**Maintainer:** Development Team  
**License:** Proprietary



