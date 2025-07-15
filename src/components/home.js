import CitationSearch from "../components/CitationSearch";
import CitationLibrary from "../components/CitationLibrary";
import CitationSettings from "../components/CitationSettings";
import BibliographySection from "../components/BibliographySection";
import ResearchDocuments from "../components/ResearchDocuments";
import OfficeWarning from "../components/OfficeWarning";
import CSL from "citeproc";
import apaStyle from "../csl-locales/apa.csl";
import ieeeStyle from "../csl-styes/ieee.csl";
import harvardStyle from "../csl-styes/harvard-limerick.csl";
import vancouverStyle from "../csl-styes/vancouver.csl";
import natureStyle from "../csl-styes/nature.csl";
import scienceStyle from "../csl-styes/science.csl";
import enLocale from "../csl-styes/localesen-US.xml";
import React, { useState, useEffect, useRef } from "react";
import { fetchUserFilesDocs } from "../api";

const Home = () => {
  // Normalize raw citation object to CSL format
  function normalizeCitation(raw) {
    return {
      id: raw.id || `citation_${Date.now()}_${Math.random()}`,
      author: raw.author && Array.isArray(raw.author) && raw.author.length > 0
        ? raw.author
        : [{ given: "Unknown", family: "" }],
      title: raw.file_name || raw.title || "Untitled",
      issued: raw.created_at
        ? { "date-parts": [[new Date(raw.created_at).getFullYear()]] }
        : { "date-parts": [[2025]] },
      ...raw
    };
  }
  const fileInputRef = useRef(null);
  const citationStyles = [
    { value: "apa", label: "APA (American Psychological Association)" },
    { value: "ieee", label: "IEEE" },
    { value: "harvard", label: "Harvard" },
    { value: "vancouver", label: "Vancouver" },
    { value: "nature", label: "Nature" },
    { value: "science", label: "Science" },
  ];
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
      setStatus(
        results.length > 0
          ? `Found ${results.length} results`
          : "No results found"
      );
    } catch (e) {
      console.error(e);
      setStatus("Search error");
    } finally {
      setIsSearching(false);
    }
  };
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [status, setStatus] = useState("Loading...");

  // Auth
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  };

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
  React.useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetchUserFilesDocs();
        setSearchResults(response?.data || []);
      } catch (e) {
        console.error("Fetch files error:", e);
      }
    };
    fetchFiles();
  }, []);
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
    if (typeof Office !== "undefined" && typeof Office.onReady === "function") {
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
      setStatus(
        "Office.js not loaded or not running in Office host - Demo mode active"
      );
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

  const searchCrossref = async (query) => {
    const res = await fetch(
      `https://api.crossref.org/works?query=${encodeURIComponent(
        query
      )}&rows=10`
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
    const normalized = normalizeCitation(citation);
    const citationWithMeta = {
      ...normalized,
      addedDate: new Date().toISOString(),
      used: false,
      inTextCitations: [],
    };
    const updated = [...citations, citationWithMeta];
    setCitations(updated);
    saveCitations(updated);
    setStatus("Citation added to library");
  };

  // Helper to get CSL style XML by style name
  const getCSLStyle = (styleName) => {
    switch (styleName) {
      case "apa":
        return apaStyle;
      case "ieee":
        return ieeeStyle;
      case "harvard":
        return harvardStyle;
      case "vancouver":
        return vancouverStyle;
      case "nature":
        return natureStyle;
      case "science":
        return scienceStyle;
      default:
        return apaStyle;
    }
  };

  // Format a single citation using citeproc-js
  const formatCitationCiteproc = (citation, styleName = "apa", format = "in-text") => {
    // Validate citation object
    if (!citation || !citation.id) {
      console.error("Citation is missing required id field.", citation);
      return undefined;
    }
    // Check for required fields (author, title, issued)
    if (!citation.author || !citation.title || !citation.issued) {
      console.warn("Citation may be missing required fields (author, title, issued)", citation);
    }
    const sys = {
      retrieveLocale: () => enLocale,
      retrieveItem: (id) => citation.id === id ? citation : citations.find(c => c.id === id),
    };
    const styleXML = getCSLStyle(styleName);
    let citeproc;
    try {
      citeproc = new CSL.Engine(sys, styleXML, "en-US");
    } catch (e) {
      console.error("CSL Engine initialization failed", e);
      return undefined;
    }
    try {
      citeproc.updateItems([citation.id]);
      let result;
      if (format === "in-text") {
        result = citeproc.makeCitationCluster([{ id: citation.id }]);
      } else {
        result = citeproc.makeCitationCluster([{ id: citation.id, locator: "footnote" }]);
      }
      return result && result[0] && result[0][1] ? result[0][1] : undefined;
    } catch (e) {
      console.error("Citation formatting failed", e);
      return undefined;
    }
  };

  // Format bibliography using citeproc-js
  const formatBibliographyCiteproc = (citationsArr, styleName = "apa") => {
    const sys = {
      retrieveLocale: () => enLocale,
      retrieveItem: (id) => citationsArr.find((c) => c.id === id),
    };
    const styleXML = getCSLStyle(styleName);
    const citeproc = new CSL.Engine(sys, styleXML, "en-US");
    const ids = citationsArr.map((c) => c.id);
    citeproc.updateItems(ids);
    const bibResult = citeproc.makeBibliography();
    return bibResult[1].join("\n");
  };

  const insertCitation = async (citation) => {
    if (!isOfficeReady) {
      console.log("Run this in Microsoft Word");
      return;
    }

    try {
      const formatted = formatCitationCiteproc(
        citation,
        citationStyle,
        citationFormat
      );
      console.log("Citation object:", citation, citationStyle, citationFormat);

      if (formatted === undefined) {
        console.error(
          "Formatted citation is undefined. Possible reasons: missing citation.id, missing required fields, invalid CSL style or locale."
        );
        console.log("Debug info:", {
          citation,
          citationStyle,
          citationFormat,
          styleXML: getCSLStyle(citationStyle),
          localeXML: enLocale,
        });
        setStatus(
          "Failed to format citation. Please check citation data and style."
        );
        return;
      } else {
        console.log("Formatted citation:", formatted);
      }
      if (typeof formatted === "string" && formatted.trim().length > 0) {
        await Word.run(async (context) => {
          const selection = context.document.getSelection();
          if (citationFormat === "in-text") {
            selection.insertText(formatted, Word.InsertLocation.replace);
          } else {
            selection.insertFootnote(formatted);
          }
          await context.sync();
        });
      } else {
        setStatus("Formatted citation is empty or invalid.");
        return;
      }

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
    if (!isOfficeReady) {
      console.log("Run this in Word");
      return;
    }

    const used = citations.filter((c) => c.used);
    if (used.length === 0) {
      console.log("No citations used");
      return;
    }

    try {
      const bib = formatBibliographyCiteproc(used, citationStyle);
      await Word.run(async (context) => {
        const body = context.document.body;
        body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);
        const title = body.insertParagraph(
          bibliographyTitle,
          Word.InsertLocation.end
        );
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
    if (citations.length === 0) {
      console.log("Nothing to export");
      return;
    }
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
        const newCitations = parsed.map((entry, idx) => {
          const normalized = normalizeCitation(entry);
          return {
            ...normalized,
            id: normalized.id || `import_${Date.now()}_${idx}`,
            used: false,
            source: "imported",
          };
        });
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
    c.author
      ?.map((a) => `${a.given || ""} ${a.family || ""}`.trim())
      .join(", ") || "Unknown";

  const removeCitationFromLibrary = (id) => {
    const updated = citations.filter((c) => c.id !== id);
    setCitations(updated);
    saveCitations(updated);
    setStatus("Citation removed from library");
  };

  const formatCitationPreview = (citation) => {
    // Show title and year for preview
    const title = getCitationTitle(citation);
    const year =
      citation.issued?.["date-parts"]?.[0]?.[0] || citation.year || "";
    return `${title}${year ? " (" + year + ")" : ""}`;
  };

  const mockPDFs = [
    {
      id: 1,
      title: "Climate Change Research 2024",
      content: `This study examines the latest developments in climate science...`,
    },
  ];

  const handlePDFClick = (pdf) => {
    if (!isOfficeReady) return console.log("Use this in Word");
    Word.run(async (context) => {
      const body = context.document.body;
      body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);
      const title = body.insertParagraph(pdf.title, Word.InsertLocation.end);
      title.style = "Heading 1";
      const content = body.insertParagraph(
        pdf.content,
        Word.InsertLocation.end
      );
      content.font.size = 11;
      await context.sync();
      setStatus(`Inserted: ${pdf.title}`);
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📚 ResearchCollab</h1>
        <p>Professional Citation Management for Microsoft Word</p>
        <div className="status-indicator">
          <span
            className={`status-dot ${
              isOfficeReady ? "connected" : "disconnected"
            }`}
          />
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
          removeCitationFromLibrary={removeCitationFromLibrary}
          getCitationTitle={getCitationTitle}
          getCitationAuthors={getCitationAuthors}
          isOfficeReady={isOfficeReady}
          formatCitationPreview={formatCitationPreview}
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
};
export default Home;
