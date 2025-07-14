"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCriteria,
  deleteCriteria,
  getAllCriteria,
  updateCriteria,
} from "@/app/dashboard/teachers/projects/actions";
import type { CreateCriteriaDto, UpdateCriteriaDto } from "@/lib/types";

export function useCriteria(projectId: number, promotionId: number) {
  return useQuery({
    queryKey: ["criteria", projectId, promotionId],
    queryFn: () => getAllCriteria(projectId, promotionId),
    enabled: Boolean(projectId && promotionId),
  });
}

export function useCreateCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      promotionId,
      data,
    }: {
      projectId: number;
      promotionId: number;
      data: CreateCriteriaDto;
    }) => createCriteria(projectId, promotionId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["criteria", variables.projectId, variables.promotionId],
      });
    },
  });
}

export function useUpdateCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      criteriaId,
      data,
    }: {
      criteriaId: number;
      data: UpdateCriteriaDto;
      projectId: number;
      promotionId: number;
    }) => updateCriteria(criteriaId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["criteria", variables.projectId, variables.promotionId],
      });
    },
  });
}

export function useDeleteCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ criteriaId }: { criteriaId: number; projectId: number; promotionId: number }) =>
      deleteCriteria(criteriaId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["criteria", variables.projectId, variables.promotionId],
      });
    },
  });
}
