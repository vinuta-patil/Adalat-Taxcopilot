require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeCase, findSimilarCases } = require('./services/analysis-service');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Set up file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = [
      'application/pdf', 
      'text/plain', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOC or DOCX files are allowed.'));
    }
  }
});

// Routes
app.post('/api/analyze', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    console.log(`Processing file: ${filePath}`);

    // Use the real analysis service with OpenAI
    const analysis = await analyzeCase(filePath);
    
    // Find similar cases for comparison (court level determined from analysis)
    let courtLevel = 1; // Default to level 1 if not found
    if (analysis.courtLevel) {
      // Extract court level from the analysis
      if (analysis.courtLevel.toLowerCase().includes('commissioner')) {
        courtLevel = 1;
      } else if (analysis.courtLevel.toLowerCase().includes('tribunal') || 
                 analysis.courtLevel.toLowerCase().includes('itat') || 
                 analysis.courtLevel.toLowerCase().includes('cestat')) {
        courtLevel = 2;
      } else if (analysis.courtLevel.toLowerCase().includes('high')) {
        courtLevel = 3;
      } else if (analysis.courtLevel.toLowerCase().includes('supreme')) {
        courtLevel = 4;
      }
    }
    
    // Get similar cases for reference
    const similarCasePaths = await findSimilarCases('', courtLevel, 2);
    const similarCases = similarCasePaths.map(p => path.basename(p));

    res.json({
      success: true,
      analysis: {
        ...analysis,
        similarCases
      }
    });
    
    // Keep the file for future reference instead of deleting it
    // Move it to a permanent storage location
    const storageDir = path.join(__dirname, 'analyzed_documents');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    const storagePath = path.join(storageDir, `${analysis.caseId}${path.extname(filePath)}`);
    fs.rename(filePath, storagePath, (err) => {
      if (err) {
        console.error(`Error moving file to storage: ${filePath}`, err);
      }
    });
    
    // Save the analysis result as JSON for later retrieval
    try {
      const analysisPath = path.join(storageDir, `${analysis.caseId}.json`);
      const analysisData = {
        ...analysis,
        similarCases,
        fileName: path.basename(filePath),
        originalPath: storagePath,
        analysisTimestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(analysisPath, JSON.stringify(analysisData, null, 2));
      console.log(`Analysis saved to ${analysisPath}`);
    } catch (saveError) {
      console.error('Error saving analysis data:', saveError);
      // Continue processing even if saving analysis fails
    }
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error processing document' 
    });
    
    // Clean up the uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error(`Error deleting file: ${req.file.path}`, err);
        }
      });
    }
  }
});

// Add an endpoint to fetch specific case details
app.get('/api/cases/:id', async (req, res) => {
  console.log('------------------------------');
  console.log(`GET /api/cases/:id endpoint hit at ${new Date().toISOString()}`);
  console.log('Request params:', req.params);
  console.log('Request query:', req.query);
  
  try {
    const caseId = req.params.id;
    console.log(`Looking for case with ID: ${caseId}`);
    
    const storageDir = path.join(__dirname, 'analyzed_documents');
    console.log(`Storage directory path: ${storageDir}`);
    
    // Read the analyzed_documents directory to find matching case file
    if (!fs.existsSync(storageDir)) {
      console.error(`Storage directory does not exist: ${storageDir}`);
      return res.status(404).json({ success: false, error: 'No analyzed documents found' });
    }
    
    console.log('Reading files from storage directory...');
    const files = fs.readdirSync(storageDir);
    console.log(`Found ${files.length} files in directory:`, files);
    
    const caseFile = files.find(file => file.startsWith(caseId));
    console.log(caseFile ? `Found matching case file: ${caseFile}` : `No file found for case ID: ${caseId}`);
    
    if (!caseFile) {
      console.error(`No case file found for ID: ${caseId}`);
      return res.status(404).json({ success: false, error: 'Case not found' });
    }
    
    // We need to find if we have stored analysis data for this case
    // First try to find a JSON file with analysis results
    const analysisFilePath = path.join(storageDir, `${caseId}.json`);
    console.log(`Looking for analysis JSON file at: ${analysisFilePath}`);
    let analysisData;
    
    if (fs.existsSync(analysisFilePath)) {
      console.log(`Found analysis JSON file: ${analysisFilePath}`);
      try {
        // If we have a stored JSON analysis, use that
        const analysisJson = fs.readFileSync(analysisFilePath, 'utf8');
        console.log(`Analysis JSON file content length: ${analysisJson.length} characters`);
        console.log('Parsing JSON content...');
        analysisData = JSON.parse(analysisJson);
        console.log('Successfully parsed JSON data');
        console.log('Analysis data keys:', Object.keys(analysisData));
      } catch (parseError) {
        console.error('Error parsing analysis JSON:', parseError);
        throw new Error(`Failed to parse analysis data: ${parseError.message}`);
      }
    } else {
      console.log(`Analysis JSON file not found at: ${analysisFilePath}`);
      console.log('Creating fallback analysis object');
      // Otherwise, we recreate a basic analysis object
      // In a production app, you would store analysis results in a database
      analysisData = {
        caseId: caseId,
        fileName: caseFile,
        title: caseFile.replace(/\.[^/.]+$/, ''),
        analysisTimestamp: new Date().toISOString(),
        successProbability: 50, // Default value
        recommendation: 'review',
        reasoning: 'Analysis data not found. Please reanalyze this document.'
      };
      console.log('Created fallback data:', analysisData);
    }
    
    console.log('Preparing to send response...');
    // Set CORS headers explicitly to ensure browser can access the response
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Return the analysis data
    console.log('Sending analysis data response');
    res.json(analysisData);
    console.log('Response sent successfully');
  } catch (error) {
    console.error('------------------------------');
    console.error(`ERROR in /api/cases/:id at ${new Date().toISOString()}`);
    console.error(`Error type: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    
    // Log request details that led to the error
    console.error('Request that caused error:');
    console.error('- Case ID:', req.params.id);
    console.error('- Request headers:', req.headers);
    
    // Set CORS headers even on error responses
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Send detailed error response
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error retrieving case',
      errorType: error.name,
      errorTime: new Date().toISOString()
    });
    console.error('Error response sent');
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
