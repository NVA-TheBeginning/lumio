"use client";

import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Promotion } from "./action";

interface PromotionSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  promotions: Promotion[];
  isLoading: boolean;
  isError: boolean;
}

export function PromotionSelector({ value, onChange, promotions, isLoading, isError }: PromotionSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const selectedPromotion = promotions?.find((p) => p.id === value);

  return (
    <div className="flex items-center space-x-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" aria-expanded={open} className="w-[300px] justify-between">
            {isLoading ? (
              <Skeleton className="h-4 w-[200px]" />
            ) : value && selectedPromotion ? (
              selectedPromotion.name
            ) : (
              "Sélectionner une promotion"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher une promotion..." />
            <CommandList>
              <CommandEmpty>Aucune promotion trouvée.</CommandEmpty>
              {isLoading ? (
                <div className="p-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full mt-2" />
                  <Skeleton className="h-8 w-full mt-2" />
                </div>
              ) : isError ? (
                <div className="p-2 text-sm text-destructive">Erreur lors du chargement des promotions.</div>
              ) : (
                <CommandGroup>
                  {promotions?.map((promotion) => (
                    <CommandItem
                      key={promotion.id}
                      value={promotion.name}
                      onSelect={() => {
                        onChange(promotion.id);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === promotion.id ? "opacity-100" : "opacity-0")} />
                      {promotion.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandSeparator />
            </CommandList>
            <CommandItem
              className="cursor-pointer"
              onSelect={() => {
                router.push("/dashboard/teachers/promotions/new");
                setOpen(false);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Créer une nouvelle promotion
            </CommandItem>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
