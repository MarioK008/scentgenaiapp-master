import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Mail, Edit, Eye, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  description: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplates() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchTemplates();
    }
  }, [isAdmin]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error loading templates",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject: template.subject,
          html_content: template.html_content,
          text_content: template.text_content,
          is_active: template.is_active,
        })
        .eq("id", template.id);

      if (error) throw error;

      toast({
        title: "Template updated",
        description: "Email template has been saved successfully.",
      });

      fetchTemplates();
      setEditingTemplate(null);
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Error updating template",
        description: "Please try again.",
        variant: "destructive",
      });
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
              Email Templates
            </h1>
            <p className="text-muted-foreground">
              Manage email templates for automated notifications
            </p>
          </div>

          {/* Info Card */}
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Template Variables
              </CardTitle>
              <CardDescription>
                Use these variables in your templates. They will be automatically replaced when emails are sent.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong className="text-foreground">Welcome:</strong>
                  <p className="text-muted-foreground">{"{{email}}"}</p>
                </div>
                <div>
                  <strong className="text-foreground">Launch:</strong>
                  <p className="text-muted-foreground">{"{{email}}, {{loginUrl}}"}</p>
                </div>
                <div>
                  <strong className="text-foreground">Feature Update:</strong>
                  <p className="text-muted-foreground">{"{{email}}, {{featureTitle}}, {{featureDescription}}, {{ctaUrl}}"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading templates...
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
                        <p className="text-sm text-foreground">{template.subject}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Template Key:</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{template.template_key}</code>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setPreviewTemplate(template)}
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{template.name} Preview</DialogTitle>
                              <DialogDescription>
                                HTML preview of the email template
                              </DialogDescription>
                            </DialogHeader>
                            <div 
                              className="border rounded-lg p-4 bg-white"
                              dangerouslySetInnerHTML={{ __html: template.html_content }}
                            />
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => setEditingTemplate(template)}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit {template.name}</DialogTitle>
                              <DialogDescription>
                                Update the email template content
                              </DialogDescription>
                            </DialogHeader>
                            {editingTemplate && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="subject">Subject Line</Label>
                                  <Input
                                    id="subject"
                                    value={editingTemplate.subject}
                                    onChange={(e) => setEditingTemplate({
                                      ...editingTemplate,
                                      subject: e.target.value
                                    })}
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="html">HTML Content</Label>
                                  <Textarea
                                    id="html"
                                    value={editingTemplate.html_content}
                                    onChange={(e) => setEditingTemplate({
                                      ...editingTemplate,
                                      html_content: e.target.value
                                    })}
                                    rows={10}
                                    className="font-mono text-xs"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="text">Plain Text Content</Label>
                                  <Textarea
                                    id="text"
                                    value={editingTemplate.text_content}
                                    onChange={(e) => setEditingTemplate({
                                      ...editingTemplate,
                                      text_content: e.target.value
                                    })}
                                    rows={6}
                                  />
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="active"
                                    checked={editingTemplate.is_active}
                                    onCheckedChange={(checked) => setEditingTemplate({
                                      ...editingTemplate,
                                      is_active: checked
                                    })}
                                  />
                                  <Label htmlFor="active">Active</Label>
                                </div>

                                <div className="flex gap-2 justify-end">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setEditingTemplate(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={() => updateTemplate(editingTemplate)}>
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Warning Card */}
          <Card className="mt-8 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Important: Template Variables
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Make sure to use the correct variable syntax {"{{variableName}}"} in your templates. 
                    Variables will be replaced with actual values when emails are sent. Test emails thoroughly 
                    after making changes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
