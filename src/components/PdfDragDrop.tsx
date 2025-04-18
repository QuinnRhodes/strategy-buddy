import { useState } from 'react';

type Pdf = {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
};

// Initial predefined PDFs
const initialPdfs: Pdf[] = [
  { id: '1', name: 'Market Analysis Report', icon: '📊', selected: false },
  { id: '2', name: 'Competitive Landscape Guide', icon: '🔍', selected: false },
  { id: '3', name: 'Strategic Planning Template', icon: '📝', selected: false },
];

interface PdfDragDropProps {
  onPdfSelection: (selectedPdfIds: string[]) => void;
}

export function PdfDragDrop({ onPdfSelection }: PdfDragDropProps) {
  const [pdfs, setPdfs] = useState<Pdf[]>(initialPdfs);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);

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
    
    setSelectedPdfIds(newSelectedIds);
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
    
    setSelectedPdfIds(newSelectedIds);
    onPdfSelection(newSelectedIds);
  };

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