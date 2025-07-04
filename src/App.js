import React, { useState, useEffect } from 'react';
import './App.css';

function App() { 
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    // Check if Office.js is available
    if (typeof Office !== 'undefined') {
      Office.onReady((info) => {
        if (info.host === Office.HostType.Word) {
          setIsOfficeReady(true);
          setStatus('Office Add-in Ready');
        } else {
          setStatus('Not running in Word');
        }
      });
    } else {
      setStatus('Office.js not loaded - Running in browser mode');
    }
  }, []);

  const handleButtonClick = () => {
    if (!isOfficeReady) {
      alert('This add-in needs to be loaded in Microsoft Word');
      return;
    }

    // Word.js API call to insert text
    Word.run(async (context) => {
      try {
        // Get the document body
        const body = context.document.body;
          
        // Insert "Hello World" text
        body.insertText('Hello World', Word.InsertLocation.end);
        
        // Sync the context to execute the queued commands
        await context.sync();
        
        console.log('Hello World inserted successfully!');
        setStatus('Text inserted successfully!');
      } catch (error) {
        console.error('Error inserting text:', error);
        setStatus('Error inserting text');
      }
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>researchCollab</h1>
        <p>Research Document Collaboration Tool</p>
        <div className="status">
          <strong>Status:</strong> {status}
        </div>
        <button 
          className="hello-button" 
          onClick={handleButtonClick}
          disabled={!isOfficeReady}
        >
          Insert Hello World
        </button>
        {!isOfficeReady && (
          <div className="warning">
            <p>⚠️ This add-in needs to be loaded in Microsoft Word to function properly.</p>
            <p>If you're seeing this in a browser, upload the manifest.xml file to Word.</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
