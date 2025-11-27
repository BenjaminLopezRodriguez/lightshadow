import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker for server-side usage
// In Next.js server environment, pdfjs-dist can work without a worker
if (typeof window === "undefined") {
  // Server-side: Set worker to null to disable worker (uses main thread)
  // This is necessary for Node.js environments where workers may not work properly
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";
} else {
  // Client-side: use the worker from CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ParsedPDF {
  text: string;
  pageCount: number;
  pages: Array<{ pageNumber: number; text: string }>;
}

/**
 * Parse PDF from URL or ArrayBuffer
 */
export async function parsePDF(source: string | ArrayBuffer): Promise<ParsedPDF> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(source);
    const pdf = await loadingTask.promise;
    
    const pageCount = pdf.numPages;
    const pages: Array<{ pageNumber: number; text: string }> = [];
    let fullText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items from the page
      const pageText = textContent.items
        .map((item: any) => {
          // Handle both string and TextItem types
          if (typeof item === "string") {
            return item;
          }
          if (item.str) {
            return item.str;
          }
          return "";
        })
        .join(" ")
        .trim();

      pages.push({
        pageNumber: pageNum,
        text: pageText,
      });

      fullText += pageText + "\n\n";
    }

    return {
      text: fullText.trim(),
      pageCount,
      pages,
    };
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Parse PDF from a URL (fetches the PDF first)
 */
export async function parsePDFFromURL(url: string): Promise<ParsedPDF> {
  try {
    // Fetch the PDF as ArrayBuffer
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return await parsePDF(arrayBuffer);
  } catch (error) {
    console.error("Error fetching/parsing PDF from URL:", error);
    throw error;
  }
}
