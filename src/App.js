import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Cite from 'citation-js'; // v0.5.0

function App() {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [status, setStatus] = useState('Loading...');
  
  // Auth
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  };
  const [token, setToken] = useState('');
  
  // Citation management state
  const [citationStyle, setCitationStyle] = useState('apa');
  const [citationInput, setCitationInput] = useState('');
  const [citations, setCitations] = useState([]); // Array of citations with metadata
  const [bibliography, setBibliography] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCitations, setSelectedCitations] = useState([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [citationFormat, setCitationFormat] = useState('in-text'); // 'in-text' or 'footnote'
  const [bibliographyTitle, setBibliographyTitle] = useState('References');
  const [autoSync, setAutoSync] = useState(true);
  const [recentCitations, setRecentCitations] = useState([]);
  const fileInputRef = useRef(null);

  // Citation styles with proper labels
  const citationStyles = [
    { value: 'apa', label: 'APA (American Psychological Association)' },
    { value: 'mla', label: 'MLA (Modern Language Association)' },
    { value: 'chicago', label: 'Chicago Manual of Style' },
    { value: 'ieee', label: 'IEEE (Institute of Electrical and Electronics Engineers)' },
    { value: 'harvard', label: 'Harvard Style' },
    { value: 'vancouver', label: 'Vancouver Style' },
    { value: 'nature', label: 'Nature Style' },
    { value: 'science', label: 'Science Style' }
  ];

  useEffect(() => {
    const urlToken = getTokenFromUrl();
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
    }
  }, []);

  useEffect(() => {
    // Check if Office.js is available
    if (typeof Office !== 'undefined') {
      Office.onReady((info) => {
        if (info.host === Office.HostType.Word) {
          setIsOfficeReady(true);
          setStatus('ResearchCollab Add-in Ready');
          loadSavedCitations();
        } else {
          setStatus('Please run this add-in in Microsoft Word');
        }
      });
    } else {
      setStatus('Office.js not loaded - Demo mode active');
      loadSavedCitations();
    }
  }, []);

  // Load saved citations from localStorage
  const loadSavedCitations = () => {
    try {
      const saved = localStorage.getItem('researchCollab_citations');
      if (saved) {
        const parsedCitations = JSON.parse(saved);
        setCitations(parsedCitations);
        setRecentCitations(parsedCitations.slice(-5));
      }
    } catch (error) {
      console.error('Error loading citations:', error);
    }
  };

  // Save citations to localStorage
  const saveCitations = (updatedCitations) => {
    try {
      localStorage.setItem('researchCollab_citations', JSON.stringify(updatedCitations));
      setRecentCitations(updatedCitations.slice(-5));
    } catch (error) {
      console.error('Error saving citations:', error);
    }
  };

  // Enhanced citation search using multiple APIs
  const handleCitationSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setStatus('Searching academic databases...');
    
    try {
      // Search multiple sources
      const [crossrefResults, doiResults] = await Promise.allSettled([
        searchCrossref(searchQuery),
        searchByDOI(searchQuery)
      ]);

      let allResults = [];
      
      if (crossrefResults.status === 'fulfilled') {
        allResults = [...allResults, ...crossrefResults.value];
      }
      
      if (doiResults.status === 'fulfilled' && doiResults.value) {
        allResults = [doiResults.value, ...allResults];
      }

      setSearchResults(allResults);
      setStatus(allResults.length > 0 ? `Found ${allResults.length} results` : 'No results found');
    } catch (error) {
      console.error('Search error:', error);
      setStatus('Error searching citations');
    } finally {
      setIsSearching(false);
    }
  };

  // Search Crossref API
  const searchCrossref = async (query) => {
    const response = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=10&sort=relevance&order=desc`);
    const data = await response.json();
    
    if (data?.message?.items) {
      return data.message.items.map(item => ({
        ...item,
        source: 'crossref',
        id: item.DOI || `crossref_${Date.now()}_${Math.random()}`
      }));
    }
    return [];
  };

  // Search by DOI
  const searchByDOI = async (query) => {
    const doiPattern = /10\.\d{4,}\/[^\s]+/;
    if (!doiPattern.test(query)) return null;
    
    try {
      const response = await fetch(`https://api.crossref.org/works/${query}`);
      const data = await response.json();
      
      if (data?.message) {
        return {
          ...data.message,
          source: 'doi',
          id: data.message.DOI
        };
      }
    } catch (error) {
      console.error('DOI search error:', error);
    }
    return null;
  };

  // Add citation to library
  const addCitationToLibrary = (citation) => {
    const citationWithMetadata = {
      ...citation,
      id: citation.id || `citation_${Date.now()}_${Math.random()}`,
      addedDate: new Date().toISOString(),
      used: false,
      inTextCitations: []
    };
    
    const updatedCitations = [...citations, citationWithMetadata];
    setCitations(updatedCitations);
    saveCitations(updatedCitations);
    setStatus('Citation added to library');
  };

  // Remove citation from library
  const removeCitationFromLibrary = (citationId) => {
    const updatedCitations = citations.filter(c => c.id !== citationId);
    setCitations(updatedCitations);
    saveCitations(updatedCitations);
    setStatus('Citation removed from library');
  };

  // Insert citation into document
  const insertCitation = async (citation) => {
    if (!isOfficeReady) {
      alert('This add-in needs to be loaded in Microsoft Word');
      return;
    }

    try {
      const cite = new Cite(citation);
      const formatted = cite.format('citation', {
        format: 'text',
        type: 'string',
        style: citationStyle
      });

      await Word.run(async (context) => {
        const selection = context.document.getSelection();
        
        if (citationFormat === 'in-text') {
          selection.insertText(formatted, Word.InsertLocation.replace);
        } else {
          // Insert as footnote
          const footnote = selection.insertFootnote(formatted);
          footnote.body.font.size = 10;
        }
        
        await context.sync();
      });

      // Mark citation as used
      const updatedCitations = citations.map(c => 
        c.id === citation.id 
          ? { ...c, used: true, inTextCitations: [...(c.inTextCitations || []), formatted] }
          : c
      );
      setCitations(updatedCitations);
      saveCitations(updatedCitations);
      
      setStatus('Citation inserted successfully');
    } catch (error) {
      console.error('Error inserting citation:', error);
      setStatus('Error inserting citation');
    }
  };

  // Generate and insert bibliography
  const generateBibliography = async () => {
    if (!isOfficeReady) {
      alert('This add-in needs to be loaded in Microsoft Word');
      return;
    }
    
    const usedCitations = citations.filter(c => c.used);
    if (usedCitations.length === 0) {
      alert('No citations have been inserted into the document yet.');
      return;
    }

    try {
      const cite = new Cite(usedCitations);
      const bibliography = cite.format('bibliography', {
        format: 'text',
        type: 'string',
        style: citationStyle
      });

      await Word.run(async (context) => {
        const body = context.document.body;
        
        // Insert at the end of document
        body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);
        
        // Insert bibliography title
        const titleParagraph = body.insertParagraph(bibliographyTitle, Word.InsertLocation.end);
        titleParagraph.style = 'Heading 1';
        titleParagraph.font.bold = true;
        titleParagraph.font.size = 16;
        
        // Insert bibliography content
        const bibParagraph = body.insertParagraph(bibliography, Word.InsertLocation.end);
        bibParagraph.font.size = 12;
        bibParagraph.font.name = 'Times New Roman';
        bibParagraph.leftIndent = 36; // Hanging indent
        bibParagraph.firstLineIndent = -36;
        
        await context.sync();
      });

      setBibliography(bibliography);
      setStatus('Bibliography generated successfully');
    } catch (error) {
      console.error('Error generating bibliography:', error);
      setStatus('Error generating bibliography');
    }
  };

  // Import citations from BibTeX file
  const handleImportCitations = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bibtex = e.target.result;
        const cite = new Cite(bibtex);
        const parsed = cite.data;
        
        const importedCitations = parsed.map((citation, index) => ({
          ...citation,
          id: citation.id || `imported_${Date.now()}_${index}`,
          addedDate: new Date().toISOString(),
          used: false,
          source: 'imported'
        }));
        
        const updatedCitations = [...citations, ...importedCitations];
        setCitations(updatedCitations);
        saveCitations(updatedCitations);
        setStatus(`Imported ${importedCitations.length} citations`);
      } catch (error) {
        console.error('Import error:', error);
        setStatus('Error importing citations');
      }
    };
    reader.readAsText(file);
  };

  // Export citations as BibTeX
  const exportCitations = () => {
    if (citations.length === 0) {
      alert('No citations to export');
      return;
    }

    try {
      const cite = new Cite(citations);
      const bibtex = cite.format('bibtex');
      const blob = new Blob([bibtex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `researchcollab_citations_${new Date().toISOString().split('T')[0]}.bib`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('Citations exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      setStatus('Error exporting citations');
    }
  };

  // Format citation for display
  const formatCitationPreview = (citation) => {
    try {
      const cite = new Cite(citation);
      return cite.format('citation', {
        format: 'text',
        type: 'string',
        style: citationStyle
      });
    } catch (error) {
      return citation.title?.[0] || 'Unknown citation';
    }
  };

  // Get citation title for display
  const getCitationTitle = (citation) => {
    return citation.title?.[0] || citation.title || 'Untitled';
  };

  // Get citation authors for display
  const getCitationAuthors = (citation) => {
    if (citation.author && Array.isArray(citation.author)) {
      return citation.author.map(a => `${a.given || ''} ${a.family || ''}`.trim()).join(', ');
    }
    return 'Unknown authors';
  };

  // Mock PDF data (keeping existing functionality)
  const mockPDFs = [
    {
      id: 1,
      title: "Climate Change Research 2024",
      content: `Climate Change Research Report 2024\n\nExecutive Summary:\nThis comprehensive study examines the latest developments in climate science...`
    },
    {
      id: 2,
      title: "Artificial Intelligence in Healthcare",
      content: `AI in Healthcare: Transforming Medical Practice\n\nAbstract:\nThis research explores the integration of artificial intelligence technologies...`
    }
  ];

  const handlePDFClick = (pdfData) => {
    if (!isOfficeReady) {
      alert('This add-in needs to be loaded in Microsoft Word');
      return;
    }

    Word.run(async (context) => {
      try {
        const body = context.document.body;
        const paragraphs = body.paragraphs;
        paragraphs.load('items');
        await context.sync();
        
        if (paragraphs.items.length > 0) {
          body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);
        }
        
        const titleParagraph = body.insertParagraph(pdfData.title, Word.InsertLocation.end);
        titleParagraph.style = 'Heading 1';
        titleParagraph.font.color = '#2E75B6';
        titleParagraph.font.size = 18;
        
        body.insertParagraph('', Word.InsertLocation.end);
        
        const contentParagraph = body.insertParagraph(pdfData.content, Word.InsertLocation.end);
        contentParagraph.font.size = 11;
        contentParagraph.font.name = 'Times New Roman';
        contentParagraph.spaceAfter = 12;
        
        await context.sync();
        setStatus(`PDF "${pdfData.title}" inserted successfully!`);
      } catch (error) {
        console.error('Error inserting PDF content:', error);
        setStatus('Error inserting PDF content');
      }
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>📚 ResearchCollab</h1>
          <p>Professional Citation Management for Microsoft Word</p>
          <div className="status-indicator">
            <span className={`status-dot ${isOfficeReady ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">{status}</span>
          </div>
        </div>

        {/* Citation Search Section */}
        <div className="section citation-search">
          <h3>🔍 Search & Add Citations</h3>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by title, author, DOI, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCitationSearch()}
              className="search-input"
            />
            <button 
              onClick={handleCitationSearch} 
              disabled={!searchQuery.trim() || isSearching}
              className="search-button"
            >
              {isSearching ? '⏳ Searching...' : '🔍 Search'}
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="search-results">
              <h4>Search Results ({searchResults.length})</h4>
              {searchResults.map((result, index) => (
                <div key={result.id || index} className="search-result-item">
                  <div className="result-info">
                    <h5>{getCitationTitle(result)}</h5>
                    <p className="result-authors">{getCitationAuthors(result)}</p>
                    <p className="result-year">
                      {result.issued?.['date-parts']?.[0]?.[0] || 'Unknown year'}
                      {result.DOI && <span className="doi"> • DOI: {result.DOI}</span>}
                    </p>
                  </div>
                  <button 
                    onClick={() => addCitationToLibrary(result)}
                    className="add-citation-button"
                  >
                    ➕ Add to Library
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Citation Library Section */}
        <div className="section citation-library">
          <div className="section-header">
            <h3>📖 Citation Library ({citations.length})</h3>
            <div className="library-actions">
              <button onClick={() => fileInputRef.current?.click()} className="import-button">
                📄 Import BibTeX
              </button>
              <button onClick={exportCitations} disabled={citations.length === 0} className="export-button">
                💾 Export Library
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".bib,.bibtex"
                onChange={handleImportCitations}
                style={{ display: 'none' }}
              />
            </div>
          </div>
          
          {citations.length > 0 ? (
            <div className="citations-list">
              {citations.map((citation) => (
                <div key={citation.id} className={`citation-item ${citation.used ? 'used' : ''}`}>
                  <div className="citation-info">
                    <h5>{getCitationTitle(citation)}</h5>
                    <p className="citation-authors">{getCitationAuthors(citation)}</p>
                    <p className="citation-preview">{formatCitationPreview(citation)}</p>
                    {citation.used && <span className="used-badge">✓ Used in document</span>}
                  </div>
                  <div className="citation-actions">
                    <button 
                      onClick={() => insertCitation(citation)}
                      disabled={!isOfficeReady}
                      className="insert-button"
                    >
                      📝 Insert
                    </button>
                    <button 
                      onClick={() => removeCitationFromLibrary(citation.id)}
                      className="remove-button"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-library">
              <p>No citations in your library yet. Search and add citations above.</p>
            </div>
          )}
        </div>

        {/* Citation Settings Section */}
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

        {/* Bibliography Generation Section */}
        <div className="section bibliography-section">
          <h3>📋 Bibliography Generation</h3>
          <div className="bibliography-actions">
            <button 
              onClick={generateBibliography}
              disabled={!isOfficeReady || citations.filter(c => c.used).length === 0}
              className="generate-button"
            >
              📋 Generate Bibliography
            </button>
            <p className="bibliography-info">
              {citations.filter(c => c.used).length} citations will be included in the bibliography
            </p>
          </div>
        </div>

        {/* Research Documents Section (keeping existing functionality) */}
        <div className="section research-documents">
          <h3>📄 Research Documents</h3>
          <p>Insert sample research documents:</p>
          <div className="pdf-buttons">
            {mockPDFs.map((pdf) => (
              <button
                key={pdf.id}
                className="pdf-button"
                onClick={() => handlePDFClick(pdf)}
                disabled={!isOfficeReady}
              >
                📄 {pdf.title}
              </button>
            ))}
          </div>
        </div>

        {!isOfficeReady && (
          <div className="office-warning">
            <div className="warning-content">
              <h4>⚠️ Microsoft Word Required</h4>
              <p>This add-in is designed to work within Microsoft Word. Please install and run it from Word to access all features.</p>
              <p>Currently running in demo mode with limited functionality.</p>
            </div>
          </div>
        )}
      </header>
      
      <style jsx>{`
        .App {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: #333;
        }

        .App-header {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-content {
          text-align: center;
          margin-bottom: 30px;
          background: rgba(255, 255, 255, 0.95);
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .header-content h1 {
          color: #2E75B6;
          margin-bottom: 10px;
          font-size: 2.5em;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-dot.connected {
          background-color: #28a745;
        }

        .status-dot.disconnected {
          background-color: #dc3545;
        }

        .section {
          background: rgba(255, 255, 255, 0.95);
          margin-bottom: 20px;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .section h3 {
          color: #2E75B6;
          margin-bottom: 20px;
          font-size: 1.4em;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 10px;
        }

        .search-container {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .search-input {
          flex: 1;
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s;
        }

        .search-input:focus {
          outline: none;
          border-color: #2E75B6;
        }

        .search-button {
          padding: 12px 24px;
          background: #2E75B6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .search-button:hover:not(:disabled) {
          background: #1e5a96;
        }

        .search-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .search-results {
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
          max-height: 400px;
          overflow-y: auto;
        }

        .search-result-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 15px;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.3s;
        }

        .search-result-item:hover {
          background-color: #f8f9fa;
        }

        .result-info h5 {
          margin: 0 0 8px 0;
          color: #2E75B6;
          font-size: 1.1em;
        }

        .result-authors {
          margin: 0 0 5px 0;
          font-weight: 500;
          color: #666;
        }

        .result-year {
          margin: 0;
          font-size: 0.9em;
          color: #888;
        }

        .add-citation-button {
          padding: 8px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          white-space: nowrap;
        }

        .add-citation-button:hover {
          background: #218838;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .library-actions {
          display: flex;
          gap: 10px;
        }

        .import-button, .export-button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }

        .import-button {
          background: #17a2b8;
          color: white;
        }

        .export-button {
          background: #6c757d;
          color: white;
        }

        .citation-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 15px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          margin-bottom: 10px;
          transition: all 0.3s;
        }

        .citation-item.used {
          border-color: #28a745;
          background-color: #f8fff8;
        }

        .citation-info h5 {
          margin: 0 0 8px 0;
          color: #2E75B6;
          font-size: 1.1em;
        }

        .citation-authors {
          margin: 0 0 8px 0;
          font-weight: 500;
          color: #666;
        }

        .citation-preview {
          margin: 0 0 5px 0;
          font-size: 0.9em;
          color: #888;
          font-style: italic;
        }

        .used-badge {
          background: #28a745;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8em;
        }

        .citation-actions {
          display: flex;
          gap: 8px;
        }

        .insert-button {
          padding: 8px 16px;
          background: #2E75B6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .remove-button {
          padding: 8px 16px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .empty-library {
          text-align: center;
          padding: 40px;
          color: #888;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .setting-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setting-group label {
          font-weight: 600;
          color: #2E75B6;
        }

        .style-select, .format-select, .title-input {
          padding: 10px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.3s;
        }

        .style-select:focus, .format-select:focus, .title-input:focus {
          outline: none;
          border-color: #2E75B6;
        }

        .bibliography-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .generate-button {
          padding: 15px 30px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .generate-button:hover:not(:disabled) {
          background: #218838;
        }

        .generate-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .bibliography-info {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .pdf-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
        }

        .pdf-button {
          padding: 15px;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
          text-align: left;
        }

        .pdf-button:hover:not(:disabled) {
          background: #e9ecef;
          border-color: #2E75B6;
        }

        .pdf-button:disabled {
          background: #f8f9fa;
          border-color: #e9ecef;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .office-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
        }

        .warning-content {
          text-align: center;
        }

        .warning-content h4 {
          color: #856404;
          margin-bottom: 10px;
        }

        .warning-content p {
          color: #856404;
          margin-bottom: 8px;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .App-header {
            padding: 15px;
          }
          
          .section {
            padding: 20px;
          }
          
          .search-container {
            flex-direction: column;
          }
          
          .section-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }
          
          .citation-item {
            flex-direction: column;
            gap: 15px;
          }
          
          .citation-actions {
            justify-content: flex-start;
          }
          
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default App;