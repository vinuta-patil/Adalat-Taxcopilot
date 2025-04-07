const fs = require('fs').promises;
const path = require('path');
const { OpenAI } = require('openai');
const pdf = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const { fromPath } = require('pdf2pic');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fsSync = require('fs');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simple cache for extracted text to avoid reprocessing the same documents
const extractionCache = new Map();

// Cache directory for extracted text
const CACHE_DIR = path.join(process.cwd(), 'extraction_cache');
// Ensure cache directory exists
if (!fsSync.existsSync(CACHE_DIR)) {
  fsSync.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Analyzes a tax case document and generates predictions and recommendations
 * @param {string} filePath - Path to the uploaded document file
 * @returns {Object} Analysis results including predictions and recommendations
 */
async function analyzeCase(filePath) {
  console.log(`Analyzing case document: ${filePath}`);
  
  try {
    // 1. Extract text from the document
    const documentText = await extractTextFromDocument(filePath);
    if (!documentText) {
      throw new Error('Failed to extract text from document');
    }
    
    // 2. Get the system prompt for analysis
    const systemPrompt = await fs.readFile(
      path.join(__dirname, '../prompts/case_analysis_prompt.md'),
      'utf-8'
    );
    
    // 3. Use OpenAI API for case analysis
    const analysisResult = await analyzeWithOpenAI(documentText, systemPrompt);
    
    // 4. Parse the analysis result
    return parseAnalysisResult(analysisResult, filePath);
  } catch (error) {
    console.error('Error in case analysis:', error);
    throw error;
  }
}

/**
 * Extracts text from a document file (handles PDF files)
 * @param {string} filePath - Path to the uploaded document
 * @returns {string} Extracted text content
 */
async function extractTextFromDocument(filePath) {
  try {
    console.log(`Extracting text from file: ${filePath}`);
    
    // Calculate a unique hash for this file to use as cache key
    const fileStats = await fs.stat(filePath);
    const cacheKey = `${path.basename(filePath)}_${fileStats.size}_${fileStats.mtime.getTime()}`;
    
    // Check memory cache first
    if (extractionCache.has(cacheKey)) {
      console.log(`Using cached extraction result for ${filePath}`);
      return extractionCache.get(cacheKey);
    }
    
    // Check disk cache
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.txt`);
    if (fsSync.existsSync(cachePath)) {
      try {
        const cachedText = await fs.readFile(cachePath, 'utf-8');
        if (cachedText && cachedText.length > 100) {
          console.log(`Using disk-cached extraction result for ${filePath}`);
          // Update memory cache too
          extractionCache.set(cacheKey, cachedText);
          return cachedText;
        }
      } catch (cacheErr) {
        console.warn(`Could not read cache file: ${cacheErr.message}`);
      }
    }
    
    if (path.extname(filePath).toLowerCase() === '.pdf') {
      // Read PDF file
      const dataBuffer = await fs.readFile(filePath);
      console.log(`PDF file read, size: ${dataBuffer.length} bytes`);
      
      try {
        // Try enhanced pdf-parse extraction first (with better options)
        console.log('Attempting enhanced PDF extraction...');
        try {
          const enhancedText = await extractWithEnhancedOptions(filePath);
          
          if (enhancedText && enhancedText.trim().length > 100) {
            console.log(`Enhanced extraction successful, extracted ${enhancedText.length} characters`);
            return enhancedText;
          } else {
            console.warn('Enhanced extraction yielded minimal text, falling back to standard extraction...');
          }
        } catch (enhancedError) {
          console.warn('Enhanced extraction failed, falling back to standard extraction:', enhancedError.message);
        }
        
        // If enhanced extraction fails, try standard pdf-parse extraction
        const options = {
          // Adding custom render function options to improve extraction quality
          pagerender: pageData => {
            const renderOptions = {
              normalizeWhitespace: true,
              disableCombineTextItems: false
            };
            return pageData.getTextContent(renderOptions)
              .then(textContent => {
                let lastY, text = '';
                for (const item of textContent.items) {
                  if (lastY == item.transform[5] || !lastY) {
                    text += item.str;
                  } else {
                    text += '\n' + item.str;
                  }
                  lastY = item.transform[5];
                }
                return text;
              });
          }
        };
        
        const result = await pdf(dataBuffer, options);
        const extractedText = result.text || '';
        
        console.log(`Standard extraction text length: ${extractedText.length} characters`);
        
        // Cache successful extractions to avoid reprocessing
        if (extractedText.trim().length >= 100) {
          // Store in memory cache
          extractionCache.set(cacheKey, extractedText);
          
          // Save to disk cache for persistence
          try {
            await fs.writeFile(path.join(CACHE_DIR, `${cacheKey}.txt`), extractedText, 'utf-8');
            console.log(`Saved extraction result to cache for future use`);
          } catch (cacheErr) {
            console.warn(`Could not save to cache: ${cacheErr.message}`);
          }
        }
        
        if (extractedText.trim().length < 100) {
          console.warn('WARNING: Extracted minimal text from PDF file. Attempting OCR...');
          
          // First try advanced command-line OCR (more reliable)
          try {
            console.log('Attempting advanced OCR with pdftoppm and tesseract...');
            const advancedOcrText = await performAdvancedOcr(filePath);
            
            if (advancedOcrText && advancedOcrText.trim().length > 100) {
              console.log(`Advanced OCR successful, extracted ${advancedOcrText.length} characters`);
              
              // Cache this successful extraction
              extractionCache.set(cacheKey, advancedOcrText);
              try {
                await fs.writeFile(path.join(CACHE_DIR, `${cacheKey}.txt`), advancedOcrText, 'utf-8');
                console.log(`Saved OCR result to cache for future use`);
              } catch (cacheErr) {
                console.warn(`Could not save OCR result to cache: ${cacheErr.message}`);
              }
              
              return advancedOcrText;
            } else {
              console.warn('Advanced OCR extraction yielded minimal text, falling back to JavaScript OCR...');
            }
          } catch (advancedOcrError) {
            console.warn(`Advanced OCR failed: ${advancedOcrError.message}, falling back to JavaScript OCR...`);
          }
          
          // If advanced OCR fails, try JavaScript-based OCR
          try {
            console.log('Falling back to JavaScript-based OCR for image-based PDF');
            const ocrText = await performOcrOnPdf(filePath);
            
            if (ocrText && ocrText.trim().length > 100) {
              console.log(`JavaScript OCR successful, extracted ${ocrText.length} characters`);
              return ocrText;
            } else {
              console.warn('All OCR extraction methods yielded minimal text');
              return `The provided document is not suitable for analysis due to quality issues. Please provide a text-based PDF or transcribe the key elements of the tax case.\n\nPossible solutions:\n1. If you have access to the original document, export it as a text-based PDF\n2. Use a document conversion tool like Adobe Acrobat to convert the scanned PDF to text\n3. For important cases, consider manual transcription of key sections\n\nTechnical details: Document appears to be an image-based PDF. Multiple extraction methods were attempted but yielded insufficient text (${ocrText ? ocrText.length : 0} characters).`;
            }
          } catch (ocrError) {
            console.error('OCR extraction failed:', ocrError);
            return `The provided document could not be processed. Both PDF extraction and OCR failed. Error: ${ocrError.message}.\n\nRecommendations:\n1. Try converting the document to a text-based PDF using specialized software\n2. Check if you have access to a text version of this document\n3. For critical cases, consider professional document conversion services`;
          }
        }
        
        return extractedText;
      } catch (pdfError) {
        console.error(`Error processing PDF document: ${pdfError.message}`);
        
        // If traditional extraction fails, try OCR
        try {
          console.log('PDF parsing failed, attempting OCR as fallback');
          const ocrText = await performOcrOnPdf(filePath);
          
          if (ocrText && ocrText.trim().length > 100) {
            console.log(`OCR fallback successful, extracted ${ocrText.length} characters`);
            return ocrText;
          } else {
            return `Error processing PDF document: ${pdfError.message}. OCR was attempted but yielded minimal text. This may be due to the PDF being encrypted, image-based with quality issues, or in a format that cannot be processed.`;
          }
        } catch (ocrError) {
          console.error('OCR fallback also failed:', ocrError);
          return `Error processing PDF document: ${pdfError.message}. OCR fallback also failed: ${ocrError.message}. This may be due to the PDF being encrypted, image-based, or in a format that cannot be processed.`;
        }
      }
    } else if (path.extname(filePath).toLowerCase() === '.txt') {
      // Read text file
      const textContent = await fs.readFile(filePath, 'utf-8');
      console.log(`Text file read, length: ${textContent.length} characters`);
      return textContent;
    } else {
      throw new Error(`Unsupported file type: ${path.extname(filePath)}`);
    }
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error);
    // Return a helpful error message rather than failing
    return `Error extracting text from document: ${error.message}. This may be due to the PDF being encrypted, image-based, or in a format that cannot be processed.`;
  }
}

/**
 * Enhanced PDF text extraction using improved pdf-parse options
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractWithEnhancedOptions(filePath) {
  console.log(`Extracting text with enhanced options from: ${filePath}`);
  
  try {
    const dataBuffer = await fs.readFile(filePath);
    
    // Enhanced options for better extraction
    const options = {
      // Custom page rendering function to better handle text positioning
      pagerender: pageData => {
        return pageData.getTextContent({
          // These options help with text extraction quality
          normalizeWhitespace: true,
          disableCombineTextItems: false,
          includeMarkedContent: true
        }).then(textContent => {
          let lastY, lastX;
          let text = '';
          let lineBreakThreshold = 1; // Adjust based on your PDFs
          
          // Sort items by vertical position (y) then horizontal (x)
          textContent.items.sort((a, b) => {
            if (Math.abs(a.transform[5] - b.transform[5]) < lineBreakThreshold) {
              return a.transform[4] - b.transform[4]; // Sort by x if on same line
            }
            return b.transform[5] - a.transform[5]; // Sort by y otherwise
          });
          
          for (const item of textContent.items) {
            const x = item.transform[4];
            const y = item.transform[5];
            
            // Detect new lines based on y-coordinate changes
            if (lastY && Math.abs(y - lastY) > lineBreakThreshold) {
              text += '\n';
              lastX = null; // Reset x position for new line
            }
            
            // Add space between words on same line
            if (lastX && (x - lastX) > 2) {
              text += ' ';
            }
            
            text += item.str;
            lastY = y;
            lastX = x + (item.width || 0);
          }
          
          return text;
        });
      }
    };
    
    const result = await pdf(dataBuffer, options);
    console.log(`Enhanced extraction complete. Extracted ${result.text.length} characters`);
    return result.text;
  } catch (error) {
    console.error('Error in enhanced PDF extraction:', error);
    throw new Error(`Enhanced PDF extraction failed: ${error.message}`);
  }
}

/**
 * Performs OCR on a PDF file to extract text using Tesseract.js
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text from the PDF
 */
async function performOcrOnPdf(pdfPath) {
  console.log(`Running OCR on PDF: ${pdfPath}`);
  
  try {
    // Make a more robust attempt to extract even a little text from the PDF
    const pdfBaseName = path.basename(pdfPath, '.pdf');
    const outputDir = path.dirname(pdfPath);
    
    // Configure conversion settings with different options for better compatibility
    const options = {
      density: 300, // Higher density for better quality
      saveFilename: pdfBaseName,
      savePath: outputDir,
      format: 'png',
      width: 2480, // A4 width at 300 DPI
      height: 3508, // A4 height at 300 DPI
      quality: 100 // Maximum quality
    };
    
    try {
      // Initialize converter with the correct API usage
      const converter = fromPath(pdfPath, options);
      
      // Only attempt to process first 3 pages to reduce processing time
      const pagesToProcess = 3;
      console.log(`Processing first ${pagesToProcess} pages for OCR...`);
      
      let pageImagesResults = [];
      
      // Try each page individually to avoid one page failing the whole process
      for (let i = 1; i <= pagesToProcess; i++) {
        try {
          console.log(`Converting page ${i} to image...`);
          // The correct way to call the converter - it returns a function that takes the page number
          const pageImage = await converter(i);
          if (pageImage && pageImage.path) {
            pageImagesResults.push(pageImage);
            console.log(`Successfully converted page ${i}`);
          }
        } catch (pageErr) {
          console.warn(`Could not convert page ${i}: ${pageErr.message}`);
          // Continue with next page even if this one fails
        }
      }
      
      if (pageImagesResults.length === 0) {
        console.warn('Could not convert any pages from PDF to images');
        return ''; // Return empty string to indicate failure
      }
      
      console.log(`Successfully converted ${pageImagesResults.length} pages to images`);
      
      // Process each image with Tesseract OCR
      const worker = await createWorker('eng');
      const textResults = [];
      
      for (const pageImage of pageImagesResults) {
        try {
          console.log(`Performing OCR on ${pageImage.path}...`);
          const ocrResult = await worker.recognize(pageImage.path);
          if (ocrResult && ocrResult.data && ocrResult.data.text) {
            textResults.push(ocrResult.data.text);
          }
        } catch (ocrErr) {
          console.warn(`OCR failed for page ${pageImage.path}: ${ocrErr.message}`);
          // Continue with next page
        }
      }
      
      // Terminate worker
      await worker.terminate();
      
      // Combine text from all successful pages
      const combinedText = textResults.join('\n\n');
      console.log(`OCR complete. Extracted ${combinedText.length} characters from ${textResults.length} pages`);
      
      // Clean up temporary image files
      for (const page of pageImagesResults) {
        try {
          await fs.unlink(page.path);
        } catch (err) {
          console.warn(`Failed to clean up temporary image file: ${page.path}`);
        }
      }
      
      return combinedText;
    } catch (conversionError) {
      console.error('PDF conversion error:', conversionError);
      // Despite failing, try the advanced OCR method before giving up
      console.log('Trying advanced OCR method with pdftoppm and tesseract...');
      return performAdvancedOcr(pdfPath);
    }
  } catch (error) {
    console.error('Error performing OCR on PDF:', error);
    // Try the advanced OCR as a last resort
    try {
      return await performAdvancedOcr(pdfPath);
    } catch (advancedError) {
      throw new Error(`All OCR methods failed: ${error.message}. Advanced OCR also failed: ${advancedError.message}`);
    }
  }
}

/**
 * Checks if the required command-line tools are available and returns their paths
 * @returns {Promise<Object>} - Object containing paths to tools or null if not available
 */
async function checkCommandLineTools() {
  try {
    // Find pdftoppm path
    const { stdout: pdftoppmPath } = await execPromise('which pdftoppm');
    // Find tesseract path
    const { stdout: tesseractPath } = await execPromise('which tesseract');
    
    return {
      pdftoppm: pdftoppmPath.trim(),
      tesseract: tesseractPath.trim(),
      available: true
    };
  } catch (error) {
    console.warn('Command-line tools (pdftoppm, tesseract) not found. Advanced OCR will not be available.');
    return { available: false };
  }
}

/**
 * Performs advanced OCR on a PDF file using command-line tools pdftoppm and tesseract
 * This can often yield better results for challenging PDFs
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text from the PDF
 */
async function performAdvancedOcr(pdfPath) {
  console.log(`Running advanced OCR with native tools on: ${pdfPath}`);
  
  // First check if the required tools are available
  const toolsInfo = await checkCommandLineTools();
  if (!toolsInfo.available) {
    throw new Error('Required command-line tools (pdftoppm, tesseract) are not installed.');
  }
  
  // Use the absolute paths to the tools
  const pdftoppmPath = toolsInfo.pdftoppm;
  const tesseractPath = toolsInfo.tesseract;
  console.log(`Found pdftoppm at: ${pdftoppmPath}`);
  console.log(`Found tesseract at: ${tesseractPath}`);
  
  try {
    // Create temporary directories for processing
    const tempDir = path.join(path.dirname(pdfPath), 'temp_ocr');
    const outputPrefix = path.basename(pdfPath, '.pdf');
    
    // Ensure temp directory exists
    if (!fsSync.existsSync(tempDir)) {
      await fs.mkdir(tempDir, { recursive: true });
    }
    
    // Convert PDF to images using pdftoppm (much more reliable than JS libraries)
    console.log('Converting PDF to images using pdftoppm...');
    const maxPages = 5; // Process only first 5 pages
    const imagePrefixPath = path.join(tempDir, outputPrefix);
    
    // Use pdftoppm with high resolution settings and the absolute path
    const pdftoppmCmd = `"${pdftoppmPath}" -png -r 300 -f 1 -l ${maxPages} "${pdfPath}" "${imagePrefixPath}"`;  
    
    try {
      await execPromise(pdftoppmCmd);
      console.log('PDF successfully converted to images with pdftoppm');
    } catch (convError) {
      console.error('Error converting PDF with pdftoppm:', convError.message);
      throw new Error(`pdftoppm conversion failed: ${convError.message}`);
    }
    
    // Get all generated image files
    const imageFiles = fsSync.readdirSync(tempDir)
      .filter(file => file.startsWith(outputPrefix) && file.endsWith('.png'))
      .sort(); // Sort to maintain page order
    
    if (imageFiles.length === 0) {
      throw new Error('No images were generated from PDF');
    }
    
    console.log(`Generated ${imageFiles.length} images from PDF`);
    
    // Process each image with tesseract OCR
    let fullText = '';
    
    for (const imageFile of imageFiles) {
      const imagePath = path.join(tempDir, imageFile);
      console.log(`Performing OCR on ${imagePath}...`);
      
      try {
        // Run tesseract directly with good options for document processing
        const tesseractCmd = `"${tesseractPath}" "${imagePath}" stdout --oem 1 --psm 3 -l eng`;
        const { stdout } = await execPromise(tesseractCmd);
        
        if (stdout && stdout.trim().length > 0) {
          fullText += stdout + '\n\n';
          console.log(`Extracted ${stdout.length} characters from ${imageFile}`);
        }
      } catch (ocrError) {
        console.warn(`Tesseract OCR failed for ${imageFile}:`, ocrError.message);
        // Continue with next image
      }
    }
    
    // Clean up temp files
    try {
      for (const imageFile of imageFiles) {
        await fs.unlink(path.join(tempDir, imageFile));
      }
      await fs.rmdir(tempDir, { recursive: true });
    } catch (cleanupError) {
      console.warn('Could not clean up temporary files:', cleanupError.message);
    }
    
    if (fullText.trim().length > 0) {
      console.log(`Advanced OCR complete. Extracted ${fullText.length} characters in total`);
      return fullText;
    } else {
      throw new Error('Advanced OCR did not extract any meaningful text');
    }
  } catch (error) {
    console.error('Error in advanced OCR processing:', error);
    throw new Error(`Advanced OCR processing failed: ${error.message}`);
  }
}

/**
 * Analyzes the document text using OpenAI API
 * @param {string} documentText - Extracted text from the document
 * @param {string} systemPrompt - System prompt for analysis
 * @returns {string} Analysis result from OpenAI
 */
async function analyzeWithOpenAI(documentText, systemPrompt) {
  try {
    console.log(`Analyzing document text of length: ${documentText.length} characters`);
    
    // Check if document appears to be empty or invalid
    if (!documentText || documentText.trim().length < 100) {
      console.warn('WARNING: Document text appears to be too short or empty');
      return JSON.stringify({
        caseTitle: "Document Analysis Error",
        successProbability: 50,
        recommendation: "review",
        reasoning: "The document provided appears to be empty, corrupted, or doesn't contain readable text. Please upload a valid text-based document for proper analysis."
      });
    }
    
    // Truncate document text if it's too long
    const maxTokens = 16000; // Adjusted for GPT-4o context window
    let truncatedText = documentText;
    if (documentText.length > maxTokens * 4) { // Rough character to token ratio estimate
      console.log(`Document exceeds token limit. Truncating from ${documentText.length} characters`);
      // Smarter truncation - keep beginning and end of the document
      const beginLength = Math.floor(maxTokens * 2.5);
      const endLength = Math.floor(maxTokens * 1.5);
      truncatedText = documentText.substring(0, beginLength) + 
        "\n\n[...content truncated for length...]\n\n" + 
        documentText.substring(documentText.length - endLength);
      console.log(`Truncated to ${truncatedText.length} characters`);
    }

    // Enhance prompt with document length info
    const enhancedSystemPrompt = `${systemPrompt}\n\nThe document is ${documentText.length} characters long` + 
      (truncatedText !== documentText ? " and has been truncated to fit within token limits." : ".");

    console.log('Calling OpenAI API...');
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o', // Use model from environment variable or default to gpt-4o
      messages: [
        { role: 'system', content: enhancedSystemPrompt },
        { role: 'user', content: truncatedText }
      ],
      temperature: 0.2, // Lower temperature for more deterministic outputs
      max_tokens: 2000,
      response_format: { type: "json_object" } // Request JSON directly for easier parsing
    });

    const result = response.choices[0].message.content;
    console.log(`Received response from OpenAI. Response length: ${result.length} characters`);
    return result;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    if (error.response) {
      console.error('OpenAI API error details:', JSON.stringify(error.response.data || {}));
    }
    // Return a structured error message that can be properly parsed
    return JSON.stringify({
      caseTitle: "API Analysis Error",
      successProbability: 50,
      recommendation: "review",
      reasoning: `An error occurred during the analysis: ${error.message || 'Unknown error'}. Please try again later.`
    });
  }
}

/**
 * Parses the analysis result from OpenAI
 * @param {string} analysisResult - Raw analysis from OpenAI
 * @param {string} filePath - Original file path
 * @returns {Object} Structured analysis object
 */
function parseAnalysisResult(analysisResult, filePath) {
  try {
    console.log('Parsing analysis result...');
    let jsonData;
    
    // Check if analysisResult is already a JSON string from our API call
    try {
      jsonData = JSON.parse(analysisResult);
      console.log('Successfully parsed direct JSON response from OpenAI');
    } catch (jsonError) {
      // If direct JSON parsing fails, try the old way - extract JSON from markdown code block
      console.log('Direct JSON parsing failed, trying to extract from code block...');
      const jsonMatch = analysisResult.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
        jsonData = JSON.parse(jsonMatch[1]);
        console.log('Successfully extracted and parsed JSON from code block');
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }
    
    // Normalize the data structure
    const fileName = path.basename(filePath);
    const caseTitle = jsonData.caseTitle || jsonData.title || fileName.replace(/\.[^/.]+$/, '');
    
    // Format the result with consistent structure
    const result = {
      caseId: `CASE-${Date.now()}`,
      fileName: fileName,
      title: caseTitle,
      caseTitle: caseTitle,
      caseNumber: jsonData.caseNumber || 'N/A',
      courtLevel: jsonData.courtLevel || 'N/A',
      dateOfOrder: jsonData.dateOfOrder || 'N/A',
      keyIssues: jsonData.keyIssues || [],
      statutoryProvisions: jsonData.statutoryProvisions || [],
      successProbability: typeof jsonData.successProbability === 'number' ? 
        jsonData.successProbability : 50,
      recommendation: jsonData.recommendation || 'review',
      reasoning: jsonData.reasoning || 'No detailed reasoning provided.',
      precedentAnalysis: jsonData.precedentAnalysis || '',
      potentialOutcome: jsonData.potentialOutcome || '',
      rawAnalysis: analysisResult,
      analysisTimestamp: new Date().toISOString()
    };
    
    console.log(`Analysis complete. Success probability: ${result.successProbability}%, Recommendation: ${result.recommendation}`);
    return result;
    
  } catch (error) {
    console.error('Error parsing analysis result:', error);
    console.log('Raw analysis result:', analysisResult.substring(0, 500) + '...');
    
    // Extract what we can using regex as a fallback
    let reasoning = 'Analysis parsing failed. Please review the raw analysis.';
    let successProbability = 50;
    let recommendation = 'review';
    
    try {
      // Try to extract key information with regex
      const successProbMatch = analysisResult.match(/success(?:.*?)probability(?:.*?)([0-9]+)/i);
      const recommendationMatch = analysisResult.match(/recommendation(?:.*?)(appeal|dont-appeal|review)/i);
      
      if (successProbMatch) {
        successProbability = parseInt(successProbMatch[1]);
      }
      
      if (recommendationMatch) {
        recommendation = recommendationMatch[1].toLowerCase();
      }
      
      // Try to extract some reasoning text
      const reasoningMatch = analysisResult.match(/reasoning(?:.*?)"([\s\S]*?)"/i);
      if (reasoningMatch && reasoningMatch[1]) {
        reasoning = reasoningMatch[1].trim();
      } else {
        // Just use the beginning of the text
        reasoning = analysisResult.substring(0, 500) + '...';
      }
    } catch (regexError) {
      console.error('Regex extraction failed:', regexError);
    }
    
    // Return a fallback object with whatever we could extract
    return {
      caseId: `CASE-${Date.now()}`,
      fileName: path.basename(filePath),
      title: path.basename(filePath, path.extname(filePath)),
      successProbability: successProbability,
      recommendation: recommendation,
      reasoning: reasoning,
      rawAnalysis: analysisResult,
      analysisTimestamp: new Date().toISOString()
    };
  }
}

/**
 * Finds and retrieves similar cases for comparison
 * @param {string} caseText - The text content of the current case
 * @param {number} courtLevel - The current court level (1-4)
 * @param {number} limit - Maximum number of similar cases to retrieve
 * @returns {Array} Array of similar cases
 */
async function findSimilarCases(caseText, courtLevel, limit = 3) {
  // This would typically involve vector search in a real implementation
  // For this POC, we're just returning sample case paths based on level
  const casesDir = path.join(__dirname, '../../case-files/case-files');
  
  try {
    // Map courtLevel to directory
    const levelDir = path.join(casesDir, `level-${courtLevel}`);
    const subDirs = await fs.readdir(levelDir);
    
    if (subDirs.length === 0) return [];
    
    // Pick a random subdirectory
    const randomSubDir = subDirs[Math.floor(Math.random() * subDirs.length)];
    const fileDir = path.join(levelDir, randomSubDir);
    
    // Get some sample files
    const files = await fs.readdir(fileDir);
    const sampleFiles = files.slice(0, limit).map(file => path.join(fileDir, file));
    
    return sampleFiles;
  } catch (error) {
    console.error('Error finding similar cases:', error);
    return [];
  }
}

module.exports = {
  analyzeCase,
  extractTextFromDocument,
  analyzeWithOpenAI,
  findSimilarCases,
  performOcrOnPdf,
  performAdvancedOcr,
  extractWithEnhancedOptions
};
