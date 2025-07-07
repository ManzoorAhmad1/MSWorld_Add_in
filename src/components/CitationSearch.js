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
  <div className="w-full bg-amber-50 rounded-lg p-4 shadow mb-4">
    <h3 className="text-lg font-semibold text-emerald-700 mb-2 flex items-center gap-2">🔍 Search & Add Citations</h3>
    <div className="flex flex-col sm:flex-row gap-2 mb-2">
      <input
        type="text"
        placeholder="Search by title, author, DOI, or keywords..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleCitationSearch()}
        className="flex-1 px-3 py-2 rounded border border-amber-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white text-gray-800"
      />
      <button
        onClick={handleCitationSearch}
        disabled={!searchQuery.trim() || isSearching}
        className="px-4 py-2 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 transition"
      >
        {isSearching ? '⏳ Searching...' : '🔍 Search'}
      </button>
    </div>
    {searchResults.length > 0 && (
      <div className="mt-3">
        <h4 className="font-semibold text-emerald-800 mb-2">Search Results ({searchResults.length})</h4>
        <div className="space-y-2">
          {searchResults.map((result, index) => (
            <div key={result.id || index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded shadow p-3 border border-amber-100">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">{getCitationTitle(result)}</h5>
                <p className="text-sm text-gray-600">{getCitationAuthors(result)}</p>
                <p className="text-xs text-gray-500">
                  {result.issued?.['date-parts']?.[0]?.[0] || 'Unknown year'}
                  {result.DOI && <span className="ml-2 text-emerald-600">• DOI: {result.DOI}</span>}
                </p>
              </div>
              <button
                onClick={() => addCitationToLibrary(result)}
                className="mt-2 sm:mt-0 sm:ml-4 px-3 py-1 rounded bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
              >
                ➕ Add to Library
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default CitationSearch;
