"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { usePromotions } from "./hooks";
import { PromotionSelector } from "./selector";
import { MembersTable } from "./table";

export default function PromotionsPage() {
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);
  const { data: promotions, isLoading, isError } = usePromotions();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Sélectionner une promotion</h2>
          <PromotionSelector
            value={selectedPromotionId}
            onChange={setSelectedPromotionId}
            promotions={promotions || []}
            isLoading={isLoading}
            isError={isError}
          />
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
