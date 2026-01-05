import React from "react";

interface ResourceLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function ResourceLayout({ title, children }: ResourceLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dark Header/Navbar */}
      <header className="sticky top-0 z-50 bg-[#0f172a] shadow-md border-b border-[#0f172a]">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#5da8ff] to-[#7a5cff]"></div>
            <div className="text-white font-extrabold text-lg">Claim Navigator</div>
          </div>
          <nav className="flex items-center gap-4 text-white">
            <a href="/app/index.html" className="text-[#c9d4ff] hover:text-[#93c5fd] transition px-3 py-2 rounded-lg hover:bg-white/10">
              Home
            </a>
            <span className="text-gray-400">/</span>
            <span className="text-white font-semibold">{title}</span>
            <span className="text-gray-400">/</span>
            <a href="/app/resource-center.html" className="text-[#c9d4ff] hover:text-[#93c5fd] transition px-3 py-2 rounded-lg hover:bg-white/10">
              Resource Center
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}

