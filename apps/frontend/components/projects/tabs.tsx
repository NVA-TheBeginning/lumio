"use client";

import type { ProjectType } from "@/app/dashboard/teachers/projects/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectDeliverables } from "./tabs/deliverables";
import { ProjectGroups } from "./tabs/groups";
import { ProjectOverview } from "./tabs/overview";
import { ProjectSettings } from "./tabs/settings";

interface ProjectTabsProps {
  project: ProjectType;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function ProjectTabs({ project, activeTab, setActiveTab }: ProjectTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
      <div className="container mx-auto px-4">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-10 pb-0">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 pb-2"
          >
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 pb-2"
          >
            Groupes
          </TabsTrigger>
          <TabsTrigger
            value="deliverables"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 pb-2"
          >
            Livrables
          </TabsTrigger>
          <TabsTrigger
            value="evaluations"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 pb-2"
          >
            Évaluations
          </TabsTrigger>
          <TabsTrigger
            value="presentations"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 pb-2"
          >
            Soutenances
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 pb-2"
          >
            Paramètres
          </TabsTrigger>
        </TabsList>

        <div className="py-6">
          <TabsContent value="overview" className="mt-0">
            <ProjectOverview project={project} />
          </TabsContent>

          <TabsContent value="groups" className="mt-0">
            <ProjectGroups project={project} />
          </TabsContent>

          <TabsContent value="deliverables" className="mt-0">
            <ProjectDeliverables project={project} />
          </TabsContent>

          <TabsContent value="evaluations" className="mt-0">
            <div className="text-center">
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="presentations" className="mt-0">
            <div className="text-center">
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <ProjectSettings projectId={project.id} />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
