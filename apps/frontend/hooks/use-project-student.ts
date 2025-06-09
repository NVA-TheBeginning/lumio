import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMembersToGroup,
  getProjectByIdStudent,
  removeMemberFromGroup,
} from "@/app/dashboard/teachers/projects/actions";

export function useProjectStudent(projectId: number) {
  return useQuery({
    queryKey: ["project-student", Number(projectId)],
    queryFn: () => getProjectByIdStudent(Number(projectId)),
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, studentIds }: { groupId: number; studentIds: number[] }) =>
      addMembersToGroup(groupId, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-student"] });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) => removeMemberFromGroup(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-student"] });
    },
  });
}
