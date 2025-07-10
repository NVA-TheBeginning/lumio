"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Link, Plus, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Document, getDocuments } from "@/app/dashboard/teachers/documents/actions";
import {
  downloadProjectDocument,
  linkDocumentToProject,
  ProjectType,
  unlinkDocumentFromProject,
  uploadDocumentToProject,
} from "@/app/dashboard/teachers/projects/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

interface ProjectDocumentsProps {
  project: ProjectType;
}

export function ProjectDocuments({ project }: ProjectDocumentsProps) {
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");

  const { data: allDocuments } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, name }: { file: File; name: string }) => {
      return uploadDocumentToProject(project.id, file, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", project.id] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentName("");
      toast.success("Document téléversé avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur lors du téléversement: ${error.message}`);
    },
  });

  const linkMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return linkDocumentToProject(documentId, project.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", project.id] });
      setLinkDialogOpen(false);
      setSelectedDocumentId("");
      toast.success("Document lié au projet avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur lors du lien: ${error.message}`);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return unlinkDocumentFromProject(documentId, project.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", project.id] });
      toast.success("Document dissocié du projet");
    },
    onError: (error) => {
      toast.error(`Erreur lors de la dissociation: ${error.message}`);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async ({ documentId, filename }: { documentId: number; filename: string }) => {
      const result = await downloadProjectDocument(documentId);
      return { ...result, filename };
    },
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Document téléchargé");
    },
    onError: (error) => {
      toast.error(`Erreur lors du téléchargement: ${error.message}`);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocumentName(file.name.split(".").slice(0, -1).join(".") || file.name);
    }
  };

  const handleUpload = () => {
    if (selectedFile && documentName.trim()) {
      uploadMutation.mutate({ file: selectedFile, name: documentName.trim() });
    }
  };

  const handleLink = () => {
    if (selectedDocumentId) {
      linkMutation.mutate(Number(selectedDocumentId));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    if (i >= sizes.length) {
      return `${parseFloat((bytes / k ** (sizes.length - 1)).toFixed(2))} ${sizes[sizes.length - 1]}`;
    }
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const getMimeTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📑";
    return "📁";
  };

  const availableDocuments =
    allDocuments?.filter((doc) => !project.documents.some((projDoc) => projDoc.id === doc.id)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documents du projet</h3>
          <p className="text-sm text-muted-foreground">Gérez les documents liés à ce projet</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Link className="h-4 w-4 mr-2" />
                Lier un document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lier un document existant</DialogTitle>
                <DialogDescription>Sélectionnez un document existant à lier à ce projet</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="document-select">Document</Label>
                  <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un document" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDocuments.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id.toString()}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleLink} disabled={!selectedDocumentId || linkMutation.isPending}>
                    {linkMutation.isPending ? "Liaison..." : "Lier"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Téléverser un nouveau document</DialogTitle>
                <DialogDescription>Téléversez un document directement lié à ce projet</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Fichier</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md"
                  />
                </div>
                {selectedFile && (
                  <div>
                    <Label htmlFor="document-name">Nom du document</Label>
                    <Input
                      id="document-name"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Nom du document"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadDialogOpen(false);
                      setSelectedFile(null);
                      setDocumentName("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || documentName.trim() === "" || uploadMutation.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadMutation.isPending ? "Téléversement..." : "Téléverser"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {project.documents.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">Aucun document</h4>
              <p className="text-muted-foreground mb-4">Ce projet n'a pas encore de documents associés</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => setLinkDialogOpen(true)}>
                  <Link className="h-4 w-4 mr-2" />
                  Lier un document
                </Button>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau document
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.documents.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getMimeTypeIcon(document.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{document.name}</CardTitle>
                      <CardDescription className="text-xs">{formatFileSize(document.sizeInBytes)}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => unlinkMutation.mutate(document.id)}
                    disabled={unlinkMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>Ajouté le {formatDate(document.uploadedAt)}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {document.mimeType}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => downloadMutation.mutate({ documentId: document.id, filename: document.name })}
                    disabled={downloadMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadMutation.isPending ? "Téléchargement..." : "Télécharger"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
