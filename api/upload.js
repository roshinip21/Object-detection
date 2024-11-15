import express from 'express';
import axios from 'axios';
import multer from 'multer';
import * as dotenv from 'dotenv';
import PDFParser from "pdf2json";
import { promises as fs } from 'fs';
import * as path from 'path';

dotenv.config();

const app = express();
const port = 3001;

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
});

// Middleware
app.use(express.json());
app.use(express.static('build'));

// Helper function to extract text from PDF
async function extractTextFromPDF(filePath){
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      const text = (pdfData).Pages.map((page) => 
        page.Texts.map((text) => decodeURIComponent(text.R[0].T)).join(' ')
      ).join('\n');
      resolve(text);
    });
    
    pdfParser.on('pdfParser_dataError', reject);
    pdfParser.loadPDF(filePath);
  });
}

// Helper function to extract text from other document types
async function extractTextFromDoc(filePath){
  // Read the file content
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
}

// URL upload endpoint
app.post('/api/upload', async (req,res) => {
  const { url } = req.body;

  try {
    const pageResponse = await axios.get(url);
    const pageContent = pageResponse.data;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI assistant specialized in clinical data extraction. Extract the following details from the document provided, ensuring accurate and complete information:Patient Name, Age, Gender, Hospital Name, Date of Admission, Date of Discharge, Treating Physician (name and specialty), Diagnosis, Medical History, Procedure(s), Medications (with dosage and frequency), Follow-Up Instructions, Summary of the Event (condition, treatment, and outcome)',
          },
          {
            role: 'user',
            content: `Webpage Content: ${pageContent}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const extractedData = response.data.choices[0].message.content;
    res.status(200).json({ extractedData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Document upload endpoint
app.post('/api/upload-document', upload.single('document'), async (req,res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let textContent = '';
    
    // Extract text based on file type
    if (fileExtension === '.pdf') {
      textContent = await extractTextFromPDF(filePath);
    } else {
      textContent = await extractTextFromDoc(filePath);
    }

    // Process with OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI assistant specialized in clinical data extraction. Extract the following details from the document provided, ensuring accurate and complete information:Patient Name, Age, Gender, Hospital Name, Date of Admission, Date of Discharge, Treating Physician (name and specialty), Diagnosis, Medical History, Procedure(s), Medications (with dosage and frequency), Follow-Up Instructions, Summary of the Event (condition, treatment, and outcome)',
          },
          {
            role: 'user',
            content: `Document Content: ${textContent}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const extractedData = response.data.choices[0].message.content;
    
    // Clean up uploaded file
    await fs.unlink(filePath);
    
    res.status(200).json({ extractedData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});