"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { deleteDocument, getDocuments } from "@/app/dashboard/teachers/documents/actions";
import DocumentList from "@/components/documents-list";
import { Button } from "@/components/ui/button";
import UploadModal from "@/components/upload-modal";

export default function DocumentDrive() {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: documents,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const handleDocumentUploaded = () => {
    void queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  const handleDocumentDeleted = async (id: number) => {
    await deleteDocumentMutation.mutateAsync(id);
  };

  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-red-500">Error fetching documents: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Espace Documents</h1>
        <Button
          onClick={() => {
            setIsUploading(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusIcon size={16} />
          Ajouter
        </Button>
      </div>

      <DocumentList
        documents={documents ?? []}
        isLoading={isLoading}
        onDocumentDeleted={(id) => {
          void handleDocumentDeleted(id);
        }}
      />

      <UploadModal
        isOpen={isUploading}
        onClose={() => {
          setIsUploading(false);
        }}
        onDocumentUploaded={handleDocumentUploaded}
      />
    </div>
  );
}
