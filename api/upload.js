const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(express.json());

app.post("/api/upload", async (req, res) => {
  const { url } = req.body;
  console.log("Url is: " + url);
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  try {
    // Fetch the content of the provided URL
    console.log("Fetching URL content...");
    const pageResponse = await axios.get(url);
    const pageContent = pageResponse.data;
    console.log("URL content fetched successfully");

    console.log("Calling OpenAI API...");
    // Call the OpenAI API with the content of the webpage
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Extract the following details from the webpage content: 
                    Name, Age, Gender, Race, Date of injury resulting in death, 
                    Location of injury, Location of death, etc.
                    Webpage Content: ${pageContent}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("OpenAI API call successfully");

    // Extracted data from the ChatGPT response
    const extractedData = response.data.choices[0].message.content;
    res.status(200).json({ extractedData });
  } catch (error) {
    console.error("Error details:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
    }
    res
      .status(500)
      .json({ error: "Error processing the URL", details: error.message });
  }
});

module.exports = app;
