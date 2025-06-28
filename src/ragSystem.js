import PDFProcessor from './pdfProcessor.js';
import EmbeddingSystem from './embeddingSystem.js';
import { GoogleGenAI } from "@google/genai";

/**
 * RAG (Retrieval Augmented Generation) System for BCA Customer Service
 * Combines document retrieval with AI generation for enhanced responses
 */
class RAGSystem {
  constructor(apiKey) {
    this.pdfProcessor = new PDFProcessor();
    this.embeddingSystem = new EmbeddingSystem();
    this.ai = new GoogleGenAI({ apiKey });
    this.isInitialized = false;
    this.documents = [];
  }

  /**
   * Initialize the RAG system with PDF documents
   * @param {string[]} pdfPaths - Array of PDF file paths
   * @returns {Promise<boolean>}
   */
  async initialize(pdfPaths) {
    try {
      console.log('🚀 Initializing RAG System for BCA Customer Service...');
      
      // Step 1: Initialize embedding system
      console.log('📊 Step 1: Loading embedding model...');
      await this.embeddingSystem.initialize();
      
      // Step 2: Try to load existing embeddings
      console.log('💾 Step 2: Checking for cached embeddings...');
      const hasCache = this.embeddingSystem.loadFromStorage();
      
      if (!hasCache) {
        console.log('📄 Step 3: Processing PDF documents...');
        
        // Process PDFs and create chunks
        const chunks = await this.pdfProcessor.processDocumentsForRAG(pdfPaths);
        
        if (chunks.length === 0) {
          throw new Error('No text chunks were created from the PDF documents');
        }
        
        console.log('🧮 Step 4: Creating embeddings...');
        
        // Create embeddings for all chunks
        await this.embeddingSystem.createEmbeddings(chunks);
        
        // Save embeddings for future use
        this.embeddingSystem.saveToStorage();
      }
      
      this.isInitialized = true;
      console.log('✅ RAG System initialized successfully!');
      
      const stats = this.embeddingSystem.getStats();
      console.log(`📈 System Stats:`, stats);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize RAG system:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Enhanced query processing with RAG
   * @param {string} userQuery - User's question
   * @param {object} options - Configuration options
   * @returns {Promise<object>}
   */
  async processQuery(userQuery, options = {}) {
    const {
      topK = 3,
      similarityThreshold = 0.3,
      includeContext = true,
      maxContextLength = 2000
    } = options;

    try {
      if (!this.isInitialized) {
        throw new Error('RAG system not initialized');
      }

      console.log(`🔍 Processing query: "${userQuery.substring(0, 50)}..."`);

      // Step 1: Retrieve relevant documents
      const relevantChunks = await this.embeddingSystem.searchSimilar(
        userQuery, 
        topK, 
        similarityThreshold
      );

      let context = '';
      let sources = [];

      if (relevantChunks.length > 0) {
        console.log(`📚 Found ${relevantChunks.length} relevant document chunks`);
        
        // Combine relevant chunks into context
        context = relevantChunks
          .map(item => item.chunk.text)
          .join('\n\n')
          .substring(0, maxContextLength);

        // Extract source information
        sources = [...new Set(relevantChunks.map(item => item.chunk.source))];
      } else {
        console.log('ℹ️ No relevant documents found, using general knowledge');
      }

      // Step 2: Generate enhanced prompt
      const enhancedPrompt = this.createEnhancedPrompt(userQuery, context, includeContext);

      // Step 3: Generate response with Gemini
      const response = await this.generateResponse(enhancedPrompt);

      return {
        response: response.text,
        relevantChunks: relevantChunks,
        sources: sources,
        hasContext: relevantChunks.length > 0,
        contextUsed: context.length > 0 ? context.substring(0, 200) + '...' : '',
        confidence: relevantChunks.length > 0 ? 
          (relevantChunks[0].similarity * 100).toFixed(1) + '%' : 'N/A'
      };

    } catch (error) {
      console.error('Error processing query:', error);
      return {
        response: 'Maaf, terjadi kesalahan dalam memproses pertanyaan Anda. Silakan coba lagi.',
        error: error.message,
        hasContext: false,
        sources: [],
        relevantChunks: []
      };
    }
  }

  /**
   * Create an enhanced prompt with context for better responses
   * @param {string} userQuery - Original user query
   * @param {string} context - Retrieved context from documents
   * @param {boolean} includeContext - Whether to include context
   * @returns {string}
   */
  createEnhancedPrompt(userQuery, context, includeContext) {
    const systemPrompt = `Anda adalah asisten layanan pelanggan BCA (Bank Central Asia) yang sangat membantu dan berpengetahuan luas. 

INSTRUKSI PENTING:
1. Jawab HANYA pertanyaan yang berkaitan dengan layanan perbankan, produk BCA, atau layanan pelanggan
2. Jika pertanyaan di luar topik perbankan/BCA, tolak dengan sopan dan arahkan ke topik yang sesuai
3. Berikan jawaban yang akurat, jelas, dan profesional
4. Gunakan bahasa Indonesia yang formal namun ramah
5. Jika informasi tidak tersedia dalam konteks, akui keterbatasan dan sarankan menghubungi customer service resmi BCA

${includeContext && context ? `
KONTEKS DOKUMEN PENDUKUNG:
${context}

Gunakan informasi di atas sebagai referensi utama untuk menjawab pertanyaan. Jika konteks tidak cukup, gunakan pengetahuan umum tentang perbankan.
` : ''}

PERTANYAAN PENGGUNA: ${userQuery}

Berikan jawaban yang informatif dan membantu:`;

    return systemPrompt;
  }

  /**
   * Generate response using Gemini AI
   * @param {string} prompt - Enhanced prompt with context
   * @returns {Promise<object>}
   */
  async generateResponse(prompt) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      return {
        text: response.text.trim(),
        isCode: response.text.includes("<") || response.text.includes("function")
      };
    } catch (error) {
      console.error("Error generating response:", error);
      return {
        text: "Maaf, terjadi kesalahan dalam sistem. Silakan hubungi customer service BCA di 1500888 untuk bantuan lebih lanjut.",
        isCode: false
      };
    }
  }

  /**
   * Add new documents to the system
   * @param {string[]} pdfPaths - New PDF file paths
   * @returns {Promise<boolean>}
   */
  async addDocuments(pdfPaths) {
    try {
      console.log('📄 Adding new documents to RAG system...');
      
      // Process new PDFs
      const newChunks = await this.pdfProcessor.processDocumentsForRAG(pdfPaths);
      
      if (newChunks.length === 0) {
        console.warn('No new chunks created from the documents');
        return false;
      }

      // Create embeddings for new chunks
      await this.embeddingSystem.createEmbeddings([
        ...this.embeddingSystem.chunks,
        ...newChunks
      ]);

      // Save updated embeddings
      this.embeddingSystem.saveToStorage();
      
      console.log(`✅ Added ${newChunks.length} new chunks to the system`);
      return true;
    } catch (error) {
      console.error('Error adding documents:', error);
      return false;
    }
  }

  /**
   * Search documents directly without AI generation
   * @param {string} query - Search query
   * @param {number} topK - Number of results
   * @returns {Promise<Array>}
   */
  async searchDocuments(query, topK = 5) {
    if (!this.isInitialized) {
      throw new Error('RAG system not initialized');
    }

    return await this.embeddingSystem.searchSimilar(query, topK);
  }

  /**
   * Get system statistics and status
   * @returns {object}
   */
  getSystemInfo() {
    return {
      isInitialized: this.isInitialized,
      embeddingStats: this.embeddingSystem.getStats(),
      cacheInfo: {
        hasCachedDocuments: this.pdfProcessor.processedDocuments.size > 0,
        cachedCount: this.pdfProcessor.processedDocuments.size
      }
    };
  }

  /**
   * Reset the entire system
   */
  reset() {
    console.log('🔄 Resetting RAG system...');
    this.embeddingSystem.clear();
    this.pdfProcessor.clearCache();
    this.isInitialized = false;
    
    // Clear localStorage
    localStorage.removeItem('bca_embeddings');
    
    console.log('✅ RAG system reset complete');
  }

  /**
   * Cleanup resources
   */
  dispose() {
    console.log('🗑️ Disposing RAG system...');
    this.embeddingSystem.dispose();
    this.pdfProcessor.clearCache();
    this.isInitialized = false;
  }
}

export default RAGSystem;
