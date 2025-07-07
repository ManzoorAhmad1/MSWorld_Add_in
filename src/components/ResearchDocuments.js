import React from 'react';

const ResearchDocuments = ({ mockPDFs, handlePDFClick, isOfficeReady }) => (
  <div className="section research-documents">
    <h3>📄 Research Documents</h3>
    <p>Insert sample research documents:</p>
    <div className="pdf-buttons">
      {mockPDFs.map((pdf) => (
        <button
          key={pdf.id}
          className="pdf-button"
          onClick={() => handlePDFClick(pdf)}
          disabled={!isOfficeReady}
        >
          📄 {pdf.title}
        </button>
      ))}
    </div>
  </div>
);

export default ResearchDocuments;
