# BCA Customer Service AI with RAG Setup

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js installed on your system
- Your Gemini AI API key
- PDF documents in the root directory (`source-1.PDF`, `source-2.pdf`)

### 2. Installation
The required dependencies are already installed:
- `pdf-parse` - For PDF text extraction
- `@tensorflow/tfjs` - TensorFlow.js for machine learning
- `@tensorflow-models/universal-sentence-encoder` - For semantic embeddings
- `@google/genai` - Gemini AI integration

### 3. System Features

#### 🧠 RAG (Retrieval Augmented Generation)
- **Document Processing**: Automatically extracts text from your BCA PDF documents
- **Semantic Search**: Uses Universal Sentence Encoder to find relevant information
- **Enhanced Responses**: Combines document knowledge with AI generation

#### 🏦 BCA Customer Service Specific
- Focused on banking and BCA-related queries
- Professional Indonesian language responses
- Context-aware answers based on your documents
- Confidence scoring for response reliability

#### 💾 Smart Caching
- Embeddings are cached in localStorage for faster loading
- Automatic fallback to standard mode if RAG fails
- Real-time status indicators

### 4. How It Works

1. **Initialization**: System loads and processes your PDF documents
2. **Text Chunking**: Documents are split into manageable chunks
3. **Embedding Creation**: Each chunk gets a vector representation
4. **Query Processing**: User questions are matched against document chunks
5. **Response Generation**: AI generates answers using relevant context

### 5. Usage

#### Starting the System
```bash
npm run dev
```

#### Testing RAG Features
Open browser console and use:
```javascript
// Check system status
BCACustomerService.info()

// Search documents directly
BCACustomerService.search("cara transfer uang")

// Reload knowledge base
BCACustomerService.reload()

// Reset entire system
BCACustomerService.reset()
```

#### Example Queries to Test
- "Bagaimana cara membuka rekening BCA?"
- "Apa saja jenis kartu kredit BCA?"
- "Bagaimana cara transfer ke bank lain?"
- "Berapa biaya admin bulanan?"
- "Jam operasional bank BCA?"

### 6. System Status Indicators

- **🟢 Green**: Knowledge base loaded successfully
- **🟡 Orange**: Loading in progress
- **🔴 Red**: Error occurred, using standard mode

### 7. Customization

#### Adding More Documents
```javascript
// In console
BCACustomerService.addDocuments(['new-document.pdf'])
```

#### Adjusting RAG Parameters
Edit in `ragSystem.js`:
- `topK`: Number of relevant chunks to retrieve
- `similarityThreshold`: Minimum similarity score
- `maxContextLength`: Maximum context length for AI

### 8. Troubleshooting

#### Common Issues
1. **PDFs not loading**: Check file paths and permissions
2. **Embeddings fail**: Ensure TensorFlow.js loads properly
3. **Memory issues**: Reduce batch size in embedding creation
4. **CORS errors**: Run through a local server (Vite handles this)

#### Performance Tips
- First load takes longer (model download + embedding creation)
- Subsequent loads are faster (cached embeddings)
- Larger PDFs = more processing time
- Clear cache if documents change

### 9. File Structure
```
src/
├── index.html          # Main UI
├── script.js           # Main application logic
├── style.css           # Styling
├── pdfProcessor.js     # PDF text extraction
├── embeddingSystem.js  # Semantic search system
└── ragSystem.js        # Main RAG orchestration

source-1.PDF            # Your BCA document 1
source-2.pdf            # Your BCA document 2
```

### 10. API Key Security
⚠️ **Important**: Replace the API key in `script.js` with your own Gemini API key:
```javascript
const API_KEY = "YOUR_GEMINI_API_KEY_HERE";
```

For production, use environment variables or secure key management.

---

## 🎯 Ready to Use!

Your BCA Customer Service AI is now equipped with:
- ✅ Document-based knowledge
- ✅ Semantic search capabilities  
- ✅ Professional banking responses
- ✅ Real-time status monitoring
- ✅ Intelligent fallback mechanisms

Start the development server and test with BCA-related questions!
