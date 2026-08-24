import * as pdfjsLib from 'pdfjs-dist';

// Configure CDN worker for pdf.js to avoid worker build bundling issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    const cleanedText = fullText.trim();
    if (!cleanedText) {
      throw new Error('No readable text found in PDF. The PDF might be scanned or image-only.');
    }
    
    return cleanedText;
  } catch (err: unknown) {
    console.warn('PDF.js primary extraction failed or CDN worker fallback needed:', err);
    
    // Secondary fallback: Try plain text reader if user uploaded a text file disguised or readable format
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text && text.length > 20) {
          resolve(text);
        } else {
          reject(new Error(err instanceof Error ? err.message : 'Failed to extract PDF content'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export async function parseFileToText(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'pdf') {
    return extractTextFromPDF(file);
  }
  
  // For TXT, MD, CSV, DOCX (text content)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim().length === 0) {
        reject(new Error('The uploaded file appears to be empty.'));
      } else {
        resolve(text);
      }
    };
    reader.onerror = () => reject(new Error('Error reading uploaded file.'));
    reader.readAsText(file);
  });
}
