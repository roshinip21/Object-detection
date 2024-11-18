const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mobilenet = require("@tensorflow-models/mobilenet");
const tf = require("@tensorflow/tfjs-node");

// Initialize Express app
const app = express();
app.use(cors());
const PORT = 3001;

// Multer configuration for file uploads
const upload = multer();

// Load the MobileNet model
let model;
mobilenet.load()
    .then((loadedModel) => {
        model = loadedModel;
        console.log("MobileNet model loaded successfully!");
    })
    .catch((err) => {
        console.error("Error loading MobileNet model:", err);
    });

// Preprocess image
async function preprocessImage(imageBuffer) {
    const imageTensor = tf.node.decodeImage(imageBuffer, 3) // Decode image
        .resizeBilinear([224, 224])                        // Resize to 224x224
        .div(255.0)                                       // Normalize pixel values
        .expandDims();                                    // Add batch dimension
    return imageTensor;
}

// Route to handle object detection
app.post("/api/upload", upload.single("file"), async (req, res) => {
    console.log("Inside api");
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Preprocess the uploaded image
        const imageBuffer = req.file.buffer;
        const imageTensor = await preprocessImage(imageBuffer);

        // Make predictions using the MobileNet model
        const predictions = await model.classify(imageTensor);
        console.log("Step",imageBuffer,imageTensor,predictions);
        

        // Return the top predictions
        res.status(200).json({ predictions });
    } catch (err) {
        console.error("Error during prediction:", err);
        res.status(500).json({ error: "Error during prediction" });
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
