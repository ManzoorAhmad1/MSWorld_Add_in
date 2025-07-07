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
  <div className="w-full bg-emerald-50 rounded-lg p-4 shadow mb-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
      <h3 className="text-lg font-semibold text-amber-700 flex items-center gap-2">📖 Citation Library ({citations.length})</h3>
      <div className="flex gap-2">
        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 rounded bg-amber-500 text-white font-medium hover:bg-amber-600 transition">
          📄 Import BibTeX
        </button>
        <button onClick={exportCitations} disabled={citations.length === 0} className="px-3 py-1 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 transition">
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
      <div className="space-y-3">
        {citations.map((citation) => (
          <div key={citation.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded shadow p-3 border border-emerald-100 ${citation.used ? 'opacity-80' : ''}`}>
            <div className="flex-1">
              <h5 className="font-medium text-gray-900">{getCitationTitle(citation)}</h5>
              <p className="text-sm text-gray-600">{getCitationAuthors(citation)}</p>
              <p className="text-xs text-gray-500 mb-1">{formatCitationPreview(citation)}</p>
              {citation.used && <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded font-semibold">✓ Used in document</span>}
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0 sm:ml-4">
              <button
                onClick={() => insertCitation(citation)}
                disabled={!isOfficeReady}
                className="px-3 py-1 rounded bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 transition"
              >
                📝 Insert
              </button>
              <button
                onClick={() => removeCitationFromLibrary(citation.id)}
                className="px-3 py-1 rounded bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition"
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-gray-500 mt-4 text-center">
        <p>No citations in your library yet. Search and add citations above.</p>
      </div>
    )}
  </div>
);

export default CitationLibrary;
