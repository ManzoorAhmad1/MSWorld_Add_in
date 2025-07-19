import React from 'react';

const ResearchDocuments = ({ mockPDFs, handlePDFClick, isOfficeReady }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      📄 Research Documents
    </h3>
    <p className="text-gray-600 mb-6">Insert sample research documents:</p>
    <div className="grid gap-3">
      {mockPDFs.map((pdf) => (
        <button
          key={pdf.id}
          className={`
            flex items-center p-4 rounded-lg border text-left transition-all duration-200
            ${isOfficeReady 
              ? 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-900 hover:text-blue-700 cursor-pointer transform hover:-translate-y-0.5' 
              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
          onClick={() => handlePDFClick(pdf)}
          disabled={!isOfficeReady}
        >
          <span className="text-2xl mr-3">📄</span>
          <span className="font-medium">{pdf.title}</span>
        </button>
      ))}
    </div>
  </div>
);

export default ResearchDocuments;
