import React from 'react';

const BibliographySection = ({
  generateBibliography,
  isOfficeReady,
  citations,
  testAPACitationFormatting,
  testDuplicateRemoval,
  testMultipleReferenceFormats
}) => {
  const usedCitations = citations.filter(c => c.used);
  
  return (
    <div className="section bibliography-section">
      <h3>📋 Bibliography Generation</h3>
      <div className="bibliography-info" style={{ 
        background: "#f8fafc", 
        padding: "12px", 
        borderRadius: "8px", 
        border: "1px solid #e2e8f0",
        marginBottom: "16px"
      }}>
        <div style={{ fontSize: "0.875rem", color: "#475569" }}>
          <strong>{usedCitations.length}</strong> citations will be included in the bibliography
        </div>
        {usedCitations.length === 0 && (
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
            Insert citations in your document first to generate a bibliography
          </div>
        )}
      </div>
      
      <div className="bibliography-actions">
        <button 
          onClick={generateBibliography}
          disabled={!isOfficeReady || usedCitations.length === 0}
          className={usedCitations.length > 0 ? "btn-primary" : "btn-secondary"}
        >
          📋 Generate Bibliography
        </button>
      </div>
      
    </div>
  );
};

export default BibliographySection;
