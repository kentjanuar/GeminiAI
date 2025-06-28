import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

/**
 * Embedding System for semantic search in RAG
 * Uses Universal Sentence Encoder for creating embeddings
 */
class EmbeddingSystem {
  constructor() {
    this.model = null;
    this.embeddings = [];
    this.chunks = [];
    this.isLoaded = false;
  }

  /**
   * Initialize the Universal Sentence Encoder model
   */
  async initialize() {
    try {
      console.log('🔄 Loading Universal Sentence Encoder...');
      
      // Set TensorFlow backend to CPU for better compatibility
      await tf.setBackend('cpu');
      
      // Load the model
      this.model = await use.load();
      this.isLoaded = true;
      
      console.log('✅ Universal Sentence Encoder loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load Universal Sentence Encoder:', error);
      this.isLoaded = false;
      return false;
    }
  }

  /**
   * Create embeddings for text chunks
   * @param {Array} chunks - Array of text chunks from documents
   * @returns {Promise<boolean>}
   */
  async createEmbeddings(chunks) {
    if (!this.isLoaded) {
      console.warn('Model not loaded. Attempting to initialize...');
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize embedding model');
      }
    }

    try {
      console.log(`🔄 Creating embeddings for ${chunks.length} chunks...`);
      
      // Prepare texts for embedding
      const texts = chunks.map(chunk => chunk.text);
      
      // Create embeddings in batches to avoid memory issues
      const batchSize = 10;
      const embeddings = [];
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`);
        
        const batchEmbeddings = await this.model.embed(batch);
        const batchArray = await batchEmbeddings.array();
        
        embeddings.push(...batchArray);
        
        // Clean up tensors to prevent memory leaks
        batchEmbeddings.dispose();
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Store embeddings and chunks
      this.embeddings = embeddings;
      this.chunks = chunks;
      
      console.log(`✅ Successfully created ${embeddings.length} embeddings`);
      return true;
    } catch (error) {
      console.error('❌ Failed to create embeddings:', error);
      return false;
    }
  }

  /**
   * Create embeddings for array of texts (alternative to createEmbeddings)
   * @param {Array<string>} texts - Array of text strings
   * @returns {Promise<Array>} - Array of embedding vectors
   */
  async createEmbeddingsFromTexts(texts) {
    if (!this.isLoaded) {
      console.warn('Model not loaded. Attempting to initialize...');
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize embedding model');
      }
    }

    try {
      console.log(`🔄 Creating embeddings for ${texts.length} texts...`);
      
      // Create embeddings in batches to avoid memory issues
      const batchSize = 10;
      const embeddings = [];
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`);
        
        const batchEmbeddings = await this.model.embed(batch);
        const batchArray = await batchEmbeddings.array();
        
        embeddings.push(...batchArray);
        
        // Clean up tensors to prevent memory leaks
        batchEmbeddings.dispose();
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Successfully created ${embeddings.length} embeddings`);
      return embeddings;
    } catch (error) {
      console.error('❌ Failed to create embeddings from texts:', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} a - First vector
   * @param {Array} b - Second vector
   * @returns {number} - Similarity score (0-1)
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Search for relevant chunks based on query
   * @param {string} query - User query
   * @param {number} topK - Number of top results to return
   * @param {number} threshold - Minimum similarity threshold
   * @returns {Promise<Array>}
   */
  async searchSimilar(query, topK = 5, threshold = 0.3) {
    if (!this.isLoaded || this.embeddings.length === 0) {
      console.warn('No embeddings available for search');
      return [];
    }

    try {
      // Create embedding for the query
      const queryEmbedding = await this.model.embed([query]);
      const queryVector = await queryEmbedding.array();
      const queryArray = queryVector[0];

      // Calculate similarities
      const similarities = this.embeddings.map((embedding, index) => ({
        similarity: this.cosineSimilarity(queryArray, embedding),
        chunk: this.chunks[index],
        index: index
      }));

      // Filter by threshold and sort by similarity
      const relevantChunks = similarities
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      // Clean up tensors
      queryEmbedding.dispose();

      console.log(`Found ${relevantChunks.length} relevant chunks for query: "${query.substring(0, 50)}..."`);
      
      return relevantChunks;
    } catch (error) {
      console.error('Error in similarity search:', error);
      return [];
    }
  }

  /**
   * Get embeddings statistics
   * @returns {object}
   */
  getStats() {
    return {
      isLoaded: this.isLoaded,
      totalEmbeddings: this.embeddings.length,
      totalChunks: this.chunks.length,
      embeddingDimension: this.embeddings.length > 0 ? this.embeddings[0].length : 0
    };
  }

  /**
   * Save embeddings to localStorage (for persistence)
   * @param {string} key - Storage key
   */
  saveToStorage(key = 'bca_embeddings') {
    try {
      const data = {
        embeddings: this.embeddings,
        chunks: this.chunks,
        timestamp: Date.now()
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      console.log('✅ Embeddings saved to storage');
    } catch (error) {
      console.error('Failed to save embeddings to storage:', error);
    }
  }

  /**
   * Load embeddings from localStorage
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  loadFromStorage(key = 'bca_embeddings') {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        console.log('No embeddings found in storage');
        return false;
      }

      const parsed = JSON.parse(data);
      this.embeddings = parsed.embeddings || [];
      this.chunks = parsed.chunks || [];
      
      console.log(`✅ Loaded ${this.embeddings.length} embeddings from storage`);
      return true;
    } catch (error) {
      console.error('Failed to load embeddings from storage:', error);
      return false;
    }
  }

  /**
   * Clear all embeddings and chunks
   */
  clear() {
    this.embeddings = [];
    this.chunks = [];
    console.log('🗑️ Embeddings cleared');
  }

  /**
   * Dispose of TensorFlow resources
   */
  dispose() {
    if (this.model) {
      // Note: USE model doesn't have a direct dispose method
      // TensorFlow will handle cleanup automatically
      this.model = null;
    }
    this.clear();
    console.log('🗑️ Embedding system disposed');
  }
}

export default EmbeddingSystem;
