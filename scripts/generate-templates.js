const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, HeadingLevel } = require('docx');
const PDFDocument = require('pdfkit');

const outBase = path.join(__dirname, '..', 'assets', 'docs');

const templates = [
  { name: 'claims/fnol.docx', title: 'First Notice of Loss (FNOL)', desc: 'Initial claim notification template.' },
  { name: 'claims/proof-of-loss.docx', title: 'Proof of Loss', desc: 'Formal proof of loss submission.' },
  { name: 'letters/appeal-letter.docx', title: 'Appeal Letter', desc: 'Appeal of claim determination.' },
  { name: 'letters/demand-letter.docx', title: 'Demand Letter', desc: 'Demand for payment or action.' },
  { name: 'logs/evidence-log.docx', title: 'Evidence Log', desc: 'Track evidence submissions.' },
  { name: 'guides/claim-sequence-guide.pdf', title: 'Claim Sequence Guide', desc: 'Step-by-step claim process guide.' },
  { name: 'letters/status-update-letter.docx', title: 'Status Update Request', desc: 'Requesting claim status update.' },
  { name: 'letters/ror-response.docx', title: 'Reservation of Rights Response', desc: 'Responding to ROR letter.' },
  { name: 'letters/policy-limit-demand.docx', title: 'Policy Limit Demand', desc: 'Demand for policy limits.' },
  { name: 'letters/bad-faith-notice.docx', title: 'Bad Faith Notice', desc: 'Notice alleging bad faith practices.' },
  { name: 'letters/supplement-request.docx', title: 'Supplement Request', desc: 'Requesting supplemental payment.' },
  { name: 'letters/inspection-request.docx', title: 'Inspection Request', desc: 'Requesting inspection appointment.' },
  { name: 'letters/estimate-dispute.docx', title: 'Estimate Dispute', desc: 'Challenging estimate discrepancies.' },
  { name: 'letters/um-uim-demand.docx', title: 'UM/UIM Demand', desc: 'Uninsured/Underinsured motorist demand.' },
  { name: 'forms/medical-bill-summary.docx', title: 'Medical Bill Summary', desc: 'Summarize medical bills and charges.' },
  { name: 'forms/witness-statement.docx', title: 'Witness Statement', desc: 'Template for witness statement.' },
  { name: 'logs/timeline.docx', title: 'Claim Timeline', desc: 'Chronological sequence of events.' },
  { name: 'logs/call-log.docx', title: 'Call Log', desc: 'Record phone calls with carriers.' },
  { name: 'letters/eob-challenge.docx', title: 'EOB Challenge', desc: 'Challenge Explanation of Benefits.' },
  { name: 'forms/proof-of-mailing.docx', title: 'Proof of Mailing', desc: 'Document proof of mailing.' }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function createDocx(fullPath, title, desc) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph('ClaimNavigatorAI Template'),
          new Paragraph(''),
          new Paragraph(desc),
        ]
      }
    ]
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(fullPath, buffer);
}

async function createPdf(fullPath, title, desc) {
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = fs.createWriteStream(fullPath);
    doc.pipe(stream);
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('ClaimNavigatorAI Template', { align: 'left' });
    doc.moveDown();
    doc.text(desc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

(async () => {
  ensureDir(outBase);
  for (const t of templates) {
    const full = path.join(outBase, t.name);
    ensureDir(path.dirname(full));
    if (full.endsWith('.pdf')) {
      await createPdf(full, t.title, t.desc);
    } else {
      await createDocx(full, t.title, t.desc);
    }
    console.log('Generated', full);
  }
})();

