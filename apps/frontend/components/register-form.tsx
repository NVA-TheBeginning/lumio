"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import { GoogleOAuthButton } from "./google-auth-btn";

const registerSchema = z
  .object({
    email: z.email({ error: "Address email invalide" }),
    password: z.string().min(6, {
      message: "Le mot de passe doit contenir au moins 6 caractères",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onRegisterSubmit: (values: RegisterFormValues) => Promise<void>;
}

export function RegisterForm({ className, onRegisterSubmit, ...props }: RegisterFormProps) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: RegisterFormValues) => {
    await onRegisterSubmit(values);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input id="email" placeholder="johndoe@mail.com" type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="password">Mot de passe</FormLabel>
                  <FormControl>
                    <PasswordInput id="password" placeholder="******" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="confirmPassword">Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <PasswordInput id="confirmPassword" placeholder="******" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              S'inscrire
            </Button>
            <GoogleOAuthButton className="mt-2" />
          </div>
        </form>
      </Form>
    </div>
  );
}
