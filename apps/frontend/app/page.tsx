import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/toggle-theme";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background border-b py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">Lumio</h1>
          </div>
          <div className="flex items-center space-x-2">
            <ModeToggle />
            <Link href={{ pathname: "/login" }}>
              <Button className="cursor-pointer">Se connecter</Button>
            </Link>
            <Link href={{ pathname: "/register" }}>
              <Button className="cursor-pointer">S'inscrire</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1 flex items-center bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Simplifiez la gestion de vos projets pédagogiques
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Lumio est une plateforme complète pour créer, suivre et évaluer les projets de programmation dans
                l'enseignement supérieur.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={{ pathname: "/register" }}>
                  <Button size="lg" className="w-full sm:w-auto">
                    Commencer gratuitement
                  </Button>
                </Link>
                <Link href={{ pathname: "/login", query: { role: "student" } }}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Voir la démo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <Image src="https://picsum.photos/500/400" alt="Lumio Interface" className="rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Une plateforme pour tous les acteurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-lg shadow-md border border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Document</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-center mb-4 text-card-foreground">Pour les professeurs</h3>
              <ul className="space-y-3 text-card-foreground">
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Document</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Création et gestion simplifiée des projets</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Document</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Suivi en temps réel de l'avancement des étudiants</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Document</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Système d'évaluation avec grilles personnalisables</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Document</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Détection automatique de plagiat</span>
                </li>
              </ul>
              <div className="mt-6 text-center">
                <Link href={{ pathname: "/login", query: { role: "professor" } }}>
                  <Button>Espace professeur</Button>
                </Link>
              </div>
            </div>

            <div className="bg-card p-8 rounded-lg shadow-md border border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Document</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-center mb-4 text-card-foreground">Pour les étudiants</h3>
              <ul className="space-y-3 text-card-foreground">
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Document</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Vue claire des projets et des échéances</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Document</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Formation et gestion des groupes de travail</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Document</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Soumission simplifiée des travaux</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Document</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Suivi des évaluations et feedback détaillé</span>
                </li>
              </ul>
              <div className="mt-6 text-center">
                <Link href={{ pathname: "/login", query: { role: "student" } }}>
                  <Button>Espace étudiant</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Fonctionnalités principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-muted p-6 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Document</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Gestion de projets</h3>
              <p className="text-muted-foreground">
                Créez et organisez facilement des projets avec des objectifs clairs, des critères d'évaluation et des
                échéances.
              </p>
            </div>
            <div className="bg-muted p-6 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Group</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Collaboration</h3>
              <p className="text-muted-foreground">
                Facilitez la formation de groupes et la communication entre étudiants et professeurs.
              </p>
            </div>
            <div className="bg-muted p-6 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Badge</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Anti-plagiat</h3>
              <p className="text-muted-foreground">
                Assurez l'intégrité académique grâce à notre système avancé de détection de plagiat.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Lumio</h3>
              <p className="text-gray-400">La solution complète pour la gestion des projets académiques.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Produit</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-gray-400 hover:text-white">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-400 hover:text-white">
                    Tarifs
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-400 hover:text-white">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Ressources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-gray-400 hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-400 hover:text-white">
                    Guides
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-400 hover:text-white">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Entreprise</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-gray-400 hover:text-white">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-400 hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-400 hover:text-white">
                    Mentions légales
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Lumio. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
