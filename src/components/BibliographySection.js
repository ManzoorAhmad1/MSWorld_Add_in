import React from 'react';

const BibliographySection = ({
  generateBibliography,
  isOfficeReady,
  citations,
  testAPACitationFormatting,
  testDuplicateRemoval,
  testAllCitationStyles,
  diagnoseCurrentBibliography
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
      
      <div className="flex justify-center mb-6">
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

      {/* Testing Section */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          🧪 Citation Format Testing
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={testAllCitationStyles}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            🔬 Test All Styles
          </button>
          
          <button
            onClick={diagnoseCurrentBibliography}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            🔍 Diagnose Issues
          </button>
          
          <button
            onClick={testAPACitationFormatting}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            📝 Test APA Format
          </button>
          
          <button
            onClick={testDuplicateRemoval}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            🧹 Test Cleanup
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
          <strong>Instructions:</strong> Open browser console (F12) to see detailed test results. 
          These tests help identify formatting issues and verify that citation styles are working correctly.
        </div>
      </div>
    </div>
  );
};

export default BibliographySection;
