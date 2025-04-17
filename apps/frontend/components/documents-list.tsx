"use client";

import { useMutation } from "@tanstack/react-query";
import { DownloadIcon, FileIcon, FileImageIcon, FileIcon as FilePdfIcon, FileTextIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBytes, formatDate } from "@/lib/utils";

interface Document {
  id: number;
  name: string;
  mimeType: string;
  sizeInBytes: number;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  onDocumentDeleted: (id: number) => void;
}

export default function DocumentList({ documents, isLoading, onDocumentDeleted }: DocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  const downloadMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const blob = await downloadDocument(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
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
      return <FileImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (mimeType === "application/pdf") {
      return <FilePdfIcon className="h-5 w-5 text-red-500" />;
    } else if (mimeType.startsWith("text/")) {
      return <FileTextIcon className="h-5 w-5 text-green-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleDownload = (id: number, name: string) => {
    downloadMutation.mutate({ id, name });
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Taille</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  {getFileIcon(document.mimeType)}
                  {document.name}
                </TableCell>
                <TableCell>{document.mimeType}</TableCell>
                <TableCell>{formatBytes(document.sizeInBytes)}</TableCell>
                <TableCell>{document.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownload(document.id, document.name)}
                      disabled={downloadMutation.isPending}
                      title="Télécharger"
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => confirmDelete(document)} title="Delete">
                      <TrashIcon className="h-4 w-4" color="red" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Le document sera supprimé de manière permanente. Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
