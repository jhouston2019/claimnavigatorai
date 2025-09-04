const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, HeadingLevel } = require('docx');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function writeDocx(filePath, title, body) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph(''),
          new Paragraph(body)
        ]
      }
    ]
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
}

function writePdf(filePath, title, body) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(20).text(title, { align: 'left' });
    doc.moveDown();
    doc.fontSize(12).text(body, { align: 'left' });
    doc.end();
    stream.on('finish', resolve);
  });
}

function writeXlsx(filePath, sheetName, rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filePath);
}

(async () => {
  const base = path.join(process.cwd(), 'assets', 'docs');
  const core = path.join(base, 'core');
  const escalation = path.join(base, 'escalation');
  const specialty = path.join(base, 'specialty');
  ensureDir(core);
  ensureDir(escalation);
  ensureDir(specialty);

  await writeDocx(
    path.join(core, 'fnol-template.docx'),
    'First Notice of Loss (FNOL) Template',
    'Use this template to notify your insurer of a new claim, including key facts, dates, and supporting details.'
  );
  await writeDocx(
    path.join(core, 'proof-of-loss.docx'),
    'Proof of Loss',
    'This form documents the amount claimed and supporting evidence. Complete all sections accurately.'
  );
  await writePdf(
    path.join(core, 'claim-sequence-guide.pdf'),
    'Claim Sequence Guide',
    'This guide outlines the typical sequence of events in an insurance claim, key deadlines, and best practices.'
  );
  await writeDocx(
    path.join(escalation, 'appeal-letter.docx'),
    'Appeal Letter',
    'Use this template to appeal a denial or underpayment. Reference policy provisions and evidence.'
  );
  await writeDocx(
    path.join(escalation, 'demand-letter.docx'),
    'Demand Letter',
    'Formal written demand for payment citing claim facts, policy obligations, and deadlines.'
  );
  writeXlsx(
    path.join(specialty, 'evidence-log.xlsx'),
    'Evidence Log',
    [
      ['Date', 'Item', 'Description', 'Source', 'File/Link'],
      ['2025-01-01', 'Invoice #123', 'Repair invoice for roof', 'ABC Roofing', 'link-or-path'],
    ]
  );

  console.log('Sample templates generated in /assets/docs');
})();

