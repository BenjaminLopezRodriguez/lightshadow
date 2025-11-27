// Lazy load pdfjs-dist to avoid bundling browser APIs in server code
// Use legacy build for Node.js/server environments (doesn't require DOMMatrix)
let pdfjsLibPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfjsLib() {
  if (!pdfjsLibPromise) {
    if (typeof window === "undefined") {
      // Server-side: Use legacy build that doesn't require browser APIs like DOMMatrix
      // The legacy build path for pdfjs-dist v5
      pdfjsLibPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
      const lib = await pdfjsLibPromise;
      // Disable worker in server environment
      lib.GlobalWorkerOptions.workerSrc = "";
    } else {
      // Client-side: Use regular build with worker
      pdfjsLibPromise = import("pdfjs-dist");
      const lib = await pdfjsLibPromise;
      lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${lib.version}/pdf.worker.min.mjs`;
    }
  }
  return pdfjsLibPromise;
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
    // Load pdfjs library dynamically
    const pdfjsLib = await getPdfjsLib();
    
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
