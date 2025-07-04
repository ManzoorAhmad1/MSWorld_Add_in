
import React, { useState, useEffect } from 'react';
import './App.css';

const mockPDFs = [
  {
    id: 1,
    title: "Climate Change Research 2024",
    content: `Climate Change Research Report 2024\n\nExecutive Summary:\nThis comprehensive study examines the latest developments in climate science, focusing on temperature trends, precipitation patterns, and extreme weather events observed globally in 2024.\n\nKey Findings:\n• Global average temperature increased by 1.2°C compared to pre-industrial levels\n• Arctic sea ice extent reached second-lowest recorded minimum\n• Unprecedented heat waves affected 40% of global population\n• Ocean acidification levels increased by 0.3 pH units\n\nMethodology:\nOur research team analyzed satellite data, weather station records, and oceanographic measurements from 150 countries. The study period covered January 2024 to December 2024.\n\nConclusions:\nImmediate action is required to mitigate climate impacts. Recommended strategies include renewable energy adoption, carbon capture technologies, and international cooperation frameworks.\n\nReferences:\n- IPCC Climate Report 2024\n- Nature Climate Change Journal\n- NASA Global Climate Data\n- World Meteorological Organization Reports`
  },
  {
    id: 2,
    title: "Artificial Intelligence in Healthcare",
    content: `AI in Healthcare: Transforming Medical Practice\n\nAbstract:\nThis research explores the integration of artificial intelligence technologies in healthcare systems, examining their impact on diagnosis, treatment, and patient outcomes.\n\nIntroduction:\nHealthcare is undergoing a digital transformation with AI technologies revolutionizing how medical professionals diagnose diseases, develop treatment plans, and monitor patient health.\n\nCurrent Applications:\n• Medical imaging analysis with 95% accuracy\n• Drug discovery acceleration by 40%\n• Personalized treatment recommendations\n• Remote patient monitoring systems\n• Predictive analytics for disease prevention\n\nCase Studies:\n1. AI-powered radiology systems detecting early-stage cancer\n2. Machine learning algorithms predicting patient deterioration\n3. Natural language processing for medical record analysis\n4. Robotic surgery systems with precision enhancement\n\nChallenges:\n- Data privacy and security concerns\n- Regulatory approval processes\n- Integration with existing healthcare systems\n- Training healthcare professionals\n\nFuture Outlook:\nAI will continue to enhance healthcare delivery, with projected 50% improvement in diagnostic accuracy and 30% reduction in treatment costs by 2030.`
  },
  {
    id: 3,
    title: "Sustainable Energy Solutions",
    content: `Sustainable Energy Solutions: A Global Perspective\n\nOverview:\nThis document presents a comprehensive analysis of renewable energy technologies and their potential to address global energy demands while reducing environmental impact.\n\nSolar Energy:\n• Photovoltaic efficiency increased to 26% in commercial panels\n• Cost reduction of 70% over the past decade\n• Grid integration challenges and solutions\n• Energy storage advancements\n\nWind Energy:\n• Offshore wind capacity expanded by 200% globally\n• Turbine technology improvements\n• Environmental impact assessments\n• Community acceptance factors\n\nHydroelectric Power:\n• Small-scale hydro projects in rural areas\n• Pumped storage for grid stability\n• Environmental considerations\n• Modernization of existing facilities\n\nEnergy Storage:\n• Battery technology breakthroughs\n• Lithium-ion cost reductions\n• Alternative storage methods\n• Grid-scale deployment strategies\n\nPolicy Recommendations:\n1. Increase renewable energy subsidies\n2. Implement carbon pricing mechanisms\n3. Invest in grid modernization\n4. Support research and development\n5. Promote international cooperation\n\nEconomic Impact:\nTransition to sustainable energy could create 15 million jobs globally and reduce energy costs by 25% within the next decade.`
  },
  {
    id: 4,
    title: "Space Exploration Technologies",
    content: `Space Exploration Technologies: The Next Frontier\n\nMission Overview:\nThis research document outlines recent advances in space exploration technologies, including spacecraft propulsion, life support systems, and planetary exploration capabilities.\n\nPropulsion Systems:\n• Ion drives for deep space missions\n• Nuclear thermal propulsion development\n• Solar sail technology advancement\n• Reusable rocket systems\n\nMars Exploration:\n• Perseverance rover discoveries\n• Sample return mission planning\n• Atmospheric composition analysis\n• Potential for human habitation\n\nLunar Programs:\n• Artemis mission preparations\n• Lunar base construction plans\n• Resource utilization strategies\n• International collaboration frameworks\n\nSatellite Technology:\n• CubeSat constellations for Earth observation\n• Communication satellite innovations\n• Space debris monitoring systems\n• Quantum communication satellites\n\nCommercial Space Industry:\n• Private sector participation growth\n• Space tourism development\n• Manufacturing in microgravity\n• Space-based solar power\n\nScientific Discoveries:\n- Exoplanet detection methods\n- Dark matter research\n- Gravitational wave observations\n- Interstellar medium studies\n\nFuture Missions:\nPlanned missions include Jupiter's moons exploration, asteroid mining operations, and establishment of permanent lunar settlements by 2035.`
  },
  {
    id: 5,
    title: "Quantum Computing Applications",
    content: `Quantum Computing Applications in Modern Science\n\nIntroduction:\nQuantum computing represents a paradigm shift in computational capability, offering unprecedented processing power for complex scientific and mathematical problems.\n\nQuantum Fundamentals:\n• Quantum bits (qubits) and superposition\n• Entanglement phenomena\n• Quantum gates and circuits\n• Decoherence challenges\n\nCurrent Quantum Systems:\n• IBM Quantum processors with 127 qubits\n• Google's Sycamore quantum supremacy\n• IonQ trapped-ion systems\n• Rigetti superconducting processors\n\nApplications:\n1. Cryptography and Security\n   - Quantum key distribution\n   - Post-quantum cryptography\n   - Secure communication protocols\n\n2. Drug Discovery\n   - Molecular simulation\n   - Protein folding prediction\n   - Chemical reaction optimization\n\n3. Financial Modeling\n   - Portfolio optimization\n   - Risk analysis\n   - Fraud detection algorithms\n\n4. Machine Learning\n   - Quantum neural networks\n   - Pattern recognition enhancement\n   - Optimization algorithms\n\nResearch Challenges:\n• Quantum error correction\n• Scalability issues\n• Temperature requirements\n• Programming complexity\n\nIndustry Impact:\nQuantum computing market projected to reach $65 billion by 2030, with applications spanning pharmaceuticals, finance, logistics, and artificial intelligence.\n\nConclusion:\nWhile still in early stages, quantum computing promises to revolutionize scientific research and industrial applications within the next decade.`
  }
];

function App() {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [status, setStatus] = useState('Loading...');

  // --- Token check logic ---
  const [tokenValid, setTokenValid] = useState(false);
  useEffect(() => {
    // Get token from current URL (e.g., ?token=xxxx)
    const url = new URL(window.location.href);
    const localToken = url.searchParams.get('token');
    // Get token from referrer (e.g., OneDrive URL)
    let refToken = null;
    try {
      if (document.referrer) {
        const refUrl = new URL(document.referrer);
        refToken = refUrl.searchParams.get('token');
      }
    } catch (e) {}
    // If both tokens exist and match, show PDF buttons
    if (localToken && refToken && localToken === refToken) {
      setTokenValid(true);
    } else {
      setTokenValid(false);
    }
  }, []);

  if (!tokenValid) {
    // Optionally show a message or nothing if not valid
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',color:'#888',fontSize:20}}>
        Please login from the correct entry point.
      </div>
    );
  }

  // --- Office.js and Word.js logic ---
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

  const handleButtonClick = () => {
    if (!isOfficeReady) {
      alert('This add-in needs to be loaded in Microsoft Word');
      return;
    }

    // Word.js API call to insert text
    Word.run(async (context) => {
      try {
        // Get the document body
        const body = context.document.body;
        // Insert "Hello World" text
        body.insertText('Hello World', Word.InsertLocation.end);
        // Sync the context to execute the queued commands
        await context.sync();
        console.log('Hello World inserted successfully!');
        setStatus('Text inserted successfully!');
      } catch (error) {
        console.error('Error inserting text:', error);
        setStatus('Error inserting text');
      }
    });
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>researchCollab</h1>
        <p>Research Document Collaboration Tool</p>
        <div className="status">
          <strong>Status:</strong> {status}
        </div>
        <div className="button-section">
          <h3>Quick Actions</h3>
          <button 
            className="hello-button" 
            onClick={handleButtonClick}
            disabled={!isOfficeReady}
          >
            Insert Hello World
          </button>
        </div>
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

// ...existing code...
