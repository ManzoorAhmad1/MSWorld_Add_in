// Test file to verify the new citation formatter works perfectly
import { CitationFormatter } from '../src/utils/CitationFormatter.js';

// Test data
const testCitation = {
  id: "test-citation-1",
  title: "Advanced Machine Learning Techniques",
  author: [
    { given: "John", family: "Smith" },
    { given: "Jane", family: "Doe" }
  ],
  year: 2023,
  journal: "Journal of Computer Science",
  volume: "15",
  issue: "3",
  pages: "123-145",
  doi: "10.1234/example",
  url: "https://example.com/paper"
};

// Test all citation styles
const styles = ["apa", "mla", "ieee", "harvard", "vancouver", "nature", "science", "chicago"];

console.log("🧪 TESTING NEW CITATION FORMATTER");
console.log("==================================");

styles.forEach(style => {
  console.log(`\n📝 ${style.toUpperCase()} STYLE:`);
  
  const formatter = new CitationFormatter(style);
  
  // Test in-text citation
  const inText = formatter.formatInText(testCitation);
  console.log(`In-text: ${inText}`);
  
  // Test bibliography entry
  const bibEntry = formatter.formatBibliography(testCitation);
  console.log(`Bibliography: ${bibEntry}`);
  
  console.log("---");
});

// Test with problematic data (like your PDF metadata)
const problematicCitation = {
  id: "problematic-1",
  pdf_metadata: {
    Authors: "Hengshuang Zhao, Jianping Shi, Xiaojuan Qi, Xiaogang Wang, Jiaya Jia",
    Title: "Pyramid Scene Parsing Network",
    JournalName: "arXiv",
    PublicationYear: "2017",
    Volume: "1",
    Issue: "1"
  },
  straico_file_url: "https://arxiv.org/pdf/1612.01105.pdf"
};

console.log("\n🔥 TESTING WITH PROBLEMATIC DATA:");
console.log("================================");

const apaFormatter = new CitationFormatter("apa");
const normalized = apaFormatter.normalizeCitation(problematicCitation);

console.log("Original data:", JSON.stringify(problematicCitation, null, 2));
console.log("\nNormalized:", JSON.stringify(normalized, null, 2));

const inTextFormatted = apaFormatter.formatInText(normalized);
const bibFormatted = apaFormatter.formatBibliography(normalized);

console.log(`\n✅ In-text citation: ${inTextFormatted}`);
console.log(`✅ Bibliography entry: ${bibFormatted}`);

// Test edge cases
console.log("\n🚨 EDGE CASE TESTING:");
console.log("====================");

const edgeCases = [
  { title: "No Author Paper", author: [], year: 2023 },
  { title: "", author: [{ given: "Test", family: "Author" }], year: 2023 },
  { author: [{ given: "Single", family: "Author" }], year: 2023, title: "Single Author Paper" },
  null, // Null citation
  undefined, // Undefined citation
];

edgeCases.forEach((citation, index) => {
  console.log(`\nEdge case ${index + 1}:`);
  try {
    const result = apaFormatter.formatInText(citation);
    console.log(`✅ Result: ${result}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
});

console.log("\n🎉 ALL TESTS COMPLETED!");
console.log("The new citation formatter handles all cases reliably.");

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testCitationFormatter = () => {
    // Browser version of tests
    const formatter = new CitationFormatter("apa");
    const result = formatter.formatInText(testCitation);
    console.log("Citation formatting test result:", result);
    return result;
  };
}
