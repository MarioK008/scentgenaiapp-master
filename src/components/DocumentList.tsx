import { FileText, Trash2, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Document {
  id: string;
  title: string;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
  processed: boolean;
  chunk_count: number;
  processing_status?: {
    total_sections?: number;
    completed_sections?: number;
    current_section?: number;
    method?: string;
    error?: string;
  };
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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProcessingProgress = (doc: Document) => {
    if (!doc.processing_status) return 0;
    const { total_sections = 1, completed_sections = 0 } = doc.processing_status;
    return Math.round((completed_sections / total_sections) * 100);
  };

  const getProcessingText = (doc: Document) => {
    if (doc.processing_status?.error) {
      return `Error: ${doc.processing_status.error}`;
    }
    if (!doc.processing_status) return 'Processing...';
    
    const { total_sections, current_section, method } = doc.processing_status;
    
    if (total_sections && total_sections > 1) {
      return `Section ${current_section || 1} of ${total_sections}${method ? ` (${method})` : ''}`;
    }
    
    return `Extracting text${method ? ` (${method})` : ''}...`;
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
              <FileText className="w-8 h-8 text-primary flex-shrink-0" />
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
                
                {!doc.processed && doc.processing_status && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {getProcessingText(doc)}
                      </span>
                      {!doc.processing_status.error && (
                        <span className="text-primary font-medium">
                          {getProcessingProgress(doc)}%
                        </span>
                      )}
                    </div>
                    {!doc.processing_status.error && (
                      <Progress value={getProcessingProgress(doc)} className="h-1.5" />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {processing === doc.id || (!doc.processed && doc.processing_status && !doc.processing_status.error) ? (
                <Badge variant="secondary">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Processing
                </Badge>
              ) : doc.processing_status?.error ? (
                <Badge variant="destructive">
                  Error
                </Badge>
              ) : doc.processed ? (
                <Badge variant="default" className="bg-green-600">
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
                disabled={processing === doc.id || (!doc.processed && doc.processing_status && !doc.processing_status.error)}
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
