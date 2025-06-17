import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteSubmission, getSubmissions } from "@/app/dashboard/students/projects/actions";

export function useSubmissions(groupId: number, deliverableId?: number, enabled = true) {
  return useQuery({
    queryKey: ["submissions", groupId, deliverableId],
    queryFn: () => getSubmissions(groupId, deliverableId),
    enabled: enabled && !!groupId,
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: number) => deleteSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["project-student"] });
    },
  });
}
