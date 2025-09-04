/*
  Generate minimal production-ready DOCX and PDF templates for 20+ claim documents.
*/
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const PDFDocument = require('pdfkit');

const templates = [
  { key: 'fnol', category: 'property', title: 'First Notice of Loss (FNOL)' },
  { key: 'proof-of-loss', category: 'property', title: 'Proof of Loss' },
  { key: 'appeal-letter', category: 'letters', title: 'Appeal Letter' },
  { key: 'demand-letter', category: 'letters', title: 'Demand Letter' },
  { key: 'estimate-request', category: 'requests', title: 'Estimate Request' },
  { key: 'inspection-request', category: 'requests', title: 'Inspection Request' },
  { key: 'umpire-request', category: 'requests', title: 'Umpire Request' },
  { key: 'public-adjuster-intake', category: 'intake', title: 'Public Adjuster Intake' },
  { key: 'contractor-scope', category: 'contractor', title: 'Contractor Scope' },
  { key: 'contractor-bid', category: 'contractor', title: 'Contractor Bid' },
  { key: 'coverage-inquiry', category: 'letters', title: 'Coverage Inquiry' },
  { key: 'delay-followup', category: 'letters', title: 'Delay Follow-Up' },
  { key: 'bad-faith-notice', category: 'letters', title: 'Bad Faith Notice' },
  { key: 'appraisal-demand', category: 'letters', title: 'Appraisal Demand' },
  { key: 'mortgagee-proof', category: 'mortgage', title: 'Mortgagee Proof' },
  { key: 'ale-reimbursement', category: 'property', title: 'Additional Living Expenses (ALE) Reimbursement' },
  { key: 'water-mitigation', category: 'property', title: 'Water Mitigation Notice' },
  { key: 'mold-remediation', category: 'property', title: 'Mold Remediation Plan' },
  { key: 'roof-replacement', category: 'property', title: 'Roof Replacement Request' },
  { key: 'supplement-request', category: 'property', title: 'Supplement Request' },
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
        children: [
          new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 36 })] }),
          new Paragraph({}),
          new Paragraph({
            children: [
              new TextRun({
                text:
                  'This template is provided by ClaimNavigatorAI as a starting point for claim documentation. Customize the fields and content to match the specifics of your claim. This is not legal or insurance advice.',
                size: 22,
              }),
            ],
          }),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
}

function createPdf(filePath, title) {
  const pdf = new PDFDocument({ size: 'LETTER', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  pdf.pipe(stream);
  pdf.fontSize(18).text(title, { align: 'left' });
  pdf.moveDown();
  pdf.fontSize(11).text(
    'This template is provided by ClaimNavigatorAI as a starting point for claim documentation. Customize the fields and content to match the specifics of your claim. This is not legal or insurance advice.',
    { align: 'left' }
  );
  pdf.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function main() {
  const baseDir = path.join(process.cwd(), 'assets', 'docs');
  ensureDir(baseDir);

  for (const t of templates) {
    const categoryDir = path.join(baseDir, t.category);
    ensureDir(categoryDir);
    const docxPath = path.join(categoryDir, `${t.key}.docx`);
    const pdfPath = path.join(categoryDir, `${t.key}.pdf`);
    await createDocx(docxPath, t.title);
    await createPdf(pdfPath, t.title);
    console.log('Created', docxPath, 'and', pdfPath);
  }

  const index = templates.map((t) => ({
    name: t.key,
    category: t.category,
    paths: {
      docx: `assets/docs/${t.category}/${t.key}.docx`,
      pdf: `assets/docs/${t.category}/${t.key}.pdf`,
    },
    title: t.title,
  }));
  fs.writeFileSync(path.join(baseDir, 'index.json'), JSON.stringify(index, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

