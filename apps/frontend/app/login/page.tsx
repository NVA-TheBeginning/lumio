"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginApiClient } from "@/app/login/action";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ROLES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export default function LoginPage() {
  const router = useRouter();

  const { mutateAsync: onLoginSubmit } = useMutation({
    mutationFn: loginApiClient,
    onSuccess: (role) => {
      switch (role) {
        case "ADMIN":
          router.push("/admin");
          break;
        case "TEACHER":
          router.push("/teachers/dashboard");
          break;
        case "STUDENT":
          router.push("/students/dashboard");
          break;
        default:
          toast.error("Rôle inconnu");
          return;
      }
      router.refresh();
    },
    onError: (error) => {
      console.error("Erreur de connexion:", error);
      toast.error("Identifiants incorrects. Veuillez réessayer.");
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="absolute top-8 left-8 text-primary font-bold text-xl">
        Lumio
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
          <CardDescription className="text-center">Entrez vos identifiants pour accéder à votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm onLoginSubmit={onLoginSubmit} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Vous n'avez pas de compte ?{" "}
            <Link href="/register" className="text-primary underline hover:text-primary/90">
              S'inscrire
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
