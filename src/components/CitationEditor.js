import React, { useState, useEffect } from "react";
import { X, Save, ChevronDown, Book, Calendar, MapPin } from "lucide-react";

const CitationEditor = ({ 
  isOpen, 
  onClose, 
  citation, 
  onSave,
  citationFormat = "Author, Year" 
}) => {
  const [editedCitation, setEditedCitation] = useState({
    prefix: "",
    suffix: "",
    locator: "",
    locatorType: "page",
    displayFormat: citationFormat,
    suppressAuthor: false
  });

  const [citationPreview, setCitationPreview] = useState("");

  useEffect(() => {
    if (citation) {
      setEditedCitation(prev => ({
        ...prev,
        prefix: citation.prefix || "",
        suffix: citation.suffix || "",
        locator: citation.locator || "",
        locatorType: citation.locatorType || "page",
        displayFormat: citation.displayFormat || citationFormat,
        suppressAuthor: citation.suppressAuthor || false
      }));
      
      // Generate preview
      generatePreview();
    }
  }, [citation, citationFormat]);

  useEffect(() => {
    generatePreview();
  }, [editedCitation, citation]);

  const generatePreview = () => {
    if (!citation) return;
    
    let preview = "";
    const author = getAuthorName(citation);
    const year = getYear(citation);
    const title = getTitle(citation);

    // Generate preview based on display format
    switch (editedCitation.displayFormat) {
      case "Author, Year":
        preview = editedCitation.suppressAuthor ? 
          `${year}` : 
          `${author}, ${year}`;
        break;
      case "(Author, Year)":
        preview = editedCitation.suppressAuthor ? 
          `(${year})` : 
          `(${author}, ${year})`;
        break;
      case "Author":
        preview = author;
        break;
      case "Year":
        preview = year;
        break;
      case "Title":
        preview = title;
        break;
      default:
        preview = `${author}, ${year}`;
    }

    // Add locator if specified
    if (editedCitation.locator) {
      const locatorPrefix = editedCitation.locatorType === "page" ? "p." : 
                           editedCitation.locatorType === "chapter" ? "ch." : "";
      preview += `, ${locatorPrefix} ${editedCitation.locator}`;
    }

    // Add prefix and suffix
    const fullPreview = `${editedCitation.prefix}${preview}${editedCitation.suffix}`;
    setCitationPreview(fullPreview);
  };

  const getAuthorName = (citation) => {
    if (citation?.author?.[0]) {
      return `${citation.author[0].family || ""}, ${citation.author[0].given || ""}`.trim();
    }
    if (citation?.authors) {
      const firstAuthor = citation.authors.split(",")[0].trim();
      return firstAuthor;
    }
    return "Unknown Author";
  };

  const getYear = (citation) => {
    return citation?.issued?.["date-parts"]?.[0]?.[0] || citation?.PublicationYear || "n.d.";
  };

  const getTitle = (citation) => {
    return citation?.title || citation?.Title || "Untitled";
  };

  const handleSave = () => {
    onSave({
      ...citation,
      ...editedCitation
    });
    onClose();
  };

  const handleInputChange = (field, value) => {
    setEditedCitation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Book className="h-5 w-5 text-blue-600" />
            Edit Citation
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Citation Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{getTitle(citation)}</h3>
            <p className="text-sm text-gray-600">{getAuthorName(citation)} ({getYear(citation)})</p>
            {citation["container-title"] && (
              <p className="text-sm text-gray-500 mt-1">{citation["container-title"]}</p>
            )}
          </div>

          {/* Display Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Citation Format
            </label>
            <div className="relative">
              <select
                value={editedCitation.displayFormat}
                onChange={(e) => handleInputChange('displayFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="Author, Year">Author, Year</option>
                <option value="(Author, Year)">(Author, Year)</option>
                <option value="Author">Author only</option>
                <option value="Year">Year only</option>
                <option value="Title">Title only</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Suppress Author */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="suppressAuthor"
              checked={editedCitation.suppressAuthor}
              onChange={(e) => handleInputChange('suppressAuthor', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="suppressAuthor" className="ml-2 text-sm text-gray-700">
              Suppress author (for narrative citations)
            </label>
          </div>

          {/* Page/Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Type
              </label>
              <div className="relative">
                <select
                  value={editedCitation.locatorType}
                  onChange={(e) => handleInputChange('locatorType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="page">Page</option>
                  <option value="chapter">Chapter</option>
                  <option value="section">Section</option>
                  <option value="paragraph">Paragraph</option>
                  <option value="line">Line</option>
                  <option value="figure">Figure</option>
                  <option value="table">Table</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={editedCitation.locator}
                onChange={(e) => handleInputChange('locator', e.target.value)}
                placeholder="e.g., 123, 45-67"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Prefix and Suffix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prefix
              </label>
              <input
                type="text"
                value={editedCitation.prefix}
                onChange={(e) => handleInputChange('prefix', e.target.value)}
                placeholder="e.g., see, cf."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suffix
              </label>
              <input
                type="text"
                value={editedCitation.suffix}
                onChange={(e) => handleInputChange('suffix', e.target.value)}
                placeholder="e.g., and others"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Citation Preview
            </label>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-900 font-mono">
                {citationPreview || "No preview available"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitationEditor;
