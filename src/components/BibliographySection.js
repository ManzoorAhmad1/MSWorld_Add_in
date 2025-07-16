import React from 'react';

const BibliographySection = ({
  generateBibliography,
  isOfficeReady,
  citations,
  testAPACitationFormatting,
  testDuplicateRemoval
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
      
      {/* Debug Section */}
      <div className="debug-section" style={{ 
        marginTop: "20px", 
        padding: "12px", 
        background: "#fef3c7", 
        borderRadius: "8px", 
        border: "1px solid #fbbf24" 
      }}>
        <h4 style={{ fontSize: "0.9rem", margin: "0 0 8px 0", color: "#92400e" }}>🔧 Debug Tools</h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {testAPACitationFormatting && (
            <button 
              onClick={testAPACitationFormatting}
              className="btn-debug"
              style={{ 
                padding: "6px 12px", 
                fontSize: "0.8rem", 
                background: "#3b82f6", 
                color: "white", 
                border: "none", 
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              📋 Test APA Format
            </button>
          )}
          {testDuplicateRemoval && (
            <button 
              onClick={testDuplicateRemoval}
              className="btn-debug"
              style={{ 
                padding: "6px 12px", 
                fontSize: "0.8rem", 
                background: "#10b981", 
                color: "white", 
                border: "none", 
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              🔍 Test Duplicate Fix
            </button>
          )}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#92400e", marginTop: "4px" }}>
          Check browser console for test results
        </div>
      </div>
    </div>
  );
};

export default BibliographySection;
