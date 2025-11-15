import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage perfumes, brands, notes, and more
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Database Redesigned</CardTitle>
            <CardDescription>
              The schema now uses normalized tables for brands, notes, accords, and seasons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Admin interface is being rebuilt to work with the new structure.
              Full CRUD operations coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;
