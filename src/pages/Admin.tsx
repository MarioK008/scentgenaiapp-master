import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CSVImporter } from "@/components/CSVImporter";
import { Button } from "@/components/ui/button";
import { FileText, Database, Users, Mail, Brain, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  perfumes: number;
  brands: number;
  users: number;
  waitlist: number;
  documents: number;
}

const Admin = () => {
  const [stats, setStats] = useState<Stats>({
    perfumes: 0,
    brands: 0,
    users: 0,
    waitlist: 0,
    documents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [perfumesRes, brandsRes, usersRes, waitlistRes, docsRes] = await Promise.all([
        supabase.from("perfumes").select("id", { count: "exact", head: true }),
        supabase.from("brands").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("waitlist").select("id", { count: "exact", head: true }),
        supabase.from("knowledge_documents").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        perfumes: perfumesRes.count || 0,
        brands: brandsRes.count || 0,
        users: usersRes.count || 0,
        waitlist: waitlistRes.count || 0,
        documents: docsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Perfumes", value: stats.perfumes, icon: Database, href: "/admin" },
    { label: "Brands", value: stats.brands, icon: Database, href: "/admin" },
    { label: "Users", value: stats.users, icon: Users, href: "/admin/users" },
    { label: "Waitlist", value: stats.waitlist, icon: ClipboardList, href: "/admin/waitlist" },
    { label: "Knowledge Docs", value: stats.documents, icon: Brain, href: "/admin/knowledge" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
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

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-5">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "..." : stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/admin/users">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  View and manage user accounts, assign admin roles
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/admin/waitlist">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Waitlist
                </CardTitle>
                <CardDescription>
                  Manage early access signups and send notifications
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/admin/email-templates">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Templates
                </CardTitle>
                <CardDescription>
                  Edit email templates for automated notifications
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* CSV Importer */}
        <CSVImporter />
      </div>
    </AdminLayout>
  );
};

export default Admin;
