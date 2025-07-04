import React from 'react';
import './App.css';

function App() {
  const handleButtonClick = () => {
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
      } catch (error) {
        console.error('Error inserting text:', error);
      }
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>MS Word Add-in</h1>
        <p>Click the button to insert "Hello World" into your document</p>
        <button 
          className="hello-button" 
          onClick={handleButtonClick}
        >
          Insert Hello World
        </button>
      </header>
    </div>
  );
}

export default App;
