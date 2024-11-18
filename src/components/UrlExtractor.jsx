import React, { useState } from "react";
import * as XLSX from 'xlsx';

export default function UrlExtractor() {
  const [url, setUrl] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [existingFile, setExistingFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadType, setUploadType] = useState("url"); // "url" or "file"

  const handleExportToExcel = () => {
    if (!extractedData) return;

    const dataLines = extractedData.split('\n');
    const dataObject = {};
    
    dataLines.forEach(line => {
      if (line.includes(":**")) {
        const [field, value] = line.split(":**").map(str => str.trim());
        const cleanField = field.replace("**", "").replace("_", " ");
        const cleanValue = value.replace("**", "");
        dataObject[cleanField] = cleanValue;
      }
    });

    dataObject['Extraction Date'] = new Date().toLocaleString();
    dataObject['Source'] = uploadType === "url" ? url : uploadedFile?.name || "Uploaded File";

    let existingData = [];
    
    if (existingFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        existingData = XLSX.utils.sheet_to_json(firstSheet);
        
        existingData.push(dataObject);
        
        const ws = XLSX.utils.json_to_sheet(existingData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clinical-AI-trial");
        
        XLSX.writeFile(wb, existingFile.name);
      };
      reader.readAsArrayBuffer(existingFile);
    } else {
      existingData = [dataObject];
      const ws = XLSX.utils.json_to_sheet(existingData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Clinical-AI-trial");
      XLSX.writeFile(wb, 'Clinical-AI-trial.xlsx');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExtractedData(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      
      if (uploadType === "url") {
        formData.append("url", url);
      } else {
        if (!uploadedFile) {
          throw new Error("Please select a file to upload");
        }
        formData.append("file", uploadedFile);
      }
      
      formData.append("type", uploadType);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Network response was not ok");
      }

      const data = await response.json();
      setExtractedData(data.extractedData);
    } catch (err) {
      console.error("Error details:", err);
      setError(err.message || "Failed to process data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        Data Extractor
      </h1>
      
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          <button
            onClick={() => setUploadType("url")}
            style={{
              padding: "8px 16px",
              backgroundColor: uploadType === "url" ? "#3b82f6" : "#e5e7eb",
              color: uploadType === "url" ? "white" : "black",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            URL Input
          </button>
          <button
            onClick={() => setUploadType("file")}
            style={{
              padding: "8px 16px",
              backgroundColor: uploadType === "file" ? "#3b82f6" : "#e5e7eb",
              color: uploadType === "file" ? "white" : "black",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            File Upload
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {uploadType === "url" ? (
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
            ) : (
              <input
                type="file"
                onChange={(e) => setUploadedFile(e.target.files[0])}
                required
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                disabled={isLoading}
                accept=".txt,.html,.pdf"
              />
            )}
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
      </div>

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
          <div style={{ marginTop: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setExistingFile(e.target.files[0])}
              style={{ maxWidth: "200px" }}
            />
            <button
              onClick={handleExportToExcel}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10B981',
                color: 'white',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              {existingFile ? 'Append to Selected File' : 'Export to New File'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}