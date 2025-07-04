import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Office.js initialization
Office.onReady((info) => {
    if (info.host === Office.HostType.Word) {
        console.log('Word Add-in loaded successfully!');
    }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
