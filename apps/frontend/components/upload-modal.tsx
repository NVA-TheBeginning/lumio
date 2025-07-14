"use client";

import { useMutation } from "@tanstack/react-query";
import { UploadIcon } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadDocument } from "@/app/dashboard/teachers/documents/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isNotEmpty } from "@/lib/utils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentUploaded?: () => void;
}

export default function UploadModal({ isOpen, onClose, onDocumentUploaded }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: ({ file, name }: { file: File; name: string }) => uploadDocument(file, name),
    onSuccess: () => {
      resetForm();
      onClose();
      onDocumentUploaded?.();
      toast.success("Fichier téléchargé avec succès");
    },
    onError: (error: Error) => {
      console.error("Upload failed:", error);
      toast.error("Échec du téléchargement du fichier");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!name) {
        const fileName = selectedFile.name.split(".");
        fileName.pop();
        setName(fileName.join("."));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Selectionnez un fichier à télécharger");
      return;
    }

    if (!name.trim()) {
      setError("Entrez un nom de fichier");
      return;
    }

    uploadMutation.mutate({ file, name });
  };

  const resetForm = () => {
    setFile(null);
    setName("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (uploadMutation.isPending) return;

    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Télécharger un document</DialogTitle>
          <DialogDescription>Rajouter un document à votre espace de stockage.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Fichier</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="flex-1"
                disabled={uploadMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom du fichier</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document name"
              disabled={uploadMutation.isPending}
            />
          </div>

          {isNotEmpty(error) && <div className="text-sm font-medium text-destructive">{error}</div>}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={uploadMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending} className="flex items-center gap-2">
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4" />
                  Télécharger
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
