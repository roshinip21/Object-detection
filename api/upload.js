const axios = require("axios");
require("dotenv").config();

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;
    console.log("Url is: " + url);

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
                        role: "system",
                        content:
                            "Extract the following details from the webpage content: Name, Age, Gender, Race, Date of injury resulting in death, Location of injury, Location of death, etc.",
                    },
                    {
                        role: "user",
                        content: `Webpage Content: ${pageContent}`,
                    },
                ],
                max_tokens: 300,
                temperature: 0.5,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        console.log("OpenAI API call successful");

        // Extracted data from the OpenAI response
        const extractedData = response.data.choices[0].message.content;
        res.status(200).json({ extractedData });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "An error occurred" });
    }
}