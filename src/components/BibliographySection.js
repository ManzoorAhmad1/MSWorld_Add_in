import React from 'react';

const BibliographySection = ({
  generateBibliography,
  isOfficeReady,
  citations
}) => (
  <div className="w-full bg-emerald-50 rounded-lg p-4 shadow mb-4">
    <h3 className="text-lg font-semibold text-amber-700 mb-2 flex items-center gap-2">📋 Bibliography Generation</h3>
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <button
        onClick={generateBibliography}
        disabled={!isOfficeReady || citations.filter(c => c.used).length === 0}
        className="px-4 py-2 rounded bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:bg-gray-300 disabled:text-gray-500 transition"
      >
        📋 Generate Bibliography
      </button>
      <p className="text-sm text-emerald-900">
        {citations.filter(c => c.used).length} citations will be included in the bibliography
      </p>
    </div>
  </div>
);

export default BibliographySection;
