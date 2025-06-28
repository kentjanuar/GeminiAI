import fs from 'fs';
import pdf from 'pdf-parse';

/**
 * PDF Processor for extracting text from PDF files
 * This module handles reading and processing PDF documents for RAG implementation
 */
class PDFProcessor {
  constructor() {
    this.processedDocuments = new Map();
  }

  /**
   * Extract text from a PDF file
   * @param {string} filePath - Path to the PDF file
   * @returns {Promise<{text: string, metadata: object}>}
   */
  async extractTextFromPDF(filePath) {
    try {
      console.log(`Processing PDF: ${filePath}`);
      
      // Read the PDF file
      const dataBuffer = fs.readFileSync(filePath);
      
      // Parse the PDF
      const data = await pdf(dataBuffer);
      
      const metadata = {
        title: data.info?.Title || 'Untitled',
        author: data.info?.Author || 'Unknown',
        subject: data.info?.Subject || '',
        creator: data.info?.Creator || '',
        producer: data.info?.Producer || '',
        creationDate: data.info?.CreationDate || null,
        modificationDate: data.info?.ModDate || null,
        pages: data.numpages,
        fileName: filePath.split('\\').pop()
      };

      console.log(`✓ Successfully extracted ${data.text.length} characters from ${metadata.fileName}`);
      
      return {
        text: data.text,
        metadata: metadata,
        rawData: data
      };
    } catch (error) {
      console.error(`Error processing PDF ${filePath}:`, error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  /**
   * Process multiple PDF files
   * @param {string[]} filePaths - Array of PDF file paths
   * @returns {Promise<Array>}
   */
  async processMultiplePDFs(filePaths) {
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        const result = await this.extractTextFromPDF(filePath);
        results.push(result);
        
        // Cache the processed document
        this.processedDocuments.set(filePath, result);
      } catch (error) {
        console.error(`Failed to process ${filePath}:`, error);
        results.push({
          error: error.message,
          filePath: filePath
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
   * Process documents and create chunks for embedding
   * @param {string[]} filePaths - Array of PDF file paths
   * @param {number} chunkSize - Size of text chunks
   * @param {number} overlap - Overlap between chunks
   * @returns {Promise<Array>}
   */
  async processDocumentsForRAG(filePaths, chunkSize = 1000, overlap = 200) {
    console.log('🔄 Processing documents for RAG...');
    
    const processedDocs = await this.processMultiplePDFs(filePaths);
    const allChunks = [];

    for (const doc of processedDocs) {
      if (doc.error) {
        console.warn(`Skipping document due to error: ${doc.error}`);
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

      console.log(`✓ Created ${chunks.length} chunks from ${doc.metadata.fileName}`);
    }

    console.log(`✅ Total chunks created: ${allChunks.length}`);
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
   * Get cached document by file path
   * @param {string} filePath 
   * @returns {object|null}
   */
  getCachedDocument(filePath) {
    return this.processedDocuments.get(filePath) || null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.processedDocuments.clear();
  }
}

export default PDFProcessor;
