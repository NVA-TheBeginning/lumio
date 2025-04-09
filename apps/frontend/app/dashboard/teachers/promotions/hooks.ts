"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPromotion, deletePromotion, getPromotionMembers, getPromotions, removeMember } from "./action";

export function usePromotions() {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: getPromotions,
  });
}

export function usePromotionMembers(promotionId: number | null) {
  return useQuery({
    queryKey: ["promotions", promotionId, "members"],
    queryFn: () => (promotionId ? getPromotionMembers(promotionId) : Promise.resolve([])),
    enabled: !!promotionId,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ promotionId, memberId }: { promotionId: number; memberId: number }) =>
      removeMember(promotionId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
  });
}
