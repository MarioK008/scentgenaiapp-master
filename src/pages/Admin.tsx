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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const perfumeFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  brand: z.string().trim().min(1, "Brand is required").max(100, "Brand must be less than 100 characters"),
  image_url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  top_notes: z.string().max(500, "Top notes must be less than 500 characters"),
  heart_notes: z.string().max(500, "Heart notes must be less than 500 characters"),
  base_notes: z.string().max(500, "Base notes must be less than 500 characters"),
  season: z.enum(["spring", "summer", "fall", "winter", "all_season"]),
  longevity: z.coerce.number().min(1, "Longevity must be at least 1").max(10, "Longevity cannot exceed 10"),
  sillage: z.coerce.number().min(1, "Sillage must be at least 1").max(10, "Sillage cannot exceed 10"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional().or(z.literal("")),
});

type PerfumeFormValues = z.infer<typeof perfumeFormSchema>;

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

  const form = useForm<PerfumeFormValues>({
    resolver: zodResolver(perfumeFormSchema),
    defaultValues: {
      name: "",
      brand: "",
      image_url: "",
      top_notes: "",
      heart_notes: "",
      base_notes: "",
      season: "all_season",
      longevity: 5,
      sillage: 5,
      description: "",
    },
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

  const handleSubmit = async (values: PerfumeFormValues) => {
    const perfumeData = {
      name: values.name,
      brand: values.brand,
      image_url: values.image_url || null,
      top_notes: values.top_notes.split(",").map(n => n.trim()).filter(Boolean),
      heart_notes: values.heart_notes.split(",").map(n => n.trim()).filter(Boolean),
      base_notes: values.base_notes.split(",").map(n => n.trim()).filter(Boolean),
      season: values.season as "spring" | "summer" | "fall" | "winter" | "all_season",
      longevity: values.longevity,
      sillage: values.sillage,
      description: values.description || null,
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
    form.reset({
      name: perfume.name,
      brand: perfume.brand,
      image_url: perfume.image_url || "",
      top_notes: perfume.top_notes?.join(", ") || "",
      heart_notes: perfume.heart_notes?.join(", ") || "",
      base_notes: perfume.base_notes?.join(", ") || "",
      season: (perfume.season as "spring" | "summer" | "fall" | "winter" | "all_season") || "all_season",
      longevity: perfume.longevity || 5,
      sillage: perfume.sillage || 5,
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
    form.reset({
      name: "",
      brand: "",
      image_url: "",
      top_notes: "",
      heart_notes: "",
      base_notes: "",
      season: "all_season",
      longevity: 5,
      sillage: 5,
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

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="top_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Top Notes</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="citrus, mint, bergamot" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="heart_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heart Notes</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="rose, jasmine, lavender" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="base_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Notes</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="cedar, musk, amber" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="season"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Season</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="spring">Spring</SelectItem>
                              <SelectItem value="summer">Summer</SelectItem>
                              <SelectItem value="fall">Fall</SelectItem>
                              <SelectItem value="winter">Winter</SelectItem>
                              <SelectItem value="all_season">All Season</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longevity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longevity (1-10)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" max="10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sillage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sillage (1-10)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" max="10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPerfume ? "Update" : "Create"} Perfume
                    </Button>
                  </div>
                </form>
              </Form>
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
