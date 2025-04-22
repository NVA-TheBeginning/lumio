"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMember,
  createPromotion,
  deletePromotion,
  getPromotionMembers,
  getPromotions,
  removeMember,
} from "./action";

export function usePromotions() {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: getPromotions,
  });
}

export function usePromotionMembers(promotionId: number | null, page: number, size: number) {
  return useQuery({
    queryKey: ["promotions", promotionId, "members", page, size],
    queryFn: async () => {
      if (!promotionId) {
        return { data: [], size: 0, page: 1, pageSize: size, totalPages: 1 };
      }
      return getPromotionMembers(promotionId, page, size);
    },
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

export const useAddMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      promotionId,
      member,
    }: {
      promotionId: number;
      member: { lastname: string; firstname: string; email: string };
    }) => addMember(promotionId, member),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["promotions", variables.promotionId, "members"],
      });
    },
  });
};
