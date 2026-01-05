/**
 * Claim Navigator Guided Demo Tour
 * Step-by-step tour overlay for sales demos
 */

window.CNDemoTour = {
  steps: [
    {
      title: "Welcome to Claim Navigator",
      text: "This is the Claim Navigator guided demo. It shows the insurance claim flow with real tools that help policyholders get fair settlements."
    },
    {
      title: "6-Stage Roadmap",
      text: "The roadmap guides policyholders step-by-step through their claim journey, from initial filing to resolution or escalation."
    },
    {
      title: "Evidence Organization",
      text: "Evidence Organizer auto-categorizes and timestamps all uploads, making it easy to build a complete claim package."
    },
    {
      title: "AI Response Agent",
      text: "AI agent drafts professional responses to insurer letters in seconds, using the right language to maximize leverage."
    },
    {
      title: "Negotiation Tools",
      text: "Negotiation scripts help counter lowball offers instantly with evidence-backed arguments insurers cannot ignore."
    },
    {
      title: "Claim Health Score",
      text: "Real-time health score tracks progress and completion, ensuring nothing falls through the cracks."
    }
  ],
  index: 0
};

function startDemoTour() {
  if (window.CNDemo) {
    CNDemo.enableDemoMode();
  }
  
  const overlay = document.getElementById("demo-tour-overlay");
  if (!overlay) {
    console.error("Demo tour overlay not found");
    return;
  }
  
  CNDemoTour.index = 0;
  overlay.classList.remove("hidden");
  runDemoStep();
  
  // Log to analytics
  if (window.CNAnalytics) {
    CNAnalytics.log("demo_tour_started");
  }
}

function runDemoStep() {
  const step = CNDemoTour.steps[CNDemoTour.index];
  if (!step) return;
  
  const titleEl = document.getElementById("demo-tour-title");
  const textEl = document.getElementById("demo-tour-text");
  const nextBtn = document.getElementById("demo-tour-next");
  
  if (titleEl) titleEl.textContent = step.title;
  if (textEl) textEl.textContent = step.text;
  
  // Update button text for last step
  if (nextBtn) {
    if (CNDemoTour.index >= CNDemoTour.steps.length - 1) {
      nextBtn.textContent = "Finish Tour";
    } else {
      nextBtn.textContent = "Next";
    }
  }
}

function nextDemoStep() {
  CNDemoTour.index++;
  
  if (CNDemoTour.index >= CNDemoTour.steps.length) {
    const overlay = document.getElementById("demo-tour-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
    
    // Log to analytics
    if (window.CNAnalytics) {
      CNAnalytics.log("demo_tour_completed");
    }
    return;
  }
  
  runDemoStep();
}

// Make functions globally accessible
window.startDemoTour = startDemoTour;
window.nextDemoStep = nextDemoStep;

// Initialize tour button handler
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const nextBtn = document.getElementById("demo-tour-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", nextDemoStep);
    }
  });
} else {
  const nextBtn = document.getElementById("demo-tour-next");
  if (nextBtn) {
    nextBtn.addEventListener("click", nextDemoStep);
  }
}

