import CitationSearch from "../components/CitationSearch";
import CitationLibrary from "../components/CitationLibrary";
import CitationSettings from "../components/CitationSettings";
import BibliographySection from "../components/BibliographySection";
import ResearchDocuments from "../components/ResearchDocuments";
import OfficeWarning from "../components/OfficeWarning";
import CSL from "citeproc";
import apaStyle from "../csl-locales/apa.csl";
import mlaStyle from "../csl-locales/mla.csl";
import ieeeStyle from "../csl-styes/ieee.csl";
import harvardStyle from "../csl-styes/harvard-limerick.csl";
import vancouverStyle from "../csl-styes/vancouver.csl";
import natureStyle from "../csl-styes/nature.csl";
import scienceStyle from "../csl-styes/science.csl";
import chicagoStyle from "../csl-styes/chicago-author-date.csl";
import enLocale from "../csl-styes/localesen-US.xml";
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
      // Fallback author for missing data
      authors = [{ given: "No", family: "Author" }];
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
        case "mla":
          return mlaStyle || fallbackAPA;
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
        case "chicago":
          return chicagoStyle || fallbackAPA;
        default:
          return fallbackAPA;
      }
    } catch (error) {
      console.warn(`Failed to load style ${styleName}, using fallback`, error);
      return fallbackAPA;
    }
  };

  // If the CSL files are not loading as text, try importing them differently
  // You might need to fetch them or handle them as raw text
  const loadCSLStyle = async (styleName) => {
    try {
      let stylePath = '';
      switch (styleName) {
        case 'apa':
          stylePath = '/src/csl-locales/apa.csl';
          break;
        case 'mla':
          stylePath = '/src/csl-locales/mla.csl';
          break;
        case 'ieee':
          stylePath = '/src/csl-styes/ieee.csl';
          break;
        case 'harvard':
          stylePath = '/src/csl-styes/harvard-limerick.csl';
          break;
        case 'vancouver':
          stylePath = '/src/csl-styes/vancouver.csl';
          break;
        case 'chicago':
          stylePath = '/src/csl-styes/chicago-author-date.csl';
          break;
        case 'nature':
          stylePath = '/src/csl-styes/nature.csl';
          break;
        case 'science':
          stylePath = '/src/csl-styes/science.csl';
          break;
        default:
          return fallbackAPA;
      }
      
      const response = await fetch(stylePath);
      if (response.ok) {
        return await response.text();
      } else {
        console.warn(`Failed to load style ${styleName}`);
        return fallbackAPA;
      }
    } catch (error) {
      console.error(`Error loading style ${styleName}:`, error);
      return fallbackAPA;
    }
  };

  // Enhanced CSL style loading with multiple fallback methods
  const getCSLStyleWithFallbacks = async (styleName) => {
    try {
      // Method 1: Try imported styles first
      let style = getCSLStyle(styleName);
      if (style && style !== fallbackAPA) {
        console.log(`Loaded ${styleName} via import`);
        return style;
      }

      // Method 2: Try async loading
      style = await loadCSLStyle(styleName);
      if (style && style !== fallbackAPA) {
        console.log(`Loaded ${styleName} via fetch`);
        return style;
      }

      // Method 3: Use fallback
      console.warn(`Using fallback APA for ${styleName}`);
      return fallbackAPA;
    } catch (error) {
      console.error(`All loading methods failed for ${styleName}:`, error);
      return fallbackAPA;
    }
  };

  // Enhanced fallback formatting function with style-specific formatting
  const formatCitationFallback = (citation, format = "in-text") => {
    try {
      const normalized = normalizeCitation(citation);
      if (!normalized) return "[Invalid Citation]";

      const authors = normalized.author || [{ given: "Unknown", family: "Author" }];
      const year = normalized.issued?.["date-parts"]?.[0]?.[0] || "n.d.";
      const title = normalized.title || "Untitled";
      const journal = normalized["container-title"] || "";
      const volume = normalized.volume || "";
      const issue = normalized.issue || "";
      const pages = normalized.page || "";
      
      if (format === "in-text") {
        const firstAuthor = authors[0];
        const authorName = firstAuthor.family || firstAuthor.given || "Unknown";
        
        // Different styles for in-text citations
        switch (citationStyle) {
          case "ieee":
            return `[${Math.floor(Math.random() * 100) + 1}]`; // IEEE uses numbers
          case "vancouver":
            return `(${Math.floor(Math.random() * 100) + 1})`;
          case "nature":
            return `${Math.floor(Math.random() * 100) + 1}`;
          case "mla":
            return `(${authorName})`;
          default: // APA, Harvard, Chicago, Science
            return `(${authorName}, ${year})`;
        }
      } else {
        // Full citation format for bibliography with proper formatting
        const authorList = authors.map(a => 
          `${a.family || "Unknown"}, ${a.given || ""}`.trim()
        ).join(", ");
        
        const styleFont = getCitationStyleFont(citationStyle);
        
        switch (citationStyle) {
          case "mla":
            // MLA: Author. "Title." *Journal*, Year.
            return `${authorList}. "${title}." ${journal ? `*${journal}*, ` : ""}${year}.`;
          case "ieee":
            // IEEE: Author, "Title," *Journal*, Year.
            return `${authorList}, "${title}," ${journal ? `*${journal}*, ` : ""}${year}.`;
          case "nature":
            // Nature: Author Title. *Journal* **volume**, pages (year).
            return `${authorList} ${title}. ${journal ? `*${journal}* ` : ""}${volume ? `**${volume}**` : ""}${pages ? `, ${pages}` : ""} (${year}).`;
          case "science":
            // Science: Author, Title. *Journal* **volume**, pages (year).
            return `${authorList}, ${title}. ${journal ? `*${journal}* ` : ""}${volume ? `**${volume}**` : ""}${pages ? `, ${pages}` : ""} (${year}).`;
          case "vancouver":
            // Vancouver: Author. Title. Journal. Year;volume(issue):pages.
            return `${authorList}. ${title}. ${journal ? `${journal}. ` : ""}${year}${volume ? `;${volume}` : ""}${issue ? `(${issue})` : ""}${pages ? `:${pages}` : ""}.`;
          case "chicago":
            // Chicago: Author. "Title." *Journal* volume, no. issue (Year): pages.
            return `${authorList}. "${title}." ${journal ? `*${journal}* ` : ""}${volume ? `${volume}` : ""}${issue ? `, no. ${issue}` : ""} (${year})${pages ? `: ${pages}` : ""}.`;
          default: // APA, Harvard
            // APA: Author (Year). Title. *Journal*, volume(issue), pages.
            return `${authorList} (${year}). ${title}. ${journal ? `*${journal}*` : ""}${volume ? `, ${volume}` : ""}${issue ? `(${issue})` : ""}${pages ? `, ${pages}` : ""}.`;
        }
      }
    } catch (error) {
      console.error("Fallback formatting failed:", error);
      return "[Citation Error]";
    }
  };

  // Enhanced formatCitationCiteproc function with better error handling
  const formatCitationCiteproc = async (citation, styleName = "apa", format = "in-text") => {
    try {
      console.log(`Formatting citation with style: ${styleName}, format: ${format}`);
      
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

      // Get CSL style with validation
      const styleXML = await getCSLStyleWithFallbacks(styleName);
      console.log(`Using style XML for ${styleName}:`, styleXML ? "Loaded" : "Not loaded");
      
      if (!styleXML || styleXML === fallbackAPA) {
        console.warn(`Style ${styleName} not available, using fallback`);
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
          if (String(id) === String(normalizedCitation.id)) {
            return normalizedCitation;
          }
          // Try to find in citations array
          const found = citations.find(c => String(c.id) === String(id));
          if (found) {
            return normalizeCitation(found);
          }
          // Return the current citation as fallback
          return normalizedCitation;
        },
      };

      // Initialize CSL engine with error handling
      let citeproc;
      try {
        citeproc = new CSL.Engine(sys, styleXML, "en-US");
        console.log("CSL Engine initialized successfully");
      } catch (engineError) {
        console.error("CSL Engine initialization failed:", engineError);
        return formatCitationFallback(normalizedCitation, format);
      }

      // Update items and format citation
      try {
        citeproc.updateItems([normalizedCitation.id]);
        
        let result;
        if (format === "footnote") {
          // For footnotes, create a citation cluster
          result = citeproc.makeCitationCluster([{ 
            id: normalizedCitation.id,
            locator: "",
            label: ""
          }]);
        } else {
          // For in-text citations
          result = citeproc.makeCitationCluster([{ 
            id: normalizedCitation.id 
          }]);
        }
        
        console.log("Citation formatting result:", result);
        
        // Extract formatted text from result
        if (result && result[0] && result[0][1]) {
          const formattedText = result[0][1];
          // Clean up any HTML tags that might remain
          return formattedText.replace(/<[^>]+>/g, '');
        } else if (result && typeof result === 'string') {
          return result.replace(/<[^>]+>/g, '');
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
  const formatBibliographyCiteproc = async (citationsArr, styleName = "apa") => {
    try {
      if (!citationsArr || citationsArr.length === 0) {
        return "";
      }

      // Normalize all citations
      const normalizedCitations = citationsArr.map(c => normalizeCitation(c)).filter(c => c);
      if (normalizedCitations.length === 0) {
        return "";
      }

      console.log(`Generating bibliography with style: ${styleName}`);

      const sys = {
        retrieveLocale: () => enLocale || fallbackLocale,
        retrieveItem: (id) => normalizedCitations.find((c) => String(c.id) === String(id)),
      };

      // Load the CSL style
      const styleXML = await getCSLStyleWithFallbacks(styleName);
      
      let citeproc;
      try {
        citeproc = new CSL.Engine(sys, styleXML, "en-US");
        console.log("Bibliography CSL Engine initialized successfully");
      } catch (error) {
        console.error("Bibliography CSL Engine failed:", error);
        // Fallback to simple bibliography
        return normalizedCitations.map(c => formatCitationFallback(c, "full")).join("\n\n");
      }

      const ids = normalizedCitations.map((c) => c.id);
      citeproc.updateItems(ids);
      const bibResult = citeproc.makeBibliography();
      
      if (bibResult && bibResult[1]) {
        // Clean up HTML tags and format properly
        const cleanEntry = (html) => {
          // Replace <i>...</i> with *...*
          let text = html.replace(/<i>(.*?)<\/i>/gi, '*$1*');
          // Remove all other HTML tags
          text = text.replace(/<[^>]+>/g, "");
          // Replace multiple spaces/newlines with single space
          text = text.replace(/\s+/g, " ").trim();
          return text;
        };
        return bibResult[1].map(cleanEntry).join("\n");
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
  
  // Citation styles available for selection in the UI
  // These styles are loaded from CSL files and used by citeproc
  const citationStyles = [
    { value: "apa", label: "APA (American Psychological Association)" },
    { value: "mla", label: "MLA (Modern Language Association)" },
    { value: "ieee", label: "IEEE" },
    { value: "harvard", label: "Harvard" },
    { value: "vancouver", label: "Vancouver" },
    { value: "chicago", label: "Chicago Author-Date" },
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

  // Enhanced insertCitation function with proper formatting
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
      
      let formatted = await formatCitationCiteproc(
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

      // Insert into Word with proper formatting
      await Word.run(async (context) => {
        const selection = context.document.getSelection();
        const styleFont = getCitationStyleFont(citationStyle);
        
        if (citationFormat === "in-text") {
          // For in-text citations, apply formatting based on style
          if (formatted.includes('*') || formatted.includes('**') || formatted.includes('___')) {
            // Create a paragraph to handle formatting
            const tempPara = selection.insertParagraph("", Word.InsertLocation.replace);
            await parseAndFormatText(tempPara, formatted, citationStyle);
          } else {
            // Simple text insertion with font styling
            const range = selection.insertText(formatted, Word.InsertLocation.replace);
            range.font.name = styleFont.family;
            range.font.size = styleFont.size;
          }
        } else {
          // For footnotes, create formatted footnote
          const footnote = selection.insertFootnote(formatted);
          footnote.body.font.name = styleFont.family;
          footnote.body.font.size = styleFont.size - 1; // Footnotes typically smaller
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
      setStatus(`Citation inserted successfully with ${citationStyle.toUpperCase()} style and proper formatting`);
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
      const bibRaw = await formatBibliographyCiteproc(used, citationStyle);
      const styleFont = getCitationStyleFont(citationStyle);
      
      await Word.run(async (context) => {
        const body = context.document.body;
        body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);
        
        // Insert bibliography title
        const title = body.insertParagraph(bibliographyTitle, Word.InsertLocation.end);
        title.style = "Heading 1";
        title.font.bold = true;
        title.font.size = 16;
        title.font.name = styleFont.family;
        
        // Process bibliography entries with proper formatting
        if (bibRaw.includes('*')) {
          const bibEntries = bibRaw.split("\n");
          for (let entry of bibEntries) {
            if (entry.trim()) {
              let para = body.insertParagraph("", Word.InsertLocation.end);
              para.font.name = styleFont.family;
              para.font.size = styleFont.size;
              para.leftIndent = 36;
              para.firstLineIndent = -36;
              
              // Parse and apply formatting for italics, bold, etc.
              await parseAndFormatText(para, entry, citationStyle);
            }
          }
        } else {
          // Fallback for entries without special formatting
          const content = body.insertParagraph(bibRaw, Word.InsertLocation.end);
          content.font.name = styleFont.family;
          content.font.size = styleFont.size;
          content.leftIndent = 36;
          content.firstLineIndent = -36;
        }
        
        await context.sync();
      });
      
      setBibliography(bibRaw);
      setStatus(`Bibliography inserted with ${citationStyle.toUpperCase()} style using ${styleFont.family} font with proper formatting`);
    } catch (e) {
      console.error("Bibliography error:", e);
      setStatus("Error generating bibliography");
    }
  };

  // Enhanced function to parse and format text with multiple formatting types
  const parseAndFormatText = async (paragraph, text, citationStyle) => {
    try {
      const formatPatterns = [
        { pattern: /\*(.*?)\*/g, type: "italic" },      // *text* for italic
        { pattern: /\*\*(.*?)\*\*/g, type: "bold" },    // **text** for bold
        { pattern: /___(.*?)___/g, type: "underline" }, // ___text___ for underline
        { pattern: /`(.*?)`/g, type: "code" },          // `text` for code/monospace
      ];

      let cursor = 0;
      let hasFormatting = false;

      // Check if text contains any formatting patterns
      for (let pattern of formatPatterns) {
        if (pattern.pattern.test(text)) {
          hasFormatting = true;
          break;
        }
      }

      if (!hasFormatting) {
        // No special formatting, just add as normal text
        await applyTextFormatting(paragraph, text, "normal", citationStyle);
        return;
      }

      // Process formatting patterns in order
      for (let formatDef of formatPatterns) {
        const regex = new RegExp(formatDef.pattern.source, 'g');
        let match;
        let tempCursor = cursor;

        while ((match = regex.exec(text)) !== null) {
          // Add text before formatted section
          if (match.index > tempCursor) {
            const beforeText = text.substring(tempCursor, match.index);
            await applyTextFormatting(paragraph, beforeText, "normal", citationStyle);
          }

          // Add formatted text
          const formattedText = match[1];
          await applyFormattedText(paragraph, formattedText, formatDef.type, citationStyle);
          
          tempCursor = regex.lastIndex;
        }

        // Update text by removing processed formatting
        text = text.replace(formatDef.pattern, '$1');
      }

      // Add any remaining text
      if (cursor < text.length) {
        const remainingText = text.substring(cursor);
        if (remainingText.trim()) {
          await applyTextFormatting(paragraph, remainingText, "normal", citationStyle);
        }
      }
    } catch (error) {
      console.error("Text parsing error:", error);
      // Fallback to plain text
      await applyTextFormatting(paragraph, text.replace(/[*_`]/g, ''), "normal", citationStyle);
    }
  };

  // Function to apply specific formatting types
  const applyFormattedText = async (paragraph, text, formatType, citationStyle) => {
    try {
      await Word.run(async (context) => {
        const range = paragraph.insertText(text, Word.InsertLocation.end);
        const styleFont = getCitationStyleFont(citationStyle);
        
        // Apply base font settings
        range.font.name = styleFont.family;
        range.font.size = styleFont.size;
        
        // Apply specific formatting
        switch (formatType) {
          case "italic":
            range.font.italic = true;
            break;
          case "bold":
            range.font.bold = true;
            break;
          case "underline":
            range.font.underline = Word.UnderlineType.single;
            break;
          case "code":
            range.font.name = "Courier New";
            range.font.size = styleFont.size - 1;
            break;
          default:
            break;
        }
        
        await context.sync();
      });
    } catch (error) {
      console.error("Formatted text application error:", error);
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
          // If JSON parsing fails, try BibTeX parsing
          // Basic BibTeX parser (supports @article, @book, @misc)
          const bibtexEntryRegex = /@(\w+)\s*\{([^,]+),([\s\S]*?)\}/g;
          const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g;
          let match;
          while ((match = bibtexEntryRegex.exec(content)) !== null) {
            const [, entryType, entryId, fieldsBlock] = match;
            let fields = {};
            let fieldMatch;
            while ((fieldMatch = fieldRegex.exec(fieldsBlock)) !== null) {
              const [, key, value] = fieldMatch;
              fields[key.toLowerCase()] = value;
            }
            // Map BibTeX fields to normalized citation
            parsed.push({
              id: entryId,
              type: entryType === "article" ? "article-journal" : entryType,
              title: fields.title || "Untitled",
              author: fields.author
                ? fields.author.split(/\s+and\s+/).map(name => {
                    const parts = name.split(",");
                    if (parts.length === 2) {
                      return { family: parts[0].trim(), given: parts[1].trim() };
                    } else {
                      const nameParts = name.trim().split(" ");
                      return { given: nameParts[0], family: nameParts.slice(1).join(" ") };
                    }
                  })
                : [{ given: "Unknown", family: "Author" }],
              issued: fields.year ? { "date-parts": [[parseInt(fields.year)]] } : { "date-parts": [[2025]] },
              "container-title": fields.journal || fields.booktitle || "",
              volume: fields.volume || "",
              issue: fields.number || "",
              page: fields.pages || "",
              DOI: fields.doi || "",
              URL: fields.url || "",
              publisher: fields.publisher || "",
              abstract: fields.abstract || "",
              source: "bibtex",
            });
          }
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
            source: entry.source || "imported",
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

  // Debug function to test citation style loading
  const testCitationStyles = async () => {
    console.log("Testing citation styles...");
    for (const style of citationStyles) {
      try {
        const styleXML = await getCSLStyleWithFallbacks(style.value);
        console.log(`${style.label} (${style.value}):`, styleXML ? "✓ Loaded" : "✗ Failed");
        
        // Test with a sample citation
        const sampleCitation = {
          id: "test_citation",
          type: "article-journal",
          author: [{ given: "John", family: "Doe" }],
          title: "Test Article",
          issued: { "date-parts": [[2025]] },
          "container-title": "Test Journal"
        };
        
        const formatted = await formatCitationCiteproc(sampleCitation, style.value, "in-text");
        console.log(`${style.value} formatting result:`, formatted);
      } catch (error) {
        console.error(`Error testing ${style.value}:`, error);
      }
    }
    setStatus("Citation styles tested - check console for results");
  };

  // Function to preview citation style formatting
  const previewCitationStyle = async (styleName) => {
    const sampleCitation = {
      id: "preview_citation",
      type: "article-journal",
      author: [
        { given: "Jane", family: "Smith" },
        { given: "John", family: "Doe" }
      ],
      title: "Sample Research Article",
      issued: { "date-parts": [[2024]] },
      "container-title": "Journal of Academic Research",
      volume: "10",
      issue: "2",
      page: "123-145"
    };

    try {
      const inTextFormatted = await formatCitationCiteproc(sampleCitation, styleName, "in-text");
      const fullFormatted = await formatBibliographyCiteproc([sampleCitation], styleName);
      const styleFont = getCitationStyleFont(styleName);
      
      console.log(`Preview for ${styleName}:`);
      console.log(`Font: ${styleFont.family}, Size: ${styleFont.size}`);
      console.log(`Title format: ${styleFont.titleFormat}`);
      console.log(`Book format: ${styleFont.bookFormat}`);
      console.log(`Emphasis: ${styleFont.emphasis}`);
      console.log(`In-text: ${inTextFormatted}`);
      console.log(`Bibliography: ${fullFormatted}`);
      
      return {
        inText: inTextFormatted,
        bibliography: fullFormatted,
        formatting: {
          font: styleFont.family,
          size: styleFont.size,
          titleFormat: styleFont.titleFormat,
          emphasis: styleFont.emphasis
        }
      };
    } catch (error) {
      console.error(`Preview failed for ${styleName}:`, error);
      return {
        inText: formatCitationFallback(sampleCitation, "in-text"),
        bibliography: formatCitationFallback(sampleCitation, "full"),
        formatting: getCitationStyleFont(styleName)
      };
    }
  };

  // Function to test formatting features
  const testFormattingFeatures = async () => {
    const testCitation = {
      id: "test_formatting",
      type: "article-journal",
      author: [{ given: "Test", family: "Author" }],
      title: "Test Article with Formatting",
      issued: { "date-parts": [[2025]] },
      "container-title": "Test Journal",
      volume: "1",
      issue: "1",
      page: "1-10"
    };

    console.log("Testing formatting features for each citation style:");
    
    for (const style of citationStyles) {
      const stylePreview = await previewCitationStyle(style.value);
      console.log(`\n${style.label} (${style.value}):`);
      console.log(`- Font: ${stylePreview.formatting.font} ${stylePreview.formatting.size}pt`);
      console.log(`- Journal titles: ${stylePreview.formatting.titleFormat}`);
      console.log(`- Emphasis: ${stylePreview.formatting.emphasis}`);
      console.log(`- Sample: ${stylePreview.inText}`);
    }
    
    setStatus("Formatting features tested - check console for details");
  };

  // Function to get font family and formatting based on citation style
  const getCitationStyleFont = (styleName) => {
    const fontMap = {
      "apa": { 
        family: "Times New Roman", 
        size: 12,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic",   // Book titles in italic
        emphasis: "italic"
      },
      "mla": { 
        family: "Times New Roman", 
        size: 12,
        titleFormat: "italic", // Journal/book titles in italic
        bookFormat: "italic",
        emphasis: "italic"
      },
      "ieee": { 
        family: "Times New Roman", 
        size: 10,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic",
        emphasis: "italic"
      },
      "harvard": { 
        family: "Times New Roman", 
        size: 12,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic",
        emphasis: "italic"
      },
      "vancouver": { 
        family: "Arial", 
        size: 11,
        titleFormat: "normal", // No italics for journal titles
        bookFormat: "normal",
        emphasis: "bold"
      },
      "chicago": { 
        family: "Times New Roman", 
        size: 12,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic",
        emphasis: "italic"
      },
      "nature": { 
        family: "Arial", 
        size: 8,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic",
        emphasis: "bold"
      },
      "science": { 
        family: "Times New Roman", 
        size: 10,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic",
        emphasis: "italic"
      }
    };
    return fontMap[styleName] || { 
      family: "Times New Roman", 
      size: 12, 
      titleFormat: "italic",
      bookFormat: "italic",
      emphasis: "italic"
    };
  };

  // Function to apply formatting to text based on citation style
  const applyTextFormatting = async (paragraph, text, formatType, citationStyle) => {
    const styleFont = getCitationStyleFont(citationStyle);
    
    try {
      await Word.run(async (context) => {
        const range = paragraph.insertText(text, Word.InsertLocation.end);
        
        // Apply basic font settings
        range.font.name = styleFont.family;
        range.font.size = styleFont.size;
        
        // Apply specific formatting based on type and style
        switch (formatType) {
          case "title":
          case "journal":
          case "book":
            if (styleFont.titleFormat === "italic") {
              range.font.italic = true;
            } else if (styleFont.titleFormat === "bold") {
              range.font.bold = true;
            } else if (styleFont.titleFormat === "underline") {
              range.font.underline = Word.UnderlineType.single;
            }
            break;
          case "emphasis":
            if (styleFont.emphasis === "italic") {
              range.font.italic = true;
            } else if (styleFont.emphasis === "bold") {
              range.font.bold = true;
            }
            break;
          case "volume":
            // Volume numbers are often bold in many styles
            if (["nature", "science", "vancouver"].includes(citationStyle)) {
              range.font.bold = true;
            }
            break;
          default:
            // Normal text formatting
            range.font.italic = false;
            range.font.bold = false;
            break;
        }
        
        await context.sync();
        return range;
      });
    } catch (error) {
      console.error("Text formatting error:", error);
    }
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
          previewCitationStyle={previewCitationStyle}
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
