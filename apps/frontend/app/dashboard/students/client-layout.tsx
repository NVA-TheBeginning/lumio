"use client";

import { usePathname } from "next/navigation";
import React from "react";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { NavUserProps } from "@/components/nav-user";
import { StudentsSidebar } from "@/components/students/students-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface IBreadcrumbItem {
  label: string;
  path: string;
  visible?: boolean;
}

interface DashboardClientLayoutProps {
  user: NavUserProps;
  children: React.ReactNode;
}

export default function DashboardClientLayout({ user, children }: DashboardClientLayoutProps) {
  const pathname = usePathname();

  const getBreadcrumbs = (): IBreadcrumbItem[] => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: IBreadcrumbItem[] = [];

    breadcrumbs.push({
      label: "Dashboard",
      path: "/dashboard",
      visible: false,
    });

    let currentPath = "/dashboard";
    for (let i = 1; i < paths.length; i++) {
      currentPath += `/${paths[i] ?? ""}`;
      const pathSegment = paths[i] ?? "";
      breadcrumbs.push({
        label: pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1),
        path: currentPath,
        visible: true,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const visibleBreadcrumbs = breadcrumbs.filter((crumb) => crumb.visible !== false);

  return (
    <SidebarProvider>
      <StudentsSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {visibleBreadcrumbs.map((crumb, index) => (
                  <React.Fragment key={`${crumb.path}-${index}`}>
                    {index < visibleBreadcrumbs.length - 1 ? (
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <HoverPrefetchLink href={crumb.path}>{crumb.label}</HoverPrefetchLink>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    ) : (
                      <BreadcrumbItem>
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      </BreadcrumbItem>
                    )}
                    {index < visibleBreadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
