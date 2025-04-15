"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Role } from "@/app/login/page";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import { GoogleOAuthButton } from "./google-auth-btn";

const loginSchema = z.object({
  email: z.string().email({ message: "Addresse email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onLoginSubmit: (values: LoginFormValues) => Promise<Role | undefined>;
}

export function LoginForm({ className, onLoginSubmit, ...props }: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    await onLoginSubmit(values);
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
                  <div className="flex justify-between items-center">
                    <FormLabel htmlFor="password">Password</FormLabel>
                  </div>
                  <FormControl>
                    <PasswordInput id="password" placeholder="******" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                  <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                    Mot de passe oublié ?
                  </Link>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
            <GoogleOAuthButton className="mt-2" />
          </div>
        </form>
      </Form>
    </div>
  );
}
