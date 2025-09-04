const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph } = require('docx');

const OUTPUT_BASE = path.join(process.cwd(), 'assets', 'docs');

const templates = [
  { category: 'claims', name: 'FNOL' },
  { category: 'claims', name: 'Proof-of-Loss' },
  { category: 'claims', name: 'Proof-of-Repair' },
  { category: 'letters', name: 'Appeal-Letter' },
  { category: 'letters', name: 'Demand-Letter' },
  { category: 'letters', name: 'Status-Update' },
  { category: 'letters', name: 'Claim-Reopen' },
  { category: 'letters', name: 'Coverage-Confirmation' },
  { category: 'letters', name: 'Estimate-Dispute' },
  { category: 'letters', name: 'Payment-Demand' },
  { category: 'letters', name: 'RFI-Response' },
  { category: 'letters', name: 'Bad-Faith-Notice' },
  { category: 'requests', name: 'Estimate-Request' },
  { category: 'requests', name: 'Inspection-Request' },
  { category: 'requests', name: 'Underpayment-Appeal' },
  { category: 'requests', name: 'Supplement-Request' },
  { category: 'requests', name: 'Document-Request' },
  { category: 'requests', name: 'Mediation-Request' },
  { category: 'requests', name: 'Appraisal-Demand' },
  { category: 'requests', name: 'EUO-Request' }
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function createDocx(filePath, title) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: 'ClaimNavigatorAI' }),
          new Paragraph({ text: title }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Instructions:' }),
          new Paragraph({ text: '1) Replace placeholder fields with your claim details.' }),
          new Paragraph({ text: '2) Review for accuracy before sending to your insurer.' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Body:' }),
          new Paragraph({ text: '[Insert claim number, date of loss, and relevant facts here.]' })
        ]
      }
    ]
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function createPdf(filePath, title) {
  const pdf = new PDFDocument({ size: 'LETTER', margin: 50 });
  pdf.fontSize(20).text('ClaimNavigatorAI', { align: 'center' });
  pdf.moveDown();
  pdf.fontSize(16).text(title, { align: 'left' });
  pdf.moveDown();
  pdf.fontSize(12).text('Instructions:', { underline: true });
  pdf.text('1) Replace placeholder fields with your claim details.');
  pdf.text('2) Review for accuracy before sending to your insurer.');
  pdf.moveDown();
  pdf.text('Body:');
  pdf.text('[Insert claim number, date of loss, and relevant facts here.]');
  pdf.end();
  const buffer = await streamToBuffer(pdf);
  fs.writeFileSync(filePath, buffer);
}

async function run() {
  ensureDir(OUTPUT_BASE);
  for (const t of templates) {
    const dir = path.join(OUTPUT_BASE, t.category);
    ensureDir(dir);
    const base = path.join(dir, t.name);
    const title = t.name.replace(/[-_]/g, ' ');
    await createDocx(`${base}.docx`, `${title} Template`);
    await createPdf(`${base}.pdf`, `${title} Template`);
    console.log(`Generated: ${t.category}/${t.name}.docx and .pdf`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

