import { useState } from "react";

export default function UrlExtractor() {
  const [url, setUrl] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExtractedData(null);
    setIsLoading(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>URL Data Extractor</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
          required
          style={{ width: "300px", marginRight: "10px" }}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Processing..." : "Submit"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {extractedData && (
        <div>
          <h2>Extracted Data:</h2>
          <pre>{extractedData}</pre>
        </div>
      )}