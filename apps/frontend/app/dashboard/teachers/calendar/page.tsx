"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function CalendarPage() {
  return (
    <Calendar
      events={[
        {
          id: "1",
          start: new Date(),
          end: new Date(Date.now() + 60 * 60 * 1000),
          title: "event A",
          color: "pink",
        },
        {
          id: "2",
          start: new Date(Date.now() + 60 * 60 * 1000),
          end: new Date(Date.now() + 2 * 60 * 60 * 1000),
          title: "event B",
          color: "blue",
        },
      ]}
    >
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
