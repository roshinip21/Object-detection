import { useState, ChangeEvent, FormEvent } from "react";
import React from "react";
import * as XLSX from 'xlsx';
import './styles.css';  

// Define types for our data structures
interface ExtractedData {
  Name?: string;
  Age?: string;
  Gender?: string;
  Race?: string;
  "Cause of death"?: string;
  "Date of injury resulting in death"?: string;
  "Location of injury"?: string;
  "Location of death"?: string;
  Summary?: string;
  "Extraction Date"?: string;
  "Source URL"?: string;
}

interface UploadResponse {
  extractedData: string;
}

export default function UrlExtractor() {
  const [url, setUrl] = useState<string>("");
  const [extractedData, setExtractedData] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [existingFile, setExistingFile] = useState<File | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);

  // Function to export data to Excel
  const handleExportToExcel = async () => {
    if (!extractedData) return;

    try {
      // Parse extracted data into an object
      const dataLines = extractedData.split('\n');
      const dataObject: ExtractedData = {};

      dataLines.forEach(line => {
        if (line.includes(":**")) {
          const [field, value] = line.split(":**").map(str => str.trim());
          const cleanField = field.replace("**", "").replace("_", " ");
          const cleanValue = value.replace("**", "");
          dataObject[cleanField as keyof ExtractedData] = cleanValue;
        }
      });

      // Add extraction date and URL
      dataObject['Extraction Date'] = new Date().toLocaleString();
      dataObject['Source URL'] = url;

      let existingData: ExtractedData[] = [];

      if (existingFile) {
        const fileData = await readFileAsArrayBuffer(existingFile);
        const workbook = XLSX.read(fileData, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        existingData = XLSX.utils.sheet_to_json(firstSheet);

        // Add new data
        existingData.push(dataObject);

        // Create a new worksheet with combined data
        const ws = XLSX.utils.json_to_sheet(existingData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clinical-AI-trial");

        XLSX.writeFile(wb, existingFile.name);
      } else {
        existingData = [dataObject];
        const ws = XLSX.utils.json_to_sheet(existingData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clinical-AI-trial");
        XLSX.writeFile(wb, 'Clinical-AI-trial.xlsx');
      }
    } catch (err) {
      setError("Failed to export data to Excel");
      console.error("Export error:", err);
    }
  };

  // Function to read file as an ArrayBuffer
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          resolve(e.target.result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle document upload and extraction
  const handleDocumentUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedDocument(file);
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process document");
      }

      const data = await response.json() as UploadResponse;
      setExtractedData(data.extractedData);
    } catch (err) {
      console.error("Document upload error:", err);
      setError("Failed to process document. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Network response was not ok");
      }

      const data = await response.json() as UploadResponse;
      setExtractedData(data.extractedData);
    } catch (err) {
      console.error("Error details:", err);
      setError("Failed to extract data. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="header">Clinical-AI-trial Data Extractor</h1>
      
      <div className="form-group">
        <form onSubmit={handleSubmit} className="input-group">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            required
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="extract-btn" 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Extract Data'}
          </button>
        </form>
  
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleDocumentUpload}
          disabled={isLoading}
        />
      </div>
  
      {error && <div className="alert">{error}</div>}
  
      {extractedData && (
        <div className="extracted-data">
          <h2>Extracted Data:</h2>
          <pre>{extractedData}</pre>
          <div className="form-group">
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setExistingFile(e.target.files?.[0] || null)}
            />
            <button
              onClick={handleExportToExcel}
              className="export-btn" style={{marginLeft:10}}
            >
              {existingFile ? 'Append to Selected File' : 'Export to New File'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
}
