import React, { useState, useEffect, useRef } from "react";
import Cite from "citation-js";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-ris";
import CitationSearch from "./CitationSearch";
import CitationLibrary from "./CitationLibrary";
import CitationSettings from "./CitationSettings";
import BibliographySection from "./BibliographySection";
import ResearchDocuments from "./ResearchDocuments";
import { fetchUserFilesDocs } from "../api";

const CitationManager = ({ setShowLoginPopup }) => {
  // State management
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [status, setStatus] = useState("Loading...");
  const [token, setToken] = useState("");
  
  // Citation state
  const [citationStyle, setCitationStyle] = useState("apa");
  const [citations, setCitations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [citationFormat, setCitationFormat] = useState("in-text");
  const [bibliographyTitle, setBibliographyTitle] = useState("References");
  const [fetchPaperLoader, setFetchPaperLoader] = useState(false);

  const fileInputRef = useRef(null);

  // Available citation styles - much simpler with citation-js
  const citationStyles = [
    { value: "apa", label: "APA (American Psychological Association)" },
    { value: "harvard1", label: "Harvard" },
    { value: "vancouver", label: "Vancouver" },
    { value: "chicago-author-date", label: "Chicago Author-Date" },
    { value: "ieee", label: "IEEE" },
    { value: "mla", label: "MLA (Modern Language Association)" },
    { value: "nature", label: "Nature" },
    { value: "science", label: "Science" },
  ];

  // Mock PDFs for research documents
  const mockPDFs = [
    {
      id: 1,
      title: "Climate Change Research 2024",
      content: "This study examines the latest developments in climate science...",
    },
  ];

  // Initialize Office and load citations
  useEffect(() => {
    const urlToken = getTokenFromUrl();
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      setToken(urlToken);
    } else {
      const stored = localStorage.getItem("token");
      if (stored) setToken(stored);
    }

    // Initialize Office
    if (typeof Office !== "undefined" && typeof Office.onReady === "function") {
      Office.onReady((info) => {
        if (info.host === Office.HostType.Word) {
          setIsOfficeReady(true);
          setStatus("ResearchCollab Add-in Ready");
        } else {
          setStatus("Please run this add-in in Microsoft Word");
        }
        loadSavedCitations();
      });
    } else {
      setStatus("Office.js not loaded - Demo mode active");
      loadSavedCitations();
    }

    // Fetch user files
    fetchFiles();
  }, []);

  // Helper functions
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  };

  const fetchFiles = async () => {
    try {
      setFetchPaperLoader(true);
      const response = await fetchUserFilesDocs();
      if (response?.data) {
        const normalizedFiles = response.data.map(normalizeCitation);
        setSearchResults(normalizedFiles);
      }
    } catch (error) {
      console.error("Fetch files error:", error);
    } finally {
      setFetchPaperLoader(false);
    }
  };

  const loadSavedCitations = () => {
    try {
      const saved = localStorage.getItem("researchCollab_citations");
      if (saved) {
        const parsed = JSON.parse(saved);
        setCitations(parsed);
      }
    } catch (error) {
      console.error("Load citations failed:", error);
    }
  };

  const saveCitations = (updated) => {
    try {
      localStorage.setItem("researchCollab_citations", JSON.stringify(updated));
    } catch (error) {
      console.error("Save citations failed:", error);
    }
  };

  // Enhanced citation normalization - much simpler
  const normalizeCitation = (raw) => {
    if (!raw) return null;

    // Handle different data formats
    const normalized = {
      id: raw.id || `citation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: raw.type || "article-journal",
      title: Array.isArray(raw.title) ? raw.title[0] : raw.title || "Untitled",
      author: normalizeAuthors(raw),
      issued: normalizeDate(raw),
      DOI: raw.DOI || raw.doi || "",
      URL: raw.URL || raw.url || raw.straico_file_url || raw.file_link || "",
      "container-title": raw["container-title"] || raw.journal || raw.publication || "",
      volume: raw.volume || "",
      issue: raw.issue || "",
      page: raw.page || raw.pages || "",
      publisher: raw.publisher || raw.institution || "",
      abstract: raw.abstract || "",
      // Keep original data
      ...raw,
      // Add metadata
      addedDate: raw.addedDate || new Date().toISOString(),
      used: raw.used || false,
      inTextCitations: raw.inTextCitations || [],
    };

    return normalized;
  };

  const normalizeAuthors = (raw) => {
    const pdfAuthors = raw.pdf_metadata?.Authors || raw.pdf_search_data?.Authors || raw.author;
    
    if (!pdfAuthors) return [{ given: "Unknown", family: "Author" }];
    
    if (Array.isArray(pdfAuthors)) {
      return pdfAuthors.map(author => ({
        given: author.given || "Unknown",
        family: author.family || "Author",
      }));
    }
    
    if (typeof pdfAuthors === "string") {
      const authorNames = pdfAuthors.split(",").map(name => name.trim());
      return authorNames.map(name => {
        const nameParts = name.split(" ");
        return {
          given: nameParts.slice(0, -1).join(" ") || "Unknown",
          family: nameParts[nameParts.length - 1] || "Author",
        };
      });
    }
    
    return [{ given: "Unknown", family: "Author" }];
  };

  const normalizeDate = (raw) => {
    const year = raw.pdf_metadata?.PublicationYear || 
                 raw.pdf_search_data?.PublicationDate || 
                 raw.year || 
                 raw.issued?.["date-parts"]?.[0]?.[0] ||
                 "2025";
    
    const yearNum = typeof year === "string" 
      ? parseInt(year.match(/\d{4}/)?.[0] || "2025")
      : parseInt(year);
    
    return { "date-parts": [[yearNum]] };
  };

  // Citation search functions
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

      setSearchResults(results.map(normalizeCitation));
      setStatus(results.length > 0 ? `Found ${results.length} results` : "No results found");
    } catch (error) {
      console.error("Search error:", error);
      setStatus("Search error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  const searchCrossref = async (query) => {
    try {
      const response = await fetch(
        `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=10`
      );
      const data = await response.json();
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
      const response = await fetch(`https://api.crossref.org/works/${match[0]}`);
      const data = await response.json();
      return {
        ...data.message,
        source: "doi",
        id: data.message.DOI,
      };
    } catch (error) {
      console.error("DOI search failed:", error);
      return null;
    }
  };

  // Citation management functions
  const addCitationToLibrary = (citation) => {
    try {
      const normalized = normalizeCitation(citation);
      if (!normalized) {
        setStatus("Failed to add citation - invalid data");
        return;
      }

      const updated = [...citations, normalized];
      setCitations(updated);
      saveCitations(updated);
      setStatus("Citation added to library");
    } catch (error) {
      console.error("Add citation failed:", error);
      setStatus("Failed to add citation");
    }
  };

  // IMPROVED: Citation formatting using citation-js (much more reliable)
  const insertCitation = async (citation) => {
    if (!isOfficeReady) {
      alert("Please run this add-in in Microsoft Word");
      return;
    }

    try {
      const normalized = normalizeCitation(citation);
      if (!normalized) {
        setStatus("Failed to process citation");
        return;
      }

      // Use citation-js for formatting - much more reliable than citeproc
      const cite = new Cite(normalized);
      
      let formatted;
      try {
        if (citationFormat === "footnote") {
          formatted = cite.format("citation", {
            format: "text",
            type: "string",
            style: "cite-" + citationStyle,
          });
        } else {
          formatted = cite.format("citation", {
            format: "text",
            type: "string",
            style: "cite-" + citationStyle,
            entry: ["author", "issued"]
          });
        }
      } catch (styleError) {
        // Fallback to basic APA format
        console.warn("Style formatting failed, using fallback:", styleError);
        formatted = formatCitationFallback(normalized, citationFormat);
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
        String(c.id) === String(normalized.id)
          ? {
              ...c,
              used: true,
              inTextCitations: [...(c.inTextCitations || []), formatted],
            }
          : c
      );
      setCitations(updated);
      saveCitations(updated);
      setStatus(`Citation inserted successfully with ${citationStyle.toUpperCase()} style`);

    } catch (error) {
      console.error("Insert citation failed:", error);
      setStatus(`Insert failed: ${error.message}`);
    }
  };

  // Fallback formatting function (much simpler)
  const formatCitationFallback = (citation, format = "in-text") => {
    const authors = citation.author || [{ given: "Unknown", family: "Author" }];
    const year = citation.issued?.["date-parts"]?.[0]?.[0] || "n.d.";
    const title = citation.title || "Untitled";
    
    if (format === "in-text") {
      const firstAuthor = authors[0];
      const authorName = firstAuthor.family || firstAuthor.given || "Unknown";
      return `(${authorName}, ${year})`;
    } else {
      // Full citation
      const authorList = authors.length === 1 
        ? `${authors[0].family}, ${authors[0].given?.[0] || ""}.`
        : `${authors[0].family}, ${authors[0].given?.[0] || ""}., et al.`;
      
      let result = `${authorList} (${year}). ${title}.`;
      
      if (citation["container-title"]) {
        result += ` *${citation["container-title"]}*`;
        if (citation.volume) result += `, ${citation.volume}`;
        if (citation.issue) result += `(${citation.issue})`;
        if (citation.page) result += `, ${citation.page}`;
      }
      
      if (citation.DOI) {
        result += ` https://doi.org/${citation.DOI}`;
      } else if (citation.URL) {
        result += ` Retrieved from ${citation.URL}`;
      }
      
      return result;
    }
  };

  // IMPROVED: Bibliography generation using citation-js
  const generateBibliography = async () => {
    if (!isOfficeReady) {
      alert("Please run this add-in in Microsoft Word");
      return;
    }

    const usedCitations = citations.filter((c) => c.used);
    if (usedCitations.length === 0) {
      alert("No citations have been used yet. Insert some citations first.");
      return;
    }

    try {
      setStatus("Generating bibliography...");
      
      // Use citation-js for bibliography generation
      const cite = new Cite(usedCitations);
      
      let bibliography;
      try {
        bibliography = cite.format("bibliography", {
          format: "text",
          type: "string",
          style: "cite-" + citationStyle,
        });
      } catch (styleError) {
        console.warn("Style formatting failed, using fallback:", styleError);
        // Fallback to manual formatting
        bibliography = usedCitations
          .map(c => formatCitationFallback(c, "full"))
          .join("\n\n");
      }

      // Insert into Word
      await Word.run(async (context) => {
        const body = context.document.body;
        
        // Add page break
        body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);
        
        // Insert bibliography title
        const title = body.insertParagraph(bibliographyTitle, Word.InsertLocation.end);
        title.style = "Heading 1";
        title.font.bold = true;
        title.font.size = 16;
        
        // Insert bibliography content
        const content = body.insertParagraph(bibliography, Word.InsertLocation.end);
        content.font.name = "Times New Roman";
        content.font.size = 12;
        content.leftIndent = 36; // Hanging indent
        content.firstLineIndent = -36;
        
        await context.sync();
      });

      setStatus(`Bibliography inserted successfully with ${usedCitations.length} citations`);
    } catch (error) {
      console.error("Bibliography generation failed:", error);
      setStatus(`Bibliography generation failed: ${error.message}`);
    }
  };

  // Export functions
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
      a.download = `citations_${Date.now()}.bib`;
      a.click();
      URL.revokeObjectURL(url);
      
      setStatus("Citations exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      setStatus("Export failed");
    }
  };

  const handleImportCitations = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const cite = new Cite(content);
        const imported = cite.data;
        
        const newCitations = imported.map((entry, idx) => ({
          ...normalizeCitation(entry),
          id: entry.id || `import_${Date.now()}_${idx}`,
          source: "imported",
        }));
        
        const updated = [...citations, ...newCitations];
        setCitations(updated);
        saveCitations(updated);
        setStatus(`Imported ${newCitations.length} citations successfully`);
      } catch (error) {
        console.error("Import failed:", error);
        setStatus("Import failed - please check file format");
      }
    };
    
    reader.readAsText(file);
  };

  // Helper functions for UI
  const getCitationTitle = (citation) => {
    return Array.isArray(citation.title) ? citation.title[0] : citation.title || "Untitled";
  };

  const getCitationAuthors = (citation) => {
    return citation.author
      ?.map((a) => `${a.given || ""} ${a.family || ""}`.trim())
      .join(", ") || "Unknown Authors";
  };

  const formatCitationPreview = (citation) => {
    try {
      const cite = new Cite(citation);
      return cite.format("citation", {
        format: "text",
        type: "string",
        style: "cite-" + citationStyle,
      });
    } catch (error) {
      return formatCitationFallback(citation, "in-text");
    }
  };

  const removeCitationFromLibrary = (id) => {
    const updated = citations.filter((c) => c.id !== id);
    setCitations(updated);
    saveCitations(updated);
    setStatus("Citation removed from library");
  };

  const handlePDFClick = (pdf) => {
    if (!isOfficeReady) {
      alert("Please run this add-in in Microsoft Word");
      return;
    }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-emerald-50 to-amber-50 flex flex-col items-center py-8 px-2">
      <header className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center border border-emerald-100">
        <h1 className="text-4xl font-extrabold text-emerald-700 flex items-center gap-2 mb-1 tracking-tight drop-shadow">
          📚 ResearchCollab
        </h1>
        <p className="text-amber-700 mb-4 text-center text-lg font-medium">
          Professional Citation Management for Microsoft Word
        </p>
        
        <div className="flex items-center gap-2 mb-6">
          <span
            className={`inline-block w-3 h-3 rounded-full border-2 ${ 
              isOfficeReady ? "bg-emerald-400 border-emerald-600" : "bg-rose-400 border-rose-600"
            }`}
            aria-label={isOfficeReady ? "Connected to Word" : "Not connected"}
          />
          <span className="text-sm text-emerald-900 font-semibold tracking-wide">{status}</span>
        </div>

        <div className="w-full space-y-6">
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
            formatCitationPreview={formatCitationPreview}
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
        </div>
      </header>
    </div>
  );
};

export default CitationManager;
