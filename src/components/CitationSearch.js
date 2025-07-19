import { Loader } from "lucide-react";
import React from "react";

const CitationSearch = ({
  searchResults,
  addCitationToLibrary,
  getCitationTitle,
  getCitationAuthors,
  citations, 
  fetchPaperLoader,
}) => {
  
  // Helper function to check if citation is already in library
  const isCitationInLibrary = (citationId) => {
    return citations.some(citation => String(citation.id) === String(citationId));
  };
  return (
    <div className="space-y-6">
      {fetchPaperLoader ? (
        <div className="grid gap-4">
          {/* Skeleton loaders for multiple citation cards */}
          {[...Array(1)].map((_, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 mr-4">
                  <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              </div>
              
              <div className="flex justify-end">
                <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid gap-4">
            {searchResults.map((result, index) => (
            <div key={result.id || index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold text-gray-900 leading-tight">
                  {getCitationTitle(result)}
                </h4>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {result.source || "database"}
                </span>
              </div>

              <div className="text-sm text-gray-700 mb-2">
                <strong className="font-medium">Authors:</strong> <span className="text-gray-600">{getCitationAuthors(result)}</span>
              </div>

              {result["container-title"] && (
                <div className="text-sm text-gray-700 mb-2">
                  <strong className="font-medium">Journal:</strong> <span className="text-gray-600">{result["container-title"]}</span>
                </div>
              )}

              {result.issued?.["date-parts"]?.[0]?.[0] && (
                <div className="text-sm text-gray-700 mb-2">
                  <strong className="font-medium">Year:</strong> <span className="text-gray-600">{result.issued["date-parts"][0][0]}</span>
                </div>
              )}

              {result.DOI && (
                <div className="text-sm text-gray-700 mb-4">
                  <strong className="font-medium">DOI:</strong> 
                  <a 
                    href={`https://doi.org/${result.DOI}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 ml-1 underline"
                  >
                    {result.DOI}
                  </a>
                </div>
              )}

              <div className="flex justify-end">
                {isCitationInLibrary(result.id) ? (
                  <button
                    disabled
                    className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed flex items-center"
                  >
                    ✅ Already Added
                  </button>
                ) : (
                  <button
                    onClick={() => addCitationToLibrary(result)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    ➕ Add to Library
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No search results to display.
        </div>
      )}
    </div>
  );
};

export default CitationSearch;
