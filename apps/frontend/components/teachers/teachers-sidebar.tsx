"use client";

import {
  BookCheck,
  BookOpen,
  Calendar,
  FileText,
  GalleryVerticalEnd,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { isValidNumber } from "@/lib/utils";
import { NavUser, NavUserProps } from "../nav-user";

const navData = {
  navMain: [
    {
      title: "Tableau de bord",
      url: "/dashboard/teachers",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      title: "Promotions",
      url: "/dashboard/teachers/promotions",
      icon: <Users className="size-4" />,
      items: [
        {
          title: "Créer une promotion",
          url: "/dashboard/teachers/promotions/new",
        },
      ],
    },
    {
      title: "Projets",
      url: "/dashboard/teachers/projects",
      icon: <BookOpen className="size-4" />,
      items: [
        {
          title: "Créer un projet",
          url: "/dashboard/teachers/projects/new",
        },
      ],
    },
    {
      title: "Évaluations",
      url: "/dashboard/teachers/evaluations",
      icon: <BookCheck className="size-4" />,
    },
    {
      title: "Calendrier",
      url: "/dashboard/teachers/calendar",
      icon: <Calendar className="size-4" />,
    },
    {
      title: "Documents",
      url: "/dashboard/teachers/documents",
      icon: <BookOpen className="size-4" />,
    },
    {
      title: "Rapports",
      url: "/dashboard/teachers/reports",
      icon: <FileText className="size-4" />,
    },
    {
      title: "Paramètres",
      url: "/dashboard/teachers/settings",
      icon: <Settings className="size-4" />,
    },
  ],
};

export function TeachersSidebar({ user, ...props }: { user: NavUserProps } & React.ComponentProps<typeof Sidebar>) {
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
                <SidebarMenuButton asChild isActive={isActive(item.url) && (!item.items || item.items.length === 0)}>
                  <HoverPrefetchLink href={item.url} className="font-medium">
                    {item.icon}
                    {item.title}
                  </HoverPrefetchLink>
                </SidebarMenuButton>
                {isValidNumber(item.items?.length) && item.items.length > 0 ? (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={isActive(subItem.url)}>
                          <HoverPrefetchLink href={subItem.url}>{subItem.title}</HoverPrefetchLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
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
