import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PDFUploaderProps {
  onUpload: (file: File) => void;
  uploading: boolean;
}

export const PDFUploader = ({ onUpload, uploading }: PDFUploaderProps) => {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Por favor selecciona un archivo PDF válido');
      return;
    }
    
    onUpload(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Por favor selecciona un archivo PDF válido');
      return;
    }
    
    onUpload(file);
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
        >
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Subir documento PDF</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Arrastra un PDF aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-muted-foreground/70 mb-4">
            Archivos grandes se procesarán automáticamente por secciones
          </p>
          <label htmlFor="pdf-upload">
            <Button disabled={uploading} asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Subiendo...' : 'Seleccionar PDF'}
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