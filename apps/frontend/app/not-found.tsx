import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getUserFromCookie } from "@/lib/cookie";

export default async function NotFound() {
  const user = await getUserFromCookie();
  const redirectPath = user !== null ? `/dashboard/${user.role?.toLowerCase()}s` : "/";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-8 flex items-center justify-center">
        <div className="absolute animate-ping rounded-full bg-primary/20 p-16" />
        <div className="relative z-10 rounded-full bg-background p-6 shadow-lg">
          <Compass className="h-16 w-16 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      <h1 className="mb-2 text-6xl font-bold tracking-tighter sm:text-7xl">404</h1>

      <h2 className="mb-4 text-3xl font-semibold tracking-tight text-muted-foreground">Page introuvable</h2>

      <p className="mb-8 max-w-md text-muted-foreground">
        Il semble que la page que vous recherchez n'existe pas. Peut-être qu'elle a été supprimée ou que l'URL est
        incorrecte.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg" className="gap-2">
          <Link href={redirectPath}>
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
