import { GoogleGenAI } from "@google/genai";
import BrowserPDFProcessor from './browserPDFProcessor.js';
import BrowserImageProcessor from './browserImageProcessor.js';
import EmbeddingSystem from './embeddingSystem.js';
import { RAG_CONFIG, DOCUMENT_SOURCES, FALLBACK_RESPONSES, PETRA_CONTACTS } from './config.js';

// Inisialisasi API dengan API key
const API_KEY = "AIzaSyAqwIpUtkS8ZxE9RPtk2LRgcQNQhM3KHeI"; // Ganti dengan API key Anda
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Initialize browser-compatible systems
const pdfProcessor = new BrowserPDFProcessor(RAG_CONFIG); // Pass config to PDF processor
const imageProcessor = new BrowserImageProcessor();
const embeddingSystem = new EmbeddingSystem(RAG_CONFIG); // Pass config to embedding system
let knowledgeBase = [];
let isRAGInitialized = false;

// Elemen DOM
const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const csFloatBtn = document.getElementById("cs-float-btn");
const chatWidget = document.getElementById("chat-widget");
const closeChat = document.getElementById("closeChat");
const callBotBtn = document.getElementById("callBotBtn");

// Debug: Check if elements are found
console.log('🔍 DOM Elements Check:');
console.log('csFloatBtn:', csFloatBtn);
console.log('chatWidget:', chatWidget);
console.log('chatbox:', chatbox);

// Check if elements exist before adding event listeners
if (!csFloatBtn) {
  console.error('❌ cs-float-btn element not found!');
}
if (!chatWidget) {
  console.error('❌ chat-widget element not found!');
}

// Call popup
const callPopup = document.getElementById("call-popup");
const endCallBtn = document.getElementById("endCallBtn");
const callStatus = document.getElementById("callStatus");
const botMouth = document.getElementById("botMouth");
const speechText = document.getElementById("speechText");
const callMicBtn = document.getElementById("callMicBtn");
const kbStatus = document.getElementById("kb-status");
const pdfUploadBtn = document.getElementById("pdfUploadBtn");
const pdfFileInput = document.getElementById("pdfFileInput");

let uploadedFile = null;
let ragEnabled = false;

// === Scope Customer Service ===
// Build dynamic system prompt using config data
const buildSystemPrompt = () => {
  return `Anda adalah asisten customer service Universitas Kristen Petra yang membantu dalam bahasa Indonesia. Anda memiliki kemampuan:

1. Menjawab pertanyaan tentang program studi, pendaftaran, biaya kuliah, beasiswa, fasilitas kampus, dan layanan akademik Universitas Kristen Petra
2. Memberikan informasi tentang kehidupan kampus, organisasi mahasiswa, kegiatan ekstrakurikuler, dan event-event universitas
3. Menganalisis gambar terkait kampus (dokumen pendaftaran, kartu mahasiswa, transkrip, sertifikat, brosur, dll.)
4. Membaca teks dari gambar yang diupload (OCR) dan memberikan bantuan berdasarkan konten tersebut
5. Membantu pengisian formulir pendaftaran, verifikasi dokumen akademik, dan masalah administrasi kampus

INFORMASI KONTAK RESMI UNIVERSITAS KRISTEN PETRA:
- Information Center: ${PETRA_CONTACTS.informationCenter}
- WhatsApp Official: ${PETRA_CONTACTS.whatsappOfficial}
- Student Recruitment: ${PETRA_CONTACTS.studentRecruitment}
- Information Center WhatsApp: ${PETRA_CONTACTS.informationCenterWA}
- Email: ${PETRA_CONTACTS.email}
- Website Resmi: ${PETRA_CONTACTS.website}
- Link Pendaftaran: ${PETRA_CONTACTS.admissionLink}

INFORMASI PEMBAYARAN:
- Metode Pembayaran: ${PETRA_CONTACTS.payment.method}
- Deskripsi: ${PETRA_CONTACTS.payment.description}
- Petunjuk: ${PETRA_CONTACTS.payment.instruction}

PENTING - Aturan Bahasa dan Format:
- JANGAN mengucapkan asterisk (*) atau underscore (_) dalam jawaban suara
- SELALU gunakan bahasa Indonesia yang formal dan profesional
- JANGAN gunakan bahasa Inggris kecuali untuk istilah akademik yang sudah umum
- JANGAN PERNAH gunakan format markdown seperti **bold**, *italic*, __underline__, atau _emphasis_
- JANGAN gunakan simbol asterisk (*) atau underscore (_) untuk penekanan
- Gunakan format teks biasa tanpa simbol khusus apapun
- Jika perlu penekanan, gunakan huruf kapital: PENTING, PERHATIAN, WAJIB
- Gunakan tanda baca standar seperti titik, koma, tanda seru untuk struktur kalimat

Ketika menganalisis gambar:
- Jelaskan apa yang Anda lihat dalam konteks layanan akademik dan kampus
- Ekstrak dan baca teks, angka, atau informasi relevan
- Berikan saran spesifik berdasarkan konten gambar
- Jaga privasi dan keamanan data mahasiswa/calon mahasiswa

PENTING - Aturan Khusus Shuttle Bus Petra:
Jika pertanyaan berhubungan dengan shuttle bus Universitas Kristen Petra, transportasi kampus, atau layanan antar-jemput mahasiswa:
- JANGAN arahkan ke website universitas atau situs web apapun
- SELALU arahkan ke aplikasi shuttle bus yang informasinya tersedia di dokumen source 4
- Tekankan bahwa semua informasi shuttle bus (jadwal, rute, tracking) hanya tersedia melalui aplikasi mobile khusus
- Berikan informasi LENGKAP dan DETAIL dari aplikasi shuttle bus sesuai dokumen yang tersedia
- Sebutkan SEMUA peraturan, prosedur, jadwal, dan ketentuan yang ada dalam dokumen
- Jangan merangkum terlalu singkat - berikan informasi komprehensif

PENTING - Aturan Umum Penyampaian Informasi:
- Berikan jawaban yang LENGKAP dan DETAIL berdasarkan semua konteks yang tersedia
- JANGAN merangkum informasi terlalu singkat - sebutkan semua detail penting
- Jika ada peraturan, prosedur, atau ketentuan dalam dokumen, sebutkan SEMUANYA
- Gunakan semua informasi relevan yang tersedia dalam knowledge base

PENTING - ATURAN KHUSUS PERTANYAAN PENDAFTARAN:
- Untuk pertanyaan tentang CARA MENDAFTAR, PROSEDUR PENDAFTARAN, atau LANGKAH-LANGKAH PENDAFTARAN, Anda WAJIB memberikan jawaban DETAIL dari KNOWLEDGE BASE
- JANGAN hanya memberikan informasi kontak untuk pertanyaan spesifik tentang pendaftaran
- Informasi kontak HANYA boleh diberikan sebagai TAMBAHAN, BUKAN sebagai jawaban utama
- Jika ada pertanyaan "bagaimana cara mendaftar" atau sejenisnya, berikan SELURUH informasi dari knowledge base yang relevan
- Jika pengguna menyatakan KEINGINAN MENDAFTAR seperti "mau mendaftar", "ingin mendaftar", "bagaimana jika mendaftar", BERIKAN JAWABAN LENGKAP dari knowledge base
- Pertanyaan dengan frasa "mau daftar", "ingin daftar", "jika daftar", "akan daftar" WAJIB dijawab dengan informasi LENGKAP dari knowledge base
- SELALU sertakan SYARAT, DOKUMEN, ALUR, dan PROSEDUR pendaftaran secara LENGKAP
- Sebutkan SEMUA tahapan pendaftaran yang tercantum dalam dokumen
- TIDAK PERNAH hanya mengirimkan informasi kontak sebagai jawaban utama untuk pertanyaan pendaftaran

PENTING - Penggunaan Kontak dan Website:
- Ketika memberikan informasi kontak, SELALU gunakan informasi dari daftar kontak resmi di atas
- Ketika menyebutkan website resmi, gunakan: ${PETRA_CONTACTS.website}
- Untuk pendaftaran, arahkan ke: ${PETRA_CONTACTS.admissionLink}
- Untuk pembayaran, jelaskan penggunaan BCA Virtual Account dari KTM

Jika pertanyaan di luar topik universitas/pendidikan, tolak dengan sopan dan arahkan ke topik akademik yang sesuai.
Ketika Anda perlu meminta informasi kepada pengguna, gunakan daftar bernomor atau berbutir tanpa menggunakan asterisk atau markdown.

Panduan Analisis Gambar:
- Untuk dokumen pendaftaran: Bantu verifikasi kelengkapan, identifikasi persyaratan yang kurang, jelaskan prosedur
- Untuk kartu mahasiswa: Jelaskan fasilitas yang bisa digunakan, bantu dengan pertanyaan akademik
- Untuk transkrip/ijazah: Bantu verifikasi untuk keperluan pendaftaran atau beasiswa
- Untuk screenshot sistem akademik: Berikan panduan langkah demi langkah untuk penggunaan sistem`;
};

const systemPrompt = buildSystemPrompt();

// Inisialisasi RAG System saat halaman dimuat
async function initializeRAGSystem() {
  try {
    console.log('🚀 Initializing Universitas Kristen Petra Customer Service System...');
    
    // Update status indicator
    if (kbStatus) {
      kbStatus.style.display = 'block';
      kbStatus.textContent = '⚡ Loading embedding system...';
      kbStatus.className = 'kb-status loading';
    }
    
    // Initialize embedding system
    await embeddingSystem.initialize();
    
    // Try to load existing PDFs from the project
    await loadExistingPDFs();
    
    if (kbStatus) {
      kbStatus.textContent = ragEnabled ? 
        '🧠 RAG Mode Ready - Knowledge Base Loaded' : 
        '⚡ Standard Mode Ready - Upload PDFs for RAG';
      kbStatus.className = ragEnabled ? 'kb-status rag-enabled' : 'kb-status';
      
      // Hide after 5 seconds
      setTimeout(() => {
        if (kbStatus) kbStatus.style.display = 'none';
      }, 5000);
    }
    
    const mode = ragEnabled ? "RAG (dengan knowledge base)" : "standar";
    addSystemMessage(`✅ Sistem Customer Service Universitas Kristen Petra siap! Mode: ${mode}`);
    
    console.log('✅ System initialized successfully');
    isRAGInitialized = true;
    
  } catch (error) {
    console.error('Error initializing system:', error);
    addSystemMessage("❌ Terjadi kesalahan saat memuat sistem. Menggunakan mode basic.");
    
    if (kbStatus) {
      kbStatus.textContent = '⚠️ Basic Mode Only';
      kbStatus.className = 'kb-status error';
    }
  }
}

// Load existing PDFs from the project
async function loadExistingPDFs() {
  try {
    const existingPDFs = DOCUMENT_SOURCES.map(doc => doc.path);
    const pdfUrls = existingPDFs.map(pdf => `./${pdf}`);
    
    console.log('🔄 Loading existing PDFs...');
    console.log(`📄 Found ${DOCUMENT_SOURCES.length} PDF sources to load:`, DOCUMENT_SOURCES.map(doc => ({
      name: doc.name,
      path: doc.path,
      priority: doc.priority
    })));
    
    const chunks = await pdfProcessor.processDocumentsForRAG(pdfUrls);
    if (chunks.length > 0) {
      // Create embeddings for chunks
      const embeddings = await embeddingSystem.createEmbeddingsFromTexts(
        chunks.map(chunk => chunk.text)
      );
      
      // Store in knowledge base
      knowledgeBase = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index]
      }));
      
      ragEnabled = true;
      console.log(`✅ Loaded ${knowledgeBase.length} chunks from existing PDFs:`);
      console.log('📚 Sources loaded:', DOCUMENT_SOURCES.map(doc => `${doc.name} (${doc.path})`));
    }
  } catch (error) {
    console.warn('⚠️ Could not load existing PDFs:', error.message);
    console.log('📝 You can still upload PDFs manually');
  }
}

// Fungsi untuk menambahkan pesan sistem
function addSystemMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", "system");
  messageElement.innerHTML = `<p style="color: #666; font-style: italic;">${message}</p>`;
  chatbox.appendChild(messageElement);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Fungsi untuk parsing list dari teks ke bullet HTML (tanpa ul/li)
function parseList(text) {
  let lines = text.split('\n');
  let html = '';
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (/^(\*|-|\d+\.)\s+/.test(line)) {
      line = line.replace(/^(\*|-|\d+\.)\s+/, '');
      html += `<p style="margin-left:1.2em;">&#8226; ${line}</p>`;
    } else if (line !== '') {
      html += `<p>${line}</p>`;
    }
  }
  return html;
}

// Fungsi untuk menambahkan pesan ke chatbox
function addMessage(sender, message, isCode = false) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", sender);

  if (isCode) {
    const preElement = document.createElement("pre");
    preElement.textContent = message;
    messageElement.appendChild(preElement);
  } else if (sender === "bot") {
    messageElement.innerHTML = parseList(message);
    
    // Add speaker button for bot messages
    const speakerBtn = document.createElement("button");
    speakerBtn.innerHTML = "🔊";
    speakerBtn.title = "Dengarkan response";
    speakerBtn.style.cssText = `
      margin-left: 8px;
      padding: 4px 8px;
      background: #b6e2d3;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    speakerBtn.onclick = () => speakText(message);
    messageElement.appendChild(speakerBtn);
  } else {
    const paragraphs = message.split("\n").filter((p) => p.trim() !== "");
    paragraphs.forEach((paragraph) => {
      const pElement = document.createElement("p");
      pElement.textContent = paragraph;
      messageElement.appendChild(pElement);
    });
  }

  chatbox.appendChild(messageElement);
  chatbox.scrollTop = chatbox.scrollHeight;
  return messageElement;
}

// Fungsi untuk menambahkan file ke chatbox
function addFileMessage(sender, file) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("file-message", sender);

  const fileName = file.name;
  const fileURL = URL.createObjectURL(file);

  const fileTitle = document.createElement("p");
  fileTitle.textContent = fileName;
  fileTitle.classList.add("file-title");
  messageElement.appendChild(fileTitle);

  if (/\.(jpeg|jpg|png|gif)$/i.test(fileName)) {
    const img = document.createElement("img");
    img.src = fileURL;
    img.alt = fileName;
    img.style.maxWidth = "200px";
    img.style.borderRadius = "10px";
    img.style.marginTop = "5px";
    img.style.border = sender === "user" ? "2px solid #b6e2d3" : "2px solid #b6e2d3";
    messageElement.appendChild(img);
  } else {
    const viewButton = document.createElement("button");
    viewButton.textContent = "View";
    viewButton.classList.add("view-button");
    viewButton.onclick = () => {
      window.open(fileURL, "_blank");
    };
    messageElement.appendChild(viewButton);
  }

  chatbox.appendChild(messageElement);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Fungsi untuk mengirim pesan ke AI
async function sendMessage(prompt, file = null) {
  try {
    let response;
    
    // Debug info
    console.log('📝 SendMessage called with:', { 
      prompt, 
      hasFile: !!file, 
      ragEnabled, 
      knowledgeBaseSize: knowledgeBase.length 
    });
    
    // Check if we have RAG enabled and can use it
    if (ragEnabled && knowledgeBase.length > 0) {
      console.log('🧠 Using RAG-enhanced response...');
      console.log('📚 Knowledge base contains:', knowledgeBase.map(chunk => ({
        source: chunk.source,
        textPreview: chunk.text.substring(0, 100) + '...'
      })));
      response = await sendRAGMessage(prompt, file);
    } else {
      console.log('🤖 Using standard AI response...');
      console.log('⚠️ RAG not available - ragEnabled:', ragEnabled, 'knowledgeBase.length:', knowledgeBase.length);
      response = await sendStandardMessage(prompt, file);
    }
    
    return response;
    
  } catch (error) {
    console.error("Error generating response:", error.message);
    return { 
      text: FALLBACK_RESPONSES.systemError, 
      isCode: false 
    };
  }
}

// Standard AI response (without RAG)
async function sendStandardMessage(prompt, file = null) {
  let contents = [];
  
  // Add system prompt and user text
  contents.push({
    role: "user", 
    parts: [{ text: `${systemPrompt}\n\nUser: ${prompt}` }]
  });
  
  // Handle file attachment
  if (file) {
    if (isImageFile(file)) {
      // Convert image to base64 for Gemini Vision
      const imageData = await fileToBase64(file);
      contents[0].parts.push({
        inlineData: {
          mimeType: file.type,
          data: imageData
        }
      });        contents[0].parts[0].text += `\n\nUser uploaded an image: ${file.name}. Please analyze this image in the context of Universitas Kristen Petra services.`;
    } else {
      contents[0].parts[0].text += `\n\nAttached file: ${file.name}`;
    }
  }

  const aiResponse = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: contents,
  });

  return {
    text: cleanMarkdownFormatting(aiResponse.text.trim()),
    isCode: aiResponse.text.includes("<") || aiResponse.text.includes("function"),
    hasImage: file && isImageFile(file)
  };
}

// RAG-enhanced response
async function sendRAGMessage(prompt, file = null) {
  try {
    console.log('🧠 === RAG MESSAGE START ===');
    console.log('Query:', prompt);
    console.log('Knowledge base status:', {
      enabled: ragEnabled,
      chunks: knowledgeBase.length,
      sources: knowledgeBase.map(c => c.source)
    });
    
    // Get relevant context from knowledge base
    const relevantChunks = await findRelevantContext(prompt);
    
    console.log(`📄 Retrieved ${relevantChunks.length} relevant chunks for query`);
    
    // If no chunks found, add a note to user
    if (relevantChunks.length === 0) {
      console.warn('⚠️ No relevant chunks found even with fallback!');
    }
    
    // Build enhanced prompt with context
    let enhancedPrompt = systemPrompt;
    
    if (relevantChunks.length > 0) {
      console.log('✅ Adding context to prompt');
      enhancedPrompt += "\n\nInformasi relevan dari knowledge base Universitas Kristen Petra:\n";
      relevantChunks.forEach((chunk, index) => {
        enhancedPrompt += `\n[Konteks ${index + 1}] (dari ${chunk.source}):\n${chunk.text}\n`;
        console.log(`Added chunk ${index + 1} from ${chunk.source} (similarity: ${chunk.similarity?.toFixed(3)})`);
      });
      enhancedPrompt += "\nGunakan informasi ini untuk memberikan jawaban yang akurat tentang layanan Universitas Kristen Petra. JAWAB SELALU DALAM BAHASA INDONESIA dan JANGAN GUNAKAN format markdown, asterisk, atau simbol khusus apapun. Gunakan teks biasa saja.\n";
    } else {
      console.log('⚠️ No relevant chunks found - proceeding without context');
    }
    
    enhancedPrompt += `\n\nPengguna: ${prompt}`;
    
    console.log('📝 Enhanced prompt length:', enhancedPrompt.length);
    console.log('📝 Enhanced prompt preview:', enhancedPrompt.substring(0, 500) + '...');
    
    let contents = [];
    contents.push({
      role: "user", 
      parts: [{ text: enhancedPrompt }]
    });
    
    // Handle file attachment
    if (file) {
      if (isImageFile(file)) {
        // Convert image to base64 for Gemini Vision
        const imageData = await fileToBase64(file);
        contents[0].parts.push({
          inlineData: {
            mimeType: file.type,
            data: imageData
          }
        });
        contents[0].parts[0].text += `\n\nUser uploaded an image: ${file.name}. Please analyze this image in the context of Universitas Kristen Petra services and the provided knowledge base.`;
      } else {
        contents[0].parts[0].text += `\n\nAttached file: ${file.name}`;
      }
    }

    console.log('🚀 Sending request to Gemini AI...');
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents,
    });

    // Calculate confidence based on context relevance
    const confidence = relevantChunks.length > 0 ? 
      Math.min(0.9, 0.6 + (relevantChunks.length * 0.1)) : 0.5;

    let responseText = aiResponse.text.trim();
    console.log('✅ Received AI response, length:', responseText.length);
    
    // Clean up any remaining markdown formatting
    responseText = cleanMarkdownFormatting(responseText);
    
    console.log('🧠 === RAG MESSAGE END ===');

    return {
      text: responseText,
      isCode: aiResponse.text.includes("<") || aiResponse.text.includes("function"),
      confidence: confidence,
      sources: relevantChunks.map(chunk => chunk.source),
      hasImage: file && isImageFile(file)
    };
    
  } catch (error) {
    console.error('RAG processing error:', error);
    // Fallback to standard response
    return await sendStandardMessage(prompt, file);
  }
}

// Find relevant context from knowledge base
async function findRelevantContext(query, topK = RAG_CONFIG.retrieval.topK, threshold = RAG_CONFIG.retrieval.similarityThreshold) {
  try {
    console.log(`🔍 Searching for: "${query}"`);
    console.log(`📚 Knowledge base has ${knowledgeBase.length} chunks`);
    console.log(`🔧 Using RAG_CONFIG - topK: ${topK}, threshold: ${threshold}`);
    
    if (knowledgeBase.length === 0) {
      console.warn('⚠️ Knowledge base is empty!');
      return [];
    }
    
    // Create embedding for the query
    console.log('🔄 Creating query embedding...');
    const queryEmbedding = await embeddingSystem.createEmbeddingsFromTexts([query]);
    const queryVector = queryEmbedding[0];
    console.log('✅ Query embedding created:', queryVector ? 'Success' : 'Failed');
    
    // Calculate similarities with all chunks
    console.log('🔄 Calculating similarities...');
    const similarities = knowledgeBase.map((chunk, index) => {
      const similarity = embeddingSystem.cosineSimilarity(queryVector, chunk.embedding);
      console.log(`Chunk ${index}: ${chunk.source} - Similarity: ${similarity.toFixed(3)}`);
      return {
        ...chunk,
        similarity: similarity
      };
    });
    
    // Debug: Show all similarities with more detail
    console.log('🔍 All similarities with preview:', similarities.map(s => ({
      source: s.source,
      similarity: s.similarity.toFixed(3),
      preview: s.text.substring(0, 150) + '...'
    })));
    
    // Sort by similarity and filter by threshold
    const relevantChunks = similarities
      .filter(chunk => {
        const isRelevant = chunk.similarity >= threshold;
        console.log(`Filter: ${chunk.source} - ${chunk.similarity.toFixed(3)} >= ${threshold} ? ${isRelevant}`);
        return isRelevant;
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
    
    console.log(`🔍 Found ${relevantChunks.length} relevant chunks (threshold: ${threshold})`);
    
    // If no results with threshold, get top results anyway
    if (relevantChunks.length === 0) {
      console.log(`🔍 No results above threshold, getting top ${RAG_CONFIG.retrieval.maxResults} results anyway...`);
      const topResults = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, RAG_CONFIG.retrieval.maxResults);
      
      console.log('🔍 Top results (fallback):', topResults.map(r => ({
        source: r.source,
        similarity: r.similarity.toFixed(3),
        preview: r.text.substring(0, 100) + '...'
      })));
      
      return topResults;
    }
    
    console.log('🔍 Final relevant chunks:', relevantChunks.map(r => ({
      source: r.source,
      similarity: r.similarity.toFixed(3),
      preview: r.text.substring(0, 100) + '...'
    })));

    return relevantChunks;
    
  } catch (error) {
    console.error('❌ Error finding relevant context:', error);
    return [];
  }
}

// Event listener untuk tombol "Kirim"
sendBtn.addEventListener("click", async () => {
  const prompt = userInput.value.trim();
  if (!prompt && !uploadedFile) {
    userInput.focus();
    return;
  }

  // Add user message
  if (prompt) {
    addMessage("user", prompt);
  }
  
  // Add file message if there's an uploaded file
  if (uploadedFile) {
    addFileMessage("user", uploadedFile);
  }
  
  userInput.value = "";

  // Show appropriate loading message
  let loadingMessage = "💭 Memproses pertanyaan...";
  if (uploadedFile && isImageFile(uploadedFile)) {
    loadingMessage = "👁️ Menganalisis gambar...";
  } else if (uploadedFile) {
    loadingMessage = "📄 Memproses file...";
  }
  
  const loadingMsg = addMessage("bot", loadingMessage);

  const { text: botResponse, isCode, hasImage } = await sendMessage(prompt || "Tolong analisis file yang saya upload", uploadedFile);

  // Remove loading message
  if (loadingMsg && loadingMsg.parentNode) {
    loadingMsg.parentNode.removeChild(loadingMsg);
  }
  
  // Add image analysis indicator if applicable
  if (hasImage) {
    addMessage("bot", "📷 Gambar telah dianalisis", false);
  }
  
  addMessage("bot", botResponse, isCode);

  uploadedFile = null;
});

// Enter untuk kirim pesan
userInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});

// Event listener untuk tombol upload
uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

// Event listener untuk input file (hanya untuk gambar)
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (file) {
    // Validasi hanya gambar yang diterima
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedImageTypes.includes(file.type)) {
      addSystemMessage("❌ File harus berupa gambar (JPG, JPEG, PNG, GIF, WebP, BMP)");
      fileInput.value = "";
      return;
    }
    
    uploadedFile = file;
    addFileMessage("user", file);
    fileInput.value = "";
  }
});

// PDF Upload functionality
if (pdfUploadBtn && pdfFileInput) {
  pdfUploadBtn.addEventListener("click", () => {
    pdfFileInput.click();
  });

  pdfFileInput.addEventListener("change", async () => {
    const files = pdfFileInput.files;
    if (files.length > 0) {
      await processPDFUpload(files);
      pdfFileInput.value = ""; // Reset input
    }
  });
}

// Process uploaded PDF files for RAG
async function processPDFUpload(files) {
  try {
    // Show loading message
    addSystemMessage("🔄 Memproses file untuk knowledge base...");
    
    if (kbStatus) {
      kbStatus.style.display = 'block';
      kbStatus.textContent = '🔄 Processing files...';
      kbStatus.className = 'kb-status loading';
    }
    
    // Validasi hanya PDF yang diterima
    const pdfFiles = [];
    
    Array.from(files).forEach(file => {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        pdfFiles.push(file);
      } else {
        addSystemMessage(`❌ File "${file.name}" diabaikan. Hanya file PDF yang diterima untuk knowledge base.`);
      }
    });
    
    if (pdfFiles.length === 0) {
      addSystemMessage("❌ Tidak ada file PDF yang valid ditemukan.");
      if (kbStatus) {
        kbStatus.style.display = 'none';
      }
      return;
    }
    
    let allChunks = [];
    
    // Process PDF files only
    console.log(`🔄 Processing ${pdfFiles.length} PDF files...`);
    const pdfChunks = await pdfProcessor.processDocumentsForRAG(pdfFiles);
    allChunks.push(...pdfChunks);
    
    if (allChunks.length === 0) {
      addSystemMessage("❌ Tidak ada konten yang berhasil diekstrak dari file PDF.");
      return;
    }
    
    console.log('📄 All extracted chunks:', allChunks.map(chunk => ({
      source: chunk.source,
      textLength: chunk.text.length,
      preview: chunk.text.substring(0, 100) + '...'
    })));
    
    // Create embeddings for new chunks
    console.log('🔄 Creating embeddings for', allChunks.length, 'chunks...');
    const embeddings = await embeddingSystem.createEmbeddingsFromTexts(
      allChunks.map(chunk => chunk.text)
    );
    
    console.log('✅ Embeddings created:', embeddings.length, 'vectors');
    console.log('🔍 First embedding info:', embeddings[0] ? {
      length: embeddings[0].length,
      type: typeof embeddings[0],
      sample: embeddings[0].slice(0, 5)
    } : 'No embedding created');
    
    // Add to knowledge base
    const newChunks = allChunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index]
    }));
    
    console.log('📚 Adding chunks to knowledge base...');
    knowledgeBase.push(...newChunks);
    ragEnabled = true;
    
    console.log('✅ Knowledge base updated:', {
      totalChunks: knowledgeBase.length,
      ragEnabled: ragEnabled,
      chunkSources: knowledgeBase.map(c => c.source)
    });
    
    // Update status
    if (kbStatus) {
      kbStatus.textContent = `🧠 RAG Enhanced - ${knowledgeBase.length} chunks loaded`;
      kbStatus.className = 'kb-status rag-enabled';
      
      setTimeout(() => {
        if (kbStatus) kbStatus.style.display = 'none';
      }, 5000);
    }
    
    // Show success message
    const fileNames = Array.from(files).map(f => f.name).join(', ');
    const fileTypes = [];
    if (pdfFiles.length > 0) fileTypes.push(`${pdfFiles.length} PDF`);
    if (imageFiles.length > 0) fileTypes.push(`${imageFiles.length} gambar`);
    
    addSystemMessage(`✅ Berhasil memproses ${allChunks.length} chunks dari ${fileTypes.join(' dan ')}: ${fileNames}`);
    addSystemMessage("🧠 Mode RAG sekarang aktif! Saya akan menjawab berdasarkan dokumen yang diupload.");
    addSystemMessage("💡 TIP: Tanyakan hal spesifik tentang isi dokumen untuk hasil terbaik.");
    
    console.log(`✅ Added ${allChunks.length} chunks to knowledge base`);
    
  } catch (error) {
    console.error('Error processing files:', error);
    addSystemMessage(`❌ Gagal memproses file: ${error.message}`);
    
    if (kbStatus) {
      kbStatus.textContent = '❌ File Processing Failed';
      kbStatus.className = 'kb-status error';
    }
  }
}

// === Floating Chat Button Logic ===
if (csFloatBtn && chatWidget) {
  csFloatBtn.addEventListener("click", () => {
    console.log('🖱️ Chat button clicked!');
    console.log('chatWidget before:', chatWidget?.classList);
    
    chatWidget.classList.add("open");
    
    console.log('chatWidget after:', chatWidget?.classList);
    
    setTimeout(() => {
      if (userInput) {
        userInput.focus();
        console.log('✅ Input focused');
      }
    }, 300);
  });
} else {
  console.error('❌ Cannot add chat button event listener - elements not found');
}

if (closeChat && chatWidget) {
  closeChat.addEventListener("click", () => {
    console.log('❌ Close button clicked!');
    chatWidget.classList.remove("open");
  });
} else {
  console.error('❌ Cannot add close button event listener - elements not found');
}

// Tutup chat jika klik di luar widget (opsional)
document.addEventListener("mousedown", (e) => {
  if (
    chatWidget.classList.contains("open") &&
    !chatWidget.contains(e.target) &&
    !csFloatBtn.contains(e.target)
  ) {
    chatWidget.classList.remove("open");
  }
});

// =====================
// MODE TELEPON BOT BERGANTIAN
// =====================
// ...existing code...

let callActive = false;
let recognitionCall = null;
let callMicRecognition = null;
let isBotSpeaking = false;
let isUserListening = false;
let isCallMicListening = false;
let lastBotMsg = "Halo, selamat datang di Universitas Kristen Petra! Ada yang bisa saya bantu?";
let callStarted = false;

// Utility: animasi mulut bot saat bicara
function setBotTalking(talking) {
  if (talking) {
    botMouth.style.height = "28px";
    botMouth.style.background = "#f7cac9";
  } else {
    botMouth.style.height = "12px";
    botMouth.style.background = "#fff";
  }
}

// Utility: TTS dengan animasi mulut
function speakBotCall(text, onEnd) {
  console.log('🔊 speakBotCall called with:', text);
  
  if ('speechSynthesis' in window) {
    console.log('✅ speechSynthesis is available');
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);

    let voices = window.speechSynthesis.getVoices();
    console.log('🎙️ Available voices:', voices.length);
    
    let indoVoice = voices.find(v => v.lang === "id-ID");
    if (indoVoice) {
      console.log('✅ Indonesian voice found:', indoVoice.name);
      utter.voice = indoVoice;
      utter.lang = "id-ID";
    } else {
      console.log('⚠️ No Indonesian voice, using default:', voices[0]?.name);
      utter.voice = voices[0];
      utter.lang = voices[0]?.lang || "en-US";
    }

    utter.rate = 0.9;  // Slightly slower for better clarity
    utter.pitch = 1;
    utter.volume = 1;  // Ensure volume is at maximum

    utter.onstart = () => {
      console.log('🎤 TTS started');
      setBotTalking(true);
      isBotSpeaking = true;
    };
    utter.onend = () => {
      console.log('🎤 TTS ended');
      setBotTalking(false);
      isBotSpeaking = false;
      if (onEnd) onEnd();
    };
    utter.onerror = (event) => {
      console.error('❌ TTS error:', event.error);
      setBotTalking(false);
      isBotSpeaking = false;
      if (onEnd) onEnd();
    };

    if (voices.length === 0) {
      console.log('⚠️ No voices loaded yet, waiting for voices...');
      window.speechSynthesis.onvoiceschanged = () => {
        let voices2 = window.speechSynthesis.getVoices();
        console.log('🔄 Voices loaded:', voices2.length);
        let indoVoice2 = voices2.find(v => v.lang === "id-ID");
        if (indoVoice2) {
          console.log('✅ Indonesian voice found on reload:', indoVoice2.name);
          utter.voice = indoVoice2;
          utter.lang = "id-ID";
        } else {
          console.log('⚠️ Using default voice:', voices2[0]?.name);
          utter.voice = voices2[0];
          utter.lang = voices2[0]?.lang || "en-US";
        }
        console.log('🚀 Speaking with voice:', utter.voice?.name);
        window.speechSynthesis.speak(utter);
      };
    } else {
      console.log('🚀 Speaking immediately with voice:', utter.voice?.name);
      window.speechSynthesis.speak(utter);
    }
  } else {
    console.error('❌ speechSynthesis not supported');
    if (onEnd) onEnd();
  }
}

// Utility: STT (speech-to-text) untuk mode call
function startRecognitionCall(onResult, onEnd) {
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    if (recognitionCall) {
      recognitionCall.abort();
      recognitionCall = null;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionCall = new SpeechRecognition();
    recognitionCall.lang = "id-ID";
    recognitionCall.continuous = false;
    recognitionCall.interimResults = false;

    isUserListening = true;
    callStatus.textContent = "Silakan bicara...";

    recognitionCall.onresult = (event) => {
      isUserListening = false;
      const transcript = event.results[0][0].transcript;
      callStatus.textContent = "Menjawab...";
      if (onResult) onResult(transcript);
    };
    recognitionCall.onend = () => {
      isUserListening = false;
      if (onEnd) onEnd();
    };
    recognitionCall.onerror = (e) => {
      isUserListening = false;
      callStatus.textContent = "Tidak terdengar. Coba lagi.";
      setTimeout(() => {
        if (callActive && !isBotSpeaking) startRecognitionCall(onResult, onEnd);
      }, 1200);
    };
    recognitionCall.start();
  } else {
    callStatus.textContent = "Browser tidak mendukung voice input.";
    if (onEnd) onEnd();
  }
}

// Proses percakapan telepon bot dengan sistem toggle manual
function startCallBotConversation(initMsg = "Halo, selamat datang di Universitas Kristen Petra! Ada yang bisa saya bantu?") {
  if (!callActive) return;
  lastBotMsg = initMsg;
  callStatus.textContent = "Bot berbicara...";
  updateSpeechText('Bot sedang berbicara...', 'listening');
  
  speakBotCall(lastBotMsg, () => {
    if (!callActive) return;
    setTimeout(() => {
      if (!callActive) return;
      // Setelah bot selesai bicara, siapkan untuk mendengarkan manual
      callStatus.textContent = "Siap mendengarkan";
      updateSpeechText('Tekan tombol mic untuk mulai berbicara, tekan lagi untuk berhenti', '');
    }, 300);
  });
}



// Event: Mulai telepon bot
callBotBtn.addEventListener("click", () => {
  if (callActive) return;
  callActive = true;
  callStarted = false;
  callPopup.classList.add("open");
  callStatus.textContent = "Menghubungi bot...";
  updateSpeechText('Menghubungkan...', 'listening');
  setBotTalking(false);
  
  // Initialize call mic recognition
  if (!callMicRecognition) {
    initializeCallMicRecognition();
  }
  
  setTimeout(() => {
    if (!callStarted) {
      callStarted = true;
      startCallBotConversation();
    }
  }, 800);
});

// Event: Tutup telepon bot
endCallBtn.addEventListener("click", () => {
  callActive = false;
  callStarted = false;
  callPopup.classList.remove("open");
  setBotTalking(false);
  updateSpeechText('', '');
  
  // Stop all voice activities
  if (recognitionCall) recognitionCall.abort();
  if (callMicRecognition) callMicRecognition.abort();
  if (isCallMicListening) {
    isCallMicListening = false;
    updateCallMicButton();
  }
  
  window.speechSynthesis.cancel();
});

// Event: Tombol mic di popup telepon
if (callMicBtn) {
  callMicBtn.addEventListener("click", toggleCallMicRecognition);
} else {
  console.error('❌ Call mic button not found!');
}

// === RAG System Initialization ===
// Inisialisasi RAG system saat halaman dimuat
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌟 Universitas Kristen Petra Customer Service System Starting...');
  console.log('🔍 DOM fully loaded, checking elements again...');
  
  // Re-check elements after DOM is loaded
  const chatboxCheck = document.getElementById("chatbox");
  const csFloatBtnCheck = document.getElementById("cs-float-btn");
  const chatWidgetCheck = document.getElementById("chat-widget");
  
  console.log('Elements after DOM load:');
  console.log('chatbox:', chatboxCheck);
  console.log('csFloatBtn:', csFloatBtnCheck);
  console.log('chatWidget:', chatWidgetCheck);
  
  // Tunggu sebentar agar UI selesai loading
  setTimeout(async () => {
    await initializeRAGSystem();
  }, 1000);
});

// === Additional RAG Features ===

// Fungsi untuk menampilkan informasi sistem
function showSystemInfo() {
  console.log("📊 Status: Standard mode active - Universitas Kristen Petra Customer Service ready");
  addSystemMessage("📊 Status: Mode standar aktif - Customer Service Universitas Kristen Petra siap melayani");
}

// === Additional Features ===

// Fungsi untuk reload sistem
async function reloadSystem() {
  addSystemMessage("� Memuat ulang sistem...");
  await initializeRAGSystem();
}

// Shortcut commands untuk debugging (gunakan di console)
window.PetraCustomerService = {
  info: showSystemInfo,
  // Add manual chat opening function
  openChat: () => {
    console.log('🔧 Manually opening chat...');
    const widget = document.getElementById("chat-widget");
    if (widget) {
      widget.classList.add("open");
      console.log('✅ Chat opened manually');
    } else {
      console.error('❌ Chat widget not found');
    }
  },
  closeChat: () => {
    console.log('🔧 Manually closing chat...');
    const widget = document.getElementById("chat-widget");
    if (widget) {
      widget.classList.remove("open");
      console.log('✅ Chat closed manually');
    } else {
      console.error('❌ Chat widget not found');
    }
  },
  testMessage: async (message) => {
    console.log('🧪 Testing message:', message);
    const response = await sendMessage(message);
    console.log('🤖 Response:', response);
    return response;
  }
};

console.log('🎯 Universitas Kristen Petra Customer Service System loaded! Use PetraCustomerService.info() to check status.');

// Helper function to check if file is an image
function isImageFile(file) {
  return file && /\.(jpeg|jpg|png|gif|webp)$/i.test(file.name);
}

// Convert file to base64 for Gemini Vision API
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the data:image/jpeg;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Extract text from images using OCR (if needed)
async function extractTextFromImage(file) {
  try {
    // For now, we'll rely on Gemini Vision to read text from images
    // This function can be extended with dedicated OCR libraries if needed
    console.log(`📷 Image will be processed by Gemini Vision: ${file.name}`);
    return null; // Gemini Vision will handle text extraction
  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
}

// Utility function to clean markdown formatting from text
function cleanMarkdownFormatting(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
    .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
    .replace(/__(.*?)__/g, '$1')      // Remove __underline__
    .replace(/_(.*?)_/g, '$1')        // Remove _emphasis_
    .replace(/`(.*?)`/g, '$1')        // Remove `code`
    .replace(/~~(.*?)~~/g, '$1');     // Remove ~~strikethrough~~
}

// Utility function untuk TTS di chat biasa
function speakText(text) {
  console.log('🔊 speakText called with:', text);
  
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);

    let voices = window.speechSynthesis.getVoices();
    let indoVoice = voices.find(v => v.lang === "id-ID");
    
    if (indoVoice) {
      utter.voice = indoVoice;
      utter.lang = "id-ID";
    } else {
      utter.voice = voices[0];
      utter.lang = voices[0]?.lang || "en-US";
    }

    utter.rate = 0.9;
    utter.pitch = 1;
    utter.volume = 1;

    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        let voices2 = window.speechSynthesis.getVoices();
        let indoVoice2 = voices2.find(v => v.lang === "id-ID");
        if (indoVoice2) {
          utter.voice = indoVoice2;
          utter.lang = "id-ID";
        }
        window.speechSynthesis.speak(utter);
      };
    } else {
      window.speechSynthesis.speak(utter);
    }
  } else {
    console.error('❌ speechSynthesis not supported');
  }
}

// Speech-to-Text variables
let isListening = false;
let recognition = null;

// Initialize Speech Recognition
function initializeSpeechRecognition() {
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      isListening = true;
      updateMicButton();
    };
    
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      // Update input field with transcript
      if (userInput) {
        userInput.value = transcript;
      }
      
      console.log('🎤 Voice transcript:', transcript);
    };
    
    recognition.onend = () => {
      console.log('🎤 Voice recognition ended');
      isListening = false;
      updateMicButton();
    };
    
    recognition.onerror = (event) => {
      console.error('🎤 Voice recognition error:', event.error);
      isListening = false;
      updateMicButton();
      
      // Show user-friendly error message
      if (event.error === 'not-allowed') {
        addSystemMessage('❌ Akses mikrofon ditolak. Silakan izinkan akses mikrofon di browser.');
      } else if (event.error === 'no-speech') {
        addSystemMessage('⚠️ Tidak ada suara terdeteksi. Coba bicara lebih jelas.');
      } else {
        addSystemMessage('❌ Terjadi kesalahan pada pengenalan suara. Coba lagi.');
      }
    };
    
    return true;
  } else {
    console.warn('❌ Speech recognition not supported');
    return false;
  }
}

// Start/Stop voice recognition
function toggleVoiceRecognition() {
  if (!recognition) {
    if (!initializeSpeechRecognition()) {
      addSystemMessage('❌ Browser Anda tidak mendukung pengenalan suara. Gunakan Chrome atau Edge untuk fitur ini.');
      return;
    }
  }
  
  if (isListening) {
    recognition.stop();
  } else {
    // Clear input field before starting
    if (userInput) {
      userInput.value = '';
    }
    recognition.start();
  }
}

// Update mic button appearance
function updateMicButton() {
  const micBtn = document.getElementById('micBtn');
  if (micBtn) {
    if (isListening) {
      micBtn.textContent = '🛑';
      micBtn.title = 'Berhenti merekam';
      micBtn.style.backgroundColor = '#ff6b6b';
      micBtn.style.animation = 'pulse 1s infinite';
    } else {
      micBtn.textContent = '🎤';
      micBtn.title = 'Klik untuk berbicara';
      micBtn.style.backgroundColor = '#4CAF50';
      micBtn.style.animation = 'none';
    }
  }
}

// Get mic button element
const micBtn = document.getElementById("micBtn");

// Add event listener for mic button
if (micBtn) {
  micBtn.addEventListener("click", toggleVoiceRecognition);
} else {
  console.error('❌ Mic button not found!');
}

// Initialize speech recognition when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize speech recognition capability check
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    console.log('✅ Speech recognition supported');
    // Initialize but don't start yet
    initializeSpeechRecognition();
  } else {
    console.warn('❌ Speech recognition not supported');
    // Hide mic button if not supported
    if (micBtn) {
      micBtn.style.display = 'none';
    }
  }
});

// Speech-to-Text khusus untuk popup telepon dengan visual feedback (sistem toggle)
function initializeCallMicRecognition() {
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    callMicRecognition = new SpeechRecognition();
    callMicRecognition.lang = "id-ID";
    callMicRecognition.continuous = true; // Ubah menjadi true untuk toggle mode
    callMicRecognition.interimResults = true;
    callMicRecognition.maxAlternatives = 1;
    
    let currentTranscript = '';
    
    callMicRecognition.onstart = () => {
      console.log('🎤 Call mic recognition started (toggle mode)');
      isCallMicListening = true;
      updateCallMicButton();
      updateSpeechText('Mendengarkan... (tekan tombol lagi untuk berhenti)', 'listening');
      callStatus.textContent = "Sedang mendengarkan";
      currentTranscript = '';
    };
    
    callMicRecognition.onresult = (event) => {
      let transcript = '';
      
      // Gabungkan semua hasil
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      currentTranscript = transcript;
      
      // Update speech text dengan hasil real-time
      updateSpeechText(`"${transcript}"`, 'has-text');
      console.log('🎤 Call mic transcript (real-time):', transcript);
    };
    
    callMicRecognition.onend = () => {
      console.log('🎤 Call mic recognition ended');
      isCallMicListening = false;
      updateCallMicButton();
      
      // Jika ada transcript dan bukan karena error, kirim ke bot
      if (currentTranscript.trim() && callActive) {
        callStatus.textContent = "Memproses...";
        updateSpeechText('Memproses jawaban...', 'listening');
        
        setTimeout(async () => {
          if (callActive && currentTranscript.trim()) {
            // Kirim ke AI
            const { text: botResponse } = await sendMessage(currentTranscript);
            lastBotMsg = botResponse;
            
            // Bot berbicara
            setTimeout(() => {
              if (callActive) {
                updateSpeechText('Bot sedang menjawab', 'listening');
                speakBotCall(lastBotMsg, () => {
                  if (callActive) {
                    updateSpeechText('Tekan tombol mic untuk berbicara lagi', '');
                    callStatus.textContent = "Siap mendengarkan";
                  }
                });
              }
            }, 500);
          }
        }, 500);
      } else {
        updateSpeechText('Tekan tombol mic untuk berbicara', '');
        callStatus.textContent = "Siap mendengarkan";
      }
    };
    
    callMicRecognition.onerror = (event) => {
      console.error('🎤 Call mic recognition error:', event.error);
      isCallMicListening = false;
      updateCallMicButton();
      
      // Show user-friendly error message
      if (event.error === 'not-allowed') {
        updateSpeechText('❌ Akses mikrofon ditolak', 'has-text');
        callStatus.textContent = "Akses mikrofon diperlukan";
      } else if (event.error === 'no-speech') {
        updateSpeechText('⚠️ Tidak ada suara terdeteksi', 'has-text');
        callStatus.textContent = "Coba bicara lebih jelas";
      } else {
        updateSpeechText('❌ Terjadi kesalahan pada pengenalan suara', 'has-text');
        callStatus.textContent = "Coba lagi";
      }
    };
    
    return true;
  } else {
    console.warn('❌ Speech recognition not supported');
    return false;
  }
}

// Toggle voice recognition untuk popup telepon (sistem toggle)
function toggleCallMicRecognition() {
  if (!callMicRecognition) {
    if (!initializeCallMicRecognition()) {
      updateSpeechText('❌ Browser tidak mendukung pengenalan suara', 'has-text');
      callStatus.textContent = "Fitur tidak didukung";
      return;
    }
  }
  
  if (isCallMicListening) {
    // Stop recording
    console.log('🛑 Stopping call mic recording...');
    callMicRecognition.stop();
    callStatus.textContent = "Menghentikan recording...";
  } else {
    // Start recording
    console.log('🎤 Starting call mic recording...');
    updateSpeechText('Bersiap mendengarkan...', 'listening');
    callStatus.textContent = "Memulai recording...";
    
    try {
      callMicRecognition.start();
    } catch (error) {
      console.error('❌ Error starting recognition:', error);
      updateSpeechText('❌ Gagal memulai pengenalan suara', 'has-text');
      callStatus.textContent = "Gagal memulai";
    }
  }
}

// Update tampilan tombol mic di popup telepon (sistem toggle)
function updateCallMicButton() {
  if (callMicBtn) {
    if (isCallMicListening) {
      callMicBtn.textContent = '🛑';
      callMicBtn.title = 'Tekan untuk berhenti merekam';
      callMicBtn.classList.add('recording');
    } else {
      callMicBtn.textContent = '🎤';
      callMicBtn.title = 'Tekan untuk mulai merekam';
      callMicBtn.classList.remove('recording');
    }
  }
}

// Update tampilan teks hasil speech (sistem toggle)
function updateSpeechText(text, className = '') {
  if (speechText) {
    speechText.textContent = text || 'Tekan tombol mic untuk mulai berbicara, tekan lagi untuk berhenti';
    speechText.className = `speech-text ${className}`;
  }
}

// Note: Helper functions for quick responses have been removed
// All admission-related queries will now be handled by the RAG system
// This ensures comprehensive responses based on the knowledge base
