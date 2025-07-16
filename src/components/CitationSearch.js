import React from "react";

const CitationSearch = ({
  searchQuery,
  setSearchQuery,
  handleCitationSearch,
  isSearching,
  searchResults,
  addCitationToLibrary,
  getCitationTitle,
  getCitationAuthors,
}) => {
  return (
    <div className="search-section">

        {searchResults.length > 0 && (
          <div className="results-grid">
            {searchResults.map((result, index) => (
              <div key={result.id || index} className="citation-card">
                <div className="citation-card-header">
                  <h4 className="citation-title">
                    {getCitationTitle(result)}
                  </h4>
                  <span className="citation-source">
                    {result.source || "database"}
                  </span>
                </div>

                <div className="citation-authors">
                  <strong>Authors:</strong> {getCitationAuthors(result)}
                </div>

                {result["container-title"] && (
                  <div className="citation-journal">
                    <strong>Journal:</strong> {result["container-title"]}
                  </div>
                )}

                {result.issued?.["date-parts"]?.[0]?.[0] && (
                  <div className="citation-year">
                    <strong>Year:</strong> {result.issued["date-parts"][0][0]}
                  </div>
                )}

                {result.DOI && (
                  <div className="citation-doi">
                    <strong>DOI:</strong> 
                    <a 
                      href={`https://doi.org/${result.DOI}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doi-link"
                    >
                      {result.DOI}
                    </a>
                  </div>
                )}

                <div className="citation-card-actions">
                  <button
                    onClick={() => addCitationToLibrary(result)}
                    className="btn btn-success btn-sm"
                  >
                    ➕ Add to Library
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default CitationSearch;
