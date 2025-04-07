import { useState } from 'react';

type Pdf = {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
};

const initialPdfs: Pdf[] = [
  { id: '1', name: 'Strategy Guide 1', icon: '📄', selected: false },
  { id: '2', name: 'Best Practices', icon: '📑', selected: false },
  { id: '3', name: 'Case Studies', icon: '📋', selected: false },
];

interface PdfDragDropProps {
  onPdfSelection: (selectedPdfIds: string[]) => void;
}

export function PdfDragDrop({ onPdfSelection }: PdfDragDropProps) {
  const [pdfs, setPdfs] = useState<Pdf[]>(initialPdfs);
  const [dropZoneActive, setDropZoneActive] = useState(false);

  const handleDragStart = (e: React.DragEvent, pdf: Pdf) => {
    e.dataTransfer.setData('pdfId', pdf.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(true);
  };

  const handleDragLeave = () => {
    setDropZoneActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(false);
    
    const pdfId = e.dataTransfer.getData('pdfId');
    const updatedPdfs = pdfs.map(pdf => 
      pdf.id === pdfId ? { ...pdf, selected: true } : pdf
    );
    
    setPdfs(updatedPdfs);
    
    // Notify parent component about selected PDFs
    const selectedPdfIds = updatedPdfs
      .filter(pdf => pdf.selected)
      .map(pdf => pdf.id);
    
    onPdfSelection(selectedPdfIds);
  };

  const handleRemovePdf = (id: string) => {
    const updatedPdfs = pdfs.map(pdf => 
      pdf.id === id ? { ...pdf, selected: false } : pdf
    );
    
    setPdfs(updatedPdfs);
    
    // Notify parent component about updated selected PDFs
    const selectedPdfIds = updatedPdfs
      .filter(pdf => pdf.selected)
      .map(pdf => pdf.id);
    
    onPdfSelection(selectedPdfIds);
  };

  return (
    <div className="pdf-container">
      <div className="pdf-icons">
        {pdfs.map(pdf => (
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
      <div
        className={`drop-zone ${dropZoneActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>Drag PDFs here to include in the conversation</p>
        <div className="selected-pdfs">
          {pdfs.filter(pdf => pdf.selected).map(pdf => (
            <div key={pdf.id} className="selected-pdf">
              <span>{pdf.icon} {pdf.name}</span>
              <button 
                className="remove-pdf" 
                onClick={() => handleRemovePdf(pdf.id)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}