import React, { useState } from 'react';
import axios from 'axios';
import { AlertCircle, Upload } from 'lucide-react';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';

function App() {
  const [file, setFile] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("Response",response);
      
      setPredictions(response.data.predictions);
      setError(null);
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.error || 'Error detecting objects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* <Card> */}
          {/* <CardHeader> */}
            {/* <CardTitle>Object Detection</CardTitle> */}
          {/* </CardHeader> */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <button
                  type="submit" 
                  disabled={!file || loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                  ) : 'Detect'}
                </button>
              </div>
            </form>

            {preview && (
              <div className="mt-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 rounded-lg border border-gray-200"
                />
              </div>
            )}

            {error }

            {predictions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Detected Objects:</h3>
                <ul className="space-y-2">
                  {predictions.map((pred, index) => (
                    <li 
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <span className="font-medium">{ pred.className}</span>
                      <span className="text-sm text-gray-600">
                        {(pred.probability * 100).toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            </div>
          {/* </CardContent> */}
        {/* </Card> */}
      </div>
    </div>
  );
}

export default App;