"use client";

interface Project {
  id: number;
  title: string;
  description: string;
  promotions: string[];
  date: string;
  status: "visible" | "draft" | "hidden";
}

const mockProjects: Project[] = [
  {
    id: 1,
    title: "Application Web pour Bibliothèque",
    description: "Développement d'une application de gestion pour bibliothèques universitaires",
    promotions: ["Master 2 Informatique", "Licence 3 Informatique"],
    date: "2025-03-15",
    status: "visible",
  },
  {
    id: 2,
    title: "Plateforme de Cours en Ligne",
    description: "Création d'une plateforme e-learning avec système de quiz interactifs",
    promotions: ["Licence 3 Informatique"],
    date: "2025-02-10",
    status: "visible",
  },
  {
    id: 3,
    title: "Application Mobile de Suivi Sportif",
    description: "Application native pour suivre les performances sportives des étudiants",
    promotions: ["Master 1 STAPS", "Master 2 Informatique"],
    date: "2025-01-20",
    status: "draft",
  },
  {
    id: 4,
    title: "Système de Gestion d'Emploi du Temps",
    description: "Application pour gérer les horaires et les salles de cours",
    promotions: ["Master 2 Informatique"],
    date: "2024-12-05",
    status: "visible",
  },
  {
    id: 5,
    title: "Plateforme de Stage",
    description: "Portail web pour gérer les offres et candidatures de stage",
    promotions: ["Licence 3 Informatique", "Master 1 STAPS"],
    date: "2024-11-22",
    status: "visible",
  },
  {
    id: 6,
    title: "Application d'Analyse de Données Sportives",
    description: "Outil d'analyse statistique pour les performances sportives",
    promotions: ["Master 1 STAPS"],
    date: "2024-10-15",
    status: "hidden",
  },
  {
    id: 7,
    title: "Système de Réservation de Salles",
    description: "Application permettant la réservation de salles de cours et de réunion",
    promotions: ["Licence 3 Informatique"],
    date: "2024-09-18",
    status: "hidden",
  },
  {
    id: 8,
    title: "Plateforme d'Échange Étudiant",
    description: "Réseau social interne pour les étudiants de l'université",
    promotions: ["Master 1 STAPS", "Master 2 Informatique"],
    date: "2024-08-30",
    status: "visible",
  },
  {
    id: 9,
    title: "Application de Gestion de Projets Étudiants",
    description: "Outil collaboratif pour la gestion de projets académiques",
    promotions: ["Master 2 Informatique"],
    date: "2024-07-25",
    status: "draft",
  },
];

export const getAllProjects = async (): Promise<{ projects: Project[]; promotions: string[] }> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    projects: mockProjects,
    promotions: Array.from(new Set(mockProjects.flatMap((project) => project.promotions))),
  };
};
