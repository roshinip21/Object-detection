import React from 'react';
import UrlExtractor from './components/UrlExtractor';

function App() {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '1.5rem 0'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            Clinical-AI-trial Data Extractor
          </h1>
        </div>
      </header>

      <main style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '1.5rem 1rem'
      }}>
        <div style={{ padding: '1.5rem 0' }}>
          <UrlExtractor />
        </div>
      </main>

      <footer style={{
        backgroundColor: 'white',
        boxShadow: '0 -1px 3px rgba(0,0,0,0.1)',
        marginTop: '2rem',
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center',
          color: '#4b5563'
        }}>
          <p>© 2024 Dr. Audrey Beck and Dev Shah. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;