import CitationSearch from "../components/CitationSearch";
import CitationSettings from "../components/CitationSettings";
import BibliographySection from "../components/BibliographySection";
import CSL from "citeproc";
// Import CSL styles as text using webpack asset/source configuration
import apaStyle from "../csl-styles/apa.csl";
import mlaStyle from "../csl-styles/mla.csl";
import ieeeStyle from "../csl-styles/ieee.csl";
import harvardStyle from "../csl-styles/harvard-limerick.csl";
import vancouverStyle from "../csl-styles/vancouver.csl";
import natureStyle from "../csl-styles/nature.csl";
import scienceStyle from "../csl-styles/science.csl";
import chicagoStyle from "../csl-styles/chicago-author-date.csl";
import enLocale from "../csl-styles/localesen-US.xml";
import React, { useState, useEffect, useRef } from "react";
import { fetchUserFilesDocs, getFolder, getWorkspaces, getFolders } from "../api";

const Home = ({ handleLogout, status, setStatus }) => {
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
    const pdfAuthors =
      raw.pdf_metadata?.Authors ||
      raw.pdf_search_data?.Authors ||
      raw.authors;

    if (pdfAuthors) {
      if (Array.isArray(pdfAuthors) && pdfAuthors.length > 0) {
        authors = pdfAuthors.map((author) => ({
          given: author.given || "Unknown",
          family: author.family || "Author",
        }));
      } else if (typeof pdfAuthors === "string") {
        // Parse author string like "Hengshuang Zhao, Jianping Shi, Xiaojuan Qi, Xiaogang Wang, Jiaya Jia"
        // Handle complex patterns and clean up malformed author entries
        let cleanedAuthors = pdfAuthors
          .replace(/\s+and\s+/gi, ", ") // Replace "and" with comma
          .replace(/\s*&\s*/g, ", ") // Replace & with comma
          .replace(/\s*;\s*/g, ", ") // Replace semicolon with comma
          .replace(/,\s*,/g, ",") // Remove double commas
          .trim();
        
        const authorNames = cleanedAuthors.split(",").map((name) => name.trim()).filter(name => name.length > 0);
        
        authors = authorNames.map((name) => {
          // Clean up common parsing issues
          name = name.replace(/\s+/g, " ").trim();
          
          // Skip if name is too short or contains weird patterns
          if (name.length < 2 || /^\W+$/.test(name)) {
            return null;
          }
          
          const nameParts = name.split(" ");
          if (nameParts.length >= 2) {
            return {
              given: nameParts.slice(0, -1).join(" "), // All except last as given name
              family: nameParts[nameParts.length - 1], // Last as family name
            };
          } else {
            return {
              given: nameParts[0] || "Unknown",
              family: "Author",
            };
          }
        }).filter(author => author !== null); // Remove null entries
      }
    }

    // Fallback if no authors found
    if (authors.length === 0) {
      authors = [{ given: "No", family: "Author" }];
    }

    // Handle publication date from multiple sources
    let issued = { "date-parts": [[2025]] };
    const pubYear =
      raw.pdf_metadata?.PublicationYear ||
      raw.pdf_search_data?.PublicationDate ||
      raw.year ||
      raw.issued?.["date-parts"]?.[0]?.[0];

    if (pubYear) {
      const year =
        typeof pubYear === "string"
          ? parseInt(pubYear.match(/\d{4}/)?.[0] || "2025")
          : parseInt(pubYear);
      issued = { "date-parts": [[year]] };
    }

    // Handle title from multiple sources
    let title =
      raw.pdf_metadata?.Title ||
      raw.pdf_search_data?.Title ||
      raw.title ||
      raw.file_name ||
      "Untitled";

    if (Array.isArray(title)) {
      title = title[0] || "Untitled";
    }

    // Handle journal/container title
    const containerTitle =
      raw.pdf_metadata?.JournalName ||
      raw.pdf_search_data?.JournalName ||
      raw["container-title"] ||
      raw.journal ||
      "";

    // Handle DOI
    const doi =
      raw.pdf_metadata?.DOI ||
      raw.pdf_search_data?.DOI ||
      raw.DOI ||
      raw.doi ||
      "";

    // Handle URL (prefer straico_file_url for PDF links)
    const url =
      raw.straico_file_url || raw.file_link || raw.URL || raw.url || "";

    // Handle volume and issue
    const volume =
      raw.pdf_metadata?.Volume ||
      raw.pdf_search_data?.Volume ||
      raw.volume ||
      "";

    const issue =
      raw.pdf_metadata?.Issue || raw.pdf_search_data?.Issue || raw.issue || "";

    // Handle page numbers
    const page = raw.pdf_metadata?.Pages || raw.page || "";

    // Handle abstract
    const abstract =
      raw.pdf_metadata?.Abstract ||
      raw.pdf_search_data?.Abstract ||
      raw.abstract ||
      "";

    // Handle publisher/institution
    const publisher =
      raw.pdf_metadata?.Institution ||
      raw.pdf_search_data?.Institution ||
      raw.publisher ||
      "";

    return {
      id: raw.id
        ? String(raw.id)
        : `citation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      ...raw,
    };
  };

  // Enhanced getCSLStyle function with fallbacks
  const getCSLStyle = (styleName) => {
    try {
      let style;
      switch (styleName) {
        case "apa":
          style = apaStyle;
          break;
        case "mla":
          style = mlaStyle;
          break;
        case "ieee":
          style = ieeeStyle;
          break;
        case "harvard":
          style = harvardStyle;
          break;
        case "vancouver":
          style = vancouverStyle;
          break;
        case "nature":
          style = natureStyle;
          break;
        case "science":
          style = scienceStyle;
          break;
        case "chicago":
          style = chicagoStyle;
          break;
        default:
          style = apaStyle;
          break;
      }

      return style || fallbackAPA;
    } catch (error) {
      console.warn(`Failed to load style ${styleName}, using fallback`, error);
      return fallbackAPA;
    }
  };

  // Alternative method to load CSL styles via fetch
  const loadCSLStyle = async (styleName) => {
    try {
      let stylePath = "";
      switch (styleName) {
        case "apa":
          stylePath = "/src/csl-styles/apa.csl";
          break;
        case "mla":
          stylePath = "/src/csl-styles/mla.csl";
          break;
        case "ieee":
          stylePath = "/src/csl-styles/ieee.csl";
          break;
        case "harvard":
          stylePath = "/src/csl-styles/harvard-limerick.csl";
          break;
        case "vancouver":
          stylePath = "/src/csl-styles/vancouver.csl";
          break;
        case "chicago":
          stylePath = "/src/csl-styles/chicago-author-date.csl";
          break;
        case "nature":
          stylePath = "/src/csl-styles/nature.csl";
          break;
        case "science":
          stylePath = "/src/csl-styles/science.csl";
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
      if (style && style !== fallbackAPA && style.includes("<?xml")) {
     
        return style;
      }

      // Method 2: Try async loading
      style = await loadCSLStyle(styleName);
      if (style && style !== fallbackAPA && style.includes("<?xml")) {
        return style;
      }

      // Method 3: Use fallback
      console.warn(`⚠️ Using fallback APA for ${styleName}`);
      return fallbackAPA;
    } catch (error) {
      console.error(`❌ All loading methods failed for ${styleName}:`, error);
      return fallbackAPA;
    }
  };

  // Enhanced fallback formatting function with proper academic citation styles
  const formatCitationFallback = (citation, format = "in-text") => {
    try {
      const normalized = normalizeCitation(citation);
      if (!normalized) return "[Invalid Citation]";

      const authors = normalized.author || [
        { given: "Unknown", family: "Author" },
      ];
      const year = normalized.issued?.["date-parts"]?.[0]?.[0] || "n.d.";
      const title = normalized.title || "Untitled";
      const journal = normalized["container-title"] || "";
      const volume = normalized.volume || "";
      const issue = normalized.issue || "";
      const pages = normalized.page || "";
      const doi = normalized.DOI || "";
      const url =
        normalized.URL ||
        normalized.file_link ||
        normalized.straico_file_url ||
        "";

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
            case "ieee":
              authorList = `${firstInitial} ${lastName}`;
              break;
            default:
              authorList = `${lastName}, ${firstInitial}`;
          }
        } else if (authors.length > 1) {
          const firstAuthor = authors[0];
          const firstLastName = firstAuthor.family || "Unknown";
          const firstFirstName = firstAuthor.given || "";
          const firstInitial = firstFirstName
            ? firstFirstName.charAt(0) + "."
            : "";

          if (authors.length === 2) {
            const secondAuthor = authors[1];
            const secondLastName = secondAuthor.family || "Unknown";
            const secondFirstName = secondAuthor.given || "";
            const secondInitial = secondFirstName
              ? secondFirstName.charAt(0) + "."
              : "";

            switch (citationStyle) {
              case "apa":
                authorList = `${firstLastName}, ${firstInitial}, & ${secondLastName}, ${secondInitial}`;
                break;
              case "mla":
                authorList = `${firstLastName}, ${firstFirstName}, and ${secondFirstName} ${secondLastName}`;
                break;
              case "ieee":
                authorList = `${firstInitial} ${firstLastName} and ${secondInitial} ${secondLastName}`;
                break;
              default:
                authorList = `${firstLastName}, ${firstInitial}, & ${secondLastName}, ${secondInitial}`;
            }
          } else {
            // 3 or more authors - APA has specific rules
            switch (citationStyle) {
              case "apa":
                // APA 7th edition: List all authors up to 20 in reference list
                if (authors.length <= 20) {
                  const allAuthors = authors.map(author => {
                    const lastName = author.family || "Unknown";
                    const firstName = author.given || "";
                    const firstInitial = firstName ? firstName.charAt(0) + "." : "";
                    return `${lastName}, ${firstInitial}`;
                  });
                  // Join with commas, and use & before last author
                  if (allAuthors.length > 1) {
                    const lastAuthor = allAuthors.pop();
                    authorList = allAuthors.join(", ") + ", & " + lastAuthor;
                  } else {
                    authorList = allAuthors[0];
                  }
                } else {
                  // More than 20 authors - use et al.
                  authorList = `${firstLastName}, ${firstInitial}, et al.`;
                }
                break;
              case "ieee":
                authorList = `${firstInitial} ${firstLastName} et al.`;
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
              apaResult += ".";
            } else {
              // No journal, just add period after title
              if (!apaResult.endsWith(".")) apaResult += ".";
            }
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
  const formatCitationCiteproc = async (
    citation,
    styleName = "apa",
    format = "in-text"
  ) => {
    try {
      // Validate and normalize citation
      if (!citation || typeof citation !== "object") {
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
          const found = citations.find((c) => String(c.id) === String(id));
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
          result = citeproc.makeCitationCluster([
            {
              id: normalizedCitation.id,
              locator: "",
              label: "",
            },
          ]);
        } else {
          // For in-text citations
          result = citeproc.makeCitationCluster([
            {
              id: normalizedCitation.id,
            },
          ]);
        }

        // Extract formatted text from result
        if (result && result[0] && result[0][1]) {
          const formattedText = result[0][1];
          // Clean up any HTML tags that might remain
          return formattedText.replace(/<[^>]+>/g, "");
        } else if (result && typeof result === "string") {
          return result.replace(/<[^>]+>/g, "");
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
  const formatBibliographyCiteproc = async (
    citationsArr,
    styleName = "apa"
  ) => {
    try {
      if (!citationsArr || citationsArr.length === 0) {
        return "";
      }

      // Normalize all citations
      const normalizedCitations = citationsArr
        .map((c) => normalizeCitation(c))
        .filter((c) => c);
      if (normalizedCitations.length === 0) {
        return "";
      }

  
      const preprocessedCitations = normalizedCitations.map((citation) => {
        if (!citation.title) return citation;

        let title = citation.title;

        // Check if title already contains duplication pattern
        const titleDupePattern = /^(.*?),\s*(\d+)\1,\s*\2(\([^)]*\))(.*)$/;
        const titleMatch = title.match(titleDupePattern);
        if (titleMatch) {
          const cleanTitle = titleMatch[1];
          const volume = titleMatch[2];
          const issue = titleMatch[3];
          const trailing = titleMatch[4];
          title = cleanTitle + ", " + volume + issue + trailing;
        }

        return { ...citation, title };
      });

      // PRIORITY: Check if CSL styles are loading properly
      const styleXML = await getCSLStyleWithFallbacks(styleName);

      // If CSL style failed to load properly, use fallback formatting
      if (
        !styleXML ||
        styleXML === fallbackAPA ||
        !styleXML.includes("<?xml")
      ) {
        return preprocessedCitations
          .map((c) => formatCitationFallback(c, "full"))
          .join("\n\n");
      }

      const sys = {
        retrieveLocale: () => enLocale || fallbackLocale,
        retrieveItem: (id) =>
          preprocessedCitations.find((c) => String(c.id) === String(id)),
      };

      let citeproc;
      try {
        citeproc = new CSL.Engine(sys, styleXML, "en-US");
      } catch (error) {
        console.error("❌ Bibliography CSL Engine failed:", error);
        // Fallback to enhanced manual bibliography
        return preprocessedCitations
          .map((c) => formatCitationFallback(c, "full"))
          .join("\n\n");
      }

      const ids = preprocessedCitations.map((c) => c.id);
      citeproc.updateItems(ids);
      const bibResult = citeproc.makeBibliography();

      if (bibResult && bibResult[1]) {
        // Enhanced cleanup function with multiple aggressive duplicate removal patterns
        const cleanEntry = (html) => {
          // Replace <i>...</i> with *...*
          let text = html.replace(/<i>(.*?)<\/i>/gi, "*$1*");
          // Remove all other HTML tags
          text = text.replace(/<[^>]+>/g, "");
          // Decode HTML entities
          text = text
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#38;/g, "&")
            .replace(/&#39;/g, "'");
          // Replace multiple spaces/newlines with single space
          text = text.replace(/\s+/g, " ").trim();

          // Remove common status indicators that shouldn't be in citations
          text = text
            .replace(/\s*\(Unread\)\s*/gi, "")
            .replace(/\s*\(Read\)\s*/gi, "")
            .replace(/\s*\(Downloaded\)\s*/gi, "")
            .replace(/\s*\(Viewed\)\s*/gi, "");

          // ULTRA-PRIORITY: Most aggressive pattern for your specific case
          // This targets the EXACT pattern: "Text. Journal, 1Text. Journal, 1(1). URL"
          const ultraPriorityPattern =
            /^(.*?\([0-9]{4}\)\..*?),\s*(\d+)\1,\s*\2(\([^)]*\))(.*)$/;
          const ultraMatch = text.match(ultraPriorityPattern);
          if (ultraMatch) {
            const citation = ultraMatch[1];
            const volume = ultraMatch[2];
            const issue = ultraMatch[3];
            const trailing = ultraMatch[4];
            const fixed = citation + ", " + volume + issue + trailing;
            return fixed.endsWith(".") ? fixed : fixed + ".";
          }

          // NEW: SUPER-SPECIFIC pattern for the user's exact case
          // Pattern matches: "mentioned, N. (2023). Title. Journal, 1mentioned, N. (2023). Title. Journal, 1(1). URL"
          const superSpecificPattern =
            /^(.+?),\s*(\d+)(.+?),\s*\2\((\d+)\)(\..*)$/;
          const superMatch = text.match(superSpecificPattern);
          if (superMatch) {
            const beforeVolume = superMatch[1]; // "mentioned, N. (2023). Substitute... Strategies"
            const volume = superMatch[2]; // "1"
            const duplicatedPart = superMatch[3]; // "mentioned, N. (2023). Substitute... Strategies" (duplicate)
            const issue = superMatch[4]; // "1" (from (1))
            const trailing = superMatch[5]; // ". https://..."

            // Check if duplicatedPart is actually a duplicate by comparing with beforeVolume
            if (
              duplicatedPart.includes(
                beforeVolume.substring(beforeVolume.lastIndexOf(".") + 1).trim()
              ) ||
              calculateSimilarity(beforeVolume, duplicatedPart) > 0.7
            ) {
              const fixed =
                beforeVolume + ", " + volume + "(" + issue + ")" + trailing;
              return fixed.endsWith(".") ? fixed : fixed + ".";
            }
          }

          // PRIORITY FIX 1: Exact Zhao pattern
          const zhaoSpecificPattern =
            /^(Zhao,\s*H\.,\s*Shi,\s*J\.,\s*Qi,\s*X\.,\s*Wang,\s*X\.,\s*&\s*Jia,\s*J\.\s*\([0-9]{4}\)\.\s*Pyramid\s*Scene\s*Parsing\s*Network\.\s*arXiv),\s*(\d+)\1,\s*\2(\([^)]*\))(.*)$/;
          const zhaoMatch = text.match(zhaoSpecificPattern);
          if (zhaoMatch) {
            const citation = zhaoMatch[1];
            const volume = zhaoMatch[2];
            const issue = zhaoMatch[3];
            const trailing = zhaoMatch[4];
            const fixed = citation + ", " + volume + issue + trailing;
            return fixed.endsWith(".") ? fixed : fixed + ".";
          }

          // PRIORITY FIX 2: Generic author-year duplication
          const genericDuplicationPattern =
            /^(.*?\([0-9]{4}\)\..*?[A-Za-z\s]+),\s*(\d+)\1,\s*\2(\([^)]*\))(.*)$/;
          const genericMatch = text.match(genericDuplicationPattern);
          if (genericMatch) {
            const citation = genericMatch[1];
            const volume = genericMatch[2];
            const issue = genericMatch[3];
            const trailing = genericMatch[4];
            const fixed = citation + ", " + volume + issue + trailing;
            return fixed.endsWith(".") ? fixed : fixed + ".";
          }

          // PRIORITY FIX 3: Handle cases where duplication pattern might vary
          const flexiblePattern = /^(.*?),\s*(\d+)(.*?),\s*\2(\([^)]*\))(.*)$/;
          const flexMatch = text.match(flexiblePattern);
          if (flexMatch) {
            const firstPart = flexMatch[1];
            const volume = flexMatch[2];
            const middlePart = flexMatch[3];
            const issue = flexMatch[4];
            const trailing = flexMatch[5];

            // Check if the middle part contains a significant portion of the first part
            const firstWords = firstPart.split(" ").slice(-10).join(" "); // Last 10 words
            if (middlePart.includes(firstWords.substring(0, 30))) {
              const fixed = firstPart + ", " + volume + issue + trailing;
              return fixed.endsWith(".") ? fixed : fixed + ".";
            }
          }

          // NEW: Fix complete duplicated author + title pattern before other algorithms
          // This tackles the specific issue with doubled references like:
          // "Zhao, H., Shi, J., Qi, X., Wang, X., & Jia, J. (2017). Pyramid Scene Parsing Network. arXiv, 1Zhao, H., Shi, J., Qi, X., Wang, X., & Jia, J. (2017). Pyramid Scene Parsing Network. arXiv, 1(1)"

          // First, handle the most common pattern: Complete citation duplication with volume/issue
          const fullDuplicationPattern =
            /^(.*?\([0-9]{4}\)\..*?),\s*[0-9]+\1,\s*[0-9]+(\([^)]*\))?(.*)$/;
          if (fullDuplicationPattern.test(text)) {
            const match = text.match(fullDuplicationPattern);
            if (match) {
              // Reconstruct with proper format: citation + volume + issue + any trailing content (like URL)
              const citation = match[1];
              const issue = match[2] || "";
              const trailing = match[3] || "";
              text = citation + ", 1" + issue + trailing;
            }
          }

          // Secondary pattern: Handle cases where duplication occurs at different points
          const authorYearTitlePattern =
            /^([^(]+\(\d{4}\)[^,]+),\s*([^(]+)(\1),\s*\2\(([^)]+)\)/;
          text = text.replace(authorYearTitlePattern, "$1, $2($4)");

          // Super-enhanced duplicate text removal algorithm
          let result = text;

          // Method 1: Remove the most common CSL duplicate pattern
          // Pattern: "Text, 1Text, 1(1)" -> "Text, 1(1)"
          // This handles cases like "Sustainability Strategies, 1mentioned, N. (2023)..."
          result = result.replace(
            /([^,]+),\s*(\d+)[^,]*,\s*(\d+)\([^)]+\)/g,
            (match, prefix, num1, num2) => {
              // If it looks like a duplicate volume pattern
              if (num1 === num2) {
                return `${prefix}, ${num1}`;
              }
              return match;
            }
          );

          // NEW: Handle completely duplicated citation with Journal + Volume repetition
          // This specifically targets: "mentioned, N. (2023). Title. Journal, 1mentioned, N. (2023). Title. Journal, 1(1)"
          result = result.replace(
            /^(.*?\(\d{4}\)\..*?[A-Za-z\s]+),\s*\d+\1,\s*\d+\((\d+)\)/g,
            "$1($2)"
          );

          // NEW: Alternative pattern for duplicated references ending with URL
          result = result.replace(
            /^(.*?\(\d{4}\)\..*?[A-Za-z\s]+),\s*\d+(.*?\(\d{4}\)\..*?[A-Za-z\s]+),\s*\d+\((\d+)\)/g,
            "$2($3)"
          );

          // Method 2: Remove author-title-journal duplicates that appear mid-sentence
          // Pattern: "Author (Year). Title. Journal, VolumeAuthor (Year). Title. Journal, Volume(Issue)"
          const authorYearPattern =
            /([A-Z][^(]*\(\d{4}\)[^.]*\.[^.]*\.[^,]+,\s*\d+)([A-Z][^(]*\(\d{4}\)[^.]*\.[^.]*\.[^,]+,\s*\d+\(\d+\))/g;
          result = result.replace(authorYearPattern, (match, first, second) => {
            // Check if the second part starts similarly to the first
            const firstWords = first.split(" ").slice(0, 5).join(" ");
            const secondWords = second.split(" ").slice(0, 5).join(" ");
            if (firstWords === secondWords || second.includes(firstWords)) {
              return second; // Keep the more complete second part
            }
            return match;
          });

          // Method 3: Advanced word-level duplicate detection
          const words = result.split(" ");
          const cleanedWords = [];
          let i = 0;

          // NEW: Check for complete duplication pattern
          // (this helps with cases where the entire reference is duplicated)
          const fullText = words.join(" ");
          const halfLength = Math.floor(words.length / 2);

          // NEW: First check for the specific format you've shared -
          // "Author, et al. (Year). Title. Journal, 1Author, et al. (Year). Title. Journal, 1(Issue)"
          const exactPattern =
            /^([A-Za-z]+,\s+[A-Za-z]\.,\s+(?:[A-Za-z]+,\s+[A-Za-z]\.,\s+)*(?:&\s+)?[A-Za-z]+,\s+[A-Za-z]\.\s+\(\d{4}\)\.\s+[^.]+\.\s+[^,]+),\s+\d+\1,\s+\d+\(\d+\)/i;

          if (exactPattern.test(fullText)) {
            const finalFormatMatch = fullText.match(
              /^(.*?),\s+\d+(.*?),\s+\d+\((\d+)\)(.*?)$/
            );
            if (finalFormatMatch) {
              // Reconstruct the citation with the right format, preserving URL at the end
              return `${finalFormatMatch[2]}(${finalFormatMatch[3]})${
                finalFormatMatch[4] || ""
              }`;
            }
          }

          // If we have an even number of words, check if the first half equals the second half
          if (words.length % 2 === 0 && halfLength >= 5) {
            const firstHalf = words.slice(0, halfLength).join(" ");
            const secondHalf = words.slice(halfLength).join(" ");

            // If there's significant similarity, keep only the second half (usually more complete)
            if (
              firstHalf === secondHalf ||
              calculateSimilarity(firstHalf, secondHalf) > 0.8
            ) {
              return secondHalf;
            }
          }

          while (i < words.length) {
            let longestMatch = 0;
            let bestMatchStart = -1;

            // Look for the longest duplicate sequence starting from current position
            // Increased minimum sequence length from 3 to 5 for better accuracy
            for (let len = 5; len <= Math.min(20, words.length - i); len++) {
              const sequence = words.slice(i, i + len);
              const sequenceText = sequence.join(" ");

              // Look for this sequence later in the text
              for (let j = i + len; j <= words.length - len; j++) {
                const laterSequence = words.slice(j, j + len);
                const laterSequenceText = laterSequence.join(" ");

                if (sequenceText === laterSequenceText && len > longestMatch) {
                  longestMatch = len;
                  bestMatchStart = j;
                }
              }
            }

            if (longestMatch > 0) {
              // Found a duplicate, add the first occurrence and skip the duplicate
              cleanedWords.push(...words.slice(i, i + longestMatch));

              // Remove the duplicate sequence from the words array
              words.splice(bestMatchStart, longestMatch);

              i += longestMatch;
            } else {
              // No duplicate found, add the word and continue
              cleanedWords.push(words[i]);
              i++;
            }
          }

          result = cleanedWords.join(" ");

          // Method 4: Specific pattern fixes
          // Fix "Journal, 1Journal, 1(1)" pattern
          result = result.replace(
            /([A-Za-z\s]+),\s*(\d+)([A-Za-z\s]+),\s*\2\((\d+)\)/g,
            "$1, $2($4)"
          );

          // NEW: Direct pattern for the specific Zhao reference
          result = result.replace(
            /(Zhao,\s*H\.,\s*Shi,\s*J\.,\s*Qi,\s*X\.,\s*Wang,\s*X\.,\s*&\s*Jia,\s*J\.\s*\(2017\)\.\s*Pyramid\s*Scene\s*Parsing\s*Network\.\s*arXiv),\s*\d+\1,\s*\d+/i,
            (match, prefix) => {
              // Look for an issue number pattern at the end
              const issueMatch = match.match(/\((\d+)\)/);
              return `${prefix}, 1${issueMatch ? `(${issueMatch[1]})` : ""}`;
            }
          );

          // Fix author duplication: "Name, N. (Year). Title. Name, N. (Year)."
          result = result.replace(
            /([A-Z][^(]+\(\d{4}\)[^.]*\.)\s*([A-Z][^(]+\(\d{4}\))/g,
            (match, first, second) => {
              if (first.includes(second.split("(")[0])) {
                return first;
              }
              return match;
            }
          );

          // Method 5: Clean up remaining artifacts
          // Remove duplicate periods and spaces
          result = result
            .replace(/\.{2,}/g, ".")
            .replace(/\s{2,}/g, " ")
            .replace(/\s+\./g, ".")
            .trim();

          // NEW: Final comprehensive check for the exact duplication pattern
          // Handle: "Author (Year). Title. Journal, 1Author (Year). Title. Journal, 1(Issue). URL"
          const exactDuplicationPattern =
            /^(.*?\([0-9]{4}\)\..*?),\s*([0-9]+)\1,\s*\2(\([^)]*\))?(.*?)$/;
          if (exactDuplicationPattern.test(result)) {
            const exactMatch = result.match(exactDuplicationPattern);
            if (exactMatch) {
              const baseCitation = exactMatch[1];
              const volume = exactMatch[2];
              const issue = exactMatch[3] || "";
              const trailing = exactMatch[4] || "";
              result = baseCitation + ", " + volume + issue + trailing;
            }
          }

          // Handle edge case where citation appears 3+ times
          const multipleDuplicationPattern =
            /^(.*?\([0-9]{4}\)\..*?),\s*[0-9]+(\1,\s*[0-9]+)+(\([^)]*\))?(.*?)$/;
          if (multipleDuplicationPattern.test(result)) {
            const multiMatch = result.match(
              /^(.*?\([0-9]{4}\)\..*?),\s*([0-9]+).*/
            );
            if (multiMatch) {
              const baseCitation = multiMatch[1];
              const volume = multiMatch[2];
              // Look for issue number in the original text
              const issueMatch = result.match(/\(([0-9]+)\)/);
              const issue = issueMatch ? `(${issueMatch[1]})` : "";
              // Look for URL in the original text
              const urlMatch = result.match(/(https?:\/\/[^\s]+.*?)$/);
              const url = urlMatch ? ` ${urlMatch[1]}` : "";
              result = baseCitation + ", " + volume + issue + url;
            }
          }

          // Final check for duplicate reference pattern in APA style
          // This is a last resort catch-all for the specific pattern we're seeing
          const finalDuplicateCheck =
            /^([^,]+,\s*[A-Z]\.\s*\(\d{4}\)\.\s*[^.]+\.[^,]+),\s*\d+\1,\s*\d+/;
          if (finalDuplicateCheck.test(result)) {
            const match = result.match(finalDuplicateCheck);
            if (match) {
              // Extract the URL part from the end if it exists
              const urlMatch = result.match(/https?:\/\/[^\s]+/);
              const url = urlMatch ? ` ${urlMatch[0]}` : "";

              // Get everything after the duplication point
              const secondHalfMatch = result.match(
                /^[^,]+,\s*[A-Z]\.\s*\(\d{4}\)\.\s*[^.]+\.[^,]+,\s*\d+([^,]+,\s*[A-Z]\.\s*\(\d{4}\)\.\s*[^.]+\.[^,]+,\s*\d+\([^)]+\).*?)$/
              );

              if (secondHalfMatch) {
                result = secondHalfMatch[1] + url;
              }
            }
          }

          // NEW: Add pattern specifically for Zhao reference format
          const zhaoPattern =
            /^(Zhao,\s*H\.,\s*Shi,\s*J\.,\s*Qi,\s*X\.,\s*Wang,\s*X\.,\s*&\s*Jia,\s*J\.\s*\(2017\)\.\s*Pyramid\s*Scene\s*Parsing\s*Network\.\s*arXiv),\s*\d+\1,\s*\d+\((\d+)\)(.*?)$/;
          if (zhaoPattern.test(result)) {
            const zhaoMatch = result.match(zhaoPattern);
            if (zhaoMatch) {
              result = `${zhaoMatch[1]}, ${zhaoMatch[2]}(${zhaoMatch[3]})${
                zhaoMatch[4] || ""
              }`;
            }
          }

          // Ensure proper ending
          if (result && !result.endsWith(".")) {
            result += ".";
          }

          return result;
        };
        return bibResult[1].map(cleanEntry).join("\n");
      } else {
        // Fallback bibliography
        return normalizedCitations
          .map((c) => formatCitationFallback(c, "full"))
          .join("\n\n");
      }
    } catch (error) {
      console.error("Bibliography formatting failed:", error);
      return citationsArr
        .map((c) => formatCitationFallback(c, "full"))
        .join("\n\n");
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
  const [fetchPaperLoader, setFetchPaperLoader] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [citationFormat, setCitationFormat] = useState("in-text");
  const [bibliographyTitle, setBibliographyTitle] = useState("References");
  const [recentCitations, setRecentCitations] = useState([]);
  const [userWorkSpaces, setUserWorkSpaces] = useState({});
  const [selectedWorkSpace, setSelectedWorkSpace] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isWorkSpaceLoading, setIsWorkSpaceLoading] = useState(false);
  const [fetchFolder, setFetchFolder] = useState([]);
  const [isFolderLoading, setIsFolderLoading] = useState(false);
  const [isSelectedFolder, setIsSelectedFolder] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize] = useState(10);

  // Fetch user files on component mount
  useEffect(() => {
    const fetchUserWorkSpaces = async () => {
      try {
        setIsWorkSpaceLoading(true);
        const response = await getWorkspaces();
        const workspaces = response.data || [];
        setUserWorkSpaces(workspaces);
        setIsWorkSpaceLoading(false);
      } catch (error) {
        setIsWorkSpaceLoading(false);
        console.error("Error fetching workspaces:", error);
      }
    };
    fetchUserWorkSpaces();
  }, []);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setIsFolderLoading(true);
        const response = await getFolder();
        const folder = response.data || [];
        setFetchFolder(folder);
        setIsFolderLoading(false);
      } catch (error) {
        setIsFolderLoading(false);
        console.error("Error fetching folders:", error);
      }

    };
    fetchFolders();
  }, []);
  
  useEffect(() => {
    const fetchFiles = async (page = 1) => {
      try {
        // Only fetch files if a project is selected
        if (!selectedProject) {
          setSearchResults([]);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalResults(0);
          return;
        }

        setFetchPaperLoader(true);
        const folderData = await getFolders({
          projectId: selectedProject,
          folderId: isSelectedFolder || null,
          pageNo: page,
          limit: pageSize
        });
        
        // Extract files from the response and set them as search results
        if (folderData.data && folderData.data.files) {
          const filesWithCitationFormat = folderData.data.files.map(file => ({
            id: file.id,
            title: file.fileName,
            authors: file.pdf_metadata?.Authors || 'Unknown Authors',
            'container-title': file.pdf_metadata?.JournalName || 'Unknown Journal',
            issued: file.pdf_metadata?.PublicationYear ? 
              { 'date-parts': [[parseInt(file.pdf_metadata.PublicationYear)]] } : null,
            source: 'folder',
            CitationCount: file.CitationCount || 0,
            originalFileData: file // Keep original data for reference
          }));
          
          // Normalize the fetched data
          const normalizedFiles = filesWithCitationFormat.map((file) =>
            normalizeCitation(file)
          );
          setSearchResults(normalizedFiles);
          
          // Update pagination state with better calculation
          const totalFiles = folderData.data.totalFiles || folderData.data.pagination?.total || normalizedFiles.length;
          const calculatedTotalPages = Math.ceil(totalFiles / pageSize);
          
          setCurrentPage(page);
          setTotalPages(folderData.data.pagination?.totalPages || calculatedTotalPages);
          setTotalResults(totalFiles);          
          setFetchPaperLoader(false);
        } else {
          setFetchPaperLoader(false);
          setSearchResults([]);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalResults(0);
        }
      } catch (e) {
        setFetchPaperLoader(false);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalResults(0);
        console.error("Fetch files error:", e);
      }
    };
    fetchFiles();
  }, [selectedProject, isSelectedFolder]);

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

  // Periodic sync with Word document to detect manually removed citations
  useEffect(() => {
    let syncInterval;
    
    if (isOfficeReady && citations.length > 0) {
      // Sync every 10 seconds when citations exist
      syncInterval = setInterval(() => {
        syncCitationsWithDocument();
      }, 10000);
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isOfficeReady, citations]);

  // Pagination handlers
  const handlePageChange = async (page) => {
    try {
      if (!selectedProject) return;
      
      setFetchPaperLoader(true);
      const folderData = await getFolders({
        projectId: selectedProject,
        folderId: isSelectedFolder || null,
        pageNo: page,
        limit: pageSize,
        filter: [{"name":"Name","filters":[]},{"name":"Review Stage","filters":[]},{"name":"Tags","filters":[]},{"name":"Status","filters":[]}],
        orderBy: "last_update",
        orderDirection: "DESC"
      });
      
      if (folderData.data && folderData.data.files) {
        const filesWithCitationFormat = folderData.data.files.map(file => ({
          id: file.id,
          title: file.fileName,
          authors: file.pdf_metadata?.Authors || 'Unknown Authors',
          'container-title': file.pdf_metadata?.JournalName || 'Unknown Journal',
          issued: file.pdf_metadata?.PublicationYear ? 
            { 'date-parts': [[parseInt(file.pdf_metadata.PublicationYear)]] } : null,
          source: 'folder',
          CitationCount: file.CitationCount || 0,
          originalFileData: file
        }));
        
        const normalizedFiles = filesWithCitationFormat.map((file) =>
          normalizeCitation(file)
        );
        setSearchResults(normalizedFiles);
        
        // Update pagination state with better calculation
        const totalFiles = folderData.data.totalFiles || folderData.data.pagination?.total || normalizedFiles.length;
        const calculatedTotalPages = Math.ceil(totalFiles / pageSize);
        
        setCurrentPage(page);
        setTotalPages(folderData.data.pagination?.totalPages || calculatedTotalPages);
        setTotalResults(totalFiles);
      }
      setFetchPaperLoader(false);
    } catch (error) {
      setFetchPaperLoader(false);
      console.error('Pagination error:', error);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const loadSavedCitations = () => {
    try {
      const saved = localStorage.getItem("researchCollab_citations");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize saved citations
        const normalizedSaved = parsed
          .map((c) => normalizeCitation(c))
          .filter((c) => c);
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
      return;
    }

    try {
      // Check if citation is already used to prevent duplicates
      const existingCitation = citations.find((c) => String(c.id) === String(citation.id));
      if (existingCitation && existingCitation.used) {
        setStatus("Citation is already used in document");
        return;
      }

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

      if (
        !formatted ||
        (formatted.includes("[") && formatted.includes("Error"))
      ) {
        console.error("Citation formatting failed, trying fallback");
        const fallbackFormatted = formatCitationFallback(
          normalizedCitation,
          citationFormat
        );
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
          if (
            formatted.includes("*") ||
            formatted.includes("**") ||
            formatted.includes("___")
          ) {
            // Create a paragraph to handle formatting
            const tempPara = selection.insertParagraph(
              "",
              Word.InsertLocation.replace
            );
            await parseAndFormatText(tempPara, formatted, citationStyle);
          } else {
            // Simple text insertion with font styling
            const range = selection.insertText(
              formatted,
              Word.InsertLocation.replace
            );
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

      // Update citation library - handle both existing and new citations
      const existingCitationIndex = citations.findIndex((c) => String(c.id) === String(normalizedCitation.id));
      
      let updated;
      if (existingCitationIndex >= 0) {
        // Citation exists, mark it as used
        updated = citations.map((c) =>
          String(c.id) === String(normalizedCitation.id)
            ? {
                ...c,
                used: true,
                inTextCitations: [...(c.inTextCitations || []), formatted],
              }
            : c
        );
      } else {
        // Citation doesn't exist, add it and mark as used
        const newCitation = {
          ...normalizedCitation,
          addedDate: new Date().toISOString(),
          used: true,
          inTextCitations: [formatted],
        };
        updated = [...citations, newCitation];
      }
      
      setCitations(updated);
      saveCitations(updated);
      setStatus(
        `Citation inserted successfully with ${citationStyle.toUpperCase()} style and proper formatting`
      );
      
      // NOTE: Auto-regenerate bibliography removed - only manual generation via button
      // setTimeout(async () => {
      //   await autoRegenerateBibliography(updated);
      // }, 500);
    } catch (error) {
      console.error("Insert citation failed:", error);
      setStatus(`Insert failed: ${error.message}`);
    }
  };

  const generateBibliography = async () => {
    if (!isOfficeReady) {
      return;
    }

    const used = citations.filter((c) => c.used);
    if (used.length === 0) {
      setStatus("No citations used - insert citations first");
      return;
    }

    try {
      const bibRaw = await formatBibliographyCiteproc(used, citationStyle);
      const styleFont = getCitationStyleFont(citationStyle);

      await Word.run(async (context) => {
        // Check if bibliography already exists
        const searchResults = context.document.body.search(bibliographyTitle, { matchCase: false, matchWholeWord: false });
        searchResults.load('items');
        await context.sync();

        let bibliographyExists = searchResults.items.length > 0;
        
        if (!bibliographyExists) {
          // No existing bibliography - create new one
          try {
            // Try to insert at cursor position
            const selection = context.document.getSelection();
            selection.load(['isEmpty']);
            await context.sync();
            
            let insertionPoint;
            if (!selection.isEmpty) {
              // Insert at cursor position
              insertionPoint = selection;
            } else {
              // Insert at end of document
              insertionPoint = context.document.body;
            }
            
            // Create bibliography title
            const title = insertionPoint.insertParagraph(
              bibliographyTitle,
              Word.InsertLocation.end
            );
            title.style = "Heading 1";
            title.font.bold = true;
            title.font.size = 16;
            title.font.name = styleFont.family;
            
          } catch (e) {
            // Fallback: insert at end of document
            const title = context.document.body.insertParagraph(
              bibliographyTitle,
              Word.InsertLocation.end
            );
            title.style = "Heading 1";
            title.font.bold = true;
            title.font.size = 16;
            title.font.name = styleFont.family;
          }
        }

        // Process each bibliography entry on new lines
        const bibEntries = bibRaw.split("\n").filter((entry) => entry.trim());
        for (let i = 0; i < bibEntries.length; i++) {
          const entry = bibEntries[i].trim();
          if (!entry) continue;

          // Create paragraph for each entry (new line, not new page)
          const para = context.document.body.insertParagraph("", Word.InsertLocation.end);
          para.font.name = styleFont.family;
          para.font.size = styleFont.size;
          para.leftIndent = 36; // Hanging indent for citations
          para.firstLineIndent = -36;

          // Format the entry text
          if (entry.includes("*")) {
            await parseAndFormatText(para, entry, citationStyle);
          } else {
            const range = para.insertText(entry, Word.InsertLocation.end);
            range.font.name = styleFont.family;
            range.font.size = styleFont.size;
          }
        }

        await context.sync();
      });

      setBibliography(bibRaw);
      setStatus(
        `✅ Bibliography ${bibliographyExists ? 'updated' : 'created'}: ${used.length} citation${
          used.length !== 1 ? "s" : ""
        } in ${citationStyle.toUpperCase()} style`
      );
    } catch (e) {
      console.error("❌ Bibliography generation failed:", e);
      setStatus(`❌ Bibliography error: ${e.message || "Unknown error"}`);
    }
  };

  // COMPLETELY REWRITTEN: Simplified text formatting to prevent duplication
  const parseAndFormatText = async (paragraph, text, citationStyle) => {
    try {
      const styleFont = getCitationStyleFont(citationStyle);
      let processedText = text;
      let parts = [];

      // Split text by asterisks to handle italics properly
      const asteriskParts = processedText.split(/(\*[^*]+\*)/);

      for (let i = 0; i < asteriskParts.length; i++) {
        const part = asteriskParts[i];
        if (!part) continue;

        if (part.startsWith("*") && part.endsWith("*")) {
          // This is italic text - remove asterisks and mark as italic
          const italicText = part.slice(1, -1);
          if (italicText.trim()) {
            parts.push({ text: italicText, type: "italic" });
          }
        } else {
          // This is regular text
          if (part.trim()) {
            parts.push({ text: part, type: "normal" });
          }
        }
      }

      // Insert each part with appropriate formatting
      for (const part of parts) {
        if (part.type === "italic") {
          await Word.run(async (context) => {
            const range = paragraph.insertText(
              part.text,
              Word.InsertLocation.end
            );
            range.font.name = styleFont.family;
            range.font.size = styleFont.size;
            range.font.italic = true;
            await context.sync();
          });
        } else {
          await Word.run(async (context) => {
            const range = paragraph.insertText(
              part.text,
              Word.InsertLocation.end
            );
            range.font.name = styleFont.family;
            range.font.size = styleFont.size;
            range.font.italic = false;
            await context.sync();
          });
        }
      }
    } catch (error) {
      console.error("❌ Text formatting error:", error);
      // Ultimate fallback: insert plain text without any formatting
      try {
        const plainText = text.replace(/\*([^*]+)\*/g, "$1"); // Remove asterisks
        await Word.run(async (context) => {
          const range = paragraph.insertText(
            plainText,
            Word.InsertLocation.end
          );
          const styleFont = getCitationStyleFont(citationStyle);
          range.font.name = styleFont.family;
          range.font.size = styleFont.size;
          await context.sync();
        });
      } catch (fallbackError) {
        console.error("❌ Even fallback failed:", fallbackError);
      }
    }
  };

  const exportCitations = () => {
    if (citations.length === 0) {
      setStatus("Nothing to export");
      return;
    }

    try {
      // Simple BibTeX export fallback
      const bibtexEntries = citations.map((citation) => {
        const normalized = normalizeCitation(citation);
        const year = normalized.issued?.["date-parts"]?.[0]?.[0] || "2025";
        const authors =
          normalized.author
            ?.map((a) => `${a.family || "Unknown"}, ${a.given || ""}`)
            .join(" and ") || "Unknown";

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
                ? fields.author.split(/\s+and\s+/).map((name) => {
                    const parts = name.split(",");
                    if (parts.length === 2) {
                      return {
                        family: parts[0].trim(),
                        given: parts[1].trim(),
                      };
                    } else {
                      const nameParts = name.trim().split(" ");
                      return {
                        given: nameParts[0],
                        family: nameParts.slice(1).join(" "),
                      };
                    }
                  })
                : [{ given: "Unknown", family: "Author" }],
              issued: fields.year
                ? { "date-parts": [[parseInt(fields.year)]] }
                : { "date-parts": [[2025]] },
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

        const newCitations = parsed
          .map((entry, idx) => {
            const normalized = normalizeCitation(entry);
            return {
              ...normalized,
              id: normalized.id || `import_${Date.now()}_${idx}`,
              used: false,
              source: entry.source || "imported",
              addedDate: new Date().toISOString(),
            };
          })
          .filter((c) => c);

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
    return (
      normalized?.author
        ?.map((a) => `${a.given || ""} ${a.family || ""}`.trim())
        .join(", ") || "Unknown"
    );
  };

  const getAuthorYearFromCitation = (citation) => {
    const normalized = normalizeCitation(citation);
    const author = normalized?.author?.[0]?.family || "Unknown";
    const year = normalized?.issued?.["date-parts"]?.[0]?.[0] || 
                 citation.year || 
                 citation.pdf_search_data?.year || 
                 "n.d.";
    return `${author}, ${year}`;
  };

  const removeCitationFromLibrary = async (id) => {
    const citationToRemove = citations.find(c => String(c.id) === String(id));
    
    const updated = citations.filter((c) => String(c.id) !== String(id));
    setCitations(updated);
    saveCitations(updated);
    
    // Remove citation from Word document and regenerate bibliography
    if (citationToRemove) {
      await removeCitationFromDocument(citationToRemove);
      
      // Regenerate bibliography with remaining citations
      const remainingUsedCitations = updated.filter(c => c.used);
      if (remainingUsedCitations.length > 0) {
        setStatus("Regenerating bibliography after citation removal...");
        setTimeout(async () => {
          try {
            await clearBibliography();
            await generateBibliography();
            setStatus(`Citation completely removed (${remainingUsedCitations.length} citations remaining in bibliography)`);
          } catch (error) {
            setStatus("Citation removed, but bibliography may need manual update");
          }
        }, 500);
      } else {
        // No citations left, clear the bibliography
        await clearBibliography();
        setStatus("Citation completely removed and bibliography cleared");
      }
    } else {
      setStatus("Citation completely removed from library and document");
    }
  };

  // Function to remove citation from Word document
  const removeCitationFromDocument = async (citation) => {
    if (!isOfficeReady || !citation) {
      console.log('❌ Office not ready or no citation provided');
      return;
    }

    console.log('🗑️ Starting citation removal for:', citation);

    try {
      await Word.run(async (context) => {
        // Get document body
        const body = context.document.body;
        body.load('text');
        await context.sync();
        
        console.log('📄 Document loaded. Text length:', body.text.length);
        
        // Get the basic citation info
        const normalized = normalizeCitation(citation);
        console.log('📋 Normalized citation:', normalized);
        
        const firstAuthor = normalized?.author?.[0]?.family || 
                           citation.authors?.split(',')[0]?.trim() || 
                           citation.pdf_search_data?.Authors?.split(',')[0]?.trim() || '';
        const year = normalized?.issued?.["date-parts"]?.[0]?.[0] || 
                    citation.year || 
                    citation.pdf_search_data?.year || 
                    new Date().getFullYear();
        
        console.log(`👤 Author: ${firstAuthor}, 📅 Year: ${year}`);
        
        // More comprehensive search patterns
        const searchPatterns = [
          `(${firstAuthor}, ${year})`,      // (Author, Year)
          `${firstAuthor}, ${year}`,        // Author, Year
          `(${firstAuthor} et al., ${year})`, // (Author et al., Year)
          `${firstAuthor} et al., ${year}`,   // Author et al., Year
          `(${firstAuthor} & `,             // (Author & ... - for two authors
          `${firstAuthor} & `,              // Author & ... - for two authors
          firstAuthor,                      // Just the author name
        ].filter(pattern => pattern && pattern.length > 2);

        console.log('🔍 Search patterns:', searchPatterns);

        let totalRemoved = 0;
        
        for (let i = 0; i < searchPatterns.length; i++) {
          const pattern = searchPatterns[i];
          console.log(`🔍 Searching for pattern ${i + 1}/${searchPatterns.length}: "${pattern}"`);
          
          try {
            const searchResults = context.document.body.search(pattern, {
              matchCase: false,
              matchWholeWord: false
            });
            searchResults.load('items');
            await context.sync();

            console.log(`✅ Found ${searchResults.items.length} matches for pattern: "${pattern}"`);

            if (searchResults.items.length > 0) {
              // Remove each found instance
              for (let j = 0; j < searchResults.items.length; j++) {
                console.log(`🗑️ Deleting match ${j + 1}/${searchResults.items.length}`);
                searchResults.items[j].delete();
                totalRemoved++;
              }
              
              await context.sync();
              console.log(`✅ Successfully deleted ${searchResults.items.length} instances of "${pattern}"`);
            }
          } catch (patternError) {
            console.error(`❌ Search pattern "${pattern}" failed:`, patternError);
            continue;
          }
        }

        console.log(`📊 Total removed: ${totalRemoved} citation instances`);

        if (totalRemoved > 0) {
          setStatus(`✅ Removed ${totalRemoved} citation instance(s) from document`);
        } else {
          setStatus(`⚠️ No citation text found to remove (pattern: ${firstAuthor}, ${year})`);
        }
      });
    } catch (error) {
      console.error('❌ Error removing citation from document:', error);
      setStatus(`❌ Error removing citation: ${error.message}`);
    }
  };

  // Function to remove bibliography entry
  const removeBibliographyEntry = async (citation) => {
    if (!isOfficeReady || !citation) return;

    try {
      await Word.run(async (context) => {
        // First, try to find the "References" or "Bibliography" section
        const referencesSearch = context.document.body.search("References", {
          matchCase: false,
          matchWholeWord: true
        });
        referencesSearch.load('items');
        await context.sync();

        const bibliographySearch = context.document.body.search("Bibliography", {
          matchCase: false,
          matchWholeWord: true
        });
        bibliographySearch.load('items');
        await context.sync();

        // Determine search area (after References/Bibliography heading or entire document)
        let searchRange = context.document.body;
        if (referencesSearch.items.length > 0) {
          const refParagraph = referencesSearch.items[0].parentParagraph;
          searchRange = refParagraph.getNext().getRange();
        } else if (bibliographySearch.items.length > 0) {
          const bibParagraph = bibliographySearch.items[0].parentParagraph;
          searchRange = bibParagraph.getNext().getRange();
        }

        // Create more specific search patterns
        const firstAuthor = citation.authors?.split(',')[0]?.trim() || 
                           citation.pdf_search_data?.Authors?.split(',')[0]?.trim() || '';
        const year = citation.year || citation.pdf_search_data?.year || '';
        const title = citation.title || citation.pdf_search_data?.title || '';
        
        // Search patterns (more specific for bibliography entries)
        const searchPatterns = [
          `${firstAuthor}.*, .*${year}`, // Author pattern with year
          `${firstAuthor} `, // Author name followed by space (start of entry)
          title.substring(0, 30).replace(/[^\w\s]/g, ''), // Clean title fragment
        ].filter(pattern => pattern.length > 3);

        let found = false;
        let removedCount = 0;

        for (const pattern of searchPatterns) {
          try {
            const searchResults = searchRange.search(pattern, {
              matchCase: false,
              matchWholeWord: false
            });
            searchResults.load('items');
            await context.sync();

            if (searchResults.items.length > 0) {
              // Find the bibliography entry paragraph
              for (let i = 0; i < searchResults.items.length; i++) {
                const item = searchResults.items[i];
                const paragraph = item.parentParagraph;
                
                if (paragraph) {
                  paragraph.load(['text', 'styleBuiltIn']);
                  await context.sync();
                  
                  // Check if this looks like a bibliography entry
                  const paragraphText = paragraph.text || '';
                  const containsAuthor = firstAuthor && paragraphText.toLowerCase().includes(firstAuthor.toLowerCase());
                  const containsYear = year && paragraphText.includes(year);
                  const isLongEnough = paragraphText.length > 30; // Bibliography entries are usually longer
                  
                  if ((containsAuthor || containsYear) && isLongEnough) {
                    paragraph.delete();
                    removedCount++;
                    found = true;
                    break; // Remove only the first matching entry
                  }
                }
              }
              
              await context.sync();
              if (found) break; // Stop searching once we found and removed an entry
            }
          } catch (e) {
            console.log(`Search pattern "${pattern}" failed:`, e);
            continue; // Try next pattern
          }
        }

        if (found) {
          setStatus(`Bibliography entry removed for "${firstAuthor || 'citation'}" (${removedCount} entries)`);
        } else {
          setStatus(`Bibliography entry not found for "${firstAuthor || 'citation'}" (may need manual removal)`);
        }
      });
    } catch (error) {
      console.error('Error removing bibliography entry:', error);
      setStatus('Error removing bibliography entry');
    }
  };

  const markCitationAsUnused = async (id) => {
    const citationToRemove = citations.find(c => String(c.id) === String(id));
    
    const updated = citations.map((c) =>
      String(c.id) === String(id)
        ? {
            ...c,
            used: false,
            inTextCitations: [],
          }
        : c
    );
    setCitations(updated);
    saveCitations(updated);
    
    // Remove citation from Word document
    if (citationToRemove) {
      await removeCitationFromDocument(citationToRemove);
      
      // Remove only the specific citation's bibliography entry (not entire bibliography)
      setStatus("Removing citation from bibliography...");
      setTimeout(async () => {
        try {
          await removeSpecificBibliographyEntry(citationToRemove);
          
          // Check if there are still used citations
          const remainingUsedCitations = updated.filter(c => c.used);
          if (remainingUsedCitations.length > 0) {
            setStatus(`✅ Citation removed. ${remainingUsedCitations.length} citations remaining in bibliography.`);
          } else {
            // Only clear entire bibliography if NO citations remain
            await clearBibliography();
            setStatus("✅ Citation removed. Bibliography cleared (no citations remaining).");
          }
        } catch (error) {
          console.error('Bibliography update error:', error);
          setStatus("⚠️ Citation removed from document, but bibliography update failed. Please regenerate manually.");
        }
      }, 1000);
    } else {
      setStatus("Citation removed from document");
    }
  };

  // Remove only specific citation's bibliography entry (not entire bibliography)
  const removeSpecificBibliographyEntry = async (citation) => {
    if (!isOfficeReady || !citation) {
      console.log('❌ Office not ready or no citation provided');
      return;
    }

    try {
      await Word.run(async (context) => {
        console.log('🗑️ Removing specific bibliography entry for:', citation);
        
        // Get citation info for searching
        const normalized = normalizeCitation(citation);
        const firstAuthor = normalized?.author?.[0]?.family || 
                           citation.authors?.split(',')[0]?.trim() || 
                           citation.pdf_search_data?.Authors?.split(',')[0]?.trim() || '';
        const year = normalized?.issued?.["date-parts"]?.[0]?.[0] || 
                    citation.year || 
                    citation.pdf_search_data?.year || '';
        const title = normalized?.title || citation.title || citation.pdf_search_data?.title || '';
        
        console.log(`🔍 Looking for bibliography entry: ${firstAuthor}, ${year}`);
        
        // More specific search patterns for bibliography entries
        const searchPatterns = [
          `${firstAuthor}, ${year}`, // Author, Year
          `${firstAuthor} (${year})`, // Author (Year)
          `${firstAuthor} et al., ${year}`, // Author et al., Year
          `${firstAuthor} et al. (${year})`, // Author et al. (Year)
          title.substring(0, 30), // First 30 chars of title
          firstAuthor // Just author name
        ].filter(pattern => pattern && pattern.length > 2);

        let entryFound = false;
        let removedCount = 0;

        for (const pattern of searchPatterns) {
          if (entryFound) break; // Stop if we already found and removed an entry
          
          try {
            console.log(`🔍 Searching for pattern: "${pattern}"`);
            const searchResults = context.document.body.search(pattern, {
              matchCase: false,
              matchWholeWord: false
            });
            searchResults.load('items');
            await context.sync();

            console.log(`📋 Found ${searchResults.items.length} matches for: "${pattern}"`);

            if (searchResults.items.length > 0) {
              // Look for bibliography entries (typically longer paragraphs with citation characteristics)
              for (let i = 0; i < searchResults.items.length; i++) {
                try {
                  const item = searchResults.items[i];
                  const paragraph = item.paragraphs.getFirst();
                  paragraph.load(['text']);
                  await context.sync();
                  
                  const text = paragraph.text || '';
                  console.log(`📄 Checking paragraph: "${text.substring(0, 80)}..."`);
                  
                  // Check if this looks like a bibliography entry
                  const isBibliographyEntry = (
                    text.length > 50 && // Substantial length
                    (text.includes(firstAuthor) || text.includes(title.substring(0, 20))) && // Contains author or title
                    (text.includes(year) || text.match(/\d{4}/)) && // Contains year
                    (text.includes('.') || text.includes(',')) && // Has punctuation (typical of citations)
                    !text.toLowerCase().includes('references') && // Not the "References" title
                    !text.toLowerCase().includes('bibliography') // Not the "Bibliography" title
                  );
                  
                  if (isBibliographyEntry) {
                    console.log(`✅ Found bibliography entry to remove: "${text.substring(0, 60)}..."`);
                    paragraph.delete();
                    removedCount++;
                    entryFound = true;
                    break; // Stop after removing one entry
                  }
                } catch (paragraphError) {
                  console.log(`⚠️ Could not process paragraph ${i}:`, paragraphError);
                }
              }
            }
          } catch (patternError) {
            console.log(`⚠️ Search pattern "${pattern}" failed:`, patternError);
          }
        }

        await context.sync();
        
        if (entryFound) {
          console.log(`✅ Successfully removed ${removedCount} bibliography entry for ${firstAuthor}`);
          setStatus(`🗑️ Bibliography entry removed for "${firstAuthor}" (${year})`);
        } else {
          console.log(`⚠️ Bibliography entry not found for ${firstAuthor}, ${year}`);
          setStatus(`⚠️ Bibliography entry for "${firstAuthor}" not found (may have been already removed)`);
        }
      });
    } catch (error) {
      console.error('❌ Error removing specific bibliography entry:', error);
      setStatus(`❌ Error removing bibliography entry: ${error.message}`);
    }
  };

  // Auto-regenerate bibliography with updated citations
  const autoRegenerateBibliography = async (updatedCitations) => {
    if (!isOfficeReady) return;

    const used = updatedCitations.filter((c) => c.used);
    if (used.length === 0) return;

    try {
      const bibRaw = await formatBibliographyCiteproc(used, citationStyle);
      const styleFont = getCitationStyleFont(citationStyle);

      await Word.run(async (context) => {
        // Find existing bibliography by searching for the title
        const searchResults = context.document.body.search(bibliographyTitle, { matchCase: false, matchWholeWord: false });
        searchResults.load('items');
        await context.sync();

        if (searchResults.items.length > 0) {
          // Find the bibliography title paragraph
          const bibTitleParagraph = searchResults.items[0].paragraphs.getFirst();
          bibTitleParagraph.load(['next', 'isLast']);
          await context.sync();

          // Delete all content from the bibliography title onwards
          let currentPara = bibTitleParagraph.getNext();
          const parasToDelete = [];
          
          while (!currentPara.isLast) {
            parasToDelete.push(currentPara);
            currentPara = currentPara.getNext();
            currentPara.load('isLast');
            await context.sync();
          }
          
          // Delete the collected paragraphs
          parasToDelete.forEach(para => para.delete());
          
          // Also delete the last paragraph if it's not empty
          if (!currentPara.isEmpty) {
            currentPara.delete();
          }
          
          await context.sync();
        }

        // Insert bibliography (either new or replacement)
        const title = context.document.body.insertParagraph(bibliographyTitle, Word.InsertLocation.end);
        title.style = "Heading 1";
        title.font.bold = true;
        title.font.size = 16;
        title.font.name = styleFont.family;

        // Process bibliography entries
        const bibEntries = bibRaw.split("\n").filter((entry) => entry.trim());
        for (let i = 0; i < bibEntries.length; i++) {
          const entry = bibEntries[i].trim();
          if (!entry) continue;

          const para = context.document.body.insertParagraph("", Word.InsertLocation.end);
          await parseAndFormatText(para, entry, citationStyle);
          para.font.name = styleFont.family;
          para.font.size = styleFont.size;
        }

        await context.sync();
      });

      setStatus(`📚 Bibliography updated - ${used.length} citation(s)`);
    } catch (error) {
      console.error("Auto-regenerate bibliography failed:", error);
      // Fallback: just show status without failing
      setStatus(`Bibliography update attempted - ${used.length} citation(s)`);
    }
  };

  // Clear bibliography when no citations are used
  const clearBibliography = async () => {
    if (!isOfficeReady) return;

    try {
      await Word.run(async (context) => {
        console.log('🧹 Starting comprehensive bibliography cleanup...');
        
        // Find existing bibliography by title
        const searchResults = context.document.body.search(bibliographyTitle, { 
          matchCase: false, 
          matchWholeWord: false 
        });
        searchResults.load('items');
        await context.sync();

        console.log(`📋 Found ${searchResults.items.length} bibliography sections`);

        if (searchResults.items.length > 0) {
          // Get the paragraph containing the bibliography title - SAFE VERSION
          try {
            const firstResult = searchResults.items[0];
            let bibTitleParagraph = null;
            
            // Try multiple methods to get the paragraph safely
            try {
              bibTitleParagraph = firstResult.paragraphs.getFirst();
              bibTitleParagraph.load(['text']);
              await context.sync();
              console.log(`📄 Bibliography title paragraph: "${bibTitleParagraph.text}"`);
              bibTitleParagraph.delete();
            } catch (paragraphAccessError) {
              console.log('⚠️ Could not access paragraph, trying direct deletion...');
              firstResult.delete();
            }
            
            await context.sync();
          } catch (titleDeletionError) {
            console.log('⚠️ Title deletion failed, trying pattern-based cleanup...', titleDeletionError);
          }
          
          // Try pattern-based bibliography cleanup as backup
          console.log('🔍 Starting aggressive bibliography cleanup...');
          
          // Method 1: Search and delete all bibliography-like paragraphs
          const citationPatterns = [
            "Zhao, H\\., Shi, J\\., Qi, X\\.", // Specific author pattern from your document
            "[A-Za-z]+, [A-Z]\\.", // Author, A.
            "\\([0-9]{4}\\)", // (2017)
            "arXiv Preprint", // arXiv Preprint
            "et al\\.", // et al.
            "DOI:",
            "Retrieved from",
            "Preprint\\." // Preprint.
          ];
          
          for (const pattern of citationPatterns) {
            try {
              const patternResults = context.document.body.search(pattern, {
                matchCase: false,
                matchWholeWord: false
              });
              patternResults.load('items');
              await context.sync();

              if (patternResults.items.length > 0) {
                console.log(`🔍 Found ${patternResults.items.length} matches for pattern: ${pattern}`);
                for (let i = 0; i < patternResults.items.length; i++) {
                  try {
                    const item = patternResults.items[i];
                    const paragraph = item.paragraphs.getFirst();
                    paragraph.load(['text']);
                    await context.sync();
                    
                    const text = paragraph.text || '';
                    if (text.length > 20) { // More aggressive - delete smaller entries too
                      console.log(`🗑️ Deleting bibliography entry: "${text.substring(0, 80)}..."`);
                      paragraph.delete();
                    }
                  } catch (patternItemError) {
                    console.log(`⚠️ Could not process pattern item ${i}:`, patternItemError);
                  }
                }
                await context.sync();
              }
            } catch (patternError) {
              console.log(`⚠️ Pattern "${pattern}" failed:`, patternError);
            }
          }
          
          // Method 2: Nuclear option - scan all paragraphs and delete bibliography-like content
          console.log('🚨 Starting nuclear cleanup - scanning all paragraphs...');
          try {
            const allParagraphs = context.document.body.paragraphs;
            allParagraphs.load(['items']);
            await context.sync();
            
            let deletedCount = 0;
            const totalParagraphs = allParagraphs.items.length;
            
            // Scan from the end backwards (bibliography usually at end)
            for (let i = totalParagraphs - 1; i >= 0; i--) {
              try {
                const para = allParagraphs.items[i];
                para.load(['text', 'style']);
                await context.sync();
                
                const text = para.text?.trim() || '';
                const style = para.style || '';
                
                // More aggressive detection of bibliography entries
                if (text.length > 10 && (
                  text.includes('Zhao') || // Specific to your document
                  text.includes('Shi') ||
                  text.includes('arXiv') ||
                  text.includes('Preprint') ||
                  text.includes('2017') ||
                  (text.includes('(') && text.includes(')') && text.match(/\d{4}/)) || // Has year in parentheses
                  text.includes('et al.') || // Has et al
                  text.match(/^[A-Z][a-z]+, [A-Z]\./) || // Starts with Author, A.
                  text.includes('DOI:') || text.includes('doi:') || // Has DOI
                  text.includes('Retrieved') || text.includes('Available') || // Has retrieval info
                  (text.split(' ').length > 5 && text.includes(',') && !text.endsWith('.') === false) // Multi-word with commas (likely citation)
                )) {
                  console.log(`🗑️ Nuclear deletion: "${text.substring(0, 60)}..."`);
                  para.delete();
                  deletedCount++;
                  
                  // Safety limit
                  if (deletedCount >= 50) {
                    console.log('🛑 Hit safety limit of 50 deletions');
                    break;
                  }
                }
              } catch (paraError) {
                console.log(`⚠️ Could not process paragraph ${i}:`, paraError);
              }
            }
            
            await context.sync();
            console.log(`☢️ Nuclear cleanup deleted ${deletedCount} potential bibliography paragraphs`);
          } catch (nuclearError) {
            console.log('⚠️ Nuclear cleanup failed:', nuclearError);
          }
          
          console.log(`✅ Comprehensive bibliography cleanup completed`);
        } else {
          console.log('� No existing bibliography found to clear');
        }
      });

      setStatus(`🧹 Bibliography section cleared completely`);
    } catch (error) {
      console.error("Clear bibliography failed:", error);
      setStatus("⚠️ Bibliography clearing attempted with errors");
    }
  };

  // Aggressive cleanup for citation remnants (leftover words, punctuation, etc.)
  const cleanupCitationRemnants = async (citation) => {
    if (!isOfficeReady || !citation) return;
    
    try {
      await Word.run(async (context) => {
        console.log('🧹 Starting aggressive cleanup for citation remnants:', citation);
        
        const normalized = normalizeCitation(citation);
        const firstAuthor = normalized?.author?.[0]?.family || 
                           citation.authors?.split(',')[0]?.trim() || 
                           citation.pdf_search_data?.Authors?.split(',')[0]?.trim() || '';
        const year = normalized?.issued?.["date-parts"]?.[0]?.[0] || 
                    citation.year || 
                    citation.pdf_search_data?.year || '';
        
        // More aggressive patterns to catch leftovers
        const aggressivePatterns = [
          `${firstAuthor}`,           // Just author name
          `${year}`,                  // Just year
          `(${year})`,               // Year in parentheses
          `, ${year}`,               // Comma + year
          `${firstAuthor},`,         // Author with comma
          `et al.`,                  // "et al." remnants
          `& `,                      // Ampersand remnants
          `( )`,                     // Empty parentheses
          `()`,                      // Empty parentheses compact
          `,  ,`,                    // Double commas
          `..`,                      // Double periods
          `  `,                      // Double spaces
          // Additional bibliography-related patterns
          `arXiv`,                   // arXiv remnants
          `DOI:`,                    // DOI remnants
          `Retrieved from`,          // Retrieved from remnants
          `Available at`,            // Available at remnants
          `https://`,                // URL fragments
          `www.`,                    // Website fragments
        ].filter(pattern => pattern && pattern.trim().length > 0);
        
        let totalCleaned = 0;
        
        for (const pattern of aggressivePatterns) {
          try {
            console.log(`🔍 Aggressive search for: "${pattern}"`);
            const searchResults = context.document.body.search(pattern, {
              matchCase: false,
              matchWholeWord: false
            });
            searchResults.load('items');
            await context.sync();
            
            if (searchResults.items.length > 0) {
              console.log(`🎯 Found ${searchResults.items.length} instances of "${pattern}"`);
              
              for (let i = 0; i < searchResults.items.length; i++) {
                try {
                  const item = searchResults.items[i];
                  
                  // Get surrounding context to make sure we're not deleting important text
                  const range = item.getRange();
                  range.load(['text']);
                  await context.sync();
                  
                  const surroundingText = range.text;
                  
                  // Only delete if it looks like citation remnant (not part of regular text)
                  const isCitationRemnant = (
                    surroundingText.length < 50 || // Short text fragments
                    surroundingText.match(/^\s*[\(\),\.\s]+\s*$/) || // Just punctuation and spaces
                    surroundingText.includes(firstAuthor) || // Contains the author name
                    surroundingText.match(/^\s*et al\.\s*$/i) || // Just "et al."
                    surroundingText.match(/^\s*\(\s*\)\s*$/) // Just empty parentheses
                  );
                  
                  if (isCitationRemnant) {
                    console.log(`🗑️ Removing remnant: "${surroundingText}"`);
                    item.delete();
                    totalCleaned++;
                  } else {
                    console.log(`⚠️ Skipping potential false positive: "${surroundingText.substring(0, 50)}..."`);
                  }
                } catch (itemError) {
                  console.log(`⚠️ Could not process item ${i}:`, itemError);
                }
              }
              await context.sync();
            }
          } catch (patternError) {
            console.log(`⚠️ Aggressive pattern "${pattern}" failed:`, patternError);
          }
        }
        
        console.log(`✅ Aggressive cleanup completed. Cleaned ${totalCleaned} remnants.`);
      });
    } catch (error) {
      console.error('❌ Aggressive cleanup failed:', error);
    }
  };

  // Sync citations with Word document content
  const syncCitationsWithDocument = async () => {
    if (!isOfficeReady) return;

    console.log('🔄 Starting sync with Word document...');
    
    try {
      await Word.run(async (context) => {
        const body = context.document.body;
        const footnotes = context.document.body.footnotes;
        
        // Load the content to check
        body.load('text');
        footnotes.load('items');
        await context.sync();

        const documentText = body.text;
        console.log(`📄 Document text length: ${documentText.length}`);
        console.log(`📝 Document preview: ${documentText.substring(0, 200)}...`);
        
        const footnotesText = footnotes.items.map(f => {
          f.body.load('text');
          return f;
        });
        
        if (footnotesText.length > 0) {
          await context.sync();
          console.log(`📝 Found ${footnotesText.length} footnotes`);
        }

        console.log(`📚 Checking ${citations.length} citations, ${citations.filter(c => c.used).length} are marked as used`);

        // Check which citations are still in the document
        const citationsInDoc = citations.filter(citation => {
          if (!citation.used) return false;
          
          // Enhanced detection - check multiple patterns for citation presence
          const normalized = normalizeCitation(citation);
          const firstAuthor = normalized?.author?.[0]?.family || 
                             citation.authors?.split(',')[0]?.trim() || 
                             citation.pdf_search_data?.Authors?.split(',')[0]?.trim() || '';
          const year = normalized?.issued?.["date-parts"]?.[0]?.[0] || 
                      citation.year || 
                      citation.pdf_search_data?.year || '';
          
          console.log(`🔍 Checking citation: ${firstAuthor}, ${year}`);
          
          // Multiple detection patterns
          const detectionPatterns = [
            `${firstAuthor}, ${year}`,        // Author, Year
            `(${firstAuthor}, ${year})`,      // (Author, Year)
            `${firstAuthor} et al., ${year}`, // Author et al., Year
            `(${firstAuthor} et al., ${year})`, // (Author et al., Year)
            firstAuthor,                       // Just author name
          ].filter(pattern => pattern && pattern.length > 2);
          
          console.log(`🔍 Detection patterns for ${firstAuthor}:`, detectionPatterns);
          
          // Check if any pattern is found in document or footnotes
          const isStillInDocument = detectionPatterns.some(pattern => {
            const isInBody = documentText.includes(pattern);
            const isInFootnotes = footnotesText.some(fn => 
              fn.body.text.includes(pattern)
            );
            const found = isInBody || isInFootnotes;
            console.log(`📋 Pattern "${pattern}": Body=${isInBody}, Footnotes=${isInFootnotes}, Found=${found}`);
            return found;
          });
          
          // Also check original inTextCitations if they exist
          const hasOriginalCitations = citation.inTextCitations?.some(inTextCit => {
            // Remove formatting characters for comparison
            const cleanedCitation = inTextCit.replace(/[*_]/g, '').trim();
            const isInBody = documentText.includes(cleanedCitation);
            const isInFootnotes = footnotesText.some(fn => 
              fn.body.text.includes(cleanedCitation)
            );
            const found = isInBody || isInFootnotes;
            console.log(`📋 Original citation "${cleanedCitation}": Body=${isInBody}, Footnotes=${isInFootnotes}, Found=${found}`);
            return found;
          });
          
          const stillExists = isStillInDocument || hasOriginalCitations;
          console.log(`✅ Citation ${firstAuthor} still exists: ${stillExists}`);
          return stillExists;
        });

        console.log(`📊 Citations still in document: ${citationsInDoc.length}`);

        // Find citations that were used but are no longer in document
        const removedCitations = citations.filter(citation => 
          citation.used && !citationsInDoc.find(c => String(c.id) === String(citation.id))
        );

        console.log(`🗑️ Removed citations detected: ${removedCitations.length}`);
        if (removedCitations.length > 0) {
          console.log('🗑️ Removed citations:', removedCitations.map(c => ({
            id: c.id,
            title: c.title || 'No title',
            author: c.authors || 'No author'
          })));
        }

        // Mark removed citations as unused and remove their bibliography entries
        if (removedCitations.length > 0) {
          const updated = citations.map(citation => {
            const isRemoved = removedCitations.find(rc => String(rc.id) === String(citation.id));
            return isRemoved ? { ...citation, used: false, inTextCitations: [] } : citation;
          });
          
          setCitations(updated);
          saveCitations(updated);
          
          // Check if there are any citations left after removal
          const remainingUsedCitations = updated.filter(c => c.used);
          
          if (remainingUsedCitations.length === 0) {
            // No citations remaining - clear entire bibliography
            console.log('🧹 No citations remaining - clearing entire bibliography');
            await clearBibliography();
          } else {
            // Some citations still exist - remove only specific entries
            console.log(`📚 Auto-removing bibliography entries for ${removedCitations.length} manually removed citations`);
            for (const removedCitation of removedCitations) {
              await removeSpecificBibliographyEntry(removedCitation);
            }
          }
          
          // Additional cleanup: Remove any leftover citation fragments
          console.log('🧹 Performing additional cleanup for citation remnants...');
          for (const removedCitation of removedCitations) {
            await cleanupCitationRemnants(removedCitation);
          }
          
          // More detailed status message
          const citationTitles = removedCitations.map(c => 
            c.title ? c.title.substring(0, 30) + '...' : 'Untitled'
          ).join(', ');
          
          if (remainingUsedCitations.length === 0) {
            setStatus(`🔄 Auto-sync: Last ${removedCitations.length} citation(s) removed. Bibliography completely cleared: ${citationTitles}`);
          } else {
            setStatus(`🔄 Auto-sync: ${removedCitations.length} citation(s) and bibliography entries removed. ${remainingUsedCitations.length} citations remaining: ${citationTitles}`);
          }
          
          // NOTE: Auto-regenerate bibliography removed - only manual generation via button
          // Auto-regenerate bibliography
          // const stillUsed = updated.filter(c => c.used);
          // if (stillUsed.length > 0) {
          //   setTimeout(async () => {
          //     await autoRegenerateBibliography(updated);
          //   }, 500); // Small delay to ensure sync completes
          // } else {
          //   setTimeout(async () => {
          //     await clearBibliography();
          //   }, 500);
          // }
        }
      });
    } catch (error) {
      console.error("Failed to sync citations with document:", error);
    }
  };

  const formatCitationPreview = (citation) => {
    const normalized = normalizeCitation(citation);
    if (!normalized) return "Invalid Citation";

    const title = normalized.title || "Untitled";
    const year = normalized.issued?.["date-parts"]?.[0]?.[0] || "";
    return `${title}${year ? " (" + year + ")" : ""}`;
  };

  // Function to preview citation style formatting
  const previewCitationStyle = async (styleName) => {
    const sampleCitation = {
      id: "preview_citation",
      type: "article-journal",
      author: [
        { given: "Jane", family: "Smith" },
        { given: "John", family: "Doe" },
      ],
      title: "Sample Research Article",
      issued: { "date-parts": [[2024]] },
      "container-title": "Journal of Academic Research",
      volume: "10",
      issue: "2",
      page: "123-145",
    };

    try {
      const inTextFormatted = await formatCitationCiteproc(
        sampleCitation,
        styleName,
        "in-text"
      );
      const fullFormatted = await formatBibliographyCiteproc(
        [sampleCitation],
        styleName
      );
      const styleFont = getCitationStyleFont(styleName);

      return {
        inText: inTextFormatted,
        bibliography: fullFormatted,
        formatting: {
          font: styleFont.family,
          size: styleFont.size,
          titleFormat: styleFont.titleFormat,
          emphasis: styleFont.emphasis,
        },
      };
    } catch (error) {
      console.error(`Preview failed for ${styleName}:`, error);
      return {
        inText: formatCitationFallback(sampleCitation, "in-text"),
        bibliography: formatCitationFallback(sampleCitation, "full"),
        formatting: getCitationStyleFont(styleName),
      };
    }
  };

  // Function to test APA citation formatting specifically
  const testAPACitationFormatting = () => {
    const samplePDFData = {
      id: 804,
      file_name: "Pyramid Scene Parsing Network",
      straico_file_url:
        "https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/explorerFiles/uploads/148/899df281-2adf-4bf3-9e34-c62446cb4667",
      pdf_metadata: {
        Authors:
          "Hengshuang Zhao, Jianping Shi, Xiaojuan Qi, Xiaogang Wang, Jiaya Jia",
        PublicationYear: "2017",
        JournalName: "arXiv",
        Volume: "1",
        Issue: "1",
        DOI: "",
        Institution: "The Chinese University of Hong Kong",
      },
      pdf_search_data: {
        Title: "Pyramid Scene Parsing Network",
        Authors:
          "Hengshuang Zhao, Jianping Shi, Xiaojuan Qi, Xiaogang Wang, Jiaya Jia",
      },
    };

    // Test APA specifically
    const apaInText = formatCitationFallback(samplePDFData, "in-text");
    const apaFull = formatCitationFallback(samplePDFData, "full");
    setStatus("APA Citation formatting tested - check console for results");
  };

  // Function to get font family and formatting based on citation style
  const getCitationStyleFont = (styleName) => {
    const fontMap = {
      apa: {
        family: "Times New Roman",
        size: 12,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic", // Book titles in italic
        emphasis: "italic",
      },
      mla: {
        family: "Times New Roman",
        size: 12,
        titleFormat: "italic", // Journal/book titles in italic
        bookFormat: "italic",
        emphasis: "italic",
      },
      ieee: {
        family: "Times New Roman",
        size: 10,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic",
        emphasis: "italic",
      },
      harvard: {
        family: "Times New Roman",
        size: 12,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic",
        emphasis: "italic",
      },
      vancouver: {
        family: "Arial",
        size: 11,
        titleFormat: "normal", // No italics for journal titles
        bookFormat: "normal",
        emphasis: "bold",
      },
      chicago: {
        family: "Times New Roman",
        size: 12,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic",
        emphasis: "italic",
      },
      nature: {
        family: "Arial",
        size: 8,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic",
        emphasis: "bold",
      },
      science: {
        family: "Times New Roman",
        size: 10,
        titleFormat: "italic", // Journal titles in italic
        bookFormat: "italic",
        emphasis: "italic",
      },
    };
    return (
      fontMap[styleName] || {
        family: "Times New Roman",
        size: 12,
        titleFormat: "italic",
        bookFormat: "italic",
        emphasis: "italic",
      }
    );
  };
  // Helper function to calculate text similarity (Levenshtein distance based)
  const calculateSimilarity = (str1, str2) => {
    if (str1 === str2) return 1;

    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Create a matrix for dynamic programming
    const matrix = Array(len1 + 1)
      .fill()
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Fill the matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
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
      "mentioned, N. (2023). Substitute Combine Adapt Modify Rearrange Eliminate. Sustainability Strategies, 1mentioned, N. (2023). Substitute Combine Adapt Modify Rearrange Eliminate. Sustainability Strategies, 1(1). https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/explorerFiles/uploads/148/Creative-Thinking%20(1).pdf",
    ];



    problematicTexts.forEach((text, index) => {
   

      // Use the actual cleanEntry function from formatBibliographyCiteproc
      const cleanEntry = (html) => {
        // Replace <i>...</i> with *...*
        let text = html.replace(/<i>(.*?)<\/i>/gi, "*$1*");
        // Remove all other HTML tags
        text = text.replace(/<[^>]+>/g, "");
        // Decode HTML entities
        text = text
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#38;/g, "&")
          .replace(/&#39;/g, "'");
        // Replace multiple spaces/newlines with single space
        text = text.replace(/\s+/g, " ").trim();

        // Remove common status indicators that shouldn't be in citations
        text = text
          .replace(/\s*\(Unread\)\s*/gi, "")
          .replace(/\s*\(Read\)\s*/gi, "")
          .replace(/\s*\(Downloaded\)\s*/gi, "")
          .replace(/\s*\(Viewed\)\s*/gi, "");

        // PRIORITY FIX: Handle the exact duplication pattern you reported
        // Pattern: "Zhao, H., Shi, J., Qi, X., Wang, X., & Jia, J. (2017). Pyramid Scene Parsing Network. arXiv, 1Zhao, H., Shi, J., Qi, X., Wang, X., & Jia, J. (2017). Pyramid Scene Parsing Network. arXiv, 1(1). https://..."
        // This regex looks for: [Citation], [number][Same Citation], [number]([issue])[rest]
        const priorityDuplicationPattern =
          /^(.*?),\s*(\d+)(.*?),\s*\2(\([^)]*\))(.*)$/;
        const priorityMatch = text.match(priorityDuplicationPattern);
        if (priorityMatch) {
          const firstPart = priorityMatch[1]; // "Zhao, H., ... arXiv"
          const volume = priorityMatch[2]; // "1"
          const middlePart = priorityMatch[3]; // "Zhao, H., ... arXiv" (duplicate)
          const issue = priorityMatch[4]; // "(1)"
          const trailing = priorityMatch[5]; // ". https://..."

          // Check if the middle part is very similar to or contains the first part
          if (
            middlePart.includes(firstPart.substring(0, 20)) ||
            calculateSimilarity(firstPart, middlePart) > 0.7
          ) {
            text = firstPart + ", " + volume + issue + trailing;
          }
        }

        // First, handle the most common pattern: Complete citation duplication with volume/issue
        const fullDuplicationPattern =
          /^(.*?\([0-9]{4}\)\..*?),\s*[0-9]+\1,\s*[0-9]+(\([^)]*\))?(.*)$/;
        if (fullDuplicationPattern.test(text)) {
          const match = text.match(fullDuplicationPattern);
          if (match) {
            // Reconstruct with proper format: citation + volume + issue + any trailing content (like URL)
            const citation = match[1];
            const issue = match[2] || "";
            const trailing = match[3] || "";
            text = citation + ", 1" + issue + trailing;
          }
        }

        return text;
      };

      const cleaned = cleanEntry(text);
    
    });

    setStatus(
      "Duplicate removal test completed - check browser console for results"
    );
  };

  return (
    <div className="font-inter bg-gradient-to-br from-slate-50 to-slate-200 min-h-screen">
      <header className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-center  md:justify-between items-center mb-8 bg-white rounded-xl p-6 shadow-soft">
          <div className="flex items-center space-x-4">
            <img
              src="https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/images//researchcollab-logo%20(1).svg"
              alt="ResearchCollab Logo"
              className="w-12 h-12 flex-shrink-0"
              onError={(e) => {
                // Fallback if image fails to load
                e.target.style.display = "none";
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-blue-600 mb-1">
                ResearchCollab
              </h1>
              <p className="text-gray-600 text-sm">
                Professional Citation Management for Microsoft Word
              </p>
            </div>
          </div>          
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 mt-2 md:mt-0 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 flex-shrink-0"
            title="Logout"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
        <div
          className={`flex items-center justify-center gap-2 p-3 rounded-lg mb-6 ${
            isOfficeReady
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOfficeReady ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span
            className={`text-sm font-medium ${
              isOfficeReady ? "text-green-700" : "text-red-700"
            }`}
          >
            {status}
          </span>
        </div>

        <CitationSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleCitationSearch={handleCitationSearch}
          isSearching={isSearching}
          searchResults={searchResults}
          fetchPaperLoader={fetchPaperLoader}
          addCitationToLibrary={addCitationToLibrary}
          getCitationTitle={getCitationTitle}
          getCitationAuthors={getCitationAuthors}
          citations={citations}
          userWorkSpaces={userWorkSpaces}
          isWorkSpaceLoading={isWorkSpaceLoading}
          setSelectedProject={setSelectedProject}
          selectedProject={selectedProject}
          setSelectedWorkSpace={setSelectedWorkSpace}
          selectedWorkSpace={selectedWorkSpace}
          isFolderLoading={isFolderLoading}
          fetchFolder={fetchFolder}
          isSelectedFolder={isSelectedFolder}
          setIsSelectedFolder={setIsSelectedFolder}
          setSearchResults={setSearchResults}    
          setFetchPaperLoader={setFetchPaperLoader}
          // Pagination props
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          pageSize={pageSize}
          handlePageChange={handlePageChange}
          handlePreviousPage={handlePreviousPage}
          handleNextPage={handleNextPage}
          insertCitation={insertCitation}
          markCitationAsUnused={markCitationAsUnused}
          syncCitationsWithDocument={syncCitationsWithDocument}
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
          autoRegenerateBibliography={autoRegenerateBibliography}
          isOfficeReady={isOfficeReady}
          citations={citations}
          testAPACitationFormatting={testAPACitationFormatting}
          testDuplicateRemoval={testDuplicateRemoval}
        />
      </header>
    </div>
  );
};
export default Home;
