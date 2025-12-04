import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CSVImporter } from "@/components/CSVImporter";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

const Admin = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage perfumes, brands, notes, and data imports
            </p>
          </div>
          <Link to="/admin/import-logs">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              View Import Logs
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
              <CardDescription>
                Normalized structure with brands, notes, accords, and seasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The database uses a normalized schema with junction tables for many-to-many relationships.
                Use the CSV import tool to populate data efficiently.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>System overview</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View detailed import logs and system statistics in the Import Logs page.
              </p>
            </CardContent>
          </Card>
        </div>

        <CSVImporter />
      </div>
    </Layout>
  );
};

export default Admin;
