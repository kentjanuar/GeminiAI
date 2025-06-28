/**
 * Browser-compatible PDF Processor
 * Handles PDF files through file input/upload instead of file system access
 */
class BrowserPDFProcessor {
  constructor() {
    this.processedDocuments = new Map();
    this.loadedLibraries = {
      pdfjs: null
    };
  }

  /**
   * Initialize PDF.js library for browser
   */
  async initializePDFJS() {
    if (this.loadedLibraries.pdfjs) {
      return this.loadedLibraries.pdfjs;
    }

    try {
      // Load PDF.js from CDN
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        };
        document.head.appendChild(script);
        
        // Wait for script to load
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      
      this.loadedLibraries.pdfjs = window.pdfjsLib;
      console.log('✅ PDF.js loaded successfully');
      return this.loadedLibraries.pdfjs;
    } catch (error) {
      console.error('❌ Failed to load PDF.js:', error);
      throw new Error('PDF.js library could not be loaded');
    }
  }

  /**
   * Extract text from PDF file (browser version)
   * @param {File} file - PDF file from input
   * @returns {Promise<{text: string, metadata: object}>}
   */
  async extractTextFromPDFFile(file) {
    try {
      console.log(`🔄 Processing PDF: ${file.name}`);
      
      // Initialize PDF.js if not already done
      const pdfjsLib = await this.initializePDFJS();
      
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const numPages = pdf.numPages;
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine all text items from the page
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      const metadata = {
        title: file.name.replace('.pdf', '').replace('.PDF', ''),
        fileName: file.name,
        fileSize: file.size,
        pages: numPages,
        lastModified: new Date(file.lastModified),
        type: file.type
      };

      console.log(`✅ Successfully extracted ${fullText.length} characters from ${file.name}`);
      
      return {
        text: fullText,
        metadata: metadata,
        file: file
      };
    } catch (error) {
      console.error(`❌ Error processing PDF ${file.name}:`, error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  /**
   * Process multiple PDF files from file input
   * @param {FileList|Array} files - PDF files from input
   * @returns {Promise<Array>}
   */
  async processMultiplePDFFiles(files) {
    const results = [];
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Only process PDF files
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          const result = await this.extractTextFromPDFFile(file);
          results.push(result);
          
          // Cache the processed document
          this.processedDocuments.set(file.name, result);
        } catch (error) {
          console.error(`❌ Failed to process ${file.name}:`, error);
          results.push({
            error: error.message,
            fileName: file.name,
            file: file
          });
        }
      } else {
        console.warn(`⚠️ Skipping non-PDF file: ${file.name}`);
      }
    }
    
    return results;
  }

  /**
   * Process documents from pre-loaded URLs (for your existing PDFs)
   * @param {string[]} pdfUrls - URLs to PDF files
   * @returns {Promise<Array>}
   */
  async processDocumentsFromURLs(pdfUrls) {
    const results = [];
    
    for (const url of pdfUrls) {
      try {
        console.log(`🔄 Loading PDF from URL: ${url}`);
        
        // Fetch PDF as blob
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // Create a File object from blob
        const file = new File([blob], url.split('/').pop(), { type: 'application/pdf' });
        
        // Process as normal file
        const result = await this.extractTextFromPDFFile(file);
        results.push(result);
        
        console.log(`✅ Successfully processed: ${url}`);
      } catch (error) {
        console.error(`❌ Failed to process ${url}:`, error);
        results.push({
          error: error.message,
          url: url
        });
      }
    }
    
    return results;
  }

  /**
   * Split text into smaller chunks for better embedding and retrieval
   * @param {string} text - The text to chunk
   * @param {number} chunkSize - Maximum size of each chunk
   * @param {number} overlap - Number of characters to overlap between chunks
   * @returns {Array<{text: string, index: number}>}
   */
  chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;
    let index = 0;

    while (start < text.length) {
      let end = start + chunkSize;
      
      // If we're not at the end of the text, try to break at a sentence or word boundary
      if (end < text.length) {
        // Look for sentence ending
        let sentenceEnd = text.lastIndexOf('.', end);
        if (sentenceEnd > start + chunkSize * 0.5) {
          end = sentenceEnd + 1;
        } else {
          // Look for word boundary
          let spaceIndex = text.lastIndexOf(' ', end);
          if (spaceIndex > start + chunkSize * 0.5) {
            end = spaceIndex;
          }
        }
      }

      const chunk = text.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push({
          text: chunk,
          index: index++,
          startPos: start,
          endPos: end
        });
      }

      start = end - overlap;
    }

    return chunks;
  }

  /**
   * Process documents and create chunks for embedding (browser version)
   * @param {FileList|Array|string[]} input - Files or URLs
   * @param {number} chunkSize - Size of text chunks
   * @param {number} overlap - Overlap between chunks
   * @returns {Promise<Array>}
   */
  async processDocumentsForRAG(input, chunkSize = 1000, overlap = 200) {
    console.log('🔄 Processing documents for RAG (Browser Mode)...');
    
    let processedDocs = [];
    
    // Determine input type and process accordingly
    if (typeof input[0] === 'string') {
      // URLs
      processedDocs = await this.processDocumentsFromURLs(input);
    } else {
      // Files
      processedDocs = await this.processMultiplePDFFiles(input);
    }
    
    const allChunks = [];

    for (const doc of processedDocs) {
      if (doc.error) {
        console.warn(`⚠️ Skipping document due to error: ${doc.error}`);
        continue;
      }

      // Clean and preprocess the text
      const cleanText = this.cleanText(doc.text);
      
      // Create chunks
      const chunks = this.chunkText(cleanText, chunkSize, overlap);
      
      // Add metadata to each chunk
      chunks.forEach(chunk => {
        chunk.source = doc.metadata.fileName;
        chunk.title = doc.metadata.title;
        chunk.pages = doc.metadata.pages;
        allChunks.push(chunk);
      });

      console.log(`✅ Created ${chunks.length} chunks from ${doc.metadata.fileName}`);
    }

    console.log(`🎉 Total chunks created: ${allChunks.length}`);
    return allChunks;
  }

  /**
   * Clean and normalize text for better processing
   * @param {string} text - Raw text from PDF
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere
      .replace(/[^\w\s\.\,\!\?\;\:\-\(\)\[\]]/g, '')
      // Remove page numbers and headers/footers (basic patterns)
      .replace(/\bPage \d+\b/gi, '')
      .replace(/^\d+\s*$/gm, '')
      // Normalize line breaks
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Get cached document by file name
   * @param {string} fileName 
   * @returns {object|null}
   */
  getCachedDocument(fileName) {
    return this.processedDocuments.get(fileName) || null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.processedDocuments.clear();
  }

  /**
   * Create file input for PDF upload
   * @param {Function} onFilesSelected - Callback when files are selected
   * @returns {HTMLInputElement}
   */
  createFileInput(onFilesSelected) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf';
    input.multiple = true;
    input.style.display = 'none';
    
    input.addEventListener('change', (event) => {
      const files = event.target.files;
      if (files.length > 0) {
        onFilesSelected(files);
      }
    });
    
    document.body.appendChild(input);
    return input;
  }
}

export default BrowserPDFProcessor;
