const express = require("express");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
require("dotenv").config();

const app = express();
const port = 3001;
const cors = require("cors");

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    }
  })
});

app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Helper function to extract text from PDF
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

// Helper function to read text file
function readTextFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

app.post("/api/upload", upload.single('file'), async (req, res) => {
  try {
    let content;

    if (req.file) {
      // File upload case
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      console.log("File data",filePath,fileExt);
      

      switch (fileExt) {
        case '.pdf':
          content = await extractTextFromPDF(filePath);
          break;
        case '.txt':
        case '.html':
          content = readTextFile(filePath);
          break;
        default:
          throw new Error('Unsupported file type');
      }

      // Clean up the uploaded file
      // fs.unlinkSync(filePath);
      // console.log("Error");
      
    } else if (req.body.url) {
      // URL case
      const pageResponse = await axios.get(req.body.url);
      content = pageResponse.data;
    } else {
      throw new Error('No file or URL provided');
    }

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Extract the following details from the webpage content: Name, Age, Gender, Race, Cause of death, Date of injury resulting in death, Location of injury, Location of death and a brief summary of the event",
          },
          {
            role: "user",
            content: `Content: ${content}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const extractedData = response.data.choices[0].message.content;
    res.status(200).json({ extractedData });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while processing your request" 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});