/**
 * State Document Helper
 * Phase 21 - Helper functions for state-aware document generation
 */

(function() {
  /**
   * Get state-specific language for dispute/escalation/complaint documents
   */
  function getStateLanguage(stateModule) {
    if (!stateModule || stateModule.code === "DEFAULT") {
      return `This letter is written with awareness of general claim-handling expectations. 
The policyholder expects the claim to be handled in good faith and within reasonable timelines.`;
    }

    const statutes = stateModule.regulations.statutes || [];
    if (statutes.length === 0) {
      return `This letter is written with awareness of general claim-handling expectations for ${stateModule.name}. 
The policyholder expects the claim to be handled in good faith and within reasonable timelines.`;
    }

    const statuteRefs = statutes.map(s => `${s.cite} (${s.topic})`).join(", ");
    return `This letter is written with awareness of common claim-handling standards in ${stateModule.name}. 
While this is not a legal citation or demand, the policyholder expects the claim to be handled in good faith and within timelines generally required under ${stateModule.name} insurance regulations, including but not limited to ${statuteRefs}.`;
  }

  /**
   * Get escalation language with complaint body reference
   */
  function getEscalationLanguage(stateModule) {
    if (!stateModule || !stateModule.regulations.complaintBody) {
      return "";
    }

    return `\n\nIf this matter cannot be resolved promptly, I may consider filing a complaint with ${stateModule.regulations.complaintBody}.`;
  }

  /**
   * Get complete state-aware language for a document
   */
  function getStateAwareDocumentLanguage(stateModule, includeEscalation = false) {
    let language = getStateLanguage(stateModule);
    
    if (includeEscalation) {
      language += getEscalationLanguage(stateModule);
    }

    return language;
  }

  window.CNStateDocumentHelper = {
    getStateLanguage,
    getEscalationLanguage,
    getStateAwareDocumentLanguage
  };
})();

