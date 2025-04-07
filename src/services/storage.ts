import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjs from 'pdfjs-dist';

// Load PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export interface UploadedPdf {
  id: string;
  name: string;
  url: string;
  content: string;
}

// Store pdfs in memory for current session
const uploadedPdfs: Record<string, UploadedPdf> = {};

/**
 * Upload PDF to Supabase storage and parse its content
 */
export async function uploadPdf(file: File): Promise<UploadedPdf> {
  try {
    // Generate unique ID for the file
    const fileId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const fileName = `${fileId}.${fileExt}`;
    const filePath = `pdfs/${fileName}`;
    
    // Upload file to Supabase Storage
    const { error } = await supabase.storage
      .from('strategy-buddy')
      .upload(filePath, file);
      
    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('strategy-buddy')
      .getPublicUrl(filePath);
    
    // Parse PDF content
    const pdfContent = await parsePdfContent(file);
    
    // Create uploaded PDF object
    const uploadedPdf: UploadedPdf = {
      id: fileId,
      name: file.name,
      url: publicUrl,
      content: pdfContent,
    };
    
    // Store in memory
    uploadedPdfs[fileId] = uploadedPdf;
    
    return uploadedPdf;
  } catch (error: any) {
    console.error('Error in uploadPdf:', error);
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }
}

/**
 * Parse PDF content from file
 */
async function parsePdfContent(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => 'str' in item ? item.str : '')
        .join(' ');
        
      fullText += `\n--- Page ${i} ---\n${pageText}`;
    }
    
    return fullText;
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    return `Error extracting text: ${error.message}`;
  }
}

/**
 * Get PDF content by ID
 */
export function getPdfContent(id: string): string | null {
  return uploadedPdfs[id]?.content || null;
}

/**
 * Get all uploaded PDFs
 */
export function getUploadedPdfs(): UploadedPdf[] {
  return Object.values(uploadedPdfs);
}

/**
 * Delete PDF from storage and memory
 */
export async function deletePdf(id: string): Promise<void> {
  const pdf = uploadedPdfs[id];
  if (!pdf) return;
  
  try {
    // Extract the path from URL
    const pathMatch = pdf.url.match(/strategy-buddy\/([^?]+)/);
    if (pathMatch && pathMatch[1]) {
      const path = pathMatch[1];
      
      // Delete from Supabase
      const { error } = await supabase.storage
        .from('strategy-buddy')
        .remove([path]);
        
      if (error) {
        console.error('Error deleting from storage:', error);
      }
    }
    
    // Remove from memory
    delete uploadedPdfs[id];
  } catch (error) {
    console.error('Error in deletePdf:', error);
  }
}