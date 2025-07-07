import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './index.css';
import Cite from 'citation-js'; // v0.5.0
import CitationSearch from './components/CitationSearch';
import CitationLibrary from './components/CitationLibrary';
import CitationSettings from './components/CitationSettings';
import BibliographySection from './components/BibliographySection';
import ResearchDocuments from './components/ResearchDocuments';
import OfficeWarning from './components/OfficeWarning';

function App() {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [status, setStatus] = useState('Loading...');
  
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  };
  const [token, setToken] = useState('');

  const [citationStyle, setCitationStyle] = useState('apa');
  const [citations, setCitations] = useState([]);
  const [bibliography, setBibliography] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [citationFormat, setCitationFormat] = useState('in-text');
  const [bibliographyTitle, setBibliographyTitle] = useState('References');
  const [recentCitations, setRecentCitations] = useState([]);
  const fileInputRef = useRef(null);

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

  const loadSavedCitations = () => {
    try {
      const saved = localStorage.getItem('researchCollab_citations');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCitations(parsed);
        setRecentCitations(parsed.slice(-5));
      }
    } catch (error) {
      console.error('Error loading citations:', error);
    }
  };

  const saveCitations = (updatedCitations) => {
    try {
      localStorage.setItem('researchCollab_citations', JSON.stringify(updatedCitations));
      setRecentCitations(updatedCitations.slice(-5));
    } catch (error) {
      console.error('Error saving citations:', error);
    }
  };

  const handleCitationSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setStatus('Searching academic databases...');
    
    try {
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

  const removeCitationFromLibrary = (citationId) => {
    const updatedCitations = citations.filter(c => c.id !== citationId);
    setCitations(updatedCitations);
    saveCitations(updatedCitations);
    setStatus('Citation removed from library');
  };

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
          const footnote = selection.insertFootnote(formatted);
          footnote.body.font.size = 10;
        }
        
        await context.sync();
      });

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
        body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);

        const titleParagraph = body.insertParagraph(bibliographyTitle, Word.InsertLocation.end);
        titleParagraph.style = 'Heading 1';
        titleParagraph.font.bold = true;
        titleParagraph.font.size = 16;

        const bibParagraph = body.insertParagraph(bibliography, Word.InsertLocation.end);
        bibParagraph.font.size = 12;
        bibParagraph.font.name = 'Times New Roman';
        bibParagraph.leftIndent = 36;
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
          source: 'imported',
          inTextCitations: []
        }));

        const updatedCitations = [...citations, ...importedCitations];
        setCitations(updatedCitations);
        saveCitations(updatedCitations);
        setStatus(`${importedCitations.length} citations imported successfully`);
      } catch (error) {
        console.error('Error importing BibTeX:', error);
        setStatus('Failed to import BibTeX file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="App">
      <h1>ResearchCollab Citation Manager</h1>
      <p>Status: {status}</p>

      {!isOfficeReady && <OfficeWarning />}
      
      <CitationSearch
        query={searchQuery}
        setQuery={setSearchQuery}
        onSearch={handleCitationSearch}
        results={searchResults}
        isSearching={isSearching}
        onAddCitation={addCitationToLibrary}
      />

      <CitationLibrary
        citations={citations}
        onInsert={insertCitation}
        onRemove={removeCitationFromLibrary}
        recentCitations={recentCitations}
      />

      <CitationSettings
        citationStyle={citationStyle}
        setCitationStyle={setCitationStyle}
        citationStyles={citationStyles}
        citationFormat={citationFormat}
        setCitationFormat={setCitationFormat}
        bibliographyTitle={bibliographyTitle}
        setBibliographyTitle={setBibliographyTitle}
      />

      <BibliographySection
        onGenerate={generateBibliography}
        bibliography={bibliography}
      />

      <ResearchDocuments
        onImportCitations={handleImportCitations}
        fileInputRef={fileInputRef}
      />
    </div>
  );
}

export default App;
