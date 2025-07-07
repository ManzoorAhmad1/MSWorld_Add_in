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
  <div className="w-full bg-amber-50 rounded-lg p-4 shadow mb-4">
    <h3 className="text-lg font-semibold text-emerald-700 mb-2 flex items-center gap-2">⚙️ Citation Settings</h3>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="flex flex-col">
        <label htmlFor="citation-style" className="text-sm font-medium text-emerald-900 mb-1">Citation Style:</label>
        <select
          id="citation-style"
          value={citationStyle}
          onChange={(e) => setCitationStyle(e.target.value)}
          className="rounded border border-amber-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white text-gray-800"
        >
          {citationStyles.map(style => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label htmlFor="citation-format" className="text-sm font-medium text-emerald-900 mb-1">Citation Format:</label>
        <select
          id="citation-format"
          value={citationFormat}
          onChange={(e) => setCitationFormat(e.target.value)}
          className="rounded border border-amber-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white text-gray-800"
        >
          <option value="in-text">In-text Citations</option>
          <option value="footnote">Footnotes</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label htmlFor="bibliography-title" className="text-sm font-medium text-emerald-900 mb-1">Bibliography Title:</label>
        <input
          id="bibliography-title"
          type="text"
          value={bibliographyTitle}
          onChange={(e) => setBibliographyTitle(e.target.value)}
          className="rounded border border-amber-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white text-gray-800"
        />
      </div>
    </div>
  </div>
);

export default CitationSettings;
