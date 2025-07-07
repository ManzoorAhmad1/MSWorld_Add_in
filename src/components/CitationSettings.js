import React from 'react';

const CitationSettings = ({
  citationStyle,
  setCitationStyle,
  citationStyles,
  citationFormat,
  setCitationFormat,
  bibliographyTitle,
  setBibliographyTitle
}) => (
  <div className="section citation-settings">
    <h3>⚙️ Citation Settings</h3>
    <div className="settings-grid">
      <div className="setting-group">
        <label htmlFor="citation-style">Citation Style:</label>
        <select 
          id="citation-style" 
          value={citationStyle} 
          onChange={(e) => setCitationStyle(e.target.value)}
          className="style-select"
        >
          {citationStyles.map(style => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
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

export default CitationSettings;
