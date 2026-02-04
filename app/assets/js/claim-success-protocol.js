/**
 * Claim Success Protocol™
 * 7-Step Linear Flow with Enforcement
 */

(function() {
  'use strict';

  const PROTOCOL_STEPS = [
    {
      step: 1,
      title: 'Understanding Your Policy',
      consequence: '⚠️ Skipping weakens your claim foundation',
      explanation: {
        what: 'Review your insurance policy to understand your coverage, limits, deductibles, and obligations.',
        why: 'Without knowing what your policy covers, you cannot effectively argue for what you deserve. Insurance companies count on policyholders not reading their policies.',
        bullets: [
          'Identify coverage types (dwelling, contents, ALE, etc.)',
          'Note policy limits and sub-limits',
          'Understand your deductible',
          'Review exclusions and conditions',
          'Identify deadlines and notice requirements'
        ]
      },
      tools: [
        {
          id: 'coverage-decoder',
          name: 'Coverage Decoder',
          url: '/app/resource-center/coverage-decoder.html'
        },
        {
          id: 'policy-review',
          name: 'AI Policy Review',
          url: '/app/resource-center/ai-response-agent.html'
        }
      ],
      completionCriteria: [
        { id: 'policy-uploaded', label: 'I have uploaded or reviewed my insurance policy' },
        { id: 'coverage-identified', label: 'I have identified my coverage types and limits' },
        { id: 'deadlines-noted', label: 'I have noted all important deadlines' }
      ]
    },
    {
      step: 2,
      title: 'Documenting Your Loss',
      consequence: '⚠️ Missing evidence = denied claims',
      explanation: {
        what: 'Create comprehensive documentation of all damage, losses, and expenses related to your claim.',
        why: 'Insurance companies pay based on proof. The burden of proof is on you. Without thorough documentation, you cannot prove your loss.',
        bullets: [
          'Photograph and video all damage from multiple angles',
          'Create detailed inventory of damaged/lost items',
          'Collect receipts, invoices, and proof of ownership',
          'Document temporary repairs and mitigation efforts',
          'Organize evidence in a systematic way'
        ]
      },
      tools: [
        {
          id: 'evidence-organizer',
          name: 'Evidence Organizer',
          url: '/app/resource-center/evidence-organizer.html'
        },
        {
          id: 'damage-documentation',
          name: 'Damage Documentation Guide',
          url: '/app/resource-center/claim-journal.html'
        }
      ],
      completionCriteria: [
        { id: 'photos-uploaded', label: 'I have uploaded photos/videos of all damage' },
        { id: 'inventory-created', label: 'I have created an inventory of damaged items' },
        { id: 'receipts-collected', label: 'I have collected receipts and proof of ownership' }
      ]
    },
    {
      step: 3,
      title: 'Communicating Effectively',
      consequence: '⚠️ Poor communication delays and reduces settlements',
      explanation: {
        what: 'Establish professional, documented communication with your insurance company and adjuster.',
        why: 'Everything you say can be used against you. Insurance adjusters are trained to minimize payouts. Professional, documented communication protects your claim.',
        bullets: [
          'Always communicate in writing (email, certified mail)',
          'Use professional, factual language',
          'Reference policy provisions and deadlines',
          'Keep detailed logs of all conversations',
          'Never admit fault or speculate about damages'
        ]
      },
      tools: [
        {
          id: 'ai-response-agent',
          name: 'AI Response Agent',
          url: '/app/resource-center/ai-response-agent.html'
        },
        {
          id: 'communication-scripts',
          name: 'Communication Scripts',
          url: '/app/resource-center/document-generator.html'
        }
      ],
      completionCriteria: [
        { id: 'initial-notice', label: 'I have sent formal notice of loss to my insurer' },
        { id: 'communication-log', label: 'I am maintaining a communication log' },
        { id: 'professional-tone', label: 'I understand how to communicate professionally' }
      ]
    },
    {
      step: 4,
      title: 'Validating the Estimate',
      consequence: '⚠️ Accepting low estimates = leaving money on the table',
      explanation: {
        what: 'Review, challenge, and validate the insurance company\'s damage estimate and scope of work.',
        why: 'Insurance company estimates are often incomplete, use cheap materials, or skip hidden damage. You have the right to challenge their estimate.',
        bullets: [
          'Get independent contractor estimates',
          'Compare line-by-line with insurer estimate',
          'Identify missing items and depreciation issues',
          'Document disagreements with photos and expert opinions',
          'Understand replacement cost vs. actual cash value'
        ]
      },
      tools: [
        {
          id: 'estimate-review',
          name: 'Estimate Review Tool',
          url: '/app/resource-center/claim-analysis.html'
        },
        {
          id: 'scope-validator',
          name: 'Scope Validation Checklist',
          url: '/app/resource-center/maximize-claim.html'
        }
      ],
      completionCriteria: [
        { id: 'estimate-received', label: 'I have received the insurance company estimate' },
        { id: 'independent-estimate', label: 'I have obtained independent contractor estimates' },
        { id: 'discrepancies-identified', label: 'I have identified discrepancies and missing items' }
      ]
    },
    {
      step: 5,
      title: 'Submitting Your Claim',
      consequence: '⚠️ Incomplete submissions trigger denials',
      explanation: {
        what: 'Compile and submit a complete, professional claim package with all required documentation.',
        why: 'Insurance companies look for reasons to deny or delay. A complete, professional submission removes their excuses and establishes your credibility.',
        bullets: [
          'Complete all required forms accurately',
          'Include comprehensive evidence package',
          'Submit proof of loss statement',
          'Include independent estimates and expert opinions',
          'Send via certified mail with return receipt'
        ]
      },
      tools: [
        {
          id: 'document-generator',
          name: 'Document Generator',
          url: '/app/resource-center/document-generator.html'
        },
        {
          id: 'demand-letter',
          name: 'Early Demand Letter',
          url: '/app/resource-center/ai-response-agent.html'
        }
      ],
      completionCriteria: [
        { id: 'forms-completed', label: 'All required forms are completed' },
        { id: 'evidence-compiled', label: 'Complete evidence package is compiled' },
        { id: 'claim-submitted', label: 'Claim has been submitted with proof of delivery' }
      ]
    },
    {
      step: 6,
      title: 'Negotiating Your Settlement',
      consequence: '⚠️ Accepting first offer = accepting less than you deserve',
      explanation: {
        what: 'Negotiate strategically with the insurance company to maximize your settlement.',
        why: 'First offers are almost always low. Insurance companies expect negotiation. You must advocate for full compensation.',
        bullets: [
          'Never accept the first offer',
          'Counter with documented justification',
          'Use policy language to support your position',
          'Escalate to supervisors when necessary',
          'Know when to involve legal counsel or public adjuster'
        ]
      },
      tools: [
        {
          id: 'negotiation-tools',
          name: 'Negotiation Tools',
          url: '/app/resource-center/negotiation-tools.html'
        },
        {
          id: 'denial-response',
          name: 'Denial Response Generator',
          url: '/app/resource-center/ai-response-agent.html'
        },
        {
          id: 'supplemental-claim',
          name: 'Supplemental Claim Tools',
          url: '/app/resource-center/maximize-claim.html'
        }
      ],
      completionCriteria: [
        { id: 'offer-received', label: 'I have received an initial offer' },
        { id: 'counteroffer-prepared', label: 'I have prepared a documented counteroffer' },
        { id: 'negotiation-strategy', label: 'I understand my negotiation strategy' }
      ]
    },
    {
      step: 7,
      title: 'Finalizing Your Claim',
      consequence: '⚠️ Signing too early = waiving future rights',
      explanation: {
        what: 'Review settlement terms, finalize documentation, and properly close your claim.',
        why: 'Settlement agreements often include releases that waive future claims. You must ensure all damage is addressed before signing.',
        bullets: [
          'Review settlement agreement carefully',
          'Ensure all damage is included',
          'Understand what rights you\'re waiving',
          'Document final settlement terms',
          'Archive all claim documentation for future reference'
        ]
      },
      tools: [
        {
          id: 'settlement-review',
          name: 'Settlement Review Checklist',
          url: '/app/resource-center/claim-analysis.html'
        },
        {
          id: 'archive-generator',
          name: 'Claim Archive Generator',
          url: '/app/resource-center/document-generator.html'
        }
      ],
      completionCriteria: [
        { id: 'settlement-reviewed', label: 'I have reviewed the settlement agreement' },
        { id: 'all-damage-included', label: 'All damage is included in the settlement' },
        { id: 'claim-archived', label: 'I have archived all claim documentation' }
      ]
    }
  ];

  class ClaimSuccessProtocol {
    constructor() {
      this.currentStep = 1;
      this.completedSteps = [];
      this.stepProgress = {};
      this.userId = null;
      this.supabase = null;
    }

    async init() {
      try {
        // Get Supabase client
        this.supabase = await window.getSupabaseClient();
        
        // Get current user
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) {
          window.location.href = '/auth/login.html';
          return;
        }
        this.userId = user.id;

        // Load progress from database
        await this.loadProgress();

        // Render current step
        this.renderStep();
      } catch (error) {
        console.error('Protocol init error:', error);
        if (window.CNToast) {
          window.CNToast.error('Failed to initialize protocol');
        }
      }
    }

    async loadProgress() {
      try {
        const { data, error } = await this.supabase
          .from('protocol_progress')
          .select('*')
          .eq('user_id', this.userId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
          console.error('Load progress error:', error);
          return;
        }

        if (data) {
          this.currentStep = data.current_step || 1;
          this.completedSteps = data.completed_steps || [];
          this.stepProgress = data.step_progress || {};
        }
      } catch (error) {
        console.error('Load progress error:', error);
      }
    }

    async saveProgress() {
      try {
        const progressData = {
          user_id: this.userId,
          current_step: this.currentStep,
          completed_steps: this.completedSteps,
          step_progress: this.stepProgress,
          updated_at: new Date().toISOString()
        };

        const { error } = await this.supabase
          .from('protocol_progress')
          .upsert(progressData, { onConflict: 'user_id' });

        if (error) {
          console.error('Save progress error:', error);
        }
      } catch (error) {
        console.error('Save progress error:', error);
      }
    }

    renderStep() {
      const step = PROTOCOL_STEPS[this.currentStep - 1];
      if (!step) {
        this.renderComplete();
        return;
      }

      // Update progress indicator
      this.updateProgressIndicator(step);

      // Render step content
      const container = document.getElementById('step-content-container');
      const isComplete = this.completedSteps.includes(this.currentStep);

      container.innerHTML = `
        <div class="step-content">
          ${isComplete ? '<div class="step-complete-badge">✓ Step Complete</div>' : ''}
          
          <h2 class="step-title">${step.title}</h2>
          
          <div class="step-explanation">
            <h3>What You'll Do:</h3>
            <p>${step.explanation.what}</p>
            
            <h3>Why This Matters:</h3>
            <p>${step.explanation.why}</p>
            
            <h3>Key Actions:</h3>
            <ul>
              ${step.explanation.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
            </ul>
          </div>

          <div class="step-tools">
            <div class="tool-header">
              <h3>🛠️ This tool supports Step ${step.step} of the Claim Success Protocol™</h3>
            </div>
            
            ${step.tools.map(tool => `
              <div style="margin-bottom: 16px;">
                <a href="${tool.url}" target="_blank" class="btn-nav-next" style="display: inline-block; text-decoration: none;">
                  Open ${tool.name} →
                </a>
              </div>
            `).join('')}
          </div>

          <div class="completion-actions">
            <h3 style="color: #ffffff; margin-bottom: 16px;">Complete These Actions:</h3>
            ${step.completionCriteria.map(criteria => `
              <div class="completion-checkbox">
                <input 
                  type="checkbox" 
                  id="${criteria.id}" 
                  ${this.stepProgress[this.currentStep]?.[criteria.id] ? 'checked' : ''}
                  onchange="window.ClaimSuccessProtocol.updateCriteria('${criteria.id}', this.checked)"
                >
                <label for="${criteria.id}">${criteria.label}</label>
              </div>
            `).join('')}
          </div>

          <div class="step-navigation">
            <button 
              class="btn-nav btn-nav-prev" 
              onclick="window.ClaimSuccessProtocol.previousStep()"
              ${this.currentStep === 1 ? 'style="visibility: hidden;"' : ''}
            >
              ← Previous Step
            </button>
            <button 
              class="btn-nav btn-nav-next" 
              onclick="window.ClaimSuccessProtocol.nextStep()"
              ${!this.canAdvance() ? 'disabled' : ''}
            >
              ${this.currentStep === 7 ? 'Complete Protocol' : 'Next Step'} →
            </button>
          </div>
        </div>
      `;
    }

    updateProgressIndicator(step) {
      const progressPercent = Math.round((this.currentStep / 7) * 100);
      
      document.getElementById('step-label').textContent = `Step ${step.step} of 7`;
      document.getElementById('step-count').textContent = `${progressPercent}% Complete`;
      document.getElementById('progress-bar').style.width = `${progressPercent}%`;
      document.getElementById('step-title-progress').textContent = step.title;
      document.getElementById('consequence-text').textContent = step.consequence;
    }

    updateCriteria(criteriaId, checked) {
      if (!this.stepProgress[this.currentStep]) {
        this.stepProgress[this.currentStep] = {};
      }
      this.stepProgress[this.currentStep][criteriaId] = checked;
      
      // Save progress
      this.saveProgress();

      // Update next button state
      const nextBtn = document.querySelector('.btn-nav-next');
      if (nextBtn) {
        nextBtn.disabled = !this.canAdvance();
      }
    }

    canAdvance() {
      const step = PROTOCOL_STEPS[this.currentStep - 1];
      if (!step) return false;

      // Check if all completion criteria are met
      const progress = this.stepProgress[this.currentStep] || {};
      return step.completionCriteria.every(criteria => progress[criteria.id]);
    }

    async nextStep() {
      if (!this.canAdvance()) {
        if (window.CNToast) {
          window.CNToast.error('Please complete all required actions before advancing');
        }
        return;
      }

      // Mark current step as complete
      if (!this.completedSteps.includes(this.currentStep)) {
        this.completedSteps.push(this.currentStep);
      }

      // Advance to next step
      if (this.currentStep < 7) {
        this.currentStep++;
        await this.saveProgress();
        this.renderStep();
        window.scrollTo(0, 0);
      } else {
        // Protocol complete
        await this.saveProgress();
        this.renderComplete();
      }
    }

    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
        this.saveProgress();
        this.renderStep();
        window.scrollTo(0, 0);
      }
    }

    renderComplete() {
      const container = document.getElementById('step-content-container');
      
      container.innerHTML = `
        <div class="protocol-complete">
          <h2>🎉 Protocol Complete!</h2>
          <p style="color: #e5e7eb; font-size: 18px; margin-bottom: 30px;">
            Congratulations! You have completed all 7 steps of the Claim Success Protocol™.
          </p>

          <div class="protocol-complete-summary">
            <h3>Your Accomplishments:</h3>
            <ul>
              <li>✓ Step 1: Understanding Your Policy - Complete</li>
              <li>✓ Step 2: Documenting Your Loss - Complete</li>
              <li>✓ Step 3: Communicating Effectively - Complete</li>
              <li>✓ Step 4: Validating the Estimate - Complete</li>
              <li>✓ Step 5: Submitting Your Claim - Complete</li>
              <li>✓ Step 6: Negotiating Your Settlement - Complete</li>
              <li>✓ Step 7: Finalizing Your Claim - Complete</li>
            </ul>
          </div>

          <div class="protocol-complete-summary">
            <h3>Next Actions:</h3>
            <ul>
              <li>Monitor your claim status and respond promptly to requests</li>
              <li>Keep all documentation organized and accessible</li>
              <li>Continue negotiating if settlement is not satisfactory</li>
              <li>Consider escalation if claim is denied or delayed</li>
            </ul>
          </div>

          <div style="margin-top: 30px;">
            <a href="/app/resource-center/document-generator.html" class="btn-nav btn-nav-next" style="text-decoration: none;">
              Generate Claim Archive →
            </a>
          </div>

          <div style="margin-top: 16px;">
            <button class="btn-nav btn-nav-prev" onclick="window.ClaimSuccessProtocol.currentStep = 1; window.ClaimSuccessProtocol.renderStep();">
              Review Protocol Steps
            </button>
          </div>
        </div>
      `;

      // Update progress to 100%
      document.getElementById('step-label').textContent = 'Protocol Complete';
      document.getElementById('step-count').textContent = '100% Complete';
      document.getElementById('progress-bar').style.width = '100%';
      document.getElementById('step-title-progress').textContent = 'All Steps Complete';
      document.getElementById('consequence-text').textContent = '✓ You have protected your claim';
    }
  }

  // Create global instance
  window.ClaimSuccessProtocol = new ClaimSuccessProtocol();

})();







