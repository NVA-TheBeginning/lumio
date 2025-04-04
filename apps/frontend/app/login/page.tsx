"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoginForm, type LoginFormValues } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginApiClient = async (credentials: LoginFormValues) => {
  const API_URL = "http://localhost:3000";
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error("Identifiants incorrects");
  }
};

export default function LoginPage() {
  const router = useRouter();

  const { mutateAsync: onLoginSubmit } = useMutation({
    mutationFn: loginApiClient,
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error) => {
      console.error("Erreur de connexion:", error);
      toast.error(error instanceof Error ? error.message : "Identifiants incorrects. Veuillez réessayer.");
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
