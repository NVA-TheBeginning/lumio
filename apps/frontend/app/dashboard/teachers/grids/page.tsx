"use client";

import { Plus, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Criterion {
  id: number;
  name: string;
  weight: number;
  type: "DELIVERABLE" | "REPORT" | "PRESENTATION";
  individual: boolean;
}

export default function GridsPage() {
  const [gridName, setGridName] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const addCriterion = () => {
    setCriteria((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        weight: 0,
        type: "DELIVERABLE",
        individual: false,
      },
    ]);
  };

  const updateCriterion = (index: number, field: keyof Criterion, value: string | number | boolean) => {
    setCriteria((prev) => {
      const newCriteria = [...prev];
      newCriteria[index] = {
        ...newCriteria[index],
        [field]: value,
      } as Criterion;
      return newCriteria;
    });
  };

  const removeCriterion = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!gridName || criteria.length === 0) {
      toast.error("Veuillez saisir un nom et au moins un critère");
      return;
    }
    // This is where an API call would be made
    console.log({ gridName, criteria });
    toast.success("Grille créée avec succès");
    setGridName("");
    setCriteria([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle grille de notation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nom de la grille</Label>
            <Input value={gridName} onChange={(e) => setGridName(e.target.value)} placeholder="Ex: Soutenance finale" />
          </div>
          <div className="space-y-4">
            {criteria.map((criterion, index) => (
              <div key={criterion.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2 space-y-1">
                  <Label>Nom</Label>
                  <Input value={criterion.name} onChange={(e) => updateCriterion(index, "name", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Poids (%)</Label>
                  <Input
                    type="number"
                    value={criterion.weight}
                    onChange={(e) => updateCriterion(index, "weight", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={criterion.type} onValueChange={(val) => updateCriterion(index, "type", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DELIVERABLE">Livrable</SelectItem>
                      <SelectItem value="REPORT">Rapport</SelectItem>
                      <SelectItem value="PRESENTATION">Présentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={criterion.individual}
                    onCheckedChange={(val) => updateCriterion(index, "individual", val)}
                  />
                  <span className="text-sm">Individuel</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCriterion(index)}
                    aria-label="Supprimer le critère"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un critère
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit}>Sauvegarder la grille</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
