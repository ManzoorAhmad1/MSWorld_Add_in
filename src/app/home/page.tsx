
'use client';
import CitationSearch from "../../components/CitationSearch";
import CitationLibrary from "../../components/CitationLibrary";
import CitationSettings from "../../components/CitationSettings";
import BibliographySection from "../../components/BibliographySection";
import ResearchDocuments from "../../components/ResearchDocuments";
import OfficeWarning from "../../components/OfficeWarning";
import Cite from "citation-js";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Citation = {
  id: string;
  title?: string[] | string;
  author?: { given?: string; family?: string }[];
  used?: boolean;
  inTextCitations?: string[];
  [key: string]: any;
};

type CitationStyle = {
  value: string;
  label: string;
};

const Home: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const citationStyles: CitationStyle[] = [
    { value: "apa", label: "APA (American Psychological Association)" },
    { value: "mla", label: "MLA (Modern Language Association)" },
    { value: "chicago", label: "Chicago Manual of Style" },
    { value: "ieee", label: "IEEE" },
    { value: "harvard", label: "Harvard" },
    { value: "vancouver", label: "Vancouver" },
    { value: "nature", label: "Nature" },
    { value: "science", label: "Science" },
  ];
  const handleCitationSearch = async (): Promise<void> => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setStatus("Searching academic databases...");
    try {
      const [crossrefResults, doiResult] = await Promise.allSettled([
        searchCrossref(searchQuery),
        searchByDOI(searchQuery),
      ]);
      let results: Citation[] = [];
      if (crossrefResults.status === "fulfilled") {
        results = results.concat(crossrefResults.value as Citation[]);
      }
      if (doiResult.status === "fulfilled" && doiResult.value) {
        results.unshift(doiResult.value as Citation);
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
  const [isOfficeReady, setIsOfficeReady] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("Loading...");

  // Auth
  const getTokenFromUrl = (): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  };
  const [token, setToken] = useState<string>("");
  const router = useRouter();
  if (!token) {
    router.push("/");
  }
  // Citation state
  const [citationStyle, setCitationStyle] = useState<string>("apa");
  const [citations, setCitations] = useState<Citation[]>([]);
  // const [bibliography, setBibliography] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Citation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [citationFormat, setCitationFormat] = useState<string>("in-text");
  const [bibliographyTitle, setBibliographyTitle] = useState<string>("References");
  // const [recentCitations, setRecentCitations] = useState<Citation[]>([]);


  useEffect(() => {
    const urlToken = getTokenFromUrl();
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      setToken(urlToken);
    } else {
      const stored = localStorage.getItem("token");
      if (stored) setToken(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof Office !== "undefined") {
      Office.onReady((info: unknown) => {
        const hostInfo = info as { host: string };
        if (hostInfo.host === (Office as any).HostType.Word) {
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
    // intentionally not adding dependencies to avoid re-running on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSavedCitations = (): void => {
    try {
      const saved = localStorage.getItem("researchCollab_citations");
      if (saved) {
        const parsed: Citation[] = JSON.parse(saved);
        setCitations(parsed);
        // setRecentCitations(parsed.slice(-5));
      }
    } catch (e) {
      console.error("Load citations failed:", e);
    }
  };

  const saveCitations = (updated: Citation[]): void => {
    localStorage.setItem("researchCollab_citations", JSON.stringify(updated));
    // setRecentCitations(updated.slice(-5));
  };



  const searchCrossref = async (query: string): Promise<Citation[]> => {
    const res = await fetch(
      `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=10`
    );
    const data = await res.json();
    return (data.message?.items || []).map((item: any) => ({
      ...item,
      source: "crossref",
      id: item.DOI || `crossref_${Date.now()}_${Math.random()}`,
    }));
  };

  const searchByDOI = async (query: string): Promise<Citation | null> => {
    const match = query.match(/10\.\d{4,}\/[^"]+/);
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

  const addCitationToLibrary = (citation: Citation): void => {
    const citationWithMeta: Citation = {
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

  const insertCitation = async (citation: Citation): Promise<void> => {
    if (!isOfficeReady) return alert("Run this in Microsoft Word");
    try {
      const cite = new Cite(citation);
      const formatted = cite.format("citation", {
        format: "text",
        type: "string",
        style: citationStyle,
      });
      await Word.run(async (context: any) => {
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

  const generateBibliography = async (): Promise<void> => {
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
      await Word.run(async (context: any) => {
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
      // setBibliography(bib);
      setStatus("Bibliography inserted");
    } catch (e) {
      console.error("Bibliography error:", e);
      setStatus("Error generating bibliography");
    }
  };

  const exportCitations = (): void => {
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

  const handleImportCitations = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const bibtex = (ev.target && (ev.target as FileReader).result) as string;
        const cite = new Cite(bibtex);
        const parsed: Citation[] = cite.data;
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

  const getCitationTitle = (c: Citation): string => Array.isArray(c.title) ? c.title[0] : c.title || "Untitled";
  const getCitationAuthors = (c: Citation): string =>
    c.author?.map((a: { given?: string; family?: string }) => `${a.given || ""} ${a.family || ""}`.trim()).join(", ") ||
    "Unknown";

  // Add missing props for CitationLibrary
  const formatCitationPreview = (c: Citation): string => {
    try {
      const cite = new Cite(c);
      return cite.format("citation", { format: "text", type: "string", style: citationStyle });
    } catch {
      return getCitationTitle(c);
    }
  };
  const removeCitationFromLibrary = (id: string): void => {
    const updated = citations.filter((c) => c.id !== id);
    setCitations(updated);
    saveCitations(updated);
    setStatus("Citation removed");
  };

  const mockPDFs = [
    {
      id: 1,
      title: "Climate Change Research 2024",
      content: `This study examines the latest developments in climate science...`,
    },
  ];

  const handlePDFClick = (pdf: { id: number; title: string; content: string }): void => {
    if (!isOfficeReady) return alert("Use this in Word");
    Word.run(async (context: unknown) => {
      const ctx = context as { document: any };
      const body = ctx.document.body;
      body.insertBreak((Word as any).BreakType.page, (Word as any).InsertLocation.end);
      const title = body.insertParagraph(pdf.title, (Word as any).InsertLocation.end);
      title.style = "Heading 1";
      const content = body.insertParagraph(pdf.content, (Word as any).InsertLocation.end);
      content.font.size = 11;
      await ctx.document.context.sync();
      setStatus(`Inserted: ${pdf.title}`);
    });
  };

return (
  <div className="min-h-screen bg-gradient-to-br from-gray-100 via-emerald-50 to-amber-50 flex flex-col items-center py-8 px-2">
    <header className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center border border-emerald-100">
      <h1 className="text-4xl font-extrabold text-emerald-700 flex items-center gap-2 mb-1 tracking-tight drop-shadow">📚 ResearchCollab</h1>
      <p className="text-amber-700 mb-4 text-center text-lg font-medium">Professional Citation Management for Microsoft Word</p>
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

      {!isOfficeReady && (
        <div className="mt-6 w-full">
          <OfficeWarning />
        </div>
      )}
    </header>
  </div>
  );
};
export default Home;
