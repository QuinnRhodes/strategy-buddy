import { useState, useRef } from 'react';
import { uploadPdf, deletePdf } from '../services/storage';

type Pdf = {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
  isCustom?: boolean;
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    
    // Check if files are being dropped
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
      return;
    }
    
    // Otherwise, handle internal drag of PDF icon
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
  const handleRemovePdf = async (id: string) => {
    // Find the PDF
    const pdf = pdfs.find(p => p.id === id);
    
    // If it's a custom PDF, delete from storage
    if (pdf?.isCustom) {
      await deletePdf(id);
    }
    
    // Update state
    const updatedPdfs = pdfs.map(pdf => 
      pdf.id === id ? { ...pdf, selected: false } : pdf
    ).filter(pdf => !(pdf.id === id && pdf.isCustom)); // Remove custom PDFs completely
    
    setPdfs(updatedPdfs);
    
    // Notify parent component about updated selected PDFs
    const newSelectedIds = updatedPdfs
      .filter(pdf => pdf.selected)
      .map(pdf => pdf.id);
    
    setSelectedPdfIds(newSelectedIds);
    onPdfSelection(newSelectedIds);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    try {
      setUploading(true);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if file is a PDF
        if (file.type !== 'application/pdf') {
          alert(`File ${file.name} is not a PDF`);
          continue;
        }
        
        // Upload the PDF
        const uploadedPdf = await uploadPdf(file);
        
        // Add to the PDF list
        setPdfs(prev => [
          ...prev,
          {
            id: uploadedPdf.id,
            name: uploadedPdf.name,
            icon: '📝',
            selected: true,
            isCustom: true,
          }
        ]);
        
        // Update selected PDFs
        const newSelectedIds = [...selectedPdfIds, uploadedPdf.id];
        onPdfSelection(newSelectedIds);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Failed to upload PDF: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Open file dialog
  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
        <button 
          className="upload-button"
          onClick={handleUploadClick} 
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          accept=".pdf"
          multiple
          style={{ display: 'none' }} 
          onChange={handleFileInputChange}
        />
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
            <p>Drag PDFs here to include in the conversation</p>
            <p className="drop-subtitle">or drop files to upload</p>
          </>
        )}
      </div>
    </div>
  );
}