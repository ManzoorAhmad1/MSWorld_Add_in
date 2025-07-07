import React, { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import "./index.css";
import Cite from "citation-js";

import CitationSearch from "./components/CitationSearch";
import CitationLibrary from "./components/CitationLibrary";
import CitationSettings from "./components/CitationSettings";
import BibliographySection from "./components/BibliographySection";
import ResearchDocuments from "./components/ResearchDocuments";
import OfficeWarning from "./components/OfficeWarning";
import LoginPage from "./LoginPage";
import LoginPopup from "./LoginPopup";

function App() {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [status, setStatus] = useState("Loading...");

  // Auth
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  };
  const [token, setToken] = useState("");

  // Citation state
  const [citationStyle, setCitationStyle] = useState("apa");
  const [citations, setCitations] = useState([]);
  const [bibliography, setBibliography] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [citationFormat, setCitationFormat] = useState("in-text");
  const [bibliographyTitle, setBibliographyTitle] = useState("References");
  const [recentCitations, setRecentCitations] = useState([]);
  const fileInputRef = useRef(null);

  const citationStyles = [
    { value: "apa", label: "APA (American Psychological Association)" },
    { value: "mla", label: "MLA (Modern Language Association)" },
    { value: "chicago", label: "Chicago Manual of Style" },
    { value: "ieee", label: "IEEE" },
    { value: "harvard", label: "Harvard" },
    { value: "vancouver", label: "Vancouver" },
    { value: "nature", label: "Nature" },
    { value: "science", label: "Science" },
  ];

  useEffect(() => {
    const urlToken = getTokenFromUrl();
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      setToken(urlToken);
    } else {
      const stored = localStorage.getItem("token");
      if (stored) setToken(stored);
    }
  }, []);

  useEffect(() => {
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

  const loadSavedCitations = () => {
    try {
      const saved = localStorage.getItem("researchCollab_citations");
      if (saved) {
        const parsed = JSON.parse(saved);
        setCitations(parsed);
        setRecentCitations(parsed.slice(-5));
      }
    } catch (e) {
      console.error("Load citations failed:", e);
    }
  };

  const saveCitations = (updated) => {
    localStorage.setItem("researchCollab_citations", JSON.stringify(updated));
    setRecentCitations(updated.slice(-5));
  };

  const handleCitationSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setStatus("Searching academic databases...");

    try {
      const [crossrefResults, doiResult] = await Promise.allSettled([
        searchCrossref(searchQuery),
        searchByDOI(searchQuery),
      ]);

      let results = [];
      if (crossrefResults.status === "fulfilled") {
        results = results.concat(crossrefResults.value);
      }
      if (doiResult.status === "fulfilled" && doiResult.value) {
        results.unshift(doiResult.value);
      }

      setSearchResults(results);
      setStatus(results.length > 0 ? `Found ${results.length} results` : "No results found");
    } catch (e) {
      console.error(e);
      setStatus("Search error");
    } finally {
      setIsSearching(false);
    }
  };

  const searchCrossref = async (query) => {
    const res = await fetch(
      `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=10`
    );
    const data = await res.json();
    return (data.message?.items || []).map((item) => ({
      ...item,
      source: "crossref",
      id: item.DOI || `crossref_${Date.now()}_${Math.random()}`,
    }));
  };

  const searchByDOI = async (query) => {
    const match = query.match(/10\.\d{4,}\/[^\s]+/);
    if (!match) return null;
    try {
      const res = await fetch(`https://api.crossref.org/works/${match[0]}`);
      const data = await res.json();
      return {
        ...data.message,
        source: "doi",
        id: data.message.DOI,
      };
    } catch {
      return null;
    }
  };

  const addCitationToLibrary = (citation) => {
    const citationWithMeta = {
      ...citation,
      id: citation.id || `citation_${Date.now()}_${Math.random()}`,
      addedDate: new Date().toISOString(),
      used: false,
      inTextCitations: [],
    };
    const updated = [...citations, citationWithMeta];
    setCitations(updated);
    saveCitations(updated);
    setStatus("Citation added to library");
  };

  const insertCitation = async (citation) => {
    if (!isOfficeReady) return alert("Run this in Microsoft Word");

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
          selection.insertFootnote(formatted);
        }
        await context.sync();
      });

      const updated = citations.map((c) =>
        c.id === citation.id
          ? {
              ...c,
              used: true,
              inTextCitations: [...(c.inTextCitations || []), formatted],
            }
          : c
      );
      setCitations(updated);
      saveCitations(updated);
      setStatus("Citation inserted");
    } catch (e) {
      console.error("Insert failed:", e);
      setStatus("Insert failed");
    }
  };

  const generateBibliography = async () => {
    if (!isOfficeReady) return alert("Run this in Word");

    const used = citations.filter((c) => c.used);
    if (used.length === 0) return alert("No citations used");

    try {
      const cite = new Cite(used);
      const bib = cite.format("bibliography", {
        format: "text",
        type: "string",
        style: citationStyle,
      });

      await Word.run(async (context) => {
        const body = context.document.body;
        body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);
        const title = body.insertParagraph(bibliographyTitle, Word.InsertLocation.end);
        title.style = "Heading 1";
        title.font.bold = true;
        title.font.size = 16;
        const content = body.insertParagraph(bib, Word.InsertLocation.end);
        content.font.name = "Times New Roman";
        content.font.size = 12;
        content.leftIndent = 36;
        content.firstLineIndent = -36;
        await context.sync();
      });

      setBibliography(bib);
      setStatus("Bibliography inserted");
    } catch (e) {
      console.error("Bibliography error:", e);
      setStatus("Error generating bibliography");
    }
  };

  const exportCitations = () => {
    if (citations.length === 0) return alert("Nothing to export");
    const cite = new Cite(citations);
    const bibtex = cite.format("bibtex");
    const blob = new Blob([bibtex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `citations_${Date.now()}.bib`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Exported");
  };

  const handleImportCitations = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const bibtex = ev.target.result;
        const cite = new Cite(bibtex);
        const parsed = cite.data;
        const newCitations = parsed.map((entry, idx) => ({
          ...entry,
          id: entry.id || `import_${Date.now()}_${idx}`,
          used: false,
          source: "imported",
        }));
        const updated = [...citations, ...newCitations];
        setCitations(updated);
        saveCitations(updated);
        setStatus("Citations imported");
      } catch (err) {
        console.error("Import error:", err);
        setStatus("Import failed");
      }
    };
    reader.readAsText(file);
  };

  const getCitationTitle = (c) => c.title?.[0] || c.title || "Untitled";
  const getCitationAuthors = (c) =>
    c.author?.map((a) => `${a.given || ""} ${a.family || ""}`.trim()).join(", ") ||
    "Unknown";

  const mockPDFs = [
    {
      id: 1,
      title: "Climate Change Research 2024",
      content: `This study examines the latest developments in climate science...`,
    },
  ];

  const handlePDFClick = (pdf) => {
    if (!isOfficeReady) return alert("Use this in Word");
    Word.run(async (context) => {
      const body = context.document.body;
      body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);
      const title = body.insertParagraph(pdf.title, Word.InsertLocation.end);
      title.style = "Heading 1";
      const content = body.insertParagraph(pdf.content, Word.InsertLocation.end);
      content.font.size = 11;
      await context.sync();
      setStatus(`Inserted: ${pdf.title}`);
    });
  };

  const renderMainApp = () => (
    <div className="App">
      <header className="App-header">
        <h1>📚 ResearchCollab</h1>
        <p>Professional Citation Management for Microsoft Word</p>
        <div className="status-indicator">
          <span className={`status-dot ${isOfficeReady ? "connected" : "disconnected"}`} />
          <span className="status-text">{status}</span>
        </div>

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

        <CitationLibrary
          citations={citations}
          fileInputRef={fileInputRef}
          exportCitations={exportCitations}
          handleImportCitations={handleImportCitations}
          insertCitation={insertCitation}
          getCitationTitle={getCitationTitle}
          getCitationAuthors={getCitationAuthors}
          isOfficeReady={isOfficeReady}
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
          generateBibliography={generateBibliography}
          isOfficeReady={isOfficeReady}
          citations={citations}
        />

        <ResearchDocuments
          mockPDFs={mockPDFs}
          handlePDFClick={handlePDFClick}
          isOfficeReady={isOfficeReady}
        />

        {!isOfficeReady && <OfficeWarning />}
      </header>
    </div>
  );
  return (
      <Routes>
        <Route path="/login" element={<LoginPopup />} />
        <Route
          path="*"
          element={
            // (typeof Office !== "undefined" && isOfficeReady) || token
            //   ? renderMainApp()
               <LoginPage />
          }
        />
      </Routes>
  );
}

export default App;
