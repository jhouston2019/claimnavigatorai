/**
 * Guided Product Tour System
 * Phase 13 - In-app overlay system for onboarding
 */

(function() {
  const TOUR_KEY = "cn_guided_tour_complete";
  const STEP_KEY = "cn_guided_tour_step";

  const steps = [
    {
      id: "welcome",
      selector: null,
      title: "Welcome to Claim Navigator",
      body: "I'll guide you through the most important tools so you know exactly where to start.",
      position: "center"
    },
    {
      id: "roadmap",
      selector: "#roadmap-entry",
      title: "Claim Roadmap",
      body: "This shows every step of your claim and what to do next at each stage.",
      position: "right"
    },
    {
      id: "resource-center",
      selector: "#resource-center-grid",
      title: "Resource Center",
      body: "These are your core tools: evidence, documents, deadlines, negotiations, and more.",
      position: "right"
    },
    {
      id: "ai-response-agent",
      selector: "#ai-response-agent-entry",
      title: "AI Response Agent",
      body: "Upload insurer letters and get full responses, rebuttals, and dispute templates generated instantly.",
      position: "left"
    },
    {
      id: "document-generator",
      selector: "#document-generator-entry",
      title: "Document Generator",
      body: "Generate 60+ professional claim documents—fully personalized with your claim data.",
      position: "left"
    },
    {
      id: "evidence-organizer",
      selector: "#evidence-organizer-entry",
      title: "Evidence Organizer",
      body: "Upload damage photos, categorize them, and auto-generate evidence summaries.",
      position: "left"
    },
    {
      id: "finish",
      selector: null,
      title: "You're ready to begin",
      body: "Start with the Claim Roadmap or generate your first document. You're fully set up.",
      position: "center"
    }
  ];

  function createOverlay() {
    let overlay = document.getElementById("cn-tour-overlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "cn-tour-overlay";
    overlay.innerHTML = `
      <div id="cn-tour-shade"></div>
      <div id="cn-tour-tooltip">
        <h3 id="cn-tour-title"></h3>
        <p id="cn-tour-body"></p>
        <div class="cn-tour-actions">
          <button id="cn-tour-prev">Back</button>
          <button id="cn-tour-next">Next</button>
          <button id="cn-tour-exit">Exit</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function highlightElement(selector) {
    document.querySelectorAll(".cn-tour-highlight").forEach(el => {
      el.classList.remove("cn-tour-highlight");
    });
    if (!selector) return;
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add("cn-tour-highlight");
  }

  function renderStep(index) {
    const step = steps[index];
    localStorage.setItem(STEP_KEY, index);

    const title = document.getElementById("cn-tour-title");
    const body = document.getElementById("cn-tour-body");
    const tooltip = document.getElementById("cn-tour-tooltip");

    if (!title || !body || !tooltip) return;

    title.textContent = step.title;
    body.textContent = step.body;

    highlightElement(step.selector);

    tooltip.style.position = "fixed";

    if (step.position === "center") {
      tooltip.style.top = "50%";
      tooltip.style.left = "50%";
      tooltip.style.transform = "translate(-50%, -50%)";
    } else if (step.selector) {
      const targetEl = document.querySelector(step.selector);
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        tooltip.style.top = `${rect.top + window.scrollY}px`;
        tooltip.style.left = step.position === "right"
          ? `${rect.right + 16}px`
          : `${rect.left - 280}px`;
        tooltip.style.transform = "translateY(-50%)";
      }
    }

    // Show/hide prev button
    const prevBtn = document.getElementById("cn-tour-prev");
    if (prevBtn) {
      prevBtn.style.display = index === 0 ? "none" : "inline-block";
    }
  }

  function startTour() {
    if (localStorage.getItem(TOUR_KEY)) return;
    const overlay = createOverlay();
    overlay.style.display = "block";

    let index = parseInt(localStorage.getItem(STEP_KEY) || "0", 10);
    if (index >= steps.length) index = 0;
    
    renderStep(index);

    const nextBtn = document.getElementById("cn-tour-next");
    const prevBtn = document.getElementById("cn-tour-prev");
    const exitBtn = document.getElementById("cn-tour-exit");

    if (nextBtn) {
      nextBtn.onclick = () => {
        index++;
        if (index >= steps.length) {
          endTour();
        } else {
          renderStep(index);
        }
      };
    }

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (index === 0) return;
        index--;
        renderStep(index);
      };
    }

    if (exitBtn) {
      exitBtn.onclick = () => {
        endTour();
      };
    }
  }

  function endTour() {
    localStorage.setItem(TOUR_KEY, "1");
    const overlay = document.getElementById("cn-tour-overlay");
    if (overlay) overlay.remove();
    document.querySelectorAll(".cn-tour-highlight").forEach(el =>
      el.classList.remove("cn-tour-highlight")
    );
  }

  window.startClaimNavigatorTour = startTour;
})();

