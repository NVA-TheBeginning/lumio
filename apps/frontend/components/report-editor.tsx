"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Eye, FileText, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getReport, updateReport } from "@/app/dashboard/students/reports/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ReportSection, UpdateReportDto } from "@/types/report";

export default function ReportEditor({ reportId }: { reportId: number }) {
  const queryClient = useQueryClient();

  const [sections, setSections] = useState<ReportSection[]>([]);
  const [activeSection, setActiveSection] = useState<number>(0);
  const [isPreview, setIsPreview] = useState<boolean>(false);

  useQuery({
    queryKey: ["reports", reportId],
    queryFn: async () => {
      const report = await getReport(reportId);
      setSections(report.sections);
      return report;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateReportDto }) => updateReport(id, data),
    onSuccess: () => {
      toast.success("Rapport mis à jour", {
        description: "Vos modifications ont été sauvegardées.",
      });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: () => {
      toast.error("Erreur", {
        description: "Impossible de sauvegarder les modifications.",
      });
    },
  });

  const addSection = useCallback(() => {
    setSections((prevSections) => [...prevSections, { title: "", contentMarkdown: "" }]);
    setActiveSection(sections.length);
  }, [sections.length]);

  const removeSection = useCallback(
    (index: number) => {
      if (sections.length > 1) {
        setSections((prevSections) => prevSections.filter((_, i) => i !== index));
        setActiveSection((prevActiveSection) =>
          prevActiveSection >= sections.length - 1 ? sections.length - 2 : prevActiveSection,
        );
      }
    },
    [sections.length],
  );

  const updateSection = useCallback((index: number, field: keyof ReportSection, value: string) => {
    setSections((prevSections) => {
      const newSections = [...prevSections];
      newSections[index] = {
        ...newSections[index],
        title: field === "title" ? value : newSections[index]?.title || "titre",
        contentMarkdown: field === "contentMarkdown" ? value : newSections[index]?.contentMarkdown || "contenu",
      };
      return newSections;
    });
  }, []);

  const moveSection = useCallback(
    (index: number, direction: "up" | "down") => {
      const canMoveUp = direction === "up" && index > 0;
      const canMoveDown = direction === "down" && index < sections.length - 1;

      if (!(canMoveUp || canMoveDown)) return;

      setSections((prevSections) => {
        const newSections = [...prevSections];
        const targetIndex = direction === "up" ? index - 1 : index + 1;

        if (newSections[index] && newSections[targetIndex]) {
          [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        }

        return newSections;
      });

      setActiveSection(direction === "up" ? index - 1 : index + 1);
    },
    [sections.length],
  );

  const handleSave = useCallback(() => {
    const updateData = {
      sections: sections.map((section, index) => ({
        id: section.id ?? index,
        title: section.title,
        contentMarkdown: section.contentMarkdown,
      })),
    };
    updateMutation.mutate({ id: reportId, data: updateData });
  }, [reportId, sections, updateMutation]);

  const renderMarkdownPreview = useCallback((markdown: string): string => {
    if (!markdown) return "";

    let html = markdown
      // Headings
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2 mt-4">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-6">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 mt-8">$1</h1>')
      // Formatting
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      // Lists
      .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
      // Paragraphs
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/\n/gim, "<br>");

    // Wrap in paragraph if no block elements exist
    if (!(html.includes("<h") || html.includes("<p") || html.includes("<li"))) {
      html = `<p class="mb-4">${html}</p>`;
    }

    return html;
  }, []);

  const togglePreview = useCallback(() => {
    setIsPreview((prev) => !prev);
  }, []);

  const navigateToSection = useCallback(
    (direction: "prev" | "next") => {
      setActiveSection((prevActiveSection) => {
        if (direction === "prev") {
          return Math.max(0, prevActiveSection - 1);
        }
        return Math.min(sections.length - 1, prevActiveSection + 1);
      });
    },
    [sections.length],
  );

  const isLoading = updateMutation.isPending;
  const currentSection = sections[activeSection];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Éditeur de Rapport</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={togglePreview}>
            <Eye className="w-4 h-4 mr-2" />
            {isPreview ? "Éditer" : "Prévisualiser"}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Sections
                <Button size="sm" onClick={addSection}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {sections.map((section, index) => (
                  // biome-ignore lint/a11y/noStaticElementInteractions: fine here
                  <div
                    key={index}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      activeSection === index ? "bg-muted" : ""
                    }`}
                    onClick={() => setActiveSection(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setActiveSection(index);
                      }
                      if (e.key === "Delete" || e.key === "Backspace") {
                        e.stopPropagation();
                        removeSection(index);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{section.title || `Section ${index + 1}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {section.contentMarkdown?.length || 0} caractères
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(index, "up");
                          }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(index, "down");
                          }}
                          disabled={index === sections.length - 1}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {sections.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full mt-2 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(index);
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {isPreview ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Prévisualisation du Rapport
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {sections.map((section, index) => (
                    <div key={index} className="border-b pb-6 last:border-b-0">
                      <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-muted">
                        {section.title || `Section ${index + 1}`}
                      </h2>
                      <div className="prose prose-sm max-w-none">
                        {section.contentMarkdown ? (
                          <div
                            className="space-y-4"
                            // biome-ignore lint/security/noDangerouslySetInnerHtml: We trust the markdown content here
                            dangerouslySetInnerHTML={{
                              __html: renderMarkdownPreview(section.contentMarkdown),
                            }}
                          />
                        ) : (
                          <p className="text-muted-foreground italic">Aucun contenu</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {currentSection?.title || `Section ${activeSection + 1}`}
                  </CardTitle>
                  <Badge variant="secondary">
                    Section {activeSection + 1} sur {sections.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="section-title">Titre de la section</Label>
                  <Input
                    id="section-title"
                    value={currentSection?.title || ""}
                    onChange={(e) => updateSection(activeSection, "title", e.target.value)}
                    placeholder="Entrez le titre de la section..."
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="markdown-content">Contenu Markdown</Label>
                  <Textarea
                    id="markdown-content"
                    value={currentSection?.contentMarkdown || ""}
                    onChange={(e) => updateSection(activeSection, "contentMarkdown", e.target.value)}
                    placeholder="# Titre&#10;&#10;Votre contenu en **Markdown**...&#10;&#10;- Liste à puces&#10;- Autre élément&#10;&#10;## Sous-titre&#10;&#10;Paragraphe avec *italique* et **gras**."
                    className="min-h-[400px] font-mono resize-none"
                    rows={20}
                  />
                  <p className="text-sm text-muted-foreground">
                    Utilisez la syntaxe Markdown : **gras**, *italique*, # titres, - listes, etc.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigateToSection("prev")} disabled={activeSection === 0}>
                      Section précédente
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigateToSection("next")}
                      disabled={activeSection === sections.length - 1}
                    >
                      Section suivante
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentSection?.contentMarkdown?.length || 0} caractères
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
