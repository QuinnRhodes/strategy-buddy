import React from 'react';
import { getPdfUrl } from '../services/supabase';
import './PdfViewer.css';

interface PdfViewerProps {
  pdfId: string | null;
  pdfPath?: string;
  pdfUrl?: string;
}

export function PdfViewer({ pdfId, pdfPath, pdfUrl }: PdfViewerProps) {
  const [url, setUrl] = React.useState<string | null>(pdfUrl || null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadPdfUrl() {
      if (!pdfId || !pdfPath) {
        setUrl(null);
        return;
      }

      if (pdfUrl) {
        setUrl(pdfUrl);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const publicUrl = await getPdfUrl(pdfPath);
        setUrl(publicUrl);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadPdfUrl();
  }, [pdfId, pdfPath, pdfUrl]);

  if (!pdfId) {
    return (
      <div className="pdf-viewer-placeholder">
        <p>No document selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pdf-viewer-loading">
        <p>Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-viewer-error">
        <p>{error}</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="pdf-viewer-error">
        <p>Could not load document</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <iframe
        src={`${url}#toolbar=1&navpanes=1`}
        title="PDF Viewer"
        width="100%"
        height="600px"
        style={{ border: '1px solid #ccc' }}
      />
    </div>
  );
}