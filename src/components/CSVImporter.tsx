import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, Upload, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TABLES = [
  { value: "brands", label: "Brands" },
  { value: "notes", label: "Notes" },
  { value: "accords", label: "Accords" },
  { value: "seasons", label: "Seasons" },
  { value: "perfumes", label: "Perfumes" },
  { value: "perfume_notes", label: "Perfume Notes" },
  { value: "perfume_accords", label: "Perfume Accords" },
  { value: "perfume_seasons", label: "Perfume Seasons" },
  { value: "perfume_similar", label: "Similar Perfumes" },
];

const TABLE_TEMPLATES: Record<string, string> = {
  brands: "name\n",
  notes: "name,type\n",
  accords: "name\n",
  seasons: "name\n",
  perfumes: "name,brand_id,year,concentration,description,image_url,main_accord_id,rating,votes,longevity,sillage\n",
  perfume_notes: "perfume_id,note_id\n",
  perfume_accords: "perfume_id,accord_id\n",
  perfume_seasons: "perfume_id,season_id\n",
  perfume_similar: "perfume_id,similar_id\n",
};

interface ImportResult {
  success: boolean;
  total_rows: number;
  successful_rows: number;
  skipped_rows: number;
  failed_rows: number;
  errors: Array<{ row: number; error: string }>;
}

export const CSVImporter = ({ onImportComplete }: { onImportComplete?: () => void }) => {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadTemplate = (table: string) => {
    const template = TABLE_TEMPLATES[table] || "id,name\n";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Template downloaded for ${table}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file || !selectedTable) {
      toast.error('Please select a table and file');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('table', selectedTable);
      formData.append('conflictMode', 'skip');

      const response = await supabase.functions.invoke('import-csv', {
        body: formData,
      });

      if (response.error) {
        throw response.error;
      }

      const importResult = response.data as ImportResult;
      setResult(importResult);

      if (importResult.successful_rows > 0) {
        toast.success(`Imported ${importResult.successful_rows} rows successfully`);
        onImportComplete?.();
      }

      if (importResult.failed_rows > 0) {
        toast.error(`${importResult.failed_rows} rows failed to import`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed: ' + (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Import Tool</CardTitle>
        <CardDescription>
          Import data into your database tables from CSV files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table">Select Target Table</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger id="table">
                <SelectValue placeholder="Choose a table" />
              </SelectTrigger>
              <SelectContent>
                {TABLES.map((table) => (
                  <SelectItem key={table.value} value={table.value}>
                    {table.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTable && (
            <Button 
              variant="outline" 
              onClick={() => downloadTemplate(selectedTable)}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template for {TABLES.find(t => t.value === selectedTable)?.label}
            </Button>
          )}

          <div className="space-y-2">
            <Label htmlFor="file">Upload CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={!selectedTable}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Button 
            onClick={handleImport} 
            disabled={!file || !selectedTable || importing}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {importing ? 'Importing...' : 'Import Data'}
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            <Alert className={result.successful_rows > 0 ? "border-green-500" : "border-red-500"}>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    {result.successful_rows > 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    Import Results
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Total Rows: {result.total_rows}</div>
                    <div>Successful: {result.successful_rows}</div>
                    <div>Skipped: {result.skipped_rows}</div>
                    <div>Failed: {result.failed_rows}</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Errors (showing first 10):
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {result.errors.slice(0, 10).map((error, idx) => (
                    <div key={idx} className="text-sm p-2 bg-destructive/10 rounded">
                      <span className="font-mono">Row {error.row}:</span> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm space-y-2">
            <p className="font-semibold">Important Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>CSV must include all required columns exactly as shown in template</li>
              <li>IDs must be valid UUIDs - no auto-generation</li>
              <li>Foreign keys must reference existing records</li>
              <li>On conflict: duplicate rows will be skipped</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};