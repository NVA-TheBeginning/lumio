"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectHeader } from "@/components/projects/header";
import { ProjectTabs } from "@/components/projects/tabs";

export default function ProjectDetailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const isLoading = false;

  const projectData = {
    id: 1,
    name: "Développement d'une application web",
    description:
      "Les étudiants devront concevoir et développer une application web complète en utilisant les technologies modernes. Le projet comprendra une phase d'analyse, de conception, de développement et de présentation.",
    creatorId: 101,
    createdAt: "2023-09-15T10:30:00Z",
    updatedAt: "2023-10-20T14:45:00Z",
    deletedAt: null,
    status: "visible",
    promotions: [
      {
        id: 1,
        name: "Master 2 Informatique",
        description: "Promotion 2023-2024",
        status: "visible",
        groupSettings: {
          minMembers: 3,
          maxMembers: 5,
          mode: "FREE",
          deadline: "2023-11-30T23:59:59Z",
        },
        groups: [
          {
            id: 1,
            name: "Équipe Alpha",
            members: [
              { id: 101, name: "Jean Dupont" },
              { id: 102, name: "Marie Martin" },
              { id: 103, name: "Lucas Bernard" },
            ],
          },
          {
            id: 2,
            name: "Équipe Beta",
            members: [
              { id: 104, name: "Sophie Petit" },
              { id: 105, name: "Thomas Grand" },
              { id: 106, name: "Emma Leroy" },
              { id: 107, name: "Hugo Moreau" },
            ],
          },
        ],
      },
      {
        id: 2,
        name: "Licence 3 Informatique",
        description: "Promotion 2023-2024",
        status: "visible",
        groupSettings: {
          minMembers: 2,
          maxMembers: 4,
          mode: "MANUAL",
          deadline: "2023-12-15T23:59:59Z",
        },
        groups: [
          {
            id: 3,
            name: "Équipe Gamma",
            members: [
              { id: 108, name: "Léa Dubois" },
              { id: 109, name: "Nathan Blanc" },
            ],
          },
        ],
      },
    ],
    deliverables: [
      {
        id: 1,
        title: "Cahier des charges",
        description: "Document détaillant les spécifications du projet",
        deadline: "2023-10-15T23:59:59Z",
        status: "completed",
        promotionId: 1,
        submissions: [
          { groupId: 1, status: "submitted", submittedAt: "2023-10-14T14:30:00Z", grade: 16 },
          { groupId: 2, status: "submitted", submittedAt: "2023-10-15T22:45:00Z", grade: 14 },
        ],
      },
      {
        id: 2,
        title: "Maquettes et wireframes",
        description: "Présentation des maquettes de l'interface utilisateur",
        deadline: "2023-11-05T23:59:59Z",
        status: "active",
        promotionId: 1,
        submissions: [
          { groupId: 1, status: "submitted", submittedAt: "2023-11-03T18:20:00Z", grade: null },
          { groupId: 2, status: "pending", submittedAt: null, grade: null },
        ],
      },
      {
        id: 3,
        title: "Prototype fonctionnel",
        description: "Première version fonctionnelle de l'application",
        deadline: "2023-12-10T23:59:59Z",
        status: "upcoming",
        promotionId: 1,
        submissions: [],
      },
      {
        id: 4,
        title: "Analyse des besoins",
        description: "Document d'analyse des besoins pour le projet",
        deadline: "2023-10-30T23:59:59Z",
        status: "completed",
        promotionId: 2,
        submissions: [{ groupId: 3, status: "submitted", submittedAt: "2023-10-28T16:45:00Z", grade: 15 }],
      },
      {
        id: 5,
        title: "Conception de l'architecture",
        description: "Document décrivant l'architecture technique du projet",
        deadline: "2023-11-20T23:59:59Z",
        status: "active",
        promotionId: 2,
        submissions: [],
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Chargement du projet...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProjectHeader project={projectData} router={router} />
      <ProjectTabs project={projectData} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
