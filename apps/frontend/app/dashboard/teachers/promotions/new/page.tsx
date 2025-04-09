"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getUserFromCookie } from "@/lib/cookie";
import { useCreatePromotion } from "../hooks";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères",
  }),
  description: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères",
  }),
  students_csv: z.string().min(1, {
    message: "Veuillez importer un fichier CSV",
  }),
});

export default function CreatePromotionForm() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");

  const createMutation = useCreatePromotion();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      students_csv: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Veuillez importer un fichier CSV valide");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      form.setValue("students_csv", content);
    };
    reader.readAsText(file);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const user = await getUserFromCookie();
    if (!user) {
      toast.error("Utilisateur non authentifié");
      return;
    }

    const creatorId = Number(user.id);

    createMutation.mutate(
      {
        ...values,
        creatorId,
      },
      {
        onSuccess: () => {
          toast.success("Promotion créée avec succès");
          router.push("/dashboard/promotions");
        },
        onError: (error) => {
          toast.error("Une erreur est survenue lors de la création de la promotion");
          console.error("Error creating promotion:", error);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la promotion</FormLabel>
              <FormControl>
                <Input placeholder="ex: Master 2 Informatique 2023-2024" {...field} />
              </FormControl>
              <FormDescription>Le nom qui identifiera cette promotion</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Décrivez cette promotion..." className="min-h-[100px]" {...field} />
              </FormControl>
              <FormDescription>Une brève description de cette promotion</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="students_csv"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Liste des étudiants (CSV)</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-2">
                  <Input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={handleFileChange} />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("csv-upload")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Importer un CSV
                    </Button>
                    {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
                  </div>
                  <input type="hidden" {...field} />
                </div>
              </FormControl>
              <FormDescription>
                Importez un fichier CSV contenant la liste des étudiants. Le fichier doit contenir les colonnes
                suivantes : nom, prénom, email.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-start">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Création en cours..." : "Créer la promotion"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
