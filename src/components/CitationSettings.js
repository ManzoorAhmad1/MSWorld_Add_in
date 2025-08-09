import React, { useState } from 'react';

const CitationSettings = ({
  citationStyle,
  setCitationStyle,
  citationStyles,
  citationFormat,
  setCitationFormat,
  bibliographyTitle,
  setBibliographyTitle,
  previewCitationStyle // New prop for style preview
}) => {
  const [stylePreview, setStylePreview] = useState(null);

  const handleStyleChange = async (newStyle) => {
    console.log(`🎨 Changing citation style to: ${newStyle}`);
    
    // Call the parent's citation style change handler (which includes auto-regeneration)
    await setCitationStyle(newStyle);
    
    // Generate preview if previewCitationStyle function is available
    if (previewCitationStyle) {
      try {
        const preview = await previewCitationStyle(newStyle);
        setStylePreview(preview);
      } catch (error) {
        console.error("Failed to generate style preview:", error);
        setStylePreview(null);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 my-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        ⚙️ Citation Settings
      </h3>
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="citation-style" className="block text-sm font-medium text-gray-700">
            Citation Style:
          </label>
          <select 
            id="citation-style" 
            value={citationStyle} 
            onChange={(e) => handleStyleChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
          >
            {citationStyles.map(style => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
          
          {/* Info about auto-regeneration */}
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="text-blue-600 mr-2 mt-0.5">ℹ️</div>
              <div className="text-sm text-blue-800">
                <strong>Auto-regeneration:</strong> When you change the citation style, your existing bibliography will be automatically updated to match the new style format.
              </div>
            </div>
          </div>
          
          {/* Enhanced Style Preview */}
          {stylePreview && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-3">
                <strong className="text-sm font-medium text-gray-900">📝 In-text Preview:</strong>
                <div className="mt-1 font-serif text-sm text-blue-700">
                  {stylePreview.inText}
                </div>
              </div>
              <div>
                <strong className="text-sm font-medium text-gray-900">📚 Bibliography Preview:</strong>
                <div className="mt-1 font-serif text-sm text-gray-600 leading-relaxed">
                  {stylePreview.bibliography}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="citation-format" className="block text-sm font-medium text-gray-700">
            Citation Format:
          </label>
          <select 
            id="citation-format" 
            value={citationFormat} 
            onChange={(e) => setCitationFormat(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="in-text">📝 In-text Citations</option>
            <option value="footnote">📄 Footnotes</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="bibliography-title" className="block text-sm font-medium text-gray-700">
            Bibliography Title:
          </label>
          <input
            id="bibliography-title"
            type="text"
            value={bibliographyTitle}
            onChange={(e) => setBibliographyTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="e.g., References, Bibliography, Works Cited"
          />
        </div>
      </div>
    </div>
  );
};

export default CitationSettings;
