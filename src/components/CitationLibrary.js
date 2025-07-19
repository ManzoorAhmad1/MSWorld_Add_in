import React from "react";

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
  const usedCitations = citations.filter((c) => c.used);
  const unusedCitations = citations.filter((c) => !c.used);

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
        <div className="grid gap-4">
          {citations.map((citation) => (
            <div
              key={citation.id}
              className={`bg-white border rounded-lg p-6 shadow-sm transition-all ${
                citation.used
                  ? "opacity-70 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                  : "hover:shadow-md border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold text-gray-900 leading-tight flex-1 mr-4">
                  {getCitationTitle(citation)}
                </h4>
                <div className="flex-shrink-0">
                  {citation.used ? (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                      ✓ Used{" "}
                      {citation.inTextCitations
                        ? `(${citation.inTextCitations.length}x)`
                        : ""}
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                      ○ Unused
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-700 mb-2">
                <strong className="font-medium">Authors:</strong>{" "}
                <span className="text-gray-600">
                  {getCitationAuthors(citation)}
                </span>
              </div>

              {citation["container-title"] && (
                <div className="text-sm text-gray-700 mb-2">
                  <strong className="font-medium">Journal:</strong>{" "}
                  <span className="text-gray-600">
                    {citation["container-title"]}
                  </span>
                </div>
              )}

              {citation.issued?.["date-parts"]?.[0]?.[0] && (
                <div className="text-sm text-gray-700 mb-2">
                  <strong className="font-medium">Year:</strong>{" "}
                  <span className="text-gray-600">
                    {citation.issued["date-parts"][0][0]}
                  </span>
                </div>
              )}

              {citation.DOI && (
                <div className="text-sm text-gray-700 mb-3">
                  <strong className="font-medium">DOI:</strong>
                  <a
                    href={`https://doi.org/${citation.DOI}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 ml-1 underline"
                  >
                    {citation.DOI}
                  </a>
                </div>
              )}

              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <small className="text-gray-600 text-sm leading-relaxed">
                  {formatCitationPreview(citation)}
                </small>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => insertCitation(citation)}
                  disabled={!isOfficeReady || citation.used}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
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
                  {citation.used ? <>🔒 Inserted</> : <>📝 Insert</>}
                </button>
                <button
                  onClick={() => removeCitationFromLibrary(citation.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  title="Remove from library"
                >
                  <span className="mr-1">×</span>
                  <span>Remove</span>
                </button>
              </div>

              {citation.used && citation.inTextCitations && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <small className="text-gray-600">
                    Used {citation.inTextCitations.length} time(s)
                  </small>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitationLibrary;
