"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileSpreadsheet, Info, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getUserFromCookie } from "@/lib/cookie";
import { isNotEmpty, isNotNull } from "@/lib/utils";
import { useCreatePromotion } from "../hooks";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères",
  }),
  description: z.string().min(5, {
    message: "La description doit contenir au moins 5 caractères",
  }),
  students_csv: z.string().min(1, {
    message: "Veuillez importer un fichier CSV valide",
  }),
});

type StudentData = {
  nom: string | undefined;
  prenom: string | undefined;
  email: string | undefined;
};

const generateTemplateCSV = () => {
  const exampleRows = [
    "Dupont,Marie,marie.dupont@example.com",
    "Martin,Jean,jean.martin@example.com",
    "Dubois,Sophie,sophie.dubois@example.com",
  ].join("\n");

  return exampleRows;
};

const downloadTemplateCSV = () => {
  const csvContent = generateTemplateCSV();
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "modele_etudiants.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const parseCSV = (csvText: string): StudentData[] =>
  csvText.split("\n").reduce<StudentData[]>((acc, line) => {
    if (!line.trim()) return acc;
    const [nom = "", prenom = "", email = ""] = line.split(",").map((item) => item.trim());
    acc.push({ nom, prenom, email });
    return acc;
  }, []);

const validateCSVData = (data: StudentData[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const emails = new Set<string>();

  data.forEach((student, index) => {
    const rowNum = index + 1;

    if (!isNotEmpty(student.nom)) {
      errors.push(`Ligne ${rowNum}: Le nom est manquant`);
    }

    if (!isNotEmpty(student.prenom)) {
      errors.push(`Ligne ${rowNum}: Le prénom est manquant`);
    }

    if (!isNotEmpty(student.email)) {
      errors.push(`Ligne ${rowNum}: L'email est manquant`);
    } else if (!EMAIL_REGEX.test(student.email)) {
      errors.push(`Ligne ${rowNum}: L'email '${student.email}' est invalide`);
    } else if (emails.has(student.email)) {
      errors.push(`Ligne ${rowNum}: L'email '${student.email}' est en doublon`);
    } else {
      emails.add(student.email);
    }
  });

  return { valid: errors.length === 0, errors };
};

export default function CreatePromotionForm() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [csvData, setCsvData] = useState<StudentData[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const createMutation = useCreatePromotion();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      students_csv: "",
    },
  });

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
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

        try {
          const parsedData = parseCSV(content);
          const validation = validateCSVData(parsedData);

          setCsvData(parsedData);
          setCsvErrors(validation.errors);

          if (!validation.valid) {
            toast.error(`Le fichier CSV contient ${validation.errors.length} erreur(s)`);
          } else {
            toast.success(`${parsedData.length} étudiants importés avec succès`);
          }

          form.setValue("students_csv", content);
        } catch (error) {
          toast.error("Erreur lors de l'analyse du fichier CSV");
          console.error("CSV parsing error:", error);
        }
      };
      reader.readAsText(file);
    },
    [form],
  );

  const resetFile = useCallback(() => {
    setFileName("");
    setCsvData([]);
    setCsvErrors([]);
    form.setValue("students_csv", "");
    const fileInput = document.getElementById("csv-upload") as HTMLInputElement;
    if (isNotNull(fileInput)) fileInput.value = "";
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (csvErrors.length > 0) {
      toast.error("Veuillez corriger les erreurs dans le fichier CSV avant de continuer");
      return;
    }

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
          router.push("/dashboard/teachers/promotions");
        },
        onError: (error) => {
          toast.error("Une erreur est survenue lors de la création de la promotion");
          console.error("Error creating promotion:", error);
        },
      },
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Créer une nouvelle promotion</CardTitle>
        <CardDescription>Créez une promotion et importez la liste des étudiants</CardDescription>
      </CardHeader>
      <CardContent>
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
                  <div className="flex items-center">
                    <FormLabel>Liste des étudiants (CSV)</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              downloadTemplateCSV();
                            }}
                            aria-label="Télécharger un modèle CSV"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Télécharger un modèle</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      <Input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={handleFileChange} />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("csv-upload")?.click()}
                          className="shrink-0"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Importer un CSV
                        </Button>
                        {fileName && (
                          <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">{fileName}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 rounded-full"
                              onClick={resetFile}
                              aria-label="Supprimer le fichier"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {fileName && csvData.length > 0 && (
                          <Dialog open={showPreview} onOpenChange={setShowPreview}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Prévisualiser ({csvData.length})
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Prévisualisation des données</DialogTitle>
                                <DialogDescription>
                                  {csvData.length} étudiants importés depuis {fileName}
                                </DialogDescription>
                              </DialogHeader>

                              {csvErrors.length > 0 && (
                                <Alert variant="destructive" className="mb-4">
                                  <Info className="h-4 w-4" />
                                  <AlertTitle>Erreurs détectées</AlertTitle>
                                  <AlertDescription>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                      {csvErrors.slice(0, 5).map((error, _) => (
                                        <li key={error}>{error}</li>
                                      ))}
                                      {csvErrors.length > 5 && <li>...et {csvErrors.length - 5} autres erreurs</li>}
                                    </ul>
                                  </AlertDescription>
                                </Alert>
                              )}

                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[80px]">#</TableHead>
                                      <TableHead>Nom</TableHead>
                                      <TableHead>Prénom</TableHead>
                                      <TableHead>Email</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {csvData.slice(0, 100).map((student, index) => (
                                      <TableRow key={student.email}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{student.nom}</TableCell>
                                        <TableCell>{student.prenom}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                      </TableRow>
                                    ))}
                                    {csvData.length > 100 && (
                                      <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                          ...et {csvData.length - 100} autres étudiants
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                      <input type="hidden" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Importez un fichier CSV contenant la liste des étudiants. Le fichier doit contenir les colonnes
                    suivantes : nom, prénom, email.
                  </FormDescription>
                  {csvErrors.length > 0 && (
                    <div className="mt-2 text-sm text-destructive">
                      {csvErrors.length} erreur(s) détectée(s). Cliquez sur "Prévisualiser" pour voir les détails.
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pt-6">
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createMutation.isPending || csvErrors.length > 0}>
                  {createMutation.isPending ? "Création en cours..." : "Créer la promotion"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
