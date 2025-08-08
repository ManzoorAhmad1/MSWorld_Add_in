import React, { useState, useMemo } from "react";
import { Text, Button } from "rizzui";
import { FileText, Trash2, Lock, Edit2, ChevronDown, Plus, Download, Upload } from "lucide-react";
import CitationEditor from "./CitationEditor";

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
  citationFormat = "Author, Year",
  onUpdateCitation,
}) => {
  const [selectedCitations, setSelectedCitations] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingCitation, setEditingCitation] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Calculate selection state
  const isAllSelected = useMemo(() => {
    return citations.length > 0 && selectedCitations.size === citations.length;
  }, [citations.length, selectedCitations.size]);

  const isIndeterminate = useMemo(() => {
    return selectedCitations.size > 0 && selectedCitations.size < citations.length;
  }, [citations.length, selectedCitations.size]);

  // Handle individual checkbox selection
  const handleCitationSelect = (citationId, checked) => {
    const newSelected = new Set(selectedCitations);
    if (checked) {
      newSelected.add(citationId);
    } else {
      newSelected.delete(citationId);
    }
    setSelectedCitations(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // Handle select all checkbox
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(citations.map(c => c.id));
      setSelectedCitations(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedCitations(new Set());
      setShowBulkActions(false);
    }
  };

  // Bulk insert selected citations
  const handleBulkInsert = async () => {
    const selectedCitationObjects = citations.filter(c => selectedCitations.has(c.id));
    for (const citation of selectedCitationObjects) {
      if (!citation.used) {
        await insertCitation(citation);
      }
    }
    // Clear selection after bulk insert
    setSelectedCitations(new Set());
    setShowBulkActions(false);
  };

  // Bulk remove selected citations
  const handleBulkRemove = () => {
    selectedCitations.forEach(citationId => {
      removeCitationFromLibrary(citationId);
    });
    setSelectedCitations(new Set());
    setShowBulkActions(false);
  };

  // Open citation editor
  const handleEditCitation = (citation) => {
    setEditingCitation(citation);
    setIsEditorOpen(true);
  };

  // Save citation edits
  const handleSaveCitation = (updatedCitation) => {
    if (onUpdateCitation) {
      onUpdateCitation(updatedCitation);
    }
    setEditingCitation(null);
    setIsEditorOpen(false);
  };
  return (
    <div className="">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          📖 Citation Library
          {citations.length > 0 && (
            <span className="ml-2 text-sm text-gray-500">({citations.length})</span>
          )}
        </h2>

        {/* Import/Export Actions */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCitations}
            accept=".json,.ris,.bib"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef?.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Import Citations"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          {citations.length > 0 && (
            <button
              onClick={exportCitations}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export Citations"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-900 font-medium">
                {selectedCitations.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkInsert}
                disabled={!isOfficeReady}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                <Plus className="h-4 w-4" />
                Insert Selected ({selectedCitations.size})
              </button>
              <button
                onClick={handleBulkRemove}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Remove Selected
              </button>
              <button
                onClick={() => {
                  setSelectedCitations(new Set());
                  setShowBulkActions(false);
                }}
                className="px-3 py-1.5 text-gray-600 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {citations.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="flex flex-col items-center mb-4">
            <img
              src="https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/images//researchcollab-logo%20(1).svg"
              alt="ResearchCollab Logo"
              className="w-12 h-12 flex-shrink-0"
              onError={(e) => {
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
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
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
                    Status
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
                      selectedCitations.has(citation.id)
                        ? "bg-blue-50 hover:bg-blue-100"
                        : citation.used
                        ? "bg-green-50 hover:bg-green-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCitations.has(citation.id)}
                        onChange={(e) => handleCitationSelect(citation.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900 text-sm leading-tight">
                          {getCitationTitle(citation)}
                        </div>
                        <Text className="text-xs text-gray-600">
                          <strong>Authors:</strong> {citation?.authors || "Unknown authors"}
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
                    <td className="px-4 py-4 text-center">
                      {citation.CitationCount ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {citation.CitationCount}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No Citation</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          citation.used
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {citation.used ? "Cited" : "Not cited"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => insertCitation(citation)}
                          disabled={!isOfficeReady || citation.used}
                          className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
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
                            <Lock className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditCitation(citation)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit citation"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeCitationFromLibrary(citation.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remove from library"
                        >
                          <Trash2 className="h-3 w-3" />
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

      {/* Citation Editor Modal */}
      <CitationEditor
        isOpen={isEditorOpen}
        citation={editingCitation}
        citationFormat={citationFormat}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingCitation(null);
        }}
        onSave={handleSaveCitation}
      />
    </div>
  );
};

export default CitationLibrary;
