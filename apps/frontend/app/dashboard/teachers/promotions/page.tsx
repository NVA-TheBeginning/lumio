"use client";

import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { PromotionSelector } from "./selector";
import { MembersTable } from "./table";

export default function PromotionsPage() {
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-muted-foreground">Gérez vos promotions d'étudiants</p>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Sélectionner une promotion</h2>
          <PromotionSelector value={selectedPromotionId} onChange={setSelectedPromotionId} />
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Liste des étudiants de cette promotion</CardDescription>
          </CardHeader>
          <CardContent>
            <MembersTable promotionId={selectedPromotionId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
