"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearUserCookie } from "@/lib/cookie";

export default function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: clearUserCookie,
    onSuccess: () => {
      queryClient.clear();
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      console.error("Logout error:", error);
    },
  });

  return (
    <Button
      className="cursor-pointer bg-red-800 hover:bg-red-700 text-white"
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      Déconnexion
    </Button>
  );
}
