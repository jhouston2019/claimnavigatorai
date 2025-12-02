/**
 * State Modules - State Intelligence Layer
 * Phase 21 - State-specific deadlines, regulations, and guidance
 */

(function() {
  const STATE_MODULES = {
    "FL": {
      name: "Florida",
      code: "FL",
      deadlines: {
        proofOfLossDays: 60,
        insurerAckDays: 14,
        insurerDecisionDays: 90,
        paymentAfterAgreementDays: 20,
      },
      regulations: {
        statutes: [
          {
            cite: "Fla. Stat. § 624.155",
            topic: "Bad faith",
            summary: "Creates a civil remedy for certain violations, including not attempting in good faith to settle claims."
          },
          {
            cite: "Fla. Stat. § 626.9541",
            topic: "Unfair claim practices",
            summary: "Defines unfair methods of competition and unfair or deceptive acts or practices in the business of insurance."
          }
        ],
        complaintBody: "Florida Department of Financial Services",
        complaintURL: "https://www.myfloridacfo.com/complaint",
        mediationAvailable: true,
        mediationSummary: "DFS mediation is available for certain residential property claims.",
        appraisalNotes: "Many policies include appraisal; state law impacts timelines and enforcement."
      },
      escalation: {
        suggestions: [
          "Request written explanation citing specific policy language.",
          "Reference Florida bad faith and unfair claims statutes in communications.",
          "File a complaint with the Florida DFS if timelines are not honored."
        ]
      },
      valuation: {
        matchingLawNotes: "Florida often requires matching of undamaged materials for appearance in certain circumstances.",
        depreciationNotes: "RCV vs ACV treatment may vary by policy; review policy's loss settlement provision carefully."
      },
      roadmap: {
        specialSteps: [
          "Consider DFS mediation if claim remains underpaid after negotiation.",
          "Track all insurer response times relative to Florida's claim handling deadlines."
        ]
      }
    },

    "TX": {
      name: "Texas",
      code: "TX",
      deadlines: {
        proofOfLossDays: 60,
        insurerAckDays: 15,
        insurerDecisionDays: 15, // under Prompt Payment Act
        paymentAfterAgreementDays: 5
      },
      regulations: {
        statutes: [
          {
            cite: "Tex. Ins. Code § 542.056",
            topic: "Prompt payment",
            summary: "Requires insurers to accept or reject a claim within certain timeframes after receiving all required items."
          }
        ],
        complaintBody: "Texas Department of Insurance",
        complaintURL: "https://www.tdi.texas.gov/consumer/complfrm.html",
        mediationAvailable: false,
        mediationSummary: "",
        appraisalNotes: "Appraisal is common; check policy's appraisal clause."
      },
      escalation: {
        suggestions: [
          "Reference Texas Prompt Payment of Claims statutes when following up on delays.",
          "File a complaint with TDI if claim handling timelines are exceeded."
        ]
      },
      valuation: {
        matchingLawNotes: "Matching requirements may depend on policy and case law; document all visible mismatch conditions.",
        depreciationNotes: "Insurer must follow policy and Texas law on depreciation; challenge unsupported depreciation."
      },
      roadmap: {
        specialSteps: [
          "Monitor all insurer deadlines under Texas Prompt Payment of Claims statutes.",
          "Escalate delays with references to specific Texas code provisions."
        ]
      }
    },

    "CA": {
      name: "California",
      code: "CA",
      deadlines: {
        proofOfLossDays: 60,
        insurerAckDays: 15,
        insurerDecisionDays: 40,
        paymentAfterAgreementDays: 30
      },
      regulations: {
        statutes: [
          {
            cite: "Cal. Ins. Code § 790.03",
            topic: "Unfair practices",
            summary: "Defines unfair methods of competition and unfair or deceptive acts or practices in the business of insurance."
          }
        ],
        complaintBody: "California Department of Insurance",
        complaintURL: "https://www.insurance.ca.gov/01-consumers/101-help/",
        mediationAvailable: false,
        mediationSummary: "",
        appraisalNotes: "Appraisal clauses are common; California law may impact enforcement."
      },
      escalation: {
        suggestions: [
          "Reference California unfair practices statutes when documenting delays or denials.",
          "File a complaint with CDI if claim handling appears to violate regulations."
        ]
      },
      valuation: {
        matchingLawNotes: "California may require matching in certain circumstances; document all visible mismatches.",
        depreciationNotes: "Depreciation must be reasonable and supported; challenge arbitrary reductions."
      },
      roadmap: {
        specialSteps: [
          "Track insurer response times relative to California claim handling expectations.",
          "Consider CDI complaint if claim handling appears unfair or delayed."
        ]
      }
    },

    "LA": {
      name: "Louisiana",
      code: "LA",
      deadlines: {
        proofOfLossDays: 60,
        insurerAckDays: 14,
        insurerDecisionDays: 30,
        paymentAfterAgreementDays: 30
      },
      regulations: {
        statutes: [
          {
            cite: "La. R.S. 22:1892",
            topic: "Payment of claims",
            summary: "Requires insurers to pay claims within certain timeframes or face penalties."
          },
          {
            cite: "La. R.S. 22:1973",
            topic: "Bad faith",
            summary: "Defines insurer duties and potential penalties for failure to act in good faith."
          }
        ],
        complaintBody: "Louisiana Department of Insurance",
        complaintURL: "https://www.ldi.la.gov/consumers/file-a-complaint",
        mediationAvailable: false,
        mediationSummary: "",
        appraisalNotes: "Appraisal is available per policy; Louisiana law may impact timelines."
      },
      escalation: {
        suggestions: [
          "Reference Louisiana payment and bad faith statutes when documenting delays.",
          "File a complaint with LDI if claim handling violates statutory timelines."
        ]
      },
      valuation: {
        matchingLawNotes: "Matching requirements may apply; document all visible mismatches thoroughly.",
        depreciationNotes: "Depreciation must be reasonable; challenge unsupported reductions."
      },
      roadmap: {
        specialSteps: [
          "Monitor insurer deadlines under Louisiana payment statutes.",
          "Consider LDI complaint if statutory timelines are not met."
        ]
      }
    },

    "NY": {
      name: "New York",
      code: "NY",
      deadlines: {
        proofOfLossDays: 60,
        insurerAckDays: 15,
        insurerDecisionDays: 15,
        paymentAfterAgreementDays: 5
      },
      regulations: {
        statutes: [
          {
            cite: "N.Y. Ins. Law § 2601",
            topic: "Unfair claim settlement practices",
            summary: "Defines unfair claim settlement practices and potential penalties."
          }
        ],
        complaintBody: "New York Department of Financial Services",
        complaintURL: "https://www.dfs.ny.gov/complaint",
        mediationAvailable: false,
        mediationSummary: "",
        appraisalNotes: "Appraisal clauses are common; New York regulations may impact enforcement."
      },
      escalation: {
        suggestions: [
          "Reference New York unfair settlement practices when documenting issues.",
          "File a complaint with NYDFS if claim handling appears unfair."
        ]
      },
      valuation: {
        matchingLawNotes: "Matching may be required in certain circumstances; document all mismatches.",
        depreciationNotes: "Depreciation must be reasonable and supported by evidence."
      },
      roadmap: {
        specialSteps: [
          "Track insurer response times relative to New York claim handling standards.",
          "Consider NYDFS complaint if claim handling violates regulations."
        ]
      }
    },

    "GA": {
      name: "Georgia",
      code: "GA",
      deadlines: {
        proofOfLossDays: 60,
        insurerAckDays: 15,
        insurerDecisionDays: 30,
        paymentAfterAgreementDays: 15
      },
      regulations: {
        statutes: [
          {
            cite: "Ga. Code Ann. § 33-4-6",
            topic: "Unfair claim settlement practices",
            summary: "Defines unfair methods of competition and unfair or deceptive acts or practices."
          }
        ],
        complaintBody: "Georgia Office of Insurance and Safety Fire Commissioner",
        complaintURL: "https://oci.georgia.gov/consumer-services/file-complaint",
        mediationAvailable: false,
        mediationSummary: "",
        appraisalNotes: "Appraisal is available per policy; Georgia law may impact timelines."
      },
      escalation: {
        suggestions: [
          "Reference Georgia unfair practices statutes when documenting delays.",
          "File a complaint with OCI if claim handling appears unfair."
        ]
      },
      valuation: {
        matchingLawNotes: "Matching requirements may apply; document all visible mismatches.",
        depreciationNotes: "Depreciation must be reasonable and supported by evidence."
      },
      roadmap: {
        specialSteps: [
          "Monitor insurer deadlines relative to Georgia claim handling expectations.",
          "Consider OCI complaint if claim handling violates regulations."
        ]
      }
    },

    "DEFAULT": {
      name: "General",
      code: "DEFAULT",
      deadlines: {
        proofOfLossDays: 60,
        insurerAckDays: 15,
        insurerDecisionDays: 30,
        paymentAfterAgreementDays: 15
      },
      regulations: {
        statutes: [],
        complaintBody: "State insurance department",
        complaintURL: "",
        mediationAvailable: false,
        mediationSummary: "",
        appraisalNotes: "Appraisal and dispute options depend on policy and state law."
      },
      escalation: {
        suggestions: [
          "Request a written explanation that cites specific policy language for any denial or reduction.",
          "Escalate to a supervisor if communication is delayed or incomplete.",
          "Consider filing a complaint with your state's insurance department if claim handling appears unfair."
        ]
      },
      valuation: {
        matchingLawNotes: "Many states require reasonable matching for visible components; document all mismatch details.",
        depreciationNotes: "Depreciation must be based on age, condition, and useful life; challenge arbitrary reductions."
      },
      roadmap: {
        specialSteps: []
      }
    }
  };

  function getStateModule(code) {
    if (!code) return STATE_MODULES.DEFAULT;
    const normalized = String(code).trim().toUpperCase();
    return STATE_MODULES[normalized] || STATE_MODULES.DEFAULT;
  }

  window.CNStateModules = {
    get: getStateModule
  };
})();

