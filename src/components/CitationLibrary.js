import React from "react";
import { Text, Button } from "rizzui";
import { FileText, Trash2, Lock } from "lucide-react";

const CitationLibrary = ({
  citations,
  fileInputRef,
  exportCitations,
  handleImportCitations,
  insertCitation,
  removeCitationFromLibrary,
  getCitationTitle,
  getCitationAuthors,
  isOfficeReady,
  formatCitationPreview,
}) => {
  return (
    <div className="">
      <h2 className="text-xl font-semibold text-gray-900 flex items-center my-2">
        📖 Citation Library
      </h2>

      {citations.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col items-center mb-4">
            <img
              src="https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/images//researchcollab-logo%20(1).svg"
              alt="ResearchCollab Logo"
              className="w-12 h-12 flex-shrink-0"
              onError={(e) => {
                // Fallback if image fails to load
                e.target.style.display = "none";
              }}
            />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No citations yet
          </h3>
          <p className="text-gray-600">
            Search and add citations to build your library
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title & Authors
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Journal & Year
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Citations
                  </th>
                  
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {citations.map((citation) => (
                  <tr
                    key={citation.id}
                    className={`transition-colors ${
                      citation.used
                        ? "bg-green-50 hover:bg-green-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900 text-sm leading-tight">
                          {getCitationTitle(citation)}
                        </div>
                        <Text className="text-xs text-gray-600">
                          <strong>Authors:</strong> {citation?.authors}
                        </Text>
                     
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {citation["container-title"] && (
                          <div className="text-sm text-gray-900">
                            {citation["container-title"]}
                          </div>
                        )}
                        {citation.issued?.["date-parts"]?.[0]?.[0] && (
                          <div className="text-xs text-gray-600">
                            Year: {citation.issued["date-parts"][0][0]}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {citation.CitationCount ? (
                        <Text>
                          {citation.CitationCount}
                      </Text>
                      ) : (
                        <span className="text-gray-400 text-xs">No Citation</span>
                      )}
                    </td>
                   
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => insertCitation(citation)}
                          disabled={!isOfficeReady || citation.used}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                            citation.used
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                          title={
                            citation.used
                              ? "Already inserted in document"
                              : "Insert citation into document"
                          }
                        >
                          {citation.used ? (
                            <>
                              <Lock className="h-3 w-3" />
                              Inserted
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3" />
                              Insert
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => removeCitationFromLibrary(citation.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          title="Remove from library"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitationLibrary;
