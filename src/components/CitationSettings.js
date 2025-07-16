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
    setCitationStyle(newStyle);
    
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
    <div className="section citation-settings">
      <h3>⚙️ Citation Settings</h3>
      <div className="settings-grid">
        <div className="setting-group">
          <label htmlFor="citation-style">Citation Style:</label>
          <select 
            id="citation-style" 
            value={citationStyle} 
            onChange={(e) => handleStyleChange(e.target.value)}
            className="style-select"
          >
            {citationStyles.map(style => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
          
          {/* Style Preview */}
          {stylePreview && (
            <div className="style-preview" style={{
              marginTop: "10px",
              padding: "10px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "4px",
              fontSize: "12px"
            }}>
              <strong>Preview:</strong>
              <div style={{ marginTop: "5px" }}>
                <strong>In-text:</strong> {stylePreview.inText}
              </div>
              <div style={{ marginTop: "5px" }}>
                <strong>Bibliography:</strong> {stylePreview.bibliography}
              </div>
            </div>
          )}
        </div>
        <div className="setting-group">
          <label htmlFor="citation-format">Citation Format:</label>
          <select 
            id="citation-format" 
            value={citationFormat} 
            onChange={(e) => setCitationFormat(e.target.value)}
            className="format-select"
          >
            <option value="in-text">In-text Citations</option>
            <option value="footnote">Footnotes</option>
          </select>
        </div>
        <div className="setting-group">
          <label htmlFor="bibliography-title">Bibliography Title:</label>
          <input
            id="bibliography-title"
            type="text"
            value={bibliographyTitle}
            onChange={(e) => setBibliographyTitle(e.target.value)}
            className="title-input"
          />
        </div>
      </div>
    </div>
  );
};

export default CitationSettings;
