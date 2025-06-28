/**
 * Browser-compatible Image Processor
 * Handles image files for knowledge base through OCR and analysis
 */
class BrowserImageProcessor {
  constructor() {
    this.processedImages = new Map();
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  }

  /**
   * Check if file is a supported image format
   * @param {File} file 
   * @returns {boolean}
   */
  isImageFile(file) {
    const extension = file.name.toLowerCase().split('.').pop();
    return this.supportedFormats.includes(extension) || file.type.startsWith('image/');
  }

  /**
   * Convert image file to base64 for processing
   * @param {File} file 
   * @returns {Promise<string>}
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extract text content from image using Gemini Vision
   * @param {File} file - Image file
   * @param {Object} aiModel - Gemini AI model instance
   * @returns {Promise<{text: string, metadata: object}>}
   */
  async extractTextFromImage(file, aiModel) {
    try {
      console.log(`🔄 Processing image: ${file.name}`);
      
      // Convert image to base64
      const imageData = await this.fileToBase64(file);
      
      // Use Gemini Vision to extract text and analyze content
      const contents = [{
        role: "user",
        parts: [
          { text: "Please extract all text content from this image and provide a detailed description of what you see. Focus on any banking-related information, documents, forms, receipts, or financial data. Return the extracted text clearly separated from your description." },
          {
            inlineData: {
              mimeType: file.type,
              data: imageData
            }
          }
        ]
      }];

      const response = await aiModel.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents
      });

      const fullResponse = response.text.trim();
      
      // Try to separate extracted text from description
      // This is a simple approach - in practice, you might want more sophisticated parsing
      const extractedText = this.parseExtractedText(fullResponse);
      
      const metadata = {
        title: file.name.replace(/\.(jpg|jpeg|png|gif|webp)$/i, ''),
        fileName: file.name,
        fileSize: file.size,
        imageType: file.type,
        lastModified: new Date(file.lastModified),
        extractedAt: new Date(),
        fullResponse: fullResponse
      };

      console.log(`✅ Successfully processed image ${file.name} - extracted ${extractedText.length} characters`);
      
      return {
        text: extractedText,
        metadata: metadata,
        file: file
      };
    } catch (error) {
      console.error(`❌ Error processing image ${file.name}:`, error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Parse and clean extracted text from Gemini Vision response
   * @param {string} fullResponse 
   * @returns {string}
   */
  parseExtractedText(fullResponse) {
    // Simple text extraction logic
    // You can enhance this based on response patterns
    let extractedText = fullResponse;
    
    // If response contains clear sections, try to extract just the text part
    const textMarkers = [
      'extracted text:',
      'text content:',
      'text in the image:',
      'readable text:',
      'text found:'
    ];
    
    for (const marker of textMarkers) {
      const index = fullResponse.toLowerCase().indexOf(marker);
      if (index !== -1) {
        extractedText = fullResponse.substring(index + marker.length).trim();
        break;
      }
    }
    
    // Clean up the text
    return this.cleanExtractedText(extractedText);
  }

  /**
   * Clean and normalize extracted text
   * @param {string} text 
   * @returns {string}
   */
  cleanExtractedText(text) {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove common OCR artifacts
      .replace(/[^\w\s\.\,\!\?\;\:\-\(\)\[\]]/g, ' ')
      // Normalize line breaks
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Process multiple image files
   * @param {FileList|Array} files 
   * @param {Object} aiModel 
   * @returns {Promise<Array>}
   */
  async processMultipleImages(files, aiModel) {
    const results = [];
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (this.isImageFile(file)) {
        try {
          const result = await this.extractTextFromImage(file, aiModel);
          results.push(result);
          
          // Cache the processed image
          this.processedImages.set(file.name, result);
        } catch (error) {
          console.error(`❌ Failed to process ${file.name}:`, error);
          results.push({
            error: error.message,
            fileName: file.name,
            file: file
          });
        }
      } else {
        console.warn(`⚠️ Skipping non-image file: ${file.name}`);
      }
    }
    
    return results;
  }

  /**
   * Split extracted text into chunks for embedding
   * @param {string} text 
   * @param {number} chunkSize 
   * @param {number} overlap 
   * @returns {Array}
   */
  chunkText(text, chunkSize = 500, overlap = 100) {
    const chunks = [];
    let start = 0;
    let index = 0;

    while (start < text.length) {
      let end = start + chunkSize;
      
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
   * Process images for RAG (knowledge base)
   * @param {FileList|Array} files 
   * @param {Object} aiModel 
   * @param {number} chunkSize 
   * @param {number} overlap 
   * @returns {Promise<Array>}
   */
  async processImagesForRAG(files, aiModel, chunkSize = 500, overlap = 100) {
    console.log('🔄 Processing images for RAG (Knowledge Base)...');
    
    const processedImages = await this.processMultipleImages(files, aiModel);
    const allChunks = [];

    for (const image of processedImages) {
      if (image.error) {
        console.warn(`⚠️ Skipping image due to error: ${image.error}`);
        continue;
      }

      // Create chunks from extracted text
      const chunks = this.chunkText(image.text, chunkSize, overlap);
      
      // Add metadata to each chunk
      chunks.forEach(chunk => {
        chunk.source = image.metadata.fileName;
        chunk.title = image.metadata.title;
        chunk.type = 'image';
        chunk.imageType = image.metadata.imageType;
        allChunks.push(chunk);
      });

      console.log(`✅ Created ${chunks.length} chunks from image ${image.metadata.fileName}`);
    }

    console.log(`🎉 Total image chunks created: ${allChunks.length}`);
    return allChunks;
  }

  /**
   * Get cached image by file name
   * @param {string} fileName 
   * @returns {object|null}
   */
  getCachedImage(fileName) {
    return this.processedImages.get(fileName) || null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.processedImages.clear();
  }
}

export default BrowserImageProcessor;
