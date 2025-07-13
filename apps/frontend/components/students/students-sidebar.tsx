"use client";

import { BookOpen, Calendar, FileText, GalleryVerticalEnd, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { NavUser, NavUserProps } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navData = {
  navMain: [
    {
      title: "Tableau de bord",
      url: "/dashboard/students",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      title: "Projets",
      url: "/dashboard/students/projects",
      icon: <BookOpen className="size-4" />,
    },
    {
      title: "Rapports",
      url: "/dashboard/students/reports",
      icon: <FileText className="size-4" />,
    },
    {
      title: "Calendrier",
      url: "/dashboard/students/calendar",
      icon: <Calendar className="size-4" />,
    },
    {
      title: "Documents",
      url: "/dashboard/students/documents",
      icon: <BookOpen className="size-4" />,
    },
    {
      title: "Paramètres",
      url: "/dashboard/students/settings",
      icon: <Settings className="size-4" />,
    },
  ],
};

export function StudentsSidebar({ user, ...props }: { user: NavUserProps } & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Lumio</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navData.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive(item.url)}>
                  <HoverPrefetchLink href={item.url} className="font-medium">
                    {item.icon}
                    {item.title}
                  </HoverPrefetchLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            firstname: user.firstname,
            email: user.email,
            role: user.role,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
