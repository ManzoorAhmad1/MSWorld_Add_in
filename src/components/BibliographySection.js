import React from 'react';

const BibliographySection = ({
  generateBibliography,
  isOfficeReady,
  citations,
  testAPACitationFormatting,
  testDuplicateRemoval
}) => {
  const usedCitations = citations.filter(c => c.used);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        📋 Bibliography Generation
      </h3>
      
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <div className="text-sm text-slate-600">
          <strong className="text-slate-900">{usedCitations.length}</strong> citations will be included in the bibliography
        </div>
        {usedCitations.length === 0 && (
          <div className="text-xs text-slate-500 mt-1">
            Insert citations in your document first to generate a bibliography
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        <button 
          onClick={generateBibliography}
          disabled={!isOfficeReady || usedCitations.length === 0}
          className={
            usedCitations.length > 0 
              ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-primary"
              : "bg-gray-200 text-gray-500 cursor-not-allowed py-3 px-6 rounded-lg font-semibold"
          }
        >
          📋 Generate Bibliography
        </button>
      </div>
    </div>
  );
};

export default BibliographySection;
