import React from 'react';

const ResearchDocuments = ({ mockPDFs, handlePDFClick, isOfficeReady }) => (
  <div className="w-full bg-amber-50 rounded-lg p-4 shadow mb-4">
    <h3 className="text-lg font-semibold text-emerald-700 mb-2 flex items-center gap-2">📄 Research Documents</h3>
    <p className="text-amber-700 mb-2">Insert sample research documents:</p>
    <div className="flex flex-wrap gap-2">
      {mockPDFs.map((pdf) => (
        <button
          key={pdf.id}
          className="px-3 py-1 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 transition"
          onClick={() => handlePDFClick(pdf)}
          disabled={!isOfficeReady}
        >
          📄 {pdf.title}
        </button>
      ))}
    </div>
  </div>
);

export default ResearchDocuments;
