import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const CSVImporter = ({ onImportComplete }: { onImportComplete?: () => void }) => {
  const downloadTemplate = () => {
    const template = `name,brand,year,concentration,longevity,sillage,description,image_url
Example Perfume,Example Brand,2024,Eau de Parfum,Long,Strong,A beautiful fragrance,https://example.com/image.jpg`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'perfumes_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import Perfumes</CardTitle>
        <CardDescription>
          CSV import temporarily disabled
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>

        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold">CSV Import Temporarily Disabled</p>
              <p className="text-muted-foreground">
                Database schema redesigned with normalized tables.
                Import functionality needs to be updated.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
