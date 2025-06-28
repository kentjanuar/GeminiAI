/**
 * Demo script for testing BCA Customer Service RAG System
 * Open browser console and run these commands to test functionality
 */

// Test queries for BCA Customer Service
const TEST_QUERIES = [
  "Bagaimana cara membuka rekening BCA?",
  "Apa saja jenis kartu kredit BCA?", 
  "Berapa biaya admin bulanan rekening BCA?",
  "Bagaimana cara transfer ke bank lain?",
  "Jam operasional bank BCA?",
  "Cara menggunakan BCA Mobile?",
  "Syarat pengajuan KPR BCA?",
  "Bunga deposito BCA saat ini?",
  "Cara mengatasi kartu ATM terblokir?",
  "Lokasi ATM BCA terdekat?"
];

// Demo functions (run in browser console)
window.BCADemo = {
  
  // Test a single query
  async testQuery(query) {
    console.log(`🧪 Testing query: "${query}"`);
    
    if (!window.BCACustomerService) {
      console.error('❌ BCA Customer Service system not loaded');
      return;
    }
    
    const startTime = performance.now();
    const results = await window.BCACustomerService.search(query);
    const endTime = performance.now();
    
    console.log(`⏱️ Search took ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`📊 Found ${results.length} relevant chunks:`);
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   Source: ${result.chunk.source}`);
      console.log(`   Text: ${result.chunk.text.substring(0, 100)}...`);
      console.log('---');
    });
    
    return results;
  },
  
  // Test multiple queries
  async testAll() {
    console.log('🚀 Running comprehensive BCA RAG system test...');
    
    for (const query of TEST_QUERIES) {
      await this.testQuery(query);
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ All tests completed!');
  },
  
  // Performance benchmark
  async benchmark() {
    console.log('⚡ Running performance benchmark...');
    
    const times = [];
    
    for (let i = 0; i < 5; i++) {
      const query = TEST_QUERIES[Math.floor(Math.random() * TEST_QUERIES.length)];
      const startTime = performance.now();
      
      await window.BCACustomerService.search(query);
      
      const endTime = performance.now();
      times.push(endTime - startTime);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`📈 Benchmark Results:`);
    console.log(`   Average: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min: ${minTime.toFixed(2)}ms`);
    console.log(`   Max: ${maxTime.toFixed(2)}ms`);
    
    return { avgTime, minTime, maxTime, times };
  },
  
  // Check system health
  checkHealth() {
    console.log('🏥 System Health Check:');
    
    if (window.BCACustomerService) {
      console.log('✅ BCA Customer Service system loaded');
      window.BCACustomerService.info();
    } else {
      console.log('❌ BCA Customer Service system not loaded');
    }
    
    // Check localStorage
    const embeddings = localStorage.getItem('bca_embeddings');
    if (embeddings) {
      const data = JSON.parse(embeddings);
      console.log(`✅ Cached embeddings found: ${data.chunks?.length || 0} chunks`);
    } else {
      console.log('❌ No cached embeddings found');
    }
    
    // Check TensorFlow
    if (window.tf) {
      console.log('✅ TensorFlow.js loaded');
      console.log(`   Backend: ${tf.getBackend()}`);
      console.log(`   Memory: ${JSON.stringify(tf.memory())}`);
    } else {
      console.log('❌ TensorFlow.js not loaded');
    }
  },
  
  // Interactive test
  async interactive() {
    console.log('🎮 Interactive test mode - Enter your queries:');
    
    let query = prompt('Enter your BCA question (or "exit" to stop):');
    
    while (query && query.toLowerCase() !== 'exit') {
      await this.testQuery(query);
      query = prompt('Enter another question (or "exit" to stop):');
    }
    
    console.log('👋 Interactive test completed!');
  }
};

// Auto-run basic health check when script loads
console.log('🔧 BCA Demo Script Loaded!');
console.log('📝 Available commands:');
console.log('   BCACustomerService.openChat()');
console.log('   BCACustomerService.closeChat()');
console.log('   BCACustomerService.info()');
console.log('   BCACustomerService.testMessage("your question")');
console.log('');

// Wait for system to load, then run health check
setTimeout(() => {
  console.log('🏥 Basic System Check:');
  
  if (window.BCACustomerService) {
    console.log('✅ BCA Customer Service system loaded');
  } else {
    console.log('❌ BCA Customer Service system not loaded');
  }
  
  // Check basic elements
  const chatWidget = document.getElementById("chat-widget");
  const floatBtn = document.getElementById("cs-float-btn");
  
  if (chatWidget) {
    console.log('✅ Chat widget found');
  } else {
    console.log('❌ Chat widget not found');
  }
  
  if (floatBtn) {
    console.log('✅ Float button found');
  } else {
    console.log('❌ Float button not found');
  }
}, 2000);

export default window.BCADemo;
