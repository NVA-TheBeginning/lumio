import { useQuery } from "@tanstack/react-query";
import { ActivityItem, DashboardStatistics, UserRole } from "@/lib/types/dashboard";
import { authFetchData } from "@/lib/utils";

const API_URL = process.env.API_URL ?? "https://lumio-gateway.jayllyz.fr";

async function fetchDashboardStatistics(userId: number, userRole: UserRole): Promise<DashboardStatistics> {
  return authFetchData<DashboardStatistics>(`${API_URL}/dashboard/statistics?userId=${userId}&userRole=${userRole}`);
}

async function fetchRecentActivity(userId: number, userRole: UserRole, limit = 10): Promise<ActivityItem[]> {
  return authFetchData<ActivityItem[]>(
    `${API_URL}/dashboard/activity?userId=${userId}&userRole=${userRole}&limit=${limit}`,
  );
}

export function useDashboardStatistics(userId: number, userRole: UserRole) {
  return useQuery({
    queryKey: ["dashboard", "statistics", userId, userRole],
    queryFn: () => fetchDashboardStatistics(userId, userRole),
    enabled: Boolean(userId && userRole),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

export function useRecentActivity(userId: number, userRole: UserRole, limit = 10) {
  return useQuery({
    queryKey: ["dashboard", "activity", userId, userRole, limit],
    queryFn: () => fetchRecentActivity(userId, userRole, limit),
    enabled: Boolean(userId && userRole),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
