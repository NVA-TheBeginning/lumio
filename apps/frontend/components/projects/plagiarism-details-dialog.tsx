import { AlertTriangle, Copy, FileText, GitBranch, Percent } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { isNotEmpty } from "@/lib/utils";

interface PlagiarismMatch {
  matchedFolder: string;
  overallMatchPercentage: number;
  combinedScore: number;
  flags: string[];
}

interface PlagiarismResult {
  folderName: string;
  sha1: string | null;
  plagiarismPercentage: number;
  matches: PlagiarismMatch[];
}

interface PlagiarismDetailsDialogProps {
  plagiarismResult: PlagiarismResult;
  children: React.ReactNode;
}

export function PlagiarismDetailsDialog({ plagiarismResult, children }: PlagiarismDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const getPlagiarismSeverity = (percentage: number) => {
    if (percentage >= 70) return { level: "Élevé", color: "text-red-600", bgColor: "bg-red-100" };
    if (percentage >= 50) return { level: "Moyen", color: "text-orange-600", bgColor: "bg-orange-100" };
    if (percentage >= 20) return { level: "Faible", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    return { level: "Minimal", color: "text-green-600", bgColor: "bg-green-100" };
  };

  const getMatchSeverity = (percentage: number) => {
    if (percentage >= 80) return "text-red-600";
    if (percentage >= 60) return "text-orange-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getGroupName = (folderName: string) => {
    const parts = folderName.split("-");
    return parts.length > 1 ? parts.slice(1).join("-") : folderName;
  };

  const severity = getPlagiarismSeverity(plagiarismResult.plagiarismPercentage);
  const hasMatches = Boolean(plagiarismResult.matches) && plagiarismResult.matches.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-[90vw] min-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Détails du plagiat - {getGroupName(plagiarismResult.folderName)}
          </DialogTitle>
          <DialogDescription>Analyse détaillée de la détection de plagiat pour cette soumission</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 px-2">
            <div className={`p-4 rounded-lg ${severity.bgColor}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  <span className="font-medium">Score de plagiat global</span>
                </div>
                <Badge variant="outline" className={`${severity.color} border-current`}>
                  {severity.level}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pourcentage de similarité</span>
                  <span className={`font-bold text-lg ${severity.color}`}>
                    {plagiarismResult.plagiarismPercentage}%
                  </span>
                </div>
                <Progress value={plagiarismResult.plagiarismPercentage} className="h-2" />
              </div>
            </div>

            <div className="bg-muted/50 border rounded-lg p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4" />
                Informations techniques
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <span className="font-medium">Dossier analysé:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-background border px-3 py-2 rounded text-xs font-mono flex-1">
                      {plagiarismResult.folderName}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(plagiarismResult.folderName)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {isNotEmpty(plagiarismResult.sha1) && (
                  <div className="space-y-2">
                    <span className="font-medium">Empreinte SHA1:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-background border px-3 py-2 rounded text-xs font-mono flex-1">
                        {plagiarismResult.sha1.substring(0, 16)}...
                      </code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(plagiarismResult.sha1 || "")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Correspondances détaillées
              </h3>

              {!hasMatches ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune correspondance détaillée disponible</p>
                  <p className="text-sm mt-1">Le score global est basé sur l'analyse générale du contenu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {plagiarismResult.matches.map((match, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getGroupName(match.matchedFolder)}</span>
                          <Badge variant="outline" className="text-xs">
                            Correspondance #{index + 1}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(match.matchedFolder)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Pourcentage de correspondance:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`font-bold ${getMatchSeverity(match.overallMatchPercentage)}`}>
                              {match.overallMatchPercentage}%
                            </span>
                            <Progress value={match.overallMatchPercentage} className="h-1 flex-1" />
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Score combiné:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`font-bold ${getMatchSeverity(match.combinedScore)}`}>
                              {match.combinedScore}%
                            </span>
                            <Progress value={match.combinedScore} className="h-1 flex-1" />
                          </div>
                        </div>
                      </div>

                      {match.flags && match.flags.length > 0 && (
                        <div className="mt-3">
                          <span className="font-medium text-sm">Indicateurs détectés:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {match.flags.map((flag, flagIndex) => (
                              <Badge
                                key={flagIndex}
                                variant={flag === "VERY_HIGH_SIMILARITY" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-muted/50 border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="bg-primary rounded-full p-2 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-3">Guide d'interprétation des résultats</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="bg-muted rounded-full p-1 mt-0.5">
                          <Percent className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="font-medium">Score global</p>
                          <p className="text-muted-foreground">
                            Pourcentage de similarité générale détectée dans la soumission
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="bg-muted rounded-full p-1 mt-0.5">
                          <GitBranch className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="font-medium">Correspondances</p>
                          <p className="text-muted-foreground">
                            Détails des similarités avec d'autres soumissions du même livrable
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="bg-muted rounded-full p-1 mt-0.5">
                          <FileText className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="font-medium">Indicateurs</p>
                          <p className="text-muted-foreground">
                            Éléments spécifiques ayant déclenché la détection de plagiat
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="bg-muted rounded-full p-1 mt-0.5">
                          <Copy className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="font-medium">SHA1</p>
                          <p className="text-muted-foreground">
                            Empreinte unique pour identifier et tracer la soumission
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> Ces résultats sont indicatifs et nécessitent une analyse humaine pour
                        confirmation. Un score élevé ne confirme pas automatiquement un plagiat.
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <h5 className="font-medium mb-2 text-sm">Algorithmes de détection utilisés</h5>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div>
                          <strong>MOSS (Measure of Software Similarity):</strong> Détecte les similitudes structurelles
                          dans le code, même après refactoring, renommage de variables, ou réorganisation. Efficace
                          contre les modifications superficielles.
                        </div>
                        <div>
                          <strong>Rabin-Karp:</strong> Détecte les copies exactes et quasi-exactes de séquences de
                          texte. Identifie les blocs de code identiques ou très similaires, même dispersés dans le
                          fichier.
                        </div>
                        <div className="pt-1 border-t border-border">
                          <strong>Complémentarité:</strong> MOSS capture les plagiat "intelligents" avec modifications,
                          tandis que Rabin-Karp trouve les copies directes. L'utilisation combinée offre une détection
                          plus complète.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
