// Script to generate complete documents.json files from actual PDF files
const fs = require('fs');
const path = require('path');

function generateDocumentsJson(directory, language) {
  const documents = {};
  
  // Get all PDF files
  const pdfFiles = fs.readdirSync(directory)
    .filter(file => file.endsWith('.pdf'))
    .sort();
  
  console.log(`Found ${pdfFiles.length} PDF files in ${directory}`);
  
  // Group files by document name (remove -sample and -template suffixes)
  const documentGroups = {};
  
  pdfFiles.forEach(file => {
    let baseName = file.replace('.pdf', '');
    let isSample = false;
    
    // Check if it's a sample file
    if (baseName.includes('-sample')) {
      baseName = baseName.replace('-sample', '');
      isSample = true;
    } else if (baseName.includes(' Muestra')) {
      baseName = baseName.replace(' Muestra', '').replace(' en Español', '');
      isSample = true;
    } else if (baseName.includes(' Ejemplo')) {
      baseName = baseName.replace(' Ejemplo', '').replace(' en Español', '');
      isSample = true;
    } else if (baseName.includes(' - Muestra')) {
      baseName = baseName.replace(' - Muestra', '').replace(' en Español', '');
      isSample = true;
    }
    
    if (!documentGroups[baseName]) {
      documentGroups[baseName] = {};
    }
    
    if (isSample) {
      documentGroups[baseName].samplePath = file;
    } else {
      documentGroups[baseName].templatePath = file;
    }
  });
  
  // Generate document entries
  Object.keys(documentGroups).forEach(baseName => {
    const group = documentGroups[baseName];
    const slug = baseName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Generate label from base name
    const label = baseName
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    documents[slug] = {
      slug: slug,
      label: label,
      description: language === 'en' 
        ? `Insurance claim document: ${label}`
        : `Documento de reclamo de seguro: ${label}`,
      templatePath: group.templatePath || '',
      samplePath: group.samplePath || ''
    };
  });
  
  return documents;
}

// Generate English documents
console.log('Generating English documents...');
const englishDir = path.join(__dirname, '../Document Library - Final English');
const englishDocs = generateDocumentsJson(englishDir, 'en');

// Generate Spanish documents  
console.log('Generating Spanish documents...');
const spanishDir = path.join(__dirname, '../Document Library - Final Spanish');
const spanishDocs = generateDocumentsJson(spanishDir, 'es');

// Write English documents
const englishOutputPath = path.join(__dirname, '../assets/data/complete-documents-en.json');
fs.writeFileSync(englishOutputPath, JSON.stringify(englishDocs, null, 2));
console.log(`\nEnglish documents written to: ${englishOutputPath}`);
console.log(`English documents count: ${Object.keys(englishDocs).length}`);

// Write Spanish documents
const spanishOutputPath = path.join(__dirname, '../assets/data/complete-documents-es.json');
fs.writeFileSync(spanishOutputPath, JSON.stringify(spanishDocs, null, 2));
console.log(`\nSpanish documents written to: ${spanishOutputPath}`);
console.log(`Spanish documents count: ${Object.keys(spanishDocs).length}`);

// Also update the existing files
fs.writeFileSync(path.join(__dirname, '../assets/data/documents.json'), JSON.stringify(englishDocs, null, 2));
fs.writeFileSync(path.join(__dirname, '../assets/docs/en/documents.json'), JSON.stringify(englishDocs, null, 2));
fs.writeFileSync(path.join(__dirname, '../assets/docs/es/documents.json'), JSON.stringify(spanishDocs, null, 2));

console.log('\n✅ All document JSON files updated!');
console.log(`Total English documents: ${Object.keys(englishDocs).length}`);
console.log(`Total Spanish documents: ${Object.keys(spanishDocs).length}`);
console.log(`Total documents: ${Object.keys(englishDocs).length + Object.keys(spanishDocs).length}`);
