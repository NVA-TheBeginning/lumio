"use client";

import { useMutation } from "@tanstack/react-query";
import {
  Archive,
  Code,
  DownloadIcon,
  FileIcon,
  FileImageIcon,
  FileIcon as FilePdfIcon,
  FileIcon as FilePresentation,
  FileSpreadsheetIcon,
  FileText,
  FileTextIcon,
  MoreHorizontalIcon,
  Music,
  TrashIcon,
  Video,
} from "lucide-react";
import { useState } from "react";
import type { Document } from "@/app/dashboard/teachers/documents/actions";
import { downloadDocument } from "@/app/dashboard/teachers/documents/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBytes, formatDate } from "@/lib/utils";

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  onDocumentDeleted: (id: number) => void;
}

export default function DocumentListGrid({ documents, isLoading, onDocumentDeleted }: DocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  const downloadMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const documentData = await downloadDocument(id);
      const fileName = documentData.key;

      let uint8Array: Uint8Array;
      if (
        typeof documentData.file === "object" &&
        documentData.file !== null &&
        "data" in documentData.file &&
        Array.isArray(documentData.file.data)
      ) {
        const dataArray = documentData.file.data;
        uint8Array = new Uint8Array(dataArray);
      } else {
        console.error("Unexpected data type for documentData.file:", typeof documentData.file);
        return;
      }

      const blob = new Blob([uint8Array], {
        type: documentData.mimeType,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error) => {
      console.error("Failed to download document:", error);
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <FileImageIcon className="h-16 w-16 text-blue-500" />;
    } else if (mimeType === "application/pdf") {
      return <FilePdfIcon className="h-16 w-16 text-red-500" />;
    } else if (mimeType.startsWith("text/")) {
      return <FileTextIcon className="h-16 w-16 text-green-500" />;
    } else if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("xlsx")) {
      return <FileSpreadsheetIcon className="h-16 w-16 text-emerald-500" />;
    } else if (mimeType.includes("presentation") || mimeType.includes("powerpoint") || mimeType.includes("pptx")) {
      return <FilePresentation className="h-16 w-16 text-orange-500" />;
    } else if (mimeType.includes("wordprocessing") || mimeType.includes("word") || mimeType.includes("docx")) {
      return <FileText className="h-16 w-16 text-blue-600" />;
    } else if (mimeType.includes("zip") || mimeType.includes("compressed") || mimeType.includes("archive")) {
      return <Archive className="h-16 w-16 text-amber-500" />;
    } else if (mimeType.includes("video")) {
      return <Video className="h-16 w-16 text-purple-500" />;
    } else if (mimeType.includes("audio")) {
      return <Music className="h-16 w-16 text-pink-500" />;
    } else if (mimeType.includes("json") || mimeType.includes("javascript") || mimeType.includes("code")) {
      return <Code className="h-16 w-16 text-gray-600" />;
    } else {
      return <FileIcon className="h-16 w-16 text-gray-500" />;
    }
  };

  const getFileColor = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return "bg-blue-50 border-blue-200";
    } else if (mimeType === "application/pdf") {
      return "bg-red-50 border-red-200";
    } else if (mimeType.startsWith("text/")) {
      return "bg-green-50 border-green-200";
    } else if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("xlsx")) {
      return "bg-emerald-50 border-emerald-200";
    } else if (mimeType.includes("presentation") || mimeType.includes("powerpoint") || mimeType.includes("pptx")) {
      return "bg-orange-50 border-orange-200";
    } else if (mimeType.includes("wordprocessing") || mimeType.includes("word") || mimeType.includes("docx")) {
      return "bg-blue-50 border-blue-200";
    } else if (mimeType.includes("zip") || mimeType.includes("compressed") || mimeType.includes("archive")) {
      return "bg-amber-50 border-amber-200";
    } else if (mimeType.includes("video")) {
      return "bg-purple-50 border-purple-200";
    } else if (mimeType.includes("audio")) {
      return "bg-pink-50 border-pink-200";
    } else if (mimeType.includes("json") || mimeType.includes("javascript") || mimeType.includes("code")) {
      return "bg-gray-50 border-gray-200";
    } else {
      return "bg-gray-50 border-gray-200";
    }
  };

  const handleDownload = (id: number) => {
    downloadMutation.mutate({ id });
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      onDocumentDeleted(documentToDelete.id);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const confirmDelete = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <FileIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Pas de documents trouvés</h3>
        <p className="mt-2 text-sm text-muted-foreground">Téléchargez votre premier document pour commencer.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documents.map((document) => (
          <Card key={document.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className={`flex justify-center items-center p-6 ${getFileColor(document.mimeType)}`}>
              {getFileIcon(document.mimeType)}
            </div>
            <CardContent className="p-4">
              <div className="truncate font-medium" title={document.name}>
                {document.name}
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex justify-between">
                <span>{formatBytes(document.sizeInBytes)}</span>
                <span>{formatDate(document.uploadedAt)}</span>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                onClick={() => handleDownload(document.id)}
                disabled={downloadMutation.isPending}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Télécharger
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => confirmDelete(document)}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le document sera supprimé de manière permanente. Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
