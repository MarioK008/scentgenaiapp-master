import { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PDFUploaderProps {
  onUpload: (file: File) => void;
  uploading: boolean;
}

export const PDFUploader = ({ onUpload, uploading }: PDFUploaderProps) => {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert(`File too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please split it into smaller files.`);
      return;
    }
    
    onUpload(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Please drop a valid PDF file');
      return;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert(`File too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please split it into smaller files.`);
      return;
    }
    
    onUpload(file);
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
        >
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload PDF Document</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop a PDF file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground/70 mb-4">
            Maximum file size: 10MB
          </p>
          <label htmlFor="pdf-upload">
            <Button disabled={uploading} asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Select PDF'}
              </span>
            </Button>
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </div>
      </CardContent>
    </Card>
  );
};