import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "./index.css";
import Cite from "citation-js"; // v0.5.0
import CitationSearch from "./components/CitationSearch";
import CitationLibrary from "./components/CitationLibrary";
import CitationSettings from "./components/CitationSettings";
import BibliographySection from "./components/BibliographySection";
import ResearchDocuments from "./components/ResearchDocuments";
import OfficeWarning from "./components/OfficeWarning";
import LoginPage from "./LoginPage";

function App() {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [status, setStatus] = useState("Loading...");

  // Auth
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  };
  const [token, setToken] = useState("");

  // Citation management state
  const [citationStyle, setCitationStyle] = useState("apa");
  const [citations, setCitations] = useState([]); // Array of citations with metadata
  const [bibliography, setBibliography] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [citationFormat, setCitationFormat] = useState("in-text"); // 'in-text' or 'footnote'
  const [bibliographyTitle, setBibliographyTitle] = useState("References");
  const [recentCitations, setRecentCitations] = useState([]);
  const fileInputRef = useRef(null);

  // Citation styles with proper labels
  const citationStyles = [
    { value: "apa", label: "APA (American Psychological Association)" },
    { value: "mla", label: "MLA (Modern Language Association)" },
    { value: "chicago", label: "Chicago Manual of Style" },
    {
      value: "ieee",
      label: "IEEE (Institute of Electrical and Electronics Engineers)",
    },
    { value: "harvard", label: "Harvard Style" },
    { value: "vancouver", label: "Vancouver Style" },
    { value: "nature", label: "Nature Style" },
    { value: "science", label: "Science Style" },
  ];

  useEffect(() => {
    const urlToken = getTokenFromUrl();
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      setToken(urlToken);
    }
  }, []);

  useEffect(() => {
    // Check if Office.js is available
    if (typeof Office !== "undefined") {
      Office.onReady((info) => {
        if (info.host === Office.HostType.Word) {
          setIsOfficeReady(true);
          setStatus("ResearchCollab Add-in Ready");
          loadSavedCitations();
        } else {
          setStatus("Please run this add-in in Microsoft Word");
        }
      });
    } else {
      setStatus("Office.js not loaded - Demo mode active");
      loadSavedCitations();
    }
  }, []);

  // Load saved citations from localStorage
  const loadSavedCitations = () => {
    try {
      const saved = localStorage.getItem("researchCollab_citations");
      if (saved) {
        const parsedCitations = JSON.parse(saved);
        setCitations(parsedCitations);
        setRecentCitations(parsedCitations.slice(-5));
      }
    } catch (error) {
      console.error("Error loading citations:", error);
    }
  };

  // Save citations to localStorage
  const saveCitations = (updatedCitations) => {
    try {
      localStorage.setItem(
        "researchCollab_citations",
        JSON.stringify(updatedCitations)
      );
      setRecentCitations(updatedCitations.slice(-5));
    } catch (error) {
      console.error("Error saving citations:", error);
    }
  };

  // Enhanced citation search using multiple APIs
  const handleCitationSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setStatus("Searching academic databases...");

    try {
      // Search multiple sources
      const [crossrefResults, doiResults] = await Promise.allSettled([
        searchCrossref(searchQuery),
        searchByDOI(searchQuery),
      ]);

      let allResults = [];

      if (crossrefResults.status === "fulfilled") {
        allResults = [...allResults, ...crossrefResults.value];
      }

      if (doiResults.status === "fulfilled" && doiResults.value) {
        allResults = [doiResults.value, ...allResults];
      }

      setSearchResults(allResults);
      setStatus(
        allResults.length > 0
          ? `Found ${allResults.length} results`
          : "No results found"
      );
    } catch (error) {
      console.error("Search error:", error);
      setStatus("Error searching citations");
    } finally {
      setIsSearching(false);
    }
  };

  // Search Crossref API
  const searchCrossref = async (query) => {
    const response = await fetch(
      `https://api.crossref.org/works?query=${encodeURIComponent(
        query
      )}&rows=10&sort=relevance&order=desc`
    );
    const data = await response.json();

    if (data?.message?.items) {
      return data.message.items.map((item) => ({
        ...item,
        source: "crossref",
        id: item.DOI || `crossref_${Date.now()}_${Math.random()}`,
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
          source: "doi",
          id: data.message.DOI,
        };
      }
    } catch (error) {
      console.error("DOI search error:", error);
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
      inTextCitations: [],
    };

    const updatedCitations = [...citations, citationWithMetadata];
    setCitations(updatedCitations);
    saveCitations(updatedCitations);
    setStatus("Citation added to library");
  };

  // Remove citation from library
  const removeCitationFromLibrary = (citationId) => {
    const updatedCitations = citations.filter((c) => c.id !== citationId);
    setCitations(updatedCitations);
    saveCitations(updatedCitations);
    setStatus("Citation removed from library");
  };

  // Insert citation into document
  const insertCitation = async (citation) => {
    if (!isOfficeReady) {
      alert("This add-in needs to be loaded in Microsoft Word");
      return;
    }

    try {
      const cite = new Cite(citation);
      const formatted = cite.format("citation", {
        format: "text",
        type: "string",
        style: citationStyle,
      });

      await Word.run(async (context) => {
        const selection = context.document.getSelection();

        if (citationFormat === "in-text") {
          selection.insertText(formatted, Word.InsertLocation.replace);
        } else {
          // Insert as footnote
          const footnote = selection.insertFootnote(formatted);
          footnote.body.font.size = 10;
        }

        await context.sync();
      });

      // Mark citation as used
      const updatedCitations = citations.map((c) =>
        c.id === citation.id
          ? {
              ...c,
              used: true,
              inTextCitations: [...(c.inTextCitations || []), formatted],
            }
          : c
      );
      setCitations(updatedCitations);
      saveCitations(updatedCitations);

      setStatus("Citation inserted successfully");
    } catch (error) {
      console.error("Error inserting citation:", error);
      setStatus("Error inserting citation");
    }
  };

  // Generate and insert bibliography
  const generateBibliography = async () => {
    if (!isOfficeReady) {
      alert("This add-in needs to be loaded in Microsoft Word");
      return;
    }

    const usedCitations = citations.filter((c) => c.used);
    if (usedCitations.length === 0) {
      alert("No citations have been inserted into the document yet.");
      return;
    }

    try {
      const cite = new Cite(usedCitations);
      const bibliography = cite.format("bibliography", {
        format: "text",
        type: "string",
        style: citationStyle,
      });

      await Word.run(async (context) => {
        const body = context.document.body;

        // Insert at the end of document
        body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);

        // Insert bibliography title
        const titleParagraph = body.insertParagraph(
          bibliographyTitle,
          Word.InsertLocation.end
        );
        titleParagraph.style = "Heading 1";
        titleParagraph.font.bold = true;
        titleParagraph.font.size = 16;

        // Insert bibliography content
        const bibParagraph = body.insertParagraph(
          bibliography,
          Word.InsertLocation.end
        );
        bibParagraph.font.size = 12;
        bibParagraph.font.name = "Times New Roman";
        bibParagraph.leftIndent = 36; // Hanging indent
        bibParagraph.firstLineIndent = -36;

        await context.sync();
      });

      setBibliography(bibliography);
      setStatus("Bibliography generated successfully");
    } catch (error) {
      console.error("Error generating bibliography:", error);
      setStatus("Error generating bibliography");
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
          source: "imported",
        }));

        const updatedCitations = [...citations, ...importedCitations];
        setCitations(updatedCitations);
        saveCitations(updatedCitations);
        setStatus(`Imported ${importedCitations.length} citations`);
      } catch (error) {
        console.error("Import error:", error);
        setStatus("Error importing citations");
      }
    };
    reader.readAsText(file);
  };

  // Export citations as BibTeX
  const exportCitations = () => {
    if (citations.length === 0) {
      alert("No citations to export");
      return;
    }

    try {
      const cite = new Cite(citations);
      const bibtex = cite.format("bibtex");
      const blob = new Blob([bibtex], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `researchcollab_citations_${
        new Date().toISOString().split("T")[0]
      }.bib`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus("Citations exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      setStatus("Error exporting citations");
    }
  };

  // Format citation for display
  const formatCitationPreview = (citation) => {
    try {
      const cite = new Cite(citation);
      return cite.format("citation", {
        format: "text",
        type: "string",
        style: citationStyle,
      });
    } catch (error) {
      return citation.title?.[0] || "Unknown citation";
    }
  };

  // Get citation title for display
  const getCitationTitle = (citation) => {
    return citation.title?.[0] || citation.title || "Untitled";
  };

  // Get citation authors for display
  const getCitationAuthors = (citation) => {
    if (citation.author && Array.isArray(citation.author)) {
      return citation.author
        .map((a) => `${a.given || ""} ${a.family || ""}`.trim())
        .join(", ");
    }
    return "Unknown authors";
  };

  // Mock PDF data (keeping existing functionality)
  const mockPDFs = [
    {
      id: 1,
      title: "Climate Change Research 2024",
      content: `Climate Change Research Report 2024\n\nExecutive Summary:\nThis comprehensive study examines the latest developments in climate science...`,
    },
    {
      id: 2,
      title: "Artificial Intelligence in Healthcare",
      content: `AI in Healthcare: Transforming Medical Practice\n\nAbstract:\nThis research explores the integration of artificial intelligence technologies...`,
    },
  ];

  const handlePDFClick = (pdfData) => {
    if (!isOfficeReady) {
      alert("This add-in needs to be loaded in Microsoft Word");
      return;
    }

    Word.run(async (context) => {
      try {
        const body = context.document.body;
        const paragraphs = body.paragraphs;
        paragraphs.load("items");
        await context.sync();

        if (paragraphs.items.length > 0) {
          body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);
        }

        const titleParagraph = body.insertParagraph(
          pdfData.title,
          Word.InsertLocation.end
        );
        titleParagraph.style = "Heading 1";
        titleParagraph.font.color = "#2E75B6";
        titleParagraph.font.size = 18;

        body.insertParagraph("", Word.InsertLocation.end);

        const contentParagraph = body.insertParagraph(
          pdfData.content,
          Word.InsertLocation.end
        );
        contentParagraph.font.size = 11;
        contentParagraph.font.name = "Times New Roman";
        contentParagraph.spaceAfter = 12;

        await context.sync();
        setStatus(`PDF "${pdfData.title}" inserted successfully!`);
      } catch (error) {
        console.error("Error inserting PDF content:", error);
        setStatus("Error inserting PDF content");
      }
    });
  };
    return <LoginPage />;
  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>📚 ResearchCollab</h1>
          <p>Professional Citation Management for Microsoft Word</p>
          <div className="status-indicator">
            <span
              className={`status-dot ${
                isOfficeReady ? "connected" : "disconnected"
              }`}
            ></span>
            <span className="status-text">{status}</span>
          </div>
        </div>

        {/* Citation Search Section */}
        <CitationSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleCitationSearch={handleCitationSearch}
          isSearching={isSearching}
          searchResults={searchResults}
          addCitationToLibrary={addCitationToLibrary}
          getCitationTitle={getCitationTitle}
          getCitationAuthors={getCitationAuthors}
        />

        {/* Citation Library Section */}
        <CitationLibrary
          citations={citations}
          fileInputRef={fileInputRef}
          exportCitations={exportCitations}
          handleImportCitations={handleImportCitations}
          insertCitation={insertCitation}
          removeCitationFromLibrary={removeCitationFromLibrary}
          getCitationTitle={getCitationTitle}
          getCitationAuthors={getCitationAuthors}
          formatCitationPreview={formatCitationPreview}
          isOfficeReady={isOfficeReady}
        />

        {/* Citation Settings Section */}
        <CitationSettings
          citationStyle={citationStyle}
          setCitationStyle={setCitationStyle}
          citationStyles={citationStyles}
          citationFormat={citationFormat}
          setCitationFormat={setCitationFormat}
          bibliographyTitle={bibliographyTitle}
          setBibliographyTitle={setBibliographyTitle}
        />

        {/* Bibliography Generation Section */}
        <BibliographySection
          generateBibliography={generateBibliography}
          isOfficeReady={isOfficeReady}
          citations={citations}
        />

        {/* Research Documents Section */}
        <ResearchDocuments
          mockPDFs={mockPDFs}
          handlePDFClick={handlePDFClick}
          isOfficeReady={isOfficeReady}
        />

        {!isOfficeReady && <OfficeWarning />}
      </header>

      {/* Styles moved to index.css */}
    </div>
  );
}

export default App;
