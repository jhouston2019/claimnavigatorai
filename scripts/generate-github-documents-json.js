const fs = require('fs');
const path = require('path');

// Generate document metadata for GitHub storage
const githubBaseUrl = 'https://raw.githubusercontent.com/jhouston2019/Claim Navigator/main/docs';

const documents = [];

// Process English documents
const englishDir = path.join(__dirname, '../docs/en');
if (fs.existsSync(englishDir)) {
  const englishFiles = fs.readdirSync(englishDir).filter(file => file.endsWith('.pdf'));
  console.log(`Processing ${englishFiles.length} English documents...`);
  
  englishFiles.forEach(file => {
    const slug = file.replace('.pdf', '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const label = file.replace('.pdf', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const githubUrl = `${githubBaseUrl}/en/${encodeURIComponent(file)}`;
    
    documents.push({
      slug: slug,
      label: label,
      language: 'en',
      template_path: githubUrl,
      sample_path: null
    });
  });
}

// Process Spanish documents
const spanishDir = path.join(__dirname, '../docs/es');
if (fs.existsSync(spanishDir)) {
  const spanishFiles = fs.readdirSync(spanishDir).filter(file => file.endsWith('.pdf'));
  console.log(`Processing ${spanishFiles.length} Spanish documents...`);
  
  spanishFiles.forEach(file => {
    const slug = file.replace('.pdf', '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const label = file.replace('.pdf', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const githubUrl = `${githubBaseUrl}/es/${encodeURIComponent(file)}`;
    
    documents.push({
      slug: slug,
      label: label,
      language: 'es',
      template_path: githubUrl,
      sample_path: null
    });
  });
}

// Write to JSON file
const outputFile = path.join(__dirname, '../assets/data/github-documents.json');
fs.writeFileSync(outputFile, JSON.stringify(documents, null, 2));

console.log(`Generated ${documents.length} document entries:`);
console.log(`- English: ${documents.filter(d => d.language === 'en').length}`);
console.log(`- Spanish: ${documents.filter(d => d.language === 'es').length}`);
console.log(`Output file: ${outputFile}`);
