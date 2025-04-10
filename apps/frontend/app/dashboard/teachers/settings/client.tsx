"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const profileSchema = z
  .object({
    lastname: z.string().min(3, {
      message: "Le nom doit contenir au moins 3 caractères.",
    }),
    firstname: z.string().min(3, {
      message: "Le prénom doit contenir au moins 3 caractères.",
    }),
    email: z.string().email({
      message: "Veuillez entrer une adresse email valide.",
    }),
    currentPassword: z.string().min(1, {
      message: "Veuillez entrer votre mot de passe actuel pour confirmer.",
    }),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword || data.confirmPassword) {
        return data.newPassword === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Les mots de passe ne correspondent pas.",
      path: ["confirmPassword"],
    },
  )
  .refine(
    (data) => {
      if (data.newPassword) {
        return data.newPassword.length >= 8;
      }
      return true;
    },
    {
      message: "Le mot de passe doit contenir au moins 8 caractères.",
      path: ["newPassword"],
    },
  );

export default function ParametersForm({
  firstname,
  lastname,
  email,
}: {
  firstname: string | null | undefined;
  lastname: string | null | undefined;
  email: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues = {
    lastname: lastname ?? "",
    firstname: firstname ?? "",
    email,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  async function onSubmit(_: z.infer<typeof profileSchema>) {
    setIsLoading(true);
    try {
      form.setValue("currentPassword", "");
      form.setValue("newPassword", "");
      form.setValue("confirmPassword", "");
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex justify-center w-full">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Mettez à jour vos informations de compte et votre mot de passe.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>Votre nom de famille.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>Votre prénom.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormDescription>
                        Cette adresse sera utilisée pour les communications importantes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Changer de mot de passe</h3>
                <p className="text-sm text-muted-foreground">
                  Laissez les champs vides si vous ne souhaitez pas modifier votre mot de passe.
                </p>

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
                      </FormControl>
                      <FormDescription>Utilisez un mot de passe fort avec au moins 8 caractères.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe actuel</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>
                      Veuillez entrer votre mot de passe actuel pour confirmer les changements.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? "Mise à jour..." : "Enregistrer les modifications"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
