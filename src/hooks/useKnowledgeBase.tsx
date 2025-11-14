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

  const uploadDocument = async (file: File) => {
    if (!userId) return;

    setUploading(true);

    try {
      // Upload file to storage
      const filePath = `${userId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('knowledge-pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: document, error: dbError } = await supabase
        .from('knowledge_documents')
        .insert({
          title: file.name,
          file_path: filePath,
          file_size: file.size,
          user_id: userId,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully');

      // Process the document
      await processDocument(document.id, filePath);

      await fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const processDocument = async (documentId: string, filePath: string) => {
    setProcessing(documentId);

    try {
      toast.info('Processing document... This may take a few minutes');

      const { error } = await supabase.functions.invoke('process-pdf', {
        body: { documentId, filePath },
      });

      if (error) throw error;

      toast.success('Document processed successfully');
      await fetchDocuments();
    } catch (error) {
      console.error('Error processing document:', error);
      toast.error('Failed to process document');
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