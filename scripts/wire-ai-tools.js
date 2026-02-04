import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tools = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../app/assets/config/ai-tools-map.json'), 'utf8')
);

const toolsDir = path.join(__dirname, '../app/tools');

tools.forEach(tool => {
  const filePath = path.join(toolsDir, tool.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ File not found: ${tool.file}`);
    return;
  }
  
  let html = fs.readFileSync(filePath, 'utf8');

  // Remove placeholder text
  html = html.replace(/This tool interface is being configured[\s\S]*?soon\./g, '');
  
  // Remove the old markComplete function and its button
  html = html.replace(/function markComplete\(\)[\s\S]*?}\s*/g, '');
  html = html.replace(/<button[^>]*onclick="markComplete\(\)"[^>]*>[\s\S]*?<\/button>/g, '');

  // Inject controller wiring before </body>
  const wiring = `
  <script type="module">
    import { AIToolController } from '../assets/js/controllers/index.js';

    document.addEventListener('DOMContentLoaded', async () => {
      await AIToolController.initTool({
        toolId: '${tool.toolId}',
        toolName: '${tool.toolName}',
        backendFunction: '${tool.backendFunction}',
        outputFormat: '${tool.outputFormat}'
      });
    });
  </script>
`;

  html = html.replace('</body>', `${wiring}\n</body>`);

  fs.writeFileSync(filePath, html);
  console.log(`✔ Wired: ${tool.toolName}`);
});

console.log(`\n✅ All ${tools.length} AI tools wired.`);
console.log('\n📋 Run verification: grep -R "being configured" app/tools');



