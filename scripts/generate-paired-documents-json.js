const fs = require('fs');
const path = require('path');

// Generate document metadata for GitHub storage with proper template/sample pairing
const githubBaseUrl = 'https://raw.githubusercontent.com/jhouston2019/Claim Navigator/main/docs';

const documents = [];

// Function to process documents and pair templates with samples
const processDirectory = (directory, language) => {
  const files = fs.readdirSync(directory).filter(file => file.endsWith('.pdf'));
  
  // Separate template and sample files
  const templateFiles = files.filter(file => !file.includes('sample'));
  const sampleFiles = files.filter(file => file.includes('sample'));
  
  console.log(`Processing ${language}: ${templateFiles.length} templates, ${sampleFiles.length} samples`);
  
  // Create document entries, pairing templates with samples
  templateFiles.forEach(templateFile => {
    const baseName = templateFile.replace('.pdf', '');
    const sampleFile = sampleFiles.find(sample => 
      sample.replace('-sample.pdf', '') === baseName
    );
    
    const slug = baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const label = baseName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const templateUrl = `${githubBaseUrl}/${language}/${encodeURIComponent(templateFile)}`;
    const sampleUrl = sampleFile ? `${githubBaseUrl}/${language}/${encodeURIComponent(sampleFile)}` : null;
    
    documents.push({
      slug: slug,
      label: label,
      language: language,
      template_path: templateUrl,
      sample_path: sampleUrl
    });
  });
  
  // Add standalone sample files that don't have corresponding templates
  sampleFiles.forEach(sampleFile => {
    const baseName = sampleFile.replace('-sample.pdf', '');
    const hasTemplate = templateFiles.some(template => 
      template.replace('.pdf', '') === baseName
    );
    
    if (!hasTemplate) {
      const slug = baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const label = baseName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      const sampleUrl = `${githubBaseUrl}/${language}/${encodeURIComponent(sampleFile)}`;
      
      documents.push({
        slug: slug,
        label: label,
        language: language,
        template_path: sampleUrl, // Use sample as template if no template exists
        sample_path: null
      });
    }
  });
};

// Process English documents
const englishDir = path.join(__dirname, '../docs/en');
if (fs.existsSync(englishDir)) {
  processDirectory(englishDir, 'en');
}

// Process Spanish documents
const spanishDir = path.join(__dirname, '../docs/es');
if (fs.existsSync(spanishDir)) {
  processDirectory(spanishDir, 'es');
}

// Write to JSON file
const outputFile = path.join(__dirname, '../assets/data/github-documents-paired.json');
fs.writeFileSync(outputFile, JSON.stringify(documents, null, 2));

console.log(`Generated ${documents.length} document entries:`);
console.log(`- English: ${documents.filter(d => d.language === 'en').length}`);
console.log(`- Spanish: ${documents.filter(d => d.language === 'es').length}`);
console.log(`- With samples: ${documents.filter(d => d.sample_path).length}`);
console.log(`Output file: ${outputFile}`);
