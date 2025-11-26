import * as pdfjsLib from 'pdfjs-dist';

// Configurer le worker. 
// Utilisation de unpkg qui reflète exactement la structure du package NPM et supporte mieux les modules .mjs
// Cela corrige l'erreur "Failed to fetch dynamically imported module" avec cdnjs.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Chargement du document
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  // Extraction page par page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Concaténation des blocs de texte
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    if (pageText.trim()) {
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }
  }
  
  console.log(`Extraction terminée. ${fullText.length} caractères extraits.`);
  return fullText;
};