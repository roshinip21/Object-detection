import axios from 'axios';
import { config } from 'dotenv';
config();

// Export the API route handler
export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS (preflight) request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: `Method ${req.method} Not Allowed. Only POST requests are accepted.` 
        });
    }

    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log("Processing URL:", url);

        // Fetch webpage content
        const pageResponse = await axios.get(url);
        const pageContent = pageResponse.data;

        // Call OpenAI API
        const openaiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4",  // Make sure this is the correct model name
                messages: [
                    {
                        role: "system",
                        content: "Extract the following details from the webpage content: Name, Age, Gender, Race, Date of injury resulting in death, Location of injury, Location of death, etc."
                    },
                    {
                        role: "user",
                        content: `Webpage Content: ${pageContent}`
                    }
                ],
                max_tokens: 300,
                temperature: 0.5
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const extractedData = openaiResponse.data.choices[0].message.content;
        return res.status(200).json({ extractedData });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Server error', 
            message: error.message 
        });
    }
}