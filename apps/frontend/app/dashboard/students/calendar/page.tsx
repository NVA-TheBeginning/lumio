"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  CalendarYearView,
} from "@/components/full-calendar";
import { ModeToggle } from "@/components/toggle-theme";
import { useCalendarEvents } from "../../teachers/calendar/use-calendar";

interface Project {
  id: number;
  name: string;
  color: string;
}

export default function CalendarPage() {
  const { data: events = [], isLoading, error } = useCalendarEvents();

  const projectsLegend = useMemo((): Project[] => {
    const projectMap = new Map<number, Project>();

    events.forEach((event) => {
      if (event.projectId && event.projectName && event.projectColor) {
        projectMap.set(event.projectId, {
          id: event.projectId,
          name: event.projectName,
          color: event.projectColor,
        });
      }
    });

    return Array.from(projectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [events]);

  if (isLoading) {
    return (
      <div className="h-dvh py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="mt-2 text-muted-foreground">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-dvh py-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Erreur lors du chargement du calendrier</p>
          <p className="text-muted-foreground text-sm mt-1">
            {error instanceof Error ? error.message : "Une erreur inconnue s'est produite"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Calendar events={events}>
      <div className="h-dvh py-6 flex flex-col">
        <div className="flex px-6 items-center gap-2 mb-6">
          <CalendarViewTrigger className="aria-current:bg-accent" view="day">
            Jour
          </CalendarViewTrigger>
          <CalendarViewTrigger view="week" className="aria-current:bg-accent">
            Semaine
          </CalendarViewTrigger>
          <CalendarViewTrigger view="month" className="aria-current:bg-accent">
            Mois
          </CalendarViewTrigger>
          <CalendarViewTrigger view="year" className="aria-current:bg-accent">
            Année
          </CalendarViewTrigger>

          <span className="flex-1" />

          <CalendarCurrentDate />

          <CalendarPrevTrigger>
            <ChevronLeft size={20} />
            <span className="sr-only">Précédent</span>
          </CalendarPrevTrigger>

          <CalendarTodayTrigger>Aujourd'hui</CalendarTodayTrigger>

          <CalendarNextTrigger>
            <ChevronRight size={20} />
            <span className="sr-only">Suivant</span>
          </CalendarNextTrigger>

          <ModeToggle />
        </div>

        {projectsLegend.length > 0 && (
          <div className="px-6 mb-4">
            <div className="bg-card border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">Légende des projets</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {projectsLegend.map((project) => (
                  <div key={project.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm border"
                      style={{ backgroundColor: project.color }}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-muted-foreground">{project.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto px-6 relative">
          <CalendarDayView />
          <CalendarWeekView />
          <CalendarMonthView />
          <CalendarYearView />
        </div>
      </div>
    </Calendar>
  );
}
