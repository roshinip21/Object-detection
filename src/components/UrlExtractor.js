// src/components/UrlExtractor.js

import { useState } from "react";

export default function UrlExtractor() {
  const [url, setUrl] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExtractedData(null);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setExtractedData(data.extractedData);
    } catch (err) {
      setError("Failed to extract data. Please check the URL and try again.");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>URL Data Extractor</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
          required
          style={{ width: "300px", marginRight: "10px" }}
        />
        <button type="submit">Submit</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {extractedData && (
        <div>
          <h2>Extracted Data:</h2>
          <pre>{extractedData}</pre>
        </div>
      )}
    </div>
  );
}
