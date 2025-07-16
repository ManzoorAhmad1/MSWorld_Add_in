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

  // Enhanced normalizeCitation function to handle PDF metadata properly
  const normalizeCitation = (raw) => {
    if (!raw) return null;

    // Handle authors from different sources
    let authors = [];
    
    // Check pdf_metadata first, then pdf_search_data, then direct author field
    const pdfAuthors = raw.pdf_metadata?.Authors || raw.pdf_search_data?.Authors || raw.author;
    
    if (pdfAuthors) {
      if (Array.isArray(pdfAuthors) && pdfAuthors.length > 0) {
        authors = pdfAuthors.map(author => ({
          given: author.given || "Unknown",
          family: author.family || "Author"
        }));
      } else if (typeof pdfAuthors === 'string') {
        // Parse author string like "Hengshuang Zhao, Jianping Shi, Xiaojuan Qi, Xiaogang Wang, Jiaya Jia"
        const authorNames = pdfAuthors.split(',').map(name => name.trim());
        authors = authorNames.map(name => {
          const nameParts = name.split(' ');
          if (nameParts.length >= 2) {
            return {
              given: nameParts.slice(0, -1).join(' '), // All except last as given name
              family: nameParts[nameParts.length - 1]   // Last as family name
            };
          } else {
            return {
              given: nameParts[0] || "Unknown",
              family: "Author"
            };
          }
        });
      }
    }
    
    // Fallback if no authors found
    if (authors.length === 0) {
      authors = [{ given: "No", family: "Author" }];
    }

    // Handle publication date from multiple sources
    let issued = { "date-parts": [[2025]] };
    const pubYear = raw.pdf_metadata?.PublicationYear || 
                   raw.pdf_search_data?.PublicationDate || 
                   raw.year ||
                   raw.issued?.["date-parts"]?.[0]?.[0];
    
    if (pubYear) {
      const year = typeof pubYear === 'string' ? 
        parseInt(pubYear.match(/\d{4}/)?.[0] || '2025') : 
        parseInt(pubYear);
      issued = { "date-parts": [[year]] };
    }

    // Handle title from multiple sources
    let title = raw.pdf_metadata?.Title || 
               raw.pdf_search_data?.Title || 
               raw.title || 
               raw.file_name || 
               "Untitled";
    
    if (Array.isArray(title)) {
      title = title[0] || "Untitled";
    }

    // Handle journal/container title
    const containerTitle = raw.pdf_metadata?.JournalName || 
                          raw.pdf_search_data?.JournalName ||
                          raw["container-title"] || 
                          raw.journal || 
                          "";

    // Handle DOI
    const doi = raw.pdf_metadata?.DOI || 
               raw.pdf_search_data?.DOI ||
               raw.DOI || 
               raw.doi || 
               "";

    // Handle URL (prefer straico_file_url for PDF links)
    const url = raw.straico_file_url || 
               raw.file_link || 
               raw.URL || 
               raw.url || 
               "";

    // Handle volume and issue
    const volume = raw.pdf_metadata?.Volume || 
                  raw.pdf_search_data?.Volume ||
                  raw.volume || 
                  "";
                  
    const issue = raw.pdf_metadata?.Issue || 
                 raw.pdf_search_data?.Issue ||
                 raw.issue || 
                 "";

    // Handle page numbers
    const page = raw.pdf_metadata?.Pages || 
                raw.page || 
                "";

    // Handle abstract
    const abstract = raw.pdf_metadata?.Abstract || 
                    raw.pdf_search_data?.Abstract ||
                    raw.abstract || 
                    "";

    // Handle publisher/institution
    const publisher = raw.pdf_metadata?.Institution || 
                     raw.pdf_search_data?.Institution ||
                     raw.publisher || 
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
      volume: volume,
      issue: issue,
      page: page,
      abstract: abstract,
      // Preserve original data
      ...raw
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

  // Enhanced fallback formatting function with proper academic citation styles
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
      const doi = normalized.DOI || "";
      const url = normalized.URL || normalized.file_link || normalized.straico_file_url || "";
      
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
        // Full citation format for bibliography with proper academic formatting
        
        // Format authors properly for each style
        let authorList = "";
        if (authors.length === 1) {
          const author = authors[0];
          const lastName = author.family || "Unknown";
          const firstName = author.given || "";
          const firstInitial = firstName ? firstName.charAt(0) + "." : "";
          
          switch (citationStyle) {
            case "apa":
            case "chicago":
              authorList = `${lastName}, ${firstInitial}`;
              break;
            case "mla":
              authorList = `${lastName}, ${firstName}`;
              break;
            default:
              authorList = `${lastName}, ${firstInitial}`;
          }
        } else if (authors.length > 1) {
          const firstAuthor = authors[0];
          const firstLastName = firstAuthor.family || "Unknown";
          const firstFirstName = firstAuthor.given || "";
          const firstInitial = firstFirstName ? firstFirstName.charAt(0) + "." : "";
          
          if (authors.length === 2) {
            const secondAuthor = authors[1];
            const secondLastName = secondAuthor.family || "Unknown";
            const secondFirstName = secondAuthor.given || "";
            const secondInitial = secondFirstName ? secondFirstName.charAt(0) + "." : "";
            
            switch (citationStyle) {
              case "apa":
                authorList = `${firstLastName}, ${firstInitial}, & ${secondLastName}, ${secondInitial}`;
                break;
              case "mla":
                authorList = `${firstLastName}, ${firstFirstName}, and ${secondFirstName} ${secondLastName}`;
                break;
              default:
                authorList = `${firstLastName}, ${firstInitial}, & ${secondLastName}, ${secondInitial}`;
            }
          } else {
            // 3 or more authors
            switch (citationStyle) {
              case "apa":
                authorList = `${firstLastName}, ${firstInitial}, et al.`;
                break;
              case "mla":
                authorList = `${firstLastName}, ${firstFirstName}, et al.`;
                break;
              default:
                authorList = `${firstLastName}, ${firstInitial}, et al.`;
            }
          }
        }
        
        // Generate proper citation format for each style
        switch (citationStyle) {
          case "apa":
            // APA: Author, A. A. (Year). Title of work. *Title of Journal*, Volume(Issue), pages. DOI or URL
            let apaResult = `${authorList} (${year}). ${title}.`;
            if (journal) {
              apaResult += ` *${journal}*`;
              if (volume) {
                apaResult += `, ${volume}`;
                if (issue) apaResult += `(${issue})`;
              }
              if (pages) apaResult += `, ${pages}`;
            }
            apaResult += ".";
            if (doi) {
              apaResult += ` https://doi.org/${doi}`;
            } else if (url) {
              apaResult += ` Retrieved from ${url}`;
            }
            return apaResult;
            
          case "mla":
            // MLA: Author. "Title." *Journal*, vol. Volume, no. Issue, Year, pp. pages.
            let mlaResult = `${authorList}. "${title}."`;
            if (journal) {
              mlaResult += ` *${journal}*`;
              if (volume) mlaResult += `, vol. ${volume}`;
              if (issue) mlaResult += `, no. ${issue}`;
              mlaResult += `, ${year}`;
              if (pages) mlaResult += `, pp. ${pages}`;
            } else {
              mlaResult += ` ${year}`;
            }
            mlaResult += ".";
            return mlaResult;
            
          case "ieee":
            // IEEE: A. Author, "Title," *Journal*, vol. Volume, no. Issue, pp. pages, Month Year.
            let ieeeResult = `${authorList}, "${title},"`;
            if (journal) {
              ieeeResult += ` *${journal}*`;
              if (volume) ieeeResult += `, vol. ${volume}`;
              if (issue) ieeeResult += `, no. ${issue}`;
              if (pages) ieeeResult += `, pp. ${pages}`;
              ieeeResult += `, ${year}`;
            } else {
              ieeeResult += ` ${year}`;
            }
            ieeeResult += ".";
            return ieeeResult;
            
          case "harvard":
            // Harvard: Author, A. (Year) 'Title', *Journal*, Volume(Issue), pp. pages.
            let harvardResult = `${authorList} (${year}) '${title}'`;
            if (journal) {
              harvardResult += `, *${journal}*`;
              if (volume) {
                harvardResult += `, ${volume}`;
                if (issue) harvardResult += `(${issue})`;
              }
              if (pages) harvardResult += `, pp. ${pages}`;
            }
            harvardResult += ".";
            return harvardResult;
            
          case "vancouver":
            // Vancouver: Author AA. Title. Journal. Year;Volume(Issue):pages.
            let vancouverResult = `${authorList}. ${title}.`;
            if (journal) {
              vancouverResult += ` ${journal}.`;
              vancouverResult += ` ${year}`;
              if (volume) {
                vancouverResult += `;${volume}`;
                if (issue) vancouverResult += `(${issue})`;
              }
              if (pages) vancouverResult += `:${pages}`;
            } else {
              vancouverResult += ` ${year}`;
            }
            vancouverResult += ".";
            return vancouverResult;
            
          case "chicago":
            // Chicago: Author, First. "Title." *Journal* Volume, no. Issue (Year): pages.
            let chicagoResult = `${authorList}. "${title}."`;
            if (journal) {
              chicagoResult += ` *${journal}*`;
              if (volume) chicagoResult += ` ${volume}`;
              if (issue) chicagoResult += `, no. ${issue}`;
              chicagoResult += ` (${year})`;
              if (pages) chicagoResult += `: ${pages}`;
            } else {
              chicagoResult += ` ${year}`;
            }
            chicagoResult += ".";
            return chicagoResult;
            
          case "nature":
            // Nature: Author, A. A. Title. *Journal* **volume**, pages (year).
            let natureResult = `${authorList} ${title}.`;
            if (journal) {
              natureResult += ` *${journal}*`;
              if (volume) natureResult += ` **${volume}**`;
              if (pages) natureResult += `, ${pages}`;
            }
            natureResult += ` (${year}).`;
            return natureResult;
            
          case "science":
            // Science: A. Author, Title. *Journal* **volume**, pages (year).
            let scienceResult = `${authorList}, ${title}.`;
            if (journal) {
              scienceResult += ` *${journal}*`;
              if (volume) scienceResult += ` **${volume}**`;
              if (pages) scienceResult += `, ${pages}`;
            }
            scienceResult += ` (${year}).`;
            return scienceResult;
            
          default: // APA as default
            let defaultResult = `${authorList} (${year}). ${title}.`;
            if (journal) {
              defaultResult += ` *${journal}*`;
              if (volume) {
                defaultResult += `, ${volume}`;
                if (issue) defaultResult += `(${issue})`;
              }
              if (pages) defaultResult += `, ${pages}`;
            }
            defaultResult += ".";
            if (doi) {
              defaultResult += ` https://doi.org/${doi}`;
            } else if (url) {
              defaultResult += ` Retrieved from ${url}`;
            }
            return defaultResult;
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
          // Decode HTML entities
          text = text.replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#38;/g, '&')
                    .replace(/&#39;/g, "'");
          // Replace multiple spaces/newlines with single space
          text = text.replace(/\s+/g, " ").trim();
          
          // Remove common status indicators that shouldn't be in citations
          text = text.replace(/\s*\(Unread\)\s*/gi, '')
                    .replace(/\s*\(Read\)\s*/gi, '')
                    .replace(/\s*\(Downloaded\)\s*/gi, '')
                    .replace(/\s*\(Viewed\)\s*/gi, '');
          
          // Ultra-simplified and targeted duplicate removal
          let result = text;
          
          // Method 1: Handle the exact pattern we're seeing
          // "Author (Year). Title. Journal, VolumeAuthor (Year). Title. Journal, Volume(Issue)"
          // Split on author pattern and detect duplicates
          const authorYearRegex = /([A-Z][a-z]+,\s*[A-Z]\.(?:[^(]*\([0-9]{4}\))[^.]*\.)/g;
          const authorMatches = [...result.matchAll(authorYearRegex)];
          
          if (authorMatches.length >= 2) {
            // Check if we have duplicate author citations
            for (let i = 0; i < authorMatches.length - 1; i++) {
              const current = authorMatches[i][1];
              const next = authorMatches[i + 1][1];
              
              // If the patterns are very similar, it's likely a duplicate
              if (current.substring(0, 20) === next.substring(0, 20)) {
                // Keep the longer, more complete version
                const currentIndex = result.indexOf(current);
                const nextIndex = result.indexOf(next);
                
                if (currentIndex !== -1 && nextIndex !== -1) {
                  // Find the complete duplicate sections
                  const beforeDup = result.substring(0, currentIndex);
                  const afterSecond = result.substring(nextIndex + next.length);
                  
                  // Look for the complete second citation (which is usually more complete)
                  const secondComplete = result.substring(nextIndex);
                  const nextPeriod = secondComplete.indexOf('. http') !== -1 ? 
                    secondComplete.indexOf('. http') : secondComplete.indexOf('.');
                  
                  if (nextPeriod !== -1) {
                    const completeSecond = secondComplete.substring(0, nextPeriod + 1);
                    result = beforeDup + completeSecond + afterSecond;
                  }
                }
              }
            }
          }
          
          // Method 2: Simple pattern-based cleanup for remaining artifacts
          // Remove patterns like "Journal, 1Journal, 1(1)"
          result = result.replace(/([A-Za-z\s]+),\s*(\d+)([A-Za-z\s]+),\s*\2\((\d+)\)/g, '$1, $2($4)');
          
          // Remove patterns like "arXiv, 1Zhao" (journal followed by number then author)
          result = result.replace(/([a-zA-Z]+),\s*(\d+)([A-Z][a-z]+)/g, '$1, $2. $3');
          
          // Method 3: Final cleanup
          result = result.replace(/\.{2,}/g, '.')
                        .replace(/\s{2,}/g, ' ')
                        .replace(/\s+\./g, '.')
                        .trim();
          
          // Ensure proper ending
          if (result && !result.endsWith('.')) {
            result += '.';
          }
          
          return result;
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

  // Function to test APA citation formatting specifically
  const testAPACitationFormatting = () => {
    const samplePDFData = {
      "id": 804,
      "file_name": "Pyramid Scene Parsing Network",
      "straico_file_url": "https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/explorerFiles/uploads/148/899df281-2adf-4bf3-9e34-c62446cb4667",
      "pdf_metadata": {
        "Authors": "Hengshuang Zhao, Jianping Shi, Xiaojuan Qi, Xiaogang Wang, Jiaya Jia",
        "PublicationYear": "2017",
        "JournalName": "arXiv",
        "Volume": "1",
        "Issue": "1",
        "DOI": "",
        "Institution": "The Chinese University of Hong Kong"
      },
      "pdf_search_data": {
        "Title": "Pyramid Scene Parsing Network",
        "Authors": "Hengshuang Zhao, Jianping Shi, Xiaojuan Qi, Xiaogang Wang, Jiaya Jia"
      }
    };

    console.log("Testing APA Citation Formatting:");
    console.log("================================");
    
    // Test APA specifically
    const apaInText = formatCitationFallback(samplePDFData, "in-text");
    const apaFull = formatCitationFallback(samplePDFData, "full");
    
    console.log("APA In-text:", apaInText);
    console.log("APA Bibliography:", apaFull);
    console.log("");
    console.log("Expected APA Bibliography:");
    console.log("Zhao, H., Shi, J., Qi, X., Wang, X., & Jia, J. (2017). Pyramid Scene Parsing Network. *arXiv*, 1(1). Retrieved from https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/explorerFiles/uploads/148/899df281-2adf-4bf3-9e34-c62446cb4667");
    
    setStatus("APA Citation formatting tested - check console for results");
  };

  // Function to test formatting with actual PDF data
  const testPDFCitationFormatting = () => {
    // Sample data from your PDF
    const samplePDFData = {
      "id": 804,
      "file_name": "Pyramid Scene Parsing Network",
      "straico_file_url": "https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/explorerFiles/uploads/148/899df281-2adf-4bf3-9e34-c62446cb4667",
      "pdf_metadata": {
        "Abstract": "Scene parsing is challenging for unrestricted open vocabulary and diverse scenes...",
        "PublicationDate": "April 27 2017",
        "Authors": "Hengshuang Zhao, Jianping Shi, Xiaojuan Qi, Xiaogang Wang, Jiaya Jia",
        "PublicationYear": "2017",
        "JournalName": "arXiv",
        "Volume": "1",
        "Issue": "1",
        "DOI": "",
        "Institution": "The Chinese University of Hong Kong"
      },
      "pdf_search_data": {
        "Title": "Pyramid Scene Parsing Network",
        "Authors": "Hengshuang Zhao, Jianping Shi, Xiaojuan Qi, Xiaogang Wang, Jiaya Jia",
        "PublicationDate": "April 2017"
      }
    };

    console.log("Testing PDF Citation Formatting:");
    console.log("================================");
    
    // Test each citation style
    citationStyles.forEach(style => {
      console.log(`\n${style.label} (${style.value}):`);
      console.log("----------------------------");
      
      // Test in-text citation
      const inTextCitation = formatCitationFallback(samplePDFData, "in-text");
      console.log(`In-text: ${inTextCitation}`);
      
      // Test full bibliography citation
      const fullCitation = formatCitationFallback(samplePDFData, "full");
      console.log(`Bibliography: ${fullCitation}`);
      
      console.log("");
    });
    
    setStatus("PDF Citation formatting tested - check console for results");
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

  // Helper function to calculate text similarity (Levenshtein distance based)
  const calculateSimilarity = (str1, str2) => {
    if (str1 === str2) return 1;
    
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    // Create a matrix for dynamic programming
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
    
    // Initialize first row and column
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    // Fill the matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    // Calculate similarity as percentage
    const maxLen = Math.max(len1, len2);
    const distance = matrix[len1][len2];
    return (maxLen - distance) / maxLen;
  };

  // Function to test duplicate text removal
  const testDuplicateRemoval = () => {
    const problematicTexts = [
      "Zhao, H., Shi, J., Qi, X., Wang, X., & Jia, J. (2017). Pyramid Scene Parsing Network. arXiv, 1Zhao, H., Shi, J., Qi, X., Wang, X., & Jia, J. (2017). Pyramid Scene Parsing Network. arXiv, 1(1). https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/explorerFiles/uploads/148/899df281-2adf-4bf3-9e34-c62446cb4667",
      "mentioned, N. (2023). Substitute Combine Adapt Modify Rearrange Eliminate. Sustainability Strategies, 1mentioned, N. (2023). Substitute Combine Adapt Modify Rearrange Eliminate. Sustainability Strategies, 1(1). https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/explorerFiles/uploads/148/Creative-Thinking%20(1).pdf"
    ];
    
    console.log("Testing Duplicate Text Removal:");
    console.log("===============================");
    
    problematicTexts.forEach((text, index) => {
      console.log(`\nTest Case ${index + 1}:`);
      console.log("Original problematic text:");
      console.log(text);
      console.log("");
      
      // Test the cleanEntry function logic
      const cleanEntry = (html) => {
        // Replace <i>...</i> with *...*
        let text = html.replace(/<i>(.*?)<\/i>/gi, '*$1*');
        // Remove all other HTML tags
        text = text.replace(/<[^>]+>/g, "");
        // Decode HTML entities
        text = text.replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#38;/g, '&')
                  .replace(/&#39;/g, "'");
        // Replace multiple spaces/newlines with single space
        text = text.replace(/\s+/g, " ").trim();
        
        // Remove common status indicators that shouldn't be in citations
        text = text.replace(/\s*\(Unread\)\s*/gi, '')
                  .replace(/\s*\(Read\)\s*/gi, '')
                  .replace(/\s*\(Downloaded\)\s*/gi, '')
                  .replace(/\s*\(Viewed\)\s*/gi, '');
        
        // Ultra-simplified and targeted duplicate removal
        let result = text;
        
        // Method 1: Handle the exact pattern we're seeing
        // "Author (Year). Title. Journal, VolumeAuthor (Year). Title. Journal, Volume(Issue)"
        // Split on author pattern and detect duplicates
        const authorYearRegex = /([A-Z][a-z]+,\s*[A-Z]\.(?:[^(]*\([0-9]{4}\))[^.]*\.)/g;
        const authorMatches = [...result.matchAll(authorYearRegex)];
        
        if (authorMatches.length >= 2) {
          // Check if we have duplicate author citations
          for (let i = 0; i < authorMatches.length - 1; i++) {
            const current = authorMatches[i][1];
            const next = authorMatches[i + 1][1];
            
            // If the patterns are very similar, it's likely a duplicate
            if (current.substring(0, 20) === next.substring(0, 20)) {
              // Keep the longer, more complete version
              const currentIndex = result.indexOf(current);
              const nextIndex = result.indexOf(next);
              
              if (currentIndex !== -1 && nextIndex !== -1) {
                // Find the complete duplicate sections
                const beforeDup = result.substring(0, currentIndex);
                const afterSecond = result.substring(nextIndex + next.length);
                
                // Look for the complete second citation (which is usually more complete)
                const secondComplete = result.substring(nextIndex);
                const nextPeriod = secondComplete.indexOf('. http') !== -1 ? 
                  secondComplete.indexOf('. http') : secondComplete.indexOf('.');
                
                if (nextPeriod !== -1) {
                  const completeSecond = secondComplete.substring(0, nextPeriod + 1);
                  result = beforeDup + completeSecond + afterSecond;
                }
              }
            }
          }
        }
        
        // Method 2: Simple pattern-based cleanup for remaining artifacts
        // Remove patterns like "Journal, 1Journal, 1(1)"
        result = result.replace(/([A-Za-z\s]+),\s*(\d+)([A-Za-z\s]+),\s*\2\((\d+)\)/g, '$1, $2($4)');
        
        // Remove patterns like "arXiv, 1Zhao" (journal followed by number then author)
        result = result.replace(/([a-zA-Z]+),\s*(\d+)([A-Z][a-z]+)/g, '$1, $2. $3');
        
        // Method 3: Final cleanup
        result = result.replace(/\.{2,}/g, '.')
                      .replace(/\s{2,}/g, ' ')
                      .replace(/\s+\./g, '.')
                      .trim();
        
        // Ensure proper ending
        if (result && !result.endsWith('.')) {
          result += '.';
        }
        
        return result;
      };
      
      const cleanedText = cleanEntry(text);
      console.log("After cleanup:");
      console.log(cleanedText);
      console.log("");
    });
    
    console.log("Expected results:");
    console.log("1. Zhao, H., Shi, J., Qi, X., Wang, X., & Jia, J. (2017). Pyramid Scene Parsing Network. *arXiv*, 1(1). Retrieved from https://...");
    console.log("2. mentioned, N. (2023). Substitute Combine Adapt Modify Rearrange Eliminate. *Sustainability Strategies*, 1(1). Retrieved from https://...");
    
    setStatus("Duplicate removal tested - check console for results");
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
          testAPACitationFormatting={testAPACitationFormatting}
          testDuplicateRemoval={testDuplicateRemoval}
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
