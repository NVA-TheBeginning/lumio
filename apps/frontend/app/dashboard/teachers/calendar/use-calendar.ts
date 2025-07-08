"use client";
import { useQuery } from "@tanstack/react-query";
import type { CalendarEvent } from "@/components/full-calendar";
import { CalendarParams, CalendarPromotion, getCalendarDeliverables, getPromotions } from "./actions";

function transformToCalendarEvents(promotions: CalendarPromotion[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  const colorVariants = ["blue", "green", "pink", "purple"] as const;

  const colorPalette = [
    "#3b82f6",
    "#10b981",
    "#ec4899",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#84cc16",
  ] as const;

  try {
    promotions.forEach((promotion, promotionIndex) => {
      promotion.projects.forEach((project, projectIndex) => {
        project.deliverables.forEach((deliverable) => {
          const deadlineDate = new Date(deliverable.deadline);

          if (Number.isNaN(deadlineDate.getTime())) {
            console.warn(`Invalid date for deliverable ${deliverable.id}: ${deliverable.deadline}`);
            return;
          }

          const colorIndex = (promotionIndex * promotion.projects.length + projectIndex) % colorPalette.length;
          const hexColor = colorPalette[colorIndex];
          const variantColor = colorVariants[colorIndex % colorVariants.length];

          const title = deliverable.name.length > 30 ? `${deliverable.name.substring(0, 27)}...` : deliverable.name;

          events.push({
            id: `deliverable-${deliverable.id}-${project.projectId}-${promotion.promotionId}`,
            start: deadlineDate,
            end: deadlineDate,
            title: title,
            color: variantColor,

            allDay: true,
            projectId: project.projectId,
            projectName: project.projectName || `Project ${project.projectId}`,
            projectColor: hexColor,
            promotionId: promotion.promotionId,
            promotionName: promotion.promotionName || `Promotion ${promotion.promotionId}`,
            deliverableId: deliverable.id,
            deadline: deliverable.deadline,
            description: `${project.projectName || "Project"} - ${deliverable.name}`,
          });
        });
      });
    });
  } catch (error) {
    console.error("Error transforming calendar events:", error);
    throw new Error("Failed to transform calendar events");
  }

  return events;
}

export function useCalendarDeliverables(params?: CalendarParams) {
  return useQuery({
    queryKey: ["calendar-deliverables", params],
    queryFn: () => getCalendarDeliverables(params),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useCalendarEvents(params?: CalendarParams) {
  return useQuery({
    queryKey: ["calendar-events", params],
    queryFn: async () => {
      try {
        const promotions = await getCalendarDeliverables(params);

        if (!promotions) {
          return [];
        }

        if (!Array.isArray(promotions)) {
          return [];
        }

        if (promotions.length === 0) {
          console.info("No promotions found");
          return [];
        }

        const validPromotions = promotions.filter((promotion) => {
          if (!promotion || typeof promotion !== "object") {
            return false;
          }

          if (!Array.isArray(promotion.projects)) {
            return false;
          }

          return true;
        });

        if (validPromotions.length === 0) {
          return [];
        }

        const events = transformToCalendarEvents(validPromotions);

        return events;
      } catch (error) {
        console.error("Error fetching calendar events:", error);

        throw new Error(`Failed to fetch calendar events: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
  });
}

export function usePromotions() {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: getPromotions,
  });
}
