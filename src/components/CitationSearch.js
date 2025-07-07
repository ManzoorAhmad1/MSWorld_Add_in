import React from 'react';

const CitationSearch = ({
  searchQuery,
  setSearchQuery,
  handleCitationSearch,
  isSearching,
  searchResults,
  addCitationToLibrary,
  getCitationTitle,
  getCitationAuthors
}) => (
  <div className="section citation-search">
    <h3>🔍 Search & Add Citations</h3>
    <div className="search-container">
      <input
        type="text"
        placeholder="Search by title, author, DOI, or keywords..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleCitationSearch()}
        className="search-input"
      />
      <button 
        onClick={handleCitationSearch} 
        disabled={!searchQuery.trim() || isSearching}
        className="search-button"
      >
        {isSearching ? '⏳ Searching...' : '🔍 Search'}
      </button>
    </div>
    {searchResults.length > 0 && (
      <div className="search-results">
        <h4>Search Results ({searchResults.length})</h4>
        {searchResults.map((result, index) => (
          <div key={result.id || index} className="search-result-item">
            <div className="result-info">
              <h5>{getCitationTitle(result)}</h5>
              <p className="result-authors">{getCitationAuthors(result)}</p>
              <p className="result-year">
                {result.issued?.['date-parts']?.[0]?.[0] || 'Unknown year'}
                {result.DOI && <span className="doi"> • DOI: {result.DOI}</span>}
              </p>
            </div>
            <button 
              onClick={() => addCitationToLibrary(result)}
              className="add-citation-button"
            >
              ➕ Add to Library
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default CitationSearch;
