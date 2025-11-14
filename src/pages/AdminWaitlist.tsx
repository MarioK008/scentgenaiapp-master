import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Mail, Users, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
  notified: boolean;
  metadata: any;
  email_sent_at?: string;
  welcome_email_status?: string;
}

interface Stats {
  total: number;
  notified: number;
  pending: number;
}

export default function AdminWaitlist() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, notified: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchWaitlist();
    }
  }, [isAdmin]);

  const fetchWaitlist = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEntries(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const notified = data?.filter(e => e.notified).length || 0;
      const pending = total - notified;
      setStats({ total, notified, pending });
      
    } catch (error) {
      console.error("Error fetching waitlist:", error);
      toast({
        title: "Error loading waitlist",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsNotified = async (id: string) => {
    setUpdating(id);
    try {
      const { error } = await supabase
        .from("waitlist")
        .update({ notified: true })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User marked as notified.",
      });

      fetchWaitlist();
    } catch (error) {
      console.error("Error updating entry:", error);
      toast({
        title: "Error updating entry",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const resendWelcomeEmail = async (email: string, id: string) => {
    setUpdating(id);
    try {
      const { error } = await supabase.functions.invoke('send-welcome-email', {
        body: { email, waitlistId: id }
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: `Welcome email sent to ${email}`,
      });

      fetchWaitlist();
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error sending email",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 font-playfair">
              Waitlist Management
            </h1>
            <p className="text-muted-foreground">
              Manage early access signups and track notifications
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Signups</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notified</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{stats.notified}</p>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-full">
                    <Mail className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{stats.pending}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-full">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Waitlist Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Waitlist Entries</CardTitle>
              <CardDescription>
                All users who have signed up for early access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading waitlist...
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No waitlist entries yet
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Email</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead>Email Status</TableHead>
                        <TableHead>Notified</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.email}</TableCell>
                          <TableCell>
                            {format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </TableCell>
                          <TableCell>
                            {entry.welcome_email_status === 'sent' ? (
                              <div>
                                <Badge variant="default" className="bg-gradient-primary">
                                  <Check className="w-3 h-3 mr-1" />
                                  Sent
                                </Badge>
                                {entry.email_sent_at && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(entry.email_sent_at), "MMM d, h:mm a")}
                                  </div>
                                )}
                              </div>
                            ) : entry.welcome_email_status === 'failed' ? (
                              <Badge variant="destructive">Failed</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.notified ? (
                              <Badge variant="default" className="bg-accent">
                                <Check className="h-3 w-3 mr-1" />
                                Notified
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.metadata?.source || "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {entry.welcome_email_status !== 'sent' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resendWelcomeEmail(entry.email, entry.id)}
                                  disabled={updating === entry.id}
                                >
                                  <Mail className="w-3 h-3 mr-1" />
                                  {updating === entry.id ? "Sending..." : "Send Email"}
                                </Button>
                              )}
                              {!entry.notified && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsNotified(entry.id)}
                                  disabled={updating === entry.id}
                                >
                                  {updating === entry.id ? "Updating..." : "Mark Notified"}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
