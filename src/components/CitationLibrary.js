import React from 'react';

const CitationLibrary = ({
  citations,
  fileInputRef,
  exportCitations,
  handleImportCitations,
  insertCitation,
  removeCitationFromLibrary,
  getCitationTitle,
  getCitationAuthors,
  formatCitationPreview,
  isOfficeReady
}) => (
  <div className="section citation-library">
    <div className="section-header">
      <h3>📖 Citation Library ({citations.length})</h3>
      <div className="library-actions">
        <button onClick={() => fileInputRef.current?.click()} className="import-button">
          📄 Import BibTeX
        </button>
        <button onClick={exportCitations} disabled={citations.length === 0} className="export-button">
          💾 Export Library
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".bib,.bibtex"
          onChange={handleImportCitations}
          style={{ display: 'none' }}
        />
      </div>
    </div>
    {citations.length > 0 ? (
      <div className="citations-list">
        {citations.map((citation) => (
          <div key={citation.id} className={`citation-item ${citation.used ? 'used' : ''}`}>
            <div className="citation-info">
              <h5>{getCitationTitle(citation)}</h5>
              <p className="citation-authors">{getCitationAuthors(citation)}</p>
              <p className="citation-preview">{formatCitationPreview(citation)}</p>
              {citation.used && <span className="used-badge">✓ Used in document</span>}
            </div>
            <div className="citation-actions">
              <button 
                onClick={() => insertCitation(citation)}
                disabled={!isOfficeReady}
                className="insert-button"
              >
                📝 Insert
              </button>
              <button 
                onClick={() => removeCitationFromLibrary(citation.id)}
                className="remove-button"
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="empty-library">
        <p>No citations in your library yet. Search and add citations above.</p>
      </div>
    )}
  </div>
);

export default CitationLibrary;
