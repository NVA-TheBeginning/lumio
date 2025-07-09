import { useQuery } from "@tanstack/react-query";
import { getOrders, getPresentations } from "@/app/dashboard/teachers/projects/actions";

export function useStudentPresentationOrder(projectId: number, promotionId: number, groupId: number) {
  return useQuery({
    queryKey: ["student-presentation-order", projectId, promotionId, groupId],
    queryFn: async () => {
      if (!(projectId && promotionId && groupId)) return null;

      const presentations = await getPresentations(projectId, promotionId);

      if (!presentations?.length) return null;

      const presentationOrders = await Promise.all(
        presentations.map(async (presentation) => {
          const orders = await getOrders(presentation.id);
          const groupOrder = orders.find((order) => order.groupId === groupId);

          return {
            presentation,
            order: groupOrder || null,
          };
        }),
      );

      return presentationOrders.filter((po) => po.order !== null);
    },
    enabled: Boolean(projectId && promotionId && groupId),
  });
}
