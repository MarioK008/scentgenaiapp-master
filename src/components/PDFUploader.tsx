import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PDFUploaderProps {
  onUpload: (file: File, pageRange?: { start: number; end: number }) => void;
  uploading: boolean;
}

export const PDFUploader = ({ onUpload, uploading }: PDFUploaderProps) => {
  const [startPage, setStartPage] = useState<string>('');
  const [endPage, setEndPage] = useState<string>('');

  const validateAndUpload = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Por favor selecciona un archivo PDF válido');
      return;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert(`Archivo demasiado grande. Máximo 10MB. Tu archivo tiene ${(file.size / 1024 / 1024).toFixed(2)}MB. Por favor divídelo en archivos más pequeños.`);
      return;
    }

    // Parse page range
    let pageRange: { start: number; end: number } | undefined;
    if (startPage || endPage) {
      const start = parseInt(startPage);
      const end = parseInt(endPage);
      
      if (!startPage || !endPage || isNaN(start) || isNaN(end) || start < 1 || end < start) {
        alert('Por favor ingresa un rango de páginas válido (ej: inicio=1, fin=50)');
        return;
      }
      
      pageRange = { start, end };
    }
    
    onUpload(file, pageRange);
  }, [onUpload, startPage, endPage]);
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndUpload(file);
  }, [validateAndUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    validateAndUpload(file);
  }, [validateAndUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startPage">Página inicial (opcional)</Label>
            <Input
              id="startPage"
              type="number"
              min="1"
              placeholder="ej. 1"
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              disabled={uploading}
            />
          </div>
          <div>
            <Label htmlFor="endPage">Página final (opcional)</Label>
            <Input
              id="endPage"
              type="number"
              min="1"
              placeholder="ej. 50"
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              disabled={uploading}
            />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Especifica un rango de páginas para procesar solo una parte del documento. Deja en blanco para procesar todo.
        </p>

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
            Tamaño máximo: 10MB
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