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
}) => (
  <div className="section citation-search">
    <h3>Add Citations</h3>
    {searchResults.length > 0 && (
      <div className="search-results">
        <h4>Search Results ({searchResults.length})</h4>
        {searchResults.map((result, index) => {
          return (
            <div key={result.id || index} className="search-result-item" style={{
              background: "#f9fbfd",
              border: "1px solid #e3e8ee",
              borderRadius: "12px",
              marginBottom: "18px",
              padding: "22px",
              boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div className="result-info" style={{ flex: 1 }}>
                <h5 style={{ fontSize: "16px", color: "#2E75B6", margin: 0, }}>
                {result?.file_name}
                </h5>
              </div>
              <button
                onClick={() => addCitationToLibrary(result)}
                className="add-citation-button"
                style={{
                  marginLeft: "24px",
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontWeight: 600,
                  fontSize: "1em",
                  boxShadow: "0 2px 6px rgba(40,167,69,0.08)",
                  transition: "background 0.2s"
                }}
              >
                ➕ Add to Library
              </button>
            </div>
          );
        })}
      </div>
    )}

  </div>
);

export default CitationSearch;
