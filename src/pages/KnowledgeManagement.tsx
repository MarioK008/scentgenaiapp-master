import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import Layout from '@/components/Layout';
import { PDFUploader } from '@/components/PDFUploader';
import { DocumentList } from '@/components/DocumentList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, BookOpen, Zap } from 'lucide-react';

const KnowledgeManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    documents,
    loading,
    uploading,
    processing,
    uploadDocument,
    deleteDocument,
  } = useKnowledgeBase(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);
  const processedDocs = documents.filter(d => d.processed).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Brain className="w-10 h-10 text-primary" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground">
            Upload PDF documents to enhance the AI assistant's knowledge about perfumes
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
              <p className="text-xs text-muted-foreground">
                {processedDocs} processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Chunks</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalChunks}</div>
              <p className="text-xs text-muted-foreground">
                Searchable text segments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {processing ? 'Processing' : 'Ready'}
              </div>
              <p className="text-xs text-muted-foreground">
                AI assistant status
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
            <CardDescription>
              The knowledge base uses RAG (Retrieval Augmented Generation) to provide accurate information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Upload PDF documents about perfumes, fragrance notes, or perfumery (max 10MB per file)</li>
              <li>OpenAI's GPT-4 Vision extracts the text content from your PDF automatically</li>
              <li>The system creates searchable chunks and vector embeddings for semantic search</li>
              <li>When you chat with the AI, it searches relevant knowledge to answer accurately</li>
              <li>The AI cites sources from your documents in its responses</li>
            </ol>
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>📌 Important:</strong> Files larger than 10MB should be split into smaller sections to ensure reliable processing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload */}
        <div className="mb-8">
          <PDFUploader onUpload={uploadDocument} uploading={uploading} />
        </div>

        {/* Document List */}
        <DocumentList
          documents={documents}
          processing={processing}
          onDelete={deleteDocument}
        />
      </div>
    </Layout>
  );
};

export default KnowledgeManagement;