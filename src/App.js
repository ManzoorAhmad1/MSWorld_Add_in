import React, { useState, useEffect } from 'react';
import './App.css';
import Cite from 'citation-js'; // v0.5.0

function App() {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [status, setStatus] = useState('Loading...');
  // Auth
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  };
  const [token, setToken] = useState('');
  useEffect(() => {
    const urlToken = getTokenFromUrl();
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
    }
  }, [token]);

  // Citation management state
  const [citationStyle, setCitationStyle] = useState('apa');
  const [citationInput, setCitationInput] = useState('');
  const [citations, setCitations] = useState([]); // Array of CSL-JSON or BibTeX
  const [bibliography, setBibliography] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // Citation search using Crossref API (public, for demo)
  const handleCitationSearch = async () => {
    if (!searchQuery) return;
    setSearchResults([]);
    setStatus('Searching...');
    try {
      const res = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(searchQuery)}&rows=5`);
      const data = await res.json();
      if (data && data.message && data.message.items) {
        setSearchResults(data.message.items);
        setStatus('Search complete.');
      } else {
        setStatus('No results found.');
      }
    } catch (e) {
      setStatus('Error searching citations.');
    }
  };

  // Import citations from BibTeX file
  const handleImportCitations = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bibtex = event.target.result;
        setCitations([...citations, bibtex]);
        setStatus('Citations imported!');
      } catch (err) {
        setStatus('Import failed.');
      }
    };
    reader.readAsText(file);
  };

  // Export citations as BibTeX
  const handleExportCitations = () => {
    if (citations.length === 0) {
      alert('No citations to export.');
      return;
    }
    try {
      const cite = new Cite(citations);
      const bibtex = cite.format('bibtex');
      const blob = new Blob([bibtex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'citations.bib';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('Citations exported!');
    } catch (e) {
      setStatus('Export failed.');
    }
  };
  // Mock PDF data for 5 different research documents
  const mockPDFs = [
    {
      id: 1,
      title: "Climate Change Research 2024",
      content: `Climate Change Research Report 2024

Executive Summary:
This comprehensive study examines the latest developments in climate science, focusing on temperature trends, precipitation patterns, and extreme weather events observed globally in 2024.

Key Findings:
• Global average temperature increased by 1.2°C compared to pre-industrial levels
• Arctic sea ice extent reached second-lowest recorded minimum
• Unprecedented heat waves affected 40% of global population
• Ocean acidification levels increased by 0.3 pH units

Methodology:
Our research team analyzed satellite data, weather station records, and oceanographic measurements from 150 countries. The study period covered January 2024 to December 2024.

Conclusions:
Immediate action is required to mitigate climate impacts. Recommended strategies include renewable energy adoption, carbon capture technologies, and international cooperation frameworks.

References:
- IPCC Climate Report 2024
- Nature Climate Change Journal
- NASA Global Climate Data
- World Meteorological Organization Reports`
    },
    {
      id: 2,
      title: "Artificial Intelligence in Healthcare",
      content: `AI in Healthcare: Transforming Medical Practice

Abstract:
This research explores the integration of artificial intelligence technologies in healthcare systems, examining their impact on diagnosis, treatment, and patient outcomes.

Introduction:
Healthcare is undergoing a digital transformation with AI technologies revolutionizing how medical professionals diagnose diseases, develop treatment plans, and monitor patient health.

Current Applications:
• Medical imaging analysis with 95% accuracy
• Drug discovery acceleration by 40%
• Personalized treatment recommendations
• Remote patient monitoring systems
• Predictive analytics for disease prevention

Case Studies:
1. AI-powered radiology systems detecting early-stage cancer
2. Machine learning algorithms predicting patient deterioration
3. Natural language processing for medical record analysis
4. Robotic surgery systems with precision enhancement

Challenges:
- Data privacy and security concerns
- Regulatory approval processes
- Integration with existing healthcare systems
- Training healthcare professionals

Future Outlook:
AI will continue to enhance healthcare delivery, with projected 50% improvement in diagnostic accuracy and 30% reduction in treatment costs by 2030.`
    },
    {
      id: 3,
      title: "Sustainable Energy Solutions",
      content: `Sustainable Energy Solutions: A Global Perspective

Overview:
This document presents a comprehensive analysis of renewable energy technologies and their potential to address global energy demands while reducing environmental impact.

Solar Energy:
• Photovoltaic efficiency increased to 26% in commercial panels
• Cost reduction of 70% over the past decade
• Grid integration challenges and solutions
• Energy storage advancements

Wind Energy:
• Offshore wind capacity expanded by 200% globally
• Turbine technology improvements
• Environmental impact assessments
• Community acceptance factors

Hydroelectric Power:
• Small-scale hydro projects in rural areas
• Pumped storage for grid stability
• Environmental considerations
• Modernization of existing facilities

Energy Storage:
• Battery technology breakthroughs
• Lithium-ion cost reductions
• Alternative storage methods
• Grid-scale deployment strategies

Policy Recommendations:
1. Increase renewable energy subsidies
2. Implement carbon pricing mechanisms
3. Invest in grid modernization
4. Support research and development
5. Promote international cooperation

Economic Impact:
Transition to sustainable energy could create 15 million jobs globally and reduce energy costs by 25% within the next decade.`
    },
    {
      id: 4,
      title: "Space Exploration Technologies",
      content: `Space Exploration Technologies: The Next Frontier

Mission Overview:
This research document outlines recent advances in space exploration technologies, including spacecraft propulsion, life support systems, and planetary exploration capabilities.

Propulsion Systems:
• Ion drives for deep space missions
• Nuclear thermal propulsion development
• Solar sail technology advancement
• Reusable rocket systems

Mars Exploration:
• Perseverance rover discoveries
• Sample return mission planning
• Atmospheric composition analysis
• Potential for human habitation

Lunar Programs:
• Artemis mission preparations
• Lunar base construction plans
• Resource utilization strategies
• International collaboration frameworks

Satellite Technology:
• CubeSat constellations for Earth observation
• Communication satellite innovations
• Space debris monitoring systems
• Quantum communication satellites

Commercial Space Industry:
• Private sector participation growth
• Space tourism development
• Manufacturing in microgravity
• Space-based solar power

Scientific Discoveries:
- Exoplanet detection methods
- Dark matter research
- Gravitational wave observations
- Interstellar medium studies

Future Missions:
Planned missions include Jupiter's moons exploration, asteroid mining operations, and establishment of permanent lunar settlements by 2035.`
    },
    {
      id: 5,
      title: "Quantum Computing Applications",
      content: `Quantum Computing Applications in Modern Science

Introduction:
Quantum computing represents a paradigm shift in computational capability, offering unprecedented processing power for complex scientific and mathematical problems.

Quantum Fundamentals:
• Quantum bits (qubits) and superposition
• Entanglement phenomena
• Quantum gates and circuits
• Decoherence challenges

Current Quantum Systems:
• IBM Quantum processors with 127 qubits
• Google's Sycamore quantum supremacy
• IonQ trapped-ion systems
• Rigetti superconducting processors

Applications:
1. Cryptography and Security
   - Quantum key distribution
   - Post-quantum cryptography
   - Secure communication protocols

2. Drug Discovery
   - Molecular simulation
   - Protein folding prediction
   - Chemical reaction optimization

3. Financial Modeling
   - Portfolio optimization
   - Risk analysis
   - Fraud detection algorithms

4. Machine Learning
   - Quantum neural networks
   - Pattern recognition enhancement
   - Optimization algorithms

Research Challenges:
• Quantum error correction
• Scalability issues
• Temperature requirements
• Programming complexity

Industry Impact:
Quantum computing market projected to reach $65 billion by 2030, with applications spanning pharmaceuticals, finance, logistics, and artificial intelligence.

Conclusion:
While still in early stages, quantum computing promises to revolutionize scientific research and industrial applications within the next decade.`
    }
  ];

  useEffect(() => {
    // Check if Office.js is available
    if (typeof Office !== 'undefined') {
      Office.onReady((info) => {
        if (info.host === Office.HostType.Word) {
          setIsOfficeReady(true);
          setStatus('Office Add-in Ready');
        } else {
          setStatus('Not running in Word');
        }
      });
    } else {
      setStatus('Office.js not loaded - Running in browser mode');
    }
  }, []);

  // Insert Hello World (demo)
  const handleButtonClick = () => {
    if (!isOfficeReady) {
      alert('This add-in needs to be loaded in Microsoft Word');
      return;
    }
    Word.run(async (context) => {
      try {
        const body = context.document.body;
        body.insertText('Hello World', Word.InsertLocation.end);
        await context.sync();
        setStatus('Text inserted successfully!');
      } catch (error) {
        setStatus('Error inserting text');
      }
    });
  };

  // Insert citation at cursor (citation-js v0.5.0 API)
  const handleInsertCitation = async () => {
    if (!isOfficeReady) {
      alert('This add-in needs to be loaded in Microsoft Word');
      return;
    }
    if (!citationInput) {
      alert('Enter a BibTeX, DOI, or citation string.');
      return;
    }
    try {
      // citation-js v0.5.0: use Cite(input).format('citation', ...)
      const cite = new Cite(citationInput);
      const formatted = cite.format('citation', {
        format: 'text',
        type: 'string',
        style: citationStyle
      });
      setCitations([...citations, citationInput]);
      setStatus('Citation inserted!');
      // Insert into Word
      await Word.run(async (context) => {
        context.document.getSelection().insertText(formatted, Word.InsertLocation.replace);
        await context.sync();
      });
    } catch (e) {
      alert('Invalid citation input.');
    }
  };

  // Generate bibliography (citation-js v0.5.0 API)
  const handleGenerateBibliography = async () => {
    if (!isOfficeReady) {
      alert('This add-in needs to be loaded in Microsoft Word');
      return;
    }
    if (citations.length === 0) {
      alert('No citations to generate bibliography.');
      return;
    }
    try {
      const cite = new Cite(citations);
      const bib = cite.format('bibliography', {
        format: 'text',
        type: 'string',
        style: citationStyle
      });
      setBibliography(bib);
      // Insert at end of document
      await Word.run(async (context) => {
        context.document.body.insertParagraph('References', Word.InsertLocation.end).style = 'Heading 1';
        context.document.body.insertParagraph(bib, Word.InsertLocation.end);
        await context.sync();
      });
      setStatus('Bibliography generated!');
    } catch (e) {
      alert('Error generating bibliography.');
    }
  };

  const handlePDFClick = (pdfData) => {
    if (!isOfficeReady) {
      alert('This add-in needs to be loaded in Microsoft Word');
      return;
    }

    // Word.js API call to insert PDF content
    Word.run(async (context) => {
      try {
        const body = context.document.body;
        
        // Insert a page break if document is not empty
        const paragraphs = body.paragraphs;
        paragraphs.load('items');
        await context.sync();
        
        if (paragraphs.items.length > 0) {
          body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);
        }
        
        // Insert the PDF title as a heading
        const titleParagraph = body.insertParagraph(pdfData.title, Word.InsertLocation.end);
        titleParagraph.style = 'Heading 1';
        titleParagraph.font.color = '#2E75B6';
        titleParagraph.font.size = 18;
        
        // Insert a line break
        body.insertParagraph('', Word.InsertLocation.end);
        
        // Insert the PDF content
        const contentParagraph = body.insertParagraph(pdfData.content, Word.InsertLocation.end);
        contentParagraph.font.size = 11;
        contentParagraph.font.name = 'Times New Roman';
        contentParagraph.spaceAfter = 12;
        
        // Insert separator line
        body.insertParagraph('', Word.InsertLocation.end);
        const separator = body.insertParagraph('────────────────────────────────────────────────────────────────────────────────', Word.InsertLocation.end);
        separator.font.color = '#CCCCCC';
        separator.alignment = Word.Alignment.centered;
        
        // Sync the context to execute the queued commands
        await context.sync();
        
        console.log(`PDF "${pdfData.title}" inserted successfully!`);
        setStatus(`PDF "${pdfData.title}" inserted successfully!`);
      } catch (error) {
        console.error('Error inserting PDF content:', error);
        setStatus('Error inserting PDF content');
      }
    });
  };

  // if (!token) {
  //   return <LoginPage  />;
  // }

  return (
    <div className="App">
      <header className="App-header">
        <h1>researchCollab</h1>
        <p>Research Document Collaboration Tool</p>
        <div className="status">
          <strong>Status:</strong> {status}
        </div>

        {/* Citation Management UI */}
        <div className="citation-section">
          <h3>Citation Management</h3>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="citation-style">Citation Style: </label>
            <select id="citation-style" value={citationStyle} onChange={e => setCitationStyle(e.target.value)}>
              <option value="apa">APA</option>
              <option value="mla">MLA</option>
              <option value="chicago">Chicago</option>
            </select>
            <button style={{ marginLeft: 16 }} onClick={handleExportCitations} disabled={citations.length === 0}>Export BibTeX</button>
            <label style={{ marginLeft: 16 }}>
              <input type="file" accept=".bib,.bibtex" style={{ display: 'none' }} onChange={handleImportCitations} />
              <span className="import-btn" style={{ cursor: 'pointer', color: '#2E75B6', textDecoration: 'underline' }}>Import BibTeX</span>
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Search for a paper (title, author, DOI, etc.)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: 350, marginRight: 8 }}
            />
            <button onClick={handleCitationSearch} disabled={!searchQuery}>Search</button>
          </div>
          {searchResults.length > 0 && (
            <div style={{ background: '#f6f6f6', border: '1px solid #ccc', padding: 8, marginBottom: 8 }}>
              <strong>Search Results:</strong>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {searchResults.map((item, idx) => (
                  <li key={item.DOI || idx} style={{ marginBottom: 4 }}>
                    <span>{item.title ? item.title[0] : 'No title'} ({item.author && item.author[0] ? item.author[0].family : ''}, {item.issued && item.issued['date-parts'] ? item.issued['date-parts'][0][0] : ''})</span>
                    <button style={{ marginLeft: 8 }} onClick={() => {
                      // Add as citation (as CSL-JSON)
                      setCitations([...citations, item]);
                      setStatus('Citation added from search!');
                    }}>Add Citation</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <input
            type="text"
            placeholder="Paste BibTeX, DOI, or citation string"
            value={citationInput}
            onChange={e => setCitationInput(e.target.value)}
            style={{ width: 350, marginRight: 8 }}
          />
          <button onClick={handleInsertCitation} disabled={!isOfficeReady}>Insert Citation</button>
          <button onClick={handleGenerateBibliography} disabled={!isOfficeReady || citations.length === 0} style={{ marginLeft: 8 }}>
            Generate Bibliography
          </button>
        </div>

        {/* <div className="button-section">
          <h3>Quick Actions</h3>
          <button 
            className="hello-button" 
            onClick={handleButtonClick}
            disabled={!isOfficeReady}
          >
            Insert Hello World
          </button>
        </div> */}

        <div className="pdf-section">
          <h3>Research Documents</h3>
          <p>Click any button below to insert PDF content into your document:</p>
          <div className="pdf-buttons">
            {mockPDFs.map((pdf) => (
              <button
                key={pdf.id}
                className="pdf-button"
                onClick={() => handlePDFClick(pdf)}
                disabled={!isOfficeReady}
              >
                📄 {pdf.title}
              </button>
            ))}
          </div>
        </div>

        {!isOfficeReady && (
          <div className="warning">
            <p>⚠️ This add-in needs to be loaded in Microsoft Word to function properly.</p>
            <p>If you're seeing this in a browser, upload the manifest.xml file to Word.</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
