import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tools = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../app/assets/config/document-tools-map.json'), 'utf8')
);

const toolsDir = path.join(__dirname, '../app/tools');

tools.forEach(tool => {
  const filePath = path.join(toolsDir, tool.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ File not found: ${tool.file}`);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Remove placeholder text (multiple possible variations)
  html = html.replace(/<div class="tool-alert tool-alert-info">[\s\S]*?This tool interface is being configured[\s\S]*?<\/div>/g, '');
  html = html.replace(/This tool interface is being configured[\s\S]*?soon\./g, '');

  // Build config object
  const config = {
    toolId: tool.toolId,
    toolName: tool.toolName,
    templateType: tool.templateType,
    documentType: tool.documentType,
    autosave: true,
    enablePDF: true,
    enableDOCX: true,
    enableClipboard: true
  };

  if (tool.timelineEventType) {
    config.timelineEventType = tool.timelineEventType;
  }

  // Inject controller wiring before </body>
  const wiring = `
<script type="module">
  import { DocumentGeneratorController } from '/app/assets/js/controllers/index.js';

  document.addEventListener('DOMContentLoaded', () => {
    DocumentGeneratorController.initTool(${JSON.stringify(config, null, 6)});
  });
</script>
`;

  html = html.replace('</body>', `${wiring}\n</body>`);

  fs.writeFileSync(filePath, html);
  console.log(`✔ Wired: ${tool.toolName}`);
});

console.log(`\n✅ All ${tools.length} DOCUMENT_GENERATOR tools wired.`);



