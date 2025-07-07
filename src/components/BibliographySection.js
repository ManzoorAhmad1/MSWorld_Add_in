import React from 'react';

const BibliographySection = ({
  generateBibliography,
  isOfficeReady,
  citations
}) => (
  <div className="section bibliography-section">
    <h3>📋 Bibliography Generation</h3>
    <div className="bibliography-actions">
      <button 
        onClick={generateBibliography}
        disabled={!isOfficeReady || citations.filter(c => c.used).length === 0}
        className="generate-button"
      >
        📋 Generate Bibliography
      </button>
      <p className="bibliography-info">
        {citations.filter(c => c.used).length} citations will be included in the bibliography
      </p>
    </div>
  </div>
);

export default BibliographySection;
