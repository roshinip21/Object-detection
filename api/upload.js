const express = require("express");
const axios = require("axios");
const multer = require("multer");
const upload = multer(); // This will store files in memory by default
require("dotenv").config();

const app = express();
const port = 3001;
const cors = require("cors");
app.use(cors());

app.use(express.json());

app.post("/api/upload", upload.single('file'), async (req, res) => {
  try {
    let content;
    
    if (req.file) {
      // Get content directly from the file buffer
      content = req.file.buffer.toString('utf8');
    } else if (req.body.url) {
      // Handle URL case
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
    res.status(500).json({ error: error.message || "An error occurred" });
  }
});

// Only start the server if we're running directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;