import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface ImportLog {
  id: string;
  table_name: string;
  filename: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  error_details: any;
  created_at: string;
}

const ImportLogs = () => {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('import_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (loadingLogs) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          Loading...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Import Logs</h1>
          <p className="text-muted-foreground">
            View history of CSV imports and their results
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Imports</CardTitle>
            <CardDescription>Last 50 import operations</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No import logs found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Success</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const successRate = (log.successful_rows / log.total_rows) * 100;
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.table_name}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {log.filename}
                          </TableCell>
                          <TableCell>{log.total_rows}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              {log.successful_rows}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.failed_rows > 0 ? (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-3 w-3" />
                                {log.failed_rows}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {successRate === 100 ? (
                              <Badge className="bg-green-500">Complete</Badge>
                            ) : successRate > 0 ? (
                              <Badge className="bg-amber-500">Partial</Badge>
                            ) : (
                              <Badge variant="destructive">Failed</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ImportLogs;