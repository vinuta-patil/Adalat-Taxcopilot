require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const { performOcrOnPdf, extractTextFromDocument } = require('./services/analysis-service');

// Path to test PDF file - modify this to point to your test file
const testPdfPath = process.argv[2] || path.join(__dirname, '../case-files/test.pdf');

async function testOcrFunctionality() {
  console.log('==========================================');
  console.log('Testing OCR Functionality');
  console.log('==========================================');
  console.log(`Testing with file: ${testPdfPath}`);

  try {
    // Check if file exists
    await fs.access(testPdfPath);
    
    console.log('\n1. Testing extractTextFromDocument (with OCR fallback)');
    console.log('--------------------------------------------------');
    try {
      const extractedText = await extractTextFromDocument(testPdfPath);
      console.log(`Text extraction successful!`);
      console.log(`Extracted ${extractedText.length} characters`);
      console.log('\nSample text (first 500 chars):');
      console.log('--------------------------------------------------');
      console.log(extractedText.substring(0, 500));
      console.log('--------------------------------------------------');
    } catch (err) {
      console.error('Text extraction failed:', err.message);
    }

    console.log('\n2. Testing direct OCR functionality');
    console.log('--------------------------------------------------');
    try {
      const ocrText = await performOcrOnPdf(testPdfPath);
      console.log(`OCR successful!`);
      console.log(`Extracted ${ocrText.length} characters using OCR`);
      console.log('\nSample OCR text (first 500 chars):');
      console.log('--------------------------------------------------');
      console.log(ocrText.substring(0, 500));
      console.log('--------------------------------------------------');
    } catch (err) {
      console.error('OCR processing failed:', err.message);
    }

  } catch (err) {
    console.error(`Error: Test file not found at ${testPdfPath}`);
    console.log('Please provide a valid PDF file path as a command line argument:');
    console.log('node test-ocr.js /path/to/your/test.pdf');
  }
}

// Run the test
testOcrFunctionality().catch(err => {
  console.error('Test failed with error:', err);
});
