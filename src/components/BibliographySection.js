import React from 'react';

const BibliographySection = ({
  generateBibliography,
  autoRegenerateBibliography,
  isOfficeReady,
  citations,
  testAPACitationFormatting,
  testDuplicateRemoval,
  isUpdatingBibliography
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
      
      <div className="flex justify-center gap-3">
        <button 
          onClick={generateBibliography}
          disabled={!isOfficeReady || usedCitations.length === 0 || isUpdatingBibliography}
          className={
            usedCitations.length > 0 && !isUpdatingBibliography
              ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-primary"
              : "bg-gray-200 text-gray-500 cursor-not-allowed py-3 px-6 rounded-lg font-semibold"
          }
        >
          {isUpdatingBibliography ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Updating Bibliography...
            </span>
          ) : (
            "📋 Generate Bibliography"
          )}
        </button>
        
        {usedCitations.length > 0 && (
          <button 
            onClick={generateBibliography}
            disabled={!isOfficeReady || isUpdatingBibliography}
            className={
              !isUpdatingBibliography
                ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-primary"
                : "bg-gray-200 text-gray-500 cursor-not-allowed py-3 px-4 rounded-lg font-semibold"
            }
            title="Add more citations to existing bibliography"
          >
            {isUpdatingBibliography ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                🔄
              </span>
            ) : (
              "🔄 Add More"
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default BibliographySection;
