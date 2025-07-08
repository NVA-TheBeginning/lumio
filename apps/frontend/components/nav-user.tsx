"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, Cog, LogOut, Moon, Sun, SunMoon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { clearUserCookie } from "@/lib/cookie";

export interface NavUserProps {
  firstname: string | null;
  email: string;
  role: string;
}

export function NavUser({ user }: { user: NavUserProps }) {
  const { isMobile } = useSidebar();
  const { setTheme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: clearUserCookie,
    onSuccess: () => {
      queryClient.clear();
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      console.error("Logout error:", error);
    },
  });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="grid flex-1 text-left text-sm leading-tight">
                {user.firstname && <span className="truncate font-semibold">{user.firstname}</span>}
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {user.firstname && <span className="truncate font-semibold">{user.firstname}</span>}
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push(`${user.role?.toLowerCase()}s/settings`)}>
                <Cog className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Thème</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Clair
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Sombre
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <SunMoon className="mr-2 h-4 w-4" />
                Système
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
