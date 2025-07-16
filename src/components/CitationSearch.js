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
      <h2 className="section-title">🔍 Search Citations</h2>
      
      <div className="search-container">
        <div className="search-input-group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCitationSearch()}
            placeholder="Search by title, author, DOI, or keywords..."
            className="form-input search-input"
            disabled={isSearching}
          />
          <button
            onClick={handleCitationSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="btn btn-primary search-btn"
          >
            {isSearching ? (
              <>
                <span className="spinner"></span>
                Searching...
              </>
            ) : (
              "Search"
            )}
          </button>
        </div>

        <div className="search-help">
          <small>
            💡 Try searching by title, author name, DOI (10.xxxx/xxxxx), or keywords
          </small>
        </div>
      </div>

      <div className="search-results">
        {isSearching && (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Searching academic databases...</p>
          </div>
        )}

        {!isSearching && searchResults.length === 0 && searchQuery && (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No results found</h3>
            <p>Try different keywords or check the spelling</p>
          </div>
        )}

        {!isSearching && searchResults.length === 0 && !searchQuery && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Start your research</h3>
            <p>Search for academic papers, books, and articles</p>
          </div>
        )}

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
    </div>
  );
};

export default CitationSearch;
