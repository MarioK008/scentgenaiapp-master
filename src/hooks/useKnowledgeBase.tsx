import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface KnowledgeDocument {
  id: string;
  title: string;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
  processed: boolean;
  chunk_count: number;
}

export const useKnowledgeBase = (userId: string | undefined) => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchDocuments();
    }
  }, [userId]);

  const fetchDocuments = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File, pageRange?: { start: number; end: number }) => {
    if (!userId) return;

    setUploading(true);

    try {
      // Upload file to storage
      const filePath = `${userId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('knowledge-pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record with page range metadata
      const metadata = pageRange 
        ? { pageRange: { start: pageRange.start, end: pageRange.end } }
        : {};

      const { data: document, error: dbError } = await supabase
        .from('knowledge_documents')
        .insert({
          title: file.name,
          file_path: filePath,
          file_size: file.size,
          user_id: userId,
          metadata,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully');

      // Process the document
      await processDocument(document.id, filePath, pageRange);

      await fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      
      // Handle specific error messages
      if (error?.message?.includes('too large')) {
        toast.error('File too large. Maximum size is 10MB. Please split into smaller files.');
      } else {
        toast.error('Failed to upload document');
      }
    } finally {
      setUploading(false);
    }
  };

  const processDocument = async (documentId: string, filePath: string, pageRange?: { start: number; end: number }) => {
    setProcessing(documentId);

    try {
      const rangeText = pageRange 
        ? `páginas ${pageRange.start}-${pageRange.end}` 
        : 'documento completo';
      toast.info(`Procesando ${rangeText}... Esto puede tomar 2-3 minutos para PDFs grandes`);

      const { data, error } = await supabase.functions.invoke('process-pdf', {
        body: { documentId, filePath, pageRange },
      });

      if (error) {
        // Handle specific errors
        if (error.message?.includes('too large')) {
          throw new Error('PDF too large. Maximum size is 10MB');
        } else if (error.message?.includes('WORKER_LIMIT')) {
          throw new Error('PDF processing timed out. Try a smaller file or split into sections');
        }
        throw error;
      }

      toast.success('Document processed successfully');
      await fetchDocuments();
    } catch (error: any) {
      console.error('Error processing document:', error);
      
      // User-friendly error messages
      const errorMessage = error?.message || 'Failed to process document';
      if (errorMessage.includes('too large') || errorMessage.includes('10MB')) {
        toast.error('File too large (max 10MB). Split into smaller files and upload separately.');
      } else if (errorMessage.includes('WORKER_LIMIT') || errorMessage.includes('timed out')) {
        toast.error('Processing timed out. Try uploading a smaller PDF or split it into sections.');
      } else {
        toast.error('Failed to process document. Try again or use a different file.');
      }
    } finally {
      setProcessing(null);
    }
  };

  const deleteDocument = async (documentId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('knowledge-pdfs')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database (cascade will handle chunks)
      const { error: dbError } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast.success('Document deleted');
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  return {
    documents,
    loading,
    uploading,
    processing,
    uploadDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
};