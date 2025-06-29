

export const RAG_CONFIG = {
  // PDF Processing Settings
  pdf: {
    chunkSize: 2000,        // Increased chunk size for more comprehensive content
    overlap: 400,           // Increased overlap to maintain context
    maxContextLength: 8000  // Increased max context for more detailed responses
  },

  // Embedding System Settings
  embedding: {
    batchSize: 15,          // Increased batch size for efficiency
    modelBackend: 'cpu',    // TensorFlow backend (cpu/webgl)
    cacheKey: 'petra_embeddings' // localStorage key for caching
  },

  // Retrieval Settings
  retrieval: {
    topK: 8,                // Increased to get more comprehensive context
    similarityThreshold: 0.01, // Lowered threshold for better recall
    maxResults: 10           // Increased maximum search results
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

// Universitas Kristen Petra Contact Information
export const PETRA_CONTACTS = {
  informationCenter: "(031) 2983000",
  whatsappOfficial: "+62812-3406-7323",
  studentRecruitment: "+62 813-5967-2800", 
  informationCenterWA: "+62 815-6000-506",
  email: "info@petra.ac.id",
  website: "https://petra.ac.id",
  admissionLink: "https://petra.ac.id/admission",
  
  // Payment Information
  payment: {
    method: "BCA Virtual Account",
    description: "Pembayaran menggunakan BCA Virtual Account dari Kartu Tanda Mahasiswa (KTM)",
    instruction: "Gunakan nomor Virtual Account BCA yang tertera di KTM Anda untuk pembayaran biaya kuliah dan administrasi"
  }
};

// Predefined responses for common scenarios
export const FALLBACK_RESPONSES = {
  noContext: `Maaf, saya tidak menemukan informasi spesifik tentang hal tersebut dalam dokumen Universitas Kristen Petra. Silakan hubungi Information Center di ${PETRA_CONTACTS.informationCenter} atau email ${PETRA_CONTACTS.email} untuk bantuan lebih lanjut.`,
  
  systemError: `Terjadi kesalahan sistem. Silakan coba lagi atau hubungi Information Center Universitas Kristen Petra di ${PETRA_CONTACTS.informationCenter}.`,
  
  outOfScope: "Pertanyaan Anda berada di luar lingkup layanan akademik Universitas Kristen Petra. Saya hanya dapat membantu dengan pertanyaan terkait program studi, pendaftaran, dan layanan kampus.",
  
  processing: "Sedang memproses pertanyaan Anda...",
  
  welcome: "Selamat datang di layanan customer service Universitas Kristen Petra! Bagaimana saya dapat membantu Anda hari ini?",
  
  paymentInfo: `Untuk pembayaran biaya kuliah dan administrasi, gunakan ${PETRA_CONTACTS.payment.method}. ${PETRA_CONTACTS.payment.instruction}.`,
  
  websiteInfo: `Website resmi Universitas Kristen Petra: ${PETRA_CONTACTS.website}. Untuk pendaftaran mahasiswa baru, kunjungi: ${PETRA_CONTACTS.admissionLink}.`
};

// Validation Rules
export const VALIDATION = {
  minQueryLength: 3,
  maxQueryLength: 500,
  allowedFileTypes: ['pdf', 'doc', 'docx', 'txt'],
  maxFileSize: 10 * 1024 * 1024 // 10MB
};

export default RAG_CONFIG;
