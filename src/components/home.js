import CitationSearch from "../components/CitationSearch";
import CitationLibrary from "../components/CitationLibrary";
import CitationSettings from "../components/CitationSettings";
import BibliographySection from "../components/BibliographySection";
import ResearchDocuments from "../components/ResearchDocuments";
import OfficeWarning from "../components/OfficeWarning";
import CSL from "citeproc";
import apaStyle from "../csl-locales/apa.csl";
// Fixed import paths (corrected typos)
import ieeeStyle from "../csl-styles/ieee.csl";
import harvardStyle from "../csl-styles/harvard-limerick.csl";
import vancouverStyle from "../csl-styles/vancouver.csl";
import natureStyle from "../csl-styles/nature.csl";
import scienceStyle from "../csl-styles/science.csl";
import enLocale from "../csl-styles/locales-en-US.xml";
import React, { useState, useEffect, useRef } from "react";
import { fetchUserFilesDocs } from "../api";

const Home = () => {
  // Fallback CSL styles (minimal working styles)
  const fallbackAPA = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0">
  <info>
    <title>Fallback APA</title>
    <id>fallback-apa</id>
  </info>
  <citation>
    <layout prefix="(" suffix=")" delimiter="; ">
      <group delimiter=", ">
        <text macro="author-short"/>
        <text macro="issued"/>
      </group>
    </layout>
  </citation>
  <bibliography>
    <layout>
      <group delimiter=". ">
        <text macro="author"/>
        <text macro="issued"/>
        <text macro="title"/>
      </group>
    </layout>
  </bibliography>
  <macro name="author">
    <names variable="author">
      <name form="long" delimiter=", " delimiter-precedes-last="always"/>
      <substitute>
        <text term="anonymous"/>
      </substitute>
    </names>
  </macro>
  <macro name="author-short">
    <names variable="author">
      <name form="short" delimiter=", "/>
      <substitute>
        <text term="anonymous"/>
      </substitute>
    </names>
  </macro>
  <macro name="issued">
    <date variable="issued">
      <date-part name="year"/>
    </date>
  </macro>
  <macro name="title">
    <text variable="title"/>
  </macro>
</style>`;

  const fallbackLocale = `<?xml version="1.0" encoding="utf-8"?>
<locale xmlns="http://purl.org/net/xbiblio/csl" version="1.0" xml:lang="en-US">
  <info>
    <translator>
      <name>Fallback Locale</name>
    </translator>
  </info>
  <terms>
    <term name="anonymous">Anonymous</term>
    <term name="no date">n.d.</term>
  </terms>
</locale>`;

  // Enhanced normalizeCitation function
  const normalizeCitation = (raw) => {
    if (!raw) return null;

    // Ensure we have a valid author array
    let authors = [];
    if (raw.author && Array.isArray(raw.author) && raw.author.length > 0) {
      authors = raw.author.map(author => ({
        given: author.given || "Unknown",
        family: author.family || "Author"
      }));
    } else if (raw.author && typeof raw.author === 'string') {
      // Handle string authors
      const nameParts = raw.author.split(' ');
      authors = [{
        given: nameParts[0] || "Unknown",
        family: nameParts.slice(1).join(' ') || "Author"
      }];
    } else {
      authors = [{ given: "Unknown", family: "Author" }];
    }

    // Ensure we have a valid issued date
    let issued = { "date-parts": [[2025]] };
    if (raw.issued && raw.issued["date-parts"]) {
      issued = raw.issued;
    } else if (raw.created_at) {
      const year = new Date(raw.created_at).getFullYear();
      issued = { "date-parts": [[year]] };
    } else if (raw.year) {
      issued = { "date-parts": [[parseInt(raw.year)]] };
    } else if (raw.pdf_metadata && raw.pdf_metadata.PublicationYear) {
      issued = { "date-parts": [[parseInt(raw.pdf_metadata.PublicationYear)]] };
    }

    // Ensure we have a valid title
    let title = "Untitled";
    if (raw.title) {
      if (Array.isArray(raw.title)) {
        title = raw.title[0] || "Untitled";
      } else {
        title = raw.title;
      }
    } else if (raw.file_name) {
      title = raw.file_name;
    }

    // Extract additional metadata
    const containerTitle = raw["container-title"] || 
                          raw.journal || 
                          (raw.pdf_metadata && raw.pdf_metadata.JournalName) || 
                          "";

    const doi = raw.DOI || raw.doi || "";
    const url = raw.URL || raw.url || raw.file_link || raw.straico_file_url || "";
    const publisher = raw.publisher || 
                     (raw.pdf_metadata && raw.pdf_metadata.Institution) || 
                     "";

    return {
      id: raw.id ? String(raw.id) : `citation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: raw.type || "article-journal",
      author: authors,
      title: title,
      issued: issued,
      DOI: doi,
      URL: url,
      publisher: publisher,
      "container-title": containerTitle,
      volume: raw.volume || (raw.pdf_metadata && raw.pdf_metadata.Volume) || "",
      issue: raw.issue || (raw.pdf_metadata && raw.pdf_metadata.Issue) || "",
      page: raw.page || "",
      abstract: raw.abstract || (raw.pdf_metadata && raw.pdf_metadata.Abstract) || "",
      ...raw // Spread other properties
    };
  };

  // Enhanced getCSLStyle function with fallbacks
  const getCSLStyle = (styleName) => {
    try {
      switch (styleName) {
        case "apa":
          return apaStyle || fallbackAPA;
        case "ieee":
          return ieeeStyle || fallbackAPA;
        case "harvard":
          return harvardStyle || fallbackAPA;
        case "vancouver":
          return vancouverStyle || fallbackAPA;
        case "nature":
          return natureStyle || fallbackAPA;
        case "science":
          return scienceStyle || fallbackAPA;
        default:
          return fallbackAPA;
      }
    } catch (error) {
      console.warn(`Failed to load style ${styleName}, using fallback`, error);
      return fallbackAPA;
    }
  };

  // Fallback formatting function
  const formatCitationFallback = (citation, format = "in-text") => {
    try {
      const normalized = normalizeCitation(citation);
      if (!normalized) return "[Invalid Citation]";

      const authors = normalized.author || [{ given: "Unknown", family: "Author" }];
      const year = normalized.issued?.["date-parts"]?.[0]?.[0] || "n.d.";
      const title = normalized.title || "Untitled";
      
      if (format === "in-text") {
        const firstAuthor = authors[0];
        const authorName = firstAuthor.family || firstAuthor.given || "Unknown";
        return `(${authorName}, ${year})`;
      } else {
        // Full citation format
        const authorList = authors.map(a => 
          `${a.family || "Unknown"}, ${a.given || ""}`.trim()
        ).join(", ");
        return `${authorList} (${year}). ${title}.`;
      }
    } catch (error) {
      console.error("Fallback formatting failed:", error);
      return "[Citation Error]";
    }
  };

  // Enhanced formatCitationCiteproc function with better error handling
  const formatCitationCiteproc = (citation, styleName = "apa", format = "in-text") => {
    try {
      // Validate and normalize citation
      if (!citation || typeof citation !== 'object') {
        console.error("Invalid citation object:", citation);
        return formatCitationFallback(citation, format);
      }

      // Ensure citation has required fields
      const normalizedCitation = normalizeCitation(citation);
      
      if (!normalizedCitation || !normalizedCitation.id) {
        console.error("Citation missing ID:", normalizedCitation);
        return formatCitationFallback(citation, format);
      }

      // Create system object for citeproc
      const sys = {
        retrieveLocale: () => {
          try {
            return enLocale || fallbackLocale;
          } catch (error) {
            console.warn("Failed to load locale, using fallback");
            return fallbackLocale;
          }
        },
        retrieveItem: (id) => {
          if (id === normalizedCitation.id) {
            return normalizedCitation;
          }
          // Try to find in citations array
          const found = citations.find(c => String(c.id) === String(id));
          if (found) {
            return normalizeCitation(found);
          }
          // Return fallback item
          return {
            id: String(id),
            type: "article-journal",
            author: [{ given: "Unknown", family: "Author" }],
            title: "Untitled",
            issued: { "date-parts": [[2025]] }
          };
        },
      };

      // Get CSL style
      const styleXML = getCSLStyle(styleName);
      
      // Initialize CSL engine with error handling
      let citeproc;
      try {
        citeproc = new CSL.Engine(sys, styleXML, "en-US");
      } catch (engineError) {
        console.error("CSL Engine initialization failed:", engineError);
        return formatCitationFallback(normalizedCitation, format);
      }

      // Update items and format citation
      try {
        citeproc.updateItems([normalizedCitation.id]);
        
        let result;
        if (format === "in-text") {
          result = citeproc.makeCitationCluster([{ id: normalizedCitation.id }]);
        } else {
          result = citeproc.makeCitationCluster([{ 
            id: normalizedCitation.id, 
            locator: "footnote" 
          }]);
        }
        
        // Extract formatted text from result
        if (result && result[0] && result[0][1]) {
          return result[0][1];
        } else if (result && typeof result === 'string') {
          return result;
        } else {
          console.warn("Unexpected result format:", result);
          return formatCitationFallback(normalizedCitation, format);
        }
      } catch (formatError) {
        console.error("Citation formatting failed:", formatError);
        return formatCitationFallback(normalizedCitation, format);
      }
    } catch (error) {
      console.error("formatCitationCiteproc error:", error);
      return formatCitationFallback(citation, format);
    }
  };

  // Enhanced bibliography formatting with fallback
  const formatBibliographyCiteproc = (citationsArr, styleName = "apa") => {
    try {
      if (!citationsArr || citationsArr.length === 0) {
        return "";
      }

      // Normalize all citations
      const normalizedCitations = citationsArr.map(c => normalizeCitation(c)).filter(c => c);
      
      if (normalizedCitations.length === 0) {
        return "";
      }

      const sys = {
        retrieveLocale: () => enLocale || fallbackLocale,
        retrieveItem: (id) => normalizedCitations.find((c) => String(c.id) === String(id)),
      };

      const styleXML = getCSLStyle(styleName);
      
      let citeproc;
      try {
        citeproc = new CSL.Engine(sys, styleXML, "en-US");
      } catch (error) {
        console.error("Bibliography CSL Engine failed:", error);
        // Fallback to simple bibliography
        return normalizedCitations.map(c => formatCitationFallback(c, "full")).join("\n\n");
      }

      const ids = normalizedCitations.map((c) => c.id);
      citeproc.updateItems(ids);
      
      const bibResult = citeproc.makeBibliography();
      if (bibResult && bibResult[1]) {
        return bibResult[1].join("\n");
      } else {
        // Fallback bibliography
        return normalizedCitations.map(c => formatCitationFallback(c, "full")).join("\n\n");
      }
    } catch (error) {
      console.error("Bibliography formatting failed:", error);
      return citationsArr.map(c => formatCitationFallback(c, "full")).join("\n\n");
    }
  };

  const fileInputRef = useRef(null);
  const [token, setToken] = useState("");
  
  const citationStyles = [
    { value: "apa", label: "APA (American Psychological Association)" },
    { value: "ieee", label: "IEEE" },
    { value: "harvard", label: "Harvard" },
    { value: "vancouver", label: "Vancouver" },
    { value: "nature", label: "Nature" },
    { value: "science", label: "Science" },
  ];

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

  // Fetch user files on component mount
  React.useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetchUserFilesDocs();
        if (response?.data) {
          // Normalize the fetched data
          const normalizedFiles = response.data.map(file => normalizeCitation(file));
          setSearchResults(normalizedFiles);
        }
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
        // Normalize saved citations
        const normalizedSaved = parsed.map(c => normalizeCitation(c)).filter(c => c);
        setCitations(normalizedSaved);
        setRecentCitations(normalizedSaved.slice(-5));
      }
    } catch (e) {
      console.error("Load citations failed:", e);
    }
  };

  const saveCitations = (updated) => {
    try {
      localStorage.setItem("researchCollab_citations", JSON.stringify(updated));
      setRecentCitations(updated.slice(-5));
    } catch (e) {
      console.error("Save citations failed:", e);
    }
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

  const searchCrossref = async (query) => {
    try {
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
    } catch (error) {
      console.error("Crossref search failed:", error);
      return [];
    }
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
    try {
      const normalized = normalizeCitation(citation);
      if (!normalized) {
        setStatus("Failed to add citation - invalid data");
        return;
      }

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
    } catch (error) {
      console.error("Add citation failed:", error);
      setStatus("Failed to add citation");
    }
  };

  // Enhanced insertCitation function
  const insertCitation = async (citation) => {
    if (!isOfficeReady) {
      console.log("Run this in Microsoft Word");
      return;
    }

    try {
      // Ensure citation is properly formatted
      const normalizedCitation = normalizeCitation(citation);
      if (!normalizedCitation) {
        setStatus("Failed to normalize citation");
        return;
      }
      
      const formatted = formatCitationCiteproc(
        normalizedCitation,
        citationStyle,
        citationFormat
      );
      
      console.log("Citation formatting result:", {
        original: citation,
        normalized: normalizedCitation,
        formatted: formatted,
        style: citationStyle,
        format: citationFormat
      });

      if (!formatted || formatted.includes("[") && formatted.includes("Error")) {
        console.error("Citation formatting failed, trying fallback");
        const fallbackFormatted = formatCitationFallback(normalizedCitation, citationFormat);
        if (fallbackFormatted && !fallbackFormatted.includes("Error")) {
          formatted = fallbackFormatted;
          setStatus("Citation inserted with fallback formatting");
        } else {
          setStatus("Citation formatting failed completely");
          return;
        }
      }

      // Insert into Word
      await Word.run(async (context) => {
        const selection = context.document.getSelection();
        if (citationFormat === "in-text") {
          selection.insertText(formatted, Word.InsertLocation.replace);
        } else {
          selection.insertFootnote(formatted);
        }
        await context.sync();
      });

      // Update citation library
      const updated = citations.map((c) =>
        String(c.id) === String(normalizedCitation.id)
          ? {
              ...c,
              used: true,
              inTextCitations: [...(c.inTextCitations || []), formatted],
            }
          : c
      );
      setCitations(updated);
      saveCitations(updated);
      setStatus("Citation inserted successfully");
    } catch (error) {
      console.error("Insert citation failed:", error);
      setStatus(`Insert failed: ${error.message}`);
    }
  };

  const generateBibliography = async () => {
    if (!isOfficeReady) {
      console.log("Run this in Word");
      return;
    }

    const used = citations.filter((c) => c.used);
    if (used.length === 0) {
      setStatus("No citations used");
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
      setStatus("Nothing to export");
      return;
    }

    try {
      // Simple BibTeX export fallback
      const bibtexEntries = citations.map(citation => {
        const normalized = normalizeCitation(citation);
        const year = normalized.issued?.["date-parts"]?.[0]?.[0] || "2025";
        const authors = normalized.author?.map(a => `${a.family || "Unknown"}, ${a.given || ""}`).join(" and ") || "Unknown";
        
        return `@article{${normalized.id},
  author = {${authors}},
  title = {${normalized.title || "Untitled"}},
  year = {${year}},
  journal = {${normalized["container-title"] || ""}},
  volume = {${normalized.volume || ""}},
  issue = {${normalized.issue || ""}},
  doi = {${normalized.DOI || ""}},
  url = {${normalized.URL || ""}}
}`;
      });

      const bibtex = bibtexEntries.join("\n\n");
      const blob = new Blob([bibtex], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `citations_${Date.now()}.bib`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Citations exported");
    } catch (error) {
      console.error("Export failed:", error);
      setStatus("Export failed");
    }
  };

  const handleImportCitations = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target.result;
        let parsed = [];

        // Try to parse as JSON first
        try {
          parsed = JSON.parse(content);
        } catch {
          // If JSON parsing fails, try simple BibTeX parsing
          setStatus("BibTeX import not fully supported, please use JSON format");
          return;
        }

        if (!Array.isArray(parsed)) {
          parsed = [parsed];
        }

        const newCitations = parsed.map((entry, idx) => {
          const normalized = normalizeCitation(entry);
          return {
            ...normalized,
            id: normalized.id || `import_${Date.now()}_${idx}`,
            used: false,
            source: "imported",
            addedDate: new Date().toISOString(),
          };
        }).filter(c => c);

        const updated = [...citations, ...newCitations];
        setCitations(updated);
        saveCitations(updated);
        setStatus(`${newCitations.length} citations imported`);
      } catch (err) {
        console.error("Import error:", err);
        setStatus("Import failed");
      }
    };
    reader.readAsText(file);
  };

  const getCitationTitle = (c) => {
    const normalized = normalizeCitation(c);
    return normalized?.title || "Untitled";
  };

  const getCitationAuthors = (c) => {
    const normalized = normalizeCitation(c);
    return normalized?.author
      ?.map((a) => `${a.given || ""} ${a.family || ""}`.trim())
      .join(", ") || "Unknown";
  };

  const removeCitationFromLibrary = (id) => {
    const updated = citations.filter((c) => String(c.id) !== String(id));
    setCitations(updated);
    saveCitations(updated);
    setStatus("Citation removed from library");
  };

  const formatCitationPreview = (citation) => {
    const normalized = normalizeCitation(citation);
    if (!normalized) return "Invalid Citation";

    const title = normalized.title || "Untitled";
    const year = normalized.issued?.["date-parts"]?.[0]?.[0] || "";
    return `${title}${year ? " (" + year + ")" : ""}`;
  };

  // Function to fix existing citations in library
  const fixExistingCitations = () => {
    const updatedCitations = citations.map(citation => {
      const normalized = normalizeCitation(citation);
      return normalized;
    }).filter(c => c);
    
    setCitations(updatedCitations);
    saveCitations(updatedCitations);
    setStatus("Citations library updated");
  };

  const mockPDFs = [
    {
      id: 1,
      title: "Climate Change Research 2024",
      content: `This study examines the latest developments in climate science...`,
    },
  ];

  const handlePDFClick = (pdf) => {
    if (!isOfficeReady) {
      console.log("Use this in Word");
      return;
    }

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

        {/* Debug button to fix existing citations */}
        <button 
          onClick={fixExistingCitations}
          style={{
            margin: "10px 0",
            padding: "5px 10px",
            backgroundColor: "#007acc",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer"
          }}
        >
          Fix Existing Citations
        </button>

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
