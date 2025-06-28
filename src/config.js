
export const RAG_CONFIG = {
  // PDF Processing Settings
  pdf: {
    chunkSize: 1000,        // Size of text chunks for processing
    overlap: 200,           // Overlap between chunks
    maxContextLength: 2000  // Maximum context length for AI
  },

  // Embedding System Settings
  embedding: {
    batchSize: 10,          // Number of chunks to process at once
    modelBackend: 'cpu',    // TensorFlow backend (cpu/webgl)
    cacheKey: 'petra_embeddings' // localStorage key for caching
  },

  // Retrieval Settings
  retrieval: {
    topK: 3,                // Number of relevant chunks to retrieve
    similarityThreshold: 0.05, // Minimum similarity score (0-1) - Very low for better recall
    maxResults: 5           // Maximum search results
  },

  // AI Generation Settings
  ai: {
    model: "gemini-2.0-flash", // Gemini model to use
    temperature: 0.7,          // Response creativity (0-1)
    maxTokens: 1000           // Maximum response length
  },

  // System Behavior
  system: {
    enableCache: true,         // Enable embedding caching
    enableFallback: true,      // Enable fallback to standard mode
    showConfidence: true,      // Show confidence scores
    showSources: true,         // Show document sources
    autoInitialize: true,      // Auto-initialize on page load
    debugMode: false          // Enable debug logging
  },

  // Petra-Specific Settings
  petra: {
    language: 'id',           // Response language (id/en)
    academicFocus: true,      // Focus on academic topics only
    professionalTone: true,   // Use professional language
    includeContactInfo: true  // Include Petra contact information
  },

  // UI Settings
  ui: {
    showStatus: true,         // Show status indicators
    showProgress: true,       // Show loading progress
    hideStatusDelay: 5000,    // Time to hide status (ms)
    enableSoundEffects: false // Sound feedback
  },

  // Performance Settings
  performance: {
    memoryLimit: 512,         // Memory limit in MB
    processingDelay: 100,     // Delay between operations (ms)
    maxConcurrentOps: 3,      // Max concurrent operations
    gcInterval: 30000         // Garbage collection interval (ms)
  }
};

// Document Sources Configuration
export const DOCUMENT_SOURCES = [
  {
    path: 'source-petra-1.pdf',
    name: 'Petra Document 1',
    type: 'pdf',
    priority: 1,
    description: 'Primary Universitas Kristen Petra documentation'
  },
  {
    path: 'source-petra-2.pdf',
    name: 'Petra Document 2',
    type: 'pdf',
    priority: 2,
    description: 'Secondary Universitas Kristen Petra documentation'
  },
  {
    path: 'source-petra-3.pdf',
    name: 'Petra Document 3',
    type: 'pdf',
    priority: 3,
    description: 'Tertiary Universitas Kristen Petra documentation'
  },
  {
    path: 'source-petra-4.pdf',
    name: 'Petra Document 4',
    type: 'pdf',
    priority: 4,
    description: 'Additional Universitas Kristen Petra documentation'
  }
];

// Predefined responses for common scenarios
export const FALLBACK_RESPONSES = {
  noContext: "Maaf, saya tidak menemukan informasi spesifik tentang hal tersebut dalam dokumen Universitas Kristen Petra. Silakan hubungi Information Center di (031) 2983000 atau email info@petra.ac.id untuk bantuan lebih lanjut.",
  
  systemError: "Terjadi kesalahan sistem. Silakan coba lagi atau hubungi Information Center Universitas Kristen Petra di (031) 2983000.",
  
  outOfScope: "Pertanyaan Anda berada di luar lingkup layanan akademik Universitas Kristen Petra. Saya hanya dapat membantu dengan pertanyaan terkait program studi, pendaftaran, dan layanan kampus.",
  
  processing: "Sedang memproses pertanyaan Anda...",
  
  welcome: "Selamat datang di layanan customer service Universitas Kristen Petra! Bagaimana saya dapat membantu Anda hari ini?"
};

// Universitas Kristen Petra Contact Information
export const PETRA_CONTACTS = {
  informationCenter: "(031) 2983000",
  whatsappOfficial: "+62812-3406-7323",
  studentRecruitment: "+62813-5967-2800", 
  informationCenterWA: "+62815-6000-506",
  email: "info@petra.ac.id",
  website: "https://petra.ac.id",
  admissionLink: "https://petra.ac.id/admission"
};

// Validation Rules
export const VALIDATION = {
  minQueryLength: 3,
  maxQueryLength: 500,
  allowedFileTypes: ['pdf', 'doc', 'docx', 'txt'],
  maxFileSize: 10 * 1024 * 1024 // 10MB
};

export default RAG_CONFIG;
