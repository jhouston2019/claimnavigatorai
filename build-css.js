#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple CSS build script that combines Tailwind utilities with custom CSS
const customCSS = `
/*! tailwindcss v3.4.0 | MIT License | https://tailwindcss.com */

/*! modern-normalize v2.0.0 | MIT License | https://github.com/sindresorhus/modern-normalize */

/*
1. Use a more-intuitive box-sizing model.
*/
*,::before,::after{box-sizing:border-box}/* 2. Remove default margin in favour of better control in authored CSS. */*{margin:0}/* 3. Allow percentage-based heights in the application. */html,body{height:100%}/* Typographic tweaks!
4. Improve text rendering. */body{line-height:1.5;-webkit-font-smoothing:antialiased}/* 5. Improve media defaults. */img,picture,video,canvas,svg{display:block;max-width:100%}/* 6. Remove built-in form typography styles. */input,button,textarea,select{font:inherit}/* 7. Avoid text overflows. */p,h1,h2,h3,h4,h5,h6{overflow-wrap:break-word}/* 8. Create a root stacking context. */#root,#__next{isolation:isolate}

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom CSS Variables */
:root{
  --bg:#0b1020; --panel:#0f1630; --card:#121b3b; --muted:#9aa4bf; --text:#e8eeff;
  --primary:#5da8ff; --accent:#7a5cff; --ok:#06b6d4; --warn:#f59e0b; --err:#ef4444; --border:#203055;
}

/* Base Styles */
*{box-sizing:border-box}
html,body{margin:0;height:100%;width:100%;overflow-x:hidden}
body{background:#ffffff; color:#000000; font:400 16px/1.5 Inter,system-ui,Segoe UI,Roboto,Arial}
a{color:inherit;text-decoration:none}
h1,h2,h3,h4,h5,h6{color:#000000}
p{color:#000000}
span{color:#000000}
div{color:#000000}

/* Tailwind Utility Classes */
.bg-gray-50{background-color:#f9fafb}
.bg-white{background-color:#ffffff}
.bg-gray-100{background-color:#f3f4f6}
.bg-gray-200{background-color:#e5e7eb}
.bg-green-200{background-color:#bbf7d0}
.bg-red-200{background-color:#fecaca}
.bg-blue-600{background-color:#2563eb}
.bg-blue-700{background-color:#1d4ed8}

.text-gray-700{color:#374151}
.text-gray-600{color:#4b5563}
.text-gray-500{color:#6b7280}
.text-white{color:#ffffff}
.text-red-600{color:#dc2626}
.text-green-800{color:#166534}

.border-gray-200{border-color:#e5e7eb}
.border-gray-300{border-color:#d1d5db}
.border-red-200{border-color:#fecaca}

.border-b{border-bottom-width:1px}
.border{border-width:1px}

.rounded-lg{border-radius:0.5rem}
.rounded-full{border-radius:9999px}
.rounded-2xl{border-radius:1rem}

.px-3{padding-left:0.75rem;padding-right:0.75rem}
.px-4{padding-left:1rem;padding-right:1rem}
.py-1{padding-top:0.25rem;padding-bottom:0.25rem}
.py-2{padding-top:0.5rem;padding-bottom:0.5rem}
.py-4{padding-top:1rem;padding-bottom:1rem}
.py-8{padding-top:2rem;padding-bottom:2rem}

.mx-auto{margin-left:auto;margin-right:auto}
.mb-4{margin-bottom:1rem}
.mb-12{margin-bottom:3rem}
.mt-4{margin-top:1rem}
.mt-6{margin-top:1.5rem}
.mt-16{margin-top:4rem}

.w-32{width:8rem}
.w-full{width:100%}
.h-2{height:0.5rem}
.h-10{height:2.5rem}

.flex{display:flex}
.grid{display:grid}
.hidden{display:none}

.items-center{align-items:center}
.justify-between{justify-content:space-between}
.justify-center{justify-content:center}
.text-center{text-align:center}

.space-x-2 > :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)))}
.space-x-4 > :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(1rem * var(--tw-space-x-reverse));margin-left:calc(1rem * calc(1 - var(--tw-space-x-reverse)))}

.text-sm{font-size:0.875rem;line-height:1.25rem}
.text-lg{font-size:1.125rem;line-height:1.75rem}
.text-4xl{font-size:2.25rem;line-height:2.5rem}

.font-medium{font-weight:500}
.font-semibold{font-weight:600}
.font-bold{font-weight:700}

.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms}
.transition-all{transition-property:all;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms}

.duration-200{transition-duration:200ms}
.duration-500{transition-duration:500ms}

.hover\\:bg-gray-200:hover{background-color:#e5e7eb}
.hover\\:bg-gray-400:hover{background-color:#9ca3af}
.hover\\:bg-blue-700:hover{background-color:#1d4ed8}
.hover\\:bg-\\[\\#1e40af\\]\\/90:hover{background-color:rgba(30,64,175,0.9)}

.focus\\:ring-2:focus{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}
.focus\\:ring-\\[#3b82f6\\]:focus{--tw-ring-color:#3b82f6}
.focus\\:border-transparent:focus{border-color:transparent}

.disabled\\:opacity-50:disabled{opacity:0.5}

.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}
.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.gap-2{gap:0.5rem}
.gap-4{gap:1rem}
.gap-8{gap:2rem}

.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.xl\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}

.flex-1{flex:1 1 0%}
.flex-col{flex-direction:column}

.max-w-4xl{max-width:56rem}

.placeholder\\:\\$0::placeholder{color:var(--placeholder-color,$0)}

/* Custom Components */
.container{width:100%;margin:0;padding:12px 16px}
.header{position:sticky;top:0;z-index:50;background:#0f172a;backdrop-filter:blur(10px);border-bottom:1px solid #0f172a}
.header .bar{display:flex;align-items:center;justify-content:space-between;padding:14px 16px}
.brand{display:flex;gap:10px;align-items:center;font-weight:800;color:#ffffff}
.brand div{color:#ffffff}
.brand .logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--primary),var(--accent))}
.nav a{margin-left:14px;color:#ffffff;transition:color 0.2s}
.nav a:hover{color:#93c5fd}

.tool-card {
    transition: all 0.3s ease;
}
.tool-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.progress-bar {
    background: linear-gradient(90deg, #3b82f6 0%, #1e40af 100%);
}

.spinner {
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.fade-in {
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.output-card {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
}

/* Additional custom styles from the original CSS file */
.main-grid{display:grid;grid-template-columns:260px 1fr;gap:16px}
.panel{background:linear-gradient(180deg,#0f1734,#0e183b); border:1px solid #1c2a57; border-radius:14px; box-shadow:0 10px 28px rgba(0,0,0,.25); padding:16px}
.h{font-size:14px;letter-spacing:.16em;color:#8fa3d4;text-transform:uppercase;margin:0 0 10px}
.search{display:flex;gap:8px}
.search input{flex:1;border-radius:10px;border:1px solid #223266;background:#111a3a;color:#eaf2ff;padding:10px 12px}
.btn{border:1px solid #29418a;background:#121e44;color:#eaf2ff;border-radius:10px;padding:10px 12px;cursor:pointer}
.btn:hover{transform:translateY(-1px)}
.btn-primary{background:linear-gradient(135deg,var(--primary),var(--accent)); border:0; color:#0b1020}
.btn-secondary{border:1px solid #3a4a86;background:#111a34;color:#cfe1ff}
.card{background:#e9ecef;border:2px solid #e5e7eb;border-radius:14px;box-shadow:0 4px 6px rgba(0,0,0,.1);padding:16px;color:#000000}
.grid{display:grid;gap:14px}
.grid.tools{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.tools-xl{grid-template-columns:repeat(auto-fit,minmax(480px,1fr))}
.tool{min-height:150px;display:flex;flex-direction:column;justify-content:space-between}
.tool-xl{min-height:240px}
.tool h3{margin:6px 0 4px;font-size:18px}
.tool p{margin:0;color:var(--muted)}
.badge{font-size:12px;color:#ffffff;background:var(--primary);border:2px solid var(--border);border-radius:999px;padding:4px 8px;align-self:flex-start}
.kv{display:grid;grid-template-columns:140px 1fr;gap:8px;margin:10px 0}
label{color:var(--text)}
input,textarea,select{font:inherit;background:#ffffff;border:2px solid var(--border);color:var(--text);border-radius:10px;padding:10px 12px}
textarea{min-height:120px}
table{width:100%;border:2px solid var(--border);border-radius:10px;overflow:hidden;background:var(--card)}
th,td{border-bottom:1px solid var(--border);padding:8px 10px;color:var(--text)}
th{color:var(--text);text-align:left;background:var(--panel)}
tfoot td{font-weight:700}
.toast{position:fixed;bottom:16px;right:16px;background:#092;display:none;color:#fff;padding:10px 12px;border-radius:10px}
.invalid{outline:2px solid var(--err);background:#2a0e14}
.small{font-size:12px;color:var(--muted)}
.hero{display:flex;gap:12px;align-items:center}
.hero .logo{width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--primary))}
`;

// Write the CSS file
fs.writeFileSync(path.join(__dirname, 'dist', 'style.css'), customCSS);
console.log('✅ CSS built successfully to dist/style.css');
