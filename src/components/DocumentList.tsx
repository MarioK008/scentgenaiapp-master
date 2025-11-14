import { FileText, Trash2, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Document {
  id: string;
  title: string;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
  processed: boolean;
  chunk_count: number;
}

interface DocumentListProps {
  documents: Document[];
  processing: string | null;
  onDelete: (id: string, filePath: string) => void;
}

export const DocumentList = ({ documents, processing, onDelete }: DocumentListProps) => {
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No documents uploaded yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Base Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{doc.title}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>•</span>
                  <span>{formatDate(doc.uploaded_at)}</span>
                  {doc.processed && (
                    <>
                      <span>•</span>
                      <span>{doc.chunk_count} chunks</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {processing === doc.id ? (
                <Badge variant="secondary">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Processing...
                </Badge>
              ) : doc.processed ? (
                <Badge variant="default">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Processed
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(doc.id, doc.file_path)}
                disabled={processing === doc.id}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};