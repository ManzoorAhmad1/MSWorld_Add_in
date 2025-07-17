import React from "react";

const CitationLibrary = ({
  citations,
  fileInputRef,
  exportCitations,
  handleImportCitations,
  insertCitation,
  removeCitationFromLibrary,
  getCitationTitle,
  getCitationAuthors,
  isOfficeReady,
  formatCitationPreview,
}) => {
  const usedCitations = citations.filter((c) => c.used);
  const unusedCitations = citations.filter((c) => !c.used);

  return (
    <div className="library-section">
      <h2 className="section-title">📖 Citation Library</h2>


      {citations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No citations yet</h3>
          <p>Search and add citations to build your library</p>
        </div>
      ) : (
        <div className="citations-grid">
          {citations.map((citation) => (
            <div
              key={citation.id}
              className={`citation-card ${citation.used ? "used" : "unused"}`}
              style={{
                opacity: citation.used ? 0.7 : 1,
                background: citation.used ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#ffffff'
              }}
            >
              <div className="citation-card-header">
                <h4 className="citation-title">
                  {getCitationTitle(citation)}
                </h4>              <div className="citation-status">
                {citation.used ? (
                  <span className="status-badge used">
                    ✓ Used {citation.inTextCitations ? `(${citation.inTextCitations.length}x)` : ''}
                  </span>
                ) : (
                  <span className="status-badge unused">○ Unused</span>
                )}
              </div>
              </div>

              <div className="citation-authors">
                <strong>Authors:</strong> {getCitationAuthors(citation)}
              </div>

              {citation["container-title"] && (
                <div className="citation-journal">
                  <strong>Journal:</strong> {citation["container-title"]}
                </div>
              )}

              {citation.issued?.["date-parts"]?.[0]?.[0] && (
                <div className="citation-year">
                  <strong>Year:</strong> {citation.issued["date-parts"][0][0]}
                </div>
              )}

              {citation.DOI && (
                <div className="citation-doi">
                  <strong>DOI:</strong> 
                  <a 
                    href={`https://doi.org/${citation.DOI}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doi-link"
                  >
                    {citation.DOI}
                  </a>
                </div>
              )}

              <div className="citation-preview">
                <small>{formatCitationPreview(citation)}</small>
              </div>

              <div className="citation-card-actions">
                <button
                  onClick={() => insertCitation(citation)}
                  disabled={!isOfficeReady || citation.used}
                  className={`btn btn-sm ${citation.used ? 'btn-disabled' : 'btn-primary'}`}
                  title={citation.used ? "Already inserted in document" : "Insert citation into document"}
                >
                  {citation.used ? (
                    <>🔒 Inserted</>
                  ) : (
                    <>📝 Insert</>
                  )}
                </button>
                <button
                  onClick={() => removeCitationFromLibrary(citation.id)}
                  className="btn btn-danger btn-sm remove-btn"
                  title="Remove from library"
                >
                  <span className="remove-icon">×</span>
                  <span className="remove-text">Remove</span>
                </button>
              </div>

              {citation.used && citation.inTextCitations && (
                <div className="usage-info">
                  <small>
                    Used {citation.inTextCitations.length} time(s)
                  </small>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitationLibrary;
