/**
 * WORKFLOW TOOLS AI INTEGRATION
 * Universal AI functionality for all workflow tools
 * January 2026
 */

// Tool-specific AI configurations
const WORKFLOW_TOOL_AI_CONFIGS = {
  // Step 11 Tools
  'acknowledgment-status-view': {
    systemPrompt: `You are an expert insurance claim submission tracking specialist. Help users understand submission acknowledgment status, timing requirements, and follow-up actions. Provide specific guidance on:
- Acknowledgment receipt requirements by state
- Timeline expectations for carrier acknowledgment
- Red flags for delayed acknowledgment
- Appropriate follow-up actions
- Documentation requirements for proof of submission`,
    placeholder: 'Ask about acknowledgment status, timing, or follow-up actions...',
    suggestedQuestions: [
      'How long should I wait for acknowledgment?',
      'What if the carrier hasn\'t acknowledged my claim?',
      'What documentation proves I submitted my claim?',
      'When should I follow up on my submission?'
    ]
  },
  
  'method-timestamp-view': {
    systemPrompt: `You are an expert in insurance claim submission methods and timing documentation. Help users understand:
- Different submission methods (email, portal, mail, fax)
- Proof of delivery requirements for each method
- Timestamp documentation importance
- State-specific submission rules
- Best practices for documenting submission timing`,
    placeholder: 'Ask about submission methods, timestamps, or proof of delivery...',
    suggestedQuestions: [
      'Which submission method provides the best proof?',
      'How do I document when I submitted my claim?',
      'What if my email wasn\'t delivered?',
      'Do I need certified mail for submission?'
    ]
  },
  
  'followup-schedule-view': {
    systemPrompt: `You are an expert in insurance claim follow-up strategies and timing. Help users:
- Create appropriate follow-up schedules
- Understand state-mandated response timeframes
- Identify when escalation is needed
- Draft professional follow-up communications
- Track carrier responsiveness`,
    placeholder: 'Ask about follow-up timing, escalation, or communication strategies...',
    suggestedQuestions: [
      'How often should I follow up with my carrier?',
      'When should I escalate to a supervisor?',
      'What should I include in a follow-up letter?',
      'How long can the carrier take to respond?'
    ]
  },
  
  'submission-method': {
    systemPrompt: `You are an expert in insurance claim submission methods and requirements. Help users:
- Choose the best submission method for their situation
- Understand carrier-specific submission requirements
- Ensure proper documentation of submission
- Meet policy deadlines and requirements
- Avoid common submission mistakes`,
    placeholder: 'Ask about submission methods, requirements, or best practices...',
    suggestedQuestions: [
      'What\'s the best way to submit my claim?',
      'Does my carrier require a specific submission method?',
      'How do I ensure my submission is received?',
      'Can I submit my claim online?'
    ]
  },
  
  'claim-submitter': {
    systemPrompt: `You are an expert in final claim package submission and documentation. Help users:
- Prepare complete submission packages
- Include all required documentation
- Draft professional cover letters
- Track submission confirmation
- Ensure compliance with all requirements`,
    placeholder: 'Ask about claim submission, required documents, or cover letters...',
    suggestedQuestions: [
      'What documents should I include in my submission?',
      'How do I write a professional cover letter?',
      'What if I\'m missing some documents?',
      'Should I include a summary with my claim?'
    ]
  },
  
  // Step 6 Tools
  'ale-tracker': {
    systemPrompt: `You are an expert in Additional Living Expenses (ALE) coverage and tracking. Help users:
- Understand ALE eligibility and coverage limits
- Track and categorize ALE expenses properly
- Identify covered vs. non-covered expenses
- Calculate remaining ALE benefits
- Document expenses for maximum recovery
- Understand time limits and reasonableness standards`,
    placeholder: 'Ask about ALE expenses, eligibility, limits, or documentation...',
    suggestedQuestions: [
      'What expenses are covered under ALE?',
      'How long can I claim ALE benefits?',
      'Are restaurant meals covered?',
      'How do I calculate my remaining ALE limit?',
      'What receipts do I need to keep?'
    ]
  },
  
  'expense-upload-tool': {
    systemPrompt: `You are an expert in expense documentation and receipt management for insurance claims. Help users:
- Organize and categorize expense receipts
- Ensure proper documentation for each expense
- Identify missing or incomplete documentation
- Create expense summaries and reports
- Meet carrier documentation requirements`,
    placeholder: 'Ask about receipt organization, documentation requirements, or expense tracking...',
    suggestedQuestions: [
      'What information should be on each receipt?',
      'How should I organize my expense receipts?',
      'What if I lost a receipt?',
      'Do I need to explain each expense?'
    ]
  },
  
  'temporary-housing-documentation-helper': {
    systemPrompt: `You are an expert in temporary housing claims and documentation. Help users:
- Document temporary housing arrangements
- Calculate reasonable housing costs
- Compare temporary vs. normal housing expenses
- Understand policy limits on temporary housing
- Justify housing choices and costs
- Track duration and necessity of temporary housing`,
    placeholder: 'Ask about temporary housing costs, documentation, or policy limits...',
    suggestedQuestions: [
      'How much can I spend on temporary housing?',
      'Do I need to find the cheapest option?',
      'Can I stay with family and claim ALE?',
      'How do I document my temporary housing?',
      'What if my temporary housing costs more than my mortgage?'
    ]
  },
  
  // Step 12 Tools
  'carrier-request-logger': {
    systemPrompt: `You are an expert in managing insurance carrier requests and information demands. Help users:
- Evaluate legitimacy of carrier requests
- Identify overreaching or improper requests
- Determine appropriate response scope
- Track request deadlines and responses
- Recognize bad faith request patterns
- Draft professional responses to requests`,
    placeholder: 'Ask about carrier requests, response obligations, or request legitimacy...',
    suggestedQuestions: [
      'Is this carrier request legitimate?',
      'Do I have to provide everything they asked for?',
      'How long do I have to respond?',
      'What if the request seems excessive?',
      'Can I object to a carrier request?'
    ]
  },
  
  'deadline-response-tracker': {
    systemPrompt: `You are an expert in insurance claim deadlines and response timing. Help users:
- Track all claim-related deadlines
- Understand state-mandated response times
- Calculate appropriate response deadlines
- Identify missed or approaching deadlines
- Request deadline extensions when appropriate
- Document all deadline compliance`,
    placeholder: 'Ask about deadlines, response times, or deadline extensions...',
    suggestedQuestions: [
      'What are my response deadlines?',
      'Can I request more time to respond?',
      'What happens if I miss a deadline?',
      'How long does the carrier have to respond?',
      'Are weekends counted in deadline calculations?'
    ]
  },
  
  'document-production-checklist': {
    systemPrompt: `You are an expert in insurance claim document production and discovery responses. Help users:
- Create comprehensive document production lists
- Identify privileged or protected documents
- Organize documents for production
- Ensure complete but appropriate responses
- Avoid over-production of documents
- Maintain document control and tracking`,
    placeholder: 'Ask about document production, organization, or privilege issues...',
    suggestedQuestions: [
      'What documents should I produce?',
      'Can I withhold any documents?',
      'How should I organize my document production?',
      'What if I don\'t have a requested document?',
      'Do I need to produce personal financial records?'
    ]
  },
  
  // Step 10 Tools
  'claim-package-assembly': {
    systemPrompt: `You are an expert in assembling comprehensive insurance claim packages. Help users:
- Organize all claim documentation
- Ensure completeness of the claim package
- Create logical document organization
- Include all required forms and statements
- Prepare professional presentation
- Identify missing or incomplete documentation`,
    placeholder: 'Ask about claim package organization, required documents, or presentation...',
    suggestedQuestions: [
      'What should be in my claim package?',
      'How should I organize my documents?',
      'What forms are required?',
      'Should I include a table of contents?',
      'How do I present photos and estimates?'
    ]
  },
  
  // Step 2 Tools
  'compliance-auto-import': {
    systemPrompt: `You are an expert in insurance policy compliance requirements. Help users:
- Import and analyze policy compliance duties
- Identify all policyholder obligations
- Extract deadlines and requirements
- Highlight critical compliance issues
- Create compliance checklists
- Understand consequences of non-compliance`,
    placeholder: 'Ask about policy compliance, duties, or requirements...',
    suggestedQuestions: [
      'What are my policy compliance duties?',
      'What deadlines do I need to meet?',
      'What happens if I don\'t comply?',
      'How do I prove I complied?'
    ]
  },
  
  'compliance-review': {
    systemPrompt: `You are an expert in reviewing insurance claim compliance status. Help users:
- Review compliance with all policy duties
- Identify compliance gaps or issues
- Assess risk of non-compliance
- Create remediation plans
- Document compliance efforts
- Understand carrier compliance arguments`,
    placeholder: 'Ask about compliance status, gaps, or remediation...',
    suggestedQuestions: [
      'Am I in compliance with my policy?',
      'What compliance issues do I have?',
      'How do I fix compliance problems?',
      'Can the carrier deny my claim for non-compliance?'
    ]
  },
  
  'compliance-report-viewer': {
    systemPrompt: `You are an expert in interpreting insurance compliance reports. Help users:
- Understand compliance report findings
- Interpret compliance scores and ratings
- Identify priority compliance actions
- Understand compliance risk levels
- Plan compliance improvements
- Use reports for claim defense`,
    placeholder: 'Ask about compliance reports, findings, or recommendations...',
    suggestedQuestions: [
      'What does my compliance report mean?',
      'What are the most important findings?',
      'How serious are my compliance issues?',
      'What should I do first?'
    ]
  },
  
  'mitigation-documentation-tool': {
    systemPrompt: `You are an expert in property damage mitigation and documentation. Help users:
- Document all mitigation efforts
- Understand mitigation requirements
- Track mitigation costs and actions
- Prove reasonable mitigation steps
- Identify additional mitigation needs
- Defend against mitigation failure claims`,
    placeholder: 'Ask about mitigation requirements, documentation, or costs...',
    suggestedQuestions: [
      'What mitigation steps are required?',
      'How do I document my mitigation efforts?',
      'Are mitigation costs covered?',
      'What if I couldn\'t mitigate immediately?',
      'Can the carrier deny my claim for failure to mitigate?'
    ]
  },
  
  'proof-of-loss-tracker': {
    systemPrompt: `You are an expert in Proof of Loss requirements and preparation. Help users:
- Understand Proof of Loss requirements
- Track Proof of Loss deadlines
- Prepare accurate Proof of Loss statements
- Avoid common Proof of Loss mistakes
- Understand consequences of errors
- Amend or supplement Proof of Loss when needed`,
    placeholder: 'Ask about Proof of Loss requirements, deadlines, or preparation...',
    suggestedQuestions: [
      'What is a Proof of Loss?',
      'When is my Proof of Loss due?',
      'What information goes in a Proof of Loss?',
      'Can I change my Proof of Loss later?',
      'What happens if I miss the Proof of Loss deadline?'
    ]
  },
  
  // Step 3 Tools
  'damage-documentation-tool': {
    systemPrompt: `You are an expert in property damage documentation. Help users:
- Document all types of property damage
- Take effective damage photos and videos
- Create detailed damage descriptions
- Organize damage by location and type
- Identify hidden or secondary damage
- Meet carrier documentation standards`,
    placeholder: 'Ask about damage documentation, photos, or descriptions...',
    suggestedQuestions: [
      'How should I photograph damage?',
      'What details should I document?',
      'How do I describe damage properly?',
      'What if I can\'t access damaged areas?'
    ]
  },
  
  'damage-labeling-tool': {
    systemPrompt: `You are an expert in damage photo labeling and organization. Help users:
- Label damage photos effectively
- Create consistent labeling systems
- Organize photos by room and damage type
- Include necessary photo metadata
- Cross-reference photos with estimates
- Meet carrier photo requirements`,
    placeholder: 'Ask about photo labeling, organization, or requirements...',
    suggestedQuestions: [
      'How should I label my damage photos?',
      'What information should be in photo labels?',
      'How do I organize hundreds of photos?',
      'Should I include dates in photo labels?'
    ]
  },
  
  'damage-report-viewer': {
    systemPrompt: `You are an expert in interpreting damage assessment reports. Help users:
- Understand damage report findings
- Identify all documented damage
- Spot missing or incomplete damage documentation
- Compare damage reports to actual damage
- Use reports for claim support
- Identify report deficiencies`,
    placeholder: 'Ask about damage reports, findings, or documentation gaps...',
    suggestedQuestions: [
      'What does my damage report show?',
      'Is all my damage documented?',
      'What damage is missing from the report?',
      'How do I use this report with my carrier?'
    ]
  },
  
  'photo-upload-organizer': {
    systemPrompt: `You are an expert in organizing and managing claim photos. Help users:
- Upload and organize claim photos
- Create logical photo organization systems
- Ensure photo quality and clarity
- Track photo coverage of all damage
- Prepare photos for carrier submission
- Manage large photo collections`,
    placeholder: 'Ask about photo organization, upload, or management...',
    suggestedQuestions: [
      'How should I organize my claim photos?',
      'What photo format should I use?',
      'How many photos do I need?',
      'How do I submit photos to my carrier?'
    ]
  },
  
  // Step 7 Tools
  'contents-inventory': {
    systemPrompt: `You are an expert in personal property inventory for insurance claims. Help users:
- Create comprehensive contents inventories
- Identify all damaged or lost items
- Organize items by room and category
- Include necessary item details
- Estimate quantities and values
- Avoid common inventory mistakes`,
    placeholder: 'Ask about contents inventory, item details, or organization...',
    suggestedQuestions: [
      'How do I create a contents inventory?',
      'What details do I need for each item?',
      'How do I remember everything I lost?',
      'Should I include undamaged items?'
    ]
  },
  
  'contents-documentation-helper': {
    systemPrompt: `You are an expert in documenting personal property for insurance claims. Help users:
- Document item details and condition
- Find proof of ownership and value
- Take effective photos of contents
- Describe items accurately
- Organize contents documentation
- Meet carrier documentation requirements`,
    placeholder: 'Ask about contents documentation, proof, or descriptions...',
    suggestedQuestions: [
      'How do I prove I owned an item?',
      'What if I don\'t have receipts?',
      'How should I photograph my contents?',
      'What details matter for contents claims?'
    ]
  },
  
  'room-by-room-prompt-tool': {
    systemPrompt: `You are an expert in room-by-room inventory methods. Help users:
- Use room-by-room inventory techniques
- Remember items in each room
- Identify commonly forgotten items
- Organize inventory by location
- Ensure complete room coverage
- Avoid missing valuable items`,
    placeholder: 'Ask about room-by-room inventory, forgotten items, or techniques...',
    suggestedQuestions: [
      'How do I do a room-by-room inventory?',
      'What items do people commonly forget?',
      'Should I inventory closets separately?',
      'How detailed should I be for each room?'
    ]
  },
  
  // Step 4 Tools
  'contractor-scope-checklist': {
    systemPrompt: `You are an expert in contractor repair scopes and estimates. Help users:
- Review contractor scope completeness
- Identify missing repair items
- Understand scope of work details
- Compare scopes to actual damage
- Identify code upgrade requirements
- Spot scope deficiencies or errors`,
    placeholder: 'Ask about contractor scopes, completeness, or missing items...',
    suggestedQuestions: [
      'Is my contractor\'s scope complete?',
      'What\'s missing from this scope?',
      'Should code upgrades be included?',
      'How detailed should the scope be?'
    ]
  },
  
  // Step 9 Tools
  'coverage-mapping-visualizer': {
    systemPrompt: `You are an expert in insurance coverage mapping and analysis. Help users:
- Map damage to policy coverage sections
- Identify applicable coverage provisions
- Understand coverage overlaps and gaps
- Visualize coverage relationships
- Identify sublimit impacts
- Optimize coverage utilization`,
    placeholder: 'Ask about coverage mapping, applicable provisions, or coverage gaps...',
    suggestedQuestions: [
      'Which coverage applies to my damage?',
      'Do I have coverage gaps?',
      'What are my sublimits?',
      'How do I maximize my coverage?'
    ]
  },
  
  // Step 1 Tools
  'policy-report-viewer': {
    systemPrompt: `You are an expert in insurance policy analysis and interpretation. Help users:
- Understand policy report findings
- Interpret coverage provisions
- Identify important policy terms
- Understand limits and sublimits
- Recognize exclusions and restrictions
- Use policy reports for claim strategy`,
    placeholder: 'Ask about policy reports, coverage, or policy terms...',
    suggestedQuestions: [
      'What does my policy report show?',
      'What are my coverage limits?',
      'What exclusions apply to me?',
      'How do I use this report for my claim?'
    ]
  },
  
  'policy-uploader': {
    systemPrompt: `You are an expert in insurance policy document management. Help users:
- Upload and organize policy documents
- Identify required policy documents
- Ensure complete policy documentation
- Extract key policy information
- Prepare policies for AI analysis
- Manage policy versions and endorsements`,
    placeholder: 'Ask about policy uploads, required documents, or organization...',
    suggestedQuestions: [
      'What policy documents should I upload?',
      'Do I need to upload endorsements?',
      'What if I have multiple policy versions?',
      'How do I find my policy documents?'
    ]
  },
  
  'download-policy-report': {
    systemPrompt: `You are an expert in policy report generation and use. Help users:
- Download and use policy reports
- Understand report formats
- Share reports with professionals
- Use reports for claim documentation
- Interpret report sections
- Update reports with new information`,
    placeholder: 'Ask about downloading reports, formats, or report use...',
    suggestedQuestions: [
      'What format should I download?',
      'Can I share this report with my contractor?',
      'How do I update my policy report?',
      'What sections are most important?'
    ]
  },
  
  'download-submission-report': {
    systemPrompt: `You are an expert in claim submission reports and documentation. Help users:
- Download submission reports
- Understand submission documentation
- Use reports for proof of submission
- Share reports with carriers
- Track submission status
- Maintain submission records`,
    placeholder: 'Ask about submission reports, proof of submission, or documentation...',
    suggestedQuestions: [
      'What\'s in my submission report?',
      'How do I prove I submitted my claim?',
      'Should I send this report to my carrier?',
      'How long should I keep submission records?'
    ]
  },
  
  // Step 11 Acknowledgment Tools
  'step1-acknowledgment': {
    systemPrompt: `You are an expert in Step 1 (Policy Review) completion and requirements. Help users understand what they've accomplished and what comes next.`,
    placeholder: 'Ask about Step 1 completion or next steps...',
    suggestedQuestions: [
      'What did I accomplish in Step 1?',
      'What should I do next?',
      'Can I skip any steps?'
    ]
  },
  
  'step2-acknowledgment': {
    systemPrompt: `You are an expert in Step 2 (Compliance) completion and requirements. Help users understand compliance status and next steps.`,
    placeholder: 'Ask about Step 2 completion or compliance status...',
    suggestedQuestions: [
      'Am I compliant with my policy duties?',
      'What did I accomplish in Step 2?',
      'What comes next?'
    ]
  },
  
  'step3-acknowledgment': {
    systemPrompt: `You are an expert in Step 3 (Damage Documentation) completion. Help users understand documentation completeness and next steps.`,
    placeholder: 'Ask about Step 3 completion or documentation status...',
    suggestedQuestions: [
      'Is my damage documentation complete?',
      'What did I accomplish in Step 3?',
      'What should I do next?'
    ]
  },
  
  'step11-acknowledgment': {
    systemPrompt: `You are an expert in Step 11 (Claim Submission) completion. Help users understand submission status and next steps.`,
    placeholder: 'Ask about Step 11 completion or submission status...',
    suggestedQuestions: [
      'Did I submit my claim correctly?',
      'What happens after submission?',
      'What should I do next?'
    ]
  },
  
  'step11-next-moves': {
    systemPrompt: `You are an expert in post-submission claim strategy. Help users:
- Understand what happens after claim submission
- Plan appropriate follow-up actions
- Prepare for carrier responses
- Identify next steps and timing
- Recognize red flags in carrier behavior
- Maintain claim momentum`,
    placeholder: 'Ask about next steps after submission, follow-up, or carrier responses...',
    suggestedQuestions: [
      'What should I do after submitting my claim?',
      'When will I hear from my carrier?',
      'How should I follow up?',
      'What should I expect next?'
    ]
  }
};

/**
 * Create AI chat interface for a workflow tool
 * @param {string} toolId - Tool identifier
 * @param {HTMLElement} container - Container element for the AI interface
 * @param {object} options - Additional options
 */
function createWorkflowToolAI(toolId, container, options = {}) {
  const config = WORKFLOW_TOOL_AI_CONFIGS[toolId];
  
  if (!config) {
    console.warn(`No AI configuration found for tool: ${toolId}`);
    return null;
  }
  
  // Create AI interface HTML
  const aiInterface = document.createElement('div');
  aiInterface.className = 'workflow-tool-ai-interface';
  aiInterface.innerHTML = `
    <div class="ai-chat-header">
      <div class="ai-chat-title">
        <span class="ai-icon">🤖</span>
        <span>AI Assistant</span>
      </div>
      <button class="ai-chat-toggle" onclick="toggleWorkflowAI('${toolId}')">
        <span class="toggle-icon">−</span>
      </button>
    </div>
    
    <div class="ai-chat-body">
      <div class="ai-chat-messages" id="ai-messages-${toolId}">
        <div class="ai-message ai-message-assistant">
          <div class="ai-message-content">
            <p>Hi! I'm your AI assistant for this tool. I can help you with:</p>
            <ul class="ai-suggestions-list">
              ${config.suggestedQuestions.map(q => `
                <li class="ai-suggestion-item" onclick="askWorkflowAI('${toolId}', '${q.replace(/'/g, "\\'")}')">
                  ${q}
                </li>
              `).join('')}
            </ul>
            <p>Or ask me anything else about this tool!</p>
          </div>
        </div>
      </div>
      
      <div class="ai-chat-input-container">
        <textarea 
          id="ai-input-${toolId}" 
          class="ai-chat-input" 
          placeholder="${config.placeholder}"
          rows="2"
          onkeydown="handleWorkflowAIKeydown(event, '${toolId}')"
        ></textarea>
        <button class="ai-chat-send" onclick="sendWorkflowAIMessage('${toolId}')">
          <span class="send-icon">➤</span>
        </button>
      </div>
      
      <div class="ai-chat-footer">
        <span class="ai-disclaimer">AI responses are for guidance only. Verify important information.</span>
      </div>
    </div>
  `;
  
  container.appendChild(aiInterface);
  
  return aiInterface;
}

/**
 * Toggle AI interface visibility
 */
function toggleWorkflowAI(toolId) {
  const aiInterface = document.querySelector('.workflow-tool-ai-interface');
  if (aiInterface) {
    aiInterface.classList.toggle('collapsed');
    const toggleIcon = aiInterface.querySelector('.toggle-icon');
    if (toggleIcon) {
      toggleIcon.textContent = aiInterface.classList.contains('collapsed') ? '+' : '−';
    }
  }
}

/**
 * Send AI message
 */
async function sendWorkflowAIMessage(toolId) {
  const input = document.getElementById(`ai-input-${toolId}`);
  const message = input.value.trim();
  
  if (!message) return;
  
  // Clear input
  input.value = '';
  
  // Add user message to chat
  addWorkflowAIMessage(toolId, message, 'user');
  
  // Show typing indicator
  const typingId = addWorkflowAITypingIndicator(toolId);
  
  try {
    // Get AI response
    const response = await getWorkflowAIResponse(toolId, message);
    
    // Remove typing indicator
    removeWorkflowAITypingIndicator(typingId);
    
    // Add AI response to chat
    addWorkflowAIMessage(toolId, response, 'assistant');
    
  } catch (error) {
    console.error('AI response error:', error);
    removeWorkflowAITypingIndicator(typingId);
    addWorkflowAIMessage(toolId, 'I apologize, but I encountered an error. Please try again or contact support if the problem persists.', 'assistant', true);
  }
}

/**
 * Ask AI a suggested question
 */
function askWorkflowAI(toolId, question) {
  const input = document.getElementById(`ai-input-${toolId}`);
  if (input) {
    input.value = question;
    sendWorkflowAIMessage(toolId);
  }
}

/**
 * Handle keyboard shortcuts in AI input
 */
function handleWorkflowAIKeydown(event, toolId) {
  // Send on Ctrl+Enter or Cmd+Enter
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    sendWorkflowAIMessage(toolId);
  }
}

/**
 * Add message to chat
 */
function addWorkflowAIMessage(toolId, content, role, isError = false) {
  const messagesContainer = document.getElementById(`ai-messages-${toolId}`);
  if (!messagesContainer) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ai-message-${role}${isError ? ' ai-message-error' : ''}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'ai-message-content';
  
  // Format content (convert markdown-style formatting)
  const formattedContent = formatAIContent(content);
  contentDiv.innerHTML = formattedContent;
  
  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageDiv;
}

/**
 * Add typing indicator
 */
function addWorkflowAITypingIndicator(toolId) {
  const messagesContainer = document.getElementById(`ai-messages-${toolId}`);
  if (!messagesContainer) return null;
  
  const typingDiv = document.createElement('div');
  typingDiv.className = 'ai-message ai-message-assistant ai-typing';
  typingDiv.id = `typing-${Date.now()}`;
  typingDiv.innerHTML = `
    <div class="ai-message-content">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return typingDiv.id;
}

/**
 * Remove typing indicator
 */
function removeWorkflowAITypingIndicator(typingId) {
  if (typingId) {
    const typingDiv = document.getElementById(typingId);
    if (typingDiv) {
      typingDiv.remove();
    }
  }
}

/**
 * Get AI response from backend
 */
async function getWorkflowAIResponse(toolId, userMessage) {
  const config = WORKFLOW_TOOL_AI_CONFIGS[toolId];
  if (!config) {
    throw new Error('Tool configuration not found');
  }
  
  // Get claim context if available
  const claimContext = getClaimContextForAI();
  
  // Call AI endpoint
  const response = await fetch('/.netlify/functions/workflow-tool-ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`
    },
    body: JSON.stringify({
      toolId: toolId,
      userMessage: userMessage,
      systemPrompt: config.systemPrompt,
      claimContext: claimContext
    })
  });
  
  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.response || 'I apologize, but I couldn\'t generate a response. Please try again.';
}

/**
 * Get claim context for AI
 */
function getClaimContextForAI() {
  // Gather relevant claim information from storage
  const context = {
    claimNumber: localStorage.getItem('claim_number') || 'Not set',
    lossDate: localStorage.getItem('loss_date') || 'Not set',
    lossType: localStorage.getItem('loss_type') || 'Not set',
    carrier: localStorage.getItem('carrier_name') || 'Not set',
    policyNumber: localStorage.getItem('policy_number') || 'Not set'
  };
  
  // Add step completion status
  const completedSteps = JSON.parse(localStorage.getItem('completed_steps') || '[]');
  context.completedSteps = completedSteps;
  
  return context;
}

/**
 * Get auth token
 */
async function getAuthToken() {
  // Try to get token from auth system
  if (window.CNAuth && typeof window.CNAuth.getToken === 'function') {
    return await window.CNAuth.getToken();
  }
  
  // Fallback to localStorage
  return localStorage.getItem('auth_token') || '';
}

/**
 * Format AI content (basic markdown-style formatting)
 */
function formatAIContent(content) {
  let formatted = content;
  
  // Convert **bold** to <strong>
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Convert line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Convert bullet points
  formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Convert numbered lists
  formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  return formatted;
}

// Export functions for global use
if (typeof window !== 'undefined') {
  window.createWorkflowToolAI = createWorkflowToolAI;
  window.toggleWorkflowAI = toggleWorkflowAI;
  window.sendWorkflowAIMessage = sendWorkflowAIMessage;
  window.askWorkflowAI = askWorkflowAI;
  window.handleWorkflowAIKeydown = handleWorkflowAIKeydown;
}



