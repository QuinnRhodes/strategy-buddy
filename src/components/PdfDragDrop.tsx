import { useState, useEffect } from 'react';
import { getPredefinedPdfs, getPdfUrl, PDF_FOLDER } from '../services/supabase';
import './PdfDragDrop.css';

type Pdf = {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
  path?: string;
  url?: string;
};

// Type for Supabase storage file object
type SupabaseFile = {
  id: string;
  name: string;
  bucket_id?: string;
  owner?: string;
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>;
  size?: number;
};

// Mapping for PDF file names to icons
const pdfIconMap: Record<string, string> = {
  'competitive-analysis.pdf': '🔍',
  'market-assessment.pdf': '📊',
  'strategic-framework.pdf': '📝',
  // Add fallbacks for case variations
  'competitive-analysis.PDF': '🔍',
  'market-assessment.PDF': '📊',
  'strategic-framework.PDF': '📝',
};

// Helper to get a friendly display name from a filename
function getDisplayName(fileName: string): string {
  // Remove file extension
  const baseName = fileName.replace(/\.pdf$/i, '');
  
  // Split by hyphen or underscore and capitalize each word
  return baseName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface PdfDragDropProps {
  onPdfSelection: (selectedPdfIds: string[]) => void;
}

export function PdfDragDrop({ onPdfSelection }: PdfDragDropProps) {
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch PDFs from Supabase on component mount
  useEffect(() => {
    console.log('PdfDragDrop: Loading PDFs from Supabase');
    
    async function loadPredefinedPdfs() {
      try {
        console.log('Fetching PDFs from Supabase...');
        const pdfFiles = await getPredefinedPdfs();
        console.log('Received PDF files:', pdfFiles);
        
        if (pdfFiles.length === 0) {
          console.log('No PDFs found, using fallback data');
          setPdfs([
            { id: '1', name: 'Market Assessment', icon: '📊', selected: false },
            { id: '2', name: 'Competitive Analysis', icon: '🔍', selected: false },
            { id: '3', name: 'Strategic Framework', icon: '📝', selected: false },
          ]);
          setLoading(false);
          return;
        }
        
        // Convert Supabase files to our Pdf type
        console.log('Converting Supabase files to PDF objects');
        const loadedPdfs: Pdf[] = await Promise.all(pdfFiles.map(async (file: SupabaseFile) => {
          console.log('Processing file:', file.name);
          const url = await getPdfUrl(file.name);
          console.log('Got URL for', file.name, ':', url);
          return {
            id: file.id,
            name: getDisplayName(file.name),
            icon: pdfIconMap[file.name.toLowerCase()] || '📄',
            selected: false,
            path: `${PDF_FOLDER}/${file.name}`,
            url
          };
        }));
        
        console.log('Processed PDFs:', loadedPdfs);
        setPdfs(loadedPdfs);
      } catch (error) {
        console.error('Error loading PDFs:', error);
        setError('Failed to load PDF documents. Please try again later.');
        // Fallback to initial PDFs if we can't load from Supabase
        setPdfs([
          { id: '1', name: 'Market Assessment', icon: '📊', selected: false },
          { id: '2', name: 'Competitive Analysis', icon: '🔍', selected: false },
          { id: '3', name: 'Strategic Framework', icon: '📝', selected: false },
        ]);
      } finally {
        setLoading(false);
      }
    }
    
    loadPredefinedPdfs();
  }, []);

  // Handle drag start event
  const handleDragStart = (e: React.DragEvent, pdf: Pdf) => {
    e.dataTransfer.setData('pdfId', pdf.id);
  };

  // Handle drag over event
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(true);
  };

  // Handle drag leave event
  const handleDragLeave = () => {
    setDropZoneActive(false);
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(false);
    
    // Handle internal drag of PDF icon
    const pdfId = e.dataTransfer.getData('pdfId');
    if (pdfId) {
      selectPdf(pdfId);
    }
  };

  // Select a PDF
  const selectPdf = (id: string) => {
    const updatedPdfs = pdfs.map(pdf => 
      pdf.id === id ? { ...pdf, selected: true } : pdf
    );
    
    setPdfs(updatedPdfs);
    
    // Notify parent component about selected PDFs
    const newSelectedIds = updatedPdfs
      .filter(pdf => pdf.selected)
      .map(pdf => pdf.id);
    
    onPdfSelection(newSelectedIds);
  };

  // Handle removing a selected PDF
  const handleRemovePdf = (id: string) => {
    // Update state
    const updatedPdfs = pdfs.map(pdf => 
      pdf.id === id ? { ...pdf, selected: false } : pdf
    );
    
    setPdfs(updatedPdfs);
    
    // Notify parent component about updated selected PDFs
    const newSelectedIds = updatedPdfs
      .filter(pdf => pdf.selected)
      .map(pdf => pdf.id);
    
    onPdfSelection(newSelectedIds);
  };

  // Handle clicking on a PDF to select it
  const handlePdfClick = (pdf: Pdf) => {
    if (!pdf.selected) {
      selectPdf(pdf.id);
    }
  };

  if (loading) {
    return <div className="pdf-container loading">Loading reference documents...</div>;
  }

  if (error) {
    return <div className="pdf-container error">{error}</div>;
  }

  if (pdfs.length === 0) {
    return <div className="pdf-container empty">No reference documents available</div>;
  }

  return (
    <div className="pdf-container">
      <div className="pdf-sidebar">
        <h3 className="pdf-sidebar-title">Reference Documents</h3>
        <div className="pdf-icons">
          {pdfs.filter(pdf => !pdf.selected).map(pdf => (
            <div
              key={pdf.id}
              className={`pdf-icon ${pdf.selected ? 'selected' : ''}`}
              draggable={!pdf.selected}
              onDragStart={(e) => handleDragStart(e, pdf)}
              onClick={() => handlePdfClick(pdf)}
            >
              <span className="icon">{pdf.icon}</span>
              <span className="name">{pdf.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        className={`drop-zone ${dropZoneActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {pdfs.some(pdf => pdf.selected) ? (
          <>
            <h3>Selected Documents</h3>
            <div className="selected-pdfs">
              {pdfs.filter(pdf => pdf.selected).map(pdf => (
                <div key={pdf.id} className="selected-pdf">
                  <span>{pdf.icon} {pdf.name}</span>
                  <button 
                    className="remove-pdf" 
                    onClick={() => handleRemovePdf(pdf.id)}
                    aria-label={`Remove ${pdf.name}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="drop-icon">📄</div>
            <p>Drag reference documents here to include in the conversation</p>
          </>
        )}
      </div>
    </div>
  );
}