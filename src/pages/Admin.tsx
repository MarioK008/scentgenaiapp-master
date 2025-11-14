import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CSVImporter } from "@/components/CSVImporter";

interface Perfume {
  id: string;
  name: string;
  brand: string;
  image_url: string | null;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  season: string | null;
  longevity: number | null;
  sillage: number | null;
  description: string | null;
}

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<Perfume | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    image_url: "",
    top_notes: "",
    heart_notes: "",
    base_notes: "",
    season: "all_season",
    longevity: "5",
    sillage: "5",
    description: "",
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchPerfumes();
    }
  }, [isAdmin]);

  const fetchPerfumes = async () => {
    const { data, error } = await supabase
      .from("perfumes")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load perfumes",
        variant: "destructive",
      });
    } else {
      setPerfumes(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const perfumeData = {
      name: formData.name,
      brand: formData.brand,
      image_url: formData.image_url || null,
      top_notes: formData.top_notes.split(",").map(n => n.trim()).filter(Boolean),
      heart_notes: formData.heart_notes.split(",").map(n => n.trim()).filter(Boolean),
      base_notes: formData.base_notes.split(",").map(n => n.trim()).filter(Boolean),
      season: formData.season as "spring" | "summer" | "fall" | "winter" | "all_season",
      longevity: parseInt(formData.longevity),
      sillage: parseInt(formData.sillage),
      description: formData.description || null,
    };

    let error;
    if (editingPerfume) {
      const result = await supabase
        .from("perfumes")
        .update(perfumeData)
        .eq("id", editingPerfume.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("perfumes")
        .insert(perfumeData);
      error = result.error;
    }

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingPerfume ? "update" : "create"} perfume`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Perfume ${editingPerfume ? "updated" : "created"} successfully`,
      });
      setIsDialogOpen(false);
      resetForm();
      fetchPerfumes();
    }
  };

  const handleEdit = (perfume: Perfume) => {
    setEditingPerfume(perfume);
    setFormData({
      name: perfume.name,
      brand: perfume.brand,
      image_url: perfume.image_url || "",
      top_notes: perfume.top_notes?.join(", ") || "",
      heart_notes: perfume.heart_notes?.join(", ") || "",
      base_notes: perfume.base_notes?.join(", ") || "",
      season: perfume.season || "all_season",
      longevity: String(perfume.longevity || 5),
      sillage: String(perfume.sillage || 5),
      description: perfume.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this perfume?")) return;

    const { error } = await supabase
      .from("perfumes")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete perfume",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Perfume deleted successfully",
      });
      fetchPerfumes();
    }
  };

  const resetForm = () => {
    setEditingPerfume(null);
    setFormData({
      name: "",
      brand: "",
      image_url: "",
      top_notes: "",
      heart_notes: "",
      base_notes: "",
      season: "all_season",
      longevity: "5",
      sillage: "5",
      description: "",
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage perfumes and user data</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Perfume
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPerfume ? "Edit Perfume" : "Add New Perfume"}
                </DialogTitle>
                <DialogDescription>
                  Fill in the perfume details below
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="top_notes">Top Notes (comma-separated)</Label>
                  <Input
                    id="top_notes"
                    value={formData.top_notes}
                    onChange={(e) => setFormData({ ...formData, top_notes: e.target.value })}
                    placeholder="e.g. Bergamot, Lemon, Orange"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heart_notes">Heart Notes (comma-separated)</Label>
                  <Input
                    id="heart_notes"
                    value={formData.heart_notes}
                    onChange={(e) => setFormData({ ...formData, heart_notes: e.target.value })}
                    placeholder="e.g. Rose, Jasmine, Lavender"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base_notes">Base Notes (comma-separated)</Label>
                  <Input
                    id="base_notes"
                    value={formData.base_notes}
                    onChange={(e) => setFormData({ ...formData, base_notes: e.target.value })}
                    placeholder="e.g. Vanilla, Musk, Amber"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="season">Season</Label>
                    <Select value={formData.season} onValueChange={(value) => setFormData({ ...formData, season: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spring">Spring</SelectItem>
                        <SelectItem value="summer">Summer</SelectItem>
                        <SelectItem value="fall">Fall</SelectItem>
                        <SelectItem value="winter">Winter</SelectItem>
                        <SelectItem value="all_season">All Season</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longevity">Longevity (1-10)</Label>
                    <Input
                      id="longevity"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.longevity}
                      onChange={(e) => setFormData({ ...formData, longevity: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sillage">Sillage (1-10)</Label>
                    <Input
                      id="sillage"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.sillage}
                      onChange={(e) => setFormData({ ...formData, sillage: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingPerfume ? "Update Perfume" : "Create Perfume"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <CSVImporter onImportComplete={fetchPerfumes} />

        <Card>
          <CardHeader>
            <CardTitle>Perfumes Database</CardTitle>
            <CardDescription>
              Manage all perfumes in the system ({perfumes.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Longevity</TableHead>
                    <TableHead>Sillage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfumes.map((perfume) => (
                    <TableRow key={perfume.id}>
                      <TableCell className="font-medium">{perfume.name}</TableCell>
                      <TableCell>{perfume.brand}</TableCell>
                      <TableCell className="capitalize">{perfume.season?.replace("_", " ")}</TableCell>
                      <TableCell>{perfume.longevity}/10</TableCell>
                      <TableCell>{perfume.sillage}/10</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(perfume)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(perfume.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;
