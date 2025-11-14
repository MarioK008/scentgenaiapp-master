import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface CSVImporterProps {
  onImportComplete: () => void;
}

export const CSVImporter = ({ onImportComplete }: CSVImporterProps) => {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const downloadTemplate = () => {
    const template = `name,brand,image_url,top_notes,heart_notes,base_notes,season,longevity,sillage,description
Bleu de Chanel,Chanel,https://example.com/image.jpg,"citrus,mint","ginger,nutmeg","cedar,sandalwood",all_season,7,8,"A woody aromatic fragrance for men"
Sauvage,Dior,,"bergamot,pepper","lavender,geranium","ambroxan,cedar",all_season,8,9,"A fresh spicy fragrance"`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'perfumes_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const { data: perfumes, error } = await supabase
        .from("perfumes")
        .select("*")
        .order("brand", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      if (!perfumes || perfumes.length === 0) {
        toast({
          title: "No Data",
          description: "No perfumes found to export",
          variant: "destructive",
        });
        return;
      }

      // Create CSV header
      const header = "name,brand,image_url,top_notes,heart_notes,base_notes,season,longevity,sillage,description\n";
      
      // Convert perfumes to CSV rows
      const rows = perfumes.map(p => {
        const escapeCSV = (value: any) => {
          if (value === null || value === undefined) return '';
          if (Array.isArray(value)) {
            const joined = value.join(',');
            return `"${joined}"`;
          }
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        return [
          escapeCSV(p.name),
          escapeCSV(p.brand),
          escapeCSV(p.image_url),
          escapeCSV(p.top_notes),
          escapeCSV(p.heart_notes),
          escapeCSV(p.base_notes),
          escapeCSV(p.season),
          escapeCSV(p.longevity),
          escapeCSV(p.sillage),
          escapeCSV(p.description)
        ].join(',');
      }).join('\n');

      const csv = header + rows;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `perfumes_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Exported ${perfumes.length} perfume(s) to CSV`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export perfumes",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n');
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const validateRow = (row: string[], index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!row[0]) errors.push({ row: index, field: 'name', message: 'Name is required' });
    if (!row[1]) errors.push({ row: index, field: 'brand', message: 'Brand is required' });
    
    const season = row[6]?.toLowerCase();
    const validSeasons = ['spring', 'summer', 'fall', 'winter', 'all_season'];
    if (season && !validSeasons.includes(season)) {
      errors.push({ row: index, field: 'season', message: `Invalid season. Must be one of: ${validSeasons.join(', ')}` });
    }
    
    const longevity = parseInt(row[7]);
    if (row[7] && (isNaN(longevity) || longevity < 1 || longevity > 10)) {
      errors.push({ row: index, field: 'longevity', message: 'Longevity must be between 1-10' });
    }
    
    const sillage = parseInt(row[8]);
    if (row[8] && (isNaN(sillage) || sillage < 1 || sillage > 10)) {
      errors.push({ row: index, field: 'sillage', message: 'Sillage must be between 1-10' });
    }
    
    return errors;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setErrors([]);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        toast({
          title: "Error",
          description: "CSV file must contain a header row and at least one data row",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      const headers = rows[0];
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell));
      
      const allErrors: ValidationError[] = [];
      const validPerfumes: any[] = [];

      dataRows.forEach((row, index) => {
        const rowErrors = validateRow(row, index + 2);
        
        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors);
        } else {
          validPerfumes.push({
            name: row[0],
            brand: row[1],
            image_url: row[2] || null,
            top_notes: row[3] ? row[3].split(',').map(n => n.trim()).filter(Boolean) : [],
            heart_notes: row[4] ? row[4].split(',').map(n => n.trim()).filter(Boolean) : [],
            base_notes: row[5] ? row[5].split(',').map(n => n.trim()).filter(Boolean) : [],
            season: row[6] || 'all_season',
            longevity: row[7] ? parseInt(row[7]) : null,
            sillage: row[8] ? parseInt(row[8]) : null,
            description: row[9] || null,
          });
        }
      });

      if (allErrors.length > 0) {
        setErrors(allErrors);
        toast({
          title: "Validation Errors",
          description: `Found ${allErrors.length} validation error(s). Please fix them and try again.`,
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      const { error } = await supabase
        .from("perfumes")
        .insert(validPerfumes);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to import perfumes: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully imported ${validPerfumes.length} perfume(s)`,
        });
        onImportComplete();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse CSV file",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import Perfumes</CardTitle>
        <CardDescription>Upload a CSV file to import multiple perfumes at once</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>

          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={exporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export All Perfumes"}
          </Button>
          
          <label htmlFor="csv-upload">
            <Button
              variant="default"
              disabled={importing}
              className="flex items-center gap-2"
              asChild
            >
              <span>
                <Upload className="w-4 h-4" />
                {importing ? "Importing..." : "Upload CSV"}
              </span>
            </Button>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Validation Errors:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.slice(0, 10).map((error, idx) => (
                  <li key={idx}>
                    Row {error.row}, {error.field}: {error.message}
                  </li>
                ))}
                {errors.length > 10 && (
                  <li className="font-semibold">...and {errors.length - 10} more error(s)</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>CSV Format:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Required: name, brand</li>
            <li>Optional: image_url, top_notes, heart_notes, base_notes, season, longevity (1-10), sillage (1-10), description</li>
            <li>Notes should be comma-separated within quotes: "citrus,mint,bergamot"</li>
            <li>Valid seasons: spring, summer, fall, winter, all_season</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
