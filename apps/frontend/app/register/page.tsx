"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerApi } from "@/app/register/action";
import { RegisterForm } from "@/components/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();

  const { mutateAsync: onRegisterSubmit } = useMutation({
    mutationFn: registerApi,
    onSuccess: () => {
      toast.success("Inscription réussie !");
      router.push("/login");
    },
    onError: (error) => {
      console.error("Erreur d'inscription:", error);
      toast.error(error instanceof Error ? error.message : "L'inscription a échoué. Veuillez réessayer.");
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="absolute top-8 left-8 text-primary font-bold text-xl">
        Lumio
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Inscription</CardTitle>
          <CardDescription className="text-center">Créez votre compte pour gérer vos projets éducatifs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegisterForm onRegisterSubmit={onRegisterSubmit} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-primary underline hover:text-primary/90">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
