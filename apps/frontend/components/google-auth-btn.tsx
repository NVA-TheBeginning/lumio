"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { googleOAuthLogin } from "@/lib/google";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type: string;
              theme: string;
              size: string;
              text: string;
              shape: string;
              logo_alignment: string;
              width: number;
            },
          ) => void;

          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleOAuthButtonProps {
  className?: string;
}

export function GoogleOAuthButton({ className }: GoogleOAuthButtonProps) {
  const router = useRouter();

  const { mutateAsync: handleGoogleLogin } = useMutation({
    mutationFn: googleOAuthLogin,
    onSuccess: (role) => {
      switch (role) {
        case "ADMIN":
          router.push("/admin");
          break;
        case "TEACHER":
          router.push("/dashboard/teachers");
          break;
        case "STUDENT":
          router.push("/dashboard/students");
          break;
        default:
          toast.error("Rôle inconnu");
          return;
      }
      router.refresh();
    },
    onError: (error) => {
      console.error("Erreur de connexion Google:", error);
      toast.error("Échec de l'authentification Google");
    },
  });

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        await handleGoogleLogin(response.credential);
      } catch (error) {
        console.error("Error processing Google credential:", error);
      }
    },
    [handleGoogleLogin],
  );

  useEffect(() => {
    const loadGoogleScript = () => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    const cleanup = loadGoogleScript();

    const initializeGoogleSignIn = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(initializeGoogleSignIn);

        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
          callback: handleCredentialResponse,
          auto_select: false,
        });

        const buttonContainer = document.getElementById("google-signin-button");
        if (buttonContainer) {
          window.google.accounts.id.renderButton(buttonContainer, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "center",
            width: buttonContainer.offsetWidth,
          });
        }
      }
    }, 100);

    return () => {
      clearInterval(initializeGoogleSignIn);
      cleanup();
    };
  }, [handleCredentialResponse]);

  return <div id="google-signin-button" className={`w-full flex justify-center ${className}`} />;
}
