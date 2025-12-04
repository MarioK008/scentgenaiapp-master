import { useAuth } from '@/hooks/useAuth';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PDFUploader } from "@/components/PDFUploader";
import { DocumentList } from "@/components/DocumentList";
import { Brain, BookOpen, Zap } from 'lucide-react';

const AdminKnowledge = () => {
  const { user } = useAuth();
  const {
    documents,
    loading,
    uploading,
    processing,
    uploadDocument,
    deleteDocument,
  } = useKnowledgeBase(user?.id);

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);
  const processedDocs = documents.filter(d => d.processed).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            Knowledge Base Management
          </h1>
          <p className="text-muted-foreground">
            Upload and manage PDF documents for the AI knowledge base
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : documents.length}</div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Loading..." : `${processedDocs} processed`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Chunks</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : totalChunks}</div>
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

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload PDF documents to enhance the AI's knowledge about perfumes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PDFUploader onUpload={uploadDocument} uploading={uploading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>
                Manage your uploaded knowledge base documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <DocumentList 
                  documents={documents} 
                  processing={processing} 
                  onDelete={deleteDocument} 
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminKnowledge;
