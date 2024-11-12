import { useState } from "react";

export default function UrlExtractor() {
  const [url, setUrl] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log("Form submitted with URL:", url);
    setError("");
    setExtractedData(null);
    setIsLoading(true);

    try {
        const response = await fetch("/api/upload", {  // Make sure this matches exactly
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Network response was not ok");
        }

        const data = await response.json();
        setExtractedData(data.extractedData);
    } catch (err) {
        console.error("Error details:", err);
        setError("Failed to extract data. Please check the URL and try again.");
    } finally {
        setIsLoading(false);
    }
};

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        URL Data Extractor
      </h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            required
            style={{
              flex: 1,
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              backgroundColor: isLoading ? "#ccc" : "#3b82f6",
              color: "white",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? 'Processing...' : 'Extract Data'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{
          padding: "16px",
          marginBottom: "16px",
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          borderRadius: "4px",
        }}>
          {error}
        </div>
      )}

      {extractedData && (
        <div style={{ marginTop: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px" }}>
            Extracted Data:
          </h2>
          <pre style={{
            backgroundColor: "#f3f4f6",
            padding: "16px",
            borderRadius: "4px",
            overflowX: "auto",
            whiteSpace: "pre-wrap"
          }}>
            {extractedData}
          </pre>
        </div>
      )}
    </div>
  );
}