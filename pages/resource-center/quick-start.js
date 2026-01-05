import React from "react";
import ResourceLayout from "@/components/ResourceLayout";

export default function QuickStartGuide() {
  return (
    <ResourceLayout title="Quick Start Guide">
      <div className="p-8 md:p-12 bg-gray-50 min-h-screen">
        <header className="mb-10 border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-bold text-gray-900">Quick Start Guide</h1>
          <p className="text-gray-600 mt-3 max-w-2xl">
            Choose the situation that best fits your claim. Each option opens AI-powered
            tools and guides to help you act immediately.
          </p>
          <a
            href="/advisor"
            className="inline-block mt-5 text-emerald-600 font-semibold hover:text-emerald-700 hover:underline"
          >
            Not sure where to start? Ask the AI Advisor →
          </a>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl shadow-sm hover:shadow-md p-8 transition">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              My claim was just denied
            </h2>
            <p className="text-gray-600 mb-5">
              Get immediate AI-powered responses and appeal strategies.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/tools/ai-response" className="btn-primary">AI Response</a>
              <a href="/tools/negotiation" className="btn-primary">Negotiation</a>
              <a href="/tools/appeal" className="btn-primary">Appeal</a>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm hover:shadow-md p-8 transition">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              I got a lowball offer
            </h2>
            <p className="text-gray-600 mb-5">
              Assess damages, review policy, and counter low offers with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/tools/damage" className="btn-primary">Damage Review</a>
              <a href="/tools/policy" className="btn-primary">Policy Review</a>
              <a href="/tools/counter" className="btn-primary">Counter Offer</a>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm hover:shadow-md p-8 transition">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Filing for the first time
            </h2>
            <p className="text-gray-600 mb-5">
              Get step-by-step guidance for your first claim and avoid rookie mistakes.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/tools/playbook" className="btn-primary">Claim Playbook</a>
              <a href="/tools/timeline" className="btn-primary">Claim Timeline</a>
              <a href="/tools/notice" className="btn-primary">Filing Notice</a>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm hover:shadow-md p-8 transition">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Stuck or no response
            </h2>
            <p className="text-gray-600 mb-5">
              Understand your rights and take action when your claim is stalled.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/tools/rights" className="btn-primary">Rights Tracker</a>
              <a href="/tools/complaint" className="btn-primary">File Complaint</a>
              <a href="/tools/playbook" className="btn-primary">Full Playbook</a>
            </div>
          </section>
        </div>

        <footer className="mt-16 text-center text-sm text-gray-500">
          © 2025 Claim Navigator – Axis Strategic Holdings. All rights reserved.
        </footer>
      </div>
    </ResourceLayout>
  );
}

